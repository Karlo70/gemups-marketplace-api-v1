import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginAttempt } from './entities/login-attempt.entity';
import { SharedModule } from 'src/shared/shared.module';
import { LoginAttemptService } from './login-attempt.service';
import { Otp } from './entities/otp.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([User, LoginAttempt, Otp]),
    SharedModule,
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LoginAttemptService],
})
export class AuthModule {}
