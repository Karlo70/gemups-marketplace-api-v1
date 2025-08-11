import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, Min, IsUrl } from 'class-validator';
import { NetworkType, WalletStatus } from '../entities/wallet.entity';

export class CreateWalletDto {
  @IsString()
  walletName: string;

  @IsString()
  walletAddress: string;

  @IsEnum(NetworkType)
  network: NetworkType;

  @IsString()
  currency: string;

  @IsString()
  currencySymbol: string;

  @IsEnum(WalletStatus)
  @IsOptional()
  status?: WalletStatus;

  @IsBoolean()
  @IsOptional()
  isTest?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  dailyLimit?: number;

  @IsString()
  merchantId: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsOptional()
  webhookSecret?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
