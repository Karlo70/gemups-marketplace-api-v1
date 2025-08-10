import { Transform } from 'class-transformer';
import { IsNotEmpty, IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @Transform(({ value }: { value: string }) => value.toLowerCase().trim())
  @IsEmail({}, { message: 'Enter Valid email' })
  @IsNotEmpty()
  email: string;
}
