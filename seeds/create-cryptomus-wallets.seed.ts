import { DataSource } from 'typeorm';
import { WalletEntity, NetworkType, WalletStatus } from '../src/modules/cryptomus/entities/wallet.entity';

export const createCryptomusWallets = async (dataSource: DataSource) => {
  const walletRepository = dataSource.getRepository(WalletEntity);

  // Check if wallets already exist
  const existingWallets = await walletRepository.count();
  if (existingWallets > 0) {
    console.log('Cryptomus wallets already exist, skipping creation');
    return;
  }

  const wallets = [
    {
      walletName: 'Bitcoin Test Wallet',
      walletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      network: NetworkType.BITCOIN,
      currency: 'BTC',
      currencySymbol: 'BTC',
      status: WalletStatus.ACTIVE,
      isTest: true,
      minAmount: 0.0001,
      maxAmount: 1.0,
      dailyLimit: 10.0,
      merchantId: process.env.CRYPTOMUS_MERCHANT_ID || 'test_merchant',
      apiKey: process.env.CRYPTOMUS_API_KEY || 'test_api_key',
      webhookSecret: process.env.CRYPTOMUS_WEBHOOK_SECRET || 'test_webhook_secret',
      ownerId: undefined, // No specific owner for system wallets
      metadata: {
        description: 'Bitcoin test wallet for development',
        environment: 'test'
      }
    },
    {
      walletName: 'Ethereum Test Wallet',
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      network: NetworkType.ETHEREUM,
      currency: 'ETH',
      currencySymbol: 'ETH',
      status: WalletStatus.ACTIVE,
      isTest: true,
      minAmount: 0.001,
      maxAmount: 100.0,
      dailyLimit: 1000.0,
      merchantId: process.env.CRYPTOMUS_MERCHANT_ID || 'test_merchant',
      apiKey: process.env.CRYPTOMUS_API_KEY || 'test_api_key',
      webhookSecret: process.env.CRYPTOMUS_WEBHOOK_SECRET || 'test_webhook_secret',
      ownerId: undefined, // No specific owner for system wallets
      metadata: {
        description: 'Ethereum test wallet for development',
        environment: 'test'
      }
    },
    {
      walletName: 'BSC Test Wallet',
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      network: NetworkType.BINANCE_SMART_CHAIN,
      currency: 'BNB',
      currencySymbol: 'BNB',
      status: WalletStatus.ACTIVE,
      isTest: true,
      minAmount: 0.001,
      maxAmount: 50.0,
      dailyLimit: 500.0,
      merchantId: process.env.CRYPTOMUS_MERCHANT_ID || 'test_merchant',
      apiKey: process.env.CRYPTOMUS_API_KEY || 'test_api_key',
      webhookSecret: process.env.CRYPTOMUS_WEBHOOK_SECRET || 'test_webhook_secret',
      ownerId: undefined, // No specific owner for system wallets
      metadata: {
        description: 'BSC test wallet for development',
        environment: 'test'
      }
    }
  ];

  try {
    for (const walletData of wallets) {
      const wallet = walletRepository.create(walletData);
      await walletRepository.save(wallet);
      console.log(`Created wallet: ${wallet.walletName} (${wallet.currency})`);
    }
    console.log('Successfully created Cryptomus test wallets');
  } catch (error) {
    console.error('Error creating Cryptomus wallets:', error);
  }
};
