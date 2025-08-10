import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { SharedModule } from 'src/shared/shared.module';
import { Subscription } from '../subscription/entities/subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Subscription]), SharedModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
