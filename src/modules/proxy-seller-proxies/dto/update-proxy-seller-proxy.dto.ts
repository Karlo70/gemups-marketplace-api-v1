import { PartialType } from '@nestjs/mapped-types';
import { CreateProxySellerProxyDto } from './create-proxy-seller-proxy.dto';

export class UpdateProxySellerProxyDto extends PartialType(CreateProxySellerProxyDto) {}
