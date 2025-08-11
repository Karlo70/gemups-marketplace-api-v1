# 711 Proxy Integration Module

This module provides comprehensive integration with the 711 Proxy API, allowing users to create, manage, and monitor proxy services. It supports both the proxy-extraction layer (read-only) and the Enterprise EAPI layer (read/write with authentication).

## Features

- **Proxy Management**: Create and manage proxy configurations
- **711 Proxy API Integration**: Full integration with all 711 Proxy endpoints
- **User-Based Access**: Users can create and manage their own proxies
- **Admin Controls**: Admins can manage all proxies and create proxies for users
- **Usage Tracking**: Monitor proxy usage and performance metrics
- **Order Management**: Handle 711 Proxy orders and track their status
- **Multi-Protocol Support**: HTTP, HTTPS, and SOCKS5 protocols
- **Regional Targeting**: Support for country-specific proxy selection

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# 711 Proxy API Configuration
711PROXY_USERNAME=your_email@example.com
711PROXY_PASSWORD=your_account_password
711PROXY_BASE_URL=https://api.711proxy.com
711PROXY_TEST_MODE=true  # Set to false for production
711PROXY_DEFAULT_ZONE=your_default_zone
711PROXY_DEFAULT_PTYPE=1
```

### 2. Database Migration

Run the database migration to create the required tables:

```bash
npm run migration:run
```

## API Endpoints

### User Endpoints

- `POST /proxies` - Create a new proxy
- `GET /proxies/my` - Get user's proxies
- `GET /proxies/:id` - Get proxy by ID
- `GET /proxies/fetch/711proxy` - Fetch proxies from 711 Proxy API
- `POST /proxies/order/711proxy` - Create a proxy order
- `GET /proxies/order/711proxy/:orderNo` - Get order status
- `POST /proxies/usage/711proxy` - Get usage statement

### Admin Endpoints

- `GET /proxies` - Get all proxies (Admin only)
- `PUT /proxies/:id/status` - Update proxy status (Admin only)
- `DELETE /proxies/:id` - Delete proxy (Admin only)
- `GET /proxies/balance/711proxy` - Get account balance (Admin only)
- `POST /proxies/admin/create` - Create proxy for any user (Admin only)
- `POST /proxies/admin/order/711proxy` - Create order for any user (Admin only)
- `GET /proxies/admin/usage/711proxy` - Get usage for any user (Admin only)

## Usage Examples

### Creating a Proxy

```typescript
const proxyData = {
  proxyName: "US Residential Proxy",
  proxyType: "traffic_gb",
  protocol: "http",
  zone: "us_pool",
  ptype: 1,
  flow: 10, // 10 GB traffic
  region: "US",
  isTest: false
};

const proxy = await proxiesService.createProxy(proxyData, userId);
```

### Fetching Proxies from 711 Proxy

```typescript
const fetchData = {
  zone: "de_pool",
  ptype: 1,
  count: 50,
  region: "DE",
  proto: "socks5",
  stype: "json"
};

const proxies = await proxiesService.fetchProxies(fetchData);
```

### Creating a Proxy Order

```typescript
const orderData = {
  flow: 5, // 5 GB traffic
  expire: "2025-12-31T23:59:59Z",
  host: "my-custom-proxy"
};

const order = await proxiesService.createProxyOrder(orderData, userId);
```

## 711 Proxy API Integration

### Supported Endpoints

1. **GET /fetch** - Proxy extraction (no auth required)
   - Fetch ready-to-use proxy IP:port lists
   - Supports filtering by region, protocol, and format

2. **POST /eapi/token** - Authentication
   - Exchange credentials for JWT token
   - Required for all EAPI endpoints

3. **POST /eapi/order** - Create orders
   - Create credential-based proxy endpoints
   - Supports traffic quotas and expiration

4. **GET /eapi/order** - Check order status
   - Monitor order progress and details

5. **GET /eapi/balance** - Account balance
   - Check remaining traffic/IP balance

6. **POST /eapi/statement** - Usage statements
   - Download billing and traffic logs

### Authentication Flow

The service automatically handles:
- JWT token acquisition
- Token refresh when expired
- Secure credential storage
- Rate limiting compliance

## Database Schema

### Tables

1. **proxies** - Main proxy configurations
2. **proxy_orders** - 711 Proxy orders
3. **proxy_usage** - Usage tracking and metrics

### Key Fields

- **Proxy Types**: traffic_gb, ip_count, unlimited
- **Protocols**: http, https, socks5
- **Status**: active, inactive, expired, suspended
- **Regions**: ISO country codes (US, DE, FR, etc.)

## Security Features

- **Role-Based Access Control**: Different permissions for users and admins
- **User Isolation**: Users can only access their own proxies
- **Admin Override**: Admins can manage all proxies
- **Secure Credentials**: 711 Proxy credentials stored securely
- **Input Validation**: Comprehensive DTO validation

## Monitoring & Analytics

### Usage Metrics

- Traffic consumption
- IP rotation counts
- Request success/failure rates
- Average response times
- Regional performance data

### Admin Dashboard

- Overall system usage
- User proxy statistics
- 711 Proxy account balance
- Performance analytics

## Best Practices

### For Users

1. **Traffic Management**: Monitor your traffic usage
2. **Protocol Selection**: Choose appropriate protocol for your use case
3. **Regional Targeting**: Use region-specific proxies when needed
4. **Order Management**: Track order status and expiration

### For Admins

1. **Balance Monitoring**: Regularly check 711 Proxy account balance
2. **Usage Analytics**: Monitor system-wide proxy usage
3. **User Support**: Help users with proxy configuration
4. **Performance Optimization**: Analyze and optimize proxy performance

## Error Handling

The service includes comprehensive error handling for:
- Authentication failures
- API rate limits
- Network errors
- Invalid configurations
- Insufficient balance
- Order failures

## Testing

For testing purposes:
1. Set `711PROXY_TEST_MODE=true`
2. Use test credentials
3. Monitor logs for detailed error information
4. Test with small traffic quotas first

## Support

For issues or questions:
1. Check the logs for detailed error messages
2. Verify your 711 Proxy API credentials
3. Ensure proper environment variable configuration
4. Check database connectivity and table structure

## Integration with Other Modules

This module integrates with:
- **User Management**: User authentication and role-based access
- **Cryptomus**: Payment processing for proxy services
- **Notifications**: Alert users about proxy status changes
- **Webhooks**: Handle 711 Proxy webhook notifications

## Rate Limits & Best Practices

- **/fetch**: Up to 900 IPs per call, billed per extraction
- **EAPI calls**: Cache Bearer token and reuse until expiration
- **Sticky sessions**: Use single IP for persistent connections
- **Rapid rotation**: Pull multiple IPs for high-frequency requests
