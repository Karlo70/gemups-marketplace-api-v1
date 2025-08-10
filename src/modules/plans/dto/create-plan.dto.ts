import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  ValidateIf,
  Max,
  IsInt,
} from 'class-validator';
import { PlanType, BillingDuration } from '../entities/plan.entity';
import { BadRequestException } from '@nestjs/common';

// 🔹 Base Plan DTO (Common Fields)
export class CreatePlanDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'This field is required' })
  great_for_use: string;

  @IsString()
  @IsNotEmpty({ message: 'Short description is required' })
  short_description: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one point is required' })
  @IsString({ each: true })
  points: string[];

  @Min(1)
  @Max(365)
  @IsInt()
  @ValidateIf((o: CreatePlanDto) => {
    if (o.plan_type === PlanType.FREE) {
      return true; // allow other validators to apply
    } else {
      o.free_duration = undefined; // force unset for paid plans
      return false; // skip other validators
    }
  })
  @IsNotEmpty({ message: 'Free Duration is required for free plans' })
  free_duration?: number; // Number of days (optional)

  @IsEnum(PlanType)
  plan_type: PlanType;

  @IsEnum(BillingDuration)
  @ValidateIf((o: CreatePlanDto) => o.plan_type !== PlanType.FREE)
  @IsNotEmpty({ message: 'Billing duration is required for paid plans' })
  billing_duration: BillingDuration;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ValidateIf(
    (o: CreatePlanDto) => o.billing_duration !== BillingDuration.MONTHLY,
  )
  @IsNotEmpty({ message: 'Monthly price is required for paid plans' })
  monthly_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ValidateIf(
    (o: CreatePlanDto) => o.billing_duration !== BillingDuration.YEARLY,
  )
  @IsNotEmpty({ message: 'Yearly price is required for paid plans' })
  yearly_price?: number;
}
