import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationRetryLogsService } from './notification-retry-logs.service';
import { NotificationRetryLogsController } from './notification-retry-logs.controller';
import { NotificationRetryLog } from './entities/notification-retry-log.entity';
import { PendingNotification } from '../pending-notifications/entities/pending-notifications.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationRetryLog, PendingNotification])
  ],
  controllers: [NotificationRetryLogsController],
  providers: [NotificationRetryLogsService],
  exports: [NotificationRetryLogsService],
})
export class NotificationRetryLogsModule {}
