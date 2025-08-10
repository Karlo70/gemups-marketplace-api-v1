import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { IndustryType } from '../enums/industries-enum';

export class CreateRelevanceLeadDto {
  @IsString()
  first_name?: string;

  @IsString()
  last_name?: string;

  @IsEmail()
  email?: string;

  @IsString()
  phone?: string;

  @IsString()
  company?: string;

  @IsString()
  position?: string;

  @IsString()
  language?: string;

  @IsString()
  country?: string;

  @IsString()
  message?: string;

  @IsString()
  email_body?: string;

  @IsString()
  subject?: string;

  @IsOptional()
  @IsEnum(IndustryType)
  industry?: IndustryType;

}
