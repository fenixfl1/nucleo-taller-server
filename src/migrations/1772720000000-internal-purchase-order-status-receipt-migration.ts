import { MigrationInterface, QueryRunner } from 'typeorm'

export class InternalPurchaseOrderStatusReceiptMigration1772720000000
  implements MigrationInterface
{
  name = 'InternalPurchaseOrderStatusReceiptMigration1772720000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "INTERNAL_PURCHASE_ORDER"
      ADD COLUMN "SENT_AT" TIMESTAMP NULL
    `)

    await queryRunner.query(`
      ALTER TABLE "INTERNAL_PURCHASE_ORDER"
      ADD COLUMN "RECEIVED_AT" TIMESTAMP NULL
    `)

    await queryRunner.query(`
      ALTER TABLE "INTERNAL_PURCHASE_ORDER"
      ADD COLUMN "CANCELLED_AT" TIMESTAMP NULL
    `)

    await queryRunner.query(`
      ALTER TABLE "INTERNAL_PURCHASE_ORDER"
      ADD COLUMN "RECEIVED_MOVEMENT_ID" integer NULL
    `)

    await queryRunner.query(`
      CREATE INDEX "IDX_INTERNAL_PURCHASE_ORDER_STATUS"
      ON "INTERNAL_PURCHASE_ORDER" ("STATUS")
    `)

    await queryRunner.query(`
      CREATE INDEX "IDX_INTERNAL_PURCHASE_ORDER_RECEIVED_MOVEMENT"
      ON "INTERNAL_PURCHASE_ORDER" ("RECEIVED_MOVEMENT_ID")
    `)

    await queryRunner.query(`
      ALTER TABLE "INTERNAL_PURCHASE_ORDER"
      ADD CONSTRAINT "FK_INTERNAL_PURCHASE_ORDER_RECEIVED_MOVEMENT"
      FOREIGN KEY ("RECEIVED_MOVEMENT_ID")
      REFERENCES "INVENTORY_MOVEMENT"("MOVEMENT_ID")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "INTERNAL_PURCHASE_ORDER"
      DROP CONSTRAINT "FK_INTERNAL_PURCHASE_ORDER_RECEIVED_MOVEMENT"
    `)

    await queryRunner.query(`
      DROP INDEX "public"."IDX_INTERNAL_PURCHASE_ORDER_RECEIVED_MOVEMENT"
    `)

    await queryRunner.query(`
      DROP INDEX "public"."IDX_INTERNAL_PURCHASE_ORDER_STATUS"
    `)

    await queryRunner.query(`
      ALTER TABLE "INTERNAL_PURCHASE_ORDER"
      DROP COLUMN "RECEIVED_MOVEMENT_ID"
    `)

    await queryRunner.query(`
      ALTER TABLE "INTERNAL_PURCHASE_ORDER"
      DROP COLUMN "CANCELLED_AT"
    `)

    await queryRunner.query(`
      ALTER TABLE "INTERNAL_PURCHASE_ORDER"
      DROP COLUMN "RECEIVED_AT"
    `)

    await queryRunner.query(`
      ALTER TABLE "INTERNAL_PURCHASE_ORDER"
      DROP COLUMN "SENT_AT"
    `)
  }
}
