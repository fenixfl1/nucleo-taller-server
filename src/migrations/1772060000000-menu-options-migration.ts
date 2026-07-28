import { MigrationInterface, QueryRunner } from 'typeorm'

export class MenuOptionsMigration1772060000000 implements MigrationInterface {
  name = 'MenuOptionsMigration1772060000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "MENU_OPTION" (
        "CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(),
        "CREATED_BY" integer,
        "UPDATED_AT" TIMESTAMP DEFAULT now(),
        "UPDATED_BY" integer,
        "STATE" character(1) NOT NULL DEFAULT 'A',
        "MENU_OPTION_ID" character varying(50) NOT NULL,
        "NAME" character varying(100) NOT NULL,
        "DESCRIPTION" character varying(250),
        "PATH" character varying(100),
        "TYPE" character varying(20),
        "ICON" text,
        "ORDER" integer NOT NULL,
        "PARENT_ID" character varying(50),
        "CONTENT" text,
        CONSTRAINT "PK_MENU_OPTION_ID" PRIMARY KEY ("MENU_OPTION_ID"),
        CONSTRAINT "UQ_MENU_OPTION_PARENT_ORDER" UNIQUE ("PARENT_ID", "ORDER")
      )
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_MENU_OPTION_PARENT_ORDER"
      ON "MENU_OPTION" ("PARENT_ID", "ORDER")
    `)

    await queryRunner.query(`
      ALTER TABLE "MENU_OPTION"
      ADD CONSTRAINT "FK_MENU_OPTION_PARENT_ID"
      FOREIGN KEY ("PARENT_ID")
      REFERENCES "MENU_OPTION"("MENU_OPTION_ID")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `).catch(() => undefined)

    await queryRunner.query(`
      ALTER TABLE "MENU_OPTION"
      ADD CONSTRAINT "FK_MENU_OPTION_CREATED_BY"
      FOREIGN KEY ("CREATED_BY")
      REFERENCES "STAFF"("STAFF_ID")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `).catch(() => undefined)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "MENU_OPTIONS_X_ROLES" (
        "CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(),
        "CREATED_BY" integer,
        "UPDATED_AT" TIMESTAMP DEFAULT now(),
        "UPDATED_BY" integer,
        "STATE" character(1) NOT NULL DEFAULT 'A',
        "MENU_OPTION_ID" character varying(50) NOT NULL,
        "ROLE_ID" integer NOT NULL,
        CONSTRAINT "PK_MENU_OPTIONS_X_ROLES" PRIMARY KEY ("MENU_OPTION_ID", "ROLE_ID")
      )
    `)

    await queryRunner.query(`
      ALTER TABLE "MENU_OPTIONS_X_ROLES"
      ADD CONSTRAINT "FK_MENU_OPTIONS_X_ROLES_MENU"
      FOREIGN KEY ("MENU_OPTION_ID")
      REFERENCES "MENU_OPTION"("MENU_OPTION_ID")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `).catch(() => undefined)

    await queryRunner.query(`
      ALTER TABLE "MENU_OPTIONS_X_ROLES"
      ADD CONSTRAINT "FK_MENU_OPTIONS_X_ROLES_ROLE"
      FOREIGN KEY ("ROLE_ID")
      REFERENCES "ROLES"("ROLE_ID")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `).catch(() => undefined)

    await queryRunner.query(`
      INSERT INTO "MENU_OPTION" (
        "MENU_OPTION_ID",
        "NAME",
        "DESCRIPTION",
        "PATH",
        "TYPE",
        "ICON",
        "ORDER",
        "PARENT_ID",
        "CONTENT",
        "STATE"
      )
      VALUES
        ('0-1', 'Dashboard', 'Panel principal', '/0-1/dashboard', 'item', NULL, 1, NULL, NULL, 'A'),
        ('0-4', 'Ordenes de trabajo', 'Gestion de ordenes de trabajo', '/0-4/ordenes-trabajo', 'item', NULL, 2, NULL, NULL, 'A'),
        ('0-6', 'Entregas', 'Comprobantes y entregas', '/0-6/entregas', 'item', NULL, 3, NULL, NULL, 'A'),
        ('0-5', 'Inventario', 'Inventario y control de stock', '/0-5/inventario', 'submenu', NULL, 4, NULL, NULL, 'A'),
        ('0-3', 'Vehiculos', 'Gestion de vehiculos', '/0-3/vehiculos', 'item', NULL, 5, NULL, NULL, 'A'),
        ('0-2', 'Clientes', 'Gestion de clientes', '/0-2/clientes', 'item', NULL, 6, NULL, NULL, 'A'),
        ('0-7', 'Reportes', 'Reportes operativos', '/0-7/reportes', 'item', NULL, 7, NULL, NULL, 'A'),
        ('0-8', 'Configuracion', 'Catalogos y parametros', '/0-8/configuracion', 'submenu', NULL, 8, NULL, NULL, 'A'),
        ('0-9', 'Seguridad', 'Empleados, roles y bitacora', '/0-9/seguridad', 'submenu', NULL, 9, NULL, NULL, 'A')
      ON CONFLICT ("MENU_OPTION_ID")
      DO UPDATE SET
        "NAME" = EXCLUDED."NAME",
        "DESCRIPTION" = EXCLUDED."DESCRIPTION",
        "PATH" = EXCLUDED."PATH",
        "TYPE" = EXCLUDED."TYPE",
        "ICON" = EXCLUDED."ICON",
        "ORDER" = EXCLUDED."ORDER",
        "PARENT_ID" = EXCLUDED."PARENT_ID",
        "CONTENT" = EXCLUDED."CONTENT",
        "STATE" = EXCLUDED."STATE",
        "UPDATED_AT" = now()
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "MENU_OPTIONS_X_ROLES" DROP CONSTRAINT IF EXISTS "FK_MENU_OPTIONS_X_ROLES_ROLE"`
    )
    await queryRunner.query(
      `ALTER TABLE "MENU_OPTIONS_X_ROLES" DROP CONSTRAINT IF EXISTS "FK_MENU_OPTIONS_X_ROLES_MENU"`
    )
    await queryRunner.query(`DROP TABLE IF EXISTS "MENU_OPTIONS_X_ROLES"`)

    await queryRunner.query(
      `ALTER TABLE "MENU_OPTION" DROP CONSTRAINT IF EXISTS "FK_MENU_OPTION_CREATED_BY"`
    )
    await queryRunner.query(
      `ALTER TABLE "MENU_OPTION" DROP CONSTRAINT IF EXISTS "FK_MENU_OPTION_PARENT_ID"`
    )
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_MENU_OPTION_PARENT_ORDER"`
    )
    await queryRunner.query(`DROP TABLE IF EXISTS "MENU_OPTION"`)
  }
}
