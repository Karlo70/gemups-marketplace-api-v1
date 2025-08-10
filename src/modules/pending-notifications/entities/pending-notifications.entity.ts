import { EmailLog } from 'src/modules/email-logs/entities/email-log.entity';
import { Lead } from 'src/modules/lead/entities/lead.entity';
import { NotificationRetryLog } from 'src/modules/notification-retry-logs/entities/notification-retry-log.entity';
import { NotificationSequence } from 'src/modules/notification-sequence/entities/notification-sequence.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('pending_notifications')
export class PendingNotification extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Lead, (lead) => lead.pending_notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @ManyToOne(() => NotificationSequence, (sequence) => sequence.pending_notifications)
  @JoinColumn({ name: 'sequence_step_id' })
  sequence_step: NotificationSequence;

  @Column({ type: 'int' })
  scheduled_for: number;

  @Column({ default: true })
  should_send: boolean;

  @Column({ default: null })
  is_sent: Date;

  @Column({ default: null })
  error: string;

  @ManyToOne(() => User, (user) => user.pending_notifications, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: User;

  @OneToMany(() => EmailLog, (emailsLog) => emailsLog.pending_notification)
  emails_log: EmailLog[];

  @OneToMany(() => NotificationRetryLog, (retry_logs) => retry_logs.pending_notification)
  retry_logs: NotificationRetryLog[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  deleted_at: Date;
}
