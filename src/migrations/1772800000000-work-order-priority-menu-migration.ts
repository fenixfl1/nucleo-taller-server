import { MigrationInterface, QueryRunner } from 'typeorm'

export class WorkOrderPriorityMenuMigration1772800000000
  implements MigrationInterface
{
  name = 'WorkOrderPriorityMenuMigration1772800000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "MENU_OPTION"
      SET "ORDER" = CASE "MENU_OPTION_ID"
        WHEN '0-1' THEN 1
        WHEN '0-4' THEN 2
        WHEN '0-6' THEN 3
        WHEN '0-5' THEN 4
        WHEN '0-3' THEN 5
        WHEN '0-2' THEN 6
        WHEN '0-8' THEN 8
        WHEN '0-9' THEN 9
        ELSE "ORDER"
      END
      WHERE "MENU_OPTION_ID" IN ('0-1', '0-4', '0-6', '0-5', '0-3', '0-2', '0-8', '0-9')
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "MENU_OPTION"
      SET "ORDER" = CASE "MENU_OPTION_ID"
        WHEN '0-1' THEN 1
        WHEN '0-2' THEN 2
        WHEN '0-3' THEN 3
        WHEN '0-4' THEN 4
        WHEN '0-5' THEN 5
        WHEN '0-6' THEN 6
        WHEN '0-8' THEN 8
        WHEN '0-9' THEN 9
        ELSE "ORDER"
      END
      WHERE "MENU_OPTION_ID" IN ('0-1', '0-2', '0-3', '0-4', '0-5', '0-6', '0-8', '0-9')
    `)
  }
}
