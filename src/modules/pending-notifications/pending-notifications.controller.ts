import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PendingNotificationsService } from './pending-notifications.service';
import { CreatePendingNotificationDto } from './dto/create-pending-notification.dto';
import { UpdatePendingNotificationDto } from './dto/update-pending-notification.dto';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { GetAllPendingNotificationDto } from './dto/get-all-pending-notification.dto';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { RolesDecorator } from 'src/shared/guards/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';

@Controller('pending-notifications')
@UseGuards(AuthenticationGuard)
export class PendingNotificationsController {
  constructor(private readonly pendingNotificationsService: PendingNotificationsService) {}

  @Post()
  @UseGuards(RolesGuard,AuthenticationGuard)
  @RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async create(@Body() createPendingNotificationDto: CreatePendingNotificationDto, @CurrentUser() currentUser: User): Promise<IResponse> {
    const pendingNotification = await this.pendingNotificationsService.create(createPendingNotificationDto, currentUser);
    return {
      message: 'Pending notification created successfully',
      details: pendingNotification,
    };
  }

  @Post("mark-email-sended")
  async markEmailSended(@Body() body: any): Promise<IResponse> {
    const pendingNotification = await this.pendingNotificationsService.markLeadEmailSended(body);
    return {
      message: 'Lead email status updated successfully',
      details: pendingNotification,
    };
  }

  @Get()
  async findAll(@Query() getAllPendingNotificationDto: GetAllPendingNotificationDto): Promise<IResponse> {
    const pendingNotifications = await this.pendingNotificationsService.findAll(getAllPendingNotificationDto);
    return {
      message: 'Pending notifications fetched successfully',
      details: pendingNotifications,
    };
  }

  @Get(':id')
  async findOne(@Param() paramIdDto: ParamIdDto): Promise<IResponse> {
    const pendingNotification = await this.pendingNotificationsService.findOne(paramIdDto);
    return {
      message: 'Pending notification fetched successfully',
      details: pendingNotification,
    };
  }

  @Patch(':id')
  async update(
    @Param() paramIdDto: ParamIdDto, 
    @Body() updatePendingNotificationDto: UpdatePendingNotificationDto
  ): Promise<IResponse> {
    const pendingNotification = await this.pendingNotificationsService.update(paramIdDto, updatePendingNotificationDto);
    return {
      message: 'Pending notification updated successfully',
      details: pendingNotification,
    };
  }

  @Delete(':id')
  async remove(@Param() paramIdDto: ParamIdDto): Promise<IResponse> {
    const pendingNotification = await this.pendingNotificationsService.remove(paramIdDto);
    return {
      message: 'Pending notification deleted successfully',
      details: pendingNotification,
    };
  }
}
