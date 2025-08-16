import { registerAs } from '@nestjs/config';

export default registerAs('711proxy', () => ({
  baseUrl: process.env.SEVEN_ELEVEN_PROXIES_BASE_URL || 'https://server.711proxy.com',
  username: process.env.SEVEN_ELEVEN_PROXIES_USERNAME,
  password: process.env.SEVEN_ELEVEN_PROXIES_PASSWORD,
  timeout: process.env.SEVEN_ELEVEN_PROXIES_TIMEOUT ? parseInt(process.env.SEVEN_ELEVEN_PROXIES_TIMEOUT, 10) : 30000,
  retryAttempts: process.env.SEVEN_ELEVEN_PROXIES_RETRY_ATTEMPTS ? parseInt(process.env.SEVEN_ELEVEN_PROXIES_RETRY_ATTEMPTS, 10) : 3,
  retryDelay: process.env.SEVEN_ELEVEN_PROXIES_RETRY_DELAY ? parseInt(process.env.SEVEN_ELEVEN_PROXIES_RETRY_DELAY, 10) : 1000,
}));
