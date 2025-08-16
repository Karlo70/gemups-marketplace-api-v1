import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaymentMethod } from '../../order/entities/order.entity';

export class CheckoutDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @IsOptional()
  metadata?: Record<string, any>;
}
