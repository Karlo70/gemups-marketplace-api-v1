import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateLeadEnumsToText1753342003113 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the enum constraint for lead_from column
        await queryRunner.query(`
            ALTER TABLE "leads" 
            ALTER COLUMN "lead_from" TYPE text USING "lead_from"::text
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert back to enum if needed (though this would require recreating the enum)
        await queryRunner.query(`
            ALTER TABLE "leads" 
            ALTER COLUMN "lead_from" TYPE varchar(255)
        `);
    }

}
