import { Test, TestingModule } from '@nestjs/testing';
import { SevenElevenProxiesService } from './seven-eleven-proxies.service';

describe('SevenElevenProxiesService', () => {
  let service: SevenElevenProxiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SevenElevenProxiesService],
    }).compile();

    service = module.get<SevenElevenProxiesService>(SevenElevenProxiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
