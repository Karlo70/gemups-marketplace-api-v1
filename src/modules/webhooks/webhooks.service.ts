import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import {
  Lead,
} from '../lead/entities/lead.entity';
import { In, Repository } from 'typeorm';
import { EmailNotificationNoAuthService } from '../notifications/services/email-notification-no-auth.service';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '../users/entities/user.entity';
import {
  Platform,
  ThirdPartyAccessToken,
} from './entities/third-party-access-token.entity';
import * as dayjs from 'dayjs';
import { VapiService } from '../vapi/vapi.service';
import { VapiCallDto } from '../vapi/dto/vapi.call.dto';
export interface FACEBOOK_LEAD_RESPONSE {
  email: string;
  full_name: string;
  phone_number: string;
  first_name: string;
  last_name: string;
}

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(Lead)
    private readonly LeadRepository: Repository<Lead>,

    @InjectRepository(ThirdPartyAccessToken)
    private readonly thirdPartyAccessTokenRepository: Repository<ThirdPartyAccessToken>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly configService: ConfigService,
    private readonly emailNotificationNoAuthService: EmailNotificationNoAuthService,
    private readonly vapiCallService: VapiService,
  ) {}

  private readonly appId = process.env.FACEBOOK_APP_ID;
  private readonly appSecret = process.env.FACEBOOK_APP_SECRET;

  async processLead(inputData: any): Promise<void> {
    const buffer = Buffer.from(inputData);
    const jsonString = buffer.toString('utf-8');
    const jsonObject = JSON.parse(jsonString);

    const lead_genId = jsonObject?.entry[0]?.changes[0]?.value?.leadgen_id;

    if (lead_genId) {
      const leadData = await this.fetchLeadData(lead_genId);
      this.logData(leadData);
    } else {
      console.error('No lead_gen_id found in webhook data');
    }
  }

  private async fetchLeadData(lead_genId: string): Promise<any> {
    try {
      const tokenEntry = await this.thirdPartyAccessTokenRepository.findOne({
        where: { platform: Platform.FACEBOOK },
        order: { created_at: 'DESC' },
      });

      const access_token =
        tokenEntry?.long_lived_access_token ||
        tokenEntry?.short_lived_access_token;
      if (!access_token)
        throw new BadRequestException('No Facebook access token found');

      const validToken = await this.validateAndFixToken(access_token);
      if (!validToken)
        throw new BadRequestException('Could not get a valid Facebook token');

      const graphUrl = `https://graph.facebook.com/v17.0/${lead_genId}?access_token=${validToken}`;
      const response = await axios.get(graphUrl);
      return response.data;
    } catch (error) {
      console.error(
        'Error fetching lead data:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  private async validateAndFixToken(
    access_token: string,
  ): Promise<string | null> {
    const appAccessToken = `${this.appId}|${this.appSecret}`;
    const url = `https://graph.facebook.com/debug_token?input_token=${access_token}&access_token=${appAccessToken}`;

    try {
      const tokenEntry = await this.thirdPartyAccessTokenRepository.findOne({
        where: { platform: Platform.FACEBOOK },
        order: { created_at: 'DESC' },
      });

      if (!tokenEntry)
        throw new BadRequestException('No Facebook access token found');

      const expiresAt = tokenEntry?.expires_at;

      if (
        dayjs.unix(expiresAt).isBefore(dayjs()) ||
        dayjs.unix(expiresAt).isBefore(dayjs(), 'day')
      ) {
        console.log('⏳ Token expired or previous day passed. Refreshing...');
        return await this.refreshAccessToken(access_token);
      }

      // Fallback to validation from FB
      const response = await axios.get(url);
      const data = response.data;

      if (data?.data?.error?.code === 190 || data?.data?.is_valid === false) {
        console.warn('⚠️ Token invalid. Refreshing...');
        return await this.refreshAccessToken(access_token);
      }

      return access_token;
    } catch (error) {
      console.error(
        '❌ Error validating token:',
        error.response?.data || error.message,
      );
      return null;
    }
  }

  private async refreshAccessToken(old_token: string): Promise<string | null> {
    const url =
      `https://graph.facebook.com/v23.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${this.appId}&` +
      `client_secret=${this.appSecret}&` +
      `fb_exchange_token=${old_token}`;

    try {
      const response = await axios.get(url);

      const appAccessToken = `${this.appId}|${this.appSecret}`;

      const debug_url = `https://graph.facebook.com/debug_token?input_token=${response.data.access_token}&access_token=${appAccessToken}`;

      const debug_response = await axios.get(debug_url);

      const longLivedToken = response.data.access_token;
      console.log(
        response?.data?.expires_in ??
          debug_response?.data?.data?.data_access_expires_at,
      );
      // const expiresIn = dayjs()
      // .add(response?.data?.expires_in ?? debug_response?.data?.data?.data_access_expires_at, 'second')
      // .unix(); // in seconds

      // console.log("🚀 ~ WebhooksService ~ refreshAccessToken ~ expiresIn:", expiresIn)
      const accessTokenEntity = this.thirdPartyAccessTokenRepository.create({
        long_lived_access_token: longLivedToken,
        short_lived_access_token: old_token,
        expires_at: debug_response?.data?.data?.data_access_expires_at,
        platform: Platform.FACEBOOK,
      });

      await this.thirdPartyAccessTokenRepository.save(accessTokenEntity);
      console.info('✅ Token refreshed and saved');
      return longLivedToken;
    } catch (error) {
      console.error(
        '❌ Error refreshing token:',
        error.response?.data || error.message,
      );
      return null;
    }
  }

  async logData(data: any) {
    const cleanObj: FACEBOOK_LEAD_RESPONSE = this.cleanData(
      data,
    ) as FACEBOOK_LEAD_RESPONSE;
    console.table([cleanObj]);

    const Lead = this.LeadRepository.create({
      first_name: cleanObj?.first_name,
      last_name: cleanObj?.last_name,
      name: cleanObj?.full_name,
      email: cleanObj.email,
      phone: cleanObj.phone_number,
      ip: 'N/A',
      ref_website: 'N/A',
      lead_from: 'facebook_lead',
      message: '',
    });
    await this.LeadRepository.save(Lead);

    await this.emailNotificationNoAuthService.sendNotificationCustomer(
      {
        user: { email: Lead.email },
        notification: {
          title: 'We have received your query',
          message:
            'Thank you for contacting us. We will get back to you as soon as possible.',
          template: 'lead-no-auth',
        },
      },
      {
        ...Lead,
        owner_company_name: this.configService.get('COMPANY_NAME'),
      },
    );

    const admins = await this.userRepository.find({
      where: { role: In([UserRole.ADMIN, UserRole.SUPER_ADMIN]) },
    });

    if (admins.length) {
      await this.emailNotificationNoAuthService.sendNotificationAdmin(
        {
          user: {
            email:
              this.configService.get('SENDGRID_FROM_EMAIL') ?? 'sales@automely.ai',
          },
          notification: {
            title: 'New Contact Submission',
            message: 'You have a new contact submission',
            template: 'lead-no-auth-admin',
          },
        },
        {
          ...Lead,
          owner_company_name: this.configService.get('COMPANY_NAME'),
          admin_name: 'Admin',
          ip: Lead?.ip ?? 'N/A',
          ref_website: Lead?.ref_website ?? 'N/A',
          country: 'N/A',
          city: 'N/A',
          region: 'N/A',
          metro: 'N/A',
          area: 'N/A',
          timezone: 'N/A',
          cc: admins
            .filter(
              (admin) =>
                admin.email !== this.configService.get('SENDGRID_FROM_EMAIL'),
            )
            .map((admin) => admin.email),
        },
      );
    }

    console.info('📤 Initializing call...');
    const vapiCallData: VapiCallDto = {
      assistant_id: this.configService.get(
        'VAPI_PERSONAL_ASSISTANT_ID',
      ) as string,
      phone_number_id: this.configService.get(
        'VAPI_PERSONAL_PHONE_NUMBER_ID',
      ) as string,
      phone_number: cleanObj.phone_number,
      name: cleanObj.full_name,
      email: cleanObj.email,
      lead_from: 'facebook_lead',
    };

    await this.vapiCallService.call({
      body: { ...vapiCallData, lead_id: Lead.id },
      inside_system: true,
    });
    console.info('📤 Call successfully initialized...');
  }

  private cleanData(inputObj) {
    const cleanedObj = {};
    inputObj?.field_data?.forEach((field) => {
      const fieldName = field.name.toLowerCase().replace(/\s+/g, '_');
      const fieldValue = field.values[0];
      cleanedObj[fieldName] = fieldValue;
    });
    return cleanedObj;
  }
}
