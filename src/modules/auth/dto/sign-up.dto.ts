import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRole } from 'src/modules/users/entities/user.entity';
import { Match } from 'src/shared/custom-validators/match-fields.decorator';

export class SignUpDto {
  @Transform(({ value }) =>
    `${value?.slice(0, 1)?.toUpperCase()}${value?.slice(1)?.toLowerCase()}`.trim(),
  )
  @Matches(/^[^!@#$%^&*(),.?":{}|<>]*$/, {
    message: 'first_name should not contain special characters!',
  })
  @Length(3, 80, {
    message: 'first_name must be 3 to 80 characters long',
  })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @Transform(({ value }) =>
    `${value?.slice(0, 1)?.toUpperCase()}${value?.slice(1)?.toLowerCase()}`.trim(),
  )
  @Matches(/^[^!@#$%^&*(),.?":{}|<>]*$/, {
    message: 'last_name should not contain special characters!',
  })
  @Length(3, 80, {
    message: 'last_name must be 3 to 80 characters long',
  })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @Transform(({ value }) => value.toLowerCase())
  @IsEmail({}, { message: 'invalid email format' })
  @IsNotEmpty()
  email: string;

  @IsEnum([UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN], {
    message: `Role must be one of these: ${UserRole.CUSTOMER} OR ${UserRole.ADMIN} OR ${UserRole.SUPER_ADMIN}`,
  })
  @IsNotEmpty()
  role: UserRole;

  @MinLength(6)
  @IsString()
  @IsNotEmpty()
  password: string;

  @Match('password', { message: 'confirm_password must match password' })
  @IsString()
  @IsNotEmpty()
  confirm_password: string;
}
