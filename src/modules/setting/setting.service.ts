import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Like, Not } from 'typeorm';
import { CreateSettingDto, CreateProxyPricingSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto, UpdateProxyPricingSettingDto } from './dto/update-setting.dto';
import { GetAllSettingsDto, GetAllProxyPricingSettingsDto } from './dto/get-all-settings.dto';
import { Setting, ProxyPricingSetting, SettingType, ProxyType } from './entities/setting.entity';
import { ValidationException } from 'src/utils/validation-exception-formatter';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    @InjectRepository(ProxyPricingSetting)
    private readonly proxyPricingSettingRepository: Repository<ProxyPricingSetting>,
  ) {}

  // General Settings Methods
  async create(createSettingDto: CreateSettingDto) {
    const existingSetting = await this.settingRepository.findOne({
      where: {
        key: createSettingDto.key,
        type: createSettingDto.type,
        deleted_at: IsNull()
      },
    });

    if (existingSetting) {
      throw new ValidationException({
        key: 'Setting with this key and type already exists'
      });
    }

    const setting = this.settingRepository.create(createSettingDto);
    await setting.save();
    return setting;
  }

  async findAll(getAllDto: GetAllSettingsDto, paginationOptions: IPaginationOptions) {
    const queryBuilder = this.settingRepository
      .createQueryBuilder('setting')
      .where('setting.deleted_at IS NULL');

    if (getAllDto.search) {
      queryBuilder.andWhere(
        '(setting.key ILIKE :search OR setting.description ILIKE :search)',
        { search: `%${getAllDto.search}%` }
      );
    }

    if (getAllDto.type) {
      queryBuilder.andWhere('setting.type = :type', { type: getAllDto.type });
    }

    if (getAllDto.is_active !== undefined) {
      queryBuilder.andWhere('setting.is_active = :is_active', { is_active: getAllDto.is_active });
    }

    if (getAllDto.from) {
      queryBuilder.andWhere('setting.created_at >= :from', { from: getAllDto.from });
    }

    if (getAllDto.to) {
      queryBuilder.andWhere('setting.created_at <= :to', { to: getAllDto.to });
    }

    queryBuilder.orderBy('setting.created_at', 'DESC');

    return paginate(queryBuilder, paginationOptions);
  }

  async findOne(id: string) {
    const setting = await this.settingRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!setting) {
      throw new NotFoundException('Setting not found');
    }

    return setting;
  }

  async findByKey(key: string, type?: SettingType) {
    const whereCondition: any = { key, deleted_at: IsNull() };
    if (type) {
      whereCondition.type = type;
    }

    const setting = await this.settingRepository.findOne({
      where: whereCondition,
    });

    if (!setting) {
      throw new NotFoundException('Setting not found');
    }

    return setting;
  }

  async update(id: string, updateSettingDto: UpdateSettingDto) {
    const setting = await this.findOne(id);

    if (updateSettingDto.key && updateSettingDto.key !== setting.key) {
      const existingSetting = await this.settingRepository.findOne({
        where: {
          key: updateSettingDto.key,
          type: setting.type,
          deleted_at: IsNull(),
          id: Not(id)
        },
      });

      if (existingSetting) {
        throw new ValidationException({
          key: 'Setting with this key and type already exists'
        });
      }
    }

    Object.assign(setting, updateSettingDto);
    await setting.save();
    return setting;
  }

  async remove(id: string) {
    const setting = await this.findOne(id);
    setting.deleted_at = new Date();
    await setting.save();
    return { message: 'Setting deleted successfully' };
  }

  // Proxy Pricing Settings Methods
  async createProxyPricing(createProxyPricingDto: CreateProxyPricingSettingDto) {
    const existingPricing = await this.proxyPricingSettingRepository.findOne({
      where: {
        proxy_type: createProxyPricingDto.proxy_type,
        deleted_at: IsNull()
      },
    });

    if (existingPricing) {
      throw new ValidationException({
        proxy_type: 'Pricing for this proxy type already exists'
      });
    }

    const pricing = this.proxyPricingSettingRepository.create(createProxyPricingDto);
    await pricing.save();
    return pricing;
  }

  async findAllProxyPricing(getAllDto: GetAllProxyPricingSettingsDto, paginationOptions: IPaginationOptions) {
    const queryBuilder = this.proxyPricingSettingRepository
      .createQueryBuilder('pricing')
      .where('pricing.deleted_at IS NULL');

    if (getAllDto.proxy_type) {
      queryBuilder.andWhere('pricing.proxy_type = :proxy_type', { proxy_type: getAllDto.proxy_type });
    }

    if (getAllDto.is_active !== undefined) {
      queryBuilder.andWhere('pricing.is_active = :is_active', { is_active: getAllDto.is_active });
    }

    if (getAllDto.from) {
      queryBuilder.andWhere('pricing.created_at >= :from', { from: getAllDto.from });
    }

    if (getAllDto.to) {
      queryBuilder.andWhere('pricing.created_at <= :to', { to: getAllDto.to });
    }

    queryBuilder.orderBy('pricing.created_at', 'DESC');

    return paginate(queryBuilder, paginationOptions);
  }

  async findOneProxyPricing(id: string) {
    const pricing = await this.proxyPricingSettingRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!pricing) {
      throw new NotFoundException('Proxy pricing setting not found');
    }

    return pricing;
  }

  async findByProxyType(proxyType: ProxyType) {
    const pricing = await this.proxyPricingSettingRepository.findOne({
      where: { proxy_type: proxyType, deleted_at: IsNull(), is_active: true },
    });

    if (!pricing) {
      throw new NotFoundException(`Pricing for proxy type ${proxyType} not found`);
    }

    return pricing;
  }

  async updateProxyPricing(id: string, updateProxyPricingDto: UpdateProxyPricingSettingDto) {
    const pricing = await this.findOneProxyPricing(id);

    if (updateProxyPricingDto.proxy_type && updateProxyPricingDto.proxy_type !== pricing.proxy_type) {
      const existingPricing = await this.proxyPricingSettingRepository.findOne({
        where: {
          proxy_type: updateProxyPricingDto.proxy_type,
          deleted_at: IsNull(),
          id: Not(id)
        },
      });

      if (existingPricing) {
        throw new ValidationException({
          proxy_type: 'Pricing for this proxy type already exists'
        });
      }
    }

    Object.assign(pricing, updateProxyPricingDto);
    await pricing.save();
    return pricing;
  }

  async removeProxyPricing(id: string) {
    const pricing = await this.findOneProxyPricing(id);
    pricing.deleted_at = new Date();
    await pricing.save();
    return { message: 'Proxy pricing setting deleted successfully' };
  }

  // Utility Methods
  async calculateProxyPrice(proxyType: ProxyType, quantity: number, flowAmount: number, flowUnit: string = 'GB') {
    const pricing = await this.findByProxyType(proxyType);
    
    let basePrice = pricing.price_per_ip * quantity;
    let flowPrice = pricing.price_per_flow * flowAmount;
    
    // Apply flow unit conversion if needed
    if (flowUnit.toLowerCase() !== pricing.flow_unit.toLowerCase()) {
      flowPrice = this.convertFlowPrice(flowPrice, flowUnit, pricing.flow_unit);
    }
    
    // Apply quantity discounts
    if (quantity >= pricing.discount_threshold && pricing.discount_percentage > 0) {
      const discount = (basePrice + flowPrice) * (pricing.discount_percentage / 100);
      basePrice = basePrice - (basePrice * (pricing.discount_percentage / 100));
      flowPrice = flowPrice - (flowPrice * (pricing.discount_percentage / 100));
    }
    
    // Add setup and maintenance fees
    const setupFee = pricing.setup_fee;
    const maintenanceFee = pricing.maintenance_fee;
    
    const totalPrice = basePrice + flowPrice + setupFee + maintenanceFee;
    
    return {
      base_price: basePrice,
      flow_price: flowPrice,
      setup_fee: setupFee,
      maintenance_fee: maintenanceFee,
      discount_applied: pricing.discount_percentage > 0 && quantity >= pricing.discount_threshold,
      discount_percentage: pricing.discount_percentage,
      total_price: totalPrice,
      pricing_details: pricing
    };
  }

  private convertFlowPrice(price: number, fromUnit: string, toUnit: string): number {
    const conversionRates = {
      'MB': { 'GB': 1/1024, 'TB': 1/(1024*1024) },
      'GB': { 'MB': 1024, 'TB': 1/1024 },
      'TB': { 'MB': 1024*1024, 'GB': 1024 }
    };
    
    if (fromUnit.toLowerCase() === toUnit.toLowerCase()) {
      return price;
    }
    
    const rate = conversionRates[fromUnit.toUpperCase()]?.[toUnit.toUpperCase()];
    if (!rate) {
      return price; // Return original price if conversion not possible
    }
    
    return price * rate;
  }

  async getActiveSettings() {
    return this.settingRepository.find({
      where: { is_active: true, deleted_at: IsNull() },
      order: { created_at: 'DESC' }
    });
  }

  async getActiveProxyPricing() {
    return this.proxyPricingSettingRepository.find({
      where: { is_active: true, deleted_at: IsNull() },
      order: { created_at: 'DESC' }
    });
  }
} 