import { IsNotEmpty, IsNumber, IsPositive, IsUUID, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateNotificationRetryLogDto {
  @IsNotEmpty()
  @IsUUID()
  pending_notification_id: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  attempt_number: number;

  @IsNotEmpty()
  @IsDateString()
  attempted_at: Date;

  @IsOptional()
  error?: string;

  @IsNotEmpty()
  @IsBoolean()
  success: boolean;
}
