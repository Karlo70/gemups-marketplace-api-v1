import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, IsUUID, IsArray, IsObject } from 'class-validator';
import { ProxyType } from '../entities/proxy.entity';
import { ProxiesProvider } from 'src/modules/products/entities/product.entity';

export class CreateProxyDto {
  @IsEnum(ProxyType)
  type: ProxyType;

  @IsEnum(ProxiesProvider)
  provider: ProxiesProvider;

  @IsOptional()
  @IsString()
  provider_order_id?: string;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsString()
  port?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  total_flow?: number;

  @IsOptional()
  @IsString()
  flow_unit?: string;

  @IsOptional()
  @IsNumber()
  expires_at?: number;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  isp?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  user_id?: string;
}
