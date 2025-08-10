import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateNotificationSequenceDto } from './dto/create-notification-sequence.dto';
import { NotFoundException } from '@nestjs/common';
import { UpdateNotificationSequenceDto } from './dto/update-notification-sequence.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationSequence } from './entities/notification-sequence.entity';
import { IsNull, Repository } from 'typeorm';
import {
  Template,
  TemplateStatus,
  TemplateType,
} from '../templates/entities/template.entity';

@Injectable()
export class NotificationSequenceService {
  constructor(
    @InjectRepository(NotificationSequence)
    private readonly notificationSequenceRepository: Repository<NotificationSequence>,

    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
  ) {}

  async create(createNotificationSequenceDto: CreateNotificationSequenceDto) {
    let email_template: Template | null = null;
    if (createNotificationSequenceDto?.template_id) {
      email_template = await this.templateRepository.findOne({
        where: {
          id: createNotificationSequenceDto.template_id,
          status: TemplateStatus.ACTIVE,
        },
      });
      if (!email_template)
        throw new NotFoundException(
          `Template with ID ${createNotificationSequenceDto.template_id} not found`,
        );
      if(email_template.status !== TemplateStatus.ACTIVE)
        throw new BadRequestException(
          `Template with ID ${createNotificationSequenceDto.template_id} is not active`,
        );
      }

    const notificationSequence = this.notificationSequenceRepository.create({
      ...createNotificationSequenceDto,
      ...(email_template && { template: email_template }),
    });
    return await this.notificationSequenceRepository.save(notificationSequence);
  }

  async findAll() {
    return await this.notificationSequenceRepository.find({
      where: {
        deleted_at: IsNull(),
      },
    });
  }

  async findOne(id: string) {
    const notificationSequence =
      await this.notificationSequenceRepository.findOneBy({ id });
    if (!notificationSequence) {
      throw new NotFoundException(
        `NotificationSequence with ID ${id} not found`,
      );
    }
    return notificationSequence;
  }

  async update(
    id: string,
    updateNotificationSequenceDto: UpdateNotificationSequenceDto,
  ) {
    const notificationSequence = await this.findOne(id);
    Object.assign(notificationSequence, updateNotificationSequenceDto);
    return await this.notificationSequenceRepository.save(notificationSequence);
  }

  async remove(id: string) {
    const notificationSequence = await this.findOne(id);
    notificationSequence.deleted_at = new Date();
    return await this.notificationSequenceRepository.save(notificationSequence);
  }
}
