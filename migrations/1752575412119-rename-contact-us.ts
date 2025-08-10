import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameContactUs1752575412119 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contact_us" RENAME TO "leads"`);
        // await queryRunner.query(`ALTER TABLE "leads" RENAME CONSTRAINT "PK_contact_us" TO "PK_leads"`);
        // Drop the existing enum type if it exists
        await queryRunner.query(`DROP TYPE IF EXISTS "contact_us_contact_from_enum" CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
