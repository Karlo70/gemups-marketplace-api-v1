import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from '../plans/entities/plan.entity';
import { User } from '../users/entities/user.entity';
import { Subscription } from './entities/subscription.entity';
import { StripeIntegrationModule } from '../stripe-integration/stripe-integration.module';
import { SubscriptionWebhookService } from './subscription-webhook.service';
import { UsersModule } from '../users/users.module';
import { SharedModule } from 'src/shared/shared.module';
import { Invoice } from '../invoices/entities/invoice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plan, Subscription, User, Invoice]),
    UsersModule,
    SharedModule,
    StripeIntegrationModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionWebhookService],
})
export class SubscriptionModule {}
