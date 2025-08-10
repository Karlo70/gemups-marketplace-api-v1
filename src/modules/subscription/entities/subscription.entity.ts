import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  OneToMany,
} from 'typeorm';
import { Plan } from 'src/modules/plans/entities/plan.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Invoice } from 'src/modules/invoices/entities/invoice.entity';

export enum SubscriptionStatuses {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
}

@Entity('subscriptions')
export class Subscription extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.latest_subscription)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Plan, (plan) => plan.subscriptions)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @OneToMany(() => Invoice, (invoice) => invoice.subscription)
  invoices: Invoice[];

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  start_date: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  end_date: Date;

  @Column({ name: 'stripe_subscription_id', nullable: true })
  stripe_subscription_id: string;

  @Column({ name: 'stripe_subscription_item_id', nullable: true })
  stripe_subscription_item_id: string;

  @Column({ default: false })
  cancel_at_period_end: boolean;

  @Column({
    name: 'sub_status',
    type: 'enum',
    enum: SubscriptionStatuses,
    nullable: true,
  })
  sub_status: SubscriptionStatuses;

  @Column({ name: 'amount_paid', type: 'float', nullable: true })
  amount_paid: number;

  @Column({ name: 'payment_status', nullable: true })
  payment_status: string;

  @Column({ name: 'payment_failed_count', type: 'int', default: 0 })
  payment_failed_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
