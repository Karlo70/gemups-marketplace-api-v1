import { Test, TestingModule } from '@nestjs/testing';
import { StripeIntegrationService } from './stripe-integration.service';

describe('StripeIntegrationService', () => {
  let service: StripeIntegrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StripeIntegrationService],
    }).compile();

    service = module.get<StripeIntegrationService>(StripeIntegrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
