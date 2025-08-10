import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationRetryLogDto } from './create-notification-retry-log.dto';

export class UpdateNotificationRetryLogDto extends PartialType(CreateNotificationRetryLogDto) {}
