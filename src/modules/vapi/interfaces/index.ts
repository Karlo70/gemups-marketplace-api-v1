import { Request } from 'express';
import { CronLog } from 'src/modules/cron-log/entities/cron-log.entity';
export interface CallFuncInterface {
  body: any;
  req?: Request;
  inside_system?: boolean;
  cron_log?: CronLog;
}
