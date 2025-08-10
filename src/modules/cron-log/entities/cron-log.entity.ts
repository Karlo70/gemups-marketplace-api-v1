import { CronJob } from 'src/modules/cron-job/entities/cron-job.entity';
import { VapiCall } from 'src/modules/vapi/entities/vapi-call.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CronLogStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}
@Entity('cron_logs')
export class CronLog extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ enum: CronLogStatus, default: CronLogStatus.PENDING })
  status: CronLogStatus;

  @Column({ nullable: true })
  error: string;

  @ManyToOne(() => CronJob, (cron_job) => cron_job.cron_log)
  @JoinColumn({ name: 'cron_job_id' })
  cron_job: CronJob;

  @OneToOne(() => VapiCall, (vapi_call) => vapi_call.cron_log)
  @JoinColumn({ name: 'vapi_call_id' })
  vapi_call: VapiCall;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
