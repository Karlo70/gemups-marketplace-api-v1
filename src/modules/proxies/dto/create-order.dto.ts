import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @Min(0)
  flow: number; // Traffic quota in GB, 0 for unlimited

  @IsOptional()
  @IsDateString()
  expire?: string; // RFC-3339 or epoch timestamp

  @IsOptional()
  @IsString()
  host?: string; // Friendly name for the proxy
}
