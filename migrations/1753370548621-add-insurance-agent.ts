import { Agent } from "src/modules/agent/entities/agent.entity";
import { DeepPartial, MigrationInterface, QueryRunner } from "typeorm";

export class AddInsuranceAgent1753370548621 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "agents" ("assistant_id", "name", "phone_number_id")
            VALUES ('9ede5556-a71d-4a79-8282-1681a9e24832', 'Insurance Agent', '13da8106-f4c1-4178-97cc-21e417e608b6')
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
