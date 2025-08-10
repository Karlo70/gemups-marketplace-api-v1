import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { Match } from 'src/shared/custom-validators/match-fields.decorator';

export class ResetPasswordDto {
  @Transform(({ value }) => value.toLowerCase())
  @IsEmail({}, { message: 'invalid email format' })
  @IsNotEmpty()
  email: string;

  @MinLength(6)
  @IsString()
  @IsNotEmpty()
  password: string;

  @Match('password', { message: 'confirm_password must match password' })
  @IsString()
  @IsNotEmpty()
  confirm_password: string;

  @Length(6, 6, { message: 'otp_code must be 6 characters long' })
  @IsString()
  @IsNotEmpty()
  otp_code: string;
}
