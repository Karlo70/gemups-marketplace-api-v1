import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { NotificationSequenceRetriesService } from './notification-sequence-retries.service';
import { CreateNotificationSequenceRetryDto } from './dto/create-notification-sequence-retry.dto';
import { UpdateNotificationSequenceRetryDto } from './dto/update-notification-sequence-retry.dto';

@Controller('notification-sequence-retries')
export class NotificationSequenceRetriesController {
  constructor(private readonly notificationSequenceRetriesService: NotificationSequenceRetriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createNotificationSequenceRetryDto: CreateNotificationSequenceRetryDto) {
    return this.notificationSequenceRetriesService.create(createNotificationSequenceRetryDto);
  }

  @Get()
  findAll() {
    return this.notificationSequenceRetriesService.findAll();
  }

  @Get('sequence/:sequenceId')
  findBySequenceId(@Param('sequenceId', ParseUUIDPipe) sequenceId: string) {
    return this.notificationSequenceRetriesService.findBySequenceId(sequenceId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationSequenceRetriesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateNotificationSequenceRetryDto: UpdateNotificationSequenceRetryDto
  ) {
    return this.notificationSequenceRetriesService.update(id, updateNotificationSequenceRetryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationSequenceRetriesService.remove(id);
  }
}
