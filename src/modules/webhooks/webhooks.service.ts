import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { In, Repository } from 'typeorm';
import { EmailNotificationNoAuthService } from '../notifications/services/email-notification-no-auth.service';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '../users/entities/user.entity';
import {
  Platform,
  ThirdPartyAccessToken,
} from './entities/third-party-access-token.entity';
import * as dayjs from 'dayjs';
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
    @InjectRepository(ThirdPartyAccessToken)
    private readonly thirdPartyAccessTokenRepository: Repository<ThirdPartyAccessToken>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly configService: ConfigService,
    private readonly emailNotificationNoAuthService: EmailNotificationNoAuthService,
  
  ) {}

  private readonly appId = process.env.FACEBOOK_APP_ID;
  private readonly appSecret = process.env.FACEBOOK_APP_SECRET;

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
