import { MigrationInterface, QueryRunner } from 'typeorm'

export class ArticleMigration1772300000000 implements MigrationInterface {
  name = 'ArticleMigration1772300000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "ARTICLE" ("CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(), "CREATED_BY" integer, "UPDATED_AT" TIMESTAMP DEFAULT now(), "UPDATED_BY" integer, "STATE" character(1) NOT NULL DEFAULT 'A', "ARTICLE_ID" SERIAL NOT NULL, "BUSINESS_ID" integer, "CODE" character varying(30) NOT NULL, "NAME" character varying(120) NOT NULL, "ITEM_TYPE" character varying(20) NOT NULL DEFAULT 'REPUESTO', "UNIT_MEASURE" character varying(20) NOT NULL DEFAULT 'UND', "CATEGORY" character varying(60), "MIN_STOCK" numeric(12,2) NOT NULL DEFAULT '0', "MAX_STOCK" numeric(12,2), "CURRENT_STOCK" numeric(12,2) NOT NULL DEFAULT '0', "COST_REFERENCE" numeric(12,2), "DESCRIPTION" character varying(500), CONSTRAINT "PK_58e14d4945f55866f6f4d4fdbf7" PRIMARY KEY ("ARTICLE_ID"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_ARTICLE_NAME" ON "ARTICLE" ("NAME")`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_ARTICLE_BUSINESS_CODE" ON "ARTICLE" ("BUSINESS_ID", "CODE")`
    )
    await queryRunner.query(
      `ALTER TABLE "ARTICLE" ADD CONSTRAINT "FK_ARTICLE_BUSINESS" FOREIGN KEY ("BUSINESS_ID") REFERENCES "BUSINESS "("BUSINESS_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ARTICLE" DROP CONSTRAINT "FK_ARTICLE_BUSINESS"`
    )
    await queryRunner.query(`DROP INDEX "public"."UQ_ARTICLE_BUSINESS_CODE"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_ARTICLE_NAME"`)
    await queryRunner.query(`DROP TABLE "ARTICLE"`)
  }
}
