import {
  NotificationChannel,
  NotificationEntityType,
  NotificationType,
} from '../entities/notification.entity';
import { EmailTemplate } from '../enums/email-template.enum';

export interface TransactionalNotificationPayload {
  user_ids: string[];
  title: string;
  message: string;
  is_displayable: boolean;
  bypass_user_preferences: boolean;
  channels: NotificationChannel[];
  notification_type: NotificationType;
  template?: EmailTemplate;
  entity_type?: NotificationEntityType;
  entity_id?: string;
  meta_data?: Record<string, any>;
}

export interface NonTransactionalNotificationPayload {}
