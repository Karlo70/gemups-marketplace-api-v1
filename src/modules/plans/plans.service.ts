import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { BillingDuration, Plan, PlanType } from './entities/plan.entity';
import * as dayjs from 'dayjs';
import { StripeIntegrationService } from '../stripe-integration/stripe-integration.service';
import { GetAllPlansDto } from './dto/get-all-plans.dto';
import { validatePlanInput } from './validations/plan.validations';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Not, Repository } from 'typeorm';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { ValidationException } from 'src/utils/validation-exception-formatter';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan) private planRepository: Repository<Plan>,
    private readonly stripeIntegrationService: StripeIntegrationService,
  ) {}

  async create(createPlanDto: CreatePlanDto) {
    validatePlanInput(createPlanDto);

    // ** USE ONLY WHEN CLIENT ASK FOR IT
    const existingPlan = await this.planRepository.findOne({
      where: {
        title: ILike(createPlanDto.title),
      },
    });

    if (existingPlan) {
      throw new ValidationException({
        title: 'Plan with this title already exists',
      });
    }

    const plan = this.planRepository.create(createPlanDto);

    if (plan.plan_type === PlanType.PAID) {
      const stripeProduct = await this.stripeIntegrationService.createProduct({
        title: plan.title,
        short_description: plan.short_description,
      });
      plan.stripe_product_id = stripeProduct.id;

      if (createPlanDto.monthly_price) {
        const monthlyPrice = await this.stripeIntegrationService.createPrice({
          productId: plan.stripe_product_id,
          price: plan.monthly_price,
          duration: plan.billing_duration,
        });
        plan.stripe_monthly_price_id = monthlyPrice.id;
      }

      if (createPlanDto.yearly_price) {
        const yearlyPrice = await this.stripeIntegrationService.createPrice({
          productId: plan.stripe_product_id,
          price: plan.yearly_price,
          duration: plan.billing_duration,
        });
        plan.stripe_yearly_price_id = yearlyPrice.id;
      }
    }

    return this.planRepository.save(plan);
  }

  async update({ id }: ParamIdDto, updatePlanDto: UpdatePlanDto) {
    const plan = await this.planRepository.findOne({
      where: {
        id: id,
        deleted_at: IsNull(),
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    validatePlanInput(updatePlanDto);

    // ** USE ONLY WHEN CLIENT ASK FOR IT

    if (updatePlanDto.title) {
      const isPlanExistsByTitle = await this.planRepository.findOne({
        where: {
          id: Not(id),
          title: ILike(updatePlanDto.title),
          plan_type: updatePlanDto.plan_type,
        },
      });
      if (isPlanExistsByTitle) {
        throw new ValidationException({
          title: 'Plan with this title already exists',
        });
      }
    }

    // ** Check if the title is being updated, update Stripe product
    if (
      plan.plan_type === PlanType.PAID &&
      updatePlanDto.title &&
      updatePlanDto.title !== plan.title
    ) {
      await this.stripeIntegrationService.updateProduct({
        stripe_product_id: plan.stripe_product_id as string,
        title: updatePlanDto.title,
        short_description: updatePlanDto.short_description as string,
      });
    }

    // Check if monthlyPrice has changed and create a new Stripe price
    if (
      updatePlanDto.plan_type === PlanType.PAID &&
      updatePlanDto.billing_duration === BillingDuration.MONTHLY &&
      updatePlanDto.monthly_price &&
      updatePlanDto.monthly_price !== plan.monthly_price
    ) {
      const newMonthlyPrice = await this.stripeIntegrationService.createPrice({
        productId: plan.stripe_product_id,
        price: updatePlanDto.monthly_price,
        duration: BillingDuration.MONTHLY,
      });

      // ** new charges will take effect in the next recurrent charge
      // await this.stripeIntegrationService.updateExistingSubscriptions({
      //   planId: existingPlan._id,
      //   newPriceId: newMonthlyPrice.id,
      //   interval: SubscriptionDuration.MONTHLY,
      // });
      // EMAIL SENDING THAT THE PLAN PRICE IS CHANGED TO THE CUSTOMER WHO HAS THIS PLAN (REMEMBER TO SEND BASED ON INTERVAL)

      plan.stripe_monthly_price_id = newMonthlyPrice.id;
    }

    // Check if yearly_price has changed and create a new Stripe price
    if (
      updatePlanDto.plan_type === PlanType.PAID &&
      updatePlanDto.billing_duration === BillingDuration.YEARLY &&
      updatePlanDto.yearly_price &&
      updatePlanDto.yearly_price !== plan.yearly_price
    ) {
      const new_yearly_price = await this.stripeIntegrationService.createPrice({
        productId: plan.stripe_product_id,
        price: updatePlanDto.yearly_price,
        duration: BillingDuration.YEARLY,
      });

      // ** new charges will take effect in the next recurrent charge
      // await this.stripeIntegrationService.updateExistingSubscriptions({
      //   planId: plan._id,
      //   newPriceId: new_yearly_price.id,
      //   interval: SubscriptionDuration.YEARLY,
      // });
      //  EMAIL SENDING THAT THE PLAN PRICE IS CHANGED TO THE CUSTOMER WHO HAS THIS PLAN (REMEMBER TO SEND BASED ON INTERVAL)

      plan.stripe_yearly_price_id = new_yearly_price.id;
    }

    Object.assign(plan, updatePlanDto);
    return await plan.save();
  }

  async findAll(query: GetAllPlansDto) {
    const queryBuilder = this.planRepository.createQueryBuilder('plan');

    // Base condition for deleted_at
    queryBuilder.where('plan.deleted_at IS NULL');

    // Add filters based on query parameters
    if (query.not_archived) {
      queryBuilder.andWhere('plan.archived IS NULL');
    }

    if (query.plan_type) {
      queryBuilder.andWhere('plan.plan_type = :planType', {
        planType: query.plan_type,
      });
    }

    if (query.billing_duration) {
      queryBuilder.andWhere('plan.billing_duration = :billingDuration', {
        billingDuration: query.billing_duration,
      });
    }

    // Order by plan_type (FREE first, then PAID) and billing_duration
    queryBuilder
      .orderBy('plan.plan_type', 'ASC')
      .addOrderBy('plan.billing_duration', 'ASC');

    const plans = await queryBuilder.getMany();
    return plans;
  }

  // findOne({ id }: ParamIdDto) {
  //   return `This action returns a #${id} plan`;
  // }

  async remove({ id }: ParamIdDto) {
    const plan = await this.planRepository.findOne({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (plan.has_used) {
      throw new ConflictException(
        "Plan can't be deleted if it has been used in any subscription",
      );
    }

    if (plan.plan_type === PlanType.PAID) {
      await this.stripeIntegrationService.archivePrice(
        plan.billing_duration === BillingDuration.MONTHLY
          ? plan.stripe_monthly_price_id
          : plan.stripe_yearly_price_id,
      );
      await this.stripeIntegrationService.changeProductArchiveStatus(
        plan.stripe_product_id,
        false,
      );
    }

    plan.deleted_at = dayjs().toDate();
    return this.planRepository.save(plan);
  }

  async toggleArchive({ id }: ParamIdDto) {
    const plan = await this.planRepository.findOne({
      where: {
        id,
        deleted_at: IsNull(),
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (plan.plan_type === PlanType.PAID) {
      // ** here second parameter is activation status
      await this.stripeIntegrationService.changeProductArchiveStatus(
        plan.stripe_product_id,
        plan.archived ? true : false,
      );
    }

    plan.archived = plan.archived ? plan.archived : dayjs().toDate();
    return this.planRepository.save(plan);
  }
}
