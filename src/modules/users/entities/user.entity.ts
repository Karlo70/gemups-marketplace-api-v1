import { LoginAttempt } from 'src/modules/auth/entities/login-attempt.entity';
import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Otp } from 'src/modules/auth/entities/otp.entity';
import { Media } from 'src/modules/media/entities/media.entity';
import { UserNotificationSetting } from 'src/modules/notifications/entities/user-notification-setting.entity';
import { UserNotification } from 'src/modules/notifications/entities/user-notification.entity';
import { Subscription } from 'src/modules/subscription/entities/subscription.entity';
import { ThirdPartyApi } from 'src/modules/third-party-api-key/entities/third-party-api-key.entity';
import { PendingNotification } from 'src/modules/pending-notifications/entities/pending-notifications.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  ANONYMOUS = 'anonymous',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('user')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Media, { onDelete: 'SET NULL', nullable: true, eager: true })
  @JoinColumn({ name: 'profile_image_id' })
  profile_image: Media;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ nullable: true })
  phone_no: string;

  @Column({ nullable: true })
  email: string;

  @Column({ select: false, nullable: true })
  password: string;

  @Column({ nullable: true })
  stripe_customer_id: string;

  @Column({ nullable: true })
  stripe_connect_account_id: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ nullable: true })
  time_zone: string;

  @Column({ nullable: true })
  anonymous_token: string;

  @Column({ nullable: true })
  deleted_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => LoginAttempt, (loginAttempt) => loginAttempt.user)
  login_attempts: LoginAttempt[];

  @Column({ default: false })
  has_used_free_trial: boolean;

  @Column({ default: false })
  has_taken_plan: boolean;

  @OneToMany(() => Otp, (otp) => otp.user)
  otps: Otp[];

  @OneToOne(
    () => UserNotificationSetting,
    (userNotificationSetting) => userNotificationSetting.user,
  )
  user_notification_setting: UserNotificationSetting;

  @OneToOne(() => Subscription, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'latest_subscription_id' })
  latest_subscription: Subscription;

  @Column({ default: false })
  has_taken_subscription: boolean; // ** used for stepper on frontend

  @OneToMany(
    () => UserNotification,
    (userNotification) => userNotification.user,
  )
  user_notifications: UserNotification[];

  @OneToMany(() => ThirdPartyApi, (thirdPartyApi) => thirdPartyApi.created_by)
  third_party_api: ThirdPartyApi[];

  @OneToMany(() => PendingNotification, (pendingNotification) => pendingNotification.created_by)
  pending_notifications: PendingNotification[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async comparePassword(receivedPassword: string) {
    return bcrypt.compare(receivedPassword, this.password);
  }
}
