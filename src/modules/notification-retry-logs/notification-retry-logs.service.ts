import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNotificationRetryLogDto } from './dto/create-notification-retry-log.dto';
import { UpdateNotificationRetryLogDto } from './dto/update-notification-retry-log.dto';
import { NotificationRetryLog } from './entities/notification-retry-log.entity';
import { PendingNotification } from '../pending-notifications/entities/pending-notifications.entity';

@Injectable()
export class NotificationRetryLogsService {
  constructor(
    @InjectRepository(NotificationRetryLog)
    private readonly notificationRetryLogRepository: Repository<NotificationRetryLog>,
    @InjectRepository(PendingNotification)
    private readonly pendingNotificationRepository: Repository<PendingNotification>,
  ) {}

  async create(createNotificationRetryLogDto: CreateNotificationRetryLogDto) {
    // Check if pending notification exists
    const pendingNotification = await this.pendingNotificationRepository.findOne({
      where: { id: createNotificationRetryLogDto.pending_notification_id }
    });

    if (!pendingNotification) {
      throw new NotFoundException('Pending notification not found');
    }

    // Check if attempt number already exists for this pending notification
    const existingLog = await this.notificationRetryLogRepository.findOne({
      where: {
        pending_notification: { id: createNotificationRetryLogDto.pending_notification_id },
      }
    });

    if (existingLog) {
      throw new BadRequestException('Attempt number already exists for this pending notification');
    }

    const retryLog = this.notificationRetryLogRepository.create({
      pending_notification: pendingNotification,
      attempted_at: createNotificationRetryLogDto.attempted_at,
      error: createNotificationRetryLogDto.error,
      success: createNotificationRetryLogDto.success,
    });

    return await this.notificationRetryLogRepository.save(retryLog);
  }

  async findAll() {
    return await this.notificationRetryLogRepository.find({
      relations: {
        pending_notification: true
      },
      order: {
        attempted_at: 'DESC'
      }
    });
  }

  async findOne(id: string) {
    const retryLog = await this.notificationRetryLogRepository.findOne({
      where: { id },
      relations: {
        pending_notification: true
      }
    });

    if (!retryLog) {
      throw new NotFoundException('Notification retry log not found');
    }

    return retryLog;
  }

  async update(id: string, updateNotificationRetryLogDto: UpdateNotificationRetryLogDto) {
    const retryLog = await this.findOne(id);

    // If pending_notification_id is being updated, check if it exists
    if (updateNotificationRetryLogDto.pending_notification_id) {
      const pendingNotification = await this.pendingNotificationRepository.findOne({
        where: { id: updateNotificationRetryLogDto.pending_notification_id }
      });

      if (!pendingNotification) {
        throw new NotFoundException('Pending notification not found');
      }
    }

    // If attempt_number is being updated, check for conflicts
    if (updateNotificationRetryLogDto.attempt_number) {
      const existingLog = await this.notificationRetryLogRepository.findOne({
        where: {
          pending_notification: { id: updateNotificationRetryLogDto.pending_notification_id || retryLog.pending_notification.id },
          id: { $ne: id } as any
        }
      });

      if (existingLog) {
        throw new BadRequestException('Attempt number already exists for this pending notification');
      }
    }

    Object.assign(retryLog, updateNotificationRetryLogDto);
    return await this.notificationRetryLogRepository.save(retryLog);
  }

  async remove(id: string) {
    const retryLog = await this.findOne(id);
    await this.notificationRetryLogRepository.remove(retryLog);
    return { message: 'Notification retry log deleted successfully' };
  }

  async findByPendingNotificationId(pendingNotificationId: string) {
    return await this.notificationRetryLogRepository.find({
      where: { pending_notification: { id: pendingNotificationId } },
      relations: {
        pending_notification: true
      },
    });
  }

  async findSuccessfulAttempts(pendingNotificationId: string) {
    return await this.notificationRetryLogRepository.find({
      where: { 
        pending_notification: { id: pendingNotificationId },
        success: true
      },
      relations: {
        pending_notification: true
      },
    });
  }

  async findFailedAttempts(pendingNotificationId: string) {
    return await this.notificationRetryLogRepository.find({
      where: { 
        pending_notification: { id: pendingNotificationId },
        success: false
      },
      relations: {
        pending_notification: true
      },
    });
  }
}
