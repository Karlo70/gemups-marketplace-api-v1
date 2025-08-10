import { Test, TestingModule } from '@nestjs/testing';
import { NotificationSequenceService } from './notification-sequence.service';

describe('NotificationSequenceService', () => {
  let service: NotificationSequenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationSequenceService],
    }).compile();

    service = module.get<NotificationSequenceService>(NotificationSequenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
