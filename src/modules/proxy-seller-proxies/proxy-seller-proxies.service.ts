import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ProxySellerProxy } from './entities/proxy-seller-proxy.entity';
import {
  CreateSpecialListForAPIToolRequest, GetActiveProxiesResponse,
  GetOrderReferenceInfoResponse,
  CalculateOrderRequest,
  CalculateOrderResponse,
  MakeOrderRequest,
  MakeOrderResponse,
  ListAuthorizationsResponse,
  CreateAuthorizationRequest,
  CreateAuthorizationResponse,
  GetExistingIPListsResponse,
  CreateSpecialListForAPIToolResponse,
  ChangeRotationRequest,
  ChangeRotationResponse,
  GetProxiesByOrderQuery,
  GetProxiesByOrderResponse
} from './interfaces/proxy-seller-api.interface';

@Injectable()
export class ProxySellerProxiesService {
  private readonly logger = new Logger(ProxySellerProxiesService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly testMode: boolean;

  constructor(
    @InjectRepository(ProxySellerProxy)
    private proxyRepository: Repository<ProxySellerProxy>,

    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('proxySeller.apiKey') || '';
    this.baseUrl = this.configService.get<string>('proxySeller.baseUrl') || 'https://proxy-seller.com/personal/api/v1';
    this.testMode = this.configService.get<boolean>('proxySeller.testMode') || false;
  }

  // ==================== PROXY SELLER API INTEGRATION ====================
  
  /**
   * Get active proxies of a specific type or all types
   * @param type Optional proxy type (ipv4 | ipv6 | mobile | isp | resident | mix | mix_isp)
   * @returns Promise<GetActiveProxiesResponse>
   */
  async getActiveProxies(type?: string): Promise<GetActiveProxiesResponse> {
    try {
      const endpoint = type 
        ? `https://proxy-seller.com/api/v1/${this.apiKey}/proxy/list/${type}`
        : `https://proxy-seller.com/api/v1/${this.apiKey}/proxy/list`;
      
      const response = await firstValueFrom(
        this.httpService.get<GetActiveProxiesResponse>(endpoint)
      );
      
      this.logger.log(`Successfully fetched active proxies${type ? ` for type: ${type}` : ''}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get active proxies: ${error.message}`);
      throw new BadRequestException(`Failed to get active proxies: ${error.message}`);
    }
  }

  /**
   * Get metadata required to place an order (country, periods, targets)
   * @param type Optional proxy type
   * @returns Promise<GetOrderReferenceInfoResponse>
   */
  async getOrderReferenceInfo(type?: string): Promise<GetOrderReferenceInfoResponse> {
    try {
      const endpoint = type 
        ? `https://proxy-seller.com/api/v1/${this.apiKey}/reference/list/${type}`
        : `https://proxy-seller.com/api/v1/${this.apiKey}/reference/list`;
      
      const response = await firstValueFrom(
        this.httpService.get<GetOrderReferenceInfoResponse>(endpoint)
      );
      
      this.logger.log(`Successfully fetched order reference info${type ? ` for type: ${type}` : ''}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get order reference info: ${error.message}`);
      throw new BadRequestException(`Failed to get order reference info: ${error.message}`);
    }
  }

  /**
   * Calculate cost and balance impact before ordering
   * @param request CalculateOrderRequest
   * @returns Promise<CalculateOrderResponse>
   */
  async calculateOrder(request: CalculateOrderRequest): Promise<CalculateOrderResponse> {
    try {
      const endpoint = `https://proxy-seller.com/api/v1/${this.apiKey}/order/calc`;
      
      const response = await firstValueFrom(
        this.httpService.post<CalculateOrderResponse>(endpoint, request)
      );
      
      this.logger.log(`Successfully calculated order for country: ${request.countryId}, quantity: ${request.quantity}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to calculate order: ${error.message}`);
      throw new BadRequestException(`Failed to calculate order: ${error.message}`);
    }
  }

  /**
   * Place order for proxies
   * @param request MakeOrderRequest
   * @returns Promise<MakeOrderResponse>
   */
  async makeOrder(request: MakeOrderRequest): Promise<MakeOrderResponse> {
    try {
      const endpoint = `https://proxy-seller.com/api/v1/${this.apiKey}/order/make`;
      
      const response = await firstValueFrom(
        this.httpService.post<MakeOrderResponse>(endpoint, request)
      );
      
      this.logger.log(`Successfully placed order for country: ${request.countryId}, quantity: ${request.quantity}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to make order: ${error.message}`);
      throw new BadRequestException(`Failed to make order: ${error.message}`);
    }
  }

  /**
   * Retrieve existing authorizations for orders
   * @returns Promise<ListAuthorizationsResponse>
   */
  async listAuthorizations(): Promise<ListAuthorizationsResponse> {
    try {
      const endpoint = `https://proxy-seller.com/personal/api/v1/${this.apiKey}/auth/list`;
      
      const response = await firstValueFrom(
        this.httpService.get<ListAuthorizationsResponse>(endpoint)
      );
      
      this.logger.log('Successfully fetched authorizations list');
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to list authorizations: ${error.message}`);
      throw new BadRequestException(`Failed to list authorizations: ${error.message}`);
    }
  }

  /**
   * Create a new authorization (login/password or IP)
   * @param request CreateAuthorizationRequest
   * @returns Promise<CreateAuthorizationResponse>
   */
  async createAuthorization(request: CreateAuthorizationRequest): Promise<CreateAuthorizationResponse> {
    try {
      const endpoint = request.ip 
        ? `https://proxy-seller.com/personal/api/v1/${this.apiKey}/auth/add/ip`
        : `https://proxy-seller.com/personal/api/v1/${this.apiKey}/auth/add`;
      
      const response = await firstValueFrom(
        this.httpService.post<CreateAuthorizationResponse>(endpoint, request)
      );
      
      this.logger.log(`Successfully created authorization for order: ${request.orderNumber}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to create authorization: ${error.message}`);
      throw new BadRequestException(`Failed to create authorization: ${error.message}`);
    }
  }

  /**
   * Fetch existing IP lists with credentials and IP details
   * @returns Promise<GetExistingIPListsResponse>
   */
  async getExistingIPLists(): Promise<GetExistingIPListsResponse> {
    try {
      const endpoint = `https://proxy-seller.com/personal/api/v1/${this.apiKey}/resident/lists`;
      
      const response = await firstValueFrom(
        this.httpService.get<GetExistingIPListsResponse>(endpoint)
      );
      
      this.logger.log('Successfully fetched existing IP lists');
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get existing IP lists: ${error.message}`);
      throw new BadRequestException(`Failed to get existing IP lists: ${error.message}`);
    }
  }

  /**
   * Generate login/password credentials for a subuser's package
   * @param request CreateSpecialListForAPIToolRequest
   * @returns Promise<CreateSpecialListForAPIToolResponse>
   */
  async createSpecialListForAPITool(request: CreateSpecialListForAPIToolRequest): Promise<CreateSpecialListForAPIToolResponse> {
    try {
      const endpoint = `https://proxy-seller.com/personal/api/v1/${this.apiKey}/residentsubuser/list/tools`;
      
      const response = await firstValueFrom(
        this.httpService.put<CreateSpecialListForAPIToolResponse>(endpoint, request)
      );
      
      this.logger.log(`Successfully created special list for API tool with package: ${request.package_key}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to create special list for API tool: ${error.message}`);
      throw new BadRequestException(`Failed to create special list for API tool: ${error.message}`);
    }
  }

  /**
   * Adjust rotation settings for a specific IP list
   * @param request ChangeRotationRequest
   * @returns Promise<ChangeRotationResponse>
   */
  async changeRotation(request: ChangeRotationRequest): Promise<ChangeRotationResponse> {
    try {
      const endpoint = `https://proxy-seller.com/personal/api/v1/${this.apiKey}/residentsubuser/list/rotation`;
      
      const response = await firstValueFrom(
        this.httpService.post<ChangeRotationResponse>(endpoint, request)
      );
      
      this.logger.log(`Successfully changed rotation for IP list: ${request.id} to ${request.rotation}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to change rotation: ${error.message}`);
      throw new BadRequestException(`Failed to change rotation: ${error.message}`);
    }
  }

  /**
   * Retrieve proxies associated with a specific order
   * @param type Optional proxy type
   * @param query Optional query parameters
   * @returns Promise<GetProxiesByOrderResponse>
   */
  async getProxiesByOrder(type?: string, query?: GetProxiesByOrderQuery): Promise<GetProxiesByOrderResponse> {
    try {
      const endpoint = type 
        ? `https://proxy-seller.com/personal/api/v1/${this.apiKey}/proxy/list/${type}`
        : `https://proxy-seller.com/personal/api/v1/${this.apiKey}/proxy/list`;
      
      const response = await firstValueFrom(
        this.httpService.get<GetProxiesByOrderResponse>(endpoint, { params: query })
      );
      
      this.logger.log(`Successfully fetched proxies by order${type ? ` for type: ${type}` : ''}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get proxies by order: ${error.message}`);
      throw new BadRequestException(`Failed to get proxies by order: ${error.message}`);
    }
  }
}
