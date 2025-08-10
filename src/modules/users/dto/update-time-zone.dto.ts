import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTimeZoneDto {
  @IsString()
  @IsNotEmpty()
  time_zone: string;
}
