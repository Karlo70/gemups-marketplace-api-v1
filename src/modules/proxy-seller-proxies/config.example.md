# Proxy Seller Configuration Example

Add these environment variables to your `.env` file:

```bash
# Proxy Seller API Configuration
# Get your API key from: https://proxy-seller.com/panel/api

# Required: Your Proxy Seller API key
PROXY_SELLER_API_KEY=your_api_key_here

# Optional: Base URL for the Proxy Seller API (default: https://proxy-seller.com/api)
PROXY_SELLER_BASE_URL=https://proxy-seller.com/api

# Optional: Enable test mode (default: false)
PROXY_SELLER_TEST_MODE=false

# Optional: Default zone for proxies (default: us)
PROXY_SELLER_DEFAULT_ZONE=us

# Optional: Default protocol for proxies (default: http)
PROXY_SELLER_DEFAULT_PROTOCOL=http
```

## Getting Your API Key

1. Log in to your Proxy Seller account
2. Go to the API section in your dashboard
3. Generate a new API key
4. Copy the key and add it to your environment variables

## Testing the Integration

Once configured, you can test the integration by:

1. Creating a test subaccount
2. Creating a test proxy
3. Checking your account balance
4. Viewing usage statistics

## Security Notes

- Never commit your API key to version control
- Use environment variables for all sensitive configuration
- Consider using a secrets management service in production
- Regularly rotate your API keys
