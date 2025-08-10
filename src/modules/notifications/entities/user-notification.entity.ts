import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Notification } from './notification.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UserNotificationSetting } from './user-notification-setting.entity';

export enum UserNotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('user_notification')
export class UserNotification extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => Notification,
    (notification) => notification.user_notifications,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'notification_id' })
  notification: Notification;

  @Column({ default: false })
  is_displayable: boolean;

  @Column({ default: false })
  bypass_user_preferences: boolean;

  @ManyToOne(() => User, (user) => user.user_notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User;

  @Column({
    type: 'enum',
    enum: UserNotificationStatus,
    default: UserNotificationStatus.PENDING,
  })
  status: UserNotificationStatus;

  @Column({ default: false })
  is_read: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
