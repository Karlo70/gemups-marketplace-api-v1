import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { IResponse } from '../../shared/interfaces/response.interface';
import { ParamIdDto } from '../../shared/dtos/paramId.dto';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { AuthenticationGuard } from '../../shared/guards/authentication.guard';
import { UserRole } from '../users/entities/user.entity';
import { RolesDecorator } from '../../shared/guards/roles.decorator';
import { GetAllPlansDto } from './dto/get-all-plans.dto';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createPlanDto: CreatePlanDto): Promise<IResponse> {
    const plan = await this.plansService.create(createPlanDto);
    return {
      message: 'Plan created successfully',
      details: plan,
    };
  }

  @Patch('archived/:id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async toggleArchive(@Param() paramIdDto: ParamIdDto): Promise<IResponse> {
    const product = await this.plansService.toggleArchive(paramIdDto);
    return {
      message: 'Plan archived successfully',
      details: product,
    };
  }

  @Patch(':id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async update(
    @Param() id: ParamIdDto,
    @Body() updatePlanDto: UpdatePlanDto,
  ): Promise<IResponse> {
    const updatedPlan = await this.plansService.update(id, updatePlanDto);
    return {
      message: 'Plan updated successfully',
      details: updatedPlan,
    };
  }

  @Get()
  async findAll(@Query() getAllPlansDto: GetAllPlansDto): Promise<IResponse> {
    const plans = await this.plansService.findAll(getAllPlansDto);
    return {
      message: 'Plans found',
      details: plans,
    };
  }

  // @Get(':id')
  // @UsePipes(new ValidationPipe({ transform: true }))
  // findOne(id: ParamIdDto) {
  //   return this.plansService.findOne(id);
  // }

  @Delete(':id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async remove(@Param() paramIdDto: ParamIdDto): Promise<IResponse> {
    await this.plansService.remove(paramIdDto);
    return {
      message: 'Plan deleted successfully',
    };
  }
}
