import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CryptomusService } from './cryptomus.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { CryptomusWebhookDto } from './dto/webhook.dto';
import { AuthenticationGuard } from '../../shared/guards/authentication.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { User } from '../users/entities/user.entity';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { TestWalletWebhookDto } from './dto/test-webhook.dto';

@Controller('cryptomus')
export class CryptomusController {
  constructor(private readonly cryptomusService: CryptomusService) { }

  @Get('payment-services')
  async getPaymentServices(): Promise<IResponse> {
    const { result } = await this.cryptomusService.getPaymentServices();
    return {
      details: result,
      message: 'Payment services retrieved successfully',
    };
  }

  @Post('wallets')
  @UseGuards(AuthenticationGuard, RolesGuard)
  async createWallet(@Body() createWalletDto: CreateWalletDto, @CurrentUser() user: User): Promise<IResponse> {
    const wallet = await this.cryptomusService.createWallet(createWalletDto, user);
    return {
      message: 'Wallet created successfully',
      details: wallet,
    };
  }

  @Get('wallets')
  @UseGuards(AuthenticationGuard, RolesGuard)
  async getWallets(): Promise<IResponse> {
    const wallets = await this.cryptomusService.getActiveWallets();
    return {
      details: wallets,
      message: 'Wallets retrieved successfully',
    };
  }

  @Get('wallets/me')
  @UseGuards(AuthenticationGuard)
  async getMyWallet(@CurrentUser() user: User): Promise<IResponse> {
    const wallet = await this.cryptomusService.getMyWallet(user);
    return {
      details: wallet,
      message: 'Wallet retrieved successfully',
    };
  }

  @Get('wallets/:id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  async getWallet(@Param() paramIdDto: ParamIdDto, @CurrentUser() user: User): Promise<IResponse> {
    const wallet = await this.cryptomusService.getWalletById(paramIdDto, user);
    return {
      details: wallet,
      message: 'Wallet retrieved successfully',
    };
  }

  @Post('payments')
  @UseGuards(AuthenticationGuard)
  async createPayment(@Body() createPaymentDto: CreatePaymentDto): Promise<IResponse> {
    const payment = await this.cryptomusService.createPayment(createPaymentDto);
    return {
      details: payment,
      message: 'Payment created successfully',
    };
  }

  @Get('payments/:id')
  @UseGuards(AuthenticationGuard)
  async getPayment(@Param() paramIdDto: ParamIdDto, @CurrentUser() user: User): Promise<IResponse> {
    const payment = await this.cryptomusService.getPaymentById(paramIdDto, user);
    return {
      details: payment,
      message: 'Payment retrieved successfully',
    };
  }

  @Get('payments/order/:orderId')
  @UseGuards(AuthenticationGuard)
  async getPaymentByOrderId(@Param() paramIdDto: ParamIdDto, @CurrentUser() user: User): Promise<IResponse> {
    const payment = await this.cryptomusService.getPaymentByOrderId(paramIdDto, user);
    return {
      details: payment,
      message: 'Payment retrieved successfully',
    };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() webhookData: CryptomusWebhookDto,
    @Headers('signature') signature: string,): Promise<IResponse> {
    await this.cryptomusService.processWebhook(webhookData, signature);
    return { message: 'Webhook processed successfully' };
  }

  @Post('test-webhook/wallet')
  @UseGuards(AuthenticationGuard)
  async testWalletWebhook(@Body() testWebhookDto, @CurrentUser() user: User): Promise<IResponse> {
    const result = await this.cryptomusService.testWalletWebhook(testWebhookDto, user);
    return {
      message: 'Wallet webhook test completed successfully',
      details: result,
    };
  }

  @Post('test-webhook/payment')
  @UseGuards(AuthenticationGuard, RolesGuard)
  async testPaymentWebhook(@Body() testWebhookDto: {
    uuid?: string;
    orderId: string;
    urlCallback: string;
    currency: string;
    network: string;
    status?: string;
  }): Promise<IResponse> {
    const result = await this.cryptomusService.testPaymentWebhook(testWebhookDto);
    return {
      message: 'Payment webhook test completed successfully',
      details: result,
    };
  }
}
