import { MigrationInterface, QueryRunner } from 'typeorm'

export class DashboardMenuRestructureMigration1772740000000
  implements MigrationInterface
{
  name = 'DashboardMenuRestructureMigration1772740000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "MENU_OPTION"
      SET
        "NAME" = 'Dashboard',
        "DESCRIPTION" = 'Panel principal',
        "PATH" = '/0-1/dashboard',
        "TYPE" = 'submenu',
        "PARENT_ID" = NULL,
        "ORDER" = 1,
        "STATE" = 'A'
      WHERE "MENU_OPTION_ID" = '0-1'
    `)

    await queryRunner.query(`
      INSERT INTO "MENU_OPTION" (
        "CREATED_AT",
        "CREATED_BY",
        "UPDATED_AT",
        "UPDATED_BY",
        "STATE",
        "MENU_OPTION_ID",
        "NAME",
        "DESCRIPTION",
        "PATH",
        "TYPE",
        "ICON",
        "ORDER",
        "PARENT_ID",
        "CONTENT"
      )
      SELECT
        "CREATED_AT",
        "CREATED_BY",
        "UPDATED_AT",
        "UPDATED_BY",
        'A',
        '0-1-1',
        'Resumen',
        'Resumen operativo',
        '/0-1-1/dashboard/resumen',
        'item',
        "ICON",
        1,
        '0-1',
        "CONTENT"
      FROM "MENU_OPTION"
      WHERE "MENU_OPTION_ID" = '0-1'
      ON CONFLICT ("MENU_OPTION_ID")
      DO UPDATE SET
        "NAME" = EXCLUDED."NAME",
        "DESCRIPTION" = EXCLUDED."DESCRIPTION",
        "PATH" = EXCLUDED."PATH",
        "TYPE" = EXCLUDED."TYPE",
        "ORDER" = EXCLUDED."ORDER",
        "PARENT_ID" = EXCLUDED."PARENT_ID",
        "STATE" = 'A'
    `)

    await queryRunner.query(`
      INSERT INTO "MENU_OPTION" (
        "CREATED_AT",
        "CREATED_BY",
        "UPDATED_AT",
        "UPDATED_BY",
        "STATE",
        "MENU_OPTION_ID",
        "NAME",
        "DESCRIPTION",
        "PATH",
        "TYPE",
        "ICON",
        "ORDER",
        "PARENT_ID",
        "CONTENT"
      )
      SELECT
        "CREATED_AT",
        "CREATED_BY",
        "UPDATED_AT",
        "UPDATED_BY",
        'A',
        '0-1-2',
        'Reportes',
        'Reportes operativos',
        '/0-1-2/dashboard/reportes',
        'item',
        "ICON",
        2,
        '0-1',
        "CONTENT"
      FROM "MENU_OPTION"
      WHERE "MENU_OPTION_ID" = '0-7'
      ON CONFLICT ("MENU_OPTION_ID")
      DO UPDATE SET
        "NAME" = EXCLUDED."NAME",
        "DESCRIPTION" = EXCLUDED."DESCRIPTION",
        "PATH" = EXCLUDED."PATH",
        "TYPE" = EXCLUDED."TYPE",
        "ORDER" = EXCLUDED."ORDER",
        "PARENT_ID" = EXCLUDED."PARENT_ID",
        "STATE" = 'A'
    `)

    await queryRunner.query(`
      INSERT INTO "MENU_OPTIONS_X_ROLES" ("MENU_OPTION_ID", "ROLE_ID", "STATE")
      SELECT DISTINCT '0-1', "ROLE_ID", 'A'
      FROM "MENU_OPTIONS_X_ROLES"
      WHERE "MENU_OPTION_ID" = '0-7'
      ON CONFLICT ("MENU_OPTION_ID", "ROLE_ID")
      DO UPDATE SET "STATE" = 'A'
    `)

    await queryRunner.query(`
      INSERT INTO "MENU_OPTIONS_X_ROLES" ("MENU_OPTION_ID", "ROLE_ID", "STATE")
      SELECT DISTINCT '0-1-1', "ROLE_ID", 'A'
      FROM "MENU_OPTIONS_X_ROLES"
      WHERE "MENU_OPTION_ID" = '0-1'
      ON CONFLICT ("MENU_OPTION_ID", "ROLE_ID")
      DO UPDATE SET "STATE" = 'A'
    `)

    await queryRunner.query(`
      INSERT INTO "MENU_OPTIONS_X_ROLES" ("MENU_OPTION_ID", "ROLE_ID", "STATE")
      SELECT DISTINCT '0-1-2', "ROLE_ID", 'A'
      FROM "MENU_OPTIONS_X_ROLES"
      WHERE "MENU_OPTION_ID" = '0-7'
      ON CONFLICT ("MENU_OPTION_ID", "ROLE_ID")
      DO UPDATE SET "STATE" = 'A'
    `)

    await queryRunner.query(`
      UPDATE "MENU_OPTION"
      SET "STATE" = 'I'
      WHERE "MENU_OPTION_ID" = '0-7'
    `)

    await queryRunner.query(`
      UPDATE "MENU_OPTIONS_X_ROLES"
      SET "STATE" = 'I'
      WHERE "MENU_OPTION_ID" = '0-7'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "MENU_OPTIONS_X_ROLES"
      SET "STATE" = 'A'
      WHERE "MENU_OPTION_ID" = '0-7'
    `)

    await queryRunner.query(`
      UPDATE "MENU_OPTION"
      SET "STATE" = 'A'
      WHERE "MENU_OPTION_ID" = '0-7'
    `)

    await queryRunner.query(`
      DELETE FROM "MENU_OPTIONS_X_ROLES"
      WHERE "MENU_OPTION_ID" IN ('0-1-1', '0-1-2')
    `)

    await queryRunner.query(`
      DELETE FROM "MENU_OPTION"
      WHERE "MENU_OPTION_ID" IN ('0-1-1', '0-1-2')
    `)

    await queryRunner.query(`
      UPDATE "MENU_OPTION"
      SET
        "NAME" = 'Dashboard',
        "DESCRIPTION" = 'Resumen operativo',
        "PATH" = '/0-1/dashboard',
        "TYPE" = 'item',
        "PARENT_ID" = NULL,
        "ORDER" = 1,
        "STATE" = 'A'
      WHERE "MENU_OPTION_ID" = '0-1'
    `)
  }
}
