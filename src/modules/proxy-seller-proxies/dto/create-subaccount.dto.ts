import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateSubAccountDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
