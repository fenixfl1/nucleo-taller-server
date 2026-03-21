import { MigrationInterface, QueryRunner } from 'typeorm'

export class StaffEmployeeTypeMigration1772820000000
  implements MigrationInterface
{
  name = 'StaffEmployeeTypeMigration1772820000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "STAFF" ADD "EMPLOYEE_TYPE" character varying(20) NOT NULL DEFAULT 'OPERACIONAL'`
    )

    await queryRunner.query(`
      UPDATE "MENU_OPTION"
      SET
        "NAME" = 'Empleados',
        "DESCRIPTION" = 'Gestion de empleados y accesos',
        "UPDATED_AT" = now()
      WHERE "MENU_OPTION_ID" = '0-9-1'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "MENU_OPTION"
      SET
        "NAME" = 'Usuarios',
        "DESCRIPTION" = 'Gestion de usuarios',
        "UPDATED_AT" = now()
      WHERE "MENU_OPTION_ID" = '0-9-1'
    `)

    await queryRunner.query(`ALTER TABLE "STAFF" DROP COLUMN "EMPLOYEE_TYPE"`)
  }
}
