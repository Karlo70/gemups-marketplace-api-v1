import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { DashboardPeriod, DashboardResponseDto, DashboardMetricsDto, PerformanceAnalyticsDto, WorkflowRunDto, RecentActivityDto, TeamMemberDto, AccountBalanceDto } from './dto/dashboard.dto';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

}
