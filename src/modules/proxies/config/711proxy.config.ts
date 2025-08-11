import { registerAs } from '@nestjs/config';

export default registerAs('711proxy', () => ({
  username: process.env.PROXY_USERNAME,
  password: process.env.PROXY_PASSWORD,
  baseUrl: process.env.PROXY_BASE_URL || 'https://api.711proxy.com',
  testMode: process.env.PROXY_TEST_MODE === 'true',
  defaultZone: process.env.PROXY_DEFAULT_ZONE || 'default_zone',
  defaultPtype: parseInt(process.env.PROXY_DEFAULT_PTYPE || '1'),
}));
