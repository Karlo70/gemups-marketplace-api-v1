import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentEntity, PaymentStatus } from './entities/payment.entity';
import { WalletEntity, WalletStatus } from './entities/wallet.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { CryptomusPaymentResponse } from './interfaces/cryptomus-api.interface';
import { CryptomusApiService } from './helper/cryptomus-api-service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CryptomusService {
  private readonly logger = new Logger(CryptomusService.name);
  private readonly baseUrl = 'https://api.cryptomus.com/v1';

  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(WalletEntity)
    private walletRepository: Repository<WalletEntity>,
    private configService: ConfigService,
    private cryptomusApiService: CryptomusApiService,
  ) { }

  async createWallet(createWalletDto: CreateWalletDto, user: User): Promise<WalletEntity> {
    console.log("🚀 ~ CryptomusService ~ createWallet ~ user:", user)
    try {
      // check if wallet already exists
      const existingWallet = await this.walletRepository.findOne({ where: { owner: { id: user.id } } });
      if (existingWallet) {
        throw new BadRequestException('Wallet already exists');
      }
  
      // create wallet in database
      const wallet = this.walletRepository.create({
        ...createWalletDto,
        owner: user,
      });
  
      // create wallet in cryptomus
      // const cryptomus_wallet = await this.cryptomusApiService.createWallet({
      //   currency: createWalletDto.currency,
      //   network: createWalletDto.network,
      //   orderId: wallet.id,
      //   from_referral_code: createWalletDto.from_referral_code,
      // });
  
      const cryptomus_wallet = {
        result: {
        id: '123',
        uuid: '123',
        address: '123',
        network: createWalletDto.network,
        currency: createWalletDto.currency,
        url: 'https://cryptomus.com/wallet/123',
        }
      }

      wallet.cryptomus_wallet_id = cryptomus_wallet.result.id;
      wallet.cryptomus_wallet_uuid = cryptomus_wallet.result.uuid;
      wallet.cryptomus_wallet_address = cryptomus_wallet.result.address;
      wallet.network = cryptomus_wallet.result.network;
      wallet.currency = cryptomus_wallet.result.currency;
      wallet.url = cryptomus_wallet.result.url;
      wallet.status = WalletStatus.ACTIVE;
  
      return await wallet.save();
    } catch (error) {
      throw new BadRequestException(error?.response?.data?.message ?? error.message);
    }
  }

  async getWalletById(id: string): Promise<WalletEntity> {
    const wallet = await this.walletRepository.findOne({ where: { id } });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  async getActiveWallets(): Promise<WalletEntity[]> {
    return await this.walletRepository.find({
      where: { status: WalletStatus.ACTIVE },
      order: { created_at: 'DESC' },
    });
  }

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<PaymentEntity> {
    // Find available wallet
    let wallet: WalletEntity | null;

    if (createPaymentDto.walletId) {
      wallet = await this.getWalletById(createPaymentDto.walletId);
    } else {
      wallet = await this.findAvailableWallet(createPaymentDto.currency, createPaymentDto.preferredNetwork);
    }

    if (!wallet) {
      throw new BadRequestException('No available wallet found for the specified currency/network');
    }

    // Create payment record
    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      wallet: wallet,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    try {
      // Create payment in Cryptomus
      const cryptomusPayment = await this.createCryptomusPayment(savedPayment, wallet);

      // Update payment with Cryptomus data
      savedPayment.cryptomusPaymentId = cryptomusPayment.result.uuid;
      savedPayment.walletAddress = cryptomusPayment.result.address;
      savedPayment.network = cryptomusPayment.result.network;
      savedPayment.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      return await this.paymentRepository.save(savedPayment);
    } catch (error) {
      // Delete payment if Cryptomus creation fails
      await this.paymentRepository.remove(savedPayment);
      throw error;
    }
  }

  async getPaymentById(id: string): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['wallet']
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async getPaymentByOrderId(orderId: string): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findOne({
      where: { orderId },
      relations: ['wallet']
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async updatePaymentStatus(paymentId: string, status: PaymentStatus, txHash?: string): Promise<PaymentEntity> {
    const payment = await this.getPaymentById(paymentId);

    payment.status = status;
    if (txHash) {
      payment.txHash = txHash;
    }
    if (status === PaymentStatus.PAID) {
      payment.paidAt = new Date();
    }

    return await this.paymentRepository.save(payment);
  }

  async processWebhook(webhookData: any, signature: string): Promise<void> {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(webhookData, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const { orderId, status, txHash, network, walletAddress } = webhookData;

    const payment = await this.paymentRepository.findOne({ where: { orderId } });
    if (!payment) {
      this.logger.warn(`Payment not found for orderId: ${orderId}`);
      return;
    }

    // Update payment status based on webhook
    let newStatus: PaymentStatus;
    switch (status) {
      case 'paid':
        newStatus = PaymentStatus.PAID;
        break;
      case 'failed':
        newStatus = PaymentStatus.FAILED;
        break;
      case 'expired':
        newStatus = PaymentStatus.EXPIRED;
        break;
      default:
        newStatus = PaymentStatus.PENDING;
    }

    await this.updatePaymentStatus(payment.id, newStatus, txHash);

    // Update wallet balance if payment is successful
    if (newStatus === PaymentStatus.PAID && payment.wallet) {
      await this.updateWalletBalance(payment.wallet.id, payment.amount);
    }
  }

  private async findAvailableWallet(currency: string, preferredNetwork?: string): Promise<WalletEntity | null> {
    const whereClause: any = {
      status: WalletStatus.ACTIVE,
      currency: currency.toUpperCase(),
    };

    if (preferredNetwork) {
      whereClause.network = preferredNetwork;
    }

    return await this.walletRepository.findOne({ where: whereClause });
  }

  private async createCryptomusPayment(payment: PaymentEntity, wallet: WalletEntity): Promise<CryptomusPaymentResponse> {
    // const apiKey = wallet.apiKey || this.configService.get('CRYPTOMUS_API_KEY');
    // const merchantId = wallet.merchantId;

    // if (!apiKey || !merchantId) {
    //   throw new BadRequestException('Missing Cryptomus API credentials');
    // }

    return await this.cryptomusApiService.createPayment({
      amount: Number(payment.amount.toFixed(2)),
      currency: payment.currency,
      orderId: payment.orderId,
      network: wallet.network,
      returnUrl: payment.returnUrl,
      callbackUrl: payment.callbackUrl,
      lifetime: 3600,
      toCurrency: payment.currency,
      successUrl: payment.returnUrl,
    });
  }

  // TODO: remove this method
  // private generateSignature(payload: any, apiKey: string): string {
  //   const jsonString = JSON.stringify(payload);
  //   return crypto.createHmac('sha512', apiKey).update(jsonString).digest('hex');
  // }

  private verifyWebhookSignature(payload: any, signature: string): boolean {
    const webhookSecret = this.configService.get('CRYPTOMUS_WEBHOOK_SECRET');
    if (!webhookSecret) {
      this.logger.warn('Webhook secret not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha512', webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  private async updateWalletBalance(walletId: string, amount: number): Promise<void> {
    await this.walletRepository
      .createQueryBuilder()
      .update(WalletEntity)
      .set({
        balance: () => `balance + ${amount}`,
        last_activity: new Date(),
      })
      .where('id = :id', { id: walletId })
      .execute();
  }
}
