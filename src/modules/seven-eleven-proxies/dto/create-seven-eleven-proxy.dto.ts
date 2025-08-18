import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsDate, IsDateString } from 'class-validator';

// Base DTO for authentication
export class AuthDto {
  @IsString()
  username?: string;

  @IsString()
  passwd?: string;
}

// DTO for creating orders
export class CreateOrderDto {
    
  @IsString()
  flow: string;

  @IsOptional()
  @IsDateString()
  expire?: string;

  @IsOptional()
  @IsString()
  host?: string;
}

// DTO for getting order status
export class GetOrderStatusDto {
  @IsString()
  orderNo: string;
}

// DTO for applying restitution order
export class ApplyRestitutionOrderDto {
  @IsString()
  orderNo: string;

  @IsString()
  reason: string;
}

// DTO for changing user pass status
export class ChangeUserPassStatusDto {
  @IsString()
  username: string;

  @IsBoolean()
  status: boolean;
}

// DTO for creating allocation order
export class CreateAllocationOrderDto {
  @IsString()
  zone: string;

  @IsNumber()
  ptype: number;

  @IsNumber()
  count: number;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  proto?: string;
}

// DTO for whitelist operations
export class WhitelistDto {
  @IsString()
  ip: string;

  @IsOptional()
  @IsString()
  description?: string;
}

// DTO for getting whitelist info
export class WhitelistInfoDto {
  @IsOptional()
  @IsString()
  ip?: string;
}

// DTO for getting statement
export class StatementDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  username?: string;
}

// Main DTO that extends the base create DTO
export class CreateSevenElevenProxyDto extends AuthDto {
  @IsOptional()
  @IsString()
  proxyName?: string;

  @IsOptional()
  @IsString()
  proxyType?: string;

  @IsOptional()
  @IsString()
  protocol?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  ptype?: number;

  @IsOptional()
  @IsString()
  flow?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsBoolean()
  isTest?: boolean;

  @IsOptional()
  @IsString()
  host?: string;

  @IsOptional()
  @IsDateString()
  expire?: string;
}
