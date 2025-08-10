import { Test, TestingModule } from '@nestjs/testing';
import { CronLogService } from './cron-log.service';

describe('CronLogService', () => {
  let service: CronLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CronLogService],
    }).compile();

    service = module.get<CronLogService>(CronLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
