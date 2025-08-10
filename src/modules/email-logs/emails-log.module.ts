import { Module } from '@nestjs/common';
import { EmailLogService } from './email-log.service';
import { EmailLogController } from './email-log.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailLog } from './entities/email-log.entity';
import { Lead } from '../lead/entities/lead.entity';
import { PendingNotification } from '../pending-notifications/entities/pending-notifications.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmailLog,Lead,PendingNotification])],
  controllers: [EmailLogController],
  providers: [EmailLogService],
  exports: [EmailLogService],
})
export class EmailsLogModule {}
