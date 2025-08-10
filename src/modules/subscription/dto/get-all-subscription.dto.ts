import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PlanType } from 'src/modules/plans/entities/plan.entity';
import { GetAllDto } from 'src/shared/dtos/getAll.dto';
import { UserRole, UserStatus } from 'src/modules/users/entities/user.entity';

export class GetAllSubscriptionsDto extends GetAllDto {
  @IsEnum(PlanType)
  @IsOptional()
  plan_type?: PlanType;

  @IsString()
  @IsOptional()
  plan_id?: string;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsArray()
  @IsEnum(UserRole, { each: true })
  @IsOptional()
  roles?: UserRole[];

}
