import { PartialType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { CreateTemplateDto } from './create-template.dto';
import { TemplateType } from '../entities/template.entity';
import { Transform } from 'class-transformer';

export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {
  @Transform(({ value }) => value?.trim())
  @Length(3, 100, {
    message: 'name must be 3 to 100 characters long',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @Transform(({ value }) => value?.trim())
  @Length(0, 500, {
    message: 'description must not exceed 500 characters',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @Transform(({ value }) => value?.trim())
  @Length(0, 200, {
    message: 'subject must not exceed 200 characters',
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsOptional()
  body?: string;

  @IsEnum(TemplateType, {
    message: `type must be one of: ${Object.values(TemplateType).join(', ')}`,
  })
  @IsOptional()
  type?: TemplateType;
}
