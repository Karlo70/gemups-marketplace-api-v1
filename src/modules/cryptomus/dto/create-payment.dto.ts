import { IsString, IsNumber, IsOptional, IsEnum, IsUrl, IsUUID, Min, IsBoolean } from 'class-validator';
import { PaymentType } from '../entities/payment.entity';
import { NetworkType } from '../entities/wallet.entity';

export class CreatePaymentDto {
  @IsString()
  orderId: string;

  @IsNumber()
  @Min(0.00000001)
  amount: number;

  @IsString()
  currency: string;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsUrl()
  callbackUrl?: string;

  @IsOptional()
  @IsUrl()
  returnUrl?: string;

  @IsOptional()
  @IsEnum(NetworkType)
  preferredNetwork?: NetworkType;

  @IsOptional()
  @IsUUID()
  walletId?: string;

  @IsOptional()
  @IsBoolean()
  isTest?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;
}
