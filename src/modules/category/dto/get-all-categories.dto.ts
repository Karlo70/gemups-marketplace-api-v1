import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { GetAllDto } from 'src/shared/dtos/getAll.dto';
import { CategoryStatus } from '../entities/category.entity';

export class GetAllCategoriesDto extends GetAllDto {
  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;
}