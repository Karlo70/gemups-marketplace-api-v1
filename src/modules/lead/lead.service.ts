import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { In, Repository, IsNull } from 'typeorm';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { ConfigService } from '@nestjs/config';
import { EmailNotificationNoAuthService } from '../notifications/services/email-notification-no-auth.service';
import { User, UserRole } from '../users/entities/user.entity';
import * as geoip from 'geoip-lite';
import { VapiService } from '../vapi/vapi.service';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { Lead } from './entities/lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { GetAllLeadDto } from './dto/get-all-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { PendingNotificationsService } from '../pending-notifications/pending-notifications.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailTemplate } from '../notifications/enums/email-template.enum';
import {
  NotificationEntityType,
  NotificationType,
} from '../notifications/entities/notification.entity';
import { NotificationChannel } from '../notification-sequence/entities/notification-sequence.entity';
import { CreateRelevanceLeadDto } from './dto/create-relevance-lead.dto';
import { AdminAddLeadDto } from './dto/admin-add-lead.dto';

@Injectable()
export class LeadService {
  constructor(
    @InjectRepository(Lead)
    private readonly LeadRepository: Repository<Lead>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly configService: ConfigService,
    private readonly vapiCallService: VapiService,
    private readonly emailNotificationNoAuthService: EmailNotificationNoAuthService,
    private readonly pendingNotificationsService: PendingNotificationsService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async create(createLeadDto: CreateLeadDto, req: Request): Promise<Lead> {
    const ref_website =
      req.headers['origin'] ??
      req.headers['referer'] ??
      'REF_WEBSITE_NOT_FOUND';
    const ip =
      req.headers['x-forwarded-for']?.toString()?.split(',')?.shift()?.trim() ??
      req.socket.remoteAddress ??
      req.ip ??
      'IP_NOT_FOUND';

    const turnstile_ip =
      req.headers['CF-Connecting-IP']?.toString() ?? 'TURNSTILE_IP_NOT_FOUND';

    const turnstileToken = createLeadDto.turnstileToken;

    if (this.configService.get('NODE_ENV') !== 'development') {
      await this.verifyTurnstileToken(turnstileToken, turnstile_ip);
    }

    const Lead = this.LeadRepository.create({
      ...createLeadDto,
      ref_website,
      ip,
      lead_from: createLeadDto.lead_from,
    });

    const savedLead = await Lead.save();

    if (this.configService.get('NODE_ENV') !== 'development') {
      await this.emailNotificationNoAuthService.sendNotificationCustomer(
        {
          user: {
            email: createLeadDto.email,
          },
          notification: {
            title: 'We have received your query',
            message:
              'Thank you for contacting us. We will get back to you as soon as possible.',
            template: 'lead-no-customer',
          },
        },
        {
          ...savedLead,
          owner_company_name: this.configService.get('COMPANY_NAME'),
        },
      );
    }

    const geo = geoip.lookup(ip);

    const admins = await this.userRepository.find({
      where: {
        role: In([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
      },
    });

    if (admins?.length) {
      await this.eventEmitter.emitAsync('create-send-notification', {
        user_ids: [admins[0].id],
        title: 'New Contact Submission',
        message: 'You’ve received a new contact request. Here are the details',
        template: EmailTemplate.LEAD_NO_AUTH_ADMIN,
        notification_type: NotificationType.TRANSACTION,
        is_displayable: false,
        channels: [NotificationChannel.EMAIL],
        bypass_user_preferences: true,
        entity_type: NotificationEntityType.LEAD,
        entity_id: Lead.id,
        meta_data: {
          ...savedLead,
          owner_company_name: this.configService.get('COMPANY_NAME'),
          admin_name: 'Admin',
          ip: savedLead.ip,
          ref_website: savedLead.ref_website,
          country: geo?.country ?? 'N/A',
          city: geo?.city ?? 'N/A',
          region: geo?.region ?? 'N/A',
          metro: geo?.metro ?? 'N/A',
          area: geo?.area ?? 'N/A',
          timezone: geo?.timezone ?? 'N/A',
          cc: admins
            .filter(
              (admin) =>
                admin.email !== this.configService.get('CONTACT_US_EMAIL'),
            )
            .map((admin) => admin.email),
        },
      });
    }

    // const vapiCallData: VapiCallDto = {
    //   assistant_id: this.configService.get(
    //     'VAPI_PERSONAL_ASSISTANT_ID',
    //   ) as string,
    //   phone_number_id: this.configService.get(
    //     'VAPI_PERSONAL_PHONE_NUMBER_ID',
    //   ) as string,
    //   phone_number: savedLead.phone,
    //   name: savedLead.name,
    //   email: savedLead.email,
    //   lead_from: LeadFrom.WEBSITE_LEAD,
    // };

    // await this.vapiCallService.call({
    //   ...vapiCallData,
    //   phone_number: `+${vapiCallData.phone_number}`,
    // });

    await this.pendingNotificationsService.scheduleNotificationsForLead(
      Lead,
      new Date(),
    );
    return savedLead;
  }

  async findAll(getAllLeadDto: GetAllLeadDto) {
    const { email, phone, lead_from, search, page, per_page, from, to } = getAllLeadDto;

    const LeadQuery = this.LeadRepository.createQueryBuilder('lead')
      .where('lead.deleted_at IS NULL');

    if (email) {
      LeadQuery.andWhere('lead.email = :email', { email });
    }

    if (phone) {
      LeadQuery.andWhere('lead.phone = :phone', { phone });
    }

    if (search) {
      LeadQuery.andWhere('lead.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    if (lead_from) {
      LeadQuery.andWhere('lead.lead_from = :lead_from', {
        lead_from,
      });
    }

    if (from) {
      LeadQuery.andWhere('lead.created_at >= :from', { from });
    }

    if (to) {
      LeadQuery.andWhere('lead.created_at <= :to', { to });
    }

    LeadQuery.orderBy('lead.created_at', 'DESC');

    const options: IPaginationOptions = {
      page: page ?? 1,
      limit: per_page ?? 10,
    };

    return await paginate<Lead>(LeadQuery, options);
  }

  async findOne({ id }: ParamIdDto) {
    const lead = await this.LeadRepository.findOne({
      where: {
        id,
        deleted_at: IsNull(),
      },
      relations: {
        vapi_calls: true,
      },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  async update({ id }: ParamIdDto, updateLeadDto: UpdateLeadDto) {
    const Lead = await this.LeadRepository.findOne({
      where: {
        id,
        deleted_at: IsNull(),
      },
    });

    if (!Lead) {
      throw new NotFoundException('Lead not found');
    }

    Object.assign(Lead, updateLeadDto);
    return await Lead.save();
  }

  async remove({ id }: ParamIdDto) {
    const Lead = await this.LeadRepository.findOne({
      where: {
        id,
      },
    });

    if (!Lead) {
      throw new NotFoundException('lead not found');
    }

    await this.LeadRepository.update(Lead.id, { deleted_at: new Date() });
    return Lead;
  }

  async relevanceAiLead(createRelevanceLeadDto: CreateRelevanceLeadDto, req: Request) {
    const ref_website =
      req.headers['origin'] ??
      req.headers['referer'] ??
      'REF_WEBSITE_NOT_FOUND';
    const ip =
      req.headers['x-forwarded-for']?.toString()?.split(',')?.shift()?.trim() ??
      req.socket.remoteAddress ??
      req.ip ??
      'IP_NOT_FOUND';
    const Lead = this.LeadRepository.create({
      ...createRelevanceLeadDto,
      name: createRelevanceLeadDto.first_name + ' ' + createRelevanceLeadDto.last_name,
      lead_from: 'relevance_ai_lead',
      ref_website,
      ip,
    });
    return await Lead.save();
  }

  async addLead(adminAddLeadDto: AdminAddLeadDto, req: Request) {
    const ref_website =
      req.headers['origin'] ??
      req.headers['referer'] ??
      'REF_WEBSITE_NOT_FOUND';
    const ip =
      req.headers['x-forwarded-for']?.toString()?.split(',')?.shift()?.trim() ??
      req.socket.remoteAddress ??
      req.ip ??
      'IP_NOT_FOUND';


    const Lead = this.LeadRepository.create({
      ...adminAddLeadDto,
      ref_website,
      ip,
      lead_from: adminAddLeadDto.lead_from,
    });

    const savedLead = await Lead.save();

    return savedLead;

  }

  // verify turnstile token
  async verifyTurnstileToken(turnstileToken: string, ip: string) {
    const response = await fetch(
      `https://challenges.cloudflare.com/turnstile/v0/siteverify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: this.configService.get('TURNSTILE_SECRET_KEY'),
          response: turnstileToken,
          remoteip: ip,
        }),
      },
    );

    const outcome = await response.json();

    if (!outcome.success) {
      throw new BadRequestException(outcome.message);
    }
  }
}
