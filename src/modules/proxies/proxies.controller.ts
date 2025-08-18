import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ProxiesService } from './proxies.service';
import { CreateProxyDto } from './dto/create-proxy.dto';
import { UpdateProxyDto } from './dto/update-proxy.dto';
import { GenerateProxyDto } from './dto/generate-proxy.dto';
import { GetAllProxiesDto } from './dto/get-all-proxies.dto';
import { AuthenticationGuard } from '../../shared/guards/authentication.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { ProxyType } from './entities/proxy.entity';
import { ProxiesProvider } from '../products/entities/product.entity';

@Controller('proxies')
@UseGuards(AuthenticationGuard)
export class ProxiesController {
  constructor(private readonly proxiesService: ProxiesService) { }

  @Post()
  @UseGuards(AuthenticationGuard)
  async create(@Body() createProxyDto: CreateProxyDto, @CurrentUser() user: User): Promise<IResponse> {
    const proxy = await this.proxiesService.create(createProxyDto, user);
    return {
      message: 'Proxy created successfully',
      details: proxy,
    };
  }

  @Post('generate')
  @UseGuards(AuthenticationGuard)
  async generateProxy(@Body() generateProxyDto: GenerateProxyDto, @CurrentUser() user: User): Promise<IResponse> {
    const proxy = await this.proxiesService.generateProxy(generateProxyDto, user);
    return {
      message: 'Proxy generated successfully',
      details: proxy,
    };
  }

  @Get()
  @UseGuards(AuthenticationGuard)
  async findAll(@Query() getAllDto: GetAllProxiesDto, @Query() paginationOptions: IPaginationOptions, @CurrentUser() user: User): Promise<IResponse> {
    const proxies = await this.proxiesService.findAll(getAllDto, paginationOptions, user);
    return {
      message: 'Proxies fetched successfully',
      details: proxies,
    };
  }

  @Get("my-proxies")
  @UseGuards(AuthenticationGuard)
  async myProxies(@Query() getAllDto: GetAllProxiesDto, @CurrentUser() user: User): Promise<IResponse> {
    const { items, meta } = await this.proxiesService.myProxies(getAllDto, user);
    return {
      message: 'My proxies fetched successfully',
      details: items,
      extra: meta,
    };
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard)
  async findOne(@Param() paramIdDto: ParamIdDto, @CurrentUser() user: User): Promise<IResponse> {
    const proxy = await this.proxiesService.findOne(paramIdDto, user);
    return {
      message: 'Proxy fetched successfully',
      details: proxy,
    };
  }

  @Patch(':id')
  @UseGuards(AuthenticationGuard)
  async update(@Param() paramIdDto: ParamIdDto, @Body() updateProxyDto: UpdateProxyDto, @CurrentUser() user: User): Promise<IResponse> {
    const proxy = await this.proxiesService.update(paramIdDto, updateProxyDto, user);
    return {
      message: 'Proxy updated successfully',
      details: proxy,
    };
  }

  @Delete(':id')
  @UseGuards(AuthenticationGuard)
  async remove(@Param() paramIdDto: ParamIdDto, @CurrentUser() user: User): Promise<IResponse> {
    await this.proxiesService.remove(paramIdDto, user);
    return {
      message: 'Proxy deleted successfully',
    };
  }

  @Patch(':id/status')
  @UseGuards(AuthenticationGuard)
  async updateStatus(@Param() paramIdDto: ParamIdDto, @Body('status') status: string, @CurrentUser() user: User): Promise<IResponse> {
    const proxy = await this.proxiesService.updateProxyStatus(paramIdDto, status as any, user);
    return {
      message: 'Proxy status updated successfully',
      details: proxy,
    };
  }

  @Get('provider/:provider/form')
  @UseGuards(AuthenticationGuard)
  async getProviderForm(@Param('provider') provider: string): Promise<IResponse> {
    const form = await this.proxiesService.getProviderForm(provider);
    return {
      message: 'Provider form fetched successfully',
      details: form,
    };
  }

  @Get('providers')
  @UseGuards(AuthenticationGuard)
  async getProviders(): Promise<IResponse> {
    const providers = [
      {
        value: ProxiesProvider.SEVEN_ELEVEN_PROXIES,
        label: '711 Proxies',
        description: 'High-quality residential and datacenter proxies',
        features: ['Residential IPs', 'Datacenter IPs', 'Mobile IPs', 'Rotating IPs'],
      },
      // {
      //   value: 'proxy_seller',
      //   label: 'Proxy Seller',
      //   description: 'Premium proxy solutions with global coverage',
      //   features: ['Global Coverage', 'High Speed', 'Multiple Protocols', '24/7 Support'],
      // },
    ];

    return {
      message: 'Available providers fetched successfully',
      details: providers,
    };
  }

  @Get('types')
  @UseGuards(AuthenticationGuard)
  async getProxyTypes(): Promise<IResponse> {
    const types = [
      {
        value: ProxyType.RESIDENTIAL,
        label: 'Residential',
        description: 'Real residential IP addresses from actual internet service providers',
        features: ['High Anonymity', 'Real User Behavior', 'Geographic Diversity'],
      },
      {
        value: ProxyType.DATACENTER,
        label: 'Datacenter',
        description: 'Fast datacenter IP addresses for high-speed operations',
        features: ['High Speed', 'Low Latency', 'Cost Effective'],
      },
      {
        value: ProxyType.MOBILE,
        label: 'Mobile',
        description: 'Mobile IP addresses from cellular networks',
        features: ['Mobile Network', 'Geographic Mobility', 'High Anonymity'],
      },
      {
        value: ProxyType.ROTATING,
        label: 'Rotating',
        description: 'IP addresses that rotate automatically',
        features: ['Auto Rotation', 'Session Management', 'Load Balancing'],
      },
    ];

    return {
      message: 'Available proxy types fetched successfully',
      details: types,
    };
  }
}
