# Transaction Module

This module handles all transaction-related operations including payments, refunds, withdrawals, deposits, and transfers.

## Features

- **CRUD Operations**: Create, read, update, and delete transactions
- **Advanced Filtering**: Filter by user, order, payment method, status, amount range, and date range
- **Pagination**: Built-in pagination with configurable page size
- **Search**: Search transactions by description or transaction ID
- **Statistics**: Get transaction statistics and analytics
- **Role-based Access**: Admin and Super Admin access control
- **Soft Delete**: Transactions are soft deleted, not permanently removed

## Entity

### Transaction Entity

The `Transaction` entity includes:

- **Basic Info**: ID, amount, currency, description
- **Type & Status**: Transaction type, status, payment method
- **Payment Details**: Payment provider, transaction IDs, gateway info
- **Timestamps**: Created, updated, processed, failed, refunded dates
- **Relationships**: User and Order associations
- **Metadata**: JSON field for additional data

### Enums

- **TransactionStatus**: `pending`, `completed`, `failed`, `cancelled`, `refunded`, `partially_refunded`
- **TransactionType**: `payment`, `refund`, `withdrawal`, `deposit`, `transfer`
- **PaymentMethod**: `credit_card`, `debit_card`, `bank_transfer`, `crypto`, `paypal`, `stripe`, `cryptomus`

## API Endpoints

### Create Transaction
```
POST /transactions
Authorization: Bearer <token>
Roles: ADMIN, SUPER_ADMIN
```

**Request Body:**
```json
{
  "amount": 100.00,
  "currency": "USD",
  "transaction_type": "payment",
  "payment_method": "credit_card",
  "description": "Order payment",
  "user_id": "uuid",
  "order_id": "uuid"
}
```

### Get All Transactions
```
GET /transactions?page=1&per_page=10&search=payment&status=completed
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 10, max: 250)
- `search`: Search in description or transaction ID
- `user_id`: Filter by user ID
- `order_id`: Filter by order ID
- `payment_method`: Filter by payment method
- `transaction_type`: Filter by transaction type
- `status`: Filter by transaction status
- `min_amount`: Minimum amount filter
- `max_amount`: Maximum amount filter
- `from`: Start date (ISO string)
- `to`: End date (ISO string)

### Get Transaction Statistics
```
GET /transactions/stats?user_id=uuid
Authorization: Bearer <token>
Roles: ADMIN, SUPER_ADMIN
```

**Response:**
```json
{
  "total_transactions": 150,
  "total_amount": 15000.00,
  "successful_transactions": 140,
  "failed_transactions": 5,
  "pending_transactions": 5
}
```

### Get Single Transaction
```
GET /transactions/:id
Authorization: Bearer <token>
```

### Update Transaction
```
PATCH /transactions/:id
Authorization: Bearer <token>
Roles: ADMIN, SUPER_ADMIN
```

### Delete Transaction
```
DELETE /transactions/:id
Authorization: Bearer <token>
Roles: ADMIN, SUPER_ADMIN
```

## DTOs

### CreateTransactionDto
- `amount`: Required positive number
- `currency`: Optional string (default: USD)
- `transaction_type`: Required enum value
- `status`: Optional enum value (default: pending)
- `payment_method`: Optional enum value
- `description`: Optional string
- `user_id`: Optional UUID
- `order_id`: Optional UUID
- `metadata`: Optional JSON object

### GetAllTransactionDto
Extends the shared `GetAllDto` with transaction-specific filters.

### UpdateTransactionDto
Extends `CreateTransactionDto` as partial type for updates.

## Service Methods

- `create()`: Create new transaction
- `findAll()`: Get paginated transactions with filters
- `findOne()`: Get single transaction by ID
- `update()`: Update transaction with status-based timestamp updates
- `remove()`: Soft delete transaction
- `getTransactionStats()`: Get transaction statistics

## Database Indexes

- `user_id + created_at`: For user transaction queries
- `order_id + status`: For order-related queries
- `transaction_type + status`: For type-based queries

## Usage Examples

### Creating a Payment Transaction
```typescript
const transaction = await transactionService.create({
  amount: 99.99,
  currency: 'USD',
  transaction_type: TransactionType.PAYMENT,
  payment_method: PaymentMethod.CREDIT_CARD,
  description: 'Premium subscription payment',
  user_id: 'user-uuid',
  order_id: 'order-uuid'
});
```

### Filtering Transactions
```typescript
const transactions = await transactionService.findAll({
  page: 1,
  per_page: 20,
  status: TransactionStatus.COMPLETED,
  payment_method: PaymentMethod.CRYPTO,
  min_amount: 50,
  max_amount: 200
});
```

### Getting User Statistics
```typescript
const stats = await transactionService.getTransactionStats('user-uuid');
console.log(`User has ${stats.total_transactions} transactions`);
```

## Error Handling

- `NotFoundException`: Transaction not found
- `BadRequestException`: Invalid input data
- Proper HTTP status codes for all operations

## Security

- Authentication required for all endpoints
- Role-based access control for admin operations
- Input validation using class-validator decorators
- SQL injection protection through TypeORM query builder
