import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';
import { SharedModule } from 'src/shared/shared.module';
import { MediaController } from './media.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Media]), SharedModule],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService, TypeOrmModule],
})
export class MediaModule {}
