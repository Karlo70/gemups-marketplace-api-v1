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
import { ProductStatus, ProxiesProvider } from '../entities/product.entity';
import { GetAllDto } from 'src/shared/dtos/getAll.dto';

export class GetAllProductsDto extends GetAllDto {

  @IsOptional()
  @IsEnum(ProxiesProvider)
  provider?: ProxiesProvider;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  category_id?: string;
}
