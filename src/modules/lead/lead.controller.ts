import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LeadService } from './lead.service';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { Request } from 'express';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { RolesDecorator } from 'src/shared/guards/roles.decorator';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { UserRole } from '../users/entities/user.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { GetAllLeadDto } from './dto/get-all-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateRelevanceLeadDto } from './dto/create-relevance-lead.dto';
import { AdminAddLeadDto } from './dto/admin-add-lead.dto';
@Controller('lead')
export class LeadController {
  constructor(private readonly LeadService: LeadService) {}

  @Post()
  async create(
    @Body() createLeadDto: CreateLeadDto,
    @Req() req: Request,
  ): Promise<IResponse> {
    const Lead = await this.LeadService.create(
      createLeadDto,
      req,
    );
    return {
      message: 'Thanks for contacting us',
      details: Lead,
    };
  }

  @Post('admin-add-lead')
  async addLead(
    @Body() adminAddLeadDto: AdminAddLeadDto,
    @Req() req: Request,
  ): Promise<IResponse> {
    const lead = await this.LeadService.addLead(adminAddLeadDto, req);
    return {
      message: 'Lead added successfully',
      details: lead,
    };
  }

  @Get()
  @UseGuards(AuthenticationGuard)
  async findAll(
    @Query() getAllLeadDto: GetAllLeadDto,
  ): Promise<IResponse> {
    const { items, meta } =
      await this.LeadService.findAll(getAllLeadDto);
    return {
      message: 'Leads fetched successfully',
      details: items,
      extra: meta,
    };
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findOne(@Param() id: ParamIdDto): Promise<IResponse> {
    const lead = await this.LeadService.findOne(id);
    return {
      message: 'Lead fetched successfully',
      details: lead,
    };
  }

  @Patch(':id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param() id: ParamIdDto,
    @Body() updateLeadDto: UpdateLeadDto,
  ): Promise<IResponse> {
    const lead = await this.LeadService.update(
      id,
      updateLeadDto,
    );

    return {
      message: 'Lead updated successfully',
      details: lead,
    };
  }

  @Delete(':id')
  async remove(@Param() id: ParamIdDto): Promise<IResponse> {
    const lead = await this.LeadService.remove(id);
    return {
      message: 'Lead deleted successfully',
      details: lead,
    };
  }

  @Post("relevance-lead")
  async createRelevanceLead(
    @Body() createRelevanceLeadDto: CreateRelevanceLeadDto,
    @Req() req: Request,
  ): Promise<IResponse> {
    const lead = await this.LeadService.relevanceAiLead(createRelevanceLeadDto, req);
    return {
      message: 'Lead relevance added successfully',
      details: lead,
    };
  }
}
