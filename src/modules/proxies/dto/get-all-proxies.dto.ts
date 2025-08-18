import { IsOptional, IsEnum, IsString, IsBoolean, IsDateString, IsUUID } from 'class-validator';
import { ProxyType, ProxyStatus } from '../entities/proxy.entity';
import { ProxiesProvider } from 'src/modules/products/entities/product.entity';
import { GetAllDto } from 'src/shared/dtos/getAll.dto';

export class GetAllProxiesDto extends GetAllDto {

  @IsOptional()
  @IsEnum(ProxyType)
  type?: ProxyType;

  @IsOptional()
  @IsEnum(ProxyStatus)
  status?: ProxyStatus;

  @IsOptional()
  @IsEnum(ProxiesProvider)
  provider?: ProxiesProvider;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsUUID()
  user_id?: string;
}
