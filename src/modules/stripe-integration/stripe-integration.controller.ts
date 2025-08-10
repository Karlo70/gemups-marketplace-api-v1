import { Controller } from '@nestjs/common';
import { StripeIntegrationService } from './stripe-integration.service';

@Controller('stripe-integration')
export class StripeIntegrationController {
  constructor(
    private readonly stripeIntegrationService: StripeIntegrationService,
  ) {}
}
