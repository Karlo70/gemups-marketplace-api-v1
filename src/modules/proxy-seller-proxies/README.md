# Proxy Seller Proxies Module

This module provides integration with the Proxy Seller API for managing residential proxies, subaccounts, and subusers.

## Features

- **Subaccount/Subuser Management**: Create, read, update, and delete subaccounts
- **Proxy Management**: Create, manage, and monitor proxies via the Proxy Seller API
- **Usage Statistics**: Track proxy usage, traffic, and performance metrics
- **Balance Monitoring**: Check account balance and limits
- **Local Storage**: Store proxy information locally for easy access and management

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Proxy Seller API Configuration
PROXY_SELLER_API_KEY=your_api_key_here
PROXY_SELLER_BASE_URL=https://proxy-seller.com/api
PROXY_SELLER_TEST_MODE=false
PROXY_SELLER_DEFAULT_ZONE=us
PROXY_SELLER_DEFAULT_PROTOCOL=http
```

## API Endpoints

### Local Proxy Management

- `POST /proxy-seller-proxies` - Create a new proxy locally
- `GET /proxy-seller-proxies` - Get all proxies with filtering and pagination
- `GET /proxy-seller-proxies/:id` - Get a specific proxy
- `PATCH /proxy-seller-proxies/:id` - Update a proxy
- `DELETE /proxy-seller-proxies/:id` - Delete a proxy

### Subaccount Management

- `POST /proxy-seller-proxies/subaccounts` - Create a new subaccount
- `GET /proxy-seller-proxies/subaccounts` - List all subaccounts
- `GET /proxy-seller-proxies/subaccounts/:id` - Get a specific subaccount
- `PATCH /proxy-seller-proxies/subaccounts/:id` - Update a subaccount
- `DELETE /proxy-seller-proxies/subaccounts/:id` - Delete a subaccount

### Proxy API Management

- `POST /proxy-seller-proxies/api/proxies` - Create proxies via Proxy Seller API
- `GET /proxy-seller-proxies/api/proxies` - Get proxies from Proxy Seller API
- `GET /proxy-seller-proxies/api/proxies/:id` - Get a specific proxy from API
- `DELETE /proxy-seller-proxies/api/proxies/:id` - Delete a proxy via API

### Usage and Statistics

- `GET /proxy-seller-proxies/usage/:username` - Get usage statistics for a user
- `GET /proxy-seller-proxies/balance` - Get account balance

## Usage Examples

### Creating a Subaccount

```typescript
const subaccount = await proxySellerService.createSubaccount({
  username: 'user123',
  password: 'secure_password',
  email: 'user@example.com',
  note: 'Test subaccount'
});
```

### Creating Proxies via API

```typescript
const proxies = await proxySellerService.createProxyViaApi({
  zone: 'us',
  protocol: 'http',
  count: 5,
  duration: 30, // 30 days
  subaccountId: 'subaccount_id',
  note: 'US proxies for testing'
});
```

### Getting Usage Statistics

```typescript
const usage = await proxySellerService.getUsageStatistics(
  'username',
  '2024-01-01',
  '2024-01-31'
);
```

### Getting Account Balance

```typescript
const balance = await proxySellerService.getBalance();
console.log(`Traffic Balance: ${balance.traffic_balance} GB`);
console.log(`IP Balance: ${balance.ip_balance}`);
```

## Data Models

### ProxySellerProxy Entity

The main entity for storing proxy information locally:

```typescript
{
  id: string;
  proxyName: string;
  ip: string;
  port: number;
  username: string;
  password: string;
  protocol: ProxySellerProxyProtocol;
  zone: string;
  subaccountId?: string;
  subaccountUsername?: string;
  note?: string;
  status: ProxySellerProxyStatus;
  expiresAt?: Date;
  isTest: boolean;
  metadata: Record<string, any>;
  ownerId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Enums

- **ProxySellerProxyStatus**: `ACTIVE`, `EXPIRED`, `SUSPENDED`, `INACTIVE`
- **ProxySellerProxyProtocol**: `HTTP`, `HTTPS`, `SOCKS5`

## Error Handling

The service includes comprehensive error handling for:

- API authentication failures
- Invalid API responses
- Network errors
- Database operation failures
- Validation errors

All errors are logged and appropriate HTTP status codes are returned.

## Security

- **Authentication Required**: All endpoints require valid authentication
- **Role-Based Access**: Admin-only endpoints for sensitive operations
- **User Isolation**: Regular users can only access their own proxies
- **API Key Protection**: Proxy Seller API key is stored securely in environment variables

## Testing

The module includes comprehensive test coverage:

- Unit tests for all service methods
- Controller tests for endpoint validation
- Entity tests for data validation
- Integration tests for API calls

## Dependencies

- `@nestjs/common` - Core NestJS functionality
- `@nestjs/typeorm` - Database ORM integration
- `@nestjs/axios` - HTTP client for API calls
- `@nestjs/config` - Configuration management
- `class-validator` - DTO validation
- `class-transformer` - Data transformation

## Migration

When you first run the application, TypeORM will automatically create the necessary database tables due to `synchronize: true` in the configuration.

For production, consider creating proper migrations:

```bash
npm run typeorm:generate-migration -- -n CreateProxySellerProxies
npm run typeorm:run-migration
```

## Monitoring and Logging

The service includes comprehensive logging for:

- API calls and responses
- Database operations
- Error conditions
- Performance metrics

Use the logger to monitor the health and performance of your Proxy Seller integration.

## Rate Limiting

Be aware of Proxy Seller API rate limits and implement appropriate throttling if needed. The service includes error handling for rate limit responses.

## Support

For issues related to:

- **Module functionality**: Check the logs and error messages
- **Proxy Seller API**: Refer to their [official documentation](https://docs.proxy-seller.com/)
- **Database issues**: Check TypeORM logs and database connectivity
- **Authentication**: Verify API key and permissions
