import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Match } from 'src/shared/custom-validators/match-fields.decorator';

export class ChangePasswordDto {
  @MinLength(6)
  @IsString()
  @IsNotEmpty()
  password: string;

  @MinLength(6)
  @IsString()
  @IsNotEmpty()
  new_password: string;

  @Match('new_password', { message: 'confirm_password must match new password' })
  @IsString()
  @IsNotEmpty()
  confirm_password: string;
}
