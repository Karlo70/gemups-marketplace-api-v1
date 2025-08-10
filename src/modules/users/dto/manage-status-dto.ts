import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from '../entities/user.entity';

export class ManageStatusDto {
  @IsEnum(UserStatus)
  @IsNotEmpty()
  status: UserStatus;
}
