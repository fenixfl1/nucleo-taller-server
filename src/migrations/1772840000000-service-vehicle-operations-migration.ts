import { MigrationInterface, QueryRunner } from 'typeorm'

export class ServiceVehicleOperationsMigration1772840000000
  implements MigrationInterface
{
  name = 'ServiceVehicleOperationsMigration1772840000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "SERVICE_VEHICLE_MAINTENANCE" (
        "CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(),
        "CREATED_BY" integer,
        "UPDATED_AT" TIMESTAMP DEFAULT now(),
        "UPDATED_BY" integer,
        "STATE" character(1) NOT NULL DEFAULT 'A',
        "SERVICE_VEHICLE_MAINTENANCE_ID" SERIAL NOT NULL,
        "BUSINESS_ID" integer,
        "SERVICE_VEHICLE_ID" integer NOT NULL,
        "MAINTENANCE_TYPE" character varying(30) NOT NULL,
        "PRIORITY" character varying(20) NOT NULL DEFAULT 'MEDIA',
        "STATUS" character varying(20) NOT NULL DEFAULT 'PENDIENTE',
        "TITLE" character varying(120) NOT NULL,
        "DESCRIPTION" character varying(500),
        "SCHEDULED_AT" TIMESTAMP,
        "PERFORMED_AT" TIMESTAMP,
        "ODOMETER" integer,
        "COST_REFERENCE" numeric(12,2),
        "NOTES" character varying(500),
        CONSTRAINT "PK_SERVICE_VEHICLE_MAINTENANCE" PRIMARY KEY ("SERVICE_VEHICLE_MAINTENANCE_ID")
      )
    `)
    await queryRunner.query(
      `CREATE INDEX "IDX_SERVICE_VEHICLE_MAINTENANCE_VEHICLE" ON "SERVICE_VEHICLE_MAINTENANCE" ("SERVICE_VEHICLE_ID")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_SERVICE_VEHICLE_MAINTENANCE_STATUS" ON "SERVICE_VEHICLE_MAINTENANCE" ("STATUS")`
    )
    await queryRunner.query(`
      ALTER TABLE "SERVICE_VEHICLE_MAINTENANCE"
      ADD CONSTRAINT "FK_SERVICE_VEHICLE_MAINTENANCE_BUSINESS"
      FOREIGN KEY ("BUSINESS_ID")
      REFERENCES "BUSINESS "("BUSINESS_ID")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      ALTER TABLE "SERVICE_VEHICLE_MAINTENANCE"
      ADD CONSTRAINT "FK_SERVICE_VEHICLE_MAINTENANCE_VEHICLE"
      FOREIGN KEY ("SERVICE_VEHICLE_ID")
      REFERENCES "SERVICE_VEHICLE"("SERVICE_VEHICLE_ID")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      CREATE TABLE "SERVICE_VEHICLE_USAGE" (
        "CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(),
        "CREATED_BY" integer,
        "UPDATED_AT" TIMESTAMP DEFAULT now(),
        "UPDATED_BY" integer,
        "STATE" character(1) NOT NULL DEFAULT 'A',
        "SERVICE_VEHICLE_USAGE_ID" SERIAL NOT NULL,
        "BUSINESS_ID" integer,
        "SERVICE_VEHICLE_ID" integer NOT NULL,
        "STAFF_ID" integer,
        "STATUS" character varying(20) NOT NULL DEFAULT 'EN_CURSO',
        "PURPOSE" character varying(150) NOT NULL,
        "ORIGIN" character varying(120),
        "DESTINATION" character varying(120),
        "STARTED_AT" TIMESTAMP NOT NULL,
        "ENDED_AT" TIMESTAMP,
        "ODOMETER_START" integer,
        "ODOMETER_END" integer,
        "NOTES" character varying(500),
        CONSTRAINT "PK_SERVICE_VEHICLE_USAGE" PRIMARY KEY ("SERVICE_VEHICLE_USAGE_ID")
      )
    `)
    await queryRunner.query(
      `CREATE INDEX "IDX_SERVICE_VEHICLE_USAGE_VEHICLE" ON "SERVICE_VEHICLE_USAGE" ("SERVICE_VEHICLE_ID")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_SERVICE_VEHICLE_USAGE_STAFF" ON "SERVICE_VEHICLE_USAGE" ("STAFF_ID")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_SERVICE_VEHICLE_USAGE_STATUS" ON "SERVICE_VEHICLE_USAGE" ("STATUS")`
    )
    await queryRunner.query(`
      ALTER TABLE "SERVICE_VEHICLE_USAGE"
      ADD CONSTRAINT "FK_SERVICE_VEHICLE_USAGE_BUSINESS"
      FOREIGN KEY ("BUSINESS_ID")
      REFERENCES "BUSINESS "("BUSINESS_ID")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      ALTER TABLE "SERVICE_VEHICLE_USAGE"
      ADD CONSTRAINT "FK_SERVICE_VEHICLE_USAGE_VEHICLE"
      FOREIGN KEY ("SERVICE_VEHICLE_ID")
      REFERENCES "SERVICE_VEHICLE"("SERVICE_VEHICLE_ID")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      ALTER TABLE "SERVICE_VEHICLE_USAGE"
      ADD CONSTRAINT "FK_SERVICE_VEHICLE_USAGE_STAFF"
      FOREIGN KEY ("STAFF_ID")
      REFERENCES "STAFF"("STAFF_ID")
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
      ) VALUES
      (
        '0-8-4',
        'Mantenimientos SV',
        'Historial de mantenimientos de vehículos de servicio',
        '/0-8-4/configuracion/vehiculos-servicio/mantenimientos',
        'item',
        '0-8',
        4,
        'A'
      ),
      (
        '0-8-5',
        'Usos y salidas SV',
        'Registro de salidas y uso de vehículos de servicio',
        '/0-8-5/configuracion/vehiculos-servicio/usos',
        'item',
        '0-8',
        5,
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
      SELECT option_id, "ROLE_ID", 'A'
      FROM "ROLES"
      CROSS JOIN (VALUES ('0-8-4'), ('0-8-5')) AS menu(option_id)
      ON CONFLICT ("MENU_OPTION_ID", "ROLE_ID")
      DO UPDATE SET "STATE" = EXCLUDED."STATE"
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "MENU_OPTIONS_X_ROLES" WHERE "MENU_OPTION_ID" IN ('0-8-4', '0-8-5')`
    )
    await queryRunner.query(
      `DELETE FROM "MENU_OPTION" WHERE "MENU_OPTION_ID" IN ('0-8-4', '0-8-5')`
    )

    await queryRunner.query(
      `ALTER TABLE "SERVICE_VEHICLE_USAGE" DROP CONSTRAINT "FK_SERVICE_VEHICLE_USAGE_STAFF"`
    )
    await queryRunner.query(
      `ALTER TABLE "SERVICE_VEHICLE_USAGE" DROP CONSTRAINT "FK_SERVICE_VEHICLE_USAGE_VEHICLE"`
    )
    await queryRunner.query(
      `ALTER TABLE "SERVICE_VEHICLE_USAGE" DROP CONSTRAINT "FK_SERVICE_VEHICLE_USAGE_BUSINESS"`
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_SERVICE_VEHICLE_USAGE_STATUS"`
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_SERVICE_VEHICLE_USAGE_STAFF"`
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_SERVICE_VEHICLE_USAGE_VEHICLE"`
    )
    await queryRunner.query(`DROP TABLE "SERVICE_VEHICLE_USAGE"`)

    await queryRunner.query(
      `ALTER TABLE "SERVICE_VEHICLE_MAINTENANCE" DROP CONSTRAINT "FK_SERVICE_VEHICLE_MAINTENANCE_VEHICLE"`
    )
    await queryRunner.query(
      `ALTER TABLE "SERVICE_VEHICLE_MAINTENANCE" DROP CONSTRAINT "FK_SERVICE_VEHICLE_MAINTENANCE_BUSINESS"`
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_SERVICE_VEHICLE_MAINTENANCE_STATUS"`
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_SERVICE_VEHICLE_MAINTENANCE_VEHICLE"`
    )
    await queryRunner.query(`DROP TABLE "SERVICE_VEHICLE_MAINTENANCE"`)
  }
}
