import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ThirdPartyApiService } from './third-party-api-key.service';
import { CreateThirdPartyApiDto } from './dto/create-third-party-api-key.dto';
import { UpdateThirdPartyApiDto } from './dto/update-third-party-api-key.dto';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { RolesDecorator } from 'src/shared/guards/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { GetAllThirdPartyApiKeyDto } from './dto/get-all-third-party-api-key.dto';

@Controller('third-party-api-key')
@UseGuards(AuthenticationGuard, RolesGuard)
@RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class ThirdPartyApiController {
  constructor(private readonly thirdPartyApiService: ThirdPartyApiService) {}

  @Post()
  async create(
    @Body() createThirdPartyApiDto: CreateThirdPartyApiDto,
    @CurrentUser() currentUser: User,
  ): Promise<IResponse> {
    const thirdPartyApi = await this.thirdPartyApiService.create(createThirdPartyApiDto, currentUser);
    return {
      message: 'Third party API created successfully',
      details: thirdPartyApi,
    };
  }

  @Get()
  async findAll(@CurrentUser() currentUser: User, @Query() getAllThirdPartyApiKeyDto: GetAllThirdPartyApiKeyDto): Promise<IResponse> {
    const { items, meta } = await this.thirdPartyApiService.findAll(currentUser, getAllThirdPartyApiKeyDto);
    return {
      message: 'Third party APIs fetched successfully',
      details: items,
      extra: meta
    };
  }

  @Get(':id')
  async findOne(
    @Param() paramIdDto: ParamIdDto,
    @CurrentUser() currentUser: User,
  ): Promise<IResponse> {
    const thirdPartyApi = await this.thirdPartyApiService.findOne(paramIdDto, currentUser);
    return {
      message: 'Third party API fetched successfully',
      details: thirdPartyApi,
    };
  }

  @Patch(':id')
  async update(
    @Param() paramIdDto: ParamIdDto,
    @Body() updateThirdPartyApiDto: UpdateThirdPartyApiDto,
    @CurrentUser() currentUser: User,
  ): Promise<IResponse> {
    const thirdPartyApi = await this.thirdPartyApiService.update(paramIdDto, updateThirdPartyApiDto, currentUser);
    return {
      message: 'Third party API updated successfully',
      details: thirdPartyApi,
    };
  }

  @Patch(':id/mark-default')
  async markDefault(
    @Param() paramIdDto: ParamIdDto,
    @CurrentUser() currentUser: User,
  ): Promise<IResponse> {
    const thirdPartyApi = await this.thirdPartyApiService.markDefault(paramIdDto, currentUser);
    return {
      message: 'Third party API marked as default successfully',
      details: thirdPartyApi,
    };
  }

  @Delete(':id')
  async remove(
    @Param() paramIdDto: ParamIdDto,
    @CurrentUser() currentUser: User,
  ): Promise<IResponse> {
    const thirdPartyApi = await this.thirdPartyApiService.remove(paramIdDto, currentUser);
    return {
      message: 'Third party API deleted successfully',
      details: thirdPartyApi,
    };
  }
}
