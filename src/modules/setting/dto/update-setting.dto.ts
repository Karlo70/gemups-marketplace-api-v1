import { PartialType } from '@nestjs/mapped-types';
import { CreateSettingDto, CreateProxyPricingSettingDto } from './create-setting.dto';

export class UpdateSettingDto extends PartialType(CreateSettingDto) {}

export class UpdateProxyPricingSettingDto extends PartialType(CreateProxyPricingSettingDto) {}
