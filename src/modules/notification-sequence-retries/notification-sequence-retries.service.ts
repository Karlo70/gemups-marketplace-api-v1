import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNotificationSequenceRetryDto } from './dto/create-notification-sequence-retry.dto';
import { UpdateNotificationSequenceRetryDto } from './dto/update-notification-sequence-retry.dto';
import { NotificationSequenceRetry } from './entities/notification-sequence-retry.entity';
import { NotificationSequence } from '../notification-sequence/entities/notification-sequence.entity';

@Injectable()
export class NotificationSequenceRetriesService {
  constructor(
    @InjectRepository(NotificationSequenceRetry)
    private readonly notificationSequenceRetryRepository: Repository<NotificationSequenceRetry>,
    @InjectRepository(NotificationSequence)
    private readonly notificationSequenceRepository: Repository<NotificationSequence>,
  ) {}

  async create(createNotificationSequenceRetryDto: CreateNotificationSequenceRetryDto) {
    // Check if sequence exists
    const sequence = await this.notificationSequenceRepository.findOne({
      where: { id: createNotificationSequenceRetryDto.sequence_id }
    });

    if (!sequence) {
      throw new NotFoundException('Notification sequence not found');
    }

    // Check if retry order already exists for this sequence
    const existingRetry = await this.notificationSequenceRetryRepository.findOne({
      where: {
        sequence: { id: createNotificationSequenceRetryDto.sequence_id },
        retry_order: createNotificationSequenceRetryDto.retry_order
      }
    });

    if (existingRetry) {
      throw new BadRequestException('Retry order already exists for this sequence');
    }

    const retry = this.notificationSequenceRetryRepository.create({
      sequence: sequence,
      retry_order: createNotificationSequenceRetryDto.retry_order,
      retry_delay_minutes: createNotificationSequenceRetryDto.retry_delay_minutes,
      status: createNotificationSequenceRetryDto.status,
    });

    return await this.notificationSequenceRetryRepository.save(retry);
  }

  async findAll() {
    return await this.notificationSequenceRetryRepository.find({
      relations: {
        sequence: true
      },
      order: {
        retry_order: 'ASC'
      }
    });
  }

  async findOne(id: string) {
    const retry = await this.notificationSequenceRetryRepository.findOne({
      where: { id },
      relations: {
        sequence: true
      }
    });

    if (!retry) {
      throw new NotFoundException('Notification sequence retry not found');
    }

    return retry;
  }

  async update(id: string, updateNotificationSequenceRetryDto: UpdateNotificationSequenceRetryDto) {
    const retry = await this.findOne(id);

    // If sequence_id is being updated, check if it exists
    if (updateNotificationSequenceRetryDto.sequence_id) {
      const sequence = await this.notificationSequenceRepository.findOne({
        where: { id: updateNotificationSequenceRetryDto.sequence_id }
      });

      if (!sequence) {
        throw new NotFoundException('Notification sequence not found');
      }
    }

    // If retry_order is being updated, check for conflicts
    if (updateNotificationSequenceRetryDto.retry_order) {
      const existingRetry = await this.notificationSequenceRetryRepository.findOne({
        where: {
          sequence: { id: updateNotificationSequenceRetryDto.sequence_id || retry.sequence.id },
          retry_order: updateNotificationSequenceRetryDto.retry_order,
          id: { $ne: id } as any
        }
      });

      if (existingRetry) {
        throw new BadRequestException('Retry order already exists for this sequence');
      }
    }

    Object.assign(retry, updateNotificationSequenceRetryDto);
    return await this.notificationSequenceRetryRepository.save(retry);
  }

  async remove(id: string) {
    const retry = await this.findOne(id);
    await this.notificationSequenceRetryRepository.remove(retry);
    return { message: 'Notification sequence retry deleted successfully' };
  }

  async findBySequenceId(sequenceId: string) {
    return await this.notificationSequenceRetryRepository.find({
      where: { sequence: { id: sequenceId } },
      relations: {
        sequence: true
      },
      order: {
        retry_order: 'ASC'
      }
    });
  }
}
