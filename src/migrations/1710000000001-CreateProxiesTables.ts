import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateProxiesTables1710000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create proxies table
    await queryRunner.createTable(
      new Table({
        name: 'proxies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'proxy_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'proxy_type',
            type: 'enum',
            enum: ['traffic_gb', 'ip_count', 'unlimited'],
          },
          {
            name: 'protocol',
            type: 'enum',
            enum: ['http', 'https', 'socks5'],
            default: "'http'",
          },
          {
            name: 'host',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'port',
            type: 'int',
          },
          {
            name: 'username',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'zone',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'ptype',
            type: 'int',
          },
          {
            name: 'flow',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'flow_used',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'ip_count',
            type: 'int',
            default: 1,
          },
          {
            name: 'region',
            type: 'varchar',
            length: '2',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'expired', 'suspended'],
            default: "'active'",
          },
          {
            name: 'is_test',
            type: 'boolean',
            default: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_used_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'order_no',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'owner_id',
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
        ],
      }),
      true,
    );

    // Create proxy_orders table
    await queryRunner.createTable(
      new Table({
        name: 'proxy_orders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'order_no',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'flow',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'expire',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'host_label',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'username',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'host',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'port',
            type: 'int',
          },
          {
            name: 'protocol',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'active', 'completed', 'failed', 'cancelled'],
            default: "'pending'",
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
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'proxy_id',
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
        ],
      }),
      true,
    );

    // Create proxy_usage table
    await queryRunner.createTable(
      new Table({
        name: 'proxy_usage',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'username',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'tzname',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'start_date',
            type: 'date',
          },
          {
            name: 'end_date',
            type: 'date',
          },
          {
            name: 'traffic_used',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'ip_rotations',
            type: 'int',
            default: 0,
          },
          {
            name: 'requests_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'successful_requests',
            type: 'int',
            default: 0,
          },
          {
            name: 'failed_requests',
            type: 'int',
            default: 0,
          },
          {
            name: 'average_response_time',
            type: 'decimal',
            precision: 8,
            scale: 3,
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
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'proxy_id',
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
        ],
      }),
      true,
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'proxies',
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'proxy_orders',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'proxy_orders',
      new TableForeignKey({
        columnNames: ['proxy_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'proxies',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'proxy_usage',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'proxy_usage',
      new TableForeignKey({
        columnNames: ['proxy_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'proxies',
        onDelete: 'SET NULL',
      }),
    );

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('proxy_usage');
    await queryRunner.dropTable('proxy_orders');
    await queryRunner.dropTable('proxies');
  }
}
