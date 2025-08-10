import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThirdPartyApiService } from './third-party-api-key.service';
import { ThirdPartyApiController } from './third-party-api-key.controller';
import { ThirdPartyApi } from './entities/third-party-api-key.entity';
import { User } from '../users/entities/user.entity';
import { EncryptionService } from 'src/shared/services/encryption.service';

@Module({
  imports: [TypeOrmModule.forFeature([ThirdPartyApi, User])],
  controllers: [ThirdPartyApiController],
  providers: [ThirdPartyApiService, EncryptionService],
})
export class ThirdPartyApiModule {}
