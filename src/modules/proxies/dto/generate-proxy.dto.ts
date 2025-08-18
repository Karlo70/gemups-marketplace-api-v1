import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, IsUUID, IsBoolean } from 'class-validator';
import { ProxyType } from '../entities/proxy.entity';
import { ProxiesProvider } from 'src/modules/products/entities/product.entity';

export class GenerateProxyDto {
  @IsEnum(ProxyType)
  type: ProxyType;

  @IsEnum(ProxiesProvider)
  provider: ProxiesProvider;

  @IsString()
  flow: string;

  @IsOptional()
  @IsDateString()
  expire?: string;

  @IsOptional()
  @IsString()
  host?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsNumber()
  ptype?: number;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
