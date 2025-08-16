import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ProxySellerProxyProtocol } from '../entities/proxy-seller-proxy.entity';

export class CreateProxyDto {
  @IsString()
  zone: string;

  @IsEnum(ProxySellerProxyProtocol)
  protocol: ProxySellerProxyProtocol;

  @IsNumber()
  count: number;

  @IsNumber()
  duration: number; // in days

  @IsOptional()
  @IsString()
  subaccountId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
