import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1771988015029 implements MigrationInterface {
    name = 'Migration1771988015029'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "BUSINESS " ("CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(), "CREATED_BY" integer, "UPDATED_AT" TIMESTAMP DEFAULT now(), "UPDATED_BY" integer, "STATE" character(1) NOT NULL DEFAULT 'A', "BUSINESS_ID" SERIAL NOT NULL, "NAME" text NOT NULL, "RNC" text NOT NULL, "DESCRIPTION" text NOT NULL, "ADDRESS" text NOT NULL, "PHONE" text NOT NULL, CONSTRAINT "PK_49050e45c7a3015ea081e20e306" PRIMARY KEY ("BUSINESS_ID"))`);
        await queryRunner.query(`CREATE TABLE "ROLES" ("CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(), "CREATED_BY" integer, "UPDATED_AT" TIMESTAMP DEFAULT now(), "UPDATED_BY" integer, "STATE" character(1) NOT NULL DEFAULT 'A', "ROLE_ID" SERIAL NOT NULL, "NAME" character varying(30) NOT NULL, "DESCRIPTION" character varying(250) NOT NULL, CONSTRAINT "UQ_8b12cc1b93574dbc69bbc94a04d" UNIQUE ("NAME"), CONSTRAINT "PK_cbb0c57a342457947361d35a98d" PRIMARY KEY ("ROLE_ID"))`);
        await queryRunner.query(`CREATE TABLE "PERSON" ("CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(), "CREATED_BY" integer, "UPDATED_AT" TIMESTAMP DEFAULT now(), "UPDATED_BY" integer, "STATE" character(1) NOT NULL DEFAULT 'A', "PERSON_ID" SERIAL NOT NULL, "BUSINESS_ID" integer, "NAME" character varying NOT NULL, "LAST_NAME" character varying, "IDENTITY_DOCUMENT" character varying(11), "BIRTH_DATE" date, "GENDER" character(1), "ADDRESS" character varying, CONSTRAINT "PK_18197183747b37c419fcc02f2f1" PRIMARY KEY ("PERSON_ID"))`);
        await queryRunner.query(`CREATE TABLE "STAFF" ("CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(), "CREATED_BY" integer, "UPDATED_AT" TIMESTAMP DEFAULT now(), "UPDATED_BY" integer, "STATE" character(1) NOT NULL DEFAULT 'A', "STAFF_ID" SERIAL NOT NULL, "BUSINESS_ID" integer, "ROLE_ID" integer, "PERSON_ID" integer, "AVATAR" text, "USERNAME" character varying NOT NULL, "PASSWORD" character varying NOT NULL, "LOGIN_COUNT" integer, "LAST_LOGIN" TIMESTAMP, CONSTRAINT "UQ_d4c3c39c925860cd30d681ab35f" UNIQUE ("USERNAME"), CONSTRAINT "REL_e85c24616cf7883d8957baa287" UNIQUE ("PERSON_ID"), CONSTRAINT "PK_9d3026d6816040c56533cfd122e" PRIMARY KEY ("STAFF_ID"))`);
        await queryRunner.query(`CREATE TABLE "ACTIVITY_LOG" ("ID" SERIAL NOT NULL, "STAFF_ID" integer NOT NULL, "ACTION" character varying(100) NOT NULL, "MODEL" character varying(150) NOT NULL, "OBJECT_ID" integer, "CHANGES" jsonb, "CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(), "IP" inet, "USER_AGENT" text, CONSTRAINT "PK_68a56a34c121833ade7ce683435" PRIMARY KEY ("ID"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ACTIVITY_LOG_USER_CREATED_AT" ON "ACTIVITY_LOG" ("STAFF_ID", "CREATED_AT") `);
        await queryRunner.query(`CREATE TABLE "PASSWORD_RESET_TOKENS" ("ID" SERIAL NOT NULL, "TOKEN" character varying NOT NULL, "EXPIRES_AT" TIMESTAMP NOT NULL, "CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(), "STAFF_ID" integer, CONSTRAINT "PK_f2a4bd2d317f2efb4b62c53aedb" PRIMARY KEY ("ID"))`);
        await queryRunner.query(`ALTER TABLE "PERSON" ADD CONSTRAINT "FK_a707ae09561c0bc47789068aad4" FOREIGN KEY ("BUSINESS_ID") REFERENCES "BUSINESS "("BUSINESS_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "STAFF" ADD CONSTRAINT "FK_6f4ba66551826d1e17bb2073d90" FOREIGN KEY ("ROLE_ID") REFERENCES "ROLES"("ROLE_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "STAFF" ADD CONSTRAINT "FK_036d8e9bd7b08ae0f65b0c6e7c8" FOREIGN KEY ("BUSINESS_ID") REFERENCES "BUSINESS "("BUSINESS_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "STAFF" ADD CONSTRAINT "FK_e85c24616cf7883d8957baa287a" FOREIGN KEY ("PERSON_ID") REFERENCES "PERSON"("PERSON_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ACTIVITY_LOG" ADD CONSTRAINT "FK_bc268c85db831c3c29e86f125bf" FOREIGN KEY ("STAFF_ID") REFERENCES "STAFF"("STAFF_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "PASSWORD_RESET_TOKENS" ADD CONSTRAINT "FK_467b24ce681f5bf58ac9679d0c1" FOREIGN KEY ("STAFF_ID") REFERENCES "STAFF"("STAFF_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "PASSWORD_RESET_TOKENS" DROP CONSTRAINT "FK_467b24ce681f5bf58ac9679d0c1"`);
        await queryRunner.query(`ALTER TABLE "ACTIVITY_LOG" DROP CONSTRAINT "FK_bc268c85db831c3c29e86f125bf"`);
        await queryRunner.query(`ALTER TABLE "STAFF" DROP CONSTRAINT "FK_e85c24616cf7883d8957baa287a"`);
        await queryRunner.query(`ALTER TABLE "STAFF" DROP CONSTRAINT "FK_036d8e9bd7b08ae0f65b0c6e7c8"`);
        await queryRunner.query(`ALTER TABLE "STAFF" DROP CONSTRAINT "FK_6f4ba66551826d1e17bb2073d90"`);
        await queryRunner.query(`ALTER TABLE "PERSON" DROP CONSTRAINT "FK_a707ae09561c0bc47789068aad4"`);
        await queryRunner.query(`DROP TABLE "PASSWORD_RESET_TOKENS"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ACTIVITY_LOG_USER_CREATED_AT"`);
        await queryRunner.query(`DROP TABLE "ACTIVITY_LOG"`);
        await queryRunner.query(`DROP TABLE "STAFF"`);
        await queryRunner.query(`DROP TABLE "PERSON"`);
        await queryRunner.query(`DROP TABLE "ROLES"`);
        await queryRunner.query(`DROP TABLE "BUSINESS "`);
    }

}
