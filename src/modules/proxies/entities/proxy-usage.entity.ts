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

@Entity('proxy_usage')
export class ProxyUsageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'username' })
  username: string;

  @Column({ name: 'tzname', length: 50 })
  tzname: string; // Timezone name

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'traffic_used', type: 'decimal', precision: 10, scale: 2, default: 0 })
  trafficUsed: number; // Traffic used in GB

  @Column({ name: 'ip_rotations', type: 'int', default: 0 })
  ipRotations: number;

  @Column({ name: 'requests_count', type: 'int', default: 0 })
  requestsCount: number;

  @Column({ name: 'successful_requests', type: 'int', default: 0 })
  successfulRequests: number;

  @Column({ name: 'failed_requests', type: 'int', default: 0 })
  failedRequests: number;

  @Column({ name: 'average_response_time', type: 'decimal', precision: 8, scale: 3, nullable: true })
  averageResponseTime: number; // in milliseconds

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
