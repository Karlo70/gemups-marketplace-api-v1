import { PartialType } from '@nestjs/mapped-types';
import { CreateEmailsLogDto } from './create-email-log.dto';

export class UpdateEmailsLogDto extends PartialType(CreateEmailsLogDto) {}
