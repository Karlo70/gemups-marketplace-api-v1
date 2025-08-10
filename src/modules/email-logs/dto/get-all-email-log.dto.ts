import { IsOptional, IsString } from 'class-validator';
import { GetAllDto } from 'src/shared/dtos/getAll.dto';

export class GetAllEmailsLogDto extends GetAllDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  pending_notification_id?: string;

  @IsOptional()
  @IsString()
  lead_id?: string;
} 