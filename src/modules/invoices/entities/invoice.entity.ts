import { Subscription } from 'src/modules/subscription/entities/subscription.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum InvoiceStatus {
  PAID = 'paid',
}

@Entity('invoice')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  stripe_invoice_id: string;

  @Column({ nullable: true })
  stripe_hosted_invoice_url: string;

  @Column({ nullable: true })
  stripe_invoice_pdf: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.PAID,
  })
  status: InvoiceStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount_paid: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount_due: number;

  @Column({ nullable: true })
  due_date: Date;

  @Column({ nullable: true })
  payment_date: Date;

  @Column({ nullable: true })
  failure_reason: string;

  @Column({ default: 0 })
  retries_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Subscription, (subscription) => subscription.invoices, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
