import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreatePendingNotificationDto {
  @IsNotEmpty()
  @IsUUID()
  lead_id: string;

  @IsNotEmpty()
  @IsUUID()
  sequence_step_id: string;
  
  @IsNotEmpty()
  @IsNumber()
  scheduled_for: number;

  @IsOptional()
  should_send?: boolean; // Better name: should_send, is_enabled, is_active, can_send
}
