import { Injectable } from '@nestjs/common';
import { UserNotification } from '../entities/user-notification.entity';
import * as firebase from 'firebase-admin';
import serviceAccount from '../firebase-credentials/firebase';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginAttempt } from 'src/modules/auth/entities/login-attempt.entity';
import { Index, Repository } from 'typeorm';
import { MulticastMessage } from 'firebase-admin/lib/messaging/messaging-api';

@Injectable()
export class PushNotificationService {
  constructor(
    @InjectRepository(LoginAttempt)
    private readonly loginAttemptRepository: Repository<LoginAttempt>,
  ) {
    firebase.initializeApp({
      credential: firebase.credential.cert(
        JSON.parse(JSON.stringify(serviceAccount)),
      ),
    });
  }

  async sendNotification(userNotification: UserNotification, payload: any) {
    const loginAttempt = await this.loginAttemptRepository
    .createQueryBuilder('login_attempt')
    .leftJoinAndSelect('login_attempt.user', 'user')
    .where('user.id = :user_id', { user_id: userNotification.user.id })
    .andWhere('login_attempt.expire_at > :currentDate', {
      currentDate: new Date(),
    })
    .andWhere('login_attempt.logout_at IS NULL')
    .distinctOn(["fcm_device_token"])
    .orderBy("fcm_device_token", "ASC")
    .getMany();

    const tokens = loginAttempt
    .map((attempts) => attempts.fcm_device_token)
    .filter(Boolean); // if no fcm token then remove it

    if (tokens.length) {
      const payload = {
        tokens,
        webpush: {
          data: {
            title: userNotification.notification.title,
            body: userNotification.notification.message,
            entity_type: userNotification.notification.entity_type,
            entity_id: userNotification.notification.entity_id,
            user_role: userNotification.user.role
          },
        },
      };

      try {
        const response = await firebase
          .messaging()
          .sendEachForMulticast(payload as MulticastMessage);

        const invalidTokens: string[] = [];
        response.responses.forEach((result, index) => {
          if (!result.success) {
            invalidTokens.push(tokens[index]);
          }
        });

        if (invalidTokens.length > 0) {
          await this.loginAttemptRepository
            .createQueryBuilder()
            .update(LoginAttempt)
            .set({ expire_at: new Date() })
            .where('fcm_device_token IN (:...invalidTokens)', { invalidTokens })
            .execute();
        }
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }
  }
}
