import { Injectable, Logger, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { ProxyEntity, ProxyProtocol, ProxyStatus, ProxyType } from './entities/proxy.entity';
import { ProxyOrderEntity, OrderStatus } from './entities/proxy-order.entity';
import { ProxyUsageEntity } from './entities/proxy-usage.entity';
import { CreateProxyDto } from './dto/create-proxy.dto';
import { FetchProxiesDto } from './dto/fetch-proxies.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UsageStatementDto } from './dto/usage-statement.dto';
import { 
  ProxyFetchResponse, 
  ProxyTokenResponse, 
  ProxyOrderResponse,
  ProxyOrderStatusResponse,
  ProxyBalanceResponse,
  ProxyUsageResponse 
} from './interfaces/711proxy-api.interface';

@Injectable()
export class ProxiesService {
  private readonly logger = new Logger(ProxiesService.name);
  private readonly baseUrl = 'https://api.711proxy.com';
  private authToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    @InjectRepository(ProxyEntity)
    private proxyRepository: Repository<ProxyEntity>,
    @InjectRepository(ProxyOrderEntity)
    private orderRepository: Repository<ProxyOrderEntity>,
    @InjectRepository(ProxyUsageEntity)
    private usageRepository: Repository<ProxyUsageEntity>,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  // ==================== PROXY MANAGEMENT ====================

  async createProxy(createProxyDto: CreateProxyDto, userId?: string): Promise<ProxyEntity> {
    const proxy = this.proxyRepository.create({
      ...createProxyDto,
      ownerId: userId,
      expiresAt: createProxyDto.expiresAt ? new Date(createProxyDto.expiresAt) : undefined,
    });

    return await this.proxyRepository.save(proxy);
  }

  async getProxyById(id: string): Promise<ProxyEntity> {
    const proxy = await this.proxyRepository.findOne({ 
      where: { id },
      relations: ['owner', 'orders']
    });
    if (!proxy) {
      throw new NotFoundException('Proxy not found');
    }
    return proxy;
  }

  async getUserProxies(userId: string): Promise<ProxyEntity[]> {
    return await this.proxyRepository.find({
      where: { ownerId: userId },
      relations: ['orders'],
      order: { createdAt: 'DESC' }
    });
  }

  async getAllProxies(): Promise<ProxyEntity[]> {
    return await this.proxyRepository.find({
      relations: ['owner', 'orders'],
      order: { createdAt: 'DESC' }
    });
  }

  async updateProxyStatus(id: string, status: ProxyStatus): Promise<ProxyEntity> {
    const proxy = await this.getProxyById(id);
    proxy.status = status;
    return await this.proxyRepository.save(proxy);
  }

  async deleteProxy(id: string): Promise<void> {
    const proxy = await this.getProxyById(id);
    await this.proxyRepository.remove(proxy);
  }

  // ==================== 711 PROXY API INTEGRATION ====================

  async fetchProxies(fetchDto: FetchProxiesDto): Promise<ProxyFetchResponse[]> {
    try {
      const params = new URLSearchParams({
        zone: fetchDto.zone,
        ptype: fetchDto.ptype.toString(),
        count: fetchDto.count.toString(),
      });

      if (fetchDto.region) params.append('region', fetchDto.region);
      if (fetchDto.proto) params.append('proto', fetchDto.proto);
      if (fetchDto.stype) params.append('stype', fetchDto.stype);
      if (fetchDto.split) params.append('split', fetchDto.split);
      if (fetchDto.customSplit) params.append('split', fetchDto.customSplit);

      const response = await firstValueFrom(
        this.httpService.get<ProxyFetchResponse[]>(`${this.baseUrl}/fetch?${params}`)
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch proxies from 711 Proxy', error.response?.data);
      throw new BadRequestException('Failed to fetch proxies');
    }
  }

  async createProxyOrder(createOrderDto: CreateOrderDto, userId?: string): Promise<ProxyOrderEntity> {
    // Get or refresh auth token
    await this.ensureValidToken();

    try {
      const payload = {
        flow: createOrderDto.flow.toString(),
        expire: createOrderDto.expire,
        host: createOrderDto.host,
      };

      const response = await firstValueFrom(
        this.httpService.post<ProxyOrderResponse>(
          `${this.baseUrl}/eapi/order`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${this.authToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      if (response.data.code !== 0) {
        throw new BadRequestException(response.data.message);
      }

      // Create order record
      const order = this.orderRepository.create({
        orderNo: response.data.results.order_no,
        flow: parseFloat(response.data.results.flow),
        expire: response.data.results.expire ? new Date(response.data.results.expire) : undefined,
        hostLabel: response.data.results.host || createOrderDto.host,
        username: response.data.results.username,
        password: response.data.results.passwd,
        host: response.data.results.host,
        port: response.data.results.port,
        protocol: response.data.results.proto,
        status: OrderStatus.ACTIVE,
        isTest: this.configService.get('711PROXY_TEST_MODE') === 'true',
        userId,
        metadata: { api_response: response.data }
      });

      const savedOrder = await this.orderRepository.save(order);

      // Create or update proxy entity
      await this.createOrUpdateProxyFromOrder(savedOrder);

      return savedOrder;
    } catch (error) {
      this.logger.error('Failed to create proxy order', error.response?.data);
      throw new BadRequestException('Failed to create proxy order');
    }
  }

  async getOrderStatus(orderNo: string): Promise<ProxyOrderStatusResponse> {
    await this.ensureValidToken();

    try {
      const response = await firstValueFrom(
        this.httpService.get<ProxyOrderStatusResponse>(
          `${this.baseUrl}/eapi/order?order_no=${orderNo}`,
          {
            headers: {
              'Authorization': `Bearer ${this.authToken}`,
            },
          }
        )
      );

      if (response.data.code !== 0) {
        throw new BadRequestException(response.data.message);
      }

      // Update local order status
      await this.updateOrderStatus(orderNo, response.data.results.status);

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get order status', error.response?.data);
      throw new BadRequestException('Failed to get order status');
    }
  }

  async getBalance(): Promise<ProxyBalanceResponse> {
    await this.ensureValidToken();

    try {
      const response = await firstValueFrom(
        this.httpService.get<ProxyBalanceResponse>(
          `${this.baseUrl}/eapi/balance`,
          {
            headers: {
              'Authorization': `Bearer ${this.authToken}`,
            },
          }
        )
      );

      if (response.data.code !== 0) {
        throw new BadRequestException(response.data.message);
      }

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get balance', error.response?.data);
      throw new BadRequestException('Failed to get balance');
    }
  }

  async getUsageStatement(usageDto: UsageStatementDto, userId?: string): Promise<ProxyUsageResponse> {
    await this.ensureValidToken();

    try {
      const payload = {
        username: usageDto.username,
        tzname: usageDto.tzname,
        start_date: usageDto.startDate,
      };

      const response = await firstValueFrom(
        this.httpService.post<ProxyUsageResponse>(
          `${this.baseUrl}/eapi/statement`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${this.authToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      if (response.data.code !== 0) {
        throw new BadRequestException(response.data.message);
      }

      // Store usage data locally
      await this.storeUsageData(response.data, usageDto, userId);

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get usage statement', error.response?.data);
      throw new BadRequestException('Failed to get usage statement');
    }
  }

  // ==================== PRIVATE METHODS ====================

  private async ensureValidToken(): Promise<void> {
    if (!this.authToken || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  private async authenticate(): Promise<void> {
    try {
      const username = this.configService.get('711PROXY_USERNAME');
      const password = this.configService.get('711PROXY_PASSWORD');

      if (!username || !password) {
        throw new UnauthorizedException('711 Proxy credentials not configured');
      }

      const response = await firstValueFrom(
        this.httpService.post<ProxyTokenResponse>(
          `${this.baseUrl}/eapi/token`,
          { username, passwd: password },
          { headers: { 'Content-Type': 'application/json' } }
        )
      );

      if (response.data.code !== 0) {
        throw new UnauthorizedException(response.data.message);
      }

      this.authToken = response.data.results.token;
      
      // Decode JWT to get expiry (basic implementation)
      try {
        const payload = JSON.parse(Buffer.from(this.authToken.split('.')[1], 'base64').toString());
        this.tokenExpiry = (payload.exp || 0) * 1000;
      } catch {
        // If JWT decode fails, set expiry to 1 hour from now
        this.tokenExpiry = Date.now() + (60 * 60 * 1000);
      }

      this.logger.log('Successfully authenticated with 711 Proxy');
    } catch (error) {
      this.logger.error('Failed to authenticate with 711 Proxy', error);
      throw new UnauthorizedException('Failed to authenticate with 711 Proxy');
    }
  }

  private async createOrUpdateProxyFromOrder(order: ProxyOrderEntity): Promise<void> {
    let proxy = await this.proxyRepository.findOne({ where: { orderNo: order.orderNo } });

    if (!proxy) {
      proxy = this.proxyRepository.create({
        proxyName: order.hostLabel || `Proxy-${order.orderNo}`,
        proxyType: order.flow === 0 ? ProxyType.UNLIMITED : ProxyType.TRAFFIC_GB,
        protocol: order.protocol as ProxyProtocol,
        host: order.host,
        port: order.port,
        username: order.username,
        password: order.password,
        zone: 'auto_created',
        ptype: 1,
        flow: order.flow,
        orderNo: order.orderNo,
        ownerId: order.userId,
        isTest: order.isTest,
        metadata: { created_from_order: order.id }
      });
    } else {
      proxy.username = order.username;
      proxy.password = order.password;
      proxy.host = order.host;
      proxy.port = order.port;
      proxy.protocol = order.protocol as any;
    }

    await this.proxyRepository.save(proxy);
  }

  private async updateOrderStatus(orderNo: string, status: string): Promise<void> {
    const order = await this.orderRepository.findOne({ where: { orderNo } });
    if (order) {
      let orderStatus: OrderStatus;
      switch (status.toLowerCase()) {
        case 'active':
          orderStatus = OrderStatus.ACTIVE;
          break;
        case 'completed':
          orderStatus = OrderStatus.COMPLETED;
          break;
        case 'failed':
          orderStatus = OrderStatus.FAILED;
          break;
        case 'cancelled':
          orderStatus = OrderStatus.CANCELLED;
          break;
        default:
          orderStatus = OrderStatus.PENDING;
      }
      
      order.status = orderStatus;
      await this.orderRepository.save(order);
    }
  }

  private async storeUsageData(
    usageResponse: ProxyUsageResponse, 
    usageDto: UsageStatementDto, 
    userId?: string
  ): Promise<void> {
    for (const usage of usageResponse.results) {
      const existingUsage = await this.usageRepository.findOne({
        where: {
          username: usage.username,
          startDate: new Date(usageDto.startDate),
        }
      });

      if (existingUsage) {
        existingUsage.trafficUsed = usage.traffic_used;
        existingUsage.ipRotations = usage.ip_rotations;
        existingUsage.requestsCount = usage.requests_count;
        existingUsage.successfulRequests = usage.successful_requests;
        existingUsage.failedRequests = usage.failed_requests;
        existingUsage.averageResponseTime = usage.average_response_time;
        await this.usageRepository.save(existingUsage);
      } else {
        const newUsage = this.usageRepository.create({
          username: usage.username,
          tzname: usageDto.tzname,
          startDate: new Date(usageDto.startDate),
          endDate: new Date(usageDto.startDate), // You might want to calculate this
          trafficUsed: usage.traffic_used,
          ipRotations: usage.ip_rotations,
          requestsCount: usage.requests_count,
          successfulRequests: usage.successful_requests,
          failedRequests: usage.failed_requests,
          averageResponseTime: usage.average_response_time,
          isTest: this.configService.get('711PROXY_TEST_MODE') === 'true',
          userId,
          metadata: { api_response: usage }
        });
        await this.usageRepository.save(newUsage);
      }
    }
  }
}
