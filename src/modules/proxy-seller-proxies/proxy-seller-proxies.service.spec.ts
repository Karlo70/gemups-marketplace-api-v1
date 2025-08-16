import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { of } from 'rxjs';
import { ProxySellerProxiesService } from './proxy-seller-sub-user-proxies.service';
import { ProxySellerProxy } from './entities/proxy-seller-proxy.entity';
import { CreateProxySellerProxyDto } from './dto/create-proxy-seller-proxy.dto';
import { CreateSubaccountDto } from './dto/create-subaccount.dto';
import { CreateProxyDto } from './dto/create-proxy.dto';

describe('ProxySellerProxiesService', () => {
  let service: ProxySellerProxiesService;
  let proxyRepository: Repository<ProxySellerProxy>;
  let configService: ConfigService;
  let httpService: HttpService;

  const mockProxyRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    })),
    remove: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'proxySeller.baseUrl': 'https://test-api.proxy-seller.com',
        'proxySeller.apiKey': 'test-api-key',
        'proxySeller.testMode': true,
      };
      return config[key];
    }),
  };

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxySellerProxiesService,
        {
          provide: getRepositoryToken(ProxySellerProxy),
          useValue: mockProxyRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<ProxySellerProxiesService>(ProxySellerProxiesService);
    proxyRepository = module.get<Repository<ProxySellerProxy>>(getRepositoryToken(ProxySellerProxy));
    configService = module.get<ConfigService>(ConfigService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new proxy', async () => {
      const createDto: CreateProxySellerProxyDto = {
        proxyName: 'Test Proxy',
        ip: '192.168.1.1',
        port: 8080,
        username: 'testuser',
        password: 'testpass',
        protocol: 'http' as any,
        zone: 'us',
      };

      const mockProxy = { id: '1', ...createDto } as ProxySellerProxy;
      mockProxyRepository.create.mockReturnValue(mockProxy);
      mockProxyRepository.save.mockResolvedValue(mockProxy);

      const result = await service.create(createDto);

      expect(mockProxyRepository.create).toHaveBeenCalledWith({
        ...createDto,
        expiresAt: undefined,
        isTest: true,
      });
      expect(mockProxyRepository.save).toHaveBeenCalledWith(mockProxy);
      expect(result).toEqual(mockProxy);
    });
  });

  describe('findAll', () => {
    it('should return proxies with pagination', async () => {
      const mockProxies = [{ id: '1', proxyName: 'Test Proxy' }] as ProxySellerProxy[];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockProxies, 1]),
      };

      mockProxyRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({ page: 1, perPage: 20 });

      expect(result).toEqual({ proxies: mockProxies, total: 1 });
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a proxy by id', async () => {
      const mockProxy = { id: '1', proxyName: 'Test Proxy' } as ProxySellerProxy;
      mockProxyRepository.findOne.mockResolvedValue(mockProxy);

      const result = await service.findOne('1');

      expect(mockProxyRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['owner'],
      });
      expect(result).toEqual(mockProxy);
    });

    it('should throw NotFoundException when proxy not found', async () => {
      mockProxyRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow('Proxy not found');
    });
  });

  describe('createSubaccount', () => {
    it('should create a subaccount via API', async () => {
      const createDto: CreateSubaccountDto = {
        username: 'testuser',
        password: 'testpass',
        email: 'test@example.com',
      };

      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            username: 'testuser',
            status: 'active',
          },
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.createSubaccount(createDto);

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://test-api.proxy-seller.com/subaccounts',
        createDto,
        {
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should throw BadRequestException when API call fails', async () => {
      const createDto: CreateSubaccountDto = {
        username: 'testuser',
        password: 'testpass',
      };

      const mockResponse = {
        data: {
          success: false,
          message: 'API Error',
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      await expect(service.createSubaccount(createDto)).rejects.toThrow('API Error');
    });
  });

  describe('createProxyViaApi', () => {
    it('should create proxies via API', async () => {
      const createDto: CreateProxyDto = {
        zone: 'us',
        protocol: 'http' as any,
        count: 2,
        duration: 30,
      };

      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: '1',
              ip: '192.168.1.1',
              port: 8080,
              username: 'user1',
              password: 'pass1',
              protocol: 'http',
              zone: 'us',
              expires_at: '2024-12-31T23:59:59Z',
              status: 'active',
            },
            {
              id: '2',
              ip: '192.168.1.2',
              port: 8081,
              username: 'user2',
              password: 'pass2',
              protocol: 'http',
              zone: 'us',
              expires_at: '2024-12-31T23:59:59Z',
              status: 'active',
            },
          ],
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));
      mockProxyRepository.create.mockReturnValue({} as ProxySellerProxy);
      mockProxyRepository.save.mockResolvedValue({} as ProxySellerProxy);

      const result = await service.createProxyViaApi(createDto);

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://test-api.proxy-seller.com/proxies',
        createDto,
        {
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockResponse.data.data);
    });
  });

  describe('getBalance', () => {
    it('should return account balance', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            traffic_balance: 100,
            ip_balance: 50,
            currency: 'USD',
            account_status: 'active',
          },
        },
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getBalance();

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://test-api.proxy-seller.com/balance',
        {
          headers: {
            'Authorization': 'Bearer test-api-key',
          },
        }
      );
      expect(result).toEqual(mockResponse.data.data);
    });
  });

  describe('getUsageStatistics', () => {
    it('should return usage statistics', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              username: 'testuser',
              date: '2024-01-01',
              traffic_used: 10,
              ip_rotations: 5,
              requests_count: 1000,
              successful_requests: 950,
              failed_requests: 50,
              average_response_time: 200,
            },
          ],
        },
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getUsageStatistics('testuser', '2024-01-01');

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://test-api.proxy-seller.com/usage?username=testuser&start_date=2024-01-01',
        {
          headers: {
            'Authorization': 'Bearer test-api-key',
          },
        }
      );
      expect(result).toEqual(mockResponse.data.data);
    });
  });
});
