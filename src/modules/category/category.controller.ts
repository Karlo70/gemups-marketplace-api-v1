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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthenticationGuard } from '../../shared/guards/authentication.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { RolesDecorator } from '../../shared/guards/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { GetAllCategoriesDto } from './dto/get-all-categories.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { FormDataRequest } from 'nestjs-form-data';

@Controller('categories')
@UseGuards(AuthenticationGuard, RolesGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  @Post()
  @UseGuards(AuthenticationGuard, RolesGuard)
  @FormDataRequest()
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() createCategoryDto: CreateCategoryDto, @CurrentUser() user: User): Promise<IResponse> {
    const category = await this.categoryService.create(createCategoryDto, user);
    return {
      message: 'Category created successfully',
      details: category,
    };
  }

  @Get()
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CUSTOMER)
  async findAll(@Query() getAllDto: GetAllCategoriesDto): Promise<IResponse> {
    const { items, meta } = await this.categoryService.findAll(getAllDto);
    return {
      message: 'Categories fetched successfully',
      details: items,
      extra: meta,
    };
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CUSTOMER)
  async findOne(@Param() paramIdDto: ParamIdDto): Promise<IResponse> {
    const category = await this.categoryService.findOne(paramIdDto);
    return {
      message: 'Category fetched successfully',
      details: category,
    };
  }

  @Patch(':id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @FormDataRequest()
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param() paramIdDto: ParamIdDto,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<IResponse> {
    const category = await this.categoryService.update(paramIdDto, updateCategoryDto);
    return {
      message: 'Category updated successfully',
      details: category,
    };
  }

  @Delete(':id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async remove(@Param() paramIdDto: ParamIdDto, @CurrentUser() user: User): Promise<IResponse> {
    await this.categoryService.remove(paramIdDto, user);
    return {
      message: 'Category deleted successfully',
    };
  }
}
