import { MigrationInterface, QueryRunner } from 'typeorm'

export class BusinessRefinementMigration1772730000000
  implements MigrationInterface
{
  name = 'BusinessRefinementMigration1772730000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ALTER COLUMN "NAME" TYPE character varying
    `)

    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ALTER COLUMN "NAME" DROP NOT NULL
    `)

    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ALTER COLUMN "RNC" TYPE character varying
    `)

    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ALTER COLUMN "RNC" DROP NOT NULL
    `)

    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ALTER COLUMN "DESCRIPTION" TYPE character varying
    `)

    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ALTER COLUMN "DESCRIPTION" DROP NOT NULL
    `)

    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ALTER COLUMN "ADDRESS" DROP NOT NULL
    `)

    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ALTER COLUMN "PHONE" TYPE character varying(15)
      USING LEFT(COALESCE("PHONE", ''), 15)
    `)

    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ALTER COLUMN "PHONE" DROP NOT NULL
    `)

    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ADD COLUMN IF NOT EXISTS "LOGO" text
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      DROP COLUMN IF EXISTS "LOGO"
    `)

    await queryRunner.query(`
      UPDATE "BUSINESS "
      SET "PHONE" = COALESCE("PHONE", '')
      WHERE "PHONE" IS NULL
    `)

    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ALTER COLUMN "PHONE" TYPE text
    `)

    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ALTER COLUMN "PHONE" SET NOT NULL
    `)

    await queryRunner.query(`
      UPDATE "BUSINESS "
      SET "ADDRESS" = COALESCE("ADDRESS", '')
      WHERE "ADDRESS" IS NULL
    `)

    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ALTER COLUMN "ADDRESS" SET NOT NULL
    `)

    await queryRunner.query(`
      UPDATE "BUSINESS "
      SET "DESCRIPTION" = COALESCE("DESCRIPTION", '')
      WHERE "DESCRIPTION" IS NULL
    `)

    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ALTER COLUMN "DESCRIPTION" TYPE text
    `)

    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ALTER COLUMN "DESCRIPTION" SET NOT NULL
    `)

    await queryRunner.query(`
      UPDATE "BUSINESS "
      SET "RNC" = COALESCE("RNC", '')
      WHERE "RNC" IS NULL
    `)

    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ALTER COLUMN "RNC" TYPE text
    `)

    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ALTER COLUMN "RNC" SET NOT NULL
    `)

    await queryRunner.query(`
      UPDATE "BUSINESS "
      SET "NAME" = COALESCE("NAME", '')
      WHERE "NAME" IS NULL
    `)

    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ALTER COLUMN "NAME" TYPE text
    `)

    await queryRunner.query(`
      ALTER TABLE "BUSINESS "
      ALTER COLUMN "NAME" SET NOT NULL
    `)
  }
}
