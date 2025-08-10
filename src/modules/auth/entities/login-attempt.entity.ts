import { User } from 'src/modules/users/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum LoginType {
  FACEBOOK = 'facebook',
  APPLE = 'apple',
  GOOGlE = 'google',
  EMAIL = 'email',
  ANONYMOUS = 'anonymous'
}

@Entity('login_attempt')
export class LoginAttempt extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  access_token: string;

  @Column({ default: null })
  expire_at: Date;

  @Column({ default: null })
  logout_at: Date;

  @Column({ nullable: true })
  platform: string;

  @Column({ nullable: true })
  ip_address: string;

  @Column({ nullable: true })
  user_agent: string;

  @Column({ type: 'enum', enum: LoginType, default: LoginType.EMAIL })
  login_type: LoginType;

  @DeleteDateColumn()
  deleted_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  user_socket_id: string;

  @Column({ nullable: true })
  fcm_device_token: string;

  @ManyToOne(() => User, (user) => user.login_attempts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
