import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, Min, IsDateString } from 'class-validator';
import { ProxyType, ProxyProtocol } from '../entities/proxy.entity';

export class CreateProxyDto {
  @IsString()
  proxyName: string;

  @IsEnum(ProxyType)
  proxyType: ProxyType;

  @IsOptional()
  @IsEnum(ProxyProtocol)
  protocol?: ProxyProtocol;

  @IsString()
  zone: string;

  @IsNumber()
  ptype: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  flow?: number; // Traffic quota in GB, 0 for unlimited

  @IsOptional()
  @IsNumber()
  @Min(1)
  ipCount?: number;

  @IsOptional()
  @IsString()
  region?: string; // ISO country code

  @IsOptional()
  @IsBoolean()
  isTest?: boolean;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
