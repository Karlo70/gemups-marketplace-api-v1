import { IsNumber, IsPositive, IsOptional, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsNumber()
  @IsPositive()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}
