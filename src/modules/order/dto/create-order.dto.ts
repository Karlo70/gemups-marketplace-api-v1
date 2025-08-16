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
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

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
