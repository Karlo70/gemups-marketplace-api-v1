import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsBoolean, IsObject } from 'class-validator';
import { ProxySellerProxyProtocol, ProxySellerProxyStatus } from '../entities/proxy-seller-proxy.entity';

export class CreateProxySellerProxyDto {
  @IsString()
  proxyName: string;

  @IsString()
  ip: string;

  @IsNumber()
  port: number;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsEnum(ProxySellerProxyProtocol)
  protocol: ProxySellerProxyProtocol;

  @IsString()
  zone: string;

  @IsOptional()
  @IsString()
  subaccountId?: string;

  @IsOptional()
  @IsString()
  subaccountUsername?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(ProxySellerProxyStatus)
  status?: ProxySellerProxyStatus;

  @IsOptional()
  @IsDateString()
  expiresAt?: Date;

  @IsOptional()
  @IsBoolean()
  isTest?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  ownerId?: string;
}
