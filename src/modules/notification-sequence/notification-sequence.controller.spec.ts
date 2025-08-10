import { Test, TestingModule } from '@nestjs/testing';
import { NotificationSequenceController } from './notification-sequence.controller';
import { NotificationSequenceService } from './notification-sequence.service';

describe('NotificationSequenceController', () => {
  let controller: NotificationSequenceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationSequenceController],
      providers: [NotificationSequenceService],
    }).compile();

    controller = module.get<NotificationSequenceController>(NotificationSequenceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
