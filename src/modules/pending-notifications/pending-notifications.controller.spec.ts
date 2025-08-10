import { Test, TestingModule } from '@nestjs/testing';
import { PendingNotificationsController } from './pending-notifications.controller';
import { PendingNotificationsService } from './pending-notifications.service';

describe('PendingNotificationsController', () => {
  let controller: PendingNotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PendingNotificationsController],
      providers: [PendingNotificationsService],
    }).compile();

    controller = module.get<PendingNotificationsController>(PendingNotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
