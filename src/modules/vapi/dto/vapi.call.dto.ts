import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

class VariableValuesDto {
  @IsDateString()
  @IsOptional()
  reservation_date_and_time: Date;

  @IsString()
  @IsOptional()
  number_of_people: string;
}

class AssistantOverridesDto {
  @IsObject()
  @IsNotEmpty()
  variable_values: VariableValuesDto;
}

// Main class
export class VapiCallDto {
  @IsString()
  @IsNotEmpty()
  assistant_id: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  phone_number_id?: string;

  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsObject()
  @IsNotEmpty()
  @IsOptional()
  assistant_overrides?: AssistantOverridesDto;

  @IsOptional()
  @IsString()
  lead_from?: string;
  
  @IsOptional()
  @IsString()
  contact_from?: string;
}
