import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';

import { EmailNotificationService } from '../services/email-notification.service';
import { InAppNotificationService } from '../services/in-app-notification.service';
import { NotificationChannel } from '../entities/notification.entity';
import {
  UserNotification,
  UserNotificationStatus,
} from '../entities/user-notification.entity';
import { UserNotificationSetting } from '../entities/user-notification-setting.entity';
import { PushNotificationService } from '../services/push-notification.service';

const MAX_RETRIES = 3; // Max retries before marking job as failed

@Processor('notifications-queue')
export class NotificationConsumer extends WorkerHost {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(
    private readonly emailNotificationService: EmailNotificationService,
    private readonly inAppNotificationService: InAppNotificationService,
    private readonly pushNotificationService: PushNotificationService,

    @InjectRepository(UserNotification)
    private readonly userNotificationRepository: Repository<UserNotification>,

    @InjectRepository(UserNotificationSetting)
    private readonly userNotificationSettingRepository: Repository<UserNotificationSetting>,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    console.log(
      `🚀 Processing job: ${job.id} (Attempt ${job.attemptsMade + 1})`,
    );

    try {
      const { user_notification_id, meta_data } = job.data;
      const userNotification =
        await this.getUserNotification(user_notification_id);

      if (!userNotification) {
        return;
      }

      const allowedChannels = await this.getAllowedChannels(userNotification);

      await this.sendNotifications(
        allowedChannels,
        userNotification,
        meta_data,
      );

      console.log(`✅ Job ${job.id} processed successfully`);
    } catch (error) {
      await this.handleJobError(job, error);
    }
  }

  /**
   * Fetches user notification details, handling missing records gracefully.
   */
  private async getUserNotification(
    userNotificationId: string,
  ): Promise<UserNotification | null> {
    const userNotification = await this.userNotificationRepository.findOne({
      where: { id: userNotificationId },
      relations: { notification: true, user: true },
    });

    if (!userNotification) {
      this.logger.warn(`⚠️ UserNotification not found: ${userNotificationId}`);
      return null;
    }

    return userNotification;
  }

  /**
   * Determines which notification channels should be used, respecting user settings unless overridden.
   */
  private async getAllowedChannels(
    userNotification: UserNotification,
  ): Promise<NotificationChannel[]> {
    const { notification, user, bypass_user_preferences } = userNotification;

    if (bypass_user_preferences) {
      return notification.channels;
    }

    const userSettings = await this.userNotificationSettingRepository.findOne({
      where: { user: { id: user.id } },
    });

    return notification.channels.filter((channel) =>
      this.isChannelEnabled(channel, userSettings),
    );
  }

  /**
   * Checks if a channel is enabled in user notification settings.
   */
  private isChannelEnabled(
    channel: NotificationChannel,
    settings: UserNotificationSetting | null,
  ): boolean {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return settings?.is_email_enabled ?? false;
      case NotificationChannel.IN_APP:
        return settings?.is_in_app_enabled ?? false;
      case NotificationChannel.PUSH:
        return settings?.is_push_enabled ?? false;
      default:
        return false;
    }
  }

  /**
   * Sends notifications via the allowed channels.
   */
  private async sendNotifications(
    channels: NotificationChannel[],
    userNotification: UserNotification,
    payload: any,
  ): Promise<void> {
    const tasks: Promise<void>[] = [];

    if (channels.includes(NotificationChannel.EMAIL)) {
      tasks.push(
        this.emailNotificationService.sendNotification(
          userNotification,
          payload,
        ),
      );
    }

    if (channels.includes(NotificationChannel.IN_APP)) {
      tasks.push(
        this.inAppNotificationService.sendNotification(
          userNotification,
          payload,
        ),
      );
    }

    if (channels.includes(NotificationChannel.PUSH)) {
      tasks.push(
        this.pushNotificationService.sendNotification(
          userNotification,
          payload,
        ),
      );
    }

    try {
      await Promise.all(tasks);
      userNotification.status = UserNotificationStatus.SENT;
    } catch (err) {
      userNotification.status = UserNotificationStatus.FAILED;
      console.log(err);
    } finally {
      await userNotification.save();
    }
  }

  /**
   * Handles job errors, retrying with exponential backoff if applicable.
   */
  private async handleJobError(job: Job, error: any): Promise<void> {
    if (job.attemptsMade < MAX_RETRIES) {
      this.logger.warn(
        `🔄 Job failed. Retrying in some time (Attempt ${job.attemptsMade + 1}/${MAX_RETRIES})`,
      );
      await job.retry();
    } else {
      await job.moveToFailed(error, job.token ?? '');
    }
  }

  /**
   * Event listener for failed jobs.
   */
  @OnWorkerEvent('failed')
  async onJobFailed(job: Job, error: Error) {
    this.logger.error(`🔥 Job permanently failed.`, error.stack);
    // Optionally, implement a dead-letter queue (DLQ) mechanism here.
  }
}
