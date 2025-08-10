import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationSequence } from './entities/notification-sequence.entity';
import { NotificationSequenceService } from './notification-sequence.service';
import { NotificationSequenceController } from './notification-sequence.controller';
import { Template } from '../templates/entities/template.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationSequence, Template])],
  controllers: [NotificationSequenceController],
  providers: [NotificationSequenceService],
  exports: [NotificationSequenceService],
})
export class NotificationSequenceModule {}
