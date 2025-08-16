import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as  crypto from 'crypto';

@Injectable()
export class CryptomusApiService {
  private readonly logger = new Logger(CryptomusApiService.name);
  private readonly apiUrl = 'https://api.cryptomus.com/v1';

  constructor(
    private readonly configService: ConfigService,
  ) { }

  private getMerchantId(): string {
    return this.configService.get<string>('CRYPTOMUS_MERCHANT_ID') || '';
  }

  private getPaymentKey(): string {
    return this.configService.get<string>('CRYPTOMUS_API_KEY') || '';
  }

  createSignature(payload: any): string {
    const data = Buffer.from(JSON.stringify(payload)).toString('base64');
    return crypto.createHash('md5').update(data + this.getPaymentKey()).digest('hex');
  }

  async createPayment(options: {
    orderId: string;
    amount: number;
    currency?: string;
    network?: string;
    callbackUrl: string;
    returnUrl: string;
    lifetime?: number;
    toCurrency?: string;
    successUrl?: string;
  }): Promise<any> {
    const payload = {
      merchant_id: this.getMerchantId(),
      order_id: options.orderId,
      amount: options.amount,
      currency: options.currency || 'USD',
      network: options.network || 'ETH',
      url_callback: this.configService.get<string>('CRYPTOMUS_CALLBACK_URL'),
      url_return: options.returnUrl,
      url_success: options.successUrl,
      is_payment_multiple: false,
      lifetime: options.lifetime || 3600,
      to_currency: options.toCurrency || 'ETH'
    };

    const sign = this.createSignature(payload);

    try {
      const response = await axios.post(`${this.apiUrl}/payment`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'merchant': this.getMerchantId(),
          'sign': sign
        }
      });
      return response.data;
    } catch (error) {
      this.logger.error('Error creating payment', error?.response?.data || error.message);
      throw error;
    }
  }

  async createWallet(options: {
    currency: string;
    network: string;
    orderId: string;
    from_referral_code?: string;
  }): Promise<any> {
    const payload = {
      currency: options.currency,
      network: options.network,
      order_id: options.orderId,
      url_callback: this.configService.get<string>('CRYPTOMUS_CALLBACK_URL'),
      ...(options.from_referral_code && { from_referral_code: options.from_referral_code }),
    };

    const sign = this.createSignature(payload);

    try {
      const response = await axios.post(`${this.apiUrl}/wallet`, payload, {
        headers: {
          'merchant': this.getMerchantId(),
          'sign': sign,
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      this.logger.error('Error creating wallet', error?.response?.data.message ?? error.message);
      throw error;
    }
  }

  async getPaymentStatus(orderId: string): Promise<any> {
    const payload = {
      order_id: orderId
    };

    const sign = this.createSignature(payload);

    try {
      const response = await axios.post(`${this.apiUrl}/payment/info`, payload, {
        headers: {
          'merchant': this.getMerchantId(),
          'sign': sign,
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      this.logger.error('Error getting payment status', error?.response?.data || error.message);
      throw error;
    }
  }

  async generateWalletQR(walletAddressUuid: string): Promise<any> {
    const payload = {
      wallet_address_uuid: walletAddressUuid
    };

    const sign = this.createSignature(payload);

    try {
      const response = await axios.post(`${this.apiUrl}/wallet/qr`, payload, {
        headers: {
          'merchant': this.getMerchantId(),
          'sign': sign,
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      this.logger.error('Error generating wallet QR code', error?.response?.data || error.message);
      throw error;
    }
  }

  async generatePaymentQR(merchantPaymentUuid: string): Promise<any> {
    const payload = {
      merchant_payment_uuid: merchantPaymentUuid
    };

    const sign = this.createSignature(payload);

    try {
      const response = await axios.post(`${this.apiUrl}/payment/qr`, payload, {
        headers: {
          'merchant': this.getMerchantId(),
          'sign': sign,
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      this.logger.error('Error generating payment QR code', error?.response?.data || error.message);
      throw error;
    }
  }

  async blockWallet(options: { uuid?: string; orderId?: string; isForceRefund?: boolean }): Promise<any> {
    const payload: any = {};

    if (options.uuid) {
      payload.uuid = options.uuid;
    } else if (options.orderId) {
      payload.order_id = options.orderId;
    } else {
      throw new Error('Either uuid or orderId must be provided');
    }

    if (options.isForceRefund !== undefined) {
      payload.is_force_refund = options.isForceRefund;
    }

    const sign = this.createSignature(payload);

    try {
      const response = await axios.post(`${this.apiUrl}/wallet/block-address`, payload, {
        headers: {
          'merchant': this.getMerchantId(),
          'sign': sign,
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      this.logger.error('Error blocking wallet', error?.response?.data || error.message);
      throw error;
    }
  }

  async getPaymentInfo(options: { uuid?: string; orderId?: string }): Promise<any> {
    const payload: any = {};

    if (options.uuid) {
      payload.uuid = options.uuid;
    } else if (options.orderId) {
      payload.order_id = options.orderId;
    } else {
      throw new Error('Either uuid or orderId must be provided');
    }

    const sign = this.createSignature(payload);

    try {
      const response = await axios.post(`${this.apiUrl}/payment/info`, payload, {
        headers: {
          'merchant': this.getMerchantId(),
          'sign': sign,
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      this.logger.error('Error getting payment info', error?.response?.data || error.message);
      throw error;
    }
  }

  async refundPayment(options: {
    address: string;
    isSubtract: boolean;
    uuid?: string;
    orderId?: string;
  }): Promise<any> {
    const payload: any = {
      address: options.address,
      is_subtract: options.isSubtract
    };

    if (options.uuid) {
      payload.uuid = options.uuid;
    } else if (options.orderId) {
      payload.order_id = options.orderId;
    } else {
      throw new Error('Either uuid or orderId must be provided');
    }

    const sign = this.createSignature(payload);

    try {
      const response = await axios.post(`${this.apiUrl}/payment/refund`, payload, {
        headers: {
          'merchant': this.getMerchantId(),
          'sign': sign,
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      this.logger.error('Error refunding payment', error?.response?.data || error.message);
      throw error;
    }
  }

  async resendWebhook(options: { uuid?: string; orderId?: string }): Promise<any> {
    const payload: any = {};

    if (options.uuid) {
      payload.uuid = options.uuid;
    } else if (options.orderId) {
      payload.order_id = options.orderId;
    } else {
      throw new Error('Either uuid or orderId must be provided');
    }

    const sign = this.createSignature(payload);

    try {
      const response = await axios.post(`${this.apiUrl}/payment/resend`, payload, {
        headers: {
          'merchant': this.getMerchantId(),
          'sign': sign,
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      this.logger.error('Error resending webhook', error?.response?.data || error.message);
      throw error;
    }
  }

  async testPaymentWebhook(options: {
    urlCallback: string;
    currency: string;
    network: string;
    uuid?: string;
    orderId?: string;
    status?: string;
  }): Promise<any> {
    const payload: any = {
      url_callback: options.urlCallback,
      currency: options.currency,
      network: options.network,
      status: options.status || 'paid'
    };

    if (options.uuid) {
      payload.uuid = options.uuid;
    }
    if (options.orderId) {
      payload.order_id = options.orderId;
    }

    const sign = this.createSignature(payload);

    try {
      const response = await axios.post(`${this.apiUrl}/test-webhook/payment`, payload, {
        headers: {
          'merchant': this.getMerchantId(),
          'sign': sign,
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      this.logger.error('Error testing payment webhook', error?.response?.data || error.message);
      throw error;
    }
  }

  async testPayoutWebhook(options: {
    urlCallback: string;
    currency: string;
    network: string;
    uuid?: string;
    orderId?: string;
    status?: string;
  }): Promise<any> {
    const payload: any = {
      url_callback: options.urlCallback,
      currency: options.currency,
      network: options.network,
      status: options.status || 'paid'
    };

    if (options.uuid) {
      payload.uuid = options.uuid;
    }
    if (options.orderId) {
      payload.order_id = options.orderId;
    }

    const sign = this.createSignature(payload);

    try {
      const response = await axios.post(`${this.apiUrl}/test-webhook/payout`, payload, {
        headers: {
          'merchant': this.getMerchantId(),
          'sign': sign,
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      this.logger.error('Error testing payout webhook', error?.response?.data || error.message);
      throw error;
    }
  }

  async testWalletWebhook(options: {
    urlCallback: string;
    currency: string;
    network: string;
    uuid?: string;
    orderId?: string;
    status?: string;
  }): Promise<any> {
    const payload: any = {
      url_callback: options.urlCallback,
      currency: options.currency,
      network: options.network,
      status: options.status || 'paid'
    };

    if (options.uuid) {
      payload.uuid = options.uuid;
    }
    if (options.orderId) {
      payload.order_id = options.orderId;
    }

    const sign = this.createSignature(payload);

    try {
      const response = await axios.post(`${this.apiUrl}/test-webhook/wallet`, payload, {
        headers: {
          'merchant': this.getMerchantId(),
          'sign': sign,
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      this.logger.error('Error testing wallet webhook', error?.response?.data || error.message);
      throw error;
    }
  }

  async getPaymentServices(): Promise<any> {
    const payload = {};

    const sign = this.createSignature(payload);

    try {
      const response = await axios.post(`${this.apiUrl}/payment/services`, payload, {
        headers: {
          'merchant': this.getMerchantId(),
          'sign': sign,
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      this.logger.error('Error getting payment services', error?.response?.data || error.message);
      throw error;
    }
  }

  async getPaymentHistory(options: { dateFrom?: string; dateTo?: string } = {}): Promise<any> {
    const payload: any = {};

    if (options.dateFrom) {
      payload.date_from = options.dateFrom;
    }
    if (options.dateTo) {
      payload.date_to = options.dateTo;
    }

    const sign = this.createSignature(payload);

    try {
      const response = await axios.post(`${this.apiUrl}/payment/list`, payload, {
        headers: {
          'merchant': this.getMerchantId(),
          'sign': sign,
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      this.logger.error('Error getting payment history', error?.response?.data || error.message);
      throw error;
    }
  }

  async testWebhook(payload: any): Promise<any> {
    // This method is now deprecated in favor of specific test webhook methods
    this.logger.warn('testWebhook method is deprecated. Use testPaymentWebhook, testPayoutWebhook, or testWalletWebhook instead.');
    return null;
  }

  verifyWebhook(payload: any, signature: string): boolean {
    // Implement webhook signature verification
    const expectedSignature = this.createSignature(payload);
    return expectedSignature === signature;
  }
}