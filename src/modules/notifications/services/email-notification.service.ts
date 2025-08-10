import { Injectable } from '@nestjs/common';
import { UserNotification } from '../entities/user-notification.entity';
import { ConfigService } from '@nestjs/config';
import * as dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';
@Injectable()
export class EmailNotificationService {
  private readonly backendUrl: string;
  private readonly companyName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {
    this.backendUrl = this.configService.get('BACKEND_URL') ?? '';
    this.companyName = this.configService.get('APP_NAME') ?? '';
  }

  async sendNotification(userNotification: UserNotification, payload: any) {
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
