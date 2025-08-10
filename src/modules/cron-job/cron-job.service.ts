import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CronJob, CronStatus } from './entities/cron-job.entity';
import { VapiService } from '../vapi/vapi.service';
import { CallStatus, Lead } from '../lead/entities/lead.entity';
import { VapiCallDto } from '../vapi/dto/vapi.call.dto';
import { ConfigService } from '@nestjs/config';
import { CronLog, CronLogStatus } from '../cron-log/entities/cron-log.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationHelperService } from './helper/notification-helper.service';
import { User, UserRole } from '../users/entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailTemplate } from '../notifications/enums/email-template.enum';
import { NotificationEntityType, NotificationType } from '../notifications/entities/notification.entity';
import { NotificationChannel } from '../notification-sequence/entities/notification-sequence.entity';
import { PendingNotification } from '../pending-notifications/entities/pending-notifications.entity';

@Injectable()
export class CronJobService {
  constructor(
    @InjectRepository(CronJob)
    private readonly cronJobRepository: Repository<CronJob>,

    @InjectRepository(CronLog)
    private readonly cronLogRepository: Repository<CronLog>,

    @InjectRepository(Lead)
    private readonly LeadRepository: Repository<Lead>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly configService: ConfigService,
    private readonly vapiCallService: VapiService,
    private readonly notificationHelperService: NotificationHelperService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  private readonly logger = new Logger(CronJobService.name);

  @Cron(CronExpression.EVERY_SECOND)
  async fetchCallDetails() {
    this.logger.verbose("🚀 Starting fetching call details cron job execution")
    const cronJob = await this.cronJobRepository.findOne({
      where: {
        name: 'Fetch Call Details',
      },
    });
    if (!cronJob)
      throw new NotFoundException(
        'Cron Job with name Fetch Call Details not found',
      );

    if (cronJob?.status !== CronStatus.ACTIVE)
      this.logger.verbose(`Cron job name ${cronJob?.name} is not active`);

    const cronLog = this.cronLogRepository.create({
      cron_job: cronJob,
      status: CronLogStatus.RUNNING,
    });
    await cronLog.save();

    const callDetails = await this.vapiCallService.getCallDetails({
      cron_log: cronLog,
    });
    if (!callDetails) {
      this.logger.debug(`🔍 No 📞 call found`);
      return;
    }

    this.logger.verbose(`📞 call details: ${JSON.stringify(callDetails)}`);
  }

  /**
   * Handles scheduled notifications by processing pending notifications that are due
   * Supports multiple notification channels (EMAIL, SMS, CALL) with proper error handling
   */

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleNotifications() {
    const methodName = 'handleNotifications';
    const startTime = Date.now();

    this.logger.verbose(`🚀 Starting ${methodName} cron job execution`);

    let due_notification;
    let cron_job;
    try {

      // Step 1: Validate cron job configuration
      cron_job = await this.notificationHelperService.validateCronJobConfiguration();
      if (!cron_job) return;

      // Step 2: Check for ongoing calls to prevent conflicts
      const hasOngoingCall = await this.notificationHelperService.checkForOngoingCalls();
      if (hasOngoingCall) return;

      // Step 3: Fetch due notifications
      due_notification = await this.notificationHelperService.fetchDueNotification();
      if (!due_notification) {
        this.logger.debug(`✅ No pending notifications found - all caught up`);
        return;
      }

      // Step 4: Process the notification
      await this.notificationHelperService.processNotification(due_notification, cron_job);

      // // Step 5: Mark as sent
      await this.notificationHelperService.markNotificationAsSent(due_notification);

      const executionTime = Date.now() - startTime;
      this.logger.log(`✅ ${methodName} completed successfully in ${executionTime}ms`);

    } catch ({ response: catch_error }) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `❌ ${methodName} failed after ${executionTime}ms:`,
        // error?.stack || error
      );
      const error = await this.notificationHelperService.createErrorInfo(catch_error, due_notification, due_notification?.sequence_step?.channel as NotificationChannel);
      const admins = await this.userRepository.find({
        where: {
          role: In([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
        },
      });

      if (admins?.length) {
        this.logger.debug(
          `📧 Sending error notification email to admins`,
          // error?.stack || error
        );
        await this.eventEmitter.emitAsync('create-send-notification', {
          user_ids: [admins[0].id],
          title: error?.error?.title,
          message: `${error?.error?.description} while processing notifications. Here are the details`,
          template: EmailTemplate.LEAD_OR_VAPI_ERROR_ADMIN,
          notification_type: NotificationType.TRANSACTION,
          is_displayable: true,
          channels: [NotificationChannel.EMAIL],
          bypass_user_preferences: true,
          entity_type: NotificationEntityType.LEAD,
          entity_id: error?.id,
          meta_data: {
            ...error,
            owner_company_name: this.configService.get('COMPANY_NAME'),
            admin_name: 'Admin',
            ip: error?.ip ?? "N/A",
            ref_website: error?.ref_website ?? "N/A",
            country: error?.country ?? 'N/A',
            city: error?.city ?? 'N/A',
            region: error?.region ?? 'N/A',
            metro: error?.metro ?? 'N/A',
            area: error?.area ?? 'N/A',
            timezone: error?.timezone ?? 'N/A',
            cc: admins
              .filter(
                (admin) =>
                  admin.email !== this.configService.get('CONTACT_US_EMAIL'),
              )
              .map((admin) => admin.email),
          },
        });
      }
      // this.logger.warn(`🛑 Shutting down the cron job due to error`);
      // cron_job.notification_settings[error?.channel as NotificationChannel] = false;
      // await cron_job.save();
      throw error;
    }
  }


  //  ------------------------------------------------------------------


  // @Cron(CronExpression.EVERY_MINUTE)
  // async followUpCall() {
  //   try {
  //     const cronJob = await this.cronJobRepository.findOne({
  //       where: {
  //         name: 'Follow Up Call',
  //       },
  //     });
  //     if (cronJob?.status !== CronStatus.ACTIVE)
  //       return this.logger.verbose(
  //         `Cron job name ${cronJob?.name} is not active`,
  //       );

  //     const is_cronjob_running = await this.cronLogRepository.findOne({
  //       where: {
  //         status: CronLogStatus.RUNNING,
  //         cron_job: { id: cronJob?.id },
  //       },
  //     });
  //     if (is_cronjob_running)
  //       return this.logger.verbose(
  //         `Cron job name ${cronJob?.name} is having a running with id: ${is_cronjob_running.id} execution.`,
  //       );

  //     const last_lead = await this.LeadRepository.findOne({
  //       where: {
  //         call_status: CallStatus.PENDING,
  //       },
  //       order: {
  //         created_at: 'DESC',
  //       },
  //     });
  //     if (!last_lead) {
  //       this.logger.verbose(`No pending call found`);
  //       return;
  //     }

  //     const vapiCallData: VapiCallDto = {
  //       assistant_id: this.configService.get(
  //         'VAPI_PERSONAL_ASSISTANT_ID',
  //       ) as string,

  //       phone_number_id: this.configService.get(
  //         'VAPI_PERSONAL_PHONE_NUMBER_ID',
  //       ) as string,
  //       phone_number: last_lead.phone,
  //       name: last_lead.name,
  //       email: last_lead.email,
  //       lead_from: 'website_lead',
  //     };

  //     this.logger.verbose(
  //       `Follow up call data: ${vapiCallData.name} on phone number: ${vapiCallData.phone_number}`,
  //     );
  //     const cronLog = this.cronLogRepository.create({
  //       cron_job: cronJob,
  //       status: CronLogStatus.RUNNING,
  //     });
  //     await cronLog.save();

  //     await this.vapiCallService.call({
  //       body: {
  //         ...vapiCallData,
  //         phone_number: vapiCallData.phone_number,
  //         lead_id: last_lead.id,
  //       },
  //       inside_system: true,
  //     });
  //   } catch (error) {
  //     this.logger.error(error);
  //   }
  // }

  // Can be used for sending email to leads who have not received email notification on future

  // @Cron(CronExpression.EVERY_10_SECONDS)
  // async handleRelevanceLead() {
  //   const cronJob = await this.cronJobRepository.findOne({
  //     where: {
  //       name: 'Relevance Lead',
  //     },
  //   });
  //   if (!cronJob)
  //     throw new NotFoundException(
  //       'Cron Job with name Relevance Lead not found',
  //     );

  //   if (cronJob?.status !== CronStatus.ACTIVE)
  //     return this.logger.verbose(`Cron job name ${cronJob?.name} is not active`);

  //   const is_cronjob_running = await this.cronLogRepository.findOne({
  //     where: {
  //       status: CronLogStatus.RUNNING,
  //       cron_job: { id: cronJob?.id },
  //     },
  //   });
  //   if (is_cronjob_running)
  //     return this.logger.verbose(
  //       `Cron job name ${cronJob?.name} is having a running with id: ${is_cronjob_running.id} execution.`,
  //     );

  //   const leads = await this.LeadRepository.find({
  //     where: {
  //       lead_from: LeadFrom.RELEVANCE_AI_LEAD,
  //       is_email_send: IsNull(),
  //     },
  //     order: {
  //       created_at: 'DESC',
  //     },
  //     take: 19,
  //   });

  //   if (!leads) {
  //     this.logger.verbose(`No pending lead found`);
  //     return;
  //   }

  //   // await this.emailNotificationNoAuthService.sendEmailNotification(leads.email, 'Relevance Lead', 'Relevance Lead');

  // }

}
