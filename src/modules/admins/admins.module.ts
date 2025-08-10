import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { LoginAttempt } from '../auth/entities/login-attempt.entity';
import { CronJob } from '../cron-job/entities/cron-job.entity';
import { CronLog } from '../cron-log/entities/cron-log.entity';
import { VapiCall } from '../vapi/entities/vapi-call.entity';
import { Lead } from '../lead/entities/lead.entity';
import { PendingNotification } from '../pending-notifications/entities/pending-notifications.entity';
import { EmailLog } from '../email-logs/entities/email-log.entity';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, 
      LoginAttempt,
      CronJob,
      CronLog,
      VapiCall,
      Lead,
      PendingNotification,
      EmailLog
    ]),
    UsersModule,
  ],
  controllers: [AdminsController],
  providers: [AdminsService],
})
export class AdminsModule {}
