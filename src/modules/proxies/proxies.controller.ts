import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProxiesService } from './proxies.service';
import { CreateProxyDto } from './dto/create-proxy.dto';
import { FetchProxiesDto } from './dto/fetch-proxies.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UsageStatementDto } from './dto/usage-statement.dto';
import { AuthenticationGuard } from '../../shared/guards/authentication.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { RolesDecorator } from 'src/shared/guards/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('proxies')
export class ProxiesController {
  constructor(private readonly proxiesService: ProxiesService) {}

  // ==================== PROXY MANAGEMENT ====================

  @Post()
  @UseGuards(AuthenticationGuard)
  async createProxy(
    @Body() createProxyDto: CreateProxyDto,
    @CurrentUser() currentUser: User
  ) {
    const proxy = await this.proxiesService.createProxy(createProxyDto, currentUser.id);
    return {
      success: true,
      data: proxy,
      message: 'Proxy created successfully',
    };
  }

  @Get('my')
  @UseGuards(AuthenticationGuard)
  async getMyProxies(@CurrentUser() currentUser: User) {
    const proxies = await this.proxiesService.getUserProxies(currentUser.id);
    return {
      success: true,
      data: proxies,
      message: 'User proxies retrieved successfully',
    };
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard)
  async getProxy(@Param('id') id: string) {
    const proxy = await this.proxiesService.getProxyById(id);
    return {
      success: true,
      data: proxy,
      message: 'Proxy retrieved successfully',
    };
  }

  @Get()
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAllProxies() {
    const proxies = await this.proxiesService.getAllProxies();
    return {
      success: true,
      data: proxies,
      message: 'All proxies retrieved successfully',
    };
  }

  @Put(':id/status')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateProxyStatus(
    @Param('id') id: string,
    @Body('status') status: string
  ) {
    const proxy = await this.proxiesService.updateProxyStatus(id, status as any);
    return {
      success: true,
      data: proxy,
      message: 'Proxy status updated successfully',
    };
  }

  @Delete(':id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deleteProxy(@Param('id') id: string) {
    await this.proxiesService.deleteProxy(id);
    return {
      success: true,
      message: 'Proxy deleted successfully',
    };
  }

  // ==================== 711 PROXY API INTEGRATION ====================

  @Get('fetch/711proxy')
  @UseGuards(AuthenticationGuard)
  async fetchProxies(@Query() fetchDto: FetchProxiesDto) {
    const proxies = await this.proxiesService.fetchProxies(fetchDto);
    return {
      success: true,
      data: proxies,
      message: 'Proxies fetched from 711 Proxy successfully',
    };
  }

  @Post('order/711proxy')
  @UseGuards(AuthenticationGuard)
  async createProxyOrder(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() currentUser: User
  ) {
    const order = await this.proxiesService.createProxyOrder(createOrderDto, currentUser.id);
    return {
      success: true,
      data: order,
      message: 'Proxy order created successfully',
    };
  }

  @Get('order/711proxy/:orderNo')
  @UseGuards(AuthenticationGuard)
  async getOrderStatus(@Param('orderNo') orderNo: string) {
    const orderStatus = await this.proxiesService.getOrderStatus(orderNo);
    return {
      success: true,
      data: orderStatus,
      message: 'Order status retrieved successfully',
    };
  }

  @Get('balance/711proxy')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getBalance() {
    const balance = await this.proxiesService.getBalance();
    return {
      success: true,
      data: balance,
      message: 'Balance retrieved successfully',
    };
  }

  @Post('usage/711proxy')
  @UseGuards(AuthenticationGuard)
  async getUsageStatement(
    @Body() usageDto: UsageStatementDto,
    @CurrentUser() currentUser: User
  ) {
    const usage = await this.proxiesService.getUsageStatement(usageDto, currentUser.id);
    return {
      success: true,
      data: usage,
      message: 'Usage statement retrieved successfully',
    };
  }

  // ==================== ADMIN-ONLY ENDPOINTS ====================

  @Post('admin/create')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createProxyAsAdmin(
    @Body() createProxyDto: CreateProxyDto,
    @Body('userId') userId?: string
  ) {
    const proxy = await this.proxiesService.createProxy(createProxyDto, userId);
    return {
      success: true,
      data: proxy,
      message: 'Proxy created by admin successfully',
    };
  }

  @Post('admin/order/711proxy')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createProxyOrderAsAdmin(
    @Body() createOrderDto: CreateOrderDto,
    @Body('userId') userId?: string
  ) {
    const order = await this.proxiesService.createProxyOrder(createOrderDto, userId);
    return {
      success: true,
      data: order,
      message: 'Proxy order created by admin successfully',
    };
  }

  @Get('admin/usage/711proxy')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getUsageStatementAsAdmin(
    @Query() usageDto: UsageStatementDto,
    @Query('userId') userId?: string
  ) {
    const usage = await this.proxiesService.getUsageStatement(usageDto, userId);
    return {
      success: true,
      data: usage,
      message: 'Usage statement retrieved by admin successfully',
    };
  }
}
