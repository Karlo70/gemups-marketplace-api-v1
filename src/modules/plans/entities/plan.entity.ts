import { Subscription } from '../../subscription/entities/subscription.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  OneToMany,
} from 'typeorm';

export enum PlanType {
  FREE = 'free',
  PAID = 'paid',
}

export enum BillingDuration {
  MONTHLY = 'month',
  YEARLY = 'year',
}

@Entity('plans')
export class Plan extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'stripe_product_id', type: 'varchar', nullable: true })
  stripe_product_id: string;

  @Column({
    name: 'plan_type',
    type: 'enum',
    enum: PlanType,
  })
  plan_type: PlanType;

  @Column({
    name: 'billing_duration',
    type: 'enum',
    enum: BillingDuration,
    nullable: true,
  })
  billing_duration: BillingDuration;
  
  @Column({ nullable: true })
  free_duration: number; // ** number of days

  @Column({ name: 'short_description', type: 'text' })
  short_description: string;

  @Column({ name: 'great_for_use', type: 'text' })
  great_for_use: string;

  @Column('text', { array: true })
  points: string[];

  @Column({ name: 'has_used', type: 'boolean', default: false })
  has_used: boolean;

  @Column({ name: 'monthly_price', type: 'float', nullable: true })
  monthly_price: number;

  @Column({ name: 'stripe_monthly_price_id', type: 'varchar', nullable: true })
  stripe_monthly_price_id: string;

  @Column({ name: 'yearly_price', type: 'float', nullable: true })
  yearly_price: number;

  @Column({ name: 'stripe_yearly_price_id', type: 'varchar', nullable: true })
  stripe_yearly_price_id: string;

  @Column({
    name: 'archived',
    type: 'timestamp',
    nullable: true,
    default: null,
  })
  archived: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true, default: null })
  deleted_at: Date;
}
