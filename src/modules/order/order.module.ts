import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { SevenElevenProxiesModule } from '../seven-eleven-proxies/seven-eleven-proxies.module';
import { ProxySellerProxiesModule } from '../proxy-seller-proxies/proxy-seller-proxies.module';
import { CryptomusModule } from '../cryptomus/cryptomus.module';
import { Transaction } from '../transaction/entities/transaction.entity';
import { TransactionModule } from '../transaction/transaction.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Product, User, OrderItem, Transaction]), SevenElevenProxiesModule, ProxySellerProxiesModule, TransactionModule, CryptomusModule, SharedModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule { }
