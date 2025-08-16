import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, IsUUID, IsPositive } from 'class-validator';
import { providers, ProductStatus } from '../entities/product.entity';
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
  @IsEnum(providers)
  provider: providers;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsUUID()
  @IsNotEmpty()
  category_id: string;
}
