import { Test, TestingModule } from '@nestjs/testing';
import { StripeIntegrationController } from './stripe-integration.controller';
import { StripeIntegrationService } from './stripe-integration.service';

describe('StripeIntegrationController', () => {
  let controller: StripeIntegrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeIntegrationController],
      providers: [StripeIntegrationService],
    }).compile();

    controller = module.get<StripeIntegrationController>(StripeIntegrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
