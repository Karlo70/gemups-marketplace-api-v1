import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { VapiService } from './vapi.service';
import { VapiCallDto } from './dto/vapi.call.dto';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { Request } from 'express';
import { CallFrom } from './enums/call-and-enums';
import { GetAllCallDto } from './dto/get-all-call.dto';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
@Controller('vapi')
export class VapiController {
  constructor(private readonly vapiService: VapiService) { }

  @Post('call')
  async call(
    @Body() vapiCallDto: VapiCallDto,
    @Req() req: Request,
  ): Promise<IResponse> {
    const vapiResponse = await this.vapiService.call({
      body: { ...vapiCallDto, call_from: CallFrom.AGENT_PAGE },
      req: req,
      inside_system: false,
    });
    return {
      message: 'Vapi call successful',
      details: vapiResponse,
    };
  }

  @Get('calls')
  @UseGuards(AuthenticationGuard)
  async getAllCalls(@Query() getAllCallDto: GetAllCallDto, @CurrentUser() currentUser: User): Promise<IResponse> {
    const { items, meta } = await this.vapiService.getAllCalls(getAllCallDto, currentUser);
    return {
      message: 'Calls fetched successfully',
      details: items,
      extra: meta,
    };
  }
}
