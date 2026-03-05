import { MigrationInterface, QueryRunner } from 'typeorm'

type MenuIdMapping = {
  oldId: string
  newId: string
  oldParentId: string | null
  newParentId: string | null
  oldPath: string
  newPath: string
}

const MENU_ID_MAPPINGS: MenuIdMapping[] = [
  {
    oldId: 'MNU_DASHBOARD',
    newId: '0-1',
    oldParentId: null,
    newParentId: null,
    oldPath: '/dashboard',
    newPath: '/0-1/dashboard',
  },
  {
    oldId: 'MNU_CLIENTES',
    newId: '0-2',
    oldParentId: null,
    newParentId: null,
    oldPath: '/clientes',
    newPath: '/0-2/clientes',
  },
  {
    oldId: 'MNU_VEHICULOS',
    newId: '0-3',
    oldParentId: null,
    newParentId: null,
    oldPath: '/vehiculos',
    newPath: '/0-3/vehiculos',
  },
  {
    oldId: 'MNU_ORDENES_TRABAJO',
    newId: '0-4',
    oldParentId: null,
    newParentId: null,
    oldPath: '/ordenes-trabajo',
    newPath: '/0-4/ordenes-trabajo',
  },
  {
    oldId: 'MNU_INVENTARIO',
    newId: '0-5',
    oldParentId: null,
    newParentId: null,
    oldPath: '/inventario',
    newPath: '/0-5/inventario',
  },
  {
    oldId: 'MNU_ENTREGAS',
    newId: '0-6',
    oldParentId: null,
    newParentId: null,
    oldPath: '/entregas',
    newPath: '/0-6/entregas',
  },
  {
    oldId: 'MNU_REPORTES',
    newId: '0-7',
    oldParentId: null,
    newParentId: null,
    oldPath: '/reportes',
    newPath: '/0-7/reportes',
  },
  {
    oldId: 'MNU_CONFIGURACION',
    newId: '0-8',
    oldParentId: null,
    newParentId: null,
    oldPath: '/configuracion',
    newPath: '/0-8/configuracion',
  },
  {
    oldId: 'MNU_SEGURIDAD',
    newId: '0-9',
    oldParentId: null,
    newParentId: null,
    oldPath: '/seguridad',
    newPath: '/0-9/seguridad',
  },
  {
    oldId: 'MNU_INV_ARTICULOS',
    newId: '0-5-1',
    oldParentId: 'MNU_INVENTARIO',
    newParentId: '0-5',
    oldPath: '/inventario/articulos',
    newPath: '/0-5-1/inventario/articulos',
  },
  {
    oldId: 'MNU_INV_MOVIMIENTOS',
    newId: '0-5-2',
    oldParentId: 'MNU_INVENTARIO',
    newParentId: '0-5',
    oldPath: '/inventario/movimientos',
    newPath: '/0-5-2/inventario/movimientos',
  },
  {
    oldId: 'MNU_INV_REPOSICION',
    newId: '0-5-3',
    oldParentId: 'MNU_INVENTARIO',
    newParentId: '0-5',
    oldPath: '/inventario/reposicion',
    newPath: '/0-5-3/inventario/reposicion',
  },
  {
    oldId: 'MNU_CFG_CATALOGOS',
    newId: '0-8-1',
    oldParentId: 'MNU_CONFIGURACION',
    newParentId: '0-8',
    oldPath: '/configuracion/catalogos',
    newPath: '/0-8-1/configuracion/catalogos',
  },
  {
    oldId: 'MNU_CFG_ESTADOS_OT',
    newId: '0-8-2',
    oldParentId: 'MNU_CONFIGURACION',
    newParentId: '0-8',
    oldPath: '/configuracion/estados-ot',
    newPath: '/0-8-2/configuracion/estados-ot',
  },
  {
    oldId: 'MNU_SEG_USUARIOS',
    newId: '0-9-1',
    oldParentId: 'MNU_SEGURIDAD',
    newParentId: '0-9',
    oldPath: '/seguridad/usuarios',
    newPath: '/0-9-1/seguridad/usuarios',
  },
  {
    oldId: 'MNU_SEG_ROLES',
    newId: '0-9-2',
    oldParentId: 'MNU_SEGURIDAD',
    newParentId: '0-9',
    oldPath: '/seguridad/roles',
    newPath: '/0-9-2/seguridad/roles',
  },
  {
    oldId: 'MNU_SEG_BITACORA',
    newId: '0-9-3',
    oldParentId: 'MNU_SEGURIDAD',
    newParentId: '0-9',
    oldPath: '/seguridad/bitacora',
    newPath: '/0-9-3/seguridad/bitacora',
  },
]

export class MenuOptionsLegacyIdsMigration1772149800000
  implements MigrationInterface
{
  name = 'MenuOptionsLegacyIdsMigration1772149800000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.migrateMenuIds(queryRunner, 'old_to_new')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.migrateMenuIds(queryRunner, 'new_to_old')
  }

  private async migrateMenuIds(
    queryRunner: QueryRunner,
    direction: 'old_to_new' | 'new_to_old'
  ): Promise<void> {
    const normalized = MENU_ID_MAPPINGS.map((item) => ({
      sourceId: direction === 'old_to_new' ? item.oldId : item.newId,
      targetId: direction === 'old_to_new' ? item.newId : item.oldId,
      targetParentId:
        direction === 'old_to_new' ? item.newParentId : item.oldParentId,
      targetPath: direction === 'old_to_new' ? item.newPath : item.oldPath,
    }))

    for (const entry of normalized) {
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
          SELECT
            "CREATED_AT",
            "CREATED_BY",
            "UPDATED_AT",
            "UPDATED_BY",
            "STATE",
            $1,
            "NAME",
            "DESCRIPTION",
            $2,
            "TYPE",
            "ICON",
            "ORDER",
            $3,
            "CONTENT"
          FROM "MENU_OPTION"
          WHERE "MENU_OPTION_ID" = $4
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
        `,
        [entry.targetId, entry.targetPath, entry.targetParentId, entry.sourceId]
      )

      await queryRunner.query(
        `
          INSERT INTO "MENU_OPTIONS_X_ROLES" (
            "CREATED_AT",
            "CREATED_BY",
            "UPDATED_AT",
            "UPDATED_BY",
            "STATE",
            "MENU_OPTION_ID",
            "ROLE_ID"
          )
          SELECT
            "CREATED_AT",
            "CREATED_BY",
            "UPDATED_AT",
            "UPDATED_BY",
            "STATE",
            $1,
            "ROLE_ID"
          FROM "MENU_OPTIONS_X_ROLES"
          WHERE "MENU_OPTION_ID" = $2
          ON CONFLICT ("MENU_OPTION_ID", "ROLE_ID")
          DO UPDATE SET
            "STATE" = EXCLUDED."STATE",
            "UPDATED_AT" = now()
        `,
        [entry.targetId, entry.sourceId]
      )
    }

    for (const entry of normalized) {
      await queryRunner.query(
        `DELETE FROM "MENU_OPTIONS_X_ROLES" WHERE "MENU_OPTION_ID" = $1`,
        [entry.sourceId]
      )
      await queryRunner.query(
        `DELETE FROM "MENU_OPTION" WHERE "MENU_OPTION_ID" = $1`,
        [entry.sourceId]
      )
    }

    // Final normalize in case rows already existed with old path format.
    for (const entry of normalized) {
      await queryRunner.query(
        `
          UPDATE "MENU_OPTION"
          SET "PATH" = $2,
              "PARENT_ID" = $3
          WHERE "MENU_OPTION_ID" = $1
        `,
        [entry.targetId, entry.targetPath, entry.targetParentId]
      )
    }
  }
}
