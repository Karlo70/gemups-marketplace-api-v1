import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ThirdPartyAccessToken } from './entities/third-party-access-token.entity';
import { CryptomusModule } from '../cryptomus/cryptomus.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([User,ThirdPartyAccessToken]),
    NotificationsModule,
    CryptomusModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
