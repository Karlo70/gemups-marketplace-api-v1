import { Test, TestingModule } from '@nestjs/testing';
import { ThirdPartyApiController } from './third-party-api-key.controller';
import { ThirdPartyApiService } from './third-party-api-key.service';

describe('ThirdPartyApiController', () => {
  let controller: ThirdPartyApiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThirdPartyApiController],
      providers: [ThirdPartyApiService],
    }).compile();

    controller = module.get<ThirdPartyApiController>(ThirdPartyApiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
