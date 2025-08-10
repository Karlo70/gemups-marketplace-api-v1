import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ModelsService } from './models.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { GetAllModelDto } from './dto/get-all-model.dto';

@Controller('models')
@UseGuards(AuthenticationGuard)
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Post()
  async create(@Body() createModelDto: CreateModelDto): Promise<IResponse> {
    const model = await this.modelsService.create(createModelDto);
    return {
      message: 'Model created successfully',
      details: model,
    };
  }

  @Get()
  async findAll(@Query() getAllModelDto: GetAllModelDto): Promise<IResponse> {
    const models = await this.modelsService.findAll(getAllModelDto);
    return {
      message: 'Models fetched successfully',
      details: models,
    };
  }
  
  @Get("providers")
  async findAllProviders(@Query() getAllModelDto: GetAllModelDto): Promise<IResponse> {
    const providers = await this.modelsService.findAllProviders(getAllModelDto);
    return {
      message: 'Providers fetched successfully',
      details: providers,
    };
  }

  @Get(':id')
  async findOne(@Param() id: ParamIdDto): Promise<IResponse> {
    const model = await this.modelsService.findOne(id);
    return {
      message: 'Model fetched successfully',
      details: model,
    };
  }

  @Patch(':id')
  async update(
    @Param() id: ParamIdDto,
    @Body() updateModelDto: UpdateModelDto,
  ): Promise<IResponse> {
    const model = await this.modelsService.update(id, updateModelDto);
    return {
      message: 'Model updated successfully',
      details: model,
    };
  }

  @Delete(':id')
  async remove(@Param() id: ParamIdDto): Promise<IResponse> {
    const model = await this.modelsService.remove(id);
    return {
      message: 'Model deleted successfully',
      details: model,
    };
  }
}
