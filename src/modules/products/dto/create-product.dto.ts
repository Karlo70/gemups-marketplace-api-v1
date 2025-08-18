import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, IsUUID, IsPositive, Min } from 'class-validator';
import { ProxiesProvider, ProductStatus } from '../entities/product.entity';
import { HasExtension, HasMimeType, IsFile, MemoryStoredFile } from 'nestjs-form-data';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @HasExtension(['jpeg', 'png', 'jpg'])
  @HasMimeType(['image/jpeg', 'image/png', 'image/jpg'])
  @IsFile({ message: 'Image must be an image' })
  @IsNotEmpty()
  image_url?: MemoryStoredFile;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price_per_ip: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price_flow: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(1000000000)
  flow: number;

  @IsNotEmpty()
  @IsEnum(ProxiesProvider)
  provider: ProxiesProvider;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsUUID()
  @IsNotEmpty()
  category_id: string;
}
