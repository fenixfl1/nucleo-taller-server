import 'reflect-metadata'
import bcrypt from 'bcrypt'
import { AppDataSource } from '@src/data-source'
import Business from '@entity/Business'
import { Role } from '@entity/Role'
import { Person } from '@entity/Person'
import { Staff } from '@entity/Staff'
import { MenuOption } from '@entity/MenuOption'

const parseBoolean = (value: string | undefined, defaultValue = false) => {
  if (!value) return defaultValue
  const normalized = value.trim().toLowerCase()
  return ['1', 'true', 'yes', 'y'].includes(normalized)
}

async function run(): Promise<void> {
  await AppDataSource.initialize()

  const cfg = {
    business: {
      NAME: process.env.SEED_BUSINESS_NAME ?? 'Nucleo Taller',
      RNC: process.env.SEED_BUSINESS_RNC ?? '000000000',
      DESCRIPTION:
        process.env.SEED_BUSINESS_DESCRIPTION ??
        'Empresa base creada por seed',
      ADDRESS: process.env.SEED_BUSINESS_ADDRESS ?? 'Sin direccion',
      PHONE: process.env.SEED_BUSINESS_PHONE ?? '000-000-0000',
    },
    role: {
      NAME: process.env.SEED_ADMIN_ROLE_NAME ?? 'ADMIN',
      DESCRIPTION:
        process.env.SEED_ADMIN_ROLE_DESCRIPTION ??
        'Administrador del sistema',
    },
    person: {
      NAME: process.env.SEED_ADMIN_NAME ?? 'Admin',
      LAST_NAME: process.env.SEED_ADMIN_LAST_NAME ?? 'Principal',
      IDENTITY_DOCUMENT: process.env.SEED_ADMIN_IDENTITY_DOCUMENT ?? '00000000000',
      GENDER: process.env.SEED_ADMIN_GENDER ?? 'M',
      ADDRESS: process.env.SEED_ADMIN_ADDRESS ?? 'Sin direccion',
    },
    staff: {
      USERNAME: process.env.SEED_ADMIN_USERNAME ?? 'admin',
      PASSWORD: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123*',
      AVATAR: process.env.SEED_ADMIN_AVATAR ?? null,
      FORCE_PASSWORD_UPDATE: parseBoolean(
        process.env.SEED_FORCE_PASSWORD_UPDATE,
        false
      ),
    },
  }

  const defaultMenuOptions: Array<Partial<MenuOption>> = [
    {
      MENU_OPTION_ID: '0-1',
      NAME: 'Dashboard',
      DESCRIPTION: 'Panel principal',
      PATH: '/0-1/dashboard',
      TYPE: 'submenu',
      ORDER: 1,
      STATE: 'A',
    },
    {
      MENU_OPTION_ID: '0-1-1',
      NAME: 'Resumen',
      DESCRIPTION: 'Resumen operativo',
      PATH: '/0-1-1/dashboard/resumen',
      TYPE: 'item',
      PARENT_ID: '0-1',
      ORDER: 1,
      STATE: 'A',
    },
    {
      MENU_OPTION_ID: '0-1-2',
      NAME: 'Reportes',
      DESCRIPTION: 'Reportes operativos',
      PATH: '/0-1-2/dashboard/reportes',
      TYPE: 'item',
      PARENT_ID: '0-1',
      ORDER: 2,
      STATE: 'A',
    },
    {
      MENU_OPTION_ID: '0-2',
      NAME: 'Clientes',
      DESCRIPTION: 'Gestion de clientes',
      PATH: '/0-2/clientes',
      TYPE: 'item',
      ORDER: 2,
      STATE: 'A',
    },
    {
      MENU_OPTION_ID: '0-3',
      NAME: 'Vehiculos',
      DESCRIPTION: 'Gestion de vehiculos',
      PATH: '/0-3/vehiculos',
      TYPE: 'item',
      ORDER: 3,
      STATE: 'A',
    },
    {
      MENU_OPTION_ID: '0-4',
      NAME: 'Ordenes de trabajo',
      DESCRIPTION: 'Gestion de ordenes de trabajo',
      PATH: '/0-4/ordenes-trabajo',
      TYPE: 'item',
      ORDER: 4,
      STATE: 'A',
    },
    {
      MENU_OPTION_ID: '0-5',
      NAME: 'Inventario',
      DESCRIPTION: 'Inventario y control de stock',
      PATH: '/0-5/inventario',
      TYPE: 'submenu',
      ORDER: 5,
      STATE: 'A',
    },
    {
      MENU_OPTION_ID: '0-6',
      NAME: 'Entregas',
      DESCRIPTION: 'Comprobantes y entregas',
      PATH: '/0-6/entregas',
      TYPE: 'item',
      ORDER: 6,
      STATE: 'A',
    },
    {
      MENU_OPTION_ID: '0-8',
      NAME: 'Configuracion',
      DESCRIPTION: 'Catalogos y parametros',
      PATH: '/0-8/configuracion',
      TYPE: 'submenu',
      ORDER: 8,
      STATE: 'A',
    },
    {
      MENU_OPTION_ID: '0-9',
      NAME: 'Seguridad',
      DESCRIPTION: 'Usuarios, roles y bitacora',
      PATH: '/0-9/seguridad',
      TYPE: 'submenu',
      ORDER: 9,
      STATE: 'A',
    },
    {
      MENU_OPTION_ID: '0-5-1',
      NAME: 'Articulos',
      DESCRIPTION: 'Catalogo de articulos',
      PATH: '/0-5-1/inventario/articulos',
      TYPE: 'item',
      PARENT_ID: '0-5',
      ORDER: 1,
      STATE: 'A',
    },
    {
      MENU_OPTION_ID: '0-5-2',
      NAME: 'Movimientos',
      DESCRIPTION: 'Entradas y salidas',
      PATH: '/0-5-2/inventario/movimientos',
      TYPE: 'item',
      PARENT_ID: '0-5',
      ORDER: 2,
      STATE: 'A',
    },
    {
      MENU_OPTION_ID: '0-5-3',
      NAME: 'Reposicion',
      DESCRIPTION: 'Sugerencias de reposicion',
      PATH: '/0-5-3/inventario/reposicion',
      TYPE: 'item',
      PARENT_ID: '0-5',
      ORDER: 3,
      STATE: 'A',
    },
    {
      MENU_OPTION_ID: '0-5-4',
      NAME: 'Ordenes internas',
      DESCRIPTION: 'Historial de ordenes de compra internas',
      PATH: '/0-5-4/inventario/ordenes-internas',
      TYPE: 'item',
      PARENT_ID: '0-5',
      ORDER: 4,
      STATE: 'A',
    },
    {
      MENU_OPTION_ID: '0-8-1',
      NAME: 'Catalogos',
      DESCRIPTION: 'Listas base del sistema',
      PATH: '/0-8-1/configuracion/catalogos',
      TYPE: 'item',
      PARENT_ID: '0-8',
      ORDER: 1,
      STATE: 'A',
    },
    {
      MENU_OPTION_ID: '0-8-2',
      NAME: 'Estados OT',
      DESCRIPTION: 'Gestion de estados de orden',
      PATH: '/0-8-2/configuracion/estados-ot',
      TYPE: 'item',
      PARENT_ID: '0-8',
      ORDER: 2,
      STATE: 'A',
    },
    {
      MENU_OPTION_ID: '0-9-1',
      NAME: 'Usuarios',
      DESCRIPTION: 'Gestion de usuarios',
      PATH: '/0-9-1/seguridad/usuarios',
      TYPE: 'item',
      PARENT_ID: '0-9',
      ORDER: 1,
      STATE: 'A',
    },
    {
      MENU_OPTION_ID: '0-9-2',
      NAME: 'Roles',
      DESCRIPTION: 'Gestion de roles',
      PATH: '/0-9-2/seguridad/roles',
      TYPE: 'item',
      PARENT_ID: '0-9',
      ORDER: 2,
      STATE: 'A',
    },
    {
      MENU_OPTION_ID: '0-9-3',
      NAME: 'Bitacora',
      DESCRIPTION: 'Registro de actividad',
      PATH: '/0-9-3/seguridad/bitacora',
      TYPE: 'item',
      PARENT_ID: '0-9',
      ORDER: 3,
      STATE: 'A',
    },
  ]

  await AppDataSource.transaction(async (manager) => {
    const businessRepository = manager.getRepository(Business)
    const roleRepository = manager.getRepository(Role)
    const personRepository = manager.getRepository(Person)
    const staffRepository = manager.getRepository(Staff)
    const menuOptionRepository = manager.getRepository(MenuOption)

    let business = await businessRepository.findOne({
      where: { RNC: cfg.business.RNC },
    })

    if (!business) {
      business = businessRepository.create({
        ...cfg.business,
        STATE: 'A',
      })
      business = await businessRepository.save(business)
      console.info(`Business creado: ${business.NAME} (${business.BUSINESS_ID})`)
    } else {
      console.info(
        `Business existente: ${business.NAME} (${business.BUSINESS_ID})`
      )
    }

    let adminRole = await roleRepository.findOne({
      where: { NAME: cfg.role.NAME },
    })

    if (!adminRole) {
      adminRole = roleRepository.create({
        ...cfg.role,
        STATE: 'A',
      })
      adminRole = await roleRepository.save(adminRole)
      console.info(`Rol creado: ${adminRole.NAME} (${adminRole.ROLE_ID})`)
    } else {
      if (adminRole.STATE !== 'A') {
        adminRole.STATE = 'A'
        await roleRepository.save(adminRole)
      }
      console.info(`Rol existente: ${adminRole.NAME} (${adminRole.ROLE_ID})`)
    }

    let person = await personRepository.findOne({
      where: {
        BUSINESS_ID: business.BUSINESS_ID,
        IDENTITY_DOCUMENT: cfg.person.IDENTITY_DOCUMENT,
      },
    })

    if (!person) {
      person = personRepository.create({
        ...cfg.person,
        BUSINESS_ID: business.BUSINESS_ID,
        BUSINESS: business,
        STATE: 'A',
      })
      person = await personRepository.save(person)
      console.info(`Persona creada: ${person.NAME} (${person.PERSON_ID})`)
    } else {
      console.info(`Persona existente: ${person.NAME} (${person.PERSON_ID})`)
    }

    let staff = await staffRepository.findOne({
      where: { USERNAME: cfg.staff.USERNAME },
      relations: ['ROLE', 'BUSINESS', 'PERSON'],
    })

    const hashedPassword = await bcrypt.hash(cfg.staff.PASSWORD, 10)

    if (!staff) {
      const newStaff = staffRepository.create({
        USERNAME: cfg.staff.USERNAME,
        PASSWORD: hashedPassword,
        AVATAR: cfg.staff.AVATAR,
        LOGIN_COUNT: 0,
        LAST_LOGIN: null,
        STATE: 'A',
        BUSINESS_ID: business.BUSINESS_ID,
        BUSINESS: business,
        ROLE_ID: adminRole.ROLE_ID,
        ROLE: adminRole,
        PERSON_ID: person.PERSON_ID,
        PERSON: person,
      })

      const savedStaff = await staffRepository.save(newStaff)
      staff = savedStaff
      console.info(
        `Usuario admin creado: ${savedStaff.USERNAME} (${savedStaff.STAFF_ID})`
      )
    }

    let updated = false

    if (staff && staff.BUSINESS_ID !== business.BUSINESS_ID) {
      staff.BUSINESS_ID = business.BUSINESS_ID
      staff.BUSINESS = business
      updated = true
    }
    if (staff && staff.ROLE_ID !== adminRole.ROLE_ID) {
      staff.ROLE_ID = adminRole.ROLE_ID
      staff.ROLE = adminRole
      updated = true
    }
    if (staff && staff.PERSON_ID !== person.PERSON_ID) {
      staff.PERSON_ID = person.PERSON_ID
      staff.PERSON = person
      updated = true
    }
    if (staff && staff.STATE !== 'A') {
      staff.STATE = 'A'
      updated = true
    }
    if (staff && cfg.staff.FORCE_PASSWORD_UPDATE) {
      staff.PASSWORD = hashedPassword
      updated = true
    }

    if (staff && updated) {
      await staffRepository.save(staff)
      console.info(
        `Usuario admin actualizado: ${staff.USERNAME} (${staff.STAFF_ID})`
      )
    } else if (staff) {
      console.info(`Usuario admin existente: ${staff.USERNAME} (${staff.STAFF_ID})`)
    }

    await manager.query(`
      DELETE FROM "MENU_OPTION"
      WHERE "MENU_OPTION_ID" LIKE 'MNU_%'
    `)

    const existingMenuOptions = await menuOptionRepository.find()
    const existingById = new Map(
      existingMenuOptions.map((item) => [item.MENU_OPTION_ID, item])
    )

    for (const option of defaultMenuOptions) {
      const exists = existingById.get(option.MENU_OPTION_ID as string)
      if (!exists) {
        const created = menuOptionRepository.create(option as MenuOption)
        await menuOptionRepository.save(created)
        continue
      }

      menuOptionRepository.merge(exists, option)
      await menuOptionRepository.save(exists)
    }

    if (adminRole?.ROLE_ID) {
      for (const option of defaultMenuOptions) {
        await manager.query(
          `
            INSERT INTO "MENU_OPTIONS_X_ROLES" ("MENU_OPTION_ID", "ROLE_ID", "STATE")
            VALUES ($1, $2, 'A')
            ON CONFLICT ("MENU_OPTION_ID", "ROLE_ID")
            DO UPDATE SET "STATE" = EXCLUDED."STATE"
          `,
          [option.MENU_OPTION_ID, adminRole.ROLE_ID]
        )
      }
      console.info(
        `Menu base vinculado al rol '${adminRole.NAME}' (${adminRole.ROLE_ID})`
      )
    }
  })
}

run()
  .then(async () => {
    console.info('Seed finalizado correctamente.')
    await AppDataSource.destroy()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('Error ejecutando seed:', error)
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy()
    }
    process.exit(1)
  })
