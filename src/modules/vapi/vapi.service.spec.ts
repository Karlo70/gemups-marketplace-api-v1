import { Test, TestingModule } from '@nestjs/testing';
import { VapiService } from './vapi.service';

describe('VapiService', () => {
  let service: VapiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VapiService],
    }).compile();

    service = module.get<VapiService>(VapiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
