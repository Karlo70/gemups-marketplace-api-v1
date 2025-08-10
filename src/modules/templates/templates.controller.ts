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
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { GetAllTemplatesDto } from './dto/get-all-templates.dto';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { RolesDecorator } from 'src/shared/guards/roles.decorator';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { User, UserRole } from '../users/entities/user.entity';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { FormDataRequest } from 'nestjs-form-data';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @FormDataRequest()
  async create(
    @Body() createTemplateDto: CreateTemplateDto,
    @CurrentUser() currentUser: User,
  ): Promise<IResponse> {
    const template = await this.templatesService.create(createTemplateDto);

    return {
      message: 'Template created successfully',
      details: template,
    };
  }

  @Get()
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findAll(
    @Query() getAllDto: GetAllTemplatesDto,
    @CurrentUser() currentUser: User,
  ): Promise<IResponse> {
    const { items, meta } = await this.templatesService.findAll(getAllDto);
    
    return {
      message: 'Templates fetched successfully',
      details: items,
      extra: meta,
    };
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findOne(
    @Param() paramDto: ParamIdDto,
    @CurrentUser() currentUser: User,
  ): Promise<IResponse> {
    const template = await this.templatesService.findOne(paramDto);
    
    return {
      message: 'Template fetched successfully',
      details: template,
    };
  }

  @Patch(':id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @FormDataRequest()
  async update(
    @Param() paramDto: ParamIdDto,
    @Body() updateTemplateDto: UpdateTemplateDto,
    @CurrentUser() currentUser: User,
  ): Promise<IResponse> {
    const template = await this.templatesService.update(
      paramDto,
      updateTemplateDto,
    );
    
    return {
      message: 'Template updated successfully',
      details: template,
    };
  }

  @Delete(':id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async remove(
    @Param() paramDto: ParamIdDto,
    @CurrentUser() currentUser: User,
  ): Promise<IResponse> {
    await this.templatesService.remove(paramDto);
    
    return {
      message: 'Template deleted successfully',
    };
  }
}
