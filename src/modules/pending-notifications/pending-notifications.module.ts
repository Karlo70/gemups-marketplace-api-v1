import { Module } from '@nestjs/common';
import { PendingNotificationsService } from './pending-notifications.service';
import { PendingNotificationsController } from './pending-notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationSequence } from '../notification-sequence/entities/notification-sequence.entity';
import { Lead } from '../lead/entities/lead.entity';
import { PendingNotification } from './entities/pending-notifications.entity';
import { EmailLog } from '../email-logs/entities/email-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PendingNotification, NotificationSequence, Lead, EmailLog]),
  ],
  controllers: [PendingNotificationsController],
  providers: [PendingNotificationsService],
  exports: [PendingNotificationsService],
})
export class PendingNotificationsModule {}
