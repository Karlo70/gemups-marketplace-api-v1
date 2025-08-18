import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { SettingService } from './setting.service';
import { CreateSettingDto, CreateProxyPricingSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto, UpdateProxyPricingSettingDto } from './dto/update-setting.dto';
import { GetAllSettingsDto, GetAllProxyPricingSettingsDto } from './dto/get-all-settings.dto';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { UserRole } from 'src/modules/users/entities/user.entity';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { ProxyType, SettingType } from './entities/setting.entity';
import { RolesDecorator } from 'src/shared/guards/roles.decorator';

@Controller('setting')
@UseGuards(RolesGuard)
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  // General Settings Endpoints
  @Post()
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() createSettingDto: CreateSettingDto) {
    return this.settingService.create(createSettingDto);
  }

  @Get()
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findAll(@Query() getAllDto: GetAllSettingsDto, @Query() paginationOptions: IPaginationOptions) {
    return this.settingService.findAll(getAllDto, paginationOptions);
  }

  @Get('active')
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getActiveSettings() {
    return this.settingService.getActiveSettings();
  }

  @Get('key/:key')
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findByKey(@Param('key') key: string, @Query('type') type?: SettingType) {
    return this.settingService.findByKey(key, type);
  }

  @Get(':id')
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.settingService.findOne(id);
  }

  @Patch(':id')
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updateSettingDto: UpdateSettingDto) {
    return this.settingService.update(id, updateSettingDto);
  }

  @Delete(':id')
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.settingService.remove(id);
  }

  // Proxy Pricing Settings Endpoints
  @Post('proxy-pricing')
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  createProxyPricing(@Body() createProxyPricingDto: CreateProxyPricingSettingDto) {
    return this.settingService.createProxyPricing(createProxyPricingDto);
  }

  @Get('proxy-pricing/all')
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findAllProxyPricing(@Query() getAllDto: GetAllProxyPricingSettingsDto, @Query() paginationOptions: IPaginationOptions) {
    return this.settingService.findAllProxyPricing(getAllDto, paginationOptions);
  }

  @Get('proxy-pricing/active')
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getActiveProxyPricing() {
    return this.settingService.getActiveProxyPricing();
  }

  @Get('proxy-pricing/type/:proxyType')
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findByProxyType(@Param('proxyType') proxyType: ProxyType) {
    return this.settingService.findByProxyType(proxyType);
  }

  @Get('proxy-pricing/:id')
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findOneProxyPricing(@Param('id') id: string) {
    return this.settingService.findOneProxyPricing(id);
  }

  @Patch('proxy-pricing/:id')
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updateProxyPricing(@Param('id') id: string, @Body() updateProxyPricingDto: UpdateProxyPricingSettingDto) {
    return this.settingService.updateProxyPricing(id, updateProxyPricingDto);
  }

  @Delete('proxy-pricing/:id')
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  removeProxyPricing(@Param('id') id: string) {
    return this.settingService.removeProxyPricing(id);
  }

  // Utility Endpoints
  @Get('proxy-pricing/calculate/:proxyType')
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  calculateProxyPrice(
    @Param('proxyType') proxyType: ProxyType,
    @Query('quantity') quantity: number,
    @Query('flow') flow: number,
    @Query('flowUnit') flowUnit: string = 'GB'
  ) {
    return this.settingService.calculateProxyPrice(proxyType, quantity, flow, flowUnit);
  }
}
