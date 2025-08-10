import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  UserNotification,
  UserNotificationStatus,
} from './entities/user-notification.entity';
import { UserNotificationSetting } from './entities/user-notification-setting.entity';
import { IsNull, Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { TransactionalNotificationPayload } from './interfaces/notification-payload.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OnEvent } from '@nestjs/event-emitter';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { GetAllDto } from 'src/shared/dtos/getAll.dto';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(UserNotificationSetting)
    private readonly userNotificationSettingRepository: Repository<UserNotificationSetting>,

    @InjectRepository(UserNotification)
    private readonly userNotificationRepository: Repository<UserNotification>,

    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

    @InjectQueue('notifications-queue')
    private readonly transactionalNotificationQueue: Queue,
  ) {}

  async findAll(getAllDto: GetAllDto, currentUser: User) {
    const { page, per_page } = getAllDto;

    const query = this.userNotificationRepository
      .createQueryBuilder('notifications')
      .leftJoinAndSelect('notifications.notification', 'notify')
      .leftJoinAndSelect('notifications.user', 'user')
      .where(
        'user.id = :user_id AND notifications.is_displayable = true AND notifications.deleted_at IS NULL',
        { user_id: currentUser.id },
      )
      .orderBy('notifications.created_at', 'DESC');

    const paginationOptions: IPaginationOptions = {
      page: page ?? 1,
      limit: per_page ?? 10,
    };
    return await paginate<UserNotification>(query, paginationOptions);
  }

  async unReadNotificationCount(currentUser: User) {
    const unReadUserNotificationsCount =
      await this.userNotificationRepository.count({
        where: {
          is_displayable: true,
          is_read: false,
          deleted_at: IsNull(),
          user: {
            id: currentUser?.id,
          },
        },
      });

    return { total_unread_notifications: unReadUserNotificationsCount };
  }

  async findOne({ id }: ParamIdDto, currentUser: User) {
    const userNotification = await this.userNotificationRepository.findOne({
      where: {
        id,
        is_displayable: true,
        deleted_at: IsNull(),
      },
      relations: {
        notification: true,
        user: true,
      },
    });

    if (!userNotification)
      throw new NotFoundException('Notification not found');

    if (userNotification?.user?.id !== currentUser?.id) {
      throw new ForbiddenException(
        'you are not authorized to view this notification',
      );
    }

    return userNotification;
  }

  async readAllNotification(currentUser: User) {
    const userNotification = await this.userNotificationRepository.find({
      where: {
        is_displayable: true,
        is_read: false,
        deleted_at: IsNull(),
        user: {
          id: currentUser?.id,
        },
      },
    });

    if (!userNotification.length)
      throw new NotFoundException('No unread notifications');

    return await this.userNotificationRepository.update(
      {
        user: { id: currentUser?.id },
        is_displayable: true,
        is_read: false,
        deleted_at: IsNull(),
      },
      { is_read: true },
    );
  }

  async readNotification(paramIdDto: ParamIdDto, currentUser: User) {
    const userNotification = await this.findOne(paramIdDto, currentUser);
    userNotification.is_read = true;
    return await userNotification.save();
  }

  async createUserNotificationSetting(currentUser: User) {
    const userNotificationSetting =
      this.userNotificationSettingRepository.create({
        user: currentUser,
      });

    return userNotificationSetting.save();
  }

  @OnEvent('create-send-notification')
  async createSendNotification(
    notificationPayload: TransactionalNotificationPayload,
  ) {
    const {
      user_ids,
      title,
      message,
      template,
      is_displayable,
      channels,
      entity_type,
      entity_id,
      meta_data,
      bypass_user_preferences,
      notification_type,
    } = notificationPayload;

    const notification = this.notificationRepository.create({
      title,
      message,
      notification_type,
      template,
      entity_type,
      entity_id,
      channels,
    });

    await notification.save();


    for (const user_id of user_ids) {
      console.log('notification created for ', user_id);
      const userNotification = await this.userNotificationRepository.save({
        user: {
          id: user_id,
        },
        notification,
        status: UserNotificationStatus.PENDING,
        is_displayable,
        bypass_user_preferences,
      });

      // if (process.env.NODE_ENV === 'development') return;

      await this.transactionalNotificationQueue.add(
        'send_notification',
        {
          user_notification_id: userNotification.id,
          meta_data,
        },
        {
          priority:
            notification.notification_type === NotificationType.TRANSACTION
              ? 1
              : 10,
        },
      );
    }
  }
}
