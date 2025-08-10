import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { valueToBoolean } from './utils/to-boolean';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './shared/allExceptionFilter/all-exceptions.filter';
import { AllResponseInterceptor } from './shared/interceptors/all-response.interceptor';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from './modules/logger/logger.module';
import { LeadModule } from './modules/lead/lead.module';
import { VapiModule } from './modules/vapi/vapi.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SharedModule } from './shared/shared.module';
import { MemoryStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { AgentModule } from './modules/agent/agent.module';
import { AdminsModule } from './modules/admins/admins.module';
import { ModelsModule } from './modules/models/models.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { CronJobModule } from './modules/cron-job/cron-job.module';
import { CronLogModule } from './modules/cron-log/cron-log.module';
import { OptionalAuthGuard } from './shared/guards/optionalAuthentication.guard';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { PlansModule } from './modules/plans/plans.module';
import { NotificationSequenceModule } from './modules/notification-sequence/notification-sequence.module';
import { PendingNotificationsModule } from './modules/pending-notifications/pending-notifications.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { ThirdPartyApiModule } from './modules/third-party-api-key/third-party-api-key.module';
import { EmailsLogModule } from './modules/email-logs/emails-log.module';
import { NotificationSequenceRetriesModule } from './modules/notification-sequence-retries/notification-sequence-retries.module';
import { NotificationRetryLogsModule } from './modules/notification-retry-logs/notification-retry-logs.module';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          autoLoadEntities: true,
          synchronize: valueToBoolean(configService.get('DB_SYNCHRONIZE')),
          ...(configService.get('NODE_ENV') !== 'development' && {
            ssl: {
              rejectUnauthorized: false,
            },
          }),
        };
      },
    }),
    NestjsFormDataModule.config({
      isGlobal: true,
      storage: MemoryStoredFile,
    }),
    LeadModule,
    VapiModule,
    AuthModule,
    UsersModule,
    SharedModule,
    AgentModule,
    AdminsModule,
    ModelsModule,
    WebhooksModule,
    ScheduleModule.forRoot(),
    CronJobModule,
    CronLogModule,
    SubscriptionModule,
    PlansModule,
    NotificationSequenceModule,
    PendingNotificationsModule,
    TemplatesModule,
    ThirdPartyApiModule,
    EmailsLogModule,
    NotificationSequenceRetriesModule,
    NotificationRetryLogsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AllResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: OptionalAuthGuard,
    },
    AppService,
  ],
})
export class AppModule {}
