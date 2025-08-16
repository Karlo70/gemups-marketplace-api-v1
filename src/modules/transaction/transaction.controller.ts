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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { GetAllTransactionDto } from './dto/get-all-transaction.dto';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { RolesDecorator } from 'src/shared/guards/roles.decorator';
import { UserRole } from 'src/modules/users/entities/user.entity';
import { IResponse } from 'src/shared/interfaces/response.interface';

@Controller('transactions')
@UseGuards(AuthenticationGuard, RolesGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() createTransactionDto: CreateTransactionDto): Promise<IResponse> {
    const transaction = await this.transactionService.create(createTransactionDto);
    return {
      message: 'Transaction created successfully',
      details: transaction,
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: GetAllTransactionDto): Promise<IResponse> {
    const { items, meta } = await this.transactionService.findAll(query);
    return {
      message: 'Transactions fetched successfully',
      details: items,
      extra: meta
    }
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStats(@Query('user_id') userId?: string): Promise<IResponse> {
    const stats = await this.transactionService.getTransactionStats(userId);
    return {
      message: 'Transaction stats fetched successfully',
      details: stats
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<IResponse> {
    const transaction = await this.transactionService.findOne(id);
    return {
      message: 'Transaction fetched successfully',
      details: transaction
    }
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto): Promise<IResponse> {
    const transaction = await this.transactionService.update(id, updateTransactionDto);
    return {
      message: 'Transaction updated successfully',
      details: transaction
    }
  } 

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RolesDecorator(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async remove(@Param('id') id: string): Promise<IResponse> {
    await this.transactionService.remove(id);
    return {
      message: 'Transaction deleted successfully',
    }
  }
}
