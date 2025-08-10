import { Module } from '@nestjs/common';
import { CronLogService } from './cron-log.service';
import { CronLogController } from './cron-log.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CronLog } from './entities/cron-log.entity';
import { CronJob } from '../cron-job/entities/cron-job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CronLog, CronJob])],
  controllers: [CronLogController],
  providers: [CronLogService],
})
export class CronLogModule {}
