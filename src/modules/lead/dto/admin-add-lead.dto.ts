import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsEnum,
} from 'class-validator';
import { IndustryType } from '../enums/industries-enum';

export class AdminAddLeadDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber()
  phone: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  company_name?: string;

  @IsString()
  lead_from?: string;

  @IsOptional()
  @IsEnum(IndustryType)
  industry?: IndustryType;
 }
