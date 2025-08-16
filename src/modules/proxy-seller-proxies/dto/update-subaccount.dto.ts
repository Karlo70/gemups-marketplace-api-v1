import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';

export enum SubaccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export class UpdateSubAccountDto {
  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(SubaccountStatus)
  status?: SubaccountStatus;
}
