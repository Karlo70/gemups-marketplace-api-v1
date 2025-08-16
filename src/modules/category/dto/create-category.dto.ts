import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { HasExtension, MemoryStoredFile, IsFile, HasMimeType } from 'nestjs-form-data';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsOptional()
  @HasExtension(['jpeg', 'png', 'jpg'])
  @HasMimeType(['image/jpeg', 'image/png', 'image/jpg'])
  @IsFile({ message: 'Image must be an image' })
  @IsNotEmpty()
  image_url?: MemoryStoredFile;
}
