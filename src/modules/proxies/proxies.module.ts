import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ProxiesController } from './proxies.controller';
import { ProxiesService } from './proxies.service';
import { ProxyEntity } from './entities/proxy.entity';
import { ProxyOrderEntity } from './entities/proxy-order.entity';
import { ProxyUsageEntity } from './entities/proxy-usage.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProxyEntity, ProxyOrderEntity, ProxyUsageEntity]),
    ConfigModule,
    HttpModule,
  ],
  controllers: [ProxiesController],
  providers: [ProxiesService],
  exports: [ProxiesService],
})
export class ProxiesModule {}
