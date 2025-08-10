import { Test, TestingModule } from '@nestjs/testing';
import { ThirdPartyApiService } from './third-party-api-key.service';

describe('ThirdPartyApiService', () => {
  let service: ThirdPartyApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThirdPartyApiService],
    }).compile();

    service = module.get<ThirdPartyApiService>(ThirdPartyApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
