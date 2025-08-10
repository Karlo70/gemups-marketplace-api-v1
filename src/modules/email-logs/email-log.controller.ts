import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmailLogService } from './email-log.service';
import { CreateEmailsLogDto } from './dto/create-email-log.dto';
import { UpdateEmailsLogDto } from './dto/update-email-log.dto';
import { GetAllEmailsLogDto } from './dto/get-all-email-log.dto';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { RolesDecorator } from 'src/shared/guards/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('email-logs')
@UseGuards(AuthenticationGuard, RolesGuard)
@RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class EmailLogController {
  constructor(private readonly emailLogService: EmailLogService) {}

  @Post()
  async create(@Body() createEmailsLogDto: CreateEmailsLogDto): Promise<IResponse> {
    const emailsLog = await this.emailLogService.create(createEmailsLogDto);
    return {
      message: 'Email log created successfully',
      details: emailsLog,
    };
  }

  @Get()
  async findAll(@Query() getAllEmailsLogDto: GetAllEmailsLogDto): Promise<IResponse> {
    const { items, meta } = await this.emailLogService.findAll(getAllEmailsLogDto);
    return {
      message: 'Email logs fetched successfully',
      details: items,
      extra: meta,
    };
  }

  @Get(':id')
  async findOne(@Param() id: ParamIdDto): Promise<IResponse> {
    const emailsLog = await this.emailLogService.findOne(id);
    return {
      message: 'Email log fetched successfully',
      details: emailsLog,
    };
  }

  @Patch(':id')
  async update(
    @Param() id: ParamIdDto,
    @Body() updateEmailsLogDto: UpdateEmailsLogDto,
  ): Promise<IResponse> {
    const emailsLog = await this.emailLogService.update(id, updateEmailsLogDto);
    return {
      message: 'Email log updated successfully',
      details: emailsLog,
    };
  }

  @Delete(':id')
  async remove(@Param() id: ParamIdDto): Promise<IResponse> {
    const result = await this.emailLogService.remove(id);
    return {
      message: 'Email log deleted successfully',
      details: result,
    };
  }
}
