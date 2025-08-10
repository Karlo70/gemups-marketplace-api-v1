import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationSequenceRetryDto } from './create-notification-sequence-retry.dto';

export class UpdateNotificationSequenceRetryDto extends PartialType(CreateNotificationSequenceRetryDto) {}
