import { Module } from '@nestjs/common';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { StripeIntegrationModule } from '../stripe-integration/stripe-integration.module';
import { SharedModule } from 'src/shared/shared.module';
import { Subscription } from '../subscription/entities/subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plan, Subscription]),
    StripeIntegrationModule,
    SharedModule,
  ],
  controllers: [PlansController],
  providers: [PlansService],
})
export class PlansModule {}
