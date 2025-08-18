import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentEntity, PaymentStatus } from './entities/payment.entity';
import { WalletEntity, WalletStatus } from './entities/wallet.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { CryptomusPaymentResponse, CryptomusPaymentServicesResponse } from './interfaces/cryptomus-api.interface';
import { CryptomusApiService } from './helper/cryptomus-api-service';
import { User, UserRole } from '../users/entities/user.entity';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { v4 as uuidv4 } from 'uuid';
import { TestWalletWebhookDto } from './dto/test-webhook.dto';
import { TransactionService } from '../transaction/transaction.service';
import { TransactionType, PaymentMethod, TransactionStatus, Transaction } from '../transaction/entities/transaction.entity';

@Injectable()
export class CryptomusService {
  private readonly logger = new Logger(CryptomusService.name);
  private readonly baseUrl = 'https://api.cryptomus.com/v1';

  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(WalletEntity)
    private walletRepository: Repository<WalletEntity>,

    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,


    private configService: ConfigService,
    private cryptomusApiService: CryptomusApiService,
  ) { }

  async createWallet(createWalletDto: CreateWalletDto, user: User): Promise<WalletEntity> {
    try {
      // check if wallet already exists
      const existingWallet = await this.walletRepository.findOne({ where: { owner: { id: user.id }, deleted_at: IsNull() } });
      if (existingWallet) {
        throw new BadRequestException('Wallet already exists');
      }

      // create wallet in database
      const wallet = this.walletRepository.create({
        ...createWalletDto,
        owner: user,
      });

      await wallet.save()

      // create wallet in cryptomus
      const cryptomus_wallet = await this.cryptomusApiService.createWallet({
        currency: createWalletDto.currency,
        network: createWalletDto.network,
        orderId: wallet.id,
        from_referral_code: createWalletDto.from_referral_code,
      });
      console.log("🚀 ~ CryptomusService ~ createWallet ~ cryptomus_wallet:", cryptomus_wallet)

      // const cryptomus_wallet = {
      //   result: {
      //     id: uuidv4(),
      //     uuid: uuidv4(),
      //     address: uuidv4(),
      //     network: createWalletDto.network,
      //     currency: createWalletDto.currency,
      //     url: 'https://cryptomus.com/wallet/123',
      //     balance: 100,
      //   }
      // }

      wallet.cryptomus_wallet_id = cryptomus_wallet.result.wallet_uuid;
      wallet.cryptomus_wallet_uuid = cryptomus_wallet.result.uuid;
      wallet.cryptomus_wallet_address = cryptomus_wallet.result.address;
      wallet.cryptomus_wallet_order_id = cryptomus_wallet.result.order_id;
      wallet.network = cryptomus_wallet.result.network;
      wallet.currency = cryptomus_wallet.result.currency;
      wallet.url = cryptomus_wallet.result.url;
      wallet.status = WalletStatus.ACTIVE;
      wallet.balance = cryptomus_wallet.result.balance;

      return await wallet.save();
    } catch (error) {
      throw new BadRequestException(error?.response?.data?.message ?? error.message);
    }
  }

  async getMyWallet(user: User): Promise<WalletEntity> {
    const wallet = await this.walletRepository.findOne({ where: { owner: { id: user.id } } });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  async getWalletById(paramIdDto: ParamIdDto, user: User): Promise<WalletEntity> {
    let wallet: WalletEntity | null = null
    if ([UserRole.ANONYMOUS, UserRole.CUSTOMER].includes(user.role)) {
      wallet = await this.walletRepository.findOne({ where: { id: paramIdDto.id, owner: { id: user.id } } });
    } else {
      wallet = await this.walletRepository.findOne({ where: { id: paramIdDto.id } });
    }
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

  async createPayment(createPaymentDto: CreatePaymentDto,): Promise<PaymentEntity> {
    // Find available wallet
    let wallet: WalletEntity | null;

    if (createPaymentDto.walletId) {
      wallet = await this.walletRepository.findOne({ where: { id: createPaymentDto.walletId } });
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

  async getPaymentById(paramIdDto: ParamIdDto, user?: User): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paramIdDto.id, wallet: { owner: { id: user?.id } } },
      relations: ['wallet']
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async getPaymentByOrderId(paramIdDto: ParamIdDto, user: User): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findOne({
      where: { orderId: paramIdDto.id, wallet: { owner: { id: user.id } } },
      relations: ['wallet']
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async updatePaymentStatus(paymentId: string, status: PaymentStatus, txHash?: string): Promise<PaymentEntity> {
    const payment = await this.getPaymentById({ id: paymentId },);

    payment.status = status;
    if (txHash) {
      payment.txHash = txHash;
    }
    if (status === PaymentStatus.PAID) {
      payment.paidAt = new Date();
    }

    return await this.paymentRepository.save(payment);
  }

  async processWebhook(webhookData: any, signature?: string): Promise<void> {
    // Verify webhook signature
    // if (!this.verifyWebhookSignature(webhookData, signature)) {
    //   throw new BadRequestException('Invalid webhook signature');
    // }

    // Extract data from webhook payload
    const { order_id, status, txid, amount, currency, network, from, uuid } = webhookData;

    const wallet = await this.walletRepository.findOne({ where: { cryptomus_wallet_uuid: uuid }, relations: { owner: true } });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
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

    // Create transaction record
    try {
      const transaction = this.transactionRepository.create({
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        transaction_type: TransactionType.DEPOSIT,
        status: newStatus === PaymentStatus.PAID ? TransactionStatus.COMPLETED :
          newStatus === PaymentStatus.FAILED ? TransactionStatus.FAILED :
            TransactionStatus.PENDING,
        payment_method: PaymentMethod.CRYPTO,
        user: wallet.owner,
        wallet: wallet,
        metadata: {
          cryptomus_uuid: uuid,
          network: network,
          from_address: from,
          webhook_data: webhookData,
          payment_transaction_id: uuid,
          gateway_transaction_id: txid,
          description: `Cryptomus payment for order ${order_id}`,
          order: order_id
        }
      });
      await transaction.save()
      console.log("🚀 ~ CryptomusService ~ processWebhook ~ transaction:", transaction)
      this.logger.log(`Transaction created for payment ${order_id}`);
    } catch (error) {
      this.logger.error(`Failed to create transaction for payment ${order_id}:`, error);
    }

    // Update wallet balance if payment is successful
    if (newStatus === PaymentStatus.PAID && wallet) {
      await this.updateWalletBalance(wallet.id, parseFloat(amount));
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

  /**
   * Get list of available payment services
   * @returns Promise<CryptomusPaymentServicesResponse>
   */
  async getPaymentServices(): Promise<CryptomusPaymentServicesResponse> {
    try {
      this.logger.log('Fetching available payment services from Cryptomus');

      const response = await this.cryptomusApiService.getPaymentServices();

      this.logger.log(`Successfully fetched ${response.result?.length || 0} payment services`);
      return response;
    } catch (error) {
      this.logger.error('Failed to fetch payment services from Cryptomus', error);
      throw new BadRequestException('Failed to fetch payment services');
    }
  }

  /**
   * Test wallet webhook
   * @param options Test webhook options
   * @returns Promise<any>
   */
  async testWalletWebhook(options: any, user: User): Promise<any> {
    try {
      this.logger.log('Testing wallet webhook with Cryptomus');
      const wallet = await this.walletRepository.findOne({ where: { owner: { id: user.id } } });
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }
      const response = await this.cryptomusApiService.testWalletWebhook({
        urlCallback: this.configService.get<string>("CRYPTOMUS_CALLBACK_URL") || "",
        currency: wallet.currency,
        network: wallet.network,
        uuid: wallet.cryptomus_wallet_uuid,
        status: 'paid'
      });

      this.logger.log('Wallet webhook test completed successfully');
      return response;
    } catch (error) {
      this.logger.error('Failed to test wallet webhook with Cryptomus', error);
      throw new BadRequestException('Failed to test wallet webhook');
    }
  }

  /**
   * Test payment webhook
   * @param options Test webhook options
   * @returns Promise<any>
   */
  async testPaymentWebhook(options: {
    uuid?: string;
    orderId: string;
    urlCallback: string;
    currency: string;
    network: string;
    status?: string;
  }): Promise<any> {
    try {
      this.logger.log('Testing payment webhook with Cryptomus');

      const response = await this.cryptomusApiService.testPaymentWebhook({
        uuid: options.uuid,
        orderId: options.orderId,
        urlCallback: options.urlCallback,
        currency: options.currency,
        network: options.network,
        status: options.status || 'paid'
      });

      this.logger.log('Payment webhook test completed successfully');
      return response;
    } catch (error) {
      this.logger.error('Failed to test payment webhook with Cryptomus', error);
      throw new BadRequestException('Failed to test payment webhook');
    }
  }
}
