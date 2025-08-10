import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { NotificationSequenceService } from './notification-sequence.service';
import { CreateNotificationSequenceDto } from './dto/create-notification-sequence.dto';
import { UpdateNotificationSequenceDto } from './dto/update-notification-sequence.dto';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { RolesDecorator } from 'src/shared/guards/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { IResponse } from 'src/shared/interfaces/response.interface';

@Controller('notification-sequence')
@UseGuards(AuthenticationGuard, RolesGuard)
@RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class NotificationSequenceController {
  constructor(
    private readonly notificationSequenceService: NotificationSequenceService,
  ) {}

  @Post()
  async create(
    @Body() createNotificationSequenceDto: CreateNotificationSequenceDto,
  ): Promise<IResponse> {
    const notification_sequence =
      await this.notificationSequenceService.create(
        createNotificationSequenceDto,
      );
    return {
      message: 'Notification Sequence created',
      details: notification_sequence,
    };
  }

  @Get()
  async findAll(): Promise<IResponse> {
    const notification_sequences =
      await this.notificationSequenceService.findAll();
    return {
      message: 'Notifications Sequence Fetched ',
      details: notification_sequences,
    };
  }

  @Get(':id')
  async findOne(@Param() { id }: ParamIdDto): Promise<IResponse> {
    const notification_sequence =
      await this.notificationSequenceService.findOne(id);
    return {
      message: 'Notification Sequence fetch successfully',
      details: notification_sequence,
    };
  }

  @Patch(':id')
  async update(
    @Param() { id }: ParamIdDto,
    @Body() updateNotificationSequenceDto: UpdateNotificationSequenceDto,
  ): Promise<IResponse> {
    const notification_sequence = await this.notificationSequenceService.update(
      id,
      updateNotificationSequenceDto,
    );
    return {
      message: 'Notification Sequence updated successfully',
      details: notification_sequence,
    };
  }

  @Delete(':id')
  async remove(@Param() { id }: ParamIdDto): Promise<IResponse> {
    const notification_sequence = await this.notificationSequenceService.remove(id);
    return {
      message: 'Notification Sequence deleted successfully',
      details: notification_sequence,
    };
  }
}
