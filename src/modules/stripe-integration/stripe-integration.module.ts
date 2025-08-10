import { Module } from '@nestjs/common';
import { StripeIntegrationService } from './stripe-integration.service';
import { StripeIntegrationController } from './stripe-integration.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '../subscription/entities/subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription]),
  ],
  controllers: [StripeIntegrationController],
  providers: [StripeIntegrationService],
  exports: [StripeIntegrationService],
})
export class StripeIntegrationModule {}
