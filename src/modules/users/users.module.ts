import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MediaModule } from '../media/media.module';
import { Subscription } from '../subscription/entities/subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Subscription]),
    NotificationsModule,
    MediaModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
