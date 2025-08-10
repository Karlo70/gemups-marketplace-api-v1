import { IsNotEmpty, IsString } from 'class-validator';

export class AddDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  device_token: string;
}
