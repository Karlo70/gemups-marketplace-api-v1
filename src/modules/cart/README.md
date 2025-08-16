# Cart Module

This module provides cart functionality for the marketplace API, allowing users to add products to their cart, manage quantities, and checkout.

## Features

- Add products to cart
- Update cart item quantities
- Remove items from cart
- View cart contents
- Clear entire cart
- Checkout cart items to create orders

## API Endpoints

### Authentication Required
All cart endpoints require authentication. Include the `Authorization` header with a valid JWT token.

### 1. Get Cart
```
GET /cart
```
Returns the current user's cart with all items and totals.

**Response:**
```json
{
  "id": 1,
  "subtotal": 25.00,
  "tax_amount": 0.00,
  "discount_amount": 0.00,
  "total_amount": 25.00,
  "total_items": 2,
  "items": [
    {
      "id": "uuid-1",
      "quantity": 1,
      "unit_price": 15.00,
      "total_price": 15.00,
      "product": {
        "id": "product-uuid",
        "name": "Product Name",
        "price_per_ip": 15.00
      }
    }
  ]
}
```

### 2. Add to Cart
```
POST /cart/add
```

**Request Body:**
```json
{
  "product_id": "product-uuid",
  "quantity": 2,
  "metadata": {
    "custom_field": "value"
  }
}
```

**Response:** Returns the updated cart.

### 3. Update Cart Item
```
PUT /cart/item/:id
```

**Request Body:**
```json
{
  "quantity": 3,
  "metadata": {
    "updated_field": "new_value"
  }
}
```

**Response:** Returns the updated cart.

### 4. Remove from Cart
```
DELETE /cart/item/:id
```

**Response:** Returns the updated cart.

### 5. Clear Cart
```
DELETE /cart/clear
```

**Response:** Returns the empty cart.

### 6. Checkout
```
POST /cart/checkout
```

**Request Body:**
```json
{
  "notes": "Special instructions",
  "payment_method": "crypto",
  "metadata": {
    "checkout_source": "web"
  }
}
```

**Response:**
```json
{
  "message": "Checkout successful",
  "orders": [
    {
      "id": 1,
      "status": "pending",
      "total_amount": 25.00
    }
  ],
  "total_amount": 25.00
}
```

## Business Logic

### Cart Management
- Each user has one cart
- Cart is automatically created when first item is added
- Cart totals are automatically calculated and updated
- Cart items are unique per product (quantity is updated if product already exists)

### Checkout Process
- Validates cart is not empty
- Checks user has sufficient wallet balance
- Creates individual orders for each cart item
- Clears cart after successful checkout
- Handles partial failures gracefully

### Pricing
- Unit prices are stored at time of adding to cart
- Total prices are calculated as quantity × unit price
- Cart totals include subtotal, tax, and discounts
- Final amount is subtotal + tax - discounts

## Error Handling

- **404**: Product not found or inactive
- **400**: Insufficient balance, empty cart, validation errors
- **403**: Unauthorized cart access
- **500**: Server errors during order creation

## Dependencies

- `OrderModule`: For creating orders during checkout
- `ProductModule`: For product validation
- `UserModule`: For user authentication and wallet access
