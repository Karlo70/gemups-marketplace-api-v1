import { PartialType } from '@nestjs/mapped-types';
import { CreateThirdPartyApiDto } from './create-third-party-api-key.dto';

export class UpdateThirdPartyApiDto extends PartialType(CreateThirdPartyApiDto) {}
