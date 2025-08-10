import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { NotificationChannel } from '../entities/notification-sequence.entity';

export class CreateNotificationSequenceDto {
  @IsNumber()
  @IsNotEmpty()
  step_order: number;

  @IsNumber()
  @IsNotEmpty()
  delay_offset_minutes: number;

  @IsEnum(NotificationChannel)
  @IsNotEmpty()
  channel: NotificationChannel;

  @IsString()
  @IsOptional()
  message_template?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsUUID()
  @IsOptional()
  template_id?: string;
}
