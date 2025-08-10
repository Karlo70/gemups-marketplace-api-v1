import { User } from 'src/modules/users/entities/user.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('user_notification_setting')
export class UserNotificationSetting extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: true })
  is_email_enabled: boolean;

  @Column({ default: true })
  is_in_app_enabled: boolean;

  @Column({ default: true })
  is_push_enabled: boolean;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
