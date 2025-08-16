import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ProxySellerProxyStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive'
}

export enum ProxySellerProxyProtocol {
  HTTP = 'http',
  HTTPS = 'https',
  SOCKS5 = 'socks5'
}

@Entity('proxy_seller_proxies')
export class ProxySellerProxy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  proxy_name: string;

  @Column({ type: 'varchar', length: 45 })
  ip: string;

  @Column({ type: 'int' })
  port: number;

  @Column({ type: 'varchar', length: 255 })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({
    type: 'enum',
    enum: ProxySellerProxyProtocol,
    default: ProxySellerProxyProtocol.HTTP
  })
  protocol: ProxySellerProxyProtocol;

  @Column({ type: 'varchar', length: 50 })
  zone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subaccountId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subaccountUsername: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({
    type: 'enum',
    enum: ProxySellerProxyStatus,
    default: ProxySellerProxyStatus.ACTIVE
  })
  status: ProxySellerProxyStatus;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  isTest: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => User, (user) => user.proxy_seller_proxies)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @Column({ nullable: true })
  deleted_at: Date;
}
