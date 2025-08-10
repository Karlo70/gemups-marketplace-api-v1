import { Module } from '@nestjs/common';
import { CronJobService } from './cron-job.service';
import { CronJobController } from './cron-job.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CronJob } from './entities/cron-job.entity';
import { VapiModule } from '../vapi/vapi.module';
import { CronLog } from '../cron-log/entities/cron-log.entity';
import { Lead } from '../lead/entities/lead.entity';
import { PendingNotification } from '../pending-notifications/entities/pending-notifications.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { VapiCall } from '../vapi/entities/vapi-call.entity';
import { EmailLog } from '../email-logs/entities/email-log.entity';
import { NotificationHelperService } from './helper/notification-helper.service';
import { NotificationRetryLog } from '../notification-retry-logs/entities/notification-retry-log.entity';
import { NotificationSequenceRetry } from '../notification-sequence-retries/entities/notification-sequence-retry.entity';
import { ThirdPartyApi } from '../third-party-api-key/entities/third-party-api-key.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CronJob,VapiCall, Lead, CronLog, PendingNotification,EmailLog,NotificationRetryLog,NotificationSequenceRetry,ThirdPartyApi]),
    VapiModule,
    NotificationsModule,
  ],
  controllers: [CronJobController],
  providers: [CronJobService, NotificationHelperService],
})
export class CronJobModule {}
