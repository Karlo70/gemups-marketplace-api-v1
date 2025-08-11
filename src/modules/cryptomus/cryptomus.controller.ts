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
import { RolesDecorator } from 'src/shared/guards/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('cryptomus')
export class CryptomusController {
  constructor(private readonly cryptomusService: CryptomusService) {}

  @Post('wallets')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN)
  async createWallet(@Body() createWalletDto: CreateWalletDto) {
    const wallet = await this.cryptomusService.createWallet(createWalletDto);
    return {
      success: true,
      data: wallet,
      message: 'Wallet created successfully',
    };
  }

  @Get('wallets')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN)
  async getWallets() {
    const wallets = await this.cryptomusService.getActiveWallets();
    return {
      success: true,
      data: wallets,
      message: 'Wallets retrieved successfully',
    };
  }

  @Get('wallets/:id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN)
  async getWallet(@Param('id') id: string) {
    const wallet = await this.cryptomusService.getWalletById(id);
    return {
      success: true,
      data: wallet,
      message: 'Wallet retrieved successfully',
    };
  }

  @Post('payments')
  @UseGuards(AuthenticationGuard)
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    const payment = await this.cryptomusService.createPayment(createPaymentDto);
    return {
      success: true,
      data: payment,
      message: 'Payment created successfully',
    };
  }

  @Get('payments/:id')
  @UseGuards(AuthenticationGuard)
  async getPayment(@Param('id') id: string) {
    const payment = await this.cryptomusService.getPaymentById(id);
    return {
      success: true,
      data: payment,
      message: 'Payment retrieved successfully',
    };
  }

  @Get('payments/order/:orderId')
  @UseGuards(AuthenticationGuard)
  async getPaymentByOrderId(@Param('orderId') orderId: string) {
    const payment = await this.cryptomusService.getPaymentByOrderId(orderId);
    return {
      success: true,
      data: payment,
      message: 'Payment retrieved successfully',
    };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() webhookData: CryptomusWebhookDto,
    @Headers('signature') signature: string,
  ) {
    await this.cryptomusService.processWebhook(webhookData, signature);
    return { success: true, message: 'Webhook processed successfully' };
  }
}
