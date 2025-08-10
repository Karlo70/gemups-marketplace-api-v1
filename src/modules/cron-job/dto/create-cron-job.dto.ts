import { CronExpression } from '@nestjs/schedule';
import { IsEnum, IsString } from 'class-validator';

export class CreateCronJobDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsEnum(CronExpression)
  cron_expression: CronExpression;
}
