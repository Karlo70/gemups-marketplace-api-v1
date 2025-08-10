import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CronJob } from '../cron-job/entities/cron-job.entity';
import { CronLog, CronLogStatus } from '../cron-log/entities/cron-log.entity';
import { VapiCall } from '../vapi/entities/vapi-call.entity';
import { Lead } from '../lead/entities/lead.entity';
import { PendingNotification } from '../pending-notifications/entities/pending-notifications.entity';
import { EmailLog } from '../email-logs/entities/email-log.entity';
import { DashboardPeriod, DashboardResponseDto, DashboardMetricsDto, PerformanceAnalyticsDto, WorkflowRunDto, RecentActivityDto, TeamMemberDto, AccountBalanceDto } from './dto/dashboard.dto';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(CronJob)
    private readonly cronJobRepository: Repository<CronJob>,

    @InjectRepository(CronLog)
    private readonly cronLogRepository: Repository<CronLog>,

    @InjectRepository(VapiCall)
    private readonly vapiCallRepository: Repository<VapiCall>,

    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,

    @InjectRepository(PendingNotification)
    private readonly pendingNotificationRepository: Repository<PendingNotification>,

    @InjectRepository(EmailLog)
    private readonly emailLogRepository: Repository<EmailLog>,

    private readonly userService: UsersService,
  ) {}

  async getDashboardStats(currentUser: User, period: DashboardPeriod = DashboardPeriod.LAST_30_DAYS): Promise<DashboardResponseDto> {
    const dateRange = this.getDateRange(period);
    
    const [
      metrics,
      performanceAnalytics,
      recentWorkflowRuns,
      recentActivities,
      teamStatus,
      accountBalance
    ] = await Promise.all([
      this.getDashboardMetrics(currentUser, dateRange),
      this.getPerformanceAnalytics(currentUser, dateRange),
      this.getRecentWorkflowRuns(currentUser, dateRange),
      this.getRecentActivities(currentUser, dateRange),
      this.getTeamStatus(currentUser),
      this.getAccountBalance(currentUser)
    ]);

    return {
      metrics,
      performance_analytics: performanceAnalytics,
      recent_workflow_runs: recentWorkflowRuns,
      recent_activities: recentActivities,
      team_status: teamStatus,
      account_balance: accountBalance
    };
  }

  private getDateRange(period: DashboardPeriod): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case DashboardPeriod.LAST_7_DAYS:
        start.setDate(end.getDate() - 7);
        break;
      case DashboardPeriod.LAST_30_DAYS:
        start.setDate(end.getDate() - 30);
        break;
      case DashboardPeriod.LAST_90_DAYS:
        start.setDate(end.getDate() - 90);
        break;
      case DashboardPeriod.LAST_6_MONTHS:
        start.setMonth(end.getMonth() - 6);
        break;
      case DashboardPeriod.LAST_YEAR:
        start.setFullYear(end.getFullYear() - 1);
        break;
    }

    return { start, end };
  }

  private async getDashboardMetrics(currentUser: User, dateRange: { start: Date; end: Date }): Promise<DashboardMetricsDto> {
    const { start, end } = dateRange;
    const previousStart = new Date(start.getTime() - (end.getTime() - start.getTime()));

    // Get current period stats
    const currentStats = await this.getPeriodStats(currentUser, start, end);
    const previousStats = await this.getPeriodStats(currentUser, previousStart, start);

    // Calculate change percentages
    const workflowsChange = this.calculatePercentageChange(
      previousStats.totalWorkflows,
      currentStats.totalWorkflows
    );
    const successRateChange = this.calculatePercentageChange(
      previousStats.successRate,
      currentStats.successRate
    );
    const responseTimeChange = this.calculatePercentageChange(
      previousStats.avgResponseTime,
      currentStats.avgResponseTime
    );
    const activeUsersChange = this.calculatePercentageChange(
      previousStats.activeUsers,
      currentStats.activeUsers
    );

    return {
      total_workflows: currentStats.totalWorkflows,
      success_rate: currentStats.successRate,
      avg_response_time: currentStats.avgResponseTime,
      active_users: currentStats.activeUsers,
      workflows_change_percentage: workflowsChange,
      success_rate_change_percentage: successRateChange,
      response_time_change_percentage: responseTimeChange,
      active_users_change_percentage: activeUsersChange,
    };
  }

  private async getPeriodStats(currentUser: User, start: Date, end: Date) {
    const [totalWorkflows, successCount, totalDuration, activeUsers] = await Promise.all([
      this.cronJobRepository.count({
        where: {
          created_at: Between(start, end),
          ...(currentUser.role !== UserRole.SUPER_ADMIN && { created_by: currentUser.id })
        }
      }),
      this.cronLogRepository.count({
        where: {
          status: CronLogStatus.DONE,
          created_at: Between(start, end),
          ...(currentUser.role !== UserRole.SUPER_ADMIN && { cron_job: { created_by: currentUser.id } })
        } as any
      }),
      this.cronLogRepository
        .createQueryBuilder('log')
        .select('AVG(EXTRACT(EPOCH FROM (log.updated_at - log.created_at)))', 'avgDuration')
        .where('log.created_at BETWEEN :start AND :end', { start, end })
        .andWhere('log.status = :status', { status: CronLogStatus.DONE })
        .getRawOne(),
      this.usersRepository
        .createQueryBuilder('user')
        .leftJoin('user.login_attempts', 'login_attempt')
        .where('user.status = :status', { status: UserStatus.ACTIVE })
        .andWhere('login_attempt.created_at >= :start', { start })
        .andWhere('(login_attempt.logout_at IS NULL OR login_attempt.logout_at >= :start)', { start })
        .andWhere('login_attempt.deleted_at IS NULL')
        .andWhere(currentUser.role !== UserRole.SUPER_ADMIN ? 'user.id = :userId' : '1=1', { userId: currentUser.id })
        .getCount()
    ]);

    const totalLogs = await this.cronLogRepository.count({
      where: {
        created_at: Between(start, end),
        ...(currentUser.role !== UserRole.SUPER_ADMIN && { cron_job: { created_by: currentUser.id } })
      } as any
    });

    const successRate = totalLogs > 0 ? (successCount / totalLogs) * 100 : 0;
    const avgResponseTime = totalDuration?.avgDuration ? parseFloat(totalDuration.avgDuration) : 0;

    return {
      totalWorkflows,
      successRate,
      avgResponseTime,
      activeUsers
    };
  }

  private calculatePercentageChange(previous: number, current: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private async getPerformanceAnalytics(currentUser: User, dateRange: { start: Date; end: Date }): Promise<PerformanceAnalyticsDto[]> {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const analytics = await this.cronLogRepository
      .createQueryBuilder('log')
      .select('EXTRACT(MONTH FROM log.created_at)', 'month')
      .addSelect('COUNT(*)', 'count')
      .where('log.created_at BETWEEN :start AND :end', { start: dateRange.start, end: dateRange.end })
      .andWhere('EXTRACT(YEAR FROM log.created_at) = :year', { year: currentYear })
      .groupBy('month')
      .getRawMany();

    return months.map((month, index) => {
      const monthData = analytics.find(a => parseInt(a.month) === index + 1);
      return {
        month,
        value: monthData ? parseInt(monthData.count) : 0
      };
    });
  }

  private async getRecentWorkflowRuns(currentUser: User, dateRange: { start: Date; end: Date }): Promise<WorkflowRunDto[]> {
    const logs = await this.cronLogRepository.find({
      where: {
        created_at: Between(dateRange.start, dateRange.end),
        ...(currentUser.role !== UserRole.SUPER_ADMIN && { cron_job: { created_by: currentUser.id } })
      } as any,
      relations: ['cron_job'],
      order: { created_at: 'DESC' },
      take: 10
    });

    return logs.map(log => {
      const duration = log.updated_at && log.created_at 
        ? this.formatDuration(new Date(log.updated_at).getTime() - new Date(log.created_at).getTime())
        : '0s';

      return {
        run_id: log.id,
        workflow_name: log.cron_job?.name || 'Unknown Workflow',
        started_at: log.created_at,
        duration,
        status: this.mapCronLogStatus(log.status),
        error: log.error || undefined
      };
    });
  }

  private async getRecentActivities(currentUser: User, dateRange: { start: Date; end: Date }): Promise<RecentActivityDto[]> {
    const logs = await this.cronLogRepository.find({
      where: {
        created_at: Between(dateRange.start, dateRange.end),
        ...(currentUser.role !== UserRole.SUPER_ADMIN && { cron_job: { created_by: currentUser.id } })
      } as any,
      relations: ['cron_job'],
      order: { created_at: 'DESC' },
      take: 5
    });

    return logs.map(log => {
      const duration = log.updated_at && log.created_at 
        ? this.formatDuration(new Date(log.updated_at).getTime() - new Date(log.created_at).getTime())
        : '0s';

      return {
        workflow_name: log.cron_job?.name || 'Unknown Workflow',
        status: this.mapCronLogStatus(log.status),
        time_ago: this.getTimeAgo(log.created_at),
        duration
      };
    });
  }

  private async getTeamStatus(currentUser: User): Promise<TeamMemberDto[]> {
    const users = await this.usersRepository.find({
      where: {
        status: UserStatus.ACTIVE  ,
        role: UserRole.CUSTOMER
      } as any,
      relations: ['profile_image'],
      take: 4
    });

    return users.map(user => ({
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
      role: this.getUserRole(user.role),
      status: this.getUserStatus(user),
      profile_image: user.profile_image?.url
    }));
  }

  private async getAccountBalance(currentUser: User): Promise<AccountBalanceDto> {
    // Mock data - replace with actual subscription/billing logic
    return {
      current_balance: 1423.25,
      monthly_credits: 500.00,
      usage_this_month: 76.75
    };
  }

  private mapCronLogStatus(status: CronLogStatus): 'running' | 'success' | 'failed' {
    switch (status) {
      case CronLogStatus.RUNNING:
        return 'running';
      case CronLogStatus.DONE:
        return 'success';
      case CronLogStatus.FAILED:
        return 'failed';
      default:
        return 'failed';
    }
  }

  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }

  private getUserRole(role: UserRole): string {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'Owner';
      case UserRole.ADMIN:
        return 'Admin';
      case UserRole.CUSTOMER:
        return 'Customer';
      default:
        return 'User';
    }
  }

  private getUserStatus(user: User): string {
    // Mock status - replace with actual user status logic
    const statuses = ['Available', 'In meeting', 'On call', 'Available in 2hrs'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }
}
