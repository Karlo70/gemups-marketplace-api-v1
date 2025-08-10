import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePendingNotificationDto } from './dto/create-pending-notification.dto';
import { UpdatePendingNotificationDto } from './dto/update-pending-notification.dto';
import * as dayjs from 'dayjs';
import { IsNull, Repository } from 'typeorm';
import { NotificationChannel, NotificationSequence } from '../notification-sequence/entities/notification-sequence.entity';
import { PendingNotification } from './entities/pending-notifications.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CallStatus, Lead } from '../lead/entities/lead.entity';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { GetAllPendingNotificationDto } from './dto/get-all-pending-notification.dto';
import { User } from '../users/entities/user.entity';
import { EmailLog, EmailLogStatus } from '../email-logs/entities/email-log.entity';

@Injectable()
export class PendingNotificationsService {
  constructor(
    @InjectRepository(NotificationSequence)
    private readonly sequenceRepository: Repository<NotificationSequence>,

    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,

    @InjectRepository(EmailLog)
    private readonly emailLogRepository: Repository<EmailLog>,

    @InjectRepository(PendingNotification)
    private readonly pendingNotificationRepository: Repository<PendingNotification>,
  ) { }

  async create(createPendingNotificationDto: CreatePendingNotificationDto, currentUser: User) {

    const lead = await this.leadRepository.findOne({
      where: { id: createPendingNotificationDto.lead_id, deleted_at: IsNull() },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    const sequence_step = await this.sequenceRepository.findOne({
      where: { id: createPendingNotificationDto.sequence_step_id, deleted_at: IsNull() },
    });

    if (!sequence_step) {
      throw new NotFoundException('Sequence step not found');
    }

    const pendingNotification = this.pendingNotificationRepository.create({
      lead: lead,
      sequence_step: sequence_step,
      ...createPendingNotificationDto,
      ...(currentUser && { created_by: currentUser }),
    });
    return await this.pendingNotificationRepository.save(pendingNotification);
  }

  async findAll(getAllPendingNotificationDto: GetAllPendingNotificationDto) {
    const { lead_id } = getAllPendingNotificationDto;
    return await this.pendingNotificationRepository.find({
      where: { deleted_at: IsNull(), lead: { id: lead_id } },
      relations: {
        lead: true,
        sequence_step: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(paramIdDto: ParamIdDto) {
    const pendingNotification = await this.pendingNotificationRepository.findOne({
      where: { id: paramIdDto.id, deleted_at: IsNull() },
      relations: {
        lead: true,
        sequence_step: true,
        retry_logs: true,
      },
    });

    if (!pendingNotification) {
      throw new NotFoundException('Pending notification not found');
    }

    return pendingNotification;
  }

  async update(paramIdDto: ParamIdDto, updatePendingNotificationDto: UpdatePendingNotificationDto) {
    const pendingNotification = await this.findOne(paramIdDto);

    Object.assign(pendingNotification, updatePendingNotificationDto);
    return await this.pendingNotificationRepository.save(pendingNotification);
  }

  async remove(paramIdDto: ParamIdDto) {
    const pendingNotification = await this.findOne(paramIdDto);

    pendingNotification.deleted_at = new Date();
    return await this.pendingNotificationRepository.save(pendingNotification);
  }

  async scheduleNotificationsForLead(lead: Lead, createdDate: Date) {
    const steps = await this.sequenceRepository.find({
      where: { is_active: true, deleted_at: IsNull() },
      order: { step_order: 'ASC' },
    });

    for (const step of steps) {
      const scheduled_for = dayjs(createdDate)
        .add(step.delay_offset_minutes, 'minute')
        .unix();

      const pendingNotification = this.pendingNotificationRepository.create({
        lead: lead,
        sequence_step: step,
        scheduled_for,
      });

      await this.pendingNotificationRepository.save(pendingNotification);
    }
  }

  async markLeadEmailSended(body: any) {
    let lead = await this.leadRepository.findOne({
      where: { email: body.email, lead_from: "relevance_ai_lead", deleted_at: IsNull() },
    });

    if (!lead) {
      lead = this.leadRepository.create({
        email: body.email,
        first_name: body.first_name,
        last_name: body.last_name,
        name: body.name,
        phone: body.phone,
        lead_from: "relevance_ai_lead",
        call_status: CallStatus.PENDING,
        message: body.message,
        company: body.company,
        position: body.position,
        country: body.country,
        language: body.language,
        email_body: body.email_body,
        industry: body.industry,
        subject: body.subject,
      });
      lead = await lead.save();
    }

    const sequence_step = await this.sequenceRepository.findOne({
      where: { is_active: true, channel: NotificationChannel.EMAIL, deleted_at: IsNull() },
      order: { step_order: 'ASC' },
    });

    if (!sequence_step) {
      throw new NotFoundException('Sequence step not found');
    }

    const pendingNotification = this.pendingNotificationRepository.create({
      lead: lead,
      sequence_step: sequence_step,
      should_send: true,
      is_sent: new Date(),
      scheduled_for: dayjs().unix(),
    });

    await (this.emailLogRepository.create({
      lead: lead,
      email: body.email,
      body: lead.email_body,
      status: EmailLogStatus.SENT,
      pending_notification: pendingNotification,
    })).save()
    return await this.pendingNotificationRepository.save(pendingNotification);
  }
}
