import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginAttempt, LoginType } from './entities/login-attempt.entity';
import { UAParser } from 'ua-parser-js';
import { getClientIp } from 'request-ip';
import * as dayjs from 'dayjs';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';

@Injectable()
export class LoginAttemptService {
  constructor(
    @InjectRepository(LoginAttempt)
    private readonly loginAttemptsRepository: Repository<LoginAttempt>,
  ) {}

  async createLoginAttempt(
    req: Request,
    user: User,
    accessToken: string,
    loginType?: LoginType,
  ) {
    const parser = new UAParser();
    const userAgentInfo = parser
      .setUA(req.headers['user-agent'] ?? '')
      .getResult();

    const loginAttempt = this.loginAttemptsRepository.create({
      user: user,
      access_token: accessToken,
      ip_address: getClientIp(req),
      platform: userAgentInfo?.os?.name,
      user_agent: req?.headers['user-agent'],
      expire_at: dayjs().add(1, 'month').toDate(),
      login_type: loginType,
    });

    return loginAttempt.save();
  }
}
