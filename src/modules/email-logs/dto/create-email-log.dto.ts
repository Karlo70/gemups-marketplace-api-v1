import { IsEmail, IsOptional, IsUUID } from 'class-validator';

export class CreateEmailsLogDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsUUID()
  pending_notification_id?: string;

  @IsOptional()
  @IsUUID()
  lead_id?: string;
}
