import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateSubscriptionStripeLinkDto {
  @IsString({ message: 'PlanId should be a string' })
  @IsNotEmpty({ message: 'PlanId is required' })
  plan_id: string;

  @IsNotEmpty({ message: 'Success URL is required' })
  @IsUrl({}, { message: 'Success URL must be a valid URL' })
  success_url: string;

  @IsNotEmpty({ message: 'Cancel URL is required' })
  @IsUrl({}, { message: 'Cancel URL must be a valid URL' })
  cancel_url: string;
}
