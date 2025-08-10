import { PartialType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateIf,
} from 'class-validator';
import { SignUpDto } from 'src/modules/auth/dto/sign-up.dto';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto extends PartialType(SignUpDto) {
  @IsEnum([UserRole.ADMIN, UserRole.CUSTOMER], {
    message: `role must be one of these: ${UserRole.ADMIN}  ${UserRole.CUSTOMER}`,
  })
  @IsOptional()
  role: UserRole;

  @Length(7, 15, { message: 'phoneNumber must be between 7 to 15 digits ' })
  @IsString()
  @ValidateIf(({ phone_no }) => {
    if (phone_no?.length > 0) {
      return true;
    }
    return false;
  })
  phone_no: string;

  @IsUUID('all', { message: 'invalid id' })
  @IsString()
  @ValidateIf(({ country_id }) => {
    if (country_id?.length > 0) {
      return true;
    }
    return false;
  })
  country_id: string;

  @IsUUID('all', { message: 'invalid id' })
  @IsString()
  @ValidateIf(({ company_type_id }) => {
    if (company_type_id?.length > 0) {
      return true;
    }
    return false;
  })
  company_type_id: string;
}
