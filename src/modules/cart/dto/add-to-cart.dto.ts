import { IsNumber, IsPositive, IsUUID, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class AddToCartDto {
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
