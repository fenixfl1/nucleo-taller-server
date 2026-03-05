import { MigrationInterface, QueryRunner } from 'typeorm'

export class VehicleMigration1772230000000 implements MigrationInterface {
  name = 'VehicleMigration1772230000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "VEHICLE" ("CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(), "CREATED_BY" integer, "UPDATED_AT" TIMESTAMP DEFAULT now(), "UPDATED_BY" integer, "STATE" character(1) NOT NULL DEFAULT 'A', "VEHICLE_ID" SERIAL NOT NULL, "BUSINESS_ID" integer, "CUSTOMER_ID" integer NOT NULL, "PLATE" character varying(20), "VIN" character varying(30), "BRAND" character varying(60) NOT NULL, "MODEL" character varying(60) NOT NULL, "YEAR" integer, "COLOR" character varying(30), "ENGINE" character varying(60), "NOTES" character varying(500), CONSTRAINT "PK_aeb4f5ebd9f47f87b4f5894e57f" PRIMARY KEY ("VEHICLE_ID"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_VEHICLE_CUSTOMER" ON "VEHICLE" ("CUSTOMER_ID")`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_VEHICLE_BUSINESS_PLATE" ON "VEHICLE" ("BUSINESS_ID", "PLATE")`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_VEHICLE_BUSINESS_VIN" ON "VEHICLE" ("BUSINESS_ID", "VIN")`
    )
    await queryRunner.query(
      `ALTER TABLE "VEHICLE" ADD CONSTRAINT "FK_VEHICLE_BUSINESS" FOREIGN KEY ("BUSINESS_ID") REFERENCES "BUSINESS "("BUSINESS_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "VEHICLE" ADD CONSTRAINT "FK_VEHICLE_CUSTOMER" FOREIGN KEY ("CUSTOMER_ID") REFERENCES "PERSON"("PERSON_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "VEHICLE" DROP CONSTRAINT "FK_VEHICLE_CUSTOMER"`
    )
    await queryRunner.query(
      `ALTER TABLE "VEHICLE" DROP CONSTRAINT "FK_VEHICLE_BUSINESS"`
    )
    await queryRunner.query(
      `DROP INDEX "public"."UQ_VEHICLE_BUSINESS_VIN"`
    )
    await queryRunner.query(
      `DROP INDEX "public"."UQ_VEHICLE_BUSINESS_PLATE"`
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_VEHICLE_CUSTOMER"`)
    await queryRunner.query(`DROP TABLE "VEHICLE"`)
  }
}
