import {
  Controller,
  Get,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  Headers,
  Res,
  Inject,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Request, Response } from 'express';
import { CreateSubscriptionStripeLinkDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AuthenticationGuard } from '../../shared/guards/authentication.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { IResponse } from '../../shared/interfaces/response.interface';
import { CreateCustomerPortalDto } from './dto/create-customer-portal.dto';
import { SubscriptionWebhookService } from './subscription-webhook.service';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { RolesDecorator } from '../../shared/guards/roles.decorator';
import { GetAllSubscriptionsDto } from './dto/get-all-subscription.dto';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly subscriptionWebhookService: SubscriptionWebhookService,

    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
    private readonly configService: ConfigService,
  ) {}

  @Post('stripe-link')
  @UseGuards(AuthenticationGuard)
  async createStripeLink(
    @CurrentUser() user: User,
    @Body() createSubscriptionStripeLinkDto: CreateSubscriptionStripeLinkDto,
  ) {
    const stripeCheckoutSession: any =
      await this.subscriptionService.createStripeLink(
        user,
        createSubscriptionStripeLinkDto,
      );

    return stripeCheckoutSession;
  }

  @Post('customer-portal')
  @UseGuards(AuthenticationGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createCustomerPortal(
    @Body() createCustomerPortalDto: CreateCustomerPortalDto,
    @CurrentUser() currentUser: User,
  ): Promise<IResponse> {
    const customerPortalUrl =
      await this.subscriptionService.createCustomerPortal(
        currentUser,
        createCustomerPortalDto,
      );
    return {
      message: 'Redirecting to customer portal',
      details: {
        customerPortalUrl: customerPortalUrl,
      },
    };
  }

  // @Patch(':id/cancel')
  // @UseGuards(AuthenticationGuard)
  // async cancelSubscription(@Param('id') subscriptionId: string, @CurrentUser() user: User) {
  //   await this.subscriptionService.cancelSubscription(subscriptionId, user);
  //   return {
  //     message: 'Subscription has been cancelled, you will not be charged any more',
  //   };
  // }

  @Get()
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN)
  async findAll(
    @Query() getAllSubscriptionsDto: GetAllSubscriptionsDto,
    @CurrentUser() user: User,
  ): Promise<IResponse> {
    const subscriptions = await this.subscriptionService.findAll(
      getAllSubscriptionsDto,
      user,
    );
    return {
      message: 'Subscriptions found successfully',
      details: subscriptions,
    };
  }

  @Delete(':id')
  async cancelSubscription(
    @Param('id') subscriptionId: string,
    @CurrentUser() user: User,
  ) {
    await this.subscriptionService.cancelSubscription(subscriptionId, user);
    return {
      message:
        'Subscription has been cancelled, you will not be charged any more',
    };
  }

  @Post('webhook')
  async subscriptionWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.body,
        signature,
        this.configService.get('STRIPE_SUBSCRIPTION_WEBHOOK_SECRET') as string,
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      throw new BadRequestException('Invalid webhook signature');
    }
    const eventDataObject = event?.data?.object;

    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.subscriptionWebhookService.subscriptionInvoicePaid(
            eventDataObject,
          );
          break;
  
        case 'customer.subscription.deleted':
          await this.subscriptionWebhookService.subscriptionDeleted(
            eventDataObject,
          );
          break;
  
        case 'invoice.payment_failed':
          await this.subscriptionWebhookService.handleFailedPayment(
            eventDataObject,
          );
          break;
  
        case 'customer.subscription.updated':
          await this.subscriptionWebhookService.updateSubscription(
            event.data.object,
          );
          break;
  
        default:
          break;
      }
  
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
    return {
      message: 'webhook processed successfully',
    };
  }
}
