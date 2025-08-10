import { EmailLog } from 'src/modules/email-logs/entities/email-log.entity';
import { PendingNotification } from 'src/modules/pending-notifications/entities/pending-notifications.entity';
import { VapiCall } from 'src/modules/vapi/entities/vapi-call.entity';
import { IndustryType } from '../enums/industries-enum';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CallStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
}

@Entity('leads')
export class Lead extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  position: string;

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  is_email_send: Date;

  @Column({ nullable: true, default: null })
  message: string;

  @Column({ nullable: true })
  company_name: string;

  @Column({ nullable: true })
  ref_website: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true, type: 'text', default: null })
  lead_from: string;

  @Column({ nullable: true, type: 'text', default: null })
  email_body: string;

  @Column({ nullable: true, type: 'text', default: null })
  subject: string;

  @Column({
    nullable: true,
    type: 'enum',
    enum: CallStatus,
    default: CallStatus.PENDING,
  })
  call_status: CallStatus;

  @Column({ nullable: true })
  industry: string;

  @OneToMany(() => VapiCall, (vapi_call) => vapi_call.lead, { cascade: true, onDelete: 'CASCADE' })
  vapi_calls: VapiCall[];

  @OneToMany(() => PendingNotification, (pending) => pending.lead, { cascade: true, onDelete: 'CASCADE' })
  pending_notifications: PendingNotification[];

  @OneToMany(() => EmailLog, (emailsLog) => emailsLog.lead, { cascade: true, onDelete: 'CASCADE' })
  emails_log: EmailLog[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  deleted_at: Date;

  @BeforeInsert()
  setName() {
    if (this.first_name && this.last_name) {
      this.name = `${this.first_name} ${this.last_name}`;
    }
  }
}
