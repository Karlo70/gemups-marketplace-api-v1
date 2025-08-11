import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UsageStatementDto {
  @IsOptional()
  @IsString()
  username?: string; // Whose logs to fetch

  @IsString()
  tzname: string; // Timezone name (e.g., "America/New_York")

  @IsString()
  @IsDateString()
  startDate: string; // YYYY-MM-DD format
}
