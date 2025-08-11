import { IsString, IsNumber, IsOptional, IsEnum, IsIn, Min, Max } from 'class-validator';
import { ProxyProtocol } from '../entities/proxy.entity';

export class FetchProxiesDto {
  @IsString()
  zone: string;

  @IsNumber()
  ptype: number;

  @IsNumber()
  @Min(1)
  @Max(900)
  count: number;

  @IsOptional()
  @IsString()
  region?: string; // ISO country code

  @IsOptional()
  @IsEnum(ProxyProtocol)
  proto?: ProxyProtocol;

  @IsOptional()
  @IsIn(['txt', 'json'])
  stype?: 'txt' | 'json';

  @IsOptional()
  @IsIn(['1', '2', '3', '4'])
  split?: '1' | '2' | '3' | '4';

  @IsOptional()
  @IsString()
  customSplit?: string;
}
