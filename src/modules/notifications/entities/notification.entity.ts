import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserNotification } from './user-notification.entity';
import { EmailTemplate } from '../enums/email-template.enum';

export enum NotificationEntityType {
  CERTIFICATE = 'certificate',
  SUBSCRIPTION = 'subscription',
  EMPLOYEE = 'employee',
  OTP = 'otp',
  TENDER = 'tender',
  ACCESS_REQUEST = 'access_request',
  BID = 'bid',
  CHAT = 'chat',
  MESSAGE = 'message',
  TRANSACTION = 'transaction',
  EARNING = 'earning',
  LEAD = 'lead',
  OTHER = 'other',
}

export enum NotificationType {
  TRANSACTION = 'transactional',
  NON_TRANSACTIONAL = 'non_transactional',
}

export enum NotificationChannel {
  EMAIL = 'email',
  IN_APP = 'in_app',
  PUSH = 'push',
}

@Entity('notification')
export class Notification extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.TRANSACTION,
  })
  notification_type: NotificationType;

  @Column({
    type: 'enum',
    enum: EmailTemplate,
    nullable: true,
  })
  template: EmailTemplate;

  @Column({
    type: 'text',
    array: true,
    default: `{${NotificationChannel.EMAIL},${NotificationChannel.IN_APP},${NotificationChannel.PUSH}}`,
  })
  channels: NotificationChannel[];

  @Column({
    type: 'enum',
    enum: NotificationEntityType,
    nullable: true,
  })
  @Index()
  entity_type: NotificationEntityType;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  entity_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(
    () => UserNotification,
    (userNotification) => userNotification.notification,
  )
  user_notifications: UserNotification[];
}
