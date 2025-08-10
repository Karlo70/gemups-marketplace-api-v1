import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { IsNull, MoreThan, Repository } from 'typeorm';
import * as dayjs from 'dayjs';
import { LoginAttempt } from 'src/modules/auth/entities/login-attempt.entity';
import { User, UserStatus } from 'src/modules/users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(LoginAttempt)
    private readonly loginAttemptsRepository: Repository<LoginAttempt>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.attachUserIfAuthenticated(context);
    return true;
  }

  private async attachUserIfAuthenticated(
    context: ExecutionContext,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const accessToken = this.extractTokenFromHeader(request);

    if (!accessToken) {
      request['user'] = null;
      request['anonymous_user'] = this.attachAnonymousUserIdCookie(
        request,
        response,
      );
      return;
    }

    const loginAttempt = await this.loginAttemptsRepository.findOne({
      where: {
        access_token: accessToken,
        logout_at: IsNull(),
        expire_at: MoreThan(new Date()),
      },
      relations: { user: true },
    });

    if (!loginAttempt) {
      request['user'] = null;
      request['anonymous_user'] = this.attachAnonymousUserIdCookie(
        request,
        response,
      );
      return;
    }

    const user = await this.usersRepository.findOne({
      where: {
        id: loginAttempt.user.id,
        deleted_at: IsNull(),
        status: UserStatus.ACTIVE,
      },
    });

    if (!user) {
      request['user'] = null;
      request['anonymous_user'] = this.attachAnonymousUserIdCookie(
        request,
        response,
      );
      return;
    }

    loginAttempt.expire_at = dayjs().add(1, 'month').toDate();
    await this.loginAttemptsRepository.save(loginAttempt);

    request['user'] = user;
    request['loginAttempt'] = loginAttempt;
    request['anonymous_user'] = request['anonymous_user'];
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  // 🔒 Add this helper method in your class
  private attachAnonymousUserIdCookie(req: Request, res: Response) {
    const existingId = req.signedCookies?.anonymous_id;

    const ip =
      req?.headers['x-forwarded-for']
        ?.toString()
        ?.split(',')
        ?.shift()
        ?.trim() ??
      req?.['socket']?.remoteAddress ??
      req?.['ip'] ??
      'IP_NOT_FOUND';

    if (!existingId) {
      const raw = [
        ip,
        req.headers['user-agent'],
        req.headers['accept-language'],
        req.headers['accept-encoding'],
        req.headers['connection'],
        uuidv4(),
      ].join('|');

      const fingerprint = crypto.createHash('sha256').update(raw).digest('hex');

      res.cookie('anonymous_id', fingerprint, {
        // httpOnly: true,
        // secure: true,
        signed: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years in milliseconds
      });

      console.log(`New anonymous visitor ID: ${fingerprint}`);
      return fingerprint;
    } else {
      console.log(`Existing anonymous visitor ID: ${existingId}`);
      return existingId;
    }
  }
}
