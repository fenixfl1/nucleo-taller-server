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
