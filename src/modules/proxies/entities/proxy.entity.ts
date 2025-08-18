import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProxiesProvider } from 'src/modules/products/entities/product.entity';
import { Transaction } from '../../transaction/entities/transaction.entity';

export enum ProxyType {
  RESIDENTIAL = 'residential',
  DATACENTER = 'datacenter',
  MOBILE = 'mobile',
  ROTATING = 'rotating',
}

export enum ProxyStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  FAILED = 'failed',
}

@Entity('proxy')
export class Proxy extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ProxyType })
  type: ProxyType;

  @Column({ type: 'enum', enum: ProxyStatus, default: ProxyStatus.PENDING })
  status: ProxyStatus;

  @Column({ type: 'enum', enum: ProxiesProvider })
  provider: ProxiesProvider;

  @Column({ nullable: true })
  provider_order_id: string;

  @Column({ nullable: true })
  ip_address: string;

  @Column({ nullable: true })
  port: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'decimal', precision: 20, scale: 4, default: 0 })
  price: number;

  @Column({ type: 'bigint', default: 0 })
  total_flow: number;

  @Column({ nullable: true })
  flow_unit: string;

  @Column({ nullable: true })
  un: string

  @Column({ nullable: true })
  expires_at: number;

  @Column({ type: 'timestamp', nullable: true })
  activated_at: Date;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  isp: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => User, (user) => user.proxies, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Transaction, (transaction) => transaction.proxy)
  transactions: Transaction[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  deleted_at: Date;
}
