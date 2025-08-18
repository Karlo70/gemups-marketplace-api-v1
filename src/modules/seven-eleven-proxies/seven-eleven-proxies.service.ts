import { Injectable, Logger, BadRequestException, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateOrderDto, CreateSevenElevenProxyDto } from './dto/create-seven-eleven-proxy.dto';
import { UpdateSevenElevenProxyDto } from './dto/update-seven-eleven-proxy.dto';
import {
  TokenResponse,
  EnterpriseBalanceResponse,
  OrderResponse,
  OrderStatusResponse,
  RestitutionOrderResponse,
  UserPassStatusResponse,
  AllocationOrderResponse,
  WhitelistResponse,
  WhitelistInfoResponse,
  StatementResponse
} from './interfaces/711proxy-api.interface';
import * as dayjs from 'dayjs';

@Injectable()
export class SevenElevenProxiesService {
  private readonly logger = new Logger(SevenElevenProxiesService.name);
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;
  private authToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get<string>('SEVEN_ELEVEN_BASE_URL') || 'https://server.711proxy.com';
    this.username = this.configService.get<string>('SEVEN_ELEVEN_USER_NAME') || '';
    this.password = this.configService.get<string>('SEVEN_ELEVEN_PASSWORD') || '';
    this.timeout = this.configService.get<number>('SEVEN_ELEVEN_TIMEOUT') || 30000;
    this.retryAttempts = this.configService.get<number>('SEVEN_ELEVEN_RETRY_ATTEMPTS') || 3;
    this.retryDelay = this.configService.get<number>('SEVEN_ELEVEN_RETRY_DELAY') || 1000;
  }

  // ==================== AUTHENTICATION ====================

  /**
   * GET TOKEN - POST /eapi/token/
   * Authenticate and get access token
   */
  async getToken(username?: string, password?: string): Promise<string> {
    try {
      const authData = {
        username: username ?? this.username,
        passwd: password ?? this.password,
      };

      if (!authData.username || !authData.passwd) {
        throw new BadRequestException('Username and password are required');
      }

      const response = await firstValueFrom(
        this.httpService.post<TokenResponse>(
          `${this.baseUrl}/eapi/token/`,
          authData,
          {
            timeout: this.timeout,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      if (response.data.code === 200 && response.data.results?.token) {
        this.authToken = response.data.results.token;
        this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        this.logger.log('Successfully obtained authentication token');
        return this.authToken;
      } else {
        throw new UnauthorizedException(response.data.message || 'Authentication failed');
      }
    } catch (error) {
      this.logger.error('Failed to get authentication token', error);
      throw new HttpException(
        error.response?.data?.message || 'Authentication failed',
        error.response?.status || HttpStatus.UNAUTHORIZED
      );
    }
  }

  /**
   * Ensure we have a valid token
   */
  private async ensureValidToken(): Promise<string> {
    if (!this.authToken || Date.now() > this.tokenExpiry) {
      return await this.getToken();
    }
    return this.authToken;
  }

  // ==================== ENTERPRISE OPERATIONS ====================

  /**
   * GET Enterprise Balance
   * Get account balance information
   */
  async getEnterpriseBalance(): Promise<EnterpriseBalanceResponse> {
    try {
      const token = await this.getToken();

      const response = await firstValueFrom(
        this.httpService.get<EnterpriseBalanceResponse>(
          `${this.baseUrl}/eapi/balance/`,
          {
            timeout: this.timeout,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        )
      );

      if (response.data.code === 0) {
        return response.data;
      } else {
        throw new BadRequestException(response.data.message || 'Failed to get balance');
      }
    } catch (error) {
      this.logger.error('Failed to get enterprise balance', error);
      throw new HttpException(
        error.response?.data?.message || 'Failed to get balance',
        error.response?.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  // ==================== ORDER OPERATIONS ====================

  /**
   * Create Order - POST
   * Create a new proxy order
   */
  async createOrder(orderData: CreateOrderDto): Promise<OrderResponse> {
    console.log("🚀 ~ SevenElevenProxiesService ~ createOrder ~ orderData:", orderData)
    try {
      const token = await this.getToken();

      const order_data: CreateOrderDto = {
        expire: orderData.expire,
        flow: orderData.flow,
        host: "global.rotgb.711proxy.com",
      }

      const response = await firstValueFrom(
        this.httpService.post<OrderResponse>(
          `${this.baseUrl}/eapi/order/`,
          order_data,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        )
      );

      if (response.data.code === 200) {
        this.logger.log(`Successfully created order: ${response.data.results?.['order_no']}`);
        return response.data;
      } else if (response.data.code === 41001) {
        console.log("🚀 ~ SevenElevenProxiesService ~ createOrder ~ response.data:", response.data)
        throw new BadRequestException(response.data || 'Failed to create order');
      } else {
        throw new BadRequestException(response.data.message || 'Failed to create order');
      }
    } catch (error) {
      this.logger.error('Failed to create order', error);
      if (error.code === 41001) {
        throw new BadRequestException(error.response?.data || 'Failed to create order');
      }
      throw new HttpException(
        error.response?.data?.message || 'Failed to create order',
        error.response?.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * GET ORDER STATUS
   * Get the status of an existing order
   */
  async getOrderStatus(orderNo: string): Promise<OrderStatusResponse> {
    try {
      const token = await this.getToken();

      const response = await firstValueFrom(
        this.httpService.get<OrderStatusResponse>(
          `${this.baseUrl}/eapi/order/`,
          {
            timeout: this.timeout,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            params: {
              order_no: orderNo
            },
          }
        )
      );

      if (response.data.code === 200) {
        return response.data;
      } else {
        throw new BadRequestException(response.data.message || 'Failed to get order status');
      }
    } catch (error) {
      this.logger.error(`Failed to get order status for ${orderNo}`, error);
      throw new HttpException(
        error.response?.data?.message || 'Failed to get order status',
        error.response?.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Apply Restitution Order - POST
   * Apply for order restitution/refund
   */
  async applyRestitutionOrder(orderNo: string, reason: string): Promise<RestitutionOrderResponse> {
    try {
      const token = await this.getToken();

      const response = await firstValueFrom(
        this.httpService.post<RestitutionOrderResponse>(
          `${this.baseUrl}/eapi/restitution/`,
          { orderNo, reason },
          {
            timeout: this.timeout,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        )
      );

      if (response.data.code === 0) {
        this.logger.log(`Successfully applied restitution for order: ${orderNo}`);
        return response.data;
      } else {
        throw new BadRequestException(response.data.message || 'Failed to apply restitution');
      }
    } catch (error) {
      this.logger.error(`Failed to apply restitution for order ${orderNo}`, error);
      throw new HttpException(
        error.response?.data?.message || 'Failed to apply restitution',
        error.response?.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  // ==================== USER MANAGEMENT ====================

  /**
   * Change UserPass Status - POST
   * Change user password status
   */
  async changeUserPassStatus(username: string, status: boolean): Promise<UserPassStatusResponse> {
    try {
      const token = await this.getToken();

      const response = await firstValueFrom(
        this.httpService.post<UserPassStatusResponse>(
          `${this.baseUrl}/eapi/userpass/`,
          { username, status },
          {
            timeout: this.timeout,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        )
      );

      if (response.data.code === 0) {
        this.logger.log(`Successfully changed user pass status for: ${username}`);
        return response.data;
      } else {
        throw new BadRequestException(response.data.message || 'Failed to change user pass status');
      }
    } catch (error) {
      this.logger.error(`Failed to change user pass status for ${username}`, error);
      throw new HttpException(
        error.response?.data?.message || 'Failed to change user pass status',
        error.response?.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  // ==================== ALLOCATION OPERATIONS ====================

  /**
   * Create Allocation Order - POST
   * Create an order for proxy allocation
   */
  async createAllocationOrder(allocationData: any): Promise<AllocationOrderResponse> {
    try {
      const token = await this.getToken();

      const response = await firstValueFrom(
        this.httpService.post<AllocationOrderResponse>(
          `${this.baseUrl}/eapi/allocation/`,
          allocationData,
          {
            timeout: this.timeout,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        )
      );

      if (response.data.code === 0) {
        this.logger.log(`Successfully created allocation order: ${response.data.results?.orderNo}`);
        return response.data;
      } else {
        throw new BadRequestException(response.data.message || 'Failed to create allocation order');
      }
    } catch (error) {
      this.logger.error('Failed to create allocation order', error);
      throw new HttpException(
        error.response?.data?.message || 'Failed to create allocation order',
        error.response?.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  // ==================== WHITELIST OPERATIONS ====================

  /**
   * Whitelist - POST
   * Add IP to whitelist
   */
  async addToWhitelist(ip: string, description?: string): Promise<WhitelistResponse> {
    try {
      const token = await this.getToken();

      const response = await firstValueFrom(
        this.httpService.post<WhitelistResponse>(
          `${this.baseUrl}/eapi/whitelist/`,
          { ip, description },
          {
            timeout: this.timeout,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        )
      );

      if (response.data.code === 0) {
        this.logger.log(`Successfully added IP to whitelist: ${ip}`);
        return response.data;
      } else {
        throw new BadRequestException(response.data.message || 'Failed to add IP to whitelist');
      }
    } catch (error) {
      this.logger.error(`Failed to add IP to whitelist: ${ip}`, error);
      throw new HttpException(
        error.response?.data?.message || 'Failed to add IP to whitelist',
        error.response?.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * WhitelistInfo - POST
   * Get whitelist information
   */
  async getWhitelistInfo(ip?: string): Promise<WhitelistInfoResponse> {
    try {
      const token = await this.getToken();

      const response = await firstValueFrom(
        this.httpService.post<WhitelistInfoResponse>(
          `${this.baseUrl}/eapi/whitelist/info/`,
          ip ? { ip } : {},
          {
            timeout: this.timeout,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        )
      );

      if (response.data.code === 0) {
        return response.data;
      } else {
        throw new BadRequestException(response.data.message || 'Failed to get whitelist info');
      }
    } catch (error) {
      this.logger.error('Failed to get whitelist info', error);
      throw new HttpException(
        error.response?.data?.message || 'Failed to get whitelist info',
        error.response?.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  // ==================== STATEMENT OPERATIONS ====================

  /**
   * Statement - POST
   * Get usage statement
   */
  async getStatement(startDate?: string, endDate?: string, username?: string): Promise<StatementResponse> {
    try {
      const token = await this.getToken();

      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (username) params.username = username;

      const response = await firstValueFrom(
        this.httpService.post<StatementResponse>(
          `${this.baseUrl}/eapi/statement/`,
          params,
          {
            timeout: this.timeout,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        )
      );

      if (response.data.code === 0) {
        return response.data;
      } else {
        throw new BadRequestException(response.data.message || 'Failed to get statement');
      }
    } catch (error) {
      this.logger.error('Failed to get statement', error);
      throw new HttpException(
        error.response?.data?.message || 'Failed to get statement',
        error.response?.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  // ==================== BASIC CRUD OPERATIONS ====================

  /**
   * Create a new seven eleven proxy
   */
  async create(createSevenElevenProxyDto: CreateSevenElevenProxyDto) {
    try {
      // First authenticate
      const token = await this.getToken(createSevenElevenProxyDto.username, createSevenElevenProxyDto.passwd);

      // If proxy creation data is provided, create an order
      if (createSevenElevenProxyDto.flow) {
        const orderData = {
          expire: createSevenElevenProxyDto.expire || dayjs().add(90, 'day').toISOString(),
          flow: createSevenElevenProxyDto.flow,
          host: createSevenElevenProxyDto.host,
        };

        const orderResult = await this.createOrder(orderData);
        return {
          message: 'Proxy order created successfully',
          order: orderResult,
          proxyData: createSevenElevenProxyDto,
        };
      }

      return {
        message: 'Authentication successful',
        token,
        proxyData: createSevenElevenProxyDto,
      };
    } catch (error) {
      this.logger.error('Failed to create proxy', error);
      throw error;
    }
  }

  /**
   * Find all proxies (returns account information and balance)
   */
  async findAll() {
    try {
      const balance = await this.getEnterpriseBalance();
      return {
        message: 'Account information retrieved successfully',
        balance: balance.results,
      };
    } catch (error) {
      this.logger.error('Failed to get account information', error);
      throw error;
    }
  }

  /**
   * Find one proxy by ID (returns order status if ID is an order number)
   */
  async findOne(id: string) {
    try {
      // Try to get order status if the ID looks like an order number
      const orderStatus = await this.getOrderStatus(id);
      return {
        message: 'Order status retrieved successfully',
        order: orderStatus.results,
      };
    } catch (error) {
      this.logger.error(`Failed to get order status for ID: ${id}`, error);
      throw new BadRequestException(`Invalid order ID: ${id}`);
    }
  }

  /**
   * Update proxy information
   */
  async update(id: string, updateSevenElevenProxyDto: UpdateSevenElevenProxyDto) {
    try {
      // For proxy updates, we might need to modify order parameters
      // This would depend on the specific 711proxy API capabilities
      return {
        message: 'Proxy update functionality depends on 711proxy API capabilities',
        id,
        updateData: updateSevenElevenProxyDto,
      };
    } catch (error) {
      this.logger.error(`Failed to update proxy: ${id}`, error);
      throw error;
    }
  }

  /**
   * Remove proxy (cancel order)
   */
  async remove(id: string) {
    try {
      // Try to apply restitution for the order
      const restitution = await this.applyRestitutionOrder(id, 'Order cancelled by user');
      return {
        message: 'Proxy order cancelled successfully',
        restitution: restitution.results,
      };
    } catch (error) {
      this.logger.error(`Failed to remove proxy: ${id}`, error);
      throw error;
    }
  }
}
