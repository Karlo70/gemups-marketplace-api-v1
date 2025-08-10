import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCallFromEnum1753357804552 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update call_from values from 'lead_platform' to 'system'
        await queryRunner.query(`
            UPDATE "vapi_calls" 
            SET call_from = 'system' 
            WHERE call_from = 'lead_platform'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert call_from values from 'system' back to 'lead_platform'
        await queryRunner.query(`
            UPDATE "vapi_calls" 
            SET call_from = 'lead_platform' 
            WHERE call_from = 'system' AND id IN (
                SELECT id FROM "vapi_calls" 
                WHERE call_from = 'system' 
                ORDER BY created_at DESC
            )
        `);
    }

}
