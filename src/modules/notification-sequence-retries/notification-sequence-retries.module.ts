import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationSequenceRetriesService } from './notification-sequence-retries.service';
import { NotificationSequenceRetriesController } from './notification-sequence-retries.controller';
import { NotificationSequenceRetry } from './entities/notification-sequence-retry.entity';
import { NotificationSequence } from '../notification-sequence/entities/notification-sequence.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationSequenceRetry, NotificationSequence])
  ],
  controllers: [NotificationSequenceRetriesController],
  providers: [NotificationSequenceRetriesService],
  exports: [NotificationSequenceRetriesService],
})
export class NotificationSequenceRetriesModule {}
