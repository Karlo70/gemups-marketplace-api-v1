import { Lead } from "src/modules/lead/entities/lead.entity";
import { PendingNotification } from "src/modules/pending-notifications/entities/pending-notifications.entity";
import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum EmailLogStatus {
    SENT = 'sent',
    FAILED = 'failed',
}

@Entity("email_logs")
export class EmailLog extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    email: string;

    @Column({ nullable: true })
    body: string;

    @Column({
        type: 'enum',
        enum: EmailLogStatus,
        default: EmailLogStatus.SENT,
    })
    status: EmailLogStatus;

    @Column({ nullable: true })
    error: string;

    @ManyToOne(() => PendingNotification, (pendingNotification) => pendingNotification.emails_log)
    @JoinColumn({ name: 'pending_notification_id' })
    pending_notification: PendingNotification;

    @ManyToOne(() => Lead, (lead) => lead.emails_log, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'lead_id' })
    lead: Lead;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ nullable: true })
    deleted_at: Date;
}
