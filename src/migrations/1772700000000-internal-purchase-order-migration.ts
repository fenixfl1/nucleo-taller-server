import { MigrationInterface, QueryRunner } from 'typeorm'

export class InternalPurchaseOrderMigration1772700000000
  implements MigrationInterface
{
  name = 'InternalPurchaseOrderMigration1772700000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "INTERNAL_PURCHASE_ORDER" (
        "CREATED_AT" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "CREATED_BY" integer,
        "UPDATED_AT" TIMESTAMP,
        "UPDATED_BY" integer,
        "STATE" char(1) NOT NULL DEFAULT 'A',
        "INTERNAL_PURCHASE_ORDER_ID" SERIAL NOT NULL,
        "BUSINESS_ID" integer NOT NULL,
        "ORDER_NO" character varying(20),
        "ORDER_DATE" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "STATUS" character varying(20) NOT NULL DEFAULT 'GENERADA',
        "SOURCE" character varying(30) NOT NULL DEFAULT 'REPLENISHMENT',
        "NOTES" character varying(500),
        CONSTRAINT "PK_INTERNAL_PURCHASE_ORDER" PRIMARY KEY ("INTERNAL_PURCHASE_ORDER_ID")
      )
    `)

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_INTERNAL_PURCHASE_ORDER_BUSINESS_NO"
      ON "INTERNAL_PURCHASE_ORDER" ("BUSINESS_ID", "ORDER_NO")
    `)

    await queryRunner.query(`
      CREATE INDEX "IDX_INTERNAL_PURCHASE_ORDER_DATE"
      ON "INTERNAL_PURCHASE_ORDER" ("ORDER_DATE")
    `)

    await queryRunner.query(`
      CREATE TABLE "INTERNAL_PURCHASE_ORDER_LINE" (
        "CREATED_AT" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "CREATED_BY" integer,
        "UPDATED_AT" TIMESTAMP,
        "UPDATED_BY" integer,
        "STATE" char(1) NOT NULL DEFAULT 'A',
        "INTERNAL_PURCHASE_ORDER_LINE_ID" SERIAL NOT NULL,
        "INTERNAL_PURCHASE_ORDER_ID" integer NOT NULL,
        "ARTICLE_ID" integer NOT NULL,
        "QUANTITY" numeric(12,2) NOT NULL DEFAULT '1',
        "UNIT_COST_REFERENCE" numeric(12,2),
        "NOTES" character varying(250),
        CONSTRAINT "PK_INTERNAL_PURCHASE_ORDER_LINE" PRIMARY KEY ("INTERNAL_PURCHASE_ORDER_LINE_ID")
      )
    `)

    await queryRunner.query(`
      CREATE INDEX "IDX_INTERNAL_PURCHASE_ORDER_LINE_ORDER"
      ON "INTERNAL_PURCHASE_ORDER_LINE" ("INTERNAL_PURCHASE_ORDER_ID")
    `)

    await queryRunner.query(`
      ALTER TABLE "INTERNAL_PURCHASE_ORDER"
      ADD CONSTRAINT "FK_INTERNAL_PURCHASE_ORDER_BUSINESS"
      FOREIGN KEY ("BUSINESS_ID") REFERENCES "BUSINESS "("BUSINESS_ID")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      ALTER TABLE "INTERNAL_PURCHASE_ORDER_LINE"
      ADD CONSTRAINT "FK_INTERNAL_PURCHASE_ORDER_LINE_ORDER"
      FOREIGN KEY ("INTERNAL_PURCHASE_ORDER_ID")
      REFERENCES "INTERNAL_PURCHASE_ORDER"("INTERNAL_PURCHASE_ORDER_ID")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      ALTER TABLE "INTERNAL_PURCHASE_ORDER_LINE"
      ADD CONSTRAINT "FK_INTERNAL_PURCHASE_ORDER_LINE_ARTICLE"
      FOREIGN KEY ("ARTICLE_ID") REFERENCES "ARTICLE"("ARTICLE_ID")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "INTERNAL_PURCHASE_ORDER_LINE"
      DROP CONSTRAINT "FK_INTERNAL_PURCHASE_ORDER_LINE_ARTICLE"
    `)
    await queryRunner.query(`
      ALTER TABLE "INTERNAL_PURCHASE_ORDER_LINE"
      DROP CONSTRAINT "FK_INTERNAL_PURCHASE_ORDER_LINE_ORDER"
    `)
    await queryRunner.query(`
      ALTER TABLE "INTERNAL_PURCHASE_ORDER"
      DROP CONSTRAINT "FK_INTERNAL_PURCHASE_ORDER_BUSINESS"
    `)
    await queryRunner.query(`
      DROP INDEX "public"."IDX_INTERNAL_PURCHASE_ORDER_LINE_ORDER"
    `)
    await queryRunner.query(`DROP TABLE "INTERNAL_PURCHASE_ORDER_LINE"`)
    await queryRunner.query(`
      DROP INDEX "public"."IDX_INTERNAL_PURCHASE_ORDER_DATE"
    `)
    await queryRunner.query(`
      DROP INDEX "public"."UQ_INTERNAL_PURCHASE_ORDER_BUSINESS_NO"
    `)
    await queryRunner.query(`DROP TABLE "INTERNAL_PURCHASE_ORDER"`)
  }
}
