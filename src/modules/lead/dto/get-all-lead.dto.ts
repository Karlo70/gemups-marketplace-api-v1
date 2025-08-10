import { IsEmail, IsOptional, IsString } from "class-validator";
import { GetAllDto } from "src/shared/dtos/getAll.dto";

export class GetAllLeadDto extends GetAllDto {
  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  lead_from?: string;
}