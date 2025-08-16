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
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SharedModule } from './shared/shared.module';
import { MemoryStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { CryptomusModule } from './modules/cryptomus/cryptomus.module';
import { OptionalAuthGuard } from './shared/guards/optionalAuthentication.guard';
import { ProductsModule } from './modules/products/products.module';
import { OrderModule } from './modules/order/order.module';
import { CategoryModule } from './modules/category/category.module';
import { SevenElevenProxiesModule } from './modules/seven-eleven-proxies/seven-eleven-proxies.module';
import { CartModule } from './modules/cart/cart.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { ProxySellerProxiesModule } from './modules/proxy-seller-proxies/proxy-seller-proxies.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        return {
          url:configService.get("DB_URL"),
          type:"postgres",
          synchronize:true,
          autoLoadEntities:true,
         // ssl:{
         // rejectUnauthorized:false,
          // ca: configService.get("BB_CA")
         // }
          /*
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
              rejectUnauthorized: true,
              ca : configService.get("DB_CA")
          },
        }),
        */
        };
      },
    }),
    NestjsFormDataModule.config({
      isGlobal: true,
      storage: MemoryStoredFile,
    }),
    AuthModule,
    UsersModule,
    SharedModule,
    WebhooksModule,
    CryptomusModule,
    ScheduleModule.forRoot(),
    ProductsModule,
    OrderModule,
    CategoryModule,
    SevenElevenProxiesModule,
    CartModule,
    TransactionModule,
    ProxySellerProxiesModule,
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
