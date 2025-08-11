import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { ProxyEntity } from './proxy.entity';

export enum OrderStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('proxy_orders')
export class ProxyOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_no', unique: true })
  orderNo: string; // 711 Proxy order number

  @Column({ name: 'flow', type: 'decimal', precision: 10, scale: 2 })
  flow: number; // Traffic quota in GB

  @Column({ name: 'expire', nullable: true })
  expire: Date;

  @Column({ name: 'host_label', nullable: true })
  hostLabel: string;

  @Column({ name: 'username' })
  username: string;

  @Column({ name: 'password' })
  password: string;

  @Column({ name: 'host' })
  host: string;

  @Column({ name: 'port' })
  port: number;

  @Column({ name: 'protocol', length: 10 })
  protocol: string;

  @Column({ name: 'status', type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ name: 'is_test', default: false })
  isTest: boolean;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => ProxyEntity, { nullable: true })
  @JoinColumn({ name: 'proxy_id' })
  proxy: ProxyEntity;

  @Column({ name: 'proxy_id', nullable: true })
  proxyId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
