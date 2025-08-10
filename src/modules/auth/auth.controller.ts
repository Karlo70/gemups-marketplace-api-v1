import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { SignUpDto } from './dto/sign-up.dto';
import { Request } from 'express';
import { LogInDto } from './dto/log-in.dto';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { ForgotPasswordDto } from './dto/forget-password.dto';
import { Throttle } from '@nestjs/throttler';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CurrentLoginAttempt } from 'src/shared/decorators/current-login-attempt.decorator';
import { LoginAttempt } from './entities/login-attempt.entity';
import { User } from '../users/entities/user.entity';
import { FormDataRequest } from 'nestjs-form-data';
import { VerifyOtpCodeDto } from './dto/verify-otp-code.dto';
import { AnonymousUser } from 'src/shared/decorators/anonymous-user.decorator';
import { OptionalAuthGuard } from 'src/shared/guards/optionalAuthentication.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @FormDataRequest()
  @UseGuards(OptionalAuthGuard)
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Req() req: Request,
  ): Promise<IResponse> {
    const signUpResponse = await this.authService.signUp(signUpDto, req);

    return {
      message: 'Account created successfully',
      details: signUpResponse.user,
      extra: { access_token: signUpResponse.access_token },
    };
  }

  @Post('get-anonymous')
  async getAnonymousUser(
    @AnonymousUser() anonymous_token: string,
    @Req() req: Request,
  ): Promise<IResponse> {
    const anonymous_user = await this.authService.createAnonymous(
      anonymous_token,
      req,
    );
    return {
      message: 'Account created successfully',
      details: anonymous_user.user,
      extra: { access_token: anonymous_user.access_token },
    };
  }

  @HttpCode(200)
  @FormDataRequest()
  @Post('login')
  async logIn(
    @Body() logInDto: LogInDto,
    @Req() req: Request,
  ): Promise<IResponse> {
    const signInResponse = await this.authService.logIn(logInDto, req);

    return {
      message: 'Login successfully',
      details: signInResponse.user,
      extra: { access_token: signInResponse.access_token },
    };
  }

  @Get('me')
  @UseGuards(AuthenticationGuard)
  async findMe(@CurrentUser() currentUser: User): Promise<IResponse> {
    return {
      message: 'User authenticated successfully',
      details: currentUser,
    };
  }

  @HttpCode(200)
  @Throttle({ default: { ttl: 2 * 60 * 1000, limit: 1 } })
  @Post('forget-password')
  @FormDataRequest()
  async forgetPassword(
    @Body() forgetPasswordDto: ForgotPasswordDto,
  ): Promise<IResponse> {
    await this.authService.forgetPassword(forgetPasswordDto);
    return {
      message: 'OTP sent successfully, please check you email',
    };
  }

  @HttpCode(200)
  @Throttle({ default: { ttl: 2 * 60 * 1000, limit: 3 } })
  @Post('verify-otp')
  @FormDataRequest()
  async verifyOtpCode(
    @Body() verifyOtpCodeDto: VerifyOtpCodeDto,
  ): Promise<IResponse> {
    await this.authService.verifyOtpCode(verifyOtpCodeDto);
    return {
      message: 'Otp code is correct',
    };
  }

  @HttpCode(200)
  @Throttle({ default: { ttl: 1 * 60 * 1000, limit: 3 } })
  @Post('reset-password')
  @FormDataRequest()
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<IResponse> {
    await this.authService.resetPassword(resetPasswordDto);

    return {
      message: 'Password reset successfully, Please login',
    };
  }

  @HttpCode(200)
  @Post('logout')
  @UseGuards(AuthenticationGuard)
  async logout(
    @CurrentLoginAttempt() currentLoginAttempt: LoginAttempt,
  ): Promise<IResponse> {
    await this.authService.logout(currentLoginAttempt);

    return {
      message: 'Logged out successfully',
    };
  }
}
