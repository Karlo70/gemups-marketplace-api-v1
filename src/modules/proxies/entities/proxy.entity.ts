import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { ProxyOrderEntity } from './proxy-order.entity';

export enum ProxyType {
  TRAFFIC_GB = 'traffic_gb',
  IP_COUNT = 'ip_count',
  UNLIMITED = 'unlimited',
}

export enum ProxyProtocol {
  HTTP = 'http',
  HTTPS = 'https',
  SOCKS5 = 'socks5',
}

export enum ProxyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
}

@Entity('proxies')
export class ProxyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'proxy_name' })
  proxyName: string;

  @Column({ name: 'proxy_type', type: 'enum', enum: ProxyType })
  proxyType: ProxyType;

  @Column({ name: 'protocol', type: 'enum', enum: ProxyProtocol, default: ProxyProtocol.HTTP })
  protocol: ProxyProtocol;

  @Column({ name: 'host' })
  host: string;

  @Column({ name: 'port' })
  port: number;

  @Column({ name: 'username', nullable: true })
  username: string;

  @Column({ name: 'password', nullable: true })
  password: string;

  @Column({ name: 'zone' })
  zone: string;

  @Column({ name: 'ptype', type: 'int' })
  ptype: number;

  @Column({ name: 'flow', type: 'decimal', precision: 10, scale: 2, default: 0 })
  flow: number; // Traffic quota in GB, 0 for unlimited

  @Column({ name: 'flow_used', type: 'decimal', precision: 10, scale: 2, default: 0 })
  flowUsed: number; // Traffic used in GB

  @Column({ name: 'ip_count', type: 'int', default: 1 })
  ipCount: number;

  @Column({ name: 'region', length: 2, nullable: true })
  region: string; // ISO country code

  @Column({ name: 'status', type: 'enum', enum: ProxyStatus, default: ProxyStatus.ACTIVE })
  status: ProxyStatus;

  @Column({ name: 'is_test', default: false })
  isTest: boolean;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date;

  @Column({ name: 'last_used_at', nullable: true })
  lastUsedAt: Date;

  @Column({ name: 'order_no', nullable: true })
  orderNo: string; // 711 Proxy order number

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id', nullable: true })
  ownerId: string;

  @OneToMany(() => ProxyOrderEntity, (order) => order.proxy)
  orders: ProxyOrderEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
