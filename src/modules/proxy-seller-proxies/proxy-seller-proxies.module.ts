import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ProxySellerUserProxiesService } from './proxy-seller-sub-user-proxies.service';
import { ProxySellerProxiesController } from './proxy-seller-proxies.controller';
import { ProxySellerProxy } from './entities/proxy-seller-proxy.entity';
import { ProxySellerService } from './proxy-seller-proxies.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProxySellerProxy]),
    HttpModule,
  ],
  controllers: [ProxySellerProxiesController],
  providers: [ProxySellerUserProxiesService, ProxySellerService],
  exports: [ProxySellerUserProxiesService, ProxySellerService],
})
export class ProxySellerProxiesModule { }
