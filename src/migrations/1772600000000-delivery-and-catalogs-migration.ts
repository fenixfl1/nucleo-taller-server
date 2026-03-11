import { MigrationInterface, QueryRunner } from 'typeorm'

export class DeliveryAndCatalogsMigration1772600000000
  implements MigrationInterface
{
  name = 'DeliveryAndCatalogsMigration1772600000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "DELIVERY_RECEIPT" ("CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(), "CREATED_BY" integer, "UPDATED_AT" TIMESTAMP DEFAULT now(), "UPDATED_BY" integer, "STATE" character(1) NOT NULL DEFAULT 'A', "DELIVERY_RECEIPT_ID" SERIAL NOT NULL, "BUSINESS_ID" integer, "RECEIPT_NO" character varying(20), "WORK_ORDER_ID" integer NOT NULL, "DELIVERED_BY_STAFF_ID" integer NOT NULL, "DELIVERY_DATE" TIMESTAMP NOT NULL DEFAULT now(), "RECEIVED_BY_NAME" character varying(120) NOT NULL, "RECEIVED_BY_DOCUMENT" character varying(30), "RECEIVED_BY_PHONE" character varying(30), "OBSERVATIONS" character varying(500), CONSTRAINT "PK_7ee9553cd4296c2046648e7fe88" PRIMARY KEY ("DELIVERY_RECEIPT_ID"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_DELIVERY_RECEIPT_BUSINESS_NO" ON "DELIVERY_RECEIPT" ("BUSINESS_ID", "RECEIPT_NO")`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_DELIVERY_RECEIPT_WORK_ORDER" ON "DELIVERY_RECEIPT" ("WORK_ORDER_ID")`
    )

    await queryRunner.query(
      `CREATE TABLE "WORK_ORDER_SERVICE_TYPE" ("CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(), "CREATED_BY" integer, "UPDATED_AT" TIMESTAMP DEFAULT now(), "UPDATED_BY" integer, "STATE" character(1) NOT NULL DEFAULT 'A', "SERVICE_TYPE_ID" SERIAL NOT NULL, "BUSINESS_ID" integer, "CODE" character varying(30) NOT NULL, "NAME" character varying(100) NOT NULL, "DESCRIPTION" character varying(250), "ORDER_INDEX" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_5f0dbfe93c0e064f2d40d4f9fcc" PRIMARY KEY ("SERVICE_TYPE_ID"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_WORK_ORDER_SERVICE_TYPE_BUSINESS_CODE" ON "WORK_ORDER_SERVICE_TYPE" ("BUSINESS_ID", "CODE")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_WORK_ORDER_SERVICE_TYPE_ORDER" ON "WORK_ORDER_SERVICE_TYPE" ("ORDER_INDEX")`
    )

    await queryRunner.query(
      `CREATE TABLE "ARTICLE_COMPATIBILITY" ("CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(), "CREATED_BY" integer, "UPDATED_AT" TIMESTAMP DEFAULT now(), "UPDATED_BY" integer, "STATE" character(1) NOT NULL DEFAULT 'A', "ARTICLE_COMPATIBILITY_ID" SERIAL NOT NULL, "ARTICLE_ID" integer NOT NULL, "BRAND" character varying(60) NOT NULL, "MODEL" character varying(80) NOT NULL, "YEAR_FROM" integer, "YEAR_TO" integer, "ENGINE" character varying(60), "NOTES" character varying(250), CONSTRAINT "PK_b038b4c77d6c6750f2b8ea25ce3" PRIMARY KEY ("ARTICLE_COMPATIBILITY_ID"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_ARTICLE_COMPATIBILITY_ARTICLE" ON "ARTICLE_COMPATIBILITY" ("ARTICLE_ID")`
    )

    await queryRunner.query(
      `ALTER TABLE "DELIVERY_RECEIPT" ADD CONSTRAINT "FK_DELIVERY_RECEIPT_BUSINESS" FOREIGN KEY ("BUSINESS_ID") REFERENCES "BUSINESS "("BUSINESS_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "DELIVERY_RECEIPT" ADD CONSTRAINT "FK_DELIVERY_RECEIPT_WORK_ORDER" FOREIGN KEY ("WORK_ORDER_ID") REFERENCES "WORK_ORDER"("WORK_ORDER_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "DELIVERY_RECEIPT" ADD CONSTRAINT "FK_DELIVERY_RECEIPT_DELIVERED_BY" FOREIGN KEY ("DELIVERED_BY_STAFF_ID") REFERENCES "STAFF"("STAFF_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "WORK_ORDER_SERVICE_TYPE" ADD CONSTRAINT "FK_WORK_ORDER_SERVICE_TYPE_BUSINESS" FOREIGN KEY ("BUSINESS_ID") REFERENCES "BUSINESS "("BUSINESS_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "ARTICLE_COMPATIBILITY" ADD CONSTRAINT "FK_ARTICLE_COMPATIBILITY_ARTICLE" FOREIGN KEY ("ARTICLE_ID") REFERENCES "ARTICLE"("ARTICLE_ID") ON DELETE CASCADE ON UPDATE NO ACTION`
    )

    await queryRunner.query(
      `INSERT INTO "WORK_ORDER_SERVICE_TYPE" ("BUSINESS_ID", "CODE", "NAME", "DESCRIPTION", "ORDER_INDEX", "STATE") VALUES
      (NULL, 'DIAGNOSTICO', 'Diagnóstico', 'Revisión inicial y diagnóstico técnico', 1, 'A'),
      (NULL, 'REPARACION', 'Reparación', 'Trabajo principal de reparación', 2, 'A'),
      (NULL, 'LIMPIEZA', 'Limpieza', 'Limpieza interna o externa', 3, 'A'),
      (NULL, 'DESMONTE', 'Desmonte', 'Desmonte o desmontaje del componente', 4, 'A'),
      (NULL, 'SOLDADURA', 'Soldadura', 'Aplicación de soldadura o refuerzo', 5, 'A'),
      (NULL, 'PRUEBA', 'Prueba', 'Prueba de presión o funcionamiento', 6, 'A')`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "WORK_ORDER_SERVICE_TYPE" WHERE "CODE" IN ('DIAGNOSTICO', 'REPARACION', 'LIMPIEZA', 'DESMONTE', 'SOLDADURA', 'PRUEBA')`
    )
    await queryRunner.query(
      `ALTER TABLE "ARTICLE_COMPATIBILITY" DROP CONSTRAINT "FK_ARTICLE_COMPATIBILITY_ARTICLE"`
    )
    await queryRunner.query(
      `ALTER TABLE "WORK_ORDER_SERVICE_TYPE" DROP CONSTRAINT "FK_WORK_ORDER_SERVICE_TYPE_BUSINESS"`
    )
    await queryRunner.query(
      `ALTER TABLE "DELIVERY_RECEIPT" DROP CONSTRAINT "FK_DELIVERY_RECEIPT_DELIVERED_BY"`
    )
    await queryRunner.query(
      `ALTER TABLE "DELIVERY_RECEIPT" DROP CONSTRAINT "FK_DELIVERY_RECEIPT_WORK_ORDER"`
    )
    await queryRunner.query(
      `ALTER TABLE "DELIVERY_RECEIPT" DROP CONSTRAINT "FK_DELIVERY_RECEIPT_BUSINESS"`
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ARTICLE_COMPATIBILITY_ARTICLE"`
    )
    await queryRunner.query(`DROP TABLE "ARTICLE_COMPATIBILITY"`)
    await queryRunner.query(
      `DROP INDEX "public"."IDX_WORK_ORDER_SERVICE_TYPE_ORDER"`
    )
    await queryRunner.query(
      `DROP INDEX "public"."UQ_WORK_ORDER_SERVICE_TYPE_BUSINESS_CODE"`
    )
    await queryRunner.query(`DROP TABLE "WORK_ORDER_SERVICE_TYPE"`)
    await queryRunner.query(
      `DROP INDEX "public"."UQ_DELIVERY_RECEIPT_WORK_ORDER"`
    )
    await queryRunner.query(
      `DROP INDEX "public"."UQ_DELIVERY_RECEIPT_BUSINESS_NO"`
    )
    await queryRunner.query(`DROP TABLE "DELIVERY_RECEIPT"`)
  }
}
