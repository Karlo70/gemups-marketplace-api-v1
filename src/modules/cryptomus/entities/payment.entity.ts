import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WalletEntity } from './wallet.entity';
import { User } from 'src/modules/users/entities/user.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum PaymentType {
  CRYPTO = 'crypto',
  FIAT = 'fiat',
}

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cryptomus_payment_id', unique: true })
  cryptomusPaymentId: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ name: 'order_id', unique: true })
  orderId: string;

  @Column({ name: 'amount', type: 'decimal', precision: 18, scale: 8 })
  amount: number;

  @Column({ name: 'currency', length: 10 })
  currency: string;

  @Column({ name: 'payment_type', type: 'enum', enum: PaymentType })
  paymentType: PaymentType;

  @Column({ name: 'status', type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ name: 'wallet_address', nullable: true })
  walletAddress: string;

  @Column({ name: 'network', nullable: true })
  network: string;

  @Column({ name: 'tx_hash', nullable: true })
  txHash: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'description', nullable: true })
  description: string;

  @Column({ name: 'callback_url', nullable: true })
  callbackUrl: string;

  @Column({ name: 'return_url', nullable: true })
  returnUrl: string;

  @Column({ name: 'is_test', default: false })
  isTest: boolean;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => WalletEntity, { nullable: true })
  @JoinColumn({ name: 'wallet_id' })
  wallet: WalletEntity;

  @Column({ name: 'wallet_id', nullable: true })
  walletId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'paid_at', nullable: true })
  paidAt: Date;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date;
}
