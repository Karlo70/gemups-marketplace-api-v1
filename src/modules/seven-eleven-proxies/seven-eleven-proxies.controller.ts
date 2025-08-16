import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { SevenElevenProxiesService } from './seven-eleven-proxies.service';
import { CreateSevenElevenProxyDto } from './dto/create-seven-eleven-proxy.dto';
import { UpdateSevenElevenProxyDto } from './dto/update-seven-eleven-proxy.dto';
import { 
  CreateOrderDto,
  GetOrderStatusDto,
  ApplyRestitutionOrderDto,
  ChangeUserPassStatusDto,
  CreateAllocationOrderDto,
  WhitelistDto,
  WhitelistInfoDto,
  StatementDto
} from './dto/create-seven-eleven-proxy.dto';

@Controller('seven-eleven-proxies')
export class SevenElevenProxiesController {
  constructor(private readonly sevenElevenProxiesService: SevenElevenProxiesService) {}

  // ==================== BASIC CRUD OPERATIONS ====================

  @Post()
  create(@Body() createSevenElevenProxyDto: CreateSevenElevenProxyDto) {
    return this.sevenElevenProxiesService.create(createSevenElevenProxyDto);
  }

  @Get()
  findAll() {
    return this.sevenElevenProxiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sevenElevenProxiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSevenElevenProxyDto: UpdateSevenElevenProxyDto) {
    return this.sevenElevenProxiesService.update(id, updateSevenElevenProxyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sevenElevenProxiesService.remove(id);
  }

  // ==================== 711PROXY EAPI ENDPOINTS ====================

  /**
   * GET TOKEN - POST /eapi/token/
   * Authenticate and get access token
   */
  @Post('auth/token')
  async getToken(@Body() authData: { username: string; passwd: string }) {
    return await this.sevenElevenProxiesService.getToken(authData.username, authData.passwd);
  }

  /**
   * GET Enterprise Balance
   * Get account balance information
   */
  @Get('enterprise/balance')
  async getEnterpriseBalance() {
    return await this.sevenElevenProxiesService.getEnterpriseBalance();
  }

  /**
   * Create Order - POST
   * Create a new proxy order
   */
  @Post('order/create')
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return await this.sevenElevenProxiesService.createOrder(createOrderDto);
  }

  /**
   * GET ORDER STATUS
   * Get the status of an existing order
   */
  @Get('order/:orderNo/status')
  async getOrderStatus(@Param('orderNo') orderNo: string) {
    return await this.sevenElevenProxiesService.getOrderStatus(orderNo);
  }

  /**
   * Apply Restitution Order - POST
   * Apply for order restitution/refund
   */
  @Post('order/restitution')
  async applyRestitutionOrder(@Body() restitutionDto: ApplyRestitutionOrderDto) {
    return await this.sevenElevenProxiesService.applyRestitutionOrder(
      restitutionDto.orderNo,
      restitutionDto.reason
    );
  }

  /**
   * Change UserPass Status - POST
   * Change user password status
   */
  @Post('user/pass-status')
  async changeUserPassStatus(@Body() userPassDto: ChangeUserPassStatusDto) {
    return await this.sevenElevenProxiesService.changeUserPassStatus(
      userPassDto.username,
      userPassDto.status
    );
  }

  /**
   * Create Allocation Order - POST
   * Create an order for proxy allocation
   */
  @Post('allocation/create')
  async createAllocationOrder(@Body() allocationDto: CreateAllocationOrderDto) {
    return await this.sevenElevenProxiesService.createAllocationOrder(allocationDto);
  }

  /**
   * Whitelist - POST
   * Add IP to whitelist
   */
  @Post('whitelist/add')
  async addToWhitelist(@Body() whitelistDto: WhitelistDto) {
    return await this.sevenElevenProxiesService.addToWhitelist(
      whitelistDto.ip,
      whitelistDto.description
    );
  }

  /**
   * WhitelistInfo - POST
   * Get whitelist information
   */
  @Post('whitelist/info')
  async getWhitelistInfo(@Body() whitelistInfoDto: WhitelistInfoDto) {
    return await this.sevenElevenProxiesService.getWhitelistInfo(whitelistInfoDto.ip);
  }

  /**
   * Statement - POST
   * Get usage statement
   */
  @Post('statement')
  async getStatement(@Body() statementDto: StatementDto) {
    return await this.sevenElevenProxiesService.getStatement(
      statementDto.startDate,
      statementDto.endDate,
      statementDto.username
    );
  }

  // ==================== CONVENIENCE ENDPOINTS ====================

  /**
   * Get all orders for a user
   */
  @Get('orders')
  async getAllOrders() {
    // This would need to be implemented in the service
    return { message: 'Get all orders endpoint - to be implemented' };
  }

  /**
   * Get proxy usage statistics
   */
  @Get('usage/stats')
  async getUsageStats() {
    // This would need to be implemented in the service
    return { message: 'Get usage stats endpoint - to be implemented' };
  }

  /**
   * Test proxy connection
   */
  @Post('test-connection')
  async testConnection(@Body() testData: { ip: string; port: number; protocol: string }) {
    // This would need to be implemented in the service
    return { message: 'Test connection endpoint - to be implemented', testData };
  }
}
