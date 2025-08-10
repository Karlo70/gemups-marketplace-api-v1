import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsUUID, Min } from 'class-validator';
import { NotificationSequenceRetriesStatus } from '../entities/notification-sequence-retry.entity';

export class CreateNotificationSequenceRetryDto {
  @IsNotEmpty()
  @IsUUID()
  sequence_id: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  retry_order: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  retry_delay_minutes: number;

  @IsEnum(NotificationSequenceRetriesStatus)
  status: NotificationSequenceRetriesStatus;
}
