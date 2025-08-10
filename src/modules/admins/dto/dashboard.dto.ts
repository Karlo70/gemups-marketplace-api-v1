import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';

export enum DashboardPeriod {
  LAST_7_DAYS = '7d',
  LAST_30_DAYS = '30d',
  LAST_90_DAYS = '90d',
  LAST_6_MONTHS = '6m',
  LAST_YEAR = '1y',
}

export class DashboardStatsDto {
  @IsOptional()
  @IsEnum(DashboardPeriod)
  period?: DashboardPeriod = DashboardPeriod.LAST_30_DAYS;
}

export class WorkflowRunDto {
  run_id: string;
  workflow_name: string;
  started_at: Date;
  duration: string;
  status: 'running' | 'success' | 'failed';
  error?: string;
}

export class DashboardMetricsDto {
  total_workflows: number;
  success_rate: number;
  avg_response_time: number;
  active_users: number;
  workflows_change_percentage: number;
  success_rate_change_percentage: number;
  response_time_change_percentage: number;
  active_users_change_percentage: number;
}

export class PerformanceAnalyticsDto {
  month: string;
  value: number;
}

export class RecentActivityDto {
  workflow_name: string;
  status: 'success' | 'failed' | 'running';
  time_ago: string;
  duration: string;
}

export class TeamMemberDto {
  id: string;
  name: string;
  role: string;
  status: string;
  profile_image?: string;
}

export class AccountBalanceDto {
  current_balance: number;
  monthly_credits: number;
  usage_this_month: number;
}

export class DashboardResponseDto {
  metrics: DashboardMetricsDto;
  performance_analytics: PerformanceAnalyticsDto[];
  recent_workflow_runs: WorkflowRunDto[];
  recent_activities: RecentActivityDto[];
  team_status: TeamMemberDto[];
  account_balance: AccountBalanceDto;
} 