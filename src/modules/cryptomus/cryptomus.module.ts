import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptomusService } from './cryptomus.service';
import { PaymentEntity } from './entities/payment.entity';
import { ConfigModule } from '@nestjs/config';
import { WalletEntity } from './entities/wallet.entity';
import cryptomusConfig from './config/cryptomus.config';
import { CryptomusController } from './cryptomus.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity, WalletEntity]),
    ConfigModule.forFeature(cryptomusConfig),
  ],
  controllers: [CryptomusController],
  providers: [CryptomusService],
  exports: [CryptomusService],
})
export class CryptomusModule {}
