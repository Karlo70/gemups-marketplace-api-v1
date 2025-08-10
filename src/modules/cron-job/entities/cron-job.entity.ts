import { CronExpression } from '@nestjs/schedule';
import { CronLog } from 'src/modules/cron-log/entities/cron-log.entity';
import { NotificationChannel } from 'src/modules/notification-sequence/entities/notification-sequence.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CronStatus {
  ACTIVE = 'active',
  IN_ACTIVE = 'in_active',
}
@Entity('cron_jobs')
export class CronJob extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ enum: CronExpression, type: 'enum', default: CronExpression.EVERY_MINUTE })
  cron_expression: CronExpression;

  @Column({ enum: CronStatus, type: 'enum', default: CronStatus.ACTIVE })
  status: CronStatus;

  @Column({
    type: 'json',
    default: { email: true, sms: true, call: true },
  })
  notification_settings: Record<NotificationChannel, boolean>;

  @OneToMany(() => CronLog, (cron_log) => cron_log.cron_job)
  cron_log: CronLog[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true, default: null })
  deleted_at: Date;
}
