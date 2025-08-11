import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { PaymentStatus } from '../entities/payment.entity';

export class CryptomusWebhookDto {
  @IsString()
  type: string;

  @IsString()
  uuid: string;

  @IsString()
  orderId: string;

  @IsString()
  status: string;

  @IsString()
  @IsOptional()
  paymentId?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  network?: string;

  @IsString()
  @IsOptional()
  txHash?: string;

  @IsString()
  @IsOptional()
  walletAddress?: string;

  @IsBoolean()
  @IsOptional()
  isTest?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  signature?: string;
}
