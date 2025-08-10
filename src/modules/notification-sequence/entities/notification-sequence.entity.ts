import { NotificationSequenceRetry } from 'src/modules/notification-sequence-retries/entities/notification-sequence-retry.entity';
import { PendingNotification } from 'src/modules/pending-notifications/entities/pending-notifications.entity';
import { Template } from 'src/modules/templates/entities/template.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  BaseEntity,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  CALL = 'call',
}

@Entity('notification_sequences')
export class NotificationSequence extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  step_order: number; // Step 1, Step 2, etc.

  @Column({ type: 'int', default: 0 })
  delay_offset_minutes: number; // e.g., 5, 1440 (1 day), 20160 (2 weeks), etc.

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ nullable: true })
  message_template: string; // Optional – for custom message logic

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => PendingNotification, (pending) => pending.sequence_step)
  pending_notifications: PendingNotification[];

  @OneToMany(() => NotificationSequenceRetry, (retry) => retry.sequence)
  retries: NotificationSequenceRetry[];

  @ManyToOne(() => Template, (template) => template.sequence)
  @JoinColumn({ name: 'template_id' })
  template: Template;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;
}
