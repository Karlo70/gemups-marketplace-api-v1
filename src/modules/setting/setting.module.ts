import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingService } from './setting.service';
import { SettingController } from './setting.controller';
import { Setting, ProxyPricingSetting } from './entities/setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Setting, ProxyPricingSetting])],
  controllers: [SettingController],
  providers: [SettingService],
  exports: [SettingService],
})
export class SettingModule {}
