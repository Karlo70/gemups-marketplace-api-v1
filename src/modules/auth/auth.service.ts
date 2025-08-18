import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { ValidationException } from 'src/utils/validation-exception-formatter';
import { JwtService } from '@nestjs/jwt';
import { LoginAttemptService } from './login-attempt.service';
import { LoginAttempt, LoginType } from './entities/login-attempt.entity';
import { Request } from 'express';
import { LogInDto } from './dto/log-in.dto';
import { ForgotPasswordDto } from './dto/forget-password.dto';
import { Otp, OtpPurpose } from './entities/otp.entity';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import * as dayjs from 'dayjs';
import { VerifyOtpCodeDto } from './dto/verify-otp-code.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailTemplate } from '../notifications/enums/email-template.enum';
import {
  NotificationChannel,
  NotificationEntityType,
  NotificationType,
} from '../notifications/entities/notification.entity';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,

    @InjectRepository(LoginAttempt)
    private readonly loginAttemptRepository: Repository<LoginAttempt>,

    private readonly jwtService: JwtService,
    private readonly loginAttemptService: LoginAttemptService,
    private readonly notificationsService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) { }

  async signUp(signUpDto: SignUpDto, req: Request) {
    const access_token = req?.headers.authorization?.split(' ')[1] ?? '';
    const existingUser = await this.usersRepository.findOne({
      where: { email: signUpDto.email },
    });

    if (existingUser) {
      throw new ValidationException({ email: 'Email already exists' });
    }

    if (access_token) {
      const login_attempt = await this.loginAttemptRepository.findOne({
        where: {
          access_token: access_token,
        },
        relations: ['user'],
      });
      const anonymous_user = await this.usersRepository.findOne({
        where: {
          id: login_attempt?.user.id,
        },
      });

      if (!anonymous_user)
        throw new BadRequestException(
          `No anonymous user with this access_token ${access_token} found!`,
        );
      // Update User
      Object.assign(anonymous_user, {
        ...signUpDto,
        role: UserRole.CUSTOMER,
      });
      await anonymous_user.save();

      const accessToken = await this.jwtService.signAsync({
        user_id: anonymous_user.id,
      });

      await this.loginAttemptService.createLoginAttempt(
        req,
        anonymous_user,
        accessToken,
        LoginType.EMAIL,
      );

      const { password, ...anonymous_user_data } = anonymous_user;

      const user = await this.usersRepository.findOne({
        where: {
          id: anonymous_user.id,
        },
        relations: {
          cryptomus_wallet: true,
        },
      })

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        user: user,
        access_token: accessToken,
      };
    }

    const user = this.usersRepository.create({
      ...signUpDto,
    });

    await user.save();

    await this.notificationsService.createUserNotificationSetting(user);

    const accessToken = await this.jwtService.signAsync({
      user_id: user.id,
    });

    await this.loginAttemptService.createLoginAttempt(
      req,
      user,
      accessToken,
      LoginType.EMAIL,
    );

    const { password, ...userData } = user;

    return {
      user: userData,
      access_token: accessToken,
    };
  }

  async createAnonymous(anonymous_token: string, req: Request) {
    if (req?.['user'])
      return {
        user: req?.['user'],
        access_token: req?.headers?.authorization?.split(' ')[1] ?? [],
      };

    const existing_anonymous_user = await this.usersRepository.findOne({
      where: {
        anonymous_token: anonymous_token,
      },
    });
    if (anonymous_token && existing_anonymous_user) {
      return {
        user: existing_anonymous_user,
        access_token: req?.headers?.authorization?.split(' ')[1] ?? [],
      };
    }

    const anonymous_user = this.usersRepository.create({
      anonymous_token: anonymous_token,
      role: UserRole.ANONYMOUS,
    });

    await anonymous_user.save();

    const accessToken = await this.jwtService.signAsync({
      user_id: anonymous_user.id,
    });

    await this.loginAttemptService.createLoginAttempt(
      req,
      anonymous_user,
      accessToken,
      LoginType.ANONYMOUS,
    );

    const { password, ...anonymous_user_data } = anonymous_user;
    return {
      user: anonymous_user_data,
      access_token: accessToken,
    };
  }

  async logIn(logInDto: LogInDto, req: Request) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile_image', 'profile_image')
      .leftJoinAndSelect('user.cryptomus_wallet', 'cryptomus_wallet')
      .addSelect('user.password')
      .where('user.email = :email AND user.deleted_at IS NULL', {
        email: logInDto.email,
      })
      .andWhere('user.role In (:...roles)', { roles: logInDto.roles })
      .getOne();

    if (!user) {
      throw new NotFoundException('User does not exists');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new BadRequestException(
        'Your account has been deactivated by the admin',
      );
    }

    if (!(await user.comparePassword(logInDto.password))) {
      throw new BadRequestException('Invalid Credentials');
    }

    const accessToken = await this.jwtService.signAsync({
      user_id: user.id,
    });

    await this.loginAttemptService.createLoginAttempt(
      req,
      user,
      accessToken,
      LoginType.EMAIL,
    );

    const { password, ...userData } = user;

    return { user: userData, access_token: accessToken };
  }

  async forgetPassword(forgetPasswordDto: ForgotPasswordDto) {
    const user = await this.usersRepository.findOne({
      where: {
        email: forgetPasswordDto.email,
        status: UserStatus.ACTIVE,
        deleted_at: IsNull(),
      },
    });

    if (!user) {
      throw new ValidationException({ email: "Email doesn't exists" });
    }

    const otp = this.otpRepository.create({
      purpose: OtpPurpose.FORGOT_PASSWORD,
      user: user,
      expires_at: dayjs().add(15, 'minutes').toDate(),
    });

    await this.otpRepository.save(otp);

    await this.eventEmitter.emitAsync('create-send-notification', {
      user_ids: [user.id],
      title: 'OTP For Password Reset',
      message:
        'We received a request to reset your password. Use the OTP code shown below to reset it',
      template: EmailTemplate.FORGET_PASSWORD_OTP,
      notification_type: NotificationType.TRANSACTION,
      is_displayable: false,
      channels: [NotificationChannel.EMAIL],
      bypass_user_preferences: true,
      entity_type: NotificationEntityType.OTP,
      entity_id: otp.id,
      meta_data: {
        otp_code: otp.code,
        name: user.first_name + user.last_name,
        reset_url: `${this.configService.get('FRONTEND_URL')}/otp-verification?email=${user.email}`,
      },
    });
  }

  async verifyOtpCode(verifyOtpCodeDto: VerifyOtpCodeDto) {
    const otp = await this.otpRepository.findOne({
      where: {
        code: verifyOtpCodeDto.otp_code,
        user: { email: verifyOtpCodeDto.email },
        is_used: false,
        expires_at: MoreThan(new Date()),
        purpose: OtpPurpose.FORGOT_PASSWORD,
      },
    });

    if (!otp) {
      throw new BadRequestException('Invalid OTP');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const otp = await this.otpRepository.findOne({
      where: {
        code: resetPasswordDto.otp_code,
        user: { email: resetPasswordDto.email },
        is_used: false,
        expires_at: MoreThan(new Date()),
        purpose: OtpPurpose.FORGOT_PASSWORD,
      },
      relations: {
        user: true,
      },
    });

    if (!otp) {
      throw new BadRequestException('Invalid OTP');
    }

    otp.is_used = true;
    await this.otpRepository.save(otp);

    const user = otp.user;
    user.password = resetPasswordDto.password;
    await this.usersRepository.save(user);
  }

  async logout(currentLoginAttempt: LoginAttempt) {
    currentLoginAttempt.logout_at = new Date();
    await currentLoginAttempt.save();
  }
}
