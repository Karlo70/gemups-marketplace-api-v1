import { Test, TestingModule } from '@nestjs/testing';
import { PendingNotificationsService } from './pending-notifications.service';

describe('PendingNotificationsService', () => {
  let service: PendingNotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PendingNotificationsService],
    }).compile();

    service = module.get<PendingNotificationsService>(PendingNotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
