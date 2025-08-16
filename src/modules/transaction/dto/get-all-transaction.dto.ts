import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  IsEnum,
} from 'class-validator';
import { GetAllDto } from 'src/shared/dtos/getAll.dto';
import { TransactionStatus, PaymentMethod, TransactionType } from '../entities/transaction.entity';

export class GetAllTransactionDto extends GetAllDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @IsOptional()
  @IsEnum(TransactionType)
  transaction_type?: TransactionType;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsPositive()
  @IsNumber()
  min_amount?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsPositive()
  @IsNumber()
  max_amount?: number;
}
