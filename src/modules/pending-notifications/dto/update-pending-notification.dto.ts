import { PartialType } from '@nestjs/mapped-types';
import { CreatePendingNotificationDto } from './create-pending-notification.dto';

export class UpdatePendingNotificationDto extends PartialType(CreatePendingNotificationDto) {}
