import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';
import { readFileSync } from 'node:fs';
import * as Handlebars from 'handlebars';
import * as Sg from '@sendgrid/mail';
import { ThirdPartyApi, ThirdPartyApiType, UseFor } from 'src/modules/third-party-api-key/entities/third-party-api-key.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, IsNull, MoreThan, Repository } from 'typeorm';
import { EncryptionService } from 'src/shared/services/encryption.service';
import { EmailLog, EmailLogStatus } from 'src/modules/email-logs/entities/email-log.entity';

@Injectable()
export class EmailNotificationNoAuthService {
  private readonly backendUrl: string;
  private readonly companyName: string;

  constructor(
    @InjectRepository(ThirdPartyApi)
    private readonly thirdPartyApiRepository: Repository<ThirdPartyApi>,
    @InjectRepository(EmailLog)
    private readonly emailLogRepository: Repository<EmailLog>,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly encryptionService: EncryptionService,
  ) {
    this.backendUrl = this.configService.get('BACKEND_URL') ?? '';
    this.companyName = this.configService.get('APP_NAME') ?? '';
  }

  async sendNotificationCustomer(userNotification: any, payload: any) {

    const thirdPartyApi = await this.thirdPartyApiRepository.findOne({
      where: {
        is_default: true,
        type: ThirdPartyApiType.EMAIL,
        use_for: UseFor.FOR_CUSTOMER,
        deleted_at: IsNull(),
      }
    })

    if (!thirdPartyApi) {
      throw new BadRequestException('No default email API found');
    }
    const emailLogs = await this.emailLogRepository.find({
      where: {
        created_at: Between(dayjs().startOf('day').toDate(), dayjs().endOf('day').toDate()),
        status: EmailLogStatus.SENT,
      }
    })
    if (emailLogs.length && thirdPartyApi.daily_limit <= emailLogs.length) {
      throw new BadRequestException({
        message: 'Daily limit reached',
        details: {
          daily_limit: thirdPartyApi.daily_limit,
          email_logs_count: emailLogs.length,
        }
      });
    }

    Sg.setApiKey(this.encryptionService.decrypt(thirdPartyApi.key));

    const context = {
      backend_url: this.backendUrl,
      year: dayjs().get('year'),
      company_name: this.companyName,
      title: userNotification?.notification?.title,
      message: userNotification?.notification?.message,
      ...payload,
    };
    let htmlContent: string | undefined;
    if (userNotification?.notification?.template) {
      const templatePath = `src/modules/notifications/templates/${userNotification?.notification?.template}.hbs`;
      const templateSource = readFileSync(templatePath, 'utf8');
      // Compile with Handlebars
      const template = Handlebars.compile(templateSource);
      // Apply dynamic context values
      htmlContent = template(context);
    }

    // if (this.configService.get('NODE_ENV') === 'development') return;

    await Sg.send({
      to: userNotification?.user?.email,
      from: this.configService.get('SENDGRID_FROM_EMAIL') ?? '',
      subject: userNotification?.notification?.title,
      html: htmlContent ?? context?.html,
    })
      .then((response) => {
        console.info(
          `[SendGrid] Email sent to ${userNotification?.user?.email}`,
          response,
        );
      })
      .catch((error) => {
        // console.error(
        //   `[SendGrid] Error sending email to ${userNotification?.user?.email}`,
        //   error.response.body.errors[0].message,
        // );
        throw new BadRequestException({
          message: error.response.body.errors[0].message,
        });
      });
  }

  async sendNotificationAdmin(userNotification: any, payload: any) {
    const context = {
      backend_url: this.backendUrl,
      year: dayjs().get('year'),
      company_name: this.companyName,
      title: userNotification.notification.title,
      message: userNotification.notification.message,
      ...payload,
    };

    // if (this.configService.get('NODE_ENV') === 'development') return;

    await this.mailerService.sendMail({
      to: userNotification.user.email,
      subject: userNotification.notification.title,
      template: `./${userNotification.notification.template}`,
      context,
      ...(context.cc && {
        cc: context.cc,
      }),
    });
  }
}
