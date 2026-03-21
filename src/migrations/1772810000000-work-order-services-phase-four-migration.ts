import { MigrationInterface, QueryRunner } from 'typeorm'

export class WorkOrderServicesPhaseFourMigration1772810000000
  implements MigrationInterface
{
  name = 'WorkOrderServicesPhaseFourMigration1772810000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "WORK_ORDER_SERVICE_TYPE" ADD "BASE_PRICE" numeric(12,2) NOT NULL DEFAULT '0'`
    )

    await queryRunner.query(`
      UPDATE "WORK_ORDER_SERVICE_TYPE"
      SET "BASE_PRICE" = CASE "CODE"
        WHEN 'DIAGNOSTICO' THEN 500
        WHEN 'REPARACION' THEN 2500
        WHEN 'LIMPIEZA' THEN 1200
        WHEN 'DESMONTE' THEN 800
        WHEN 'SOLDADURA' THEN 1500
        WHEN 'PRUEBA' THEN 300
        ELSE COALESCE("BASE_PRICE", 0)
      END
      WHERE "BUSINESS_ID" IS NULL
    `)

    await queryRunner.query(`
      UPDATE "MENU_OPTION"
      SET
        "NAME" = 'Servicios',
        "DESCRIPTION" = 'Catalogo de servicios del taller',
        "PATH" = '/0-8-1/configuracion/servicios',
        "UPDATED_AT" = now()
      WHERE "MENU_OPTION_ID" = '0-8-1'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "MENU_OPTION"
      SET
        "NAME" = 'Catalogos',
        "DESCRIPTION" = 'Listas base del sistema',
        "PATH" = '/0-8-1/configuracion/catalogos',
        "UPDATED_AT" = now()
      WHERE "MENU_OPTION_ID" = '0-8-1'
    `)

    await queryRunner.query(
      `ALTER TABLE "WORK_ORDER_SERVICE_TYPE" DROP COLUMN "BASE_PRICE"`
    )
  }
}
