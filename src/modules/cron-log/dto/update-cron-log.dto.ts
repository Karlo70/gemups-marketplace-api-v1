import { PartialType } from '@nestjs/mapped-types';
import { CreateCronLogDto } from './create-cron-log.dto';

export class UpdateCronLogDto extends PartialType(CreateCronLogDto) {}
