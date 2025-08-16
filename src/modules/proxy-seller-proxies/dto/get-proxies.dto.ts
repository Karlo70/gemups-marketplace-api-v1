import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProxySellerProxyProtocol, ProxySellerProxyStatus } from '../entities/proxy-seller-proxy.entity';

export class GetProxiesDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  perPage?: number = 20;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsEnum(ProxySellerProxyProtocol)
  protocol?: ProxySellerProxyProtocol;

  @IsOptional()
  @IsEnum(ProxySellerProxyStatus)
  status?: ProxySellerProxyStatus;

  @IsOptional()
  @IsString()
  subaccountId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isTest?: boolean;

  @IsOptional()
  @IsString()
  ownerId?: string;
}
