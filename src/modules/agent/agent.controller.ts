import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { RolesDecorator } from 'src/shared/guards/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { FormDataRequest } from 'nestjs-form-data';
import { OptionalAuthGuard } from 'src/shared/guards/optionalAuthentication.guard';

@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  @UseGuards(AuthenticationGuard, RolesGuard)
  @UseGuards(OptionalAuthGuard)
  @RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @FormDataRequest()
  async createAgent(
    @Body() createAgentDto: CreateAgentDto,
  ): Promise<IResponse> {
    const agent = await this.agentService.create(createAgentDto);
    return {
      message: 'Agent created successfully',
      details: agent,
    };
  }

  @Get()
  async getAgents(): Promise<IResponse> {
    const agents = await this.agentService.getAgents();
    return {
      message: 'Agents fetched successfully',
      details: agents,
    };
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getAgent(@Param() paramIdDto: ParamIdDto): Promise<IResponse> {
    const agents = await this.agentService.findOne(paramIdDto);
    return {
      message: 'Agent fetched successfully',
      details: agents,
    };
  }

  @Patch(':id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async updateAgent(
    @Param() paramIdDto: ParamIdDto,
    @Body() updateAgentDto: CreateAgentDto,
  ): Promise<IResponse> {
    const agents = await this.agentService.update(paramIdDto, updateAgentDto);
    return {
      message: 'Agent updated successfully',
      details: agents,
    };
  }

  @Delete(':id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async deleteAgent(@Param() paramIdDto: ParamIdDto): Promise<IResponse> {
    const agents = await this.agentService.delete(paramIdDto);
    return {
      message: 'Agent deleted successfully',
      details: agents,
    };
  }
}
