import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from '../lead/entities/lead.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ThirdPartyAccessToken } from './entities/third-party-access-token.entity';
import { VapiModule } from '../vapi/vapi.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([Lead,User,ThirdPartyAccessToken]),
    NotificationsModule,
    VapiModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
