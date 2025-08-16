import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ProxySellerProxiesService } from './proxy-seller-sub-user-proxies.service';
import { CreateProxySellerProxyDto } from './dto/create-proxy-seller-proxy.dto';
import { UpdateProxySellerProxyDto } from './dto/update-proxy-seller-proxy.dto';
import { CreateSubAccountDto } from './dto/create-subaccount.dto';
import { UpdateSubAccountDto } from './dto/update-subaccount.dto';
import { CreateProxyDto } from './dto/create-proxy.dto';
import { GetProxiesDto } from './dto/get-proxies.dto';
import { AuthenticationGuard } from '../../shared/guards/authentication.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';

@Controller('proxy-seller-proxies')
@UseGuards(AuthenticationGuard, RolesGuard)
export class ProxySellerProxiesController {
  constructor(private readonly proxySellerProxiesService: ProxySellerProxiesService) { }

  // ==================== LOCAL PROXY MANAGEMENT ====================

  @Post()
  async create(@Body() createProxySellerProxyDto: CreateProxySellerProxyDto, @Request() req: any): Promise<IResponse> {
    const proxy = await this.proxySellerProxiesService.create({
      ...createProxySellerProxyDto,
      ownerId: req.user?.id
    });

    return {
      message: 'Proxy created successfully',
      details: proxy,
    };
  }

  @Get()
  async findAll(@Query() query: GetProxiesDto, @Request() req: any):Promise<IResponse> {
    // If user is not admin, only show their own proxies
    if (req.user?.role !== 'admin') {
      query.ownerId = req.user?.id;
    }
    const {items,meta} = await this.proxySellerProxiesService.findAll(query);

    return {
      message: 'Proxies fetched successfully',
      details: items,
      extra : meta,
    };
  }

  @Get(':id')
  async findOne(@Param() paramIdDto: ParamIdDto, @Request() req: any):Promise<IResponse> {
    const proxy = await this.proxySellerProxiesService.findOne(paramIdDto);

    return {
      message: 'Proxy fetched successfully',
      details: proxy,
    };
  }

  @Patch(':id')
  update(@Param() paramIdDto: ParamIdDto, @Body() updateProxySellerProxyDto: UpdateProxySellerProxyDto) {
    return this.proxySellerProxiesService.update(paramIdDto, updateProxySellerProxyDto);
  } 

  @Delete(':id')
  remove(@Param() paramIdDto: ParamIdDto) {
    return this.proxySellerProxiesService.remove(paramIdDto);
  }

  // ==================== PROXY SELLER API INTEGRATION ====================

  // Subaccount/Subuser Management
  @Post('subaccounts')
  createSubAccount(@Body() createSubAccountDto: CreateSubAccountDto) {
    return this.proxySellerProxiesService.createSubAccount(createSubAccountDto);
  }

  @Get('subaccounts')
  getSubAccounts(
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 20
  ) {
    return this.proxySellerProxiesService.getSubAccounts(page, perPage);
  }

  @Get('subaccounts/:id')
  getSubAccountById(@Param() paramIdDto: ParamIdDto) {
    return this.proxySellerProxiesService.getSubAccountById(paramIdDto);
  }

  @Patch('subaccounts/:id')
  updateSubAccount(
    @Param() paramIdDto: ParamIdDto,
    @Body() updateSubAccountDto: UpdateSubAccountDto
  ) {
    return this.proxySellerProxiesService.updateSubAccount(paramIdDto, updateSubAccountDto);
  }

  @Delete('subaccounts/:id')
  deleteSubAccount(@Param() paramIdDto: ParamIdDto) {
    return this.proxySellerProxiesService.deleteSubAccount(paramIdDto);
  }

  // Proxy Management via API
  @Post('api/proxies')
  createProxyViaApi(@Body() createProxyDto: CreateProxyDto) {
    return this.proxySellerProxiesService.createProxyViaApi(createProxyDto);
  }

  @Get('api/proxies')
  getProxiesViaApi(
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 20
  ) {
    return this.proxySellerProxiesService.getProxiesViaApi(page, perPage);
  }

  @Get('api/proxies/:id')
  getProxyByIdViaApi(@Param() paramIdDto: ParamIdDto) {
    return this.proxySellerProxiesService.getProxyByIdViaApi(paramIdDto);
  }

  @Delete('api/proxies/:id')
  deleteProxyViaApi(@Param() paramIdDto: ParamIdDto) {
    return this.proxySellerProxiesService.deleteProxyViaApi(paramIdDto);
  }

  // Usage and Statistics
  @Get('usage/:username')
  getUsageStatistics(
    @Param('username') username: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate?: string
  ) {
    return this.proxySellerProxiesService.getUsageStatistics(username, startDate, endDate);
  }

  @Get('balance')
  getBalance() {
    return this.proxySellerProxiesService.getBalance();
  }
}
