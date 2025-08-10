import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan, PlanType } from '../plans/entities/plan.entity';
import Stripe from 'stripe';
import {
  Subscription,
  SubscriptionStatuses,
} from './entities/subscription.entity';
import * as dayjs from 'dayjs';
import { StripeIntegrationService } from '../stripe-integration/stripe-integration.service';
import { Invoice, InvoiceStatus } from '../invoices/entities/invoice.entity';

@Injectable()
export class SubscriptionWebhookService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,

    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,

    private readonly dataSource: DataSource,

    private readonly stripeIntegrationService: StripeIntegrationService,
  ) {}

  async subscriptionInvoicePaid(eventData) {
    if (eventData.billing_reason === 'subscription_create') {
      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        eventData.parent.subscription_details.subscription,
      );

      if (!stripeSubscription)
        throw new BadRequestException('Stripe Subscription not found');

      const plan = await this.planRepository.findOneBy({
        stripe_product_id: stripeSubscription.items.data[0].plan
          .product as string,
      });

      if (!plan) {
        throw new NotFoundException('Plan with this id does not exists');
      }

      const user = await this.userRepository.findOne({
        where: {
          stripe_customer_id: eventData.customer,
        },
        relations: {
          latest_subscription: true,
        },
      });

      if (!user) {
        throw new NotFoundException(
          `User with this ${eventData.customer} does not exists`,
        );
      }

      const subscription = this.subscriptionRepository.create({
        user: user,
        plan: plan,
        start_date: dayjs
          .unix(stripeSubscription.items.data[0].current_period_start)
          .toDate(),
        end_date: dayjs
          .unix(stripeSubscription.items.data[0].current_period_end)
          .toDate(),
        stripe_subscription_id: stripeSubscription.id,
        sub_status: SubscriptionStatuses.ACTIVE,
        amount_paid: eventData.amount_paid / 100,
        payment_status: eventData.status,
        payment_failed_count: 0,
      });

      await this.subscriptionRepository.save(subscription);

      await this.createInvoice({
        eventDataObject: eventData,
        subscription,
        user,
      });

      user.latest_subscription = subscription;
      user.has_taken_subscription = true;
      user.has_used_free_trial = true;

      await this.userRepository.save(user);
    }

    if (eventData.billing_reason === 'subscription_cycle') {
      const subscription = await this.subscriptionRepository.findOne({
        where: {
          stripe_subscription_id:
            eventData.parent.subscription_details.subscription,
        },
        relations: {
          plan: true,
          user: true,
        },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription does not exists');
      }

      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        eventData.parent.subscription_details.subscription,
      );

      subscription.start_date = dayjs
        .unix(stripeSubscription.items.data[0].current_period_start)
        .toDate();
      subscription.end_date = dayjs
        .unix(stripeSubscription.items.data[0].current_period_end)
        .toDate();
      subscription.sub_status = SubscriptionStatuses.ACTIVE;
      subscription.amount_paid = eventData.amount_paid / 100;
      subscription.payment_status = eventData.status;
      subscription.payment_failed_count = 0;
      await subscription.save();

      await this.createInvoice({
        eventDataObject: eventData,
        subscription,
        user: subscription.user,
      });
    }

    if (eventData.billing_reason === 'subscription_update') {
      const subscription = await this.subscriptionRepository.findOne({
        where: {
          stripe_subscription_id:
            eventData.parent.subscription_details.subscription,
        },
        relations: {
          plan: true,
          user: true,
        },
      });

      if (!subscription) {
        throw new NotFoundException(
          `Subscription with this ${eventData.parent.subscription_details.subscription} does not exists`,
        );
      }

      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        eventData.parent.subscription_details.subscription,
      );

      const plan = await this.planRepository.findOneBy({
        stripe_product_id: stripeSubscription.items.data[0].plan
          .product as string,
      });

      if (!plan) {
        throw new NotFoundException('Plan with this id does not exists');
      }

      subscription.plan = plan;
      subscription.start_date = dayjs
        .unix(stripeSubscription.items.data[0].current_period_start)
        .toDate();
      subscription.end_date = dayjs
        .unix(stripeSubscription.items.data[0].current_period_end)
        .toDate();
      subscription.sub_status = SubscriptionStatuses.ACTIVE;
      subscription.amount_paid = eventData.amount_paid / 100;
      subscription.payment_status = eventData.status;
      subscription.payment_failed_count = 0;
      await subscription.save();

      await this.createInvoice({
        eventDataObject: eventData,
        subscription,
        user: subscription.user,
      });
    }
  }

  async handleFailedPayment(eventDataObject) {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        stripe_subscription_id: eventDataObject.subscription,
      },
      relations: {
        plan: true,
        user: true,
      },
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    subscription.payment_failed_count++;
    if (subscription.payment_failed_count >= 2) {
      const latestInvoice = (
        await this.stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id,
        )
      ).latest_invoice;
      if (!latestInvoice)
        throw new BadRequestException('Latest Invoice not found');

      await this.stripe.invoices.voidInvoice(latestInvoice.toString());
      await this.stripe.subscriptions.cancel(
        subscription.stripe_subscription_id,
      );
      subscription.sub_status = SubscriptionStatuses.CANCELED;
      await this.updateUserLatestSubscription(subscription);
    }

    await this.subscriptionRepository.save(subscription);
  }

  async subscriptionDeleted(eventData) {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        stripe_subscription_id: eventData.id,
        sub_status: SubscriptionStatuses.ACTIVE,
      },
      relations: ['plan', 'user'],
    });

    if (!subscription) {
      return; // ** means we have already cancelled the subscription
    }

    await this.updateUserLatestSubscription(subscription);
    subscription.sub_status = SubscriptionStatuses.CANCELED;
    await this.subscriptionRepository.save(subscription);
  }

  async updateUserLatestSubscription(subscription: Subscription) {
    const user = subscription.user;
    const userFreeApiSubscription = await this.subscriptionRepository.findOne({
      where: {
        user: { id: user.id },
        plan: {
          plan_type: PlanType.FREE,
        },
      },
      relations: ['plan'],
    });

    if (userFreeApiSubscription)
      user.latest_subscription = userFreeApiSubscription[0];

    await user.save();
  }

  async updateSubscription(eventDataObject) {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        stripe_subscription_id: eventDataObject.id,
      },
      relations: {
        user: true,
      },
    });

    if (!subscription) {
      return; // the subscription doesn't exists by now
    }

    subscription.cancel_at_period_end = eventDataObject.cancel_at_period_end;

    return await subscription.save();
  }

  async createInvoice({ eventDataObject, subscription, user }) {
    const invoice = this.invoiceRepository.create({
      stripe_invoice_id: eventDataObject.id,
      stripe_hosted_invoice_url: eventDataObject.hosted_invoice_url,
      stripe_invoice_pdf: eventDataObject.invoice_pdf,
      status: InvoiceStatus.PAID,
      amount_paid: eventDataObject.amount_paid / 100,
      amount_due: eventDataObject.amount_due / 100,
      payment_date: new Date(),
      subscription,
      user,
    });

    return await this.invoiceRepository.save(invoice);
  }
}
