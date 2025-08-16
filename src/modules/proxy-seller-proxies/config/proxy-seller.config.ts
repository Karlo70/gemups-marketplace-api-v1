import { registerAs } from '@nestjs/config';

export default registerAs('proxySeller', () => ({
  apiKey: process.env.PROXY_SELLER_API_KEY,
  baseUrl: process.env.PROXY_SELLER_BASE_URL || 'https://proxy-seller.com/personal/api/v1',
  testMode: process.env.PROXY_SELLER_TEST_MODE === 'true',
  defaultZone: process.env.PROXY_SELLER_DEFAULT_ZONE || 'us',
  defaultProtocol: process.env.PROXY_SELLER_DEFAULT_PROTOCOL || 'http',
}));
