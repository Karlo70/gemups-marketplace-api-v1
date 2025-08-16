import { Test, TestingModule } from '@nestjs/testing';
import { SevenElevenProxiesController } from './seven-eleven-proxies.controller';
import { SevenElevenProxiesService } from './seven-eleven-proxies.service';

describe('SevenElevenProxiesController', () => {
  let controller: SevenElevenProxiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SevenElevenProxiesController],
      providers: [SevenElevenProxiesService],
    }).compile();

    controller = module.get<SevenElevenProxiesController>(SevenElevenProxiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
