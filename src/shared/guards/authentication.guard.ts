import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { IsNull, MoreThan, Repository } from 'typeorm';
import * as dayjs from 'dayjs';
import { User, UserStatus } from 'src/modules/users/entities/user.entity';
import { LoginAttempt } from 'src/modules/auth/entities/login-attempt.entity';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    @InjectRepository(LoginAttempt)
    private readonly loginAttemptsRepository: Repository<LoginAttempt>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const accessToken = this.extractTokenFromHeader(request);

    if (!accessToken) {
      throw new UnauthorizedException('Please provide access token');
    }

    const loginAttempt = await this.loginAttemptsRepository.findOne({
      where: {
        access_token: accessToken,
        logout_at: IsNull(),
        expire_at: MoreThan(new Date()),
      },
      relations: {
        user: true,
      },
    });

    if (!loginAttempt) {
      throw new UnauthorizedException('Please login again');
    }

    const user = await this.usersRepository.findOne({
      where: {
        id: loginAttempt.user.id,
        deleted_at: IsNull(),
        status: UserStatus.ACTIVE,
      },
      relations: {
        cryptomus_wallet: true,
        cart: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Session expired');
    }

    loginAttempt.expire_at = dayjs().add(1, 'month').toDate();
    await this.loginAttemptsRepository.save(loginAttempt);

    request['user'] = user;
    request['loginAttempt'] = loginAttempt;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}
