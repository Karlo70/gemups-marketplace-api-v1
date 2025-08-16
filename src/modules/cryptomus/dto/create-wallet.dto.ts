import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, Min, IsUrl } from 'class-validator';
import {  WalletStatus } from '../entities/wallet.entity';

export class CreateWalletDto {

  @IsString()
  network: string;

  @IsString()
  currency: string;

  @IsEnum(WalletStatus)
  @IsOptional()
  status?: WalletStatus;

  @IsBoolean()
  @IsOptional()
  is_test?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  success_url?: string;

  @IsString()
  @IsOptional()
  from_referral_code?: string;
}
