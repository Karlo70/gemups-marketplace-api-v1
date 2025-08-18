# Proxies Module

This module provides comprehensive proxy management functionality including proxy generation, pricing calculation, and integration with various proxy providers.

## Features

- **Proxy Generation**: Generate proxies from different providers (Seven Eleven, Proxy Seller, Custom)
- **Dynamic Pricing**: Automatic pricing calculation based on proxy settings and flow amounts
- **Provider Integration**: Seamless integration with Seven Eleven Proxy service
- **Form Generation**: Dynamic form fields based on selected provider
- **User Management**: Associate proxies with users and track usage

## API Endpoints

### 1. Generate Proxy
**POST** `/proxies/generate`

Generate a new proxy using the specified provider and configuration.

**Request Body:**
```json
{
  "type": "residential",
  "provider": "seven_eleven",
  "flow": "1 GB",
  "expire": "2024-12-31",
  "host": "example.com",
  "notes": "Optional notes"
}
```

**Response:**
```json
{
  "message": "Proxy generated successfully",
  "details": {
    "id": "uuid",
    "type": "residential",
    "provider": "seven_eleven",
    "status": "pending",
    "price": 10.50,
    "flow_amount": 1,
    "flow_unit": "gb",
    "provider_order_id": "order123",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Get Provider Form
**GET** `/proxies/provider/:provider/form`

Get the form fields required for a specific proxy provider.

**Example:** `/proxies/provider/seven_eleven/form`

**Response:**
```json
{
  "message": "Provider form fetched successfully",
  "details": {
    "provider": "seven_eleven",
    "description": "Seven Eleven Proxy Service - High-quality residential and datacenter proxies",
    "fields": [
      {
        "name": "type",
        "type": "select",
        "required": true,
        "label": "Proxy Type",
        "options": [
          {"value": "residential", "label": "Residential"},
          {"value": "datacenter", "label": "Datacenter"}
        ]
      },
      {
        "name": "flow",
        "type": "string",
        "required": true,
        "label": "Flow Amount",
        "placeholder": "e.g., 1 GB, 500 MB, 2 TB"
      }
    ]
  }
}
```

### 3. Get Available Providers
**GET** `/proxies/providers`

Get a list of all available proxy providers.

**Response:**
```json
{
  "message": "Available providers fetched successfully",
  "details": [
    {
      "value": "seven_eleven",
      "label": "Seven Eleven",
      "description": "High-quality residential and datacenter proxies",
      "features": ["Residential IPs", "Datacenter IPs", "Mobile IPs", "Rotating IPs"]
    }
  ]
}
```

### 4. Get Proxy Types
**GET** `/proxies/types`

Get a list of all available proxy types.

**Response:**
```json
{
  "message": "Available proxy types fetched successfully",
  "details": [
    {
      "value": "residential",
      "label": "Residential",
      "description": "Real residential IP addresses from actual internet service providers",
      "features": ["High Anonymity", "Real User Behavior", "Geographic Diversity"]
    }
  ]
}
```

### 5. Standard CRUD Operations

- **POST** `/proxies` - Create a new proxy
- **GET** `/proxies` - Get all proxies (with pagination and filtering)
- **GET** `/proxies/:id` - Get a specific proxy
- **PATCH** `/proxies/:id` - Update a proxy
- **DELETE** `/proxies/:id` - Delete a proxy
- **PATCH** `/proxies/:id/status` - Update proxy status

## Proxy Types

- **Residential**: Real residential IP addresses from actual internet service providers
- **Datacenter**: Fast datacenter IP addresses for high-speed operations
- **Mobile**: Mobile IP addresses from cellular networks
- **Rotating**: IP addresses that rotate automatically

## Providers

### Seven Eleven
- **Required Fields**: `type`, `flow`
- **Optional Fields**: `expire`, `host`, `notes`
- **Features**: High-quality residential and datacenter proxies

### Proxy Seller
- **Required Fields**: `type`, `flow`
- **Optional Fields**: `zone`, `ptype`, `region`, `notes`
- **Features**: Premium proxy solutions with global coverage

### Custom
- **Required Fields**: `type`, `ip_address`, `port`
- **Optional Fields**: `username`, `password`, `country`, `city`, `notes`
- **Features**: Full control over proxy configuration

## Pricing Calculation

The system automatically calculates pricing based on:

1. **Flow Amount**: Price per GB/MB/TB from settings
2. **Setup Fee**: One-time setup cost
3. **Maintenance Fee**: Ongoing maintenance cost
4. **Discounts**: Volume-based discounts when applicable

**Formula:**
```
Total Price = (Flow Amount × Price per Flow) + Setup Fee + Maintenance Fee - Discount
```

## Flow Format

Flow amounts must be specified in the format: `{amount} {unit}`

**Examples:**
- `1 GB` - 1 gigabyte
- `500 MB` - 500 megabytes
- `2 TB` - 2 terabytes

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- **400 Bad Request**: Invalid input data or business logic errors
- **401 Unauthorized**: Missing or invalid authentication
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side errors

## Example Usage

### Frontend Integration

```javascript
// Get available providers
const providers = await fetch('/proxies/providers', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Get form for specific provider
const form = await fetch('/proxies/provider/seven_eleven/form', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Generate a proxy
const proxy = await fetch('/proxies/generate', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'residential',
    provider: 'seven_eleven',
    flow: '1 GB',
    expire: '2024-12-31'
  })
});
```

## Dependencies

- **SevenElevenProxiesModule**: For Seven Eleven proxy integration
- **SettingModule**: For pricing and configuration management
- **TypeORM**: For database operations
- **Authentication**: JWT-based user authentication

## Database Schema

The module uses the `proxy` table with the following key fields:

- `id`: Unique identifier (UUID)
- `type`: Proxy type (residential, datacenter, mobile, rotating)
- `provider`: Provider name (seven_eleven, proxy_seller, custom)
- `status`: Current status (pending, active, expired, suspended, failed)
- `price`: Calculated price
- `flow_amount`: Data flow amount
- `flow_unit`: Flow unit (GB, MB, TB)
- `user_id`: Associated user
- `metadata`: Additional provider-specific data
