import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpCodeDto {
  @Transform(({ value }) => value.toLowerCase())
  @IsEmail({}, { message: 'invalid email format' })
  @IsNotEmpty()
  email: string;

  @Length(6, 6, { message: 'otp_code must be 6 characters long' })
  @IsString()
  @IsNotEmpty()
  otp_code: string;
}
