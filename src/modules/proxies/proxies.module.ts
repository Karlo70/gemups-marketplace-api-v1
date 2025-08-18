import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProxiesService } from './proxies.service';
import { ProxiesController } from './proxies.controller';
import { Proxy } from './entities/proxy.entity';
import { SevenElevenProxiesModule } from '../seven-eleven-proxies/seven-eleven-proxies.module';
import { SettingModule } from '../setting/setting.module';
import { Transaction } from '../transaction/entities/transaction.entity';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proxy, Transaction]),
    SevenElevenProxiesModule,
    SettingModule,
    SharedModule,
  ],
  controllers: [ProxiesController],
  providers: [ProxiesService],
  exports: [ProxiesService],
})
export class ProxiesModule {}
