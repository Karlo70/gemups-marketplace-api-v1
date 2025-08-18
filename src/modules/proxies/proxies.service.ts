import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Like } from 'typeorm';
import { CreateProxyDto } from './dto/create-proxy.dto';
import { UpdateProxyDto } from './dto/update-proxy.dto';
import { GenerateProxyDto } from './dto/generate-proxy.dto';
import { GetAllProxiesDto } from './dto/get-all-proxies.dto';
import { Proxy, ProxyStatus } from './entities/proxy.entity';
import { SevenElevenProxiesService } from '../seven-eleven-proxies/seven-eleven-proxies.service';
import { SettingService } from '../setting/setting.service';
import { Transaction } from '../transaction/entities/transaction.entity';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import * as dayjs from 'dayjs';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { User } from '../users/entities/user.entity';
import { ProxyType } from './entities/proxy.entity';
import { ProxiesProvider } from '../products/entities/product.entity';
import { TransactionType, TransactionStatus, PaymentMethod } from '../transaction/entities/transaction.entity';
import { TransactionManagerService } from '../../shared/services/transaction-manager.service';

@Injectable()
export class ProxiesService {
  private readonly logger = new Logger(ProxiesService.name);

  constructor(
    @InjectRepository(Proxy)
    private readonly proxyRepository: Repository<Proxy>,

    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,

    private readonly sevenElevenProxiesService: SevenElevenProxiesService,
    private readonly settingService: SettingService,
    private readonly transactionManagerService: TransactionManagerService,
  ) { }

  async create(createProxyDto: CreateProxyDto, user: User): Promise<Proxy> {
    try {
      const proxy = this.proxyRepository.create({ ...createProxyDto, user: user, activated_at: new Date() });
      await proxy.save();

      // Create transaction record if price is provided
      if (createProxyDto.price && createProxyDto.price > 0) {
        try {
          const transaction = this.transactionRepository.create({
            amount: createProxyDto.price,
            currency: 'USD',
            transaction_type: TransactionType.PAYMENT,
            status: TransactionStatus.COMPLETED,
            payment_method: PaymentMethod.CRYPTO,
            description: `Proxy creation - ${createProxyDto.type} proxy from ${createProxyDto.provider}`,
            user: user,
            proxy: proxy,
            wallet: user.cryptomus_wallet,
            metadata: {
              proxy_type: createProxyDto.type,
              provider: createProxyDto.provider,
              provider_order_id: createProxyDto.provider_order_id,
              flow_amount: createProxyDto.total_flow,
              flow_unit: createProxyDto.flow_unit,
            },
          });
          await transaction.save();

          this.logger.log(`Successfully created transaction record for proxy ID: ${proxy.id}`);
        } catch (transactionError) {
          this.logger.error('Failed to create transaction record', transactionError);
          // Don't throw error here as proxy was created successfully
          // Just log the transaction creation failure
        }
      }

      this.logger.log(`Successfully created proxy with ID: ${proxy.id}`);
      return proxy;
    } catch (error) {
      this.logger.error('Failed to create proxy', error);
      throw new BadRequestException('Failed to create proxy');
    }
  }

  async generateProxy(generateProxyDto: GenerateProxyDto, user: User): Promise<Proxy> {
    try {
      this.logger.log(`Generating proxy with type: ${generateProxyDto.type}, provider: ${generateProxyDto.provider}`);

      // Calculate pricing based on settings
      const pricing = await this.calculateProxyPricing(generateProxyDto);

      // Create proxy order based on provider
      let providerOrderId: string | undefined;
      let proxyData: any = {};

      if (generateProxyDto.provider === ProxiesProvider.SEVEN_ELEVEN_PROXIES) {
        // Use seven-eleven-proxies service to create order
        const orderResponse = await this.sevenElevenProxiesService.createOrder({
          flow: generateProxyDto.flow ? generateProxyDto.flow.toString() : "0", // generateProxyDto.flow 
          expire: generateProxyDto.expire ? dayjs(generateProxyDto.expire).unix().toString() : dayjs().add(90, 'day').unix().toString(),
          host: generateProxyDto.host,
        });

        providerOrderId = orderResponse?.['order_no'];
        proxyData = {
          ...generateProxyDto,
          provider_order_id: providerOrderId,
          price: pricing.totalPrice,
          username: orderResponse?.['username'],
          password: orderResponse?.['passwd'],
          port: orderResponse?.['port'],
          un: orderResponse?.['un'],
          total_flow: Number(pricing.total_flow).toFixed(0),
          flow_unit: pricing.flowUnit,
          status: ProxyStatus.ACTIVE,
          expires_at: orderResponse?.['expire'],
          metadata: {
            order_response: orderResponse,
            pricing_calculation: pricing,
          },
        };
      } else {
        // Handle other providers or custom proxies
        proxyData = {
          ...generateProxyDto,
          price: pricing.totalPrice,
          total_flow: Number(pricing.total_flow).toFixed(0),
          flow_unit: pricing.flowUnit,
          status: ProxyStatus.ACTIVE,
          expires_at: generateProxyDto.expire ? new Date(generateProxyDto.expire) : null,
          metadata: {
            pricing_calculation: pricing,
          },
        };
      }

      // Execute all database operations within a single transaction
      const saved_proxy = await this.transactionManagerService.executeInTransaction(async (queryRunner) => {
        // Create and save the proxy record
        const proxy = this.proxyRepository.create({
          user: user,
          city: proxyData.city,
          country: proxyData.country,
          ip_address: proxyData.ip_address,
          port: proxyData.port,
          username: proxyData.username,
          password: proxyData.password,
          type: proxyData.type,
          provider: proxyData.provider,
          provider_order_id: proxyData.provider_order_id,
          price: proxyData.price,
          un: proxyData.un,
          total_flow: Number(proxyData.total_flow),
          flow_unit: proxyData.flow_unit,
          status: proxyData.status,
          expires_at: proxyData.expires_at,
          metadata: proxyData.metadata,
          notes: proxyData.notes,
        });

        const savedProxy = await queryRunner.manager.save(proxy);

        // Create transaction record
        const transaction = this.transactionRepository.create({
          amount: pricing.totalPrice,
          currency: 'USD',
          transaction_type: TransactionType.PAYMENT,
          status: TransactionStatus.COMPLETED,
          payment_method: PaymentMethod.CRYPTO,
          description: `Proxy purchase - ${generateProxyDto.type} proxy from ${generateProxyDto.provider}`,
          user: user,
          proxy: savedProxy,
          wallet: user.cryptomus_wallet,
          metadata: {
            proxy_type: generateProxyDto.type,
            provider: generateProxyDto.provider,
            provider_order_id: providerOrderId,
            flow_amount: pricing.total_flow,
            flow_unit: pricing.flowUnit,
            pricing_calculation: pricing,
          },
        });
        await queryRunner.manager.save(transaction);

        // Update user wallet balance
        user.cryptomus_wallet.balance -= pricing.totalPrice;
        await queryRunner.manager.save(user.cryptomus_wallet);

        return savedProxy;
      });

      this.logger.log(`Successfully generated proxy with ID: ${saved_proxy.id}, Order ID: ${providerOrderId}`);
      return saved_proxy;
    } catch (error) {
      this.logger.error('Failed to generate proxy', error);
      throw new BadRequestException(`Failed to generate proxy: ${error.message}`);
    }
  }

  private async calculateProxyPricing(generateProxyDto: GenerateProxyDto): Promise<{
    totalPrice: number;
    total_flow: number;
    flowUnit: string;
    basePrice: number;
    setupFee: number;
    maintenanceFee: number;
    discount: number;
  }> {
    try {
      // Get proxy pricing settings
      const pricingSettings = await this.settingService.findAllProxyPricing({
        proxy_type: generateProxyDto.type,
      }, { page: 1, limit: 1 });

      if (!pricingSettings.items || pricingSettings.items.length === 0) {
        throw new BadRequestException(`No pricing settings found for proxy type: ${generateProxyDto.type}`);
      }

      const pricing = pricingSettings.items[0];

      // Parse flow amount and unit
      // Expecting flow as a number in bytes, e.g., 1000000000 for 1GB
      const flowInBytes = Number(generateProxyDto.flow);
      // if (isNaN(flowInBytes) || flowInBytes <= 0) {
      //   throw new BadRequestException('Invalid flow format. Provide flow as a positive number in bytes, e.g., 1000000000 for 1GB.');
      // }

      // Convert bytes to GB for pricing calculation
      const flowInGB = flowInBytes / (1024 * 1024 * 1024);

      // Validate flow constraints: Min(100000) Max(1000000)
      if (flowInBytes < 1000000) {
        throw new BadRequestException('Flow must be at least 1,000,000 bytes or 1GB');
      }
      if (flowInBytes > 100000000) {
        throw new BadRequestException('Flow cannot exceed 100,000,000 bytes or 100MB');
      }

      // For reporting, also determine the most appropriate unit and amount
      let total_flow = flowInBytes;
      let flowUnit = 'bytes';
      if (flowInBytes % (1024 * 1024 * 1024) === 0) {
        total_flow = flowInBytes / (1024 * 1024 * 1024);
        flowUnit = 'gb';
      } else if (flowInBytes % (1024 * 1024) === 0) {
        total_flow = flowInBytes / (1024 * 1024);
        flowUnit = 'mb';
      } else if (flowInBytes % 1024 === 0) {
        total_flow = flowInBytes / 1024;
        flowUnit = 'kb';
      }

      // Calculate base price
      const basePrice = flowInGB * pricing.price_per_flow;

      // Add setup fee
      const setupFee = pricing.setup_fee ?? 0;

      // Add maintenance fee
      const maintenanceFee = pricing.maintenance_fee ?? 0;

      // Calculate discount if applicable
      let discount = 0;
      if (flowInGB >= pricing.discount_threshold && pricing.discount_percentage > 0) {
        discount = (basePrice * pricing.discount_percentage) / 100;
      }


      const totalPrice = Number((Number(basePrice) + Number(setupFee) + Number(maintenanceFee) - Number(discount)).toFixed(2));

      return {
        totalPrice: Math.round(totalPrice * 10000) / 10000, // Round to 4 decimal places
        total_flow: total_flow,
        flowUnit: flowUnit,
        basePrice: Math.round(basePrice * 10000) / 10000,
        setupFee: Math.round(setupFee * 10000) / 10000,
        maintenanceFee: Math.round(maintenanceFee * 10000) / 10000,
        discount: Math.round(discount * 10000) / 10000,
      };
    } catch (error) {
      this.logger.error('Failed to calculate proxy pricing', error);
      throw new BadRequestException(`Failed to calculate pricing: ${error.message}`);
    }
  }

  async findAll(getAllDto: GetAllProxiesDto, paginationOptions: IPaginationOptions, user: User) {
    try {
      const queryBuilder = this.proxyRepository
        .createQueryBuilder('proxy')
        .leftJoinAndSelect('proxy.user', 'user')
        .where('proxy.deleted_at IS NULL');

      if (getAllDto.search) {
        queryBuilder.andWhere(
          '(proxy.ip_address ILIKE :search OR proxy.username ILIKE :search OR proxy.notes ILIKE :search)',
          { search: `%${getAllDto.search}%` }
        );
      }

      if (getAllDto.type) {
        queryBuilder.andWhere('proxy.type = :type', { type: getAllDto.type });
      }

      if (getAllDto.status) {
        queryBuilder.andWhere('proxy.status = :status', { status: getAllDto.status });
      }

      if (getAllDto.provider) {
        queryBuilder.andWhere('proxy.provider = :provider', { provider: getAllDto.provider });
      }

      if (getAllDto.user_id) {
        queryBuilder.andWhere('proxy.user_id = :user_id', { user_id: getAllDto.user_id });
      }

      if (getAllDto.from) {
        queryBuilder.andWhere('proxy.created_at >= :from', { from: getAllDto.from });
      }

      if (getAllDto.to) {
        queryBuilder.andWhere('proxy.created_at <= :to', { to: getAllDto.to });
      }

      queryBuilder.orderBy('proxy.created_at', 'DESC');

      return paginate(queryBuilder, paginationOptions);
    } catch (error) {
      this.logger.error('Failed to fetch proxies', error);
      throw new BadRequestException('Failed to fetch proxies');
    }
  }

  async myProxies(getAllDto: GetAllProxiesDto, user: User) {
    const { search, type, status, provider, user_id, from, to } = getAllDto;
    const proxies_query = await this.proxyRepository
      .createQueryBuilder('proxy')
      .leftJoinAndSelect('proxy.user', 'user')
      .where('proxy.user_id = :userId', { userId: user.id })
      .andWhere('proxy.deleted_at IS NULL')

    if (search) {
      proxies_query.andWhere(
        '(proxy.ip_address ILIKE :search OR proxy.username ILIKE :search OR proxy.notes ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (type) {
      proxies_query.andWhere('proxy.type = :type', { type: type });
    }

    if (status) {
      proxies_query.andWhere('proxy.status = :status', { status: status });
    }

    if (provider) {
      proxies_query.andWhere('proxy.provider = :provider', { provider: provider });
    }

    if (user_id) {
      proxies_query.andWhere('proxy.user_id = :user_id', { user_id: user_id });
    }

    if (from) {
      proxies_query.andWhere('proxy.created_at >= :from', { from: from });
    }

    if (to) {
      proxies_query.andWhere('proxy.created_at <= :to', { to: to });
    }

    proxies_query.orderBy('proxy.created_at', 'DESC');

    const paginationOptions: IPaginationOptions = {
      page: 1,
      limit: 10,
    };

    return paginate(proxies_query, paginationOptions);
  }

  async findOne(paramIdDto: ParamIdDto, user: User): Promise<Proxy> {
    try {
      const proxy = await this.proxyRepository.findOne({
        where: { id: paramIdDto.id, deleted_at: IsNull() },
        relations: ['user'],
      });

      if (!proxy) {
        throw new NotFoundException('Proxy not found');
      }

      const provider = proxy.provider;
      if (provider === ProxiesProvider.SEVEN_ELEVEN_PROXIES) {
        console.log("🚀 ~ OrderService ~ findOne ~ order.metadata.order_no:", proxy.provider_order_id)
        const orderData = await this.sevenElevenProxiesService.getOrderStatus(proxy.provider_order_id);
        proxy.metadata = {
          ...proxy.metadata,
          ...orderData,
        }
      }


      return proxy;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch proxy with ID: ${paramIdDto.id}`, error);
      throw new BadRequestException('Failed to fetch proxy');
    }
  }

  async update(paramIdDto: ParamIdDto, updateProxyDto: UpdateProxyDto, user: User): Promise<Proxy> {
    try {
      const proxy = await this.findOne(paramIdDto, user);

      Object.assign(proxy, updateProxyDto);
      await proxy.save();

      this.logger.log(`Successfully updated proxy with ID: ${paramIdDto.id}`);
      return proxy;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update proxy with ID: ${paramIdDto.id}`, error);
      throw new BadRequestException('Failed to update proxy');
    }
  }

  async remove(paramIdDto: ParamIdDto, user: User): Promise<void> {
    try {
      const proxy = await this.findOne(paramIdDto, user);

      proxy.deleted_at = new Date();
      await proxy.save();

      this.logger.log(`Successfully deleted proxy with ID: ${paramIdDto.id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete proxy with ID: ${paramIdDto.id}`, error);
      throw new BadRequestException('Failed to delete proxy');
    }
  }

  async updateProxyStatus(paramIdDto: ParamIdDto, status: ProxyStatus, user: User): Promise<Proxy> {
    try {
      const proxy = await this.findOne(paramIdDto, user);

      proxy.status = status;
      if (status === ProxyStatus.ACTIVE) {
        proxy.activated_at = new Date();
      }

      await proxy.save();

      this.logger.log(`Successfully updated proxy status to ${status} for ID: ${paramIdDto.id}`);
      return proxy;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update proxy status for ID: ${paramIdDto.id}`, error);
      throw new BadRequestException('Failed to update proxy status');
    }
  }

  async getProviderForm(provider: string): Promise<any> {
    try {
      const providerForms = {
        [ProxiesProvider.SEVEN_ELEVEN_PROXIES]: {
          provider: ProxiesProvider.SEVEN_ELEVEN_PROXIES,
          description: 'Seven Eleven Proxy Service - High-quality residential and datacenter proxies',
          fields: [
            {
              name: 'type',
              type: 'select',
              required: true,
              label: 'Proxy Type',
              placeholder: 'Select proxy type',
              options: [
                { value: ProxyType.RESIDENTIAL, label: 'Residential' },
                // { value: ProxyType.DATACENTER, label: 'Datacenter' },
                // { value: ProxyType.MOBILE, label: 'Mobile' },
                // { value: ProxyType.ROTATING, label: 'Rotating' },
              ],
              validation: 'required',
              description: 'Choose the type of proxy you need',
            },
            {
              name: 'flow',
              type: 'string',
              required: true,
              label: 'Flow Amount',
              placeholder: 'e.g., 1 GB, 500 MB, 2 TB',
              validation: 'required|regex:/^\\d+(\\.\\d+)?\\s*(gb|mb|tb)$/i',
              description: 'Specify the data flow amount with unit (GB, MB, TB)',
            },
            {
              name: 'expire',
              type: 'date',
              required: false,
              label: 'Expiration Date',
              placeholder: 'Select expiration date',
              validation: 'date|after:today',
              description: 'Optional: Set when the proxy should expire',
            },
            {
              name: 'host',
              type: 'string',
              required: false,
              label: 'Host',
              placeholder: 'e.g., example.com',
              validation: 'url',
              description: 'Optional: Specify the target host for the proxy',
            },
            {
              name: 'notes',
              type: 'string',
              required: false,
              label: 'Notes',
              placeholder: 'Additional notes about this proxy',
              validation: 'max:500',
              description: 'Optional: Add any additional information',
            },
          ],
        },
        [ProxiesProvider.PROXY_SELLER_PROXIES]: {
          provider: ProxiesProvider.PROXY_SELLER_PROXIES,
          description: 'Proxy Seller Service - Premium proxy solutions with global coverage',
          fields: [
            {
              name: 'type',
              type: 'select',
              required: true,
              label: 'Proxy Type',
              placeholder: 'Select proxy type',
              options: [
                { value: ProxyType.RESIDENTIAL, label: 'Residential' },
                { value: ProxyType.DATACENTER, label: 'Datacenter' },
                { value: ProxyType.MOBILE, label: 'Mobile' },
                { value: ProxyType.ROTATING, label: 'Rotating' },
              ],
              validation: 'required',
              description: 'Choose the type of proxy you need',
            },
            {
              name: 'flow',
              type: 'string',
              required: true,
              label: 'Flow Amount',
              placeholder: 'e.g., 1 GB, 500 MB, 2 TB',
              validation: 'required|regex:/^\\d+(\\.\\d+)?\\s*(gb|mb|tb)$/i',
              description: 'Specify the data flow amount with unit (GB, MB, TB)',
            },
            {
              name: 'zone',
              type: 'string',
              required: false,
              label: 'Zone',
              placeholder: 'e.g., us, eu, asia',
              validation: 'string',
              description: 'Optional: Specify the geographic zone for the proxy',
            },
            {
              name: 'ptype',
              type: 'number',
              required: false,
              label: 'Proxy Type ID',
              placeholder: 'e.g., 1, 2, 3',
              validation: 'integer|min:1',
              description: 'Optional: Specific proxy type identifier',
            },
            {
              name: 'region',
              type: 'string',
              required: false,
              label: 'Region',
              placeholder: 'e.g., United States, Europe',
              validation: 'string',
              description: 'Optional: Specify the geographic region',
            },
            {
              name: 'notes',
              type: 'string',
              required: false,
              label: 'Notes',
              placeholder: 'Additional notes about this proxy',
              validation: 'max:500',
              description: 'Optional: Add any additional information',
            },
          ],
        },
      };

      const form = providerForms[provider];
      if (!form) {
        throw new BadRequestException(`Provider '${provider}' not supported`);
      }

      return form;
    } catch (error) {
      this.logger.error(`Failed to get provider form for: ${provider}`, error);
      throw new BadRequestException(`Failed to get provider form: ${error.message}`);
    }
  }
}
