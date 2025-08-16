import { PartialType } from '@nestjs/mapped-types';
import { CreateSevenElevenProxyDto } from './create-seven-eleven-proxy.dto';

export class UpdateSevenElevenProxyDto extends PartialType(CreateSevenElevenProxyDto) {}
