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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthenticationGuard } from '../../shared/guards/authentication.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { RolesDecorator } from '../../shared/guards/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { GetAllProductsDto } from './dto/get-all-products.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { FormDataRequest } from 'nestjs-form-data';

@Controller('products')
@UseGuards(AuthenticationGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @FormDataRequest()
  async create(@Body() createProductDto: CreateProductDto, @CurrentUser() user: User): Promise<IResponse> {
    const product = await this.productsService.create(createProductDto, user);
    return {
      message: 'Product created successfully',
      details: product,
    };
  }

  @Get()
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CUSTOMER, UserRole.ANONYMOUS)
  async findAll(@Query() getAllDto: GetAllProductsDto, @CurrentUser() user: User): Promise<IResponse> {
    const { items, meta } = await this.productsService.findAll(getAllDto, user);
    return {
      message: 'Products fetched successfully',
      details: items,
      extra: meta,
    };
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CUSTOMER, UserRole.ANONYMOUS)
  async findOne(@Param() paramIdDto: ParamIdDto, @CurrentUser() user: User): Promise<IResponse> {
    const product = await this.productsService.findOne(paramIdDto, user);
    return {
      message: 'Product fetched successfully',
      details: product,
    };
  }

  @Patch(':id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @FormDataRequest()
  async update(
    @Param() paramIdDto: ParamIdDto,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: User,
  ): Promise<IResponse> {
    const product = await this.productsService.update(paramIdDto, updateProductDto, user);
    return {
      message: 'Product updated successfully',
      details: product,
    };
  }

  @Delete(':id')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async remove(@Param() paramIdDto: ParamIdDto, @CurrentUser() user: User): Promise<IResponse> {
    await this.productsService.remove(paramIdDto, user);
    return {
      message: 'Product deleted successfully',
    };
  }
}
