import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  Req,
  Query,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly configService: ConfigService,
    private readonly webhooksService: WebhooksService,
  ) {}

  @Get('facebook')
  async handleWebhookVerification(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query,
  ) {
    const verifyToken = this.configService.get('FACEBOOK_WEBHOOK_VERIFY_TOKEN');

    if (
      query['hub.mode'] === 'subscribe' &&
      query['hub.verify_token'] === verifyToken
    ) {
      return res.status(200).send(query['hub.challenge']);
    } else {
      return res.status(400).send('Verification failed.');
    }
  }

}
