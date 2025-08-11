import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCryptomusTables1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create wallets table
    await queryRunner.createTable(
      new Table({
        name: 'wallets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'wallet_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'wallet_address',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'network',
            type: 'enum',
            enum: ['bitcoin', 'ethereum', 'bsc', 'polygon', 'solana', 'tron', 'litecoin', 'dogecoin'],
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'currency_symbol',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'maintenance'],
            default: "'active'",
          },
          {
            name: 'is_test',
            type: 'boolean',
            default: false,
          },
          {
            name: 'balance',
            type: 'decimal',
            precision: 18,
            scale: 8,
            default: 0,
          },
          {
            name: 'min_amount',
            type: 'decimal',
            precision: 18,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'max_amount',
            type: 'decimal',
            precision: 18,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'daily_limit',
            type: 'decimal',
            precision: 18,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'daily_used',
            type: 'decimal',
            precision: 18,
            scale: 8,
            default: 0,
          },
          {
            name: 'merchant_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'api_key',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'webhook_secret',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'owner_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'last_activity',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create payments table
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'cryptomus_payment_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'merchant_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'order_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 18,
            scale: 8,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'payment_type',
            type: 'enum',
            enum: ['crypto', 'fiat'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'paid', 'failed', 'expired', 'cancelled'],
            default: "'pending'",
          },
          {
            name: 'wallet_address',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'network',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'tx_hash',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'callback_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'return_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'is_test',
            type: 'boolean',
            default: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'wallet_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'paid_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create foreign key for payments.wallet_id -> wallets.id
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['wallet_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'wallets',
        onDelete: 'SET NULL',
      }),
    );

    // Create foreign key for wallets.owner_id -> user.id
    await queryRunner.createForeignKey(
      'wallets',
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );

    // Create indexes
    // await queryRunner.createIndex('wallets', {
    //   name: 'IDX_WALLETS_STATUS',
    //   columnNames: ['status'],
    // });

    // await queryRunner.createIndex('wallets', {
    //   name: 'IDX_WALLETS_CURRENCY',
    //   columnNames: ['currency'],
    // });

    // await queryRunner.createIndex('wallets', {
    //   name: 'IDX_WALLETS_NETWORK',
    //   columnNames: ['network'],
    // });

    // await queryRunner.createIndex('wallets', {
    //   name: 'IDX_WALLETS_OWNER_ID',
    //   columnNames: ['owner_id'],
    // });

    // await queryRunner.createIndex('payments', {
    //   name: 'IDX_PAYMENTS_STATUS',
    //   columnNames: ['status'],
    // });

    // await queryRunner.createIndex('payments', {
    //   name: 'IDX_PAYMENTS_ORDER_ID',
    //   columnNames: ['order_id'],
    // });

    // await queryRunner.createIndex('payments', {
    //   name: 'IDX_PAYMENTS_USER_ID',
    //   columnNames: ['user_id'],
    // });

    // await queryRunner.createIndex('payments', {
    //   name: 'IDX_PAYMENTS_WALLET_ID',
    //   columnNames: ['wallet_id'],
    // });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('payments');
    await queryRunner.dropTable('wallets');
  }
}
