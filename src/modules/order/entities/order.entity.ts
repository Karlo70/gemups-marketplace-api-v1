import { BaseEntity, Column, CreateDateColumn, Entity, UpdateDateColumn, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, DeleteDateColumn, OneToMany } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { OrderItem } from "./order-item.entity";

export enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PROCESSING = "processing",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    FAILED = "failed",
    REFUNDED = "refunded"
}

export enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    FAILED = "failed",
    REFUNDED = "refunded",
    PARTIALLY_REFUNDED = "partially_refunded"
}

export enum PaymentMethod {
    CREDIT_CARD = "credit_card",
    DEBIT_CARD = "debit_card",
    BANK_TRANSFER = "bank_transfer",
    CRYPTO = "crypto",
    PAYPAL = "paypal"
}

@Entity()
export class Order extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({ type: 'int', default: 0 })
    total_items: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    subtotal: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    tax_amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discount_amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total_amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    final_amount: number;

    @Column({ type: "enum", enum: OrderStatus, default: OrderStatus.PENDING })
    status: OrderStatus;

    @Column({ type: "enum", enum: PaymentStatus, default: PaymentStatus.PENDING })
    payment_status: PaymentStatus;

    @Column({ type: "enum", enum: PaymentMethod, nullable: true })
    payment_method: PaymentMethod;

    @Column({ nullable: true })
    payment_transaction_id: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'text', nullable: true })
    admin_notes: string;

    @Column({ type: 'timestamp', nullable: true })
    paid_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    completed_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    cancelled_at: Date;

    @Column({ nullable: true })
    cancelled_reason: string;

    @Column({ type: 'json', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn({ nullable: true })
    deleted_at: Date;

    // Relationships
    @ManyToOne(() => User, user => user.orders)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true })
    items: OrderItem[];
}
