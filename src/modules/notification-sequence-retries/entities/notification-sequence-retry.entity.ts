import { NotificationSequence } from "src/modules/notification-sequence/entities/notification-sequence.entity";
import { NotificationRetryLog } from "src/modules/notification-retry-logs/entities/notification-retry-log.entity";
import { Column, BaseEntity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Entity, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";

export enum NotificationSequenceRetriesStatus {
    ACTIVE = 'active',
    IN_ACTIVE = 'in_active',
}

// notification_sequence_retries.entity.ts
@Entity('notification_sequence_retries')
export class NotificationSequenceRetry extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => NotificationSequence, (sequence) => sequence.retries, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sequence_id' })
    sequence: NotificationSequence;

    @OneToMany(() => NotificationRetryLog, (retry_log) => retry_log.sequence_retry)
    retry_logs: NotificationRetryLog[];

    @Column({ type: 'int' })
    retry_order: number; // 1, 2, 3, etc.

    @Column({ type: 'int' })
    retry_delay_minutes: number;

    @Column({ type: 'enum', enum: NotificationSequenceRetriesStatus, default: NotificationSequenceRetriesStatus.ACTIVE })
    status: NotificationSequenceRetriesStatus;

    @Column({ nullable: true })
    deleted_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}