import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from 'typeorm';
import { PaymentEntity } from './payment.entity';
import { User } from 'src/modules/users/entities/user.entity';

export enum WalletStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

export enum NetworkType {
  BITCOIN = 'bitcoin',
  ETHEREUM = 'ethereum',
  BINANCE_SMART_CHAIN = 'bsc',
  POLYGON = 'polygon',
  SOLANA = 'solana',
  TRON = 'tron',
  LITECOIN = 'litecoin',
  DOGECOIN = 'dogecoin',
}

@Entity('wallets')
export class WalletEntity extends BaseEntity{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cryptomus_wallet_id', unique: true })
  cryptomusWalletId: string;

  @Column({ name: 'wallet_name' })
  walletName: string;

  @Column({ name: 'wallet_address', unique: true })
  walletAddress: string;

  @Column({ name: 'network' })
  network: string;

  @Column({ name: 'currency', length: 10 })
  currency: string;

  @Column({ name: 'currency_symbol', length: 10 })
  currencySymbol: string;

  @Column({ name: 'status', type: 'enum', enum: WalletStatus, default: WalletStatus.ACTIVE })
  status: WalletStatus;

  @Column({ name: 'is_test', default: false })
  isTest: boolean;

  @Column({ name: 'balance', type: 'decimal', precision: 18, scale: 8, default: 0 })
  balance: number;

  @Column({ name: 'min_amount', type: 'decimal', precision: 18, scale: 8, nullable: true })
  minAmount: number;

  @Column({ name: 'max_amount', type: 'decimal', precision: 18, scale: 8, nullable: true })
  maxAmount: number;

  @Column({ name: 'daily_limit', type: 'decimal', precision: 18, scale: 8, nullable: true })
  dailyLimit: number;

  @Column({ name: 'daily_used', type: 'decimal', precision: 18, scale: 8, default: 0 })
  dailyUsed: number;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ name: 'api_key', nullable: true })
  apiKey: string;

  @Column({ name: 'webhook_secret', nullable: true })
  webhookSecret: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id', nullable: true })
  ownerId: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => PaymentEntity, (payment) => payment.wallet)
  payments: PaymentEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_activity', nullable: true })
  lastActivity: Date;
}
