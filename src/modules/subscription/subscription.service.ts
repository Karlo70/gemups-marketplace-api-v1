import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { CreateCustomerPortalDto } from './dto/create-customer-portal.dto';
import { BillingDuration, PlanType } from '../plans/entities/plan.entity';
import { User } from '../users/entities/user.entity';
import { Plan } from '../plans/entities/plan.entity';
import {
  Subscription,
  SubscriptionStatuses,
} from './entities/subscription.entity';
import { ParamIdDto } from '../../shared/dtos/paramId.dto';
import { GetAllSubscriptionsDto } from './dto/get-all-subscription.dto';
import Stripe from 'stripe';
import { StripeIntegrationService } from '../stripe-integration/stripe-integration.service';
import { CreateSubscriptionStripeLinkDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { TransactionManagerService } from 'src/shared/services/transaction-manager.service';
import * as dayjs from 'dayjs';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,

    private dataSource: DataSource,

    private readonly stripeIntegrationService: StripeIntegrationService,
    private readonly transactionManagerService: TransactionManagerService,
  ) {}

  async createStripeLink(
    user: User,
    createSubscriptionStripeLinkDto: CreateSubscriptionStripeLinkDto,
  ) {
    return await this.transactionManagerService.executeInTransaction(
      async (queryRunner) => {
        const { plan_id, success_url, cancel_url } =
          createSubscriptionStripeLinkDto;

        const plan = await queryRunner.manager.findOne(Plan, {
          where: {
            id: plan_id,
            deleted_at: IsNull(),
            archived: IsNull(),
          },
        });

        if (!plan) {
          throw new NotFoundException('Plan not found');
        }

        if (
          user?.latest_subscription?.plan?.plan_type &&
          user?.latest_subscription?.plan?.plan_type !== PlanType.FREE
        ) {
          throw new BadRequestException(
            'You are already subscribed to a paid plan, please use manage subscription route',
          );
        }

        // ** if the customer is not connected to stripe, connect it to stripe

        if (!user.stripe_customer_id) {
          const stripe_customer = await this.stripe.customers.create({
            email: user.email,
          });
          user.stripe_customer_id = stripe_customer.id;
          await this.userRepository.save(user);
        }

        // ** subscribing to free trial
        if (plan.plan_type === PlanType.FREE) {
          const subscription = queryRunner.manager.create(Subscription, {
            sub_status: SubscriptionStatuses.ACTIVE,
            user: user,
            plan: plan,
            start_date: dayjs().toDate(),
            end_date: dayjs().add(plan.free_duration, 'days').toDate(),
          });

          await queryRunner.manager.save(Subscription, subscription);

          user.latest_subscription = subscription;
          user.has_used_free_trial = true;
          user.has_taken_subscription = true;
          await queryRunner.manager.save(User, user);

          return {
            message: 'Free trial has been activated',
            details: subscription,
          };
        }

        const stripeSession =
          await this.stripeIntegrationService.createCheckoutSession({
            userId: user.id,
            duration: plan.billing_duration,
            success_url: success_url,
            cancel_url: cancel_url,
            plan,
            customerId: user.stripe_customer_id,
          });

        plan.has_used = true;
        await this.planRepository.save(plan);

        return {
          message: 'Subscription created successfully',
          details: { redirectTo: stripeSession.url },
        };
      },
    );
  }

  async createCustomerPortal(
    currentUser: User,
    createCustomerPortalDto: CreateCustomerPortalDto,
  ) {
    if (!currentUser?.latest_subscription) {
      throw new BadRequestException('Please subscribe to any paid plan first');
    }
    if (currentUser?.latest_subscription?.plan?.plan_type === PlanType.FREE) {
      throw new BadRequestException('Please subscribe to any paid plan first');
    }

    const plans = await this.planRepository.find({
      where: {
        plan_type: PlanType.PAID,
        deleted_at: IsNull(),
        archived: IsNull(),
      },
    });

    if (!plans.length) {
      throw new BadRequestException('Please ask admin to create plans');
    }

    const configuration = await this.stripe.billingPortal.configurations.create(
      {
        business_profile: {
          headline: 'Automely Ai',
        },
        features: {
          subscription_update: {
            enabled: true,
            proration_behavior: 'create_prorations',
            default_allowed_updates: ['price'],
            products: plans.map((p) => ({
              product: p.stripe_product_id,
              prices: [
                p.billing_duration === BillingDuration.MONTHLY
                  ? p.stripe_monthly_price_id
                  : p.stripe_yearly_price_id,
              ],
            })),
          },
          payment_method_update: {
            enabled: true,
          },
          subscription_cancel: {
            enabled: true,
          },
          invoice_history: {
            enabled: true,
          },
        },
      },
    );

    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: currentUser.stripe_customer_id,
      return_url: createCustomerPortalDto.return_url,
      configuration: configuration.id,
    });

    return portalSession.url;
  }

  async cancelSubscription(subscriptionId: string, user: User) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Find the subscription in your database
      const subscription = await manager.findOne(Subscription, {
        where: {
          id: subscriptionId,
          user: user,
        },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      // 2. Cancel the subscription on Stripe
      await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      // 3. Update the subscription status in your database
      subscription.sub_status = SubscriptionStatuses.CANCELED;
      await manager.save(Subscription, subscription);

      return;
    });
  }

  async findAll(getAllSubscriptionsDto: GetAllSubscriptionsDto, user: User) {
    const { plan_type, plan_id, status, page, per_page, roles } =
      getAllSubscriptionsDto;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.latest_subscription', 'latest_subscription')
      .leftJoinAndSelect('latest_subscription.plan', 'platformPlan')
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.role',
        'user.status',
        'latestApiSubscription.id',
        'latestApiSubscription.subStatus',
        'apiPlan.id',
        'apiPlan.planType',
        'apiPlan.planFor',
        'latest_subscription.id',
        'latest_subscription.subStatus',
        'platformPlan.id',
        'platformPlan.planType',
        'platformPlan.planFor',
      ])
      .orderBy('user.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (roles && roles.length > 0) {
      queryBuilder.andWhere('user.role IN (:...roles)', { roles });
    }

    if (plan_type) {
      queryBuilder.andWhere(
        '(apiPlan.planType = :planType OR platformPlan.planType = :plan_type)',
        { plan_type },
      );
    }

    if (plan_id) {
      queryBuilder.andWhere(
        '(apiPlan.id = :planId OR platformPlan.id = :plan_id)',
        { plan_id },
      );
    }

    const skip = (page ?? 1 - 1) * (per_page ?? 1);
    queryBuilder.skip(skip).take(per_page);

    const [result, total] = await queryBuilder.getManyAndCount();

    return {
      result,
      total,
      page,
      per_page,
    };
  }

  async findOne({ id }: ParamIdDto) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['user', 'plan'],
      select: {
        user: {
          password: false,
        },
      },
    });
    return subscription;
  }

  update(id: number, updateSubscriptionDto: UpdateSubscriptionDto) {
    return `This action updates a #${id} subscription`;
  }

  remove(id: number) {
    return `This action removes a #${id} subscription`;
  }
}
