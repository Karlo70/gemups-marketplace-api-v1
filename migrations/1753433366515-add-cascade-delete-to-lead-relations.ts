import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCascadeDeleteToLeadRelations1753433366515 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing foreign key constraints
        await queryRunner.query(`ALTER TABLE "vapi_calls" DROP CONSTRAINT IF EXISTS "FK_vapi_calls_lead_id"`);
        await queryRunner.query(`ALTER TABLE "pending_notifications" DROP CONSTRAINT IF EXISTS "FK_pending_notifications_lead_id"`);
        await queryRunner.query(`ALTER TABLE "email_logs" DROP CONSTRAINT IF EXISTS "FK_email_logs_lead_id"`);

        // Add new foreign key constraints with CASCADE DELETE
        await queryRunner.query(`ALTER TABLE "vapi_calls" ADD CONSTRAINT "FK_vapi_calls_lead_id" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "pending_notifications" ADD CONSTRAINT "FK_pending_notifications_lead_id" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "email_logs" ADD CONSTRAINT "FK_email_logs_lead_id" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the cascade foreign key constraints
        await queryRunner.query(`ALTER TABLE "vapi_calls" DROP CONSTRAINT IF EXISTS "FK_vapi_calls_lead_id"`);
        await queryRunner.query(`ALTER TABLE "pending_notifications" DROP CONSTRAINT IF EXISTS "FK_pending_notifications_lead_id"`);
        await queryRunner.query(`ALTER TABLE "email_logs" DROP CONSTRAINT IF EXISTS "FK_email_logs_lead_id"`);

        // Add back the original foreign key constraints without CASCADE
        await queryRunner.query(`ALTER TABLE "vapi_calls" ADD CONSTRAINT "FK_vapi_calls_lead_id" FOREIGN KEY ("lead_id") REFERENCES "leads"("id")`);
        await queryRunner.query(`ALTER TABLE "pending_notifications" ADD CONSTRAINT "FK_pending_notifications_lead_id" FOREIGN KEY ("lead_id") REFERENCES "leads"("id")`);
        await queryRunner.query(`ALTER TABLE "email_logs" ADD CONSTRAINT "FK_email_logs_lead_id" FOREIGN KEY ("lead_id") REFERENCES "leads"("id")`);
    }

} 