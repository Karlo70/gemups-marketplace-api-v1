import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { GetAllInvoiceDto } from './dto/get-all-invoices-schema.dto';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { User } from '../users/entities/user.entity';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { RolesGuard } from 'src/shared/guards/roles.guard';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @UseGuards(AuthenticationGuard, RolesGuard)
  async findAll(
    @CurrentUser() currentUser: User,
    @Query() getAllInvoicesDto: GetAllInvoiceDto,
  ): Promise<IResponse> {
    const invoices = await this.invoicesService.findAll(
      currentUser,
      getAllInvoicesDto,
    );

    return {
      message: 'Invoices fetched successfully',
      details: invoices.items,
      extra: invoices.meta,
    };
  }
}
