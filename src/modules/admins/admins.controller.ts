import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { RolesDecorator } from 'src/shared/guards/roles.decorator';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { AdminsService } from './admins.service';
import { DashboardStatsDto, DashboardPeriod } from './dto/dashboard.dto';

@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) { }

  @Get('dashboard/stats')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getDashboardStats(
    @CurrentUser() currentUser: User,
    @Query() dashboardStatsDto: DashboardStatsDto
  ): Promise<IResponse> {
    const data = await this.adminsService.getDashboardStats(
      currentUser, 
      dashboardStatsDto.period || DashboardPeriod.LAST_30_DAYS
    );
    
    return {
      message: 'Dashboard stats fetched successfully',
      details: data,
    };
  }

  @Get('dashboard/metrics')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getDashboardMetrics(
    @CurrentUser() currentUser: User,
    @Query() dashboardStatsDto: DashboardStatsDto
  ): Promise<IResponse> {
    const dateRange = this.adminsService['getDateRange'](dashboardStatsDto.period || DashboardPeriod.LAST_30_DAYS);
    const metrics = await this.adminsService['getDashboardMetrics'](currentUser, dateRange);
    
    return {
      message: 'Dashboard metrics fetched successfully',
      details: metrics,
    };
  }

  @Get('dashboard/performance-analytics')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getPerformanceAnalytics(
    @CurrentUser() currentUser: User,
    @Query() dashboardStatsDto: DashboardStatsDto
  ): Promise<IResponse> {
    const dateRange = this.adminsService['getDateRange'](dashboardStatsDto.period || DashboardPeriod.LAST_30_DAYS);
    const analytics = await this.adminsService['getPerformanceAnalytics'](currentUser, dateRange);
    
    return {
      message: 'Performance analytics fetched successfully',
      details: analytics,
    };
  }

  @Get('dashboard/recent-workflows')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getRecentWorkflows(
    @CurrentUser() currentUser: User,
    @Query() dashboardStatsDto: DashboardStatsDto
  ): Promise<IResponse> {
    const dateRange = this.adminsService['getDateRange'](dashboardStatsDto.period || DashboardPeriod.LAST_30_DAYS);
    const workflows = await this.adminsService['getRecentWorkflowRuns'](currentUser, dateRange);
    
    return {
      message: 'Recent workflows fetched successfully',
      details: workflows,
    };
  }

  @Get('dashboard/recent-activities')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getRecentActivities(
    @CurrentUser() currentUser: User,
    @Query() dashboardStatsDto: DashboardStatsDto
  ): Promise<IResponse> {
    const dateRange = this.adminsService['getDateRange'](dashboardStatsDto.period || DashboardPeriod.LAST_30_DAYS);
    const activities = await this.adminsService['getRecentActivities'](currentUser, dateRange);
    
    return {
      message: 'Recent activities fetched successfully',
      details: activities,
    };
  }

  @Get('dashboard/team-status')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getTeamStatus(@CurrentUser() currentUser: User): Promise<IResponse> {
    const teamStatus = await this.adminsService['getTeamStatus'](currentUser);
    
    return {
      message: 'Team status fetched successfully',
      details: teamStatus,
    };
  }

  @Get('dashboard/account-balance')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getAccountBalance(@CurrentUser() currentUser: User): Promise<IResponse> {
    const accountBalance = await this.adminsService['getAccountBalance'](currentUser);
    
    return {
      message: 'Account balance fetched successfully',
      details: accountBalance,
    };
  }
}
