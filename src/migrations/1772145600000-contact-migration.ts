import { MigrationInterface, QueryRunner } from 'typeorm'

export class ContactMigration1772145600000 implements MigrationInterface {
  name = 'ContactMigration1772145600000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."CONTACT_TYPE_ENUM" AS ENUM('email', 'phone', 'whatsapp', 'other')`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."CONTACT_USAGE_ENUM" AS ENUM('personal', 'emergency')`
    )
    await queryRunner.query(
      `CREATE TABLE "CONTACT" ("CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(), "CREATED_BY" integer, "UPDATED_AT" TIMESTAMP DEFAULT now(), "UPDATED_BY" integer, "STATE" character(1) NOT NULL DEFAULT 'A', "CONTACT_ID" SERIAL NOT NULL, "PERSON_ID" integer NOT NULL, "TYPE" "public"."CONTACT_TYPE_ENUM" NOT NULL DEFAULT 'email', "USAGE" "public"."CONTACT_USAGE_ENUM" NOT NULL DEFAULT 'personal', "VALUE" character varying(255) NOT NULL, "IS_PRIMARY" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_3c6e38b6d0895c8f3d14564c95e" PRIMARY KEY ("CONTACT_ID"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_CONTACT_PERSON_TYPE_USAGE_VALUE" ON "CONTACT" ("PERSON_ID", "TYPE", "USAGE", "VALUE")`
    )
    await queryRunner.query(
      `ALTER TABLE "CONTACT" ADD CONSTRAINT "FK_CONTACT_PERSON" FOREIGN KEY ("PERSON_ID") REFERENCES "PERSON"("PERSON_ID") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "CONTACT" DROP CONSTRAINT "FK_CONTACT_PERSON"`
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_CONTACT_PERSON_TYPE_USAGE_VALUE"`
    )
    await queryRunner.query(`DROP TABLE "CONTACT"`)
    await queryRunner.query(`DROP TYPE "public"."CONTACT_USAGE_ENUM"`)
    await queryRunner.query(`DROP TYPE "public"."CONTACT_TYPE_ENUM"`)
  }
}
