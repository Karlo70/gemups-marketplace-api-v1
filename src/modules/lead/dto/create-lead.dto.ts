import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { IndustryType } from '../enums/industries-enum';

export class CreateLeadDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  company_name?: string;

  @IsNotEmpty()
  @IsString()
  turnstileToken: string;

  @IsOptional()
  @IsString()
  lead_from?: string;
 
  @IsOptional()
  @IsString()
  contact_from?: string;

  @IsOptional()
  @IsEnum(IndustryType)
  industry?: IndustryType;
}
