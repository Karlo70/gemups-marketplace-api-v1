import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateVapiCallTableKey1752077138207 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add the new column `call_id`
    // await queryRunner.query(`ALTER TABLE "vapi_calls" DROP COLUMN "call_id"`);

    // await queryRunner.query(`
    //         ALTER TABLE "vapi_calls"
    //         ADD COLUMN "call_id" uuid
    //     `);

    // // Step 2: Populate `call_id` from JSON in `key` column

    const leads = await queryRunner.query(`
    SELECT id, response FROM "vapi_calls"
    `);

    await Promise.all(
      leads.map(async (lead, index) => {
        console.log(
          `🚀 ~ UpdateVapiCallTableKey1752077138207 ~ up ~ lead[${index}]:`,
          lead,
        );
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(lead.response);
          console.log(
            `🚀 ~ UpdateVapiCallTableKey1752077138207 ~ up ~ parsedResponse[${index}]:`,
            parsedResponse,
          );
        } catch (error) {
          console.error(
            `🚀 ~ UpdateVapiCallTableKey1752077138207 ~ up ~ Failed to parse response for lead[${index}]:`,
            error,
          );
          return; // Skip this lead if JSON parsing fails
        }
        if (parsedResponse.id) {
          await queryRunner.query(
            `UPDATE "vapi_calls"
        SET call_id = $1
        WHERE id = $2
        `,
            [parsedResponse.id, lead.id],
          );
        } else {
          console.warn(
            `🚀 ~ UpdateVapiCallTableKey1752077138207 ~ up ~ No id field in parsedResponse for lead[${index}]`,
          );
        }
      }),
    );

    await queryRunner.query(`ALTER TABLE "vapi_calls" DROP COLUMN "response"`);

    // (Optional) Step 3: Drop the old key column if you no longer need it
    // await queryRunner.query(`ALTER TABLE "vapi_call" DROP COLUMN "key"`);

    // (Optional) Step 4: Add NOT NULL or UNIQUE constraints
    // await queryRunner.query(`ALTER TABLE "vapi_call" ALTER COLUMN "call_id" SET NOT NULL`);
    // await queryRunner.query(`ALTER TABLE "vapi_call" ADD CONSTRAINT unique_call_id UNIQUE ("call_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse changes
    await queryRunner.query(`ALTER TABLE "vapi_call" DROP COLUMN "call_id"`);
  }
}
