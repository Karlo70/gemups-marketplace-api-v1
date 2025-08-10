import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dayjs from 'dayjs';
import * as geoip from 'geoip-lite';

// Entities
import { CronJob, CronStatus } from '../entities/cron-job.entity';
import { VapiCall } from '../../vapi/entities/vapi-call.entity';
import { PendingNotification } from '../../pending-notifications/entities/pending-notifications.entity';
import { EmailLog, EmailLogStatus } from '../../email-logs/entities/email-log.entity';

// Services
import { VapiService } from '../../vapi/vapi.service';
import { EmailNotificationNoAuthService } from '../../notifications/services/email-notification-no-auth.service';

// Enums and Types
import { NotificationChannel, NotificationSequence } from '../../notification-sequence/entities/notification-sequence.entity';
import { VapiStatus } from '../../vapi/enums/call-and-enums';
import { CallFrom } from '../../vapi/enums/call-and-enums';
import { textCapitalize } from 'src/utils/text-capitalize';
import { valueToBoolean } from 'src/utils/to-boolean';
import { NotificationRetryLog } from 'src/modules/notification-retry-logs/entities/notification-retry-log.entity';
import { NotificationSequenceRetriesStatus, NotificationSequenceRetry } from 'src/modules/notification-sequence-retries/entities/notification-sequence-retry.entity';
import { ThirdPartyApi, ThirdPartyApiType, UseFor } from 'src/modules/third-party-api-key/entities/third-party-api-key.entity';
import { Lead } from 'src/modules/lead/entities/lead.entity';

@Injectable()
export class NotificationHelperService {
    private readonly logger = new Logger(NotificationHelperService.name);

    constructor(
        @InjectRepository(CronJob)
        private readonly cronJobRepository: Repository<CronJob>,

        @InjectRepository(VapiCall)
        private readonly vapiCallRepository: Repository<VapiCall>,

        @InjectRepository(EmailLog)
        private readonly emailLogRepository: Repository<EmailLog>,

        @InjectRepository(PendingNotification)
        private readonly pendingNotificationRepository: Repository<PendingNotification>,

        @InjectRepository(NotificationSequenceRetry)
        private readonly notificationSequenceRetryRepository: Repository<NotificationSequenceRetry>,

        @InjectRepository(NotificationRetryLog)
        private readonly notificationRetryLogRepository: Repository<NotificationRetryLog>,

        @InjectRepository(ThirdPartyApi)
        private readonly thirdPartyApiRepository: Repository<ThirdPartyApi>,

        private readonly vapiCallService: VapiService,
        private readonly configService: ConfigService,
        private readonly emailNotificationNoAuthService: EmailNotificationNoAuthService,
    ) { }

    /**
     * Validates cron job configuration and returns the cron job if valid
     */
    async validateCronJobConfiguration(cronJobName: string = 'Handle Notifications'): Promise<CronJob | null> {
        this.logger.verbose(`🔍 Validating cron job configuration for: ${cronJobName}`);

        const cronJob = await this.cronJobRepository.findOne({
            where: { name: cronJobName },
        });

        if (!cronJob) {
            this.logger.error(`❌ Cron job "${cronJobName}" not found in database`);
            return null;
        }

        if (cronJob.status === CronStatus.IN_ACTIVE) {
            this.logger.warn(`⚠️  Cron job "${cronJobName}" is inactive - skipping execution`);
            return null;
        }

        this.logger.debug(`✅  Cron job "${cronJobName}" is active and ready for execution`);
        return cronJob;
    }

    /**
     * Checks for ongoing calls to prevent notification conflicts
     */
    async checkForOngoingCalls(): Promise<boolean> {
        this.logger.debug(`🔍 Checking for ongoing calls...`);

        const ongoingCall = await this.vapiCallRepository.findOne({
            where: {
                status: In([
                    VapiStatus.RINGING,
                    VapiStatus.BUSY,
                    VapiStatus.QUEUED,
                    VapiStatus.IN_PROGRESS
                ]),
            },
        });

        if (ongoingCall) {
            this.logger.warn(
                `⚠️ Skipping notification processing - ongoing call detected (ID: ${ongoingCall.id}, Status: ${ongoingCall.status})`
            );
            return true;
        }

        this.logger.debug(`✅ No ongoing calls detected - proceeding with notifications`);
        return false;
    }

    /**
     * Fetches the next due notification from the queue
     */
    async fetchDueNotification(): Promise<PendingNotification | null> {
        this.logger.debug(`🔍 Fetching due notifications...`);

        const currentTimestamp = dayjs().unix();

        const dueNotification = await this.pendingNotificationRepository
            .createQueryBuilder('pending_notification')
            .leftJoinAndSelect('pending_notification.sequence_step', 'sequence_step')
            .leftJoinAndSelect('sequence_step.template', 'template')
            .leftJoinAndSelect('pending_notification.lead', 'lead')
            .where('pending_notification.scheduled_for <= :now', { now: currentTimestamp })
            .andWhere('pending_notification.is_sent IS NULL')
            .orderBy('pending_notification.scheduled_for', 'ASC') // FIFO processing
            .getOne();

        if (dueNotification) {
            this.logger.verbose(
                `📧 Found due notification: ID=${dueNotification.id}, ` +
                `Lead=${dueNotification.lead?.name || 'Unknown'} (${dueNotification.lead?.id}), ` +
                `Channel=${dueNotification.sequence_step?.channel}, ` +
                `Scheduled=${dayjs.unix(dueNotification.scheduled_for).format('YYYY-MM-DD HH:mm:ss')}`
            );
        }

        return dueNotification;
    }

    /**
     * Processes a notification based on its channel type
     */
    async processNotification(notification: PendingNotification, cron_job: CronJob): Promise<void> {
        const { channel, template } = notification.sequence_step;
        const leadName = notification.lead?.name || 'Unknown';
        const leadId = notification.lead?.id;

        this.logger.verbose(
            `📤 Processing notification: Channel=${channel}, Lead=${leadName} (${leadId}), Template=${template?.name || 'Custom'}`
        );

        try {
            // Channel-specific processing with detailed logging
            const channelHandlers: Record<NotificationChannel, (notification: PendingNotification) => Promise<void>> = {
                [NotificationChannel.EMAIL]: async (notification) => {
                    if (valueToBoolean(cron_job.notification_settings?.[NotificationChannel.EMAIL])) {
                        this.logger.debug(`📧 Processing EMAIL notification for lead ${leadName}`);
                        await this.sendEmailToLeads(notification);
                        this.logger.verbose(`✅ EMAIL notification sent successfully to ${leadName}`);
                    } else {
                        this.logger.warn(`⚠️ EMAIL notifications are disabled in cron job settings. Skipping for ${leadName}`);
                    }
                },

                [NotificationChannel.SMS]: async (notification) => {
                    if (valueToBoolean(cron_job.notification_settings?.[NotificationChannel.SMS])) {
                        this.logger.debug(`📱 Processing SMS notification for lead ${leadName}`);
                        // TODO: Implement SMS service integration
                        this.logger.warn(`⚠️ SMS channel not yet implemented - skipping notification for ${leadName}`);
                    } else {
                        this.logger.warn(`⚠️ SMS notifications are disabled in cron job settings. Skipping for ${leadName}`);
                    }
                },

                [NotificationChannel.CALL]: async (notification) => {
                    if (valueToBoolean(cron_job.notification_settings?.[NotificationChannel.CALL])) {
                        this.logger.debug(`📞 Processing CALL notification for lead ${leadName}`);
                        await this.handleCallToLead(notification);
                        this.logger.verbose(`✅ CALL notification initiated successfully to ${leadName}`);
                    } else {
                        this.logger.warn(`⚠️ CALL notifications are disabled in cron job settings. Skipping for ${leadName}`);
                    }
                },
            };

            if (channel in channelHandlers) {
                await channelHandlers[channel](notification);
            } else {
                const errorMsg = `Unsupported notification channel: ${channel}`;
                this.logger.error(`❌ ${errorMsg}`);
                throw new Error(errorMsg);
            }

        } catch (error) {
            this.logger.error(
                `❌ Failed to process ${channel} notification for lead ${leadName}: ${error?.message || error}`,
                // error?.stack || error
            );

            // Create comprehensive error object for admin notification
            // const errorInfo = this.createErrorInfo(error, notification, channel);

            // Update notification with error details
            notification.error = error?.message || 'Unknown error occurred';
            notification.is_sent = new Date();
            await notification.save();

            // Send admin notification about the error
            // await this.sendAdminErrorNotification(errorInfo);

            throw error;
        }
    }

    /**
     * Marks a notification as sent and logs the completion
     */
    async markNotificationAsSent(notification: PendingNotification): Promise<void> {
        const leadName = notification.lead?.name || 'Unknown';
        const channel = notification.sequence_step?.channel;

        try {
            notification.is_sent = new Date();
            await notification.save();

            this.logger.verbose(
                `✅ Notification marked as sent: ${channel} to ${leadName} (${notification.lead?.id})`
            );

        } catch (error) {
            this.logger.error(
                `❌ Failed to mark notification as sent for ${leadName}: ${error?.message || error}`
            );

            // Create comprehensive error object for admin notification
            // const errorInfo = this.createErrorInfo(error, notification, 'MARK_AS_SENT');

            // Send admin notification about the error
            // await this.sendAdminErrorNotification(errorInfo);

            throw error;
        }
    }

    /**
     * Sends email notification to leads with comprehensive logging and error handling
     */
    private async sendEmailToLeads(dueNotifications: PendingNotification) {
        const { template } = dueNotifications.sequence_step;
        const leadName = dueNotifications.lead.name || `${dueNotifications.lead.first_name} ${dueNotifications.lead.last_name}`;
        const leadEmail = dueNotifications.lead.email;
        const leadId = dueNotifications.lead.id;

        this.logger.debug(`📧 Preparing email for lead: ${leadName} (${leadId}) to ${leadEmail}`);

        try {
            // Step 1: Check for Api Limit 
            await this.checkApiLimit(dueNotifications);

            // Step 2: Prepare email content with template variables
            const emailBody = this.prepareEmailContent(dueNotifications, leadName);
            this.logger.debug(`📧 Email content prepared for ${leadName}`);

            // Step 3: Create email log entry
            const emailLog = await this.createEmailLogEntry(dueNotifications, emailBody);
            this.logger.debug(`📧 Email log entry created with ID: ${emailLog.id}`);

            // Step 4: Send email notification
            await this.sendEmailNotification(template, leadEmail, emailBody, emailLog, dueNotifications);

            this.logger.verbose(`✅ Email sent successfully to ${leadName} (${leadId}) at ${leadEmail}`);

        } catch (error) {
            this.logger.error(
                `❌ Failed to send email to ${leadName} (${leadId}): ${error?.message || error}`,
                error?.stack || error
            );

            // Create comprehensive error object for admin notification
            // const errorInfo = this.createErrorInfo(error, dueNotifications, 'EMAIL');

            // Send admin notification about the error
            // await this.sendAdminErrorNotification(errorInfo);

            throw error;
        }
    }

    /**
     * Handles call notifications to leads with comprehensive logging and error handling
     */
    private async handleCallToLead(dueNotifications: PendingNotification) {
        const leadName = dueNotifications.lead.name || `${dueNotifications.lead.first_name} ${dueNotifications.lead.last_name}`;
        const leadPhone = dueNotifications.lead.phone;
        const leadId = dueNotifications.lead.id;

        this.logger.debug(`📞 Preparing call for lead: ${leadName} (${leadId}) at ${leadPhone}`);

        try {
            // Step 1: Validate required configuration
            const assistantId = this.configService.get('VAPI_PERSONAL_ASSISTANT_ID') as string;
            const phoneNumberId = this.configService.get('VAPI_PERSONAL_PHONE_NUMBER_ID') as string;

            if (!assistantId || !phoneNumberId) {
                throw new Error('Missing VAPI configuration: assistant_id or phone_number_id');
            }

            this.logger.debug(`📞 VAPI configuration validated for ${leadName}`);

            // Step 2: Prepare call payload
            const callPayload = this.prepareCallPayload(dueNotifications, assistantId, phoneNumberId);
            this.logger.debug(`📞 Call payload prepared for ${leadName}`);

            // Step 3: Initiate call
            await this.vapiCallService.call({
                body: callPayload,
                inside_system: true,
            });

            this.logger.verbose(`✅ Call initiated successfully for ${leadName} (${leadId}) at ${leadPhone}`);

        } catch (error) {
            this.logger.error(
                `❌ Failed to initiate call for ${leadName} (${leadId}): ${error?.message || error}`,
                error?.stack || error
            );

            // Create comprehensive error object for admin notification
            // const errorInfo = this.createErrorInfo(error, dueNotifications, 'CALL');

            // Send admin notification about the error
            // await this.sendAdminErrorNotification(errorInfo);

            throw error;
        }
    }

    /**
     * Creates comprehensive error information object for admin notifications
     */
    async createErrorInfo(error: any, notification: PendingNotification, operationType: string) {
        const lead = notification?.lead;
        const geo = geoip.lookup(lead?.ip);
        const panelUrl = this.configService.get('PANEL_URL');
        const companyName = this.configService.get('COMPANY_NAME');

        // Create notification retry log
        const notificationRetryLog = await this.notificationSequenceRetryRepository.find({
            where: {
                sequence: { id: notification.sequence_step.id },
                status: NotificationSequenceRetriesStatus.ACTIVE,
            },
        });

        if (!notificationRetryLog) {
            this.logger.verbose(`🔍 No notification retry log found for ${lead?.name} (${lead?.id})`);
        }

        notificationRetryLog.map(async (retry) => {
            const notificationRetryLogEntry = this.notificationRetryLogRepository.create({
                pending_notification: notification,
                sequence_retry: retry,
            });
            await notificationRetryLogEntry.save();
        })


        return ({
            // Channel Type
            channel: notification?.sequence_step?.channel,
            template: notification?.sequence_step?.template?.name,

            // Lead information
            id: lead?.id,
            name: lead?.name || `${lead.first_name} ${lead.last_name}`,
            email: lead?.email,
            phone: lead?.phone,
            company: lead?.company || lead?.company_name,
            message: lead?.message,
            ref_website: lead?.ref_website,
            ip: lead?.ip,
            created_at: lead?.created_at,

            // Geolocation information
            country: geo?.country ?? 'N/A',
            city: geo?.city ?? 'N/A',
            region: geo?.region ?? 'N/A',
            metro: geo?.metro ?? 'N/A',
            area: geo?.area ?? 'N/A',
            timezone: geo?.timezone ?? 'N/A',

            // Technical details
            user_agent: geo?.userAgent ?? 'N/A', // Not available in cron context

            // Error information
            error: {
                title: `${textCapitalize(operationType)} Processing Error`,
                description: error?.message ?? 'Unknown error occurred during notification processing',
                details: error?.stack?.split('\n').filter(line => line.trim()) || [
                    error?.message || 'No error details available',
                    `Operation: ${operationType}`,
                    `Notification ID: ${notification.id}`,
                    `Channel: ${notification.sequence_step?.channel}`,
                    `Scheduled for: ${dayjs.unix(notification.scheduled_for).format('YYYY-MM-DD hh:mm:ss A')}`
                ]
            },

            // Action URLs
            actions: {
                view_log_url: `${panelUrl}logs/notification/${notification.id}`,
                view_lead_url: `${panelUrl}leads/${lead.id}`,
                retry_url: `${panelUrl}notifications/${notification.id}/retry`
            },

            // Panel URLs
            panel_url: {
                links: {
                    settings: `${panelUrl}settings/notifications`,
                    help: `${panelUrl}help`,
                    docs: `${panelUrl}docs`
                }
            },

            // Other fields
            year: dayjs().year(),
            owner_company_name: companyName
        })
    }

    /**
     * Sends admin notification about processing errors
     */
    private async sendAdminErrorNotification(errorInfo: any) {

        this.logger.debug(`📧 Admin error notification sent for lead ${errorInfo.name}`);
        this.logger.error(`❌ Failed to send admin error notification: ${errorInfo?.error?.title}`);
        throw new BadRequestException(errorInfo)
    }

    /**
     * Prepares email content by replacing template variables
     */
    private prepareEmailContent(due_notification: PendingNotification, leadName: string): string {

        if (due_notification.lead.email_body)
            return due_notification.lead.email_body

        return due_notification.sequence_step.template.body
            .replace("{{customer_name}}", leadName)
            .replace("{{year}}", dayjs().year().toString());
    }

    /**
     * Creates email log entry for tracking
     */
    private async createEmailLogEntry(dueNotifications: PendingNotification, emailBody: string): Promise<EmailLog> {
        const emailLog = this.emailLogRepository.create({
            lead: dueNotifications.lead,
            pending_notification: dueNotifications,
            email: dueNotifications.lead.email,
            body: emailBody,
            status: EmailLogStatus.SENT,
        });

        return await emailLog.save();
    }

    /**
     * Sends email notification with error handling and log updates
     */
    private async sendEmailNotification(
        template: any,
        leadEmail: string,
        emailBody: string,
        emailLog: EmailLog,
        dueNotifications: PendingNotification
    ): Promise<void> {
        try {
            const relevance_lead_subject = dueNotifications.lead.subject;
            const relevance_lead_email_body = dueNotifications.lead.email_body;

            await this.emailNotificationNoAuthService.sendNotificationCustomer(
                {
                    notification: {
                        title: relevance_lead_subject ?? template.name,
                        message: relevance_lead_subject ?? template.subject,
                    },
                    user: {
                        email: leadEmail,
                    }
                },
                {
                    html: relevance_lead_email_body || emailBody,
                }
            );

            this.logger.debug(`📧 Email notification sent successfully to ${leadEmail}`);

        } catch (error) {
            // Update email log with failure status
            emailLog.status = EmailLogStatus.FAILED;
            emailLog.error = error?.message || 'Unknown email sending error';
            await emailLog.save();

            dueNotifications.is_sent = new Date();
            await dueNotifications.save();

            this.logger.error(
                `❌ Email sending failed for ${leadEmail}: ${error?.message || error}`,
                // error?.stack || error
            );

            // const errorInfo = this.createErrorInfo(error, dueNotifications, 'EMAIL');
            // await this.sendAdminErrorNotification(errorInfo);

            throw new BadRequestException({
                message: error?.message || 'Unknown email sending error',
                stack: error?.stack || error,
                error: error,
                dueNotifications: dueNotifications,
                emailLog: emailLog,
                template: template,
                leadEmail: leadEmail,
            });
        }
    }

    /**
     * Prepares call payload for VAPI service
     */
    private prepareCallPayload(
        dueNotifications: PendingNotification,
        assistantId: string,
        phoneNumberId: string
    ) {
        const leadName = dueNotifications.lead.name || `${dueNotifications.lead.first_name} ${dueNotifications.lead.last_name}`;

        return {
            assistant_id: assistantId,
            phone_number_id: phoneNumberId,
            phone_number: dueNotifications.lead.phone,
            name: leadName,
            email: dueNotifications.lead.email,
            lead_from: dueNotifications.lead.lead_from,
            lead_id: dueNotifications.lead.id,
            call_from: CallFrom.SYSTEM,
        };
    }

    /**
     * Checks if the API limit has been exceeded
     */
    private async checkApiLimit(dueNotifications: PendingNotification) {
        const apiLimit = await this.thirdPartyApiRepository
            .createQueryBuilder('api')
            .where('api.type = :type', { type: ThirdPartyApiType.EMAIL })
            .andWhere('api.use_for = :useFor', { useFor: UseFor.FOR_CUSTOMER })
            .andWhere('api.is_default = :isDefault', { isDefault: true })
            .getOne();

        const emailLogs = await this.emailLogRepository.find({
            where: {
                created_at: Between(dayjs().subtract(1, 'hour').toDate(), dayjs().toDate()),
            }
        });

        if (!apiLimit) {
            throw new BadRequestException('API key not found');
        }

        if (emailLogs.length >= apiLimit.hourly_limit) {
            throw new BadRequestException('API limit exceeded');
        }
    }
} 