import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { BillingDuration, PlanType } from '../entities/plan.entity';
import { GetAllDto } from 'src/shared/dtos/getAll.dto';

export class GetAllPlansDto extends GetAllDto {

  @IsOptional()
  @IsEnum(PlanType)
  plan_type?: PlanType; // Filter by FREE or PAID

  @IsOptional()
  @IsEnum(BillingDuration)
  billing_duration?: BillingDuration; // Filter by Monthly or Yearly

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  not_archived?: boolean;
}
