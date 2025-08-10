import { PartialType } from '@nestjs/mapped-types';
import { CreateSubscriptionStripeLinkDto } from './create-subscription.dto';

export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionStripeLinkDto) {}
