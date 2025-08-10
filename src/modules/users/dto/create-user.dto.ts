import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { Match } from 'src/shared/custom-validators/match-fields.decorator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
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

  @MinLength(6)
  @IsString()
  @IsNotEmpty()
  password: string;

  @Match('password', { message: 'confirm_password must match password' })
  @IsString()
  @IsNotEmpty()
  confirm_password: string;

  @IsEnum([UserRole.ADMIN, UserRole.CUSTOMER], {
    message: `the role must be ${UserRole.ADMIN}, ${UserRole.CUSTOMER}`,
  })
  @IsNotEmpty()
  role: UserRole;
}
