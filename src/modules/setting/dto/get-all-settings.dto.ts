import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { SettingType, ProxyType } from '../entities/setting.entity';

export class GetAllSettingsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SettingType)
  type?: SettingType;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}

export class GetAllProxyPricingSettingsDto {
  @IsOptional()
  @IsEnum(ProxyType)
  proxy_type?: ProxyType;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
