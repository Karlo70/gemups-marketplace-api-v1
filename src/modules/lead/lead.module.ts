import { Module } from '@nestjs/common';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { VapiModule } from '../vapi/vapi.module';
import { PendingNotificationsModule } from '../pending-notifications/pending-notifications.module';
import { Lead } from './entities/lead.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([Lead]),
    NotificationsModule,
    VapiModule,
    PendingNotificationsModule
  ],
  controllers: [LeadController],
  providers: [LeadService],
  exports: [LeadService],
})
export class LeadModule {}
