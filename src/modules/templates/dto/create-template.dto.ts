import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { TemplateStatus, TemplateType } from '../entities/template.entity';

export class CreateTemplateDto {
  @Transform(({ value }) => value?.trim())
  @Length(3, 100, {
    message: 'name must be 3 to 100 characters long',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Transform(({ value }) => value?.trim())
  @Length(0, 500, {
    message: 'description must not exceed 500 characters',
  })
  @IsString()
  description: string;

  @Transform(({ value }) => value?.trim())
  @Length(0, 200, {
    message: 'subject must not exceed 200 characters',
  })
  @IsString()
  subject: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  body: string;

  @IsEnum(TemplateType, {
    message: `type must be one of: ${Object.values(TemplateType).join(', ')}`,
  })
  @IsNotEmpty()
  type: TemplateType;

  @IsEnum(TemplateStatus, {
    message: `status must be one of: ${Object.values(TemplateStatus).join(', ')}`,
  })
  @IsOptional()
  status?: TemplateStatus;
}
