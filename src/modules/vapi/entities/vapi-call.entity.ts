import { Lead } from 'src/modules/lead/entities/lead.entity';
import { CallFrom, CommunicationChannel, VapiCallEndedReason, VapiStatus } from "../enums/call-and-enums";
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
import { CronLog } from 'src/modules/cron-log/entities/cron-log.entity';

@Entity('vapi_calls')
export class VapiCall extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  assistant_id: string;

  @Column()
  phone_number_id: string;

  @Column()
  phone_number: string;

  @Column({ default: null, type: 'uuid' })
  call_id: string;

  @Column({
    type: 'enum',
    enum: CallFrom,
    nullable: true,
    default: CallFrom.SYSTEM
  })
  call_from: CallFrom;

  @Column({
    type: 'enum',
    enum: VapiStatus,
    nullable: true,
    default: null,
  })
  status: VapiStatus;

  @Column({
    type: 'enum',
    enum: CommunicationChannel,
    nullable: true,
    default: null,
  })
  communication_channel: CommunicationChannel;

  @Column({ type: 'text', nullable: true, default: null })
  transcription: string;

  @Column({ type: 'text', nullable: true, default: null })
  summary: string;

  @Column({ nullable: true, default: null })
  call_recording_url: string;

  @Column({ enum: VapiCallEndedReason, nullable: true, default: null })
  call_end_reason: VapiCallEndedReason;

  @Column({ nullable: true, default: null })
  started_at: Date;

  @Column({ nullable: true, default: null })
  ended_at: Date;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, default: null })
  cost: string;

  @OneToOne(() => CronLog, (cron_log) => cron_log.vapi_call)
  cron_log: CronLog;

  @ManyToOne(() => Lead, (lead) => lead.vapi_calls, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true, default: null })
  deleted_at: Date;
}
