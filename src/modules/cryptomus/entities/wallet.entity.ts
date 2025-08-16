import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
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

// export enum NetworkType {
//   BITCOIN = 'bitcoin',
//   ETHEREUM = 'ethereum',
//   BINANCE_SMART_CHAIN = 'bsc',
//   POLYGON = 'polygon',
//   SOLANA = 'solana',
//   TRON = 'tron',
//   LITECOIN = 'litecoin',
//   DOGECOIN = 'dogecoin',
// }

@Entity('wallets')
export class WalletEntity extends BaseEntity{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cryptomus_wallet_id', unique: true })
  cryptomus_wallet_id: string;

  @Column({ name: 'cryptomus_wallet_uuid', unique: true })
  cryptomus_wallet_uuid: string;

  @Column({ name: 'cryptomus_wallet_address', unique: true })
  cryptomus_wallet_address: string;

  @Column({ name: 'network' })
  network: string;

  @Column({ name: 'currency', length: 10 })
  currency: string;

  @Column({ name: 'url' })
  url: string;

  @Column({ name: 'status', type: 'enum', enum: WalletStatus, default: WalletStatus.ACTIVE })
  status: WalletStatus;

  @Column({ name: 'balance', type: 'decimal', precision: 18, scale: 8, default: 0 })
  balance: number;

  @OneToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => PaymentEntity, (payment) => payment.wallet)
  payments: PaymentEntity[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @Column({ nullable:true })
  deleted_at: Date;

  @Column({ name: 'last_activity', nullable: true })
  last_activity: Date;
}
