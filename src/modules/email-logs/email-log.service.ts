import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateEmailsLogDto } from './dto/create-email-log.dto';
import { UpdateEmailsLogDto } from './dto/update-email-log.dto';
import { GetAllEmailsLogDto } from './dto/get-all-email-log.dto';
import { EmailLog } from './entities/email-log.entity';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class EmailLogService {
  constructor(
    @InjectRepository(EmailLog)
    private readonly emailLogRepository: Repository<EmailLog>,
  ) {}

  async create(createEmailsLogDto: CreateEmailsLogDto) {
    const emailsLog = this.emailLogRepository.create(createEmailsLogDto);
    return await this.emailLogRepository.save(emailsLog);
  }

  async findAll(getAllEmailsLogDto: GetAllEmailsLogDto) {
    const { email, pending_notification_id, lead_id, search, from, to } = getAllEmailsLogDto;
    const queryBuilder = this.emailLogRepository.createQueryBuilder('emails_log')
    .leftJoinAndSelect('emails_log.pending_notification', 'pending_notification')
    .leftJoinAndSelect('pending_notification.lead', 'lead')
    .leftJoinAndSelect('pending_notification.sequence_step', 'sequence_step')
    .leftJoinAndSelect('sequence_step.template', 'template')

    if (email) {
      queryBuilder.andWhere('emails_log.email = :email', { email });
    }

    if (pending_notification_id) {
      queryBuilder.andWhere('emails_log.pending_notification_id = :pending_notification_id', { 
        pending_notification_id 
      });
    }

    if (lead_id) {
      queryBuilder.andWhere('emails_log.lead_id = :lead_id', { lead_id });
    }

    if (search) {
      queryBuilder.andWhere('emails_log.email LIKE :search', {
        search: `%${search}%`,
      });
    }

    if (from) {
      queryBuilder.andWhere('emails_log.created_at >= :from', { from });
    }

    if (to) {
      queryBuilder.andWhere('emails_log.created_at <= :to', { to });
    }

    queryBuilder.andWhere('emails_log.deleted_at IS NULL');

    const options: IPaginationOptions = {
      page: getAllEmailsLogDto.page || 1,
      limit: getAllEmailsLogDto.per_page || 10,
    };

    return await paginate<EmailLog>(queryBuilder, options);
  }

  async findOne(id: ParamIdDto) {
    const emailsLog = await this.emailLogRepository.findOne({
      where: {
        id: id.id,
        deleted_at: IsNull(),
      },
      relations: ['pending_notification', 'lead'],
    });

    if (!emailsLog) {
      throw new NotFoundException('Emails log not found');
    }

    return emailsLog;
  }

  async update(id: ParamIdDto, updateEmailsLogDto: UpdateEmailsLogDto) {
    const emailsLog = await this.emailLogRepository.findOne({
      where: {
        id: id.id,
        deleted_at: IsNull(),
      },
    });

    if (!emailsLog) {
      throw new NotFoundException('Emails log not found');
    }

    await this.emailLogRepository.update(id.id, updateEmailsLogDto);
    
    return await this.findOne(id);
  }

  async remove(id: ParamIdDto) {
    const emailsLog = await this.emailLogRepository.findOne({
      where: {
        id: id.id,
        deleted_at: IsNull(),
      },
    });

    if (!emailsLog) {
      throw new NotFoundException('Emails log not found');
    }

    await this.emailLogRepository.update(id.id, {
      deleted_at: new Date(),
    });

    return { message: 'Emails log deleted successfully' };
  }
}
