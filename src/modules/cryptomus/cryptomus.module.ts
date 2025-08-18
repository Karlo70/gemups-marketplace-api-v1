import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptomusService } from './cryptomus.service';
import { PaymentEntity } from './entities/payment.entity';
import { ConfigModule } from '@nestjs/config';
import { WalletEntity } from './entities/wallet.entity';
import cryptomusConfig from './config/cryptomus.config';
import { CryptomusController } from './cryptomus.controller';
import { CryptomusApiService } from './helper/cryptomus-api-service';
import { TransactionModule } from '../transaction/transaction.module';
import { Transaction } from '../transaction/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity, WalletEntity, Transaction]),
    ConfigModule.forFeature(cryptomusConfig),
    TransactionModule,
  ],
  controllers: [CryptomusController],
  providers: [CryptomusService, CryptomusApiService],
  exports: [CryptomusService, CryptomusApiService],
})
export class CryptomusModule { }
