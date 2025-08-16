import { Test, TestingModule } from '@nestjs/testing';
import { ProxySellerProxiesController } from './proxy-seller-proxies.controller';
import { ProxySellerProxiesService } from './proxy-seller-sub-user-proxies.service';

describe('ProxySellerProxiesController', () => {
  let controller: ProxySellerProxiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProxySellerProxiesController],
      providers: [ProxySellerProxiesService],
    }).compile();

    controller = module.get<ProxySellerProxiesController>(ProxySellerProxiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
