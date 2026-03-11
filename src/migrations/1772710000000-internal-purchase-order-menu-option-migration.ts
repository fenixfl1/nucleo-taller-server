import { MigrationInterface, QueryRunner } from 'typeorm'

export class InternalPurchaseOrderMenuOptionMigration1772710000000
  implements MigrationInterface
{
  name = 'InternalPurchaseOrderMenuOptionMigration1772710000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
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
        VALUES (
          CURRENT_TIMESTAMP,
          NULL,
          NULL,
          NULL,
          'A',
          '0-5-4',
          'Ordenes internas',
          'Historial de ordenes de compra internas',
          '/0-5-4/inventario/ordenes-internas',
          'item',
          NULL,
          4,
          '0-5',
          NULL
        )
        ON CONFLICT ("MENU_OPTION_ID")
        DO UPDATE SET
          "NAME" = EXCLUDED."NAME",
          "DESCRIPTION" = EXCLUDED."DESCRIPTION",
          "PATH" = EXCLUDED."PATH",
          "TYPE" = EXCLUDED."TYPE",
          "ORDER" = EXCLUDED."ORDER",
          "PARENT_ID" = EXCLUDED."PARENT_ID",
          "STATE" = EXCLUDED."STATE"
      `
    )

    await queryRunner.query(
      `
        INSERT INTO "MENU_OPTIONS_X_ROLES" ("MENU_OPTION_ID", "ROLE_ID")
        SELECT '0-5-4', "ROLE_ID"
        FROM "ROLES"
        WHERE "STATE" = 'A'
        ON CONFLICT DO NOTHING
      `
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        DELETE FROM "MENU_OPTIONS_X_ROLES"
        WHERE "MENU_OPTION_ID" = '0-5-4'
      `
    )

    await queryRunner.query(
      `
        DELETE FROM "MENU_OPTION"
        WHERE "MENU_OPTION_ID" = '0-5-4'
      `
    )
  }
}
