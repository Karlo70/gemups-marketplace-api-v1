import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SevenElevenProxiesService } from './seven-eleven-proxies.service';
import { SevenElevenProxiesController } from './seven-eleven-proxies.controller';
import { SevenElevenProxy } from './entities/seven-eleven-proxy.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import sevenElevenProxiesConfig from './config/711proxy.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([SevenElevenProxy]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [sevenElevenProxiesConfig],
    }),
  ],
  controllers: [SevenElevenProxiesController],
  providers: [SevenElevenProxiesService],
  exports: [SevenElevenProxiesService],
})
export class SevenElevenProxiesModule {}
