
import { ValidationException } from 'src/utils/validation-exception-formatter';
import { BillingDuration, PlanType } from '../entities/plan.entity';
import { BadRequestException } from '@nestjs/common';
import { UpdatePlanDto } from '../dto/update-plan.dto';

export function validatePlanInput(data: UpdatePlanDto) {
  if (data.plan_type === PlanType.PAID) {
    if (!data.billing_duration) {
      throw new ValidationException({ billing_duration: 'Billing duration is required for paid plans' });
    }

    if (data.billing_duration === BillingDuration.MONTHLY && !data.monthly_price) {
      throw new ValidationException({ monthly_price: 'Monthly price is required when billing duration is monthly' });
    }

    if (data.billing_duration === BillingDuration.YEARLY && !data.yearly_price) {
      throw new ValidationException({ yearly_price: 'Yearly price is required when billing duration is yearly' });
    }

    if (data.billing_duration === BillingDuration.MONTHLY && data.yearly_price) {
      throw new BadRequestException('Yearly price is not allowed when billing duration is monthly');
    }

    if (data.billing_duration === BillingDuration.YEARLY && data.monthly_price) {
      throw new BadRequestException('Monthly price is not allowed when billing duration is yearly');
    }
  }

  if (data.plan_type === PlanType.PAID) {
    if (data.billing_duration === BillingDuration.MONTHLY && !data.monthly_price) {
      throw new ValidationException({ monthly_price: 'Monthly price is required for paid plans' });
    }
    if (data.billing_duration === BillingDuration.YEARLY && !data.yearly_price) {
      throw new ValidationException({ yearly_price: 'Yearly price is required for paid plans' });
    }
  }

}
