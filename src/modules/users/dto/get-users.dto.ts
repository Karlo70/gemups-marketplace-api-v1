import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../entities/user.entity';
import { GetAllDto } from 'src/shared/dtos/getAll.dto';

export class GetUsersDto extends GetAllDto {
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  status?: string;
}
