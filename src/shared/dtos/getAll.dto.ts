import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
} from 'class-validator';

export class GetAllDto {
  @IsString()
  @IsOptional()
  search?: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsPositive()
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @Transform(({ value }) => parseInt(value, 10))
  @Max(250, { message: "Per page can't be more than 100 records" })
  @IsPositive()
  @IsNumber()
  @IsOptional()
  per_page?: number = 10;

  @IsOptional()
  @IsString()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsString()
  @IsDateString()
  to?: string;
}
