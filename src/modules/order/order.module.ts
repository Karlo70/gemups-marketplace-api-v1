import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { SevenElevenProxiesModule } from '../seven-eleven-proxies/seven-eleven-proxies.module';
import { CryptomusModule } from '../cryptomus/cryptomus.module';
import { Transaction } from '../transaction/entities/transaction.entity';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Product, User, OrderItem, Transaction]), SevenElevenProxiesModule, TransactionModule, CryptomusModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule { }
