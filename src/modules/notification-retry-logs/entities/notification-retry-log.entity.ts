import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, JoinColumn, BaseEntity, UpdateDateColumn } from 'typeorm';
import { PendingNotification } from 'src/modules/pending-notifications/entities/pending-notifications.entity';
import { NotificationSequenceRetry } from 'src/modules/notification-sequence-retries/entities/notification-sequence-retry.entity';

@Entity('notification_retry_logs')
export class NotificationRetryLog extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => PendingNotification, (pending) => pending.retry_logs, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pending_notification_id' })
    pending_notification: PendingNotification;

    @ManyToOne(() => NotificationSequenceRetry, (sequence_retry) => sequence_retry.retry_logs, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sequence_retry_id' })
    sequence_retry: NotificationSequenceRetry;

    @Column({ type: 'timestamp', nullable: true })
    attempted_at: Date;

    @Column({ nullable: true })
    error: string; // Error message if failed, null if success

    @Column({ default: false })
    success: boolean;

    @Column({ nullable: true })
    deleted_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}