# Cryptomus Static Wallet Integration

This module provides integration with Cryptomus for static wallet payments. It allows you to accept cryptocurrency payments through pre-configured wallet addresses.

## Features

- **Static Wallet Management**: Create and manage multiple cryptocurrency wallets
- **Payment Processing**: Generate payment requests and track payment status
- **Webhook Handling**: Automatic payment status updates via webhooks
- **Multi-Currency Support**: Support for Bitcoin, Ethereum, BSC, Polygon, Solana, Tron, Litecoin, and Dogecoin
- **Security**: HMAC signature verification for webhooks
- **Test Mode**: Support for testnet payments

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Cryptomus API Configuration
CRYPTOMUS_API_KEY=your_payment_api_key_here
CRYPTOMUS_WEBHOOK_SECRET=your_webhook_secret_here
CRYPTOMUS_MERCHANT_ID=your_merchant_id_here
CRYPTOMUS_TEST_MODE=true  # Set to false for production
```

### 2. Database Migration

Run the database migration to create the required tables:

```bash
npm run migration:run
```

### 3. Create Static Wallets

First, create static wallets for the cryptocurrencies you want to accept:

```typescript
// Example: Create Bitcoin wallet
const bitcoinWallet = {
  walletName: "Bitcoin Main Wallet",
  walletAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  network: "bitcoin",
  currency: "BTC",
  currencySymbol: "BTC",
  merchantId: "your_merchant_id",
  apiKey: "your_api_key",
  webhookSecret: "your_webhook_secret"
};

// Example: Create Ethereum wallet
const ethereumWallet = {
  walletName: "Ethereum Main Wallet",
  walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  network: "ethereum",
  currency: "ETH",
  currencySymbol: "ETH",
  merchantId: "your_merchant_id",
  apiKey: "your_api_key",
  webhookSecret: "your_webhook_secret"
};
```

## API Endpoints

### Wallets

- `POST /cryptomus/wallets` - Create a new wallet (Admin only)
- `GET /cryptomus/wallets` - Get all active wallets (Admin only)
- `GET /cryptomus/wallets/:id` - Get wallet by ID (Admin only)

### Payments

- `POST /cryptomus/payments` - Create a new payment
- `GET /cryptomus/payments/:id` - Get payment by ID
- `GET /cryptomus/payments/order/:orderId` - Get payment by order ID

### Webhooks

- `POST /cryptomus/webhook` - Handle Cryptomus webhook notifications

## Usage Examples

### Creating a Payment

```typescript
const paymentData = {
  orderId: "order_123",
  amount: 0.001,
  currency: "BTC",
  paymentType: "crypto",
  description: "Payment for services",
  userId: "user_456",
  callbackUrl: "https://yourdomain.com/webhook",
  returnUrl: "https://yourdomain.com/success",
  preferredNetwork: "bitcoin"
};

const payment = await cryptomusService.createPayment(paymentData);
```

### Processing Webhooks

The service automatically processes webhooks from Cryptomus and updates payment statuses. Make sure to:

1. Configure your webhook URL in Cryptomus dashboard
2. Set the `CRYPTOMUS_WEBHOOK_SECRET` environment variable
3. The webhook endpoint will automatically verify signatures and update payment statuses

## Security Features

- **HMAC Signature Verification**: All webhooks are verified using HMAC-SHA512
- **API Key Management**: Secure storage of API keys in database
- **Input Validation**: Comprehensive DTO validation for all endpoints
- **Role-Based Access**: Admin-only access for wallet management

## Supported Networks

- Bitcoin (BTC)
- Ethereum (ETH)
- Binance Smart Chain (BSC)
- Polygon (MATIC)
- Solana (SOL)
- Tron (TRX)
- Litecoin (LTC)
- Dogecoin (DOGE)

## Payment Flow

1. **Create Payment**: User requests payment creation
2. **Wallet Selection**: System selects appropriate wallet based on currency/network
3. **Cryptomus Integration**: Payment request sent to Cryptomus API
4. **Payment Details**: User receives wallet address and payment instructions
5. **Webhook Updates**: Payment status automatically updated via webhooks
6. **Balance Update**: Wallet balance updated when payment is confirmed

## Error Handling

The service includes comprehensive error handling for:
- Invalid API credentials
- Network errors
- Invalid webhook signatures
- Missing wallets
- Payment creation failures

## Testing

For testing purposes:
1. Set `CRYPTOMUS_TEST_MODE=true`
2. Use testnet wallet addresses
3. Use Cryptomus test API keys
4. Monitor logs for detailed error information

## Monitoring

The service logs important events including:
- Payment creation attempts
- Webhook processing
- API errors
- Wallet balance updates

## Support

For issues or questions:
1. Check the logs for detailed error messages
2. Verify your Cryptomus API credentials
3. Ensure webhook URLs are accessible
4. Verify database connectivity and table structure
