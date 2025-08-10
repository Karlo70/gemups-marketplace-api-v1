import { Module } from '@nestjs/common';
import { VapiService } from './vapi.service';
import { VapiController } from './vapi.controller';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from '../agent/entities/agent.entity';
import { VapiCall } from './entities/vapi-call.entity';
import { Lead } from '../lead/entities/lead.entity';
import { PendingNotificationsModule } from '../pending-notifications/pending-notifications.module';
import { CronLog } from '../cron-log/entities/cron-log.entity';
import { PendingNotification } from '../pending-notifications/entities/pending-notifications.entity';
@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([VapiCall, Agent, Lead, CronLog, PendingNotification]), PendingNotificationsModule],
  controllers: [VapiController],
  providers: [VapiService],
  exports: [VapiService]
})
export class VapiModule { }
