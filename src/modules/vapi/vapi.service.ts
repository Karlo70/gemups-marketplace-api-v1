import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map } from 'rxjs';
import * as dayjs from 'dayjs';
import { InjectRepository } from '@nestjs/typeorm';
import { VapiCall } from './entities/vapi-call.entity';
import { Between, In, IsNull, Not, Repository } from 'typeorm';
import { Agent } from '../agent/entities/agent.entity';
import { CallFuncInterface } from './interfaces';
import { CronLog, CronLogStatus } from '../cron-log/entities/cron-log.entity';
import { CallStatus, Lead } from '../lead/entities/lead.entity';
import { PendingNotificationsService } from '../pending-notifications/pending-notifications.service';
import { CommunicationChannel, VapiStatus } from './enums/call-and-enums';
import { PendingNotification } from '../pending-notifications/entities/pending-notifications.entity';
import { GetAllCallDto } from './dto/get-all-call.dto';
import { IPaginationOptions, paginate } from "nestjs-typeorm-paginate";
import { User, UserRole } from '../users/entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailTemplate } from '../notifications/enums/email-template.enum';
import { NotificationEntityType, NotificationType } from '../notifications/entities/notification.entity';
import { NotificationChannel } from '../notification-sequence/entities/notification-sequence.entity';
import * as geoip from 'geoip-lite';
import { CronStatus } from '../cron-job/entities/cron-job.entity';


@Injectable()
export class VapiService {
  constructor(
    @InjectRepository(VapiCall)
    private readonly vapiCallRepository: Repository<VapiCall>,

    @InjectRepository(Lead)
    private readonly LeadRepository: Repository<Lead>,

    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,

    @InjectRepository(PendingNotification)
    private readonly pendingNotificationRepository: Repository<PendingNotification>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly eventEmitter: EventEmitter2,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly pendingNotificationsService: PendingNotificationsService
  ) { }

  async call({ body, req, inside_system, cron_log }: CallFuncInterface) {
    try {

      const { assistant, req_body, ref_website, ip } = await this.createCallBody(req, body);

      let lead;
      if (!inside_system) {
        lead = this.LeadRepository.create({
          ...(body?.name?.includes(' ').length > 1 && { last_name: body?.name.split(' ')[1] }),
          ...(body?.name?.includes(' ').length > 1 && { first_name: body?.name.split(' ')[0] }),
          email: body.email,
          name: body.name,
          phone: body.phone_number,
          ref_website: ref_website,
          call_status: CallStatus.IN_PROGRESS,
          ip: ip,
          lead_from: body.lead_from ?? 'website_lead',
        });
        await lead.save();
      } else {
        lead = await this.LeadRepository.findOne({
          where: {
            id: body.lead_id,
          },
        });
        lead.call_status = CallStatus.IN_PROGRESS;
        await lead.save();
      }

      const response = await lastValueFrom(
        this.httpService
          .post(`${this.configService.get('VAPI_URL')}`, req_body, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.configService.get('VAPI_API_KEY')}`,
            },
          })
          .pipe(map((res) => res.data)), // Get the response body
      ).catch(async (error) => {
        console.error(
          '🚨 ~ VapiService ~ call ~ error:',
          error.response?.data ?? error,
        );
        if (cron_log) {
          cron_log.status = CronLogStatus.FAILED;
          cron_log.error = error.response?.data.message[0] ?? error?.toString();
          await cron_log.save();
        }

        if (error.response?.data?.message.includes('Please Purchase More Credits Before Proceeding.')) {

          const admins = await this.userRepository.find({
            where: {
              role: In([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
            },
          });

          if (admins?.length) {
            const geo = geoip.lookup(ip);
            await this.eventEmitter.emitAsync('create-send-notification', {
              user_ids: [admins[0].id],
              title: 'Vapi Issue',
              message: 'Our Server is facing some issue, please check the logs',
              template: EmailTemplate.LEAD_OR_VAPI_ERROR_ADMIN,
              notification_type: NotificationType.TRANSACTION,
              is_displayable: false,
              channels: [NotificationChannel.EMAIL],
              bypass_user_preferences: true,
              entity_type: NotificationEntityType.LEAD,
              entity_id: lead.id,
              error: error.response?.data ?? error,
              meta_data: {
                ...lead,
                owner_company_name: this.configService.get('COMPANY_NAME'),
                admin_name: 'Admin',
                ip: lead.ip,
                ref_website: lead.ref_website,
                country: geo?.country ?? 'N/A',
                city: geo?.city ?? 'N/A',
                region: geo?.region ?? 'N/A',
                metro: geo?.metro ?? 'N/A',
                area: geo?.area ?? 'N/A',
                timezone: geo?.timezone ?? 'N/A',
                user_agent: req?.headers['user-agent'] ?? 'N/A',
                panel_url: this.configService.get("PANEL_URL"),
                cc: admins
                  .filter(
                    (admin) =>
                      admin.email !== this.configService.get('CONTACT_US_EMAIL'),
                  )
                  .map((admin) => admin.email),
              },
            });
          }
        }
        throw new BadRequestException(error.response?.data.message[0] ?? error?.toString())
      });

      const vapi_call = this.vapiCallRepository.create({
        name: body.name,
        email: body.email,
        assistant_id: assistant.assistant_id,
        phone_number_id: assistant.phone_number_id,
        phone_number: body.phone_number,
        call_id: response?.id,
        lead: lead,
        call_from: body.call_from,
        status: VapiStatus.QUEUED,
        communication_channel: CommunicationChannel.CALL,
        cron_log: cron_log,
      });

      await vapi_call.save();

      // Call De Bouncing Logic
      if (!inside_system) {
        const is_notification_exists = await this.pendingNotificationRepository.findOne({
          where: {
            lead: {
              phone: body.phone_number,
              updated_at: Between(
                dayjs().subtract(5, 'minutes').toDate(),
                dayjs().toDate(),
              ),
            },
            is_sent: IsNull(),
          },
        });

        if (!is_notification_exists)
          await this.pendingNotificationsService.scheduleNotificationsForLead(lead, new Date());
        else {
          is_notification_exists.scheduled_for = dayjs().add(2, 'minute').unix();
          await is_notification_exists.save();
        }

      }

      return vapi_call;
    } catch (error) {
      throw error;
    }
  }

  async getAllCalls(getAllCallsDto: GetAllCallDto, currentUser: User) {
    const { lead_id, assistant_id, from, page = 1, per_page = 10, search, to } = getAllCallsDto;

    const queryBuilder = this.vapiCallRepository.createQueryBuilder('vapi_calls')
      .leftJoinAndSelect('vapi_calls.lead', 'lead')
      .leftJoinAndMapOne("vapi_calls.assistant", Agent, "assistant", "assistant.assistant_id::text = vapi_calls.assistant_id::text")
    // .where('vapi_calls.status != :endedStatus', { endedStatus: VapiStatus.ENDED });

    if (lead_id) {
      queryBuilder.andWhere('lead.id = :lead_id', { lead_id });
    }

    if (assistant_id) {
      queryBuilder.andWhere('vapi_calls.assistant_id = :assistant_id', { assistant_id });
    }

    if (from) {
      queryBuilder.andWhere('vapi_calls.created_at >= :from', { from });
    }

    if (to) {
      queryBuilder.andWhere('vapi_calls.created_at <= :to', { to });
    }

    if (search) {
      queryBuilder.andWhere(
        '(vapi_calls.name ILIKE :search OR vapi_calls.email ILIKE :search OR lead.name ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    queryBuilder.orderBy('vapi_calls.created_at', 'DESC');


    const paginationOptions: IPaginationOptions = {
      page,
      limit: per_page,
    }

    const calls = await paginate(queryBuilder, paginationOptions);

    return calls;
  }



  async getCallDetails({ cron_log }: { cron_log: CronLog }) {
    const lastVapiCall = await this.vapiCallRepository.findOne({
      where: {
        // updated_at: Between(
        //   // dayjs().subtract(5, 'minute').toDate(),
        //   dayjs().subtract(4, 'day').toDate(),
        //   dayjs().toDate(),
        // ),
        status: Not(VapiStatus.ENDED),
        call_id: Not(IsNull()),
        // lead: {
        //   call_status: CallStatus.IN_PROGRESS,
        // },
      },
      relations: {
        lead: true,
      },
      order: {
        created_at: 'ASC',
      },
    });

    if (!lastVapiCall) {
      cron_log.status = CronLogStatus.DONE;
      await cron_log.save();
      return;
    }

    console.debug(
      `Getting the call log of Customer Name : ${lastVapiCall?.lead?.name
      } and Call Id : ${lastVapiCall?.call_id}`,
    );

    const call = await lastValueFrom(
      this.httpService
        .get(`${this.configService.get('VAPI_URL')}/${lastVapiCall?.call_id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.configService.get('VAPI_API_KEY')}`,
          },
        })
        .pipe(map((res) => res.data)), // Get the response body
    ).catch(async (error) => {
      console.error(
        '🚨 ~ VapiService ~ call ~ error:',
        error.response?.data ?? error,
      );
      cron_log.error = error.response?.data?.toString() ?? error?.toString();
      await cron_log.save();

      throw new BadRequestException(
        `Vapi Error : ${error.response?.data.message ?? error}`,
      );
    });
    console.table([call])

    if (call.status !== VapiStatus.QUEUED)
      lastVapiCall.lead.call_status = CallStatus.COMPLETED;

    lastVapiCall.call_end_reason = call.endedReason;
    lastVapiCall.status = call.status;
    lastVapiCall.communication_channel = CommunicationChannel.CALL;
    lastVapiCall.call_recording_url = call.recordingUrl;
    lastVapiCall.transcription = call.transcript;
    lastVapiCall.summary = call.summary;
    lastVapiCall.started_at = call.startedAt;
    lastVapiCall.ended_at = call.endedAt;
    lastVapiCall.cost = call.cost;
    lastVapiCall.updated_at = new Date();

    await lastVapiCall.save();
    await lastVapiCall.lead.save();

    cron_log.status = CronLogStatus.DONE;
    await cron_log.save();

    return call;
  }

  private async createCallBody(req: any, body: any) {
    const assistant = await this.agentRepository.findOne({
      where: {
        id: body.assistant_id,
      },
    });

    if (!assistant) throw new NotFoundException('Agent not found');

    const ref_website =
      req?.headers['origin'] ??
      req?.headers['referer'] ??
      'REF_WEBSITE_NOT_FOUND';
    const ip =
      req?.headers['x-forwarded-for']
        ?.toString()
        ?.split(',')
        ?.shift()
        ?.trim() ??
      req?.['socket']?.remoteAddress ??
      req?.['ip'] ??
      'IP_NOT_FOUND';

    const req_body = {
      assistantId: assistant.assistant_id,
      phoneNumberId: assistant.phone_number_id,
      customer: {
        name: body.name,
        // email: body.email,
        number: body.phone_number.includes('+')
          ? body.phone_number
          : `+${body.phone_number}`,
      },
      assistantOverrides: {
        ...(assistant?.firstMessage && {
          firstMessage: assistant.firstMessage
            .replace('{{customerName}}', body.name)
            .replace('{{numberOfPeople}}', '11')
            .replace(
              '{{reservationDateAndTime}}',
              dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
            )
            .replace(
              '{{day}}',
              dayjs().add(2, 'day').format('dddd'),
            ),
        }),
        ...body.assistant_overrides,
        // variableValues: {
        //   customerName: body.customer.name,
        //   reservationDateAndTime:
        //     body.assistant_overrides?.variable_values.reservation_date_and_time.toISOString() ??
        //     dayjs().add(1, 'hour').format('Do MMMM, YYYY, hh : mm A'),
        //   numberOfPeople:
        //     body.assistant_overrides?.variable_values.number_of_people ??
        //     99999,
        // },
        variableValues: body.variableValues,
      },
    };

    return {
      assistant: assistant,
      req_body: req_body,
      ref_website: ref_website,
      ip: ip,

    }
  }
}
