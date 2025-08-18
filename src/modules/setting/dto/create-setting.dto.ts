import { IsNotEmpty, IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsUUID, IsNumber, IsPositive } from 'class-validator';
import { SettingType, ProxyType, FlowUnit } from '../entities/setting.entity';

export class CreateSettingDto {
  @IsNotEmpty()
  @IsEnum(SettingType)
  type: SettingType;

  @IsNotEmpty()
  @IsString()
  key: string;

  @IsOptional()
  @IsObject()
  value?: any;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  metadata?: string;
}

export class CreateProxyPricingSettingDto {
  @IsNotEmpty()
  @IsEnum(ProxyType)
  proxy_type: ProxyType;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price_per_ip: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price_per_flow: number;

  @IsOptional()
  @IsEnum(FlowUnit)
  flow_unit?: FlowUnit;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  flow_multiplier?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  setup_fee?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  maintenance_fee?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  minimum_quantity?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  maximum_quantity?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  discount_percentage?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  discount_threshold?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  custom_pricing_rules?: any;
}
