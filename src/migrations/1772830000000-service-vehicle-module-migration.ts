import { MigrationInterface, QueryRunner } from 'typeorm'

export class ServiceVehicleModuleMigration1772830000000
  implements MigrationInterface
{
  name = 'ServiceVehicleModuleMigration1772830000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "SERVICE_VEHICLE" (
        "CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(),
        "CREATED_BY" integer,
        "UPDATED_AT" TIMESTAMP DEFAULT now(),
        "UPDATED_BY" integer,
        "STATE" character(1) NOT NULL DEFAULT 'A',
        "SERVICE_VEHICLE_ID" SERIAL NOT NULL,
        "BUSINESS_ID" integer,
        "NAME" character varying(100) NOT NULL,
        "PLATE" character varying(20),
        "VIN" character varying(30),
        "BRAND" character varying(60) NOT NULL,
        "MODEL" character varying(60) NOT NULL,
        "YEAR" integer,
        "COLOR" character varying(30),
        "ENGINE" character varying(60),
        "NOTES" character varying(500),
        CONSTRAINT "PK_SERVICE_VEHICLE" PRIMARY KEY ("SERVICE_VEHICLE_ID")
      )
    `)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_SERVICE_VEHICLE_BUSINESS_PLATE" ON "SERVICE_VEHICLE" ("BUSINESS_ID", "PLATE")`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_SERVICE_VEHICLE_BUSINESS_VIN" ON "SERVICE_VEHICLE" ("BUSINESS_ID", "VIN")`
    )
    await queryRunner.query(`
      ALTER TABLE "SERVICE_VEHICLE"
      ADD CONSTRAINT "FK_SERVICE_VEHICLE_BUSINESS"
      FOREIGN KEY ("BUSINESS_ID")
      REFERENCES "BUSINESS "("BUSINESS_ID")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      INSERT INTO "MENU_OPTION" (
        "MENU_OPTION_ID",
        "NAME",
        "DESCRIPTION",
        "PATH",
        "TYPE",
        "PARENT_ID",
        "ORDER",
        "STATE"
      )
      VALUES (
        '0-8-3',
        'Vehículos de servicio',
        'Mantenimiento de vehículos internos del taller',
        '/0-8-3/configuracion/vehiculos-servicio',
        'item',
        '0-8',
        3,
        'A'
      )
      ON CONFLICT ("MENU_OPTION_ID") DO UPDATE SET
        "NAME" = EXCLUDED."NAME",
        "DESCRIPTION" = EXCLUDED."DESCRIPTION",
        "PATH" = EXCLUDED."PATH",
        "TYPE" = EXCLUDED."TYPE",
        "PARENT_ID" = EXCLUDED."PARENT_ID",
        "ORDER" = EXCLUDED."ORDER",
        "STATE" = EXCLUDED."STATE",
        "UPDATED_AT" = now()
    `)

    await queryRunner.query(`
      INSERT INTO "MENU_OPTIONS_X_ROLES" ("MENU_OPTION_ID", "ROLE_ID", "STATE")
      SELECT '0-8-3', "ROLE_ID", 'A'
      FROM "ROLES"
      ON CONFLICT ("MENU_OPTION_ID", "ROLE_ID")
      DO UPDATE SET "STATE" = EXCLUDED."STATE"
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "MENU_OPTIONS_X_ROLES" WHERE "MENU_OPTION_ID" = '0-8-3'`
    )
    await queryRunner.query(
      `DELETE FROM "MENU_OPTION" WHERE "MENU_OPTION_ID" = '0-8-3'`
    )
    await queryRunner.query(
      `ALTER TABLE "SERVICE_VEHICLE" DROP CONSTRAINT "FK_SERVICE_VEHICLE_BUSINESS"`
    )
    await queryRunner.query(
      `DROP INDEX "public"."UQ_SERVICE_VEHICLE_BUSINESS_VIN"`
    )
    await queryRunner.query(
      `DROP INDEX "public"."UQ_SERVICE_VEHICLE_BUSINESS_PLATE"`
    )
    await queryRunner.query(`DROP TABLE "SERVICE_VEHICLE"`)
  }
}
