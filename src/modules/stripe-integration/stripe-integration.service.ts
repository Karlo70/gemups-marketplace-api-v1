import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import {
  Subscription,
  SubscriptionStatuses,
} from '../subscription/entities/subscription.entity';

import { BillingDuration, PlanType } from '../plans/entities/plan.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class StripeIntegrationService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
  ) {}

  async createPrice({
    productId,
    price,
    duration,
  }: {
    productId: string;
    price: number;
    duration: BillingDuration;
  }) {
    return this.stripe.prices.create({
      product: productId,
      unit_amount: Math.round(price * 100), // New price in cents
      currency: 'usd',
      recurring: {
        interval: duration,
      },
    });
  }

  async createProduct({
    title,
    short_description,
  }: {
    title: string;
    short_description: string;
  }) {
    return this.stripe.products.create({
      name: title,
      description: short_description,
    });
  }

  async deleteProduct(stripe_product_id: string) {
    return this.stripe.products.del(stripe_product_id);
  }

  async archivePrice(stripePriceId: string) {
    return await this.stripe.prices.update(stripePriceId, { active: false });
  }

  async changeProductArchiveStatus(stripe_product_id: string, active: boolean) {
    return this.stripe.products.update(stripe_product_id, {
      active: active,
    });
  }

  async updateProduct({
    stripe_product_id,
    title,
    short_description,
  }: {
    stripe_product_id: string;
    title: string;
    short_description: string;
  }) {
    return this.stripe.products.update(stripe_product_id, {
      name: title,
      description: short_description,
    });
  }

  async createCustomer({ email }) {
    return this.stripe.customers.create({
      email: email,
    });
  }

  async createCheckoutSession({
    userId,
    customerId,
    duration,
    success_url,
    cancel_url,
    plan,
  }) {
    return this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price:
            duration === BillingDuration.YEARLY
              ? plan.stripe_yearly_price_id
              : plan.stripe_monthly_price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url,
    });
  }

  async updateExistingSubscriptions({
    planId,
    newPriceId,
    interval,
  }: {
    planId: string;
    newPriceId: string;
    interval: BillingDuration;
  }) {
    const subscriptions = await this.subscriptionRepository.find({
      where: {
        plan: { id: planId, billing_duration: interval },
        sub_status: SubscriptionStatuses.ACTIVE,
      },
    });

    for (const subscription of subscriptions) {
      // Update the subscription item to use the new price for future cycles
      const updatedSubscription = await this.stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          items: [
            {
              id: subscription.stripe_subscription_item_id, // Existing subscription item ID
              price: newPriceId, // New price ID created earlier
            },
          ],
          proration_behavior: 'none', // Ensure no proration, keeps the old price for the current cycle
        },
      );
    }
  }

  async createPaymentIntent(body) {
    const { amount, currency, customerId, metadata } = body;

    try {
      return await this.stripe.paymentIntents.create({
        amount: parseInt((amount * 100).toFixed(2)), // Amount in the smallest unit of currency (e.g., cents for USD)
        currency: currency || 'USD',
        metadata,
        // customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
