import { Test, TestingModule } from '@nestjs/testing';
import { CronLogController } from './cron-log.controller';
import { CronLogService } from './cron-log.service';

describe('CronLogController', () => {
  let controller: CronLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CronLogController],
      providers: [CronLogService],
    }).compile();

    controller = module.get<CronLogController>(CronLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
