import { registerAs } from '@nestjs/config';

export default registerAs('cryptomus', () => ({
  apiKey: process.env.CRYPTOMUS_API_KEY,
  webhookSecret: process.env.CRYPTOMUS_WEBHOOK_SECRET,
  baseUrl: process.env.CRYPTOMUS_BASE_URL || 'https://api.cryptomus.com/v1',
  defaultMerchantId: process.env.CRYPTOMUS_MERCHANT_ID,
  isTestMode: process.env.CRYPTOMUS_TEST_MODE === 'true',
}));
