import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TemplateType } from '../entities/template.entity';

export class GetAllTemplatesDto {
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  page?: number;

  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  per_page?: number;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(TemplateType, {
    message: `type must be one of: ${Object.values(TemplateType).join(', ')}`,
  })
  @IsOptional()
  type?: TemplateType;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsOptional()
  start_date?: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsOptional()
  end_date?: string;
} 