import { MigrationInterface, QueryRunner } from 'typeorm'

export class UnaccentExtensionMigration1785364032630
  implements MigrationInterface
{
  name = 'UnaccentExtensionMigration1785364032630'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP EXTENSION IF EXISTS unaccent`)
  }
}
