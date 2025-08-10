import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { UserRole } from 'src/modules/users/entities/user.entity';
import { GetAllDto } from 'src/shared/dtos/getAll.dto';
import * as dayjs from 'dayjs';
import { PlanType } from 'src/modules/plans/entities/plan.entity';

export class GetAllInvoiceDto extends GetAllDto {
  @IsUUID('all', { message: 'invalid id' })
  @IsString()
  @IsOptional()
  subscription_id: string;

  @IsUUID('all', { message: 'invalid id' })
  @IsString()
  @IsOptional()
  user_id: string;

  @IsEnum(PlanType)
  @IsOptional()
  plan_type: PlanType

  @IsEnum([UserRole.CUSTOMER], {
    message: `the role must be ${UserRole.CUSTOMER}`,
  })
  @IsOptional()
  role: UserRole;

  @IsIn(['ASC', 'DESC'])
  @IsString()
  @IsOptional()
  order?: 'ASC' | 'DESC';

  @IsDateString()
  @Transform(({ value }) => dayjs(value).toISOString())
  @IsOptional()
  date_from?: string;
  
  @IsDateString()
  @Transform(({ value }) => dayjs(value).toISOString())
  @IsOptional()
  date_to?: string;
}
