import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { NotificationRetryLogsService } from './notification-retry-logs.service';
import { CreateNotificationRetryLogDto } from './dto/create-notification-retry-log.dto';
import { UpdateNotificationRetryLogDto } from './dto/update-notification-retry-log.dto';

@Controller('notification-retry-logs')
export class NotificationRetryLogsController {
  constructor(private readonly notificationRetryLogsService: NotificationRetryLogsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createNotificationRetryLogDto: CreateNotificationRetryLogDto) {
    return this.notificationRetryLogsService.create(createNotificationRetryLogDto);
  }

  @Get()
  findAll() {
    return this.notificationRetryLogsService.findAll();
  }

  @Get('pending-notification/:pendingNotificationId')
  findByPendingNotificationId(@Param('pendingNotificationId', ParseUUIDPipe) pendingNotificationId: string) {
    return this.notificationRetryLogsService.findByPendingNotificationId(pendingNotificationId);
  }

  @Get('pending-notification/:pendingNotificationId/successful')
  findSuccessfulAttempts(@Param('pendingNotificationId', ParseUUIDPipe) pendingNotificationId: string) {
    return this.notificationRetryLogsService.findSuccessfulAttempts(pendingNotificationId);
  }

  @Get('pending-notification/:pendingNotificationId/failed')
  findFailedAttempts(@Param('pendingNotificationId', ParseUUIDPipe) pendingNotificationId: string) {
    return this.notificationRetryLogsService.findFailedAttempts(pendingNotificationId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationRetryLogsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateNotificationRetryLogDto: UpdateNotificationRetryLogDto
  ) {
    return this.notificationRetryLogsService.update(id, updateNotificationRetryLogDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationRetryLogsService.remove(id);
  }
}
