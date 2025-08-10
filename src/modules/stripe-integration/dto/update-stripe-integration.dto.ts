import { PartialType } from '@nestjs/mapped-types';
import { CreateStripeIntegrationDto } from './create-stripe-integration.dto';

export class UpdateStripeIntegrationDto extends PartialType(CreateStripeIntegrationDto) {}
