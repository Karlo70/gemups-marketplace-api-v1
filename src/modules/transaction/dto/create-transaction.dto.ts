import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { TransactionType, PaymentMethod, TransactionStatus } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @IsNotEmpty()
  @IsEnum(TransactionType)
  transaction_type: TransactionType;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus = TransactionStatus.PENDING;

  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @IsOptional()
  @IsString()
  payment_provider?: string;

  @IsOptional()
  @IsString()
  payment_transaction_id?: string;

  @IsOptional()
  @IsString()
  gateway_transaction_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsUUID()
  order_id?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsDateString()
  processed_at?: string;

  @IsOptional()
  @IsDateString()
  failed_at?: string;

  @IsOptional()
  @IsDateString()
  refunded_at?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  refunded_amount?: number;

  @IsOptional()
  @IsString()
  refund_reason?: string;
}
