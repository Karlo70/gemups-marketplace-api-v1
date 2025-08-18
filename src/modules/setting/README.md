# Setting Module

This module provides a comprehensive system for managing application settings and proxy pricing configurations. It allows administrators to configure various system parameters and manage proxy pricing based on different types and flow requirements.

## Features

- **General Settings Management**: Store and manage various application settings
- **Proxy Pricing Configuration**: Configure pricing for different proxy types (residential, datacenter, mobile, rotating)
- **Flow-based Pricing**: Support for different flow units (MB, GB, TB) with automatic conversion
- **Quantity Discounts**: Apply discounts based on quantity thresholds
- **Setup and Maintenance Fees**: Configure additional fees for proxy services
- **Role-based Access Control**: Only admins and super admins can manage settings

## Entities

### Setting
General purpose settings entity for storing application configurations.

```typescript
export enum SettingType {
    PROXY_PRICING = "proxy_pricing",
    SYSTEM_CONFIG = "system_config",
    FEATURE_FLAG = "feature_flag",
}
```

### ProxyPricingSetting
Specialized entity for managing proxy pricing configurations.

```typescript
export enum ProxyType {
    RESIDENTIAL = "residential",
    DATACENTER = "datacenter",
    MOBILE = "mobile",
    ROTATING = "rotating",
}

export enum FlowUnit {
    GB = "gb",
    MB = "mb",
    TB = "tb",
}
```

## API Endpoints

### General Settings

- `POST /setting` - Create a new setting
- `GET /setting` - Get all settings with pagination and filtering
- `GET /setting/active` - Get all active settings
- `GET /setting/key/:key` - Find setting by key
- `GET /setting/:id` - Get setting by ID
- `PATCH /setting/:id` - Update setting
- `DELETE /setting/:id` - Delete setting (soft delete)

### Proxy Pricing Settings

- `POST /setting/proxy-pricing` - Create new proxy pricing configuration
- `GET /setting/proxy-pricing/all` - Get all proxy pricing settings with pagination
- `GET /setting/proxy-pricing/active` - Get all active proxy pricing settings
- `GET /setting/proxy-pricing/type/:proxyType` - Find pricing by proxy type
- `GET /setting/proxy-pricing/:id` - Get proxy pricing by ID
- `PATCH /setting/proxy-pricing/:id` - Update proxy pricing
- `DELETE /setting/proxy-pricing/:id` - Delete proxy pricing (soft delete)

### Utility Endpoints

- `GET /setting/proxy-pricing/calculate/:proxyType` - Calculate proxy price based on quantity and flow

## Usage Examples

### Creating a Proxy Pricing Setting

```typescript
// Create residential proxy pricing
const residentialPricing = {
  proxy_type: "residential",
  price_per_ip: 0.50,
  price_per_flow: 0.10,
  flow_unit: "GB",
  flow_multiplier: 1,
  setup_fee: 5.00,
  maintenance_fee: 2.00,
  minimum_quantity: 1,
  maximum_quantity: 1000,
  discount_percentage: 15,
  discount_threshold: 100,
  is_active: true,
  notes: "Residential proxy pricing for high-quality IPs"
};
```

### Calculating Proxy Prices

```typescript
// Calculate price for 50 residential proxies with 100GB flow
const price = await settingService.calculateProxyPrice(
  "residential",
  50,        // quantity
  100,       // flow amount
  "GB"       // flow unit
);

// Result includes:
// - Base price (IP cost)
// - Flow price
// - Setup and maintenance fees
// - Applied discounts
// - Total price
```

### Managing General Settings

```typescript
// Create a system configuration
const systemConfig = {
  type: "SYSTEM_CONFIG",
  key: "maintenance_mode",
  value: { enabled: false, message: "System under maintenance" },
  description: "Maintenance mode configuration",
  is_active: true
};

// Create a feature flag
const featureFlag = {
  type: "FEATURE_FLAG",
  key: "new_ui_enabled",
  value: true,
  description: "Enable new user interface",
  is_active: true
};
```

## Pricing Calculation Logic

The system automatically calculates proxy prices using the following formula:

1. **Base Price**: `price_per_ip × quantity`
2. **Flow Price**: `price_per_flow × flow_amount` (with unit conversion if needed)
3. **Discounts**: Applied if quantity meets threshold requirements
4. **Additional Fees**: Setup fee + maintenance fee
5. **Total**: Sum of all components

### Flow Unit Conversion

Automatic conversion between different flow units:
- 1 TB = 1024 GB
- 1 GB = 1024 MB
- 1 TB = 1,048,576 MB

### Quantity Discounts

Discounts are applied when the quantity meets or exceeds the threshold:
- Discount percentage is applied to both IP and flow costs
- Setup and maintenance fees are not discounted

## Security

- All endpoints require admin or super admin role
- Input validation using class-validator decorators
- Soft delete functionality to preserve data integrity
- Role-based access control using Guards

## Dependencies

- `@nestjs/typeorm` - Database operations
- `@nestjs/common` - Core NestJS functionality
- `class-validator` - Input validation
- `nestjs-typeorm-paginate` - Pagination support

## Database Schema

The module creates two tables:
- `setting` - General application settings
- `proxy_pricing_setting` - Proxy pricing configurations

Both tables include:
- UUID primary keys
- Created/updated timestamps
- Soft delete support
- Active status flags
- JSONB fields for flexible data storage
