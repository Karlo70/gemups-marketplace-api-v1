import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AuthenticationGuard } from '../../shared/guards/authentication.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { RolesDecorator } from '../../shared/guards/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { GetAllOrder } from './dto/get-all-order.dto';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';

@Controller('orders')
@UseGuards(AuthenticationGuard, RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(AuthenticationGuard,RolesGuard)
  @RolesDecorator(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: User) :Promise<IResponse>{
    const order =  await this.orderService.create(createOrderDto,user);
    return {
      message: "Order created successfully",
      details: order ?? {},
    }
  }

  @Get()
  @UseGuards(AuthenticationGuard,RolesGuard)
  async findAll(@Query() query: GetAllOrder, @CurrentUser() user: User) :Promise<IResponse> {
    const {items,meta} = await this.orderService.findAll(query, user);
    return {
      message: "Orders fetched successfully",
      details: items,
      extra: meta,
    }
  }

  @Get('my-orders')
  @UseGuards(AuthenticationGuard,RolesGuard)
  @RolesDecorator(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findMyOrders(@CurrentUser() user: User) :Promise<IResponse> {
    const orders = await this.orderService.findByUser(user);
    return {
      message: "Orders fetched successfully",
      details: orders,
    }
  }

  @Get('stats')
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStats() :Promise<IResponse> {
    const stats = await this.orderService.getOrderStats();
    return {
      message: "Stats fetched successfully",
      details: stats,
    }
  }

  @Get(':id')
  async findOne(@Param() paramIdDto: ParamIdDto, @CurrentUser() user: User) :Promise<IResponse> {
    const order = await this.orderService.findOne(paramIdDto);
    return {
      message: "Order fetched successfully",
      details: order,
    }
  }

  @Patch(':id')
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param() paramIdDto: ParamIdDto,
    @Body() updateOrderDto: UpdateOrderDto,
  ) :Promise<IResponse> {
    const order = await this.orderService.update(paramIdDto, updateOrderDto);
    return {
      message: "Order updated successfully",
      details: order,
    }
  }

  @Patch(':id/cancel')
  @RolesDecorator(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async cancelOrder(
    @Param() paramIdDto: ParamIdDto,
    @Body('reason') reason: string,
    @CurrentUser() user: User,
  ) :Promise<IResponse> {
    const order = await this.orderService.cancelOrder(paramIdDto, reason);
    return {
      message: "Order cancelled successfully",
      details: order,
    }
  }

  @Patch(':id/payment-status')
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updatePaymentStatus(
    @Param() paramIdDto: ParamIdDto,
    @Body('payment_status') paymentStatus: string,
    @Body('transaction_id') transactionId?: string,
  ) :Promise<IResponse> {
    const order = await this.orderService.updatePaymentStatus(paramIdDto, paymentStatus as any, transactionId);
    return {
      message: "Payment status updated successfully",
      details: order,
    }
  }

  @Delete(':id')
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async remove(@Param() paramIdDto: ParamIdDto) :Promise<IResponse> {
    await this.orderService.remove(paramIdDto);
    return {
      message: "Order deleted successfully",
    }
  }
}
