import { IsString, IsOptional, IsEnum } from 'class-validator';

export class TestWalletWebhookDto {
  @IsOptional()
  @IsString()
  uuid?: string;

  @IsString()
  currency: string;

  @IsString()
  url_callback: string;

  @IsString()
  network: string;

  @IsOptional()
  @IsString()
  status?: string;
}
