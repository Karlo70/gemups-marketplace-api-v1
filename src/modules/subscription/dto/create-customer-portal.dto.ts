import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreateCustomerPortalDto {
  @IsNotEmpty({ message: 'Return URL is required' })
  @IsUrl({}, { message: 'Return URL must be a valid URL' })
  return_url: string;
}
