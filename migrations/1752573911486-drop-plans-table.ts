import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPlansTable1752573911486 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "plans" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transaction" CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
