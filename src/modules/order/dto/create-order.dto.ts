import { IsNumber, IsString, IsEnum, IsOptional, Min, IsPositive, IsUUID, IsNotEmpty, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/order.entity';

export class OrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  countryId?: number; // Country ID for proxy location (e.g., 1 for US)

  @IsOptional()
  @IsString()
  periodId?: string; // Period ID for proxy duration (e.g., '30' for 30 days)

  @IsOptional()
  @IsString()
  customTargetName?: string; // Custom target name for the proxy order

  @IsOptional()
  @IsString()
  coupon?: string; // Coupon code for discount
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[]; // Array of order items with product details and proxy configuration

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  host?: string;

  @IsOptional()
  @IsString()
  expire_at?: string;
}
