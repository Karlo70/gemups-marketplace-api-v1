import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ProxySellerProxiesService } from './proxy-seller-sub-user-proxies.service';
import { ProxySellerProxiesController } from './proxy-seller-proxies.controller';
import { ProxySellerProxy } from './entities/proxy-seller-proxy.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProxySellerProxy]),
    HttpModule,
  ],
  controllers: [ProxySellerProxiesController],
  providers: [ProxySellerProxiesService],
  exports: [ProxySellerProxiesService],
})
export class ProxySellerProxiesModule {}
