import { Injectable } from '@nestjs/common';
import { UserNotification } from '../entities/user-notification.entity';
import {
  EventType,
  RealTimeGateway,
} from 'src/shared/gateway/real-time.gateway';

@Injectable()
export class InAppNotificationService {
  constructor(private readonly realTimeGateway: RealTimeGateway) {}

  async sendNotification(userNotification: UserNotification, payload: any) {
    this.realTimeGateway.sendEventToUser(
      userNotification.user.id,
      EventType.NOTIFICATION,
      {
        id: userNotification.id,
        title: userNotification.notification.title,
        entity_type: userNotification.notification.entity_type,
        entity_id: userNotification.notification.entity_id,
        message: userNotification.notification.message,
        meta_data: payload,
      },
    );
  }
}
