import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationSequenceDto } from './create-notification-sequence.dto';

export class UpdateNotificationSequenceDto extends PartialType(CreateNotificationSequenceDto) {}
