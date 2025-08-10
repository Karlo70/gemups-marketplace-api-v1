import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { User } from '../users/entities/user.entity';
import { GetAllDto } from 'src/shared/dtos/getAll.dto';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(AuthenticationGuard)
  async findAll(
    @Query() getAllDto: GetAllDto,
    @CurrentUser() currentUser: User,
  ): Promise<IResponse> {
    const { items, meta } = await this.notificationsService.findAll(
      getAllDto,
      currentUser,
    );
    return {
      message: 'Notifications fetched successfully',
      details: items,
      extra: meta,
    };
  }

  @Get('unread-notification-count')
  @UseGuards(AuthenticationGuard)
  async unReadNotificationCount(
    @CurrentUser() currentUser: User,
  ): Promise<IResponse> {
    const notificationCounts =
      await this.notificationsService.unReadNotificationCount(currentUser);
    return {
      message: 'Numbers of unread notifications fetched successfully',
      details: notificationCounts,
    };
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard)
  async findOne(
    @Param() paramIdDto: ParamIdDto,
    @CurrentUser() currentUser: User,
  ): Promise<IResponse> {
    const userNotification = await this.notificationsService.findOne(
      paramIdDto,
      currentUser,
    );
    return {
      message: 'Notification fetched successfully',
      details: userNotification,
    };
  }

  @Patch('mark-all-as-read')
  @UseGuards(AuthenticationGuard)
  async readAllNotification(
    @CurrentUser() currentUser: User,
  ): Promise<IResponse> {
    await this.notificationsService.readAllNotification(currentUser);
    return {
      message: 'All Notifications Read successfully',
    };
  }

  @Patch('mark-as-read/:id')
  @UseGuards(AuthenticationGuard)
  async readNotification(
    @Param() paramIdDto: ParamIdDto,
    @CurrentUser() currentUser: User,
  ): Promise<IResponse> {
    const userNotification = await this.notificationsService.readNotification(
      paramIdDto,
      currentUser,
    );
    return {
      message: 'Notification Read successfully',
      details: userNotification,
    };
  }
}
