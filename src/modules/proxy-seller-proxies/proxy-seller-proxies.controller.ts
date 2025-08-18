import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ProxySellerUserProxiesService } from './proxy-seller-sub-user-proxies.service';
import { CreateProxySellerProxyDto } from './dto/create-proxy-seller-proxy.dto';
import { UpdateProxySellerProxyDto } from './dto/update-proxy-seller-proxy.dto';
import { GetProxiesDto } from './dto/get-proxies.dto';
import { AuthenticationGuard } from '../../shared/guards/authentication.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';

@Controller('proxy-seller-proxies')
@UseGuards(AuthenticationGuard, RolesGuard)
export class ProxySellerProxiesController {
  constructor(private readonly proxySellerProxiesService: ProxySellerUserProxiesService) { }

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

}
