import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ProxySellerProxy, ProxySellerProxyStatus, ProxySellerProxyProtocol } from './entities/proxy-seller-proxy.entity';
import { CreateProxySellerProxyDto } from './dto/create-proxy-seller-proxy.dto';
import { UpdateProxySellerProxyDto } from './dto/update-proxy-seller-proxy.dto';
import { CreateProxyDto } from './dto/create-proxy.dto';
import { GetProxiesDto } from './dto/get-proxies.dto';
import {
  ProxySellerApiResponse,
  ProxySellerProxyResponse,
  CreateSubUserPackageRequest,
  SubUserPackageResponse,
  CreateIPListRequest,
  RenameIPListRequest,
  ChangeIPListRotationRequest,
  DeleteIPListRequest,
  IPListResponse,
  IPListListResponse,
  CreateSpecialListForAPIToolRequest,
  UpdateSubUserPackageRequest,
  SubUserPackageListResponse,
  DeleteSubUserPackageRequest,
  RetrieveSubUserIPListsQuery,
} from './interfaces/proxy-seller-api.interface';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';

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

  // ==================== LOCAL PROXY MANAGEMENT ====================

  async create(createProxySellerProxyDto: CreateProxySellerProxyDto): Promise<ProxySellerProxy> {
    const proxy = this.proxyRepository.create({
      ...createProxySellerProxyDto,
      expiresAt: createProxySellerProxyDto.expiresAt ? new Date(createProxySellerProxyDto.expiresAt) : undefined,
      isTest: this.testMode,
    });

    return await this.proxyRepository.save(proxy);
  }

  async findAll(query: GetProxiesDto = {}) {
    const { page = 1, perPage = 20, ...filters } = query;

    const queryBuilder = this.proxyRepository.createQueryBuilder('proxy')
      .leftJoinAndSelect('proxy.owner', 'owner');

    // Apply filters
    if (filters.zone) {
      queryBuilder.andWhere('proxy.zone = :zone', { zone: filters.zone });
    }
    if (filters.protocol) {
      queryBuilder.andWhere('proxy.protocol = :protocol', { protocol: filters.protocol });
    }
    if (filters.status) {
      queryBuilder.andWhere('proxy.status = :status', { status: filters.status });
    }
    if (filters.subaccountId) {
      queryBuilder.andWhere('proxy.subaccountId = :subaccountId', { subaccountId: filters.subaccountId });
    }
    if (filters.isTest !== undefined) {
      queryBuilder.andWhere('proxy.isTest = :isTest', { isTest: filters.isTest });
    }
    if (filters.ownerId) {
      queryBuilder.andWhere('proxy.ownerId = :ownerId', { ownerId: filters.ownerId });
    }

    const paginateOption: IPaginationOptions = {
      page,
      limit: perPage,
    };

    return await paginate(queryBuilder, paginateOption);
  }

  async findOne(paramIdDto: ParamIdDto): Promise<ProxySellerProxy> {
    const proxy = await this.proxyRepository.findOne({
      where: { id: paramIdDto.id },
      relations: {
        owner: true,
      }
    });

    if (!proxy) {
      throw new NotFoundException('Proxy not found');
    }

    return proxy;
  }

  async update(paramIdDto: ParamIdDto, updateProxySellerProxyDto: UpdateProxySellerProxyDto): Promise<ProxySellerProxy> {
    const proxy = await this.findOne(paramIdDto);

    if (updateProxySellerProxyDto.expiresAt) {
      updateProxySellerProxyDto.expiresAt = new Date(updateProxySellerProxyDto.expiresAt);
    }

    Object.assign(proxy, updateProxySellerProxyDto);
    return await this.proxyRepository.save(proxy);
  }

  async remove(paramIdDto: ParamIdDto): Promise<void> {
    const proxy = await this.findOne(paramIdDto);
    await this.proxyRepository.remove(proxy);
  }

  // ==================== PROXY SELLER API INTEGRATION ====================

  // ==================== SUB_USER_PACKAGE MANAGEMENT ====================

  async createSubUserPackage(request: CreateSubUserPackageRequest): Promise<SubUserPackageResponse> {
    try {
      const endpoint = `${this.baseUrl}/${this.apiKey}/residentsubuser/create`;
      
      const response = await firstValueFrom(
        this.httpService.post<ProxySellerApiResponse<SubUserPackageResponse>>(endpoint, request)
      );

      if (!response.data.success || !response.data.data) {
        throw new BadRequestException(response.data.message || 'Failed to create subuser package');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error('Error creating subuser package:', error);
      throw new BadRequestException('Failed to create subuser package');
    }
  }

  async updateSubUserPackage(request: UpdateSubUserPackageRequest): Promise<SubUserPackageResponse> {
    try {
      const endpoint = `${this.baseUrl}/${this.apiKey}/residentsubuser/update`;
      
      const response = await firstValueFrom(
        this.httpService.post<ProxySellerApiResponse<SubUserPackageResponse>>(endpoint, request)
      );

      if (!response.data.success || !response.data.data) {
        throw new BadRequestException(response.data.message || 'Failed to update subuser package');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error('Error updating subuser package:', error);
      throw new BadRequestException('Failed to update subuser package');
    }
  }

  async getSubUserPackages(): Promise<SubUserPackageListResponse> {
    try {
      const endpoint = `${this.baseUrl}/${this.apiKey}/residentsubuser/packages`;
      
      const response = await firstValueFrom(
        this.httpService.get<ProxySellerApiResponse<SubUserPackageListResponse>>(endpoint)
      );

      if (!response.data.success || !response.data.data) {
        throw new BadRequestException(response.data.message || 'Failed to get subuser packages');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error('Error getting subuser packages:', error);
      throw new BadRequestException('Failed to get subuser packages');
    }
  }

  async deleteSubUserPackage(request: DeleteSubUserPackageRequest): Promise<void> {
    try {
      const endpoint = `${this.baseUrl}/${this.apiKey}/residentsubuser/delete`;
      
      const response = await firstValueFrom(
        this.httpService.delete<ProxySellerApiResponse<void>>(endpoint, { data: request })
      );

      if (!response.data.success) {
        throw new BadRequestException(response.data.message || 'Failed to delete subuser package');
      }
    } catch (error) {
      this.logger.error('Error deleting subuser package:', error);
      throw new BadRequestException('Failed to delete subuser package');
    }
  }

  // ==================== IP_LIST MANAGEMENT ====================

  async retrieveSubUserIPLists(query: RetrieveSubUserIPListsQuery = {}): Promise<IPListListResponse> {
    try {
      const endpoint = `${this.baseUrl}/${this.apiKey}/residentsubuser/lists`;
      
      const response = await firstValueFrom(
        this.httpService.get<ProxySellerApiResponse<IPListListResponse>>(endpoint, { params: query })
      );

      if (!response.data.success || !response.data.data) {
        throw new BadRequestException(response.data.message || 'Failed to retrieve IP lists');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error('Error retrieving IP lists:', error);
      throw new BadRequestException('Failed to retrieve IP lists');
    }
  }

  async createIPList(request: CreateIPListRequest): Promise<IPListResponse> {
    try {
      const endpoint = `${this.baseUrl}/${this.apiKey}/residentsubuser/list/add`;
      
      const response = await firstValueFrom(
        this.httpService.post<ProxySellerApiResponse<IPListResponse>>(endpoint, request)
      );

      if (!response.data.success || !response.data.data) {
        throw new BadRequestException(response.data.message || 'Failed to create IP list');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error('Error creating IP list:', error);
      throw new BadRequestException('Failed to create IP list');
    }
  }

  async renameIPList(request: RenameIPListRequest): Promise<IPListResponse> {
    try {
      const endpoint = `${this.baseUrl}/${this.apiKey}/residentsubuser/list/rename`;
      
      const response = await firstValueFrom(
        this.httpService.post<ProxySellerApiResponse<IPListResponse>>(endpoint, request)
      );

      if (!response.data.success || !response.data.data) {
        throw new BadRequestException(response.data.message || 'Failed to rename IP list');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error('Error renaming IP list:', error);
      throw new BadRequestException('Failed to rename IP list');
    }
  }

  async changeIPListRotation(request: ChangeIPListRotationRequest): Promise<IPListResponse> {
    try {
      const endpoint = `${this.baseUrl}/${this.apiKey}/residentsubuser/list/rotation`;
      
      const response = await firstValueFrom(
        this.httpService.post<ProxySellerApiResponse<IPListResponse>>(endpoint, request)
      );

      if (!response.data.success || !response.data.data) {
        throw new BadRequestException(response.data.message || 'Failed to change IP list rotation');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error('Error changing IP list rotation:', error);
      throw new BadRequestException('Failed to change IP list rotation');
    }
  }

  async deleteIPList(request: DeleteIPListRequest): Promise<void> {
    try {
      const endpoint = `${this.baseUrl}/${this.apiKey}/residentsubuser/list/delete`;
      
      const response = await firstValueFrom(
        this.httpService.delete<ProxySellerApiResponse<void>>(endpoint, { data: request })
      );

      if (!response.data.success) {
        throw new BadRequestException(response.data.message || 'Failed to delete IP list');
      }
    } catch (error) {
      this.logger.error('Error deleting IP list:', error);
      throw new BadRequestException('Failed to delete IP list');
    }
  }

  async createSpecialListForAPITool(request: CreateSpecialListForAPIToolRequest): Promise<IPListResponse> {
    try {
      const endpoint = `${this.baseUrl}/${this.apiKey}/residentsubuser/list/tools`;
      
      const response = await firstValueFrom(
        this.httpService.put<ProxySellerApiResponse<IPListResponse>>(endpoint, request)
      );

      if (!response.data.success || !response.data.data) {
        throw new BadRequestException(response.data.message || 'Failed to create special list for API tool');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error('Error creating special list for API tool:', error);
      throw new BadRequestException('Failed to create special list for API tool');
    }
  }

  // ==================== PRIVATE METHODS ====================

  private async storeProxiesLocally(apiProxies: ProxySellerProxyResponse[], createProxyDto: CreateProxyDto) {
    const proxies: ProxySellerProxy[] = [];

    for (const apiProxy of apiProxies) {
      const proxy = this.proxyRepository.create({
        proxy_name: `Proxy-${apiProxy.id}`,
        ip: apiProxy.ip,
        port: apiProxy.port,
        username: apiProxy.username,
        password: apiProxy.password,
        protocol: apiProxy.protocol as ProxySellerProxyProtocol,
        zone: apiProxy.zone,
        subaccountId: apiProxy.subaccount_id,
        note: apiProxy.note,
        status: this.mapApiStatusToLocal(apiProxy.status),
        expiresAt: new Date(apiProxy.expires_at),
        isTest: this.testMode,
        metadata: {
          api_proxy_id: apiProxy.id,
          created_via_api: true,
          original_request: createProxyDto
        }
      });

      proxies.push(await this.proxyRepository.save(proxy));
    }

    return proxies;
  }

  private async removeProxyFromLocal(proxyId: string) {
    const localProxy = await this.proxyRepository.findOne({
      where: { metadata: { api_proxy_id: proxyId } }
    });

    if (localProxy) {
      await this.proxyRepository.remove(localProxy);
    }
  }

  private mapApiStatusToLocal(apiStatus: string): ProxySellerProxyStatus {
    switch (apiStatus.toLowerCase()) {
      case 'active':
        return ProxySellerProxyStatus.ACTIVE;
      case 'expired':
        return ProxySellerProxyStatus.EXPIRED;
      case 'suspended':
        return ProxySellerProxyStatus.SUSPENDED;
      default:
        return ProxySellerProxyStatus.INACTIVE;
    }
  }
}
