import bcrypt from 'bcrypt'
import { Repository } from 'typeorm'
import { BaseService, CatchServiceError } from './base.service'
import { Role } from '@entity/Role'
import { Person } from '@entity/Person'
import { Staff } from '@entity/Staff'
import { Contact, ContactType, ContactUsage } from '@entity/Contact'
import {
  AdvancedCondition,
  ApiResponse,
  Pagination,
  SessionInfo,
} from '@src/types/api.types'
import {
  BadRequestError,
  DbConflictError,
  NotFoundError,
  UnAuthorizedError,
} from '@api/errors/http.error'
import { paginatedQuery } from '@src/helpers/query-utils'
import { whereClauseBuilder } from '@src/helpers/where-clausure-builder'
import { preparePaginationConditions } from '@src/helpers/prepare-pagination-conditions'
import {
  ContactInput,
  contactsFromLegacyFields,
  getPrimaryContactValue,
  normalizeContacts,
  NormalizedContact,
} from '@helpers/contact-utils'
import { publishEmailToQueue } from './email/email-producer.service'

type CreateStaffAccessPayload = {
  NAME?: string
  LAST_NAME?: string | null
  IDENTITY_DOCUMENT?: string | null
  BIRTH_DATE?: Date | string | null
  GENDER?: string | null
  ADDRESS?: string | null
  CONTACTS?: ContactInput[]
  EMAIL?: string | null
  PHONE?: string | null
  USERNAME?: string
  ROLE_ID?: number
  AVATAR?: string | null
  STATE?: string
  PASSWORD?: string
}

type UpdateStaffAccessPayload = {
  USER_ID?: number
  USERNAME?: string
  ROLE_ID?: number
  NAME?: string
  LAST_NAME?: string | null
  IDENTITY_DOCUMENT?: string | null
  BIRTH_DATE?: Date | string | null
  GENDER?: string | null
  ADDRESS?: string | null
  CONTACTS?: ContactInput[]
  EMAIL?: string | null
  PHONE?: string | null
  STATE?: string
  AVATAR?: string | null
}

type ChangeStaffPasswordPayload = {
  OLD_PASSWORD: string
  NEW_PASSWORD: string
  USER_ID: number
}

export type StaffContactResponse = {
  CONTACT_ID: number
  TYPE: ContactType
  USAGE: ContactUsage
  VALUE: string
  IS_PRIMARY: boolean
}

export type StaffAccessResponse = {
  USER_ID: number
  USERNAME: string
  NAME: string
  LAST_NAME: string
  AVATAR: string
  IS_ACTIVE: boolean
  ROLES: string
  CREATED_AT: string
  STATE: string
  IDENTITY_DOCUMENT: string
  EMAIL: string
  PHONE: string
  CONTACTS: StaffContactResponse[]
  BIRTH_DATE: string
  GENDER: string
  ADDRESS: string
  STAFF_ID: number
  ROLE_ID: number
}

type StaffAccessPaginationRow = {
  USER_ID: number | string
  USERNAME: string | null
  NAME: string | null
  LAST_NAME: string | null
  AVATAR: string | null
  ROLES: string | null
  CREATED_AT: Date | string | null
  STATE: string | null
  IDENTITY_DOCUMENT: string | null
  BIRTH_DATE: Date | string | null
  GENDER: string | null
  ADDRESS: string | null
  PERSON_ID: number | string
  ROLE_ID: number | string
}

export class StaffService extends BaseService {
  @CatchServiceError()
  async createAccess(
    payload: CreateStaffAccessPayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<StaffAccessResponse>> {
    const name = payload.NAME?.trim()
    const username = payload.USERNAME?.trim()
    const roleId = Number(payload.ROLE_ID)
    const identityDocument = payload.IDENTITY_DOCUMENT?.trim() || null
    const contacts = this.resolveContactsFromPayload(payload, true)

    if (!name || !roleId || !username) {
      throw new BadRequestError(
        'Los campos NAME, ROLE_ID y USERNAME son requeridos.'
      )
    }

    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID

    const plainPassword =
      payload.PASSWORD?.trim() ||
      process.env.DEFAULT_USER_PASSWORD ||
      'Temp123*'
    const hashedPassword = await bcrypt.hash(plainPassword, 10)

    let createdStaffId = 0

    await this.datasource.transaction(async (manager) => {
      const personRepo = manager.getRepository(Person)
      const staffRepo = manager.getRepository(Staff)
      const roleRepo = manager.getRepository(Role)
      const contactRepo = manager.getRepository(Contact)

      await this.assertRoleExistsWithRepo(roleRepo, roleId)
      await this.assertUsernameAvailableWithRepo(staffRepo, username)
      await this.assertIdentityDocumentAvailableWithRepo(
        personRepo,
        businessId,
        identityDocument
      )

      const person = personRepo.create({
        BUSINESS_ID: businessId,
        NAME: name,
        LAST_NAME: payload.LAST_NAME?.trim() || null,
        IDENTITY_DOCUMENT: identityDocument,
        BIRTH_DATE: this.normalizeDate(payload.BIRTH_DATE),
        GENDER: payload.GENDER?.trim() || null,
        ADDRESS: payload.ADDRESS?.trim() || null,
        STATE: 'A',
        CREATED_BY: sessionInfo.userId,
      })
      const savedPerson = await personRepo.save(person)

      await this.replaceContacts(
        contactRepo,
        savedPerson.PERSON_ID,
        contacts,
        sessionInfo.userId
      )

      const staff = staffRepo.create({
        BUSINESS_ID: businessId,
        PERSON_ID: savedPerson.PERSON_ID,
        ROLE_ID: roleId,
        USERNAME: username,
        PASSWORD: hashedPassword,
        AVATAR: payload.AVATAR || null,
        LOGIN_COUNT: 0,
        LAST_LOGIN: null,
        STATE: payload.STATE || 'A',
        CREATED_BY: sessionInfo.userId,
      })
      const savedStaff = await staffRepo.save(staff)

      createdStaffId = savedStaff.STAFF_ID
    })

    const staff = await this.getAccessById(createdStaffId)

    try {
      const defaultEmail = payload.CONTACTS?.find(
        (c) => c.TYPE === ContactType.EMAIL && c.IS_PRIMARY
      )
      if (defaultEmail?.VALUE)
        await publishEmailToQueue({
          to: defaultEmail.VALUE,
          subject: 'Te damos la bienvenida',
          templateName: 'welcome',
          record: {
            ...staff,
            username,
            password: plainPassword,
            url: process.env.APP_URL,
          },
          text: '',
        })
    } catch (error) {
      console.error({ error })
    }

    return this.success({
      message: 'Acceso creado exitosamente.',
      data: this.mapAccess(staff, staff.PERSON?.CONTACTS || []),
    })
  }

  @CatchServiceError()
  async updateAccess(
    payload: UpdateStaffAccessPayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<StaffAccessResponse>> {
    const currentAccess = await this.findAccess(
      payload.USER_ID,
      payload.USERNAME
    )
    const targetStaffId = currentAccess.STAFF_ID

    await this.datasource.transaction(async (manager) => {
      const staffRepo = manager.getRepository(Staff)
      const personRepo = manager.getRepository(Person)
      const roleRepo = manager.getRepository(Role)
      const contactRepo = manager.getRepository(Contact)

      const staff = await staffRepo.findOne({
        where: { STAFF_ID: targetStaffId },
        relations: ['PERSON'],
      })

      if (!staff) {
        throw new NotFoundError('Acceso no encontrado.')
      }

      if (payload.USERNAME && payload.USERNAME.trim() !== staff.USERNAME) {
        await this.assertUsernameAvailableWithRepo(
          staffRepo,
          payload.USERNAME.trim(),
          staff.STAFF_ID
        )
        staff.USERNAME = payload.USERNAME.trim()
      }

      if (payload.ROLE_ID) {
        await this.assertRoleExistsWithRepo(roleRepo, payload.ROLE_ID)
        staff.ROLE_ID = payload.ROLE_ID
      }

      if (payload.STATE) {
        staff.STATE = payload.STATE
      }

      if (payload.AVATAR !== undefined) {
        staff.AVATAR = payload.AVATAR
      }

      const person = staff.PERSON
      if (person) {
        const personBusinessId =
          person.BUSINESS_ID ||
          (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
        const identityDocument = payload.IDENTITY_DOCUMENT?.trim() || null

        if (payload.NAME !== undefined) {
          person.NAME = payload.NAME?.trim() || person.NAME
        }
        if (payload.LAST_NAME !== undefined) {
          person.LAST_NAME = payload.LAST_NAME?.trim() || null
        }
        if (payload.IDENTITY_DOCUMENT !== undefined) {
          await this.assertIdentityDocumentAvailableWithRepo(
            personRepo,
            personBusinessId,
            identityDocument,
            person.PERSON_ID
          )
          person.IDENTITY_DOCUMENT = identityDocument
        }
        if (payload.BIRTH_DATE !== undefined) {
          person.BIRTH_DATE = this.normalizeDate(payload.BIRTH_DATE)
        }
        if (payload.GENDER !== undefined) {
          person.GENDER = payload.GENDER?.trim() || null
        }
        if (payload.ADDRESS !== undefined) {
          person.ADDRESS = payload.ADDRESS?.trim() || null
        }

        person.UPDATED_BY = sessionInfo.userId
        await personRepo.save(person)

        const contacts = this.resolveContactsFromPayload(payload)
        if (contacts !== undefined) {
          await this.replaceContacts(
            contactRepo,
            person.PERSON_ID,
            contacts,
            sessionInfo.userId
          )
        }
      }

      staff.UPDATED_BY = sessionInfo.userId
      await staffRepo.save(staff)
    })

    const fullStaff = await this.getAccessById(targetStaffId)

    return this.success({
      message: 'Acceso actualizado exitosamente.',
      data: this.mapAccess(fullStaff, fullStaff.PERSON?.CONTACTS || []),
    })
  }

  @CatchServiceError()
  async getAccessByUsername(
    username: string
  ): Promise<ApiResponse<StaffAccessResponse>> {
    const staff = await this.staffRepository.findOne({
      where: { USERNAME: username },
      relations: ['PERSON', 'PERSON.CONTACTS', 'ROLE'],
    })

    if (!staff) {
      throw new NotFoundError(`Acceso '${username}' no encontrado.`)
    }

    return this.success({
      data: this.mapAccess(staff, staff.PERSON?.CONTACTS || []),
    })
  }

  @CatchServiceError()
  async getAccessPagination(
    conditions: AdvancedCondition<Staff>[] = [],
    pagination: Pagination
  ): Promise<ApiResponse<StaffAccessResponse[]>> {
    const normalizedConditions = preparePaginationConditions(conditions, [
      'USER_ID',
      'USERNAME',
      'NAME',
      'LAST_NAME',
      'IDENTITY_DOCUMENT',
      'ROLES',
      'STATE',
    ])
    const { whereClause, values } = whereClauseBuilder(
      normalizedConditions as AdvancedCondition<Record<string, unknown>>[]
    )
    const statement = `
      SELECT
        "USER_ID",
        "USERNAME",
        "NAME",
        "LAST_NAME",
        "AVATAR",
        "ROLES",
        "CREATED_AT",
        "STATE",
        "IDENTITY_DOCUMENT",
        "BIRTH_DATE",
        "GENDER",
        "ADDRESS",
        "PERSON_ID",
        "ROLE_ID"
      FROM (
        SELECT
          "u"."STAFF_ID" AS "USER_ID",
          "u"."USERNAME" AS "USERNAME",
          "u"."AVATAR" AS "AVATAR",
          "u"."STATE" AS "STATE",
          "u"."CREATED_AT" AS "CREATED_AT",
          "u"."ROLE_ID" AS "ROLE_ID",
          "p"."PERSON_ID" AS "PERSON_ID",
          "p"."NAME" AS "NAME",
          "p"."LAST_NAME" AS "LAST_NAME",
          "p"."IDENTITY_DOCUMENT" AS "IDENTITY_DOCUMENT",
          "p"."BIRTH_DATE" AS "BIRTH_DATE",
          "p"."GENDER" AS "GENDER",
          "p"."ADDRESS" AS "ADDRESS",
          "r"."NAME" AS "ROLES"
        FROM "STAFF" "u"
        INNER JOIN "PERSON" "p"
          ON "p"."PERSON_ID" = "u"."PERSON_ID"
        LEFT JOIN "ROLES" "r"
          ON "r"."ROLE_ID" = "u"."ROLE_ID"
      ) AS "staff_access_rows"
      ${whereClause}
      ORDER BY "USER_ID" DESC
    `

    const [data, metadata] = await paginatedQuery<StaffAccessPaginationRow>({
      statement,
      values,
      pagination,
    })

    const personIds = data.map((item) => Number(item.PERSON_ID)).filter(Boolean)
    const contactsByPerson = await this.getContactsByPersonIds(personIds)

    const rows = data.map((item) =>
      this.mapPaginatedAccess(
        item,
        contactsByPerson.get(Number(item.PERSON_ID)) || []
      )
    )

    return this.success({ data: rows, metadata })
  }

  @CatchServiceError()
  async changeAccessPassword(
    payload: ChangeStaffPasswordPayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse> {
    const staff = await this.staffRepository.findOneBy({
      STAFF_ID: payload.USER_ID,
    })

    if (!staff) {
      throw new NotFoundError(
        `Acceso con id '${payload.USER_ID}' no encontrado.`
      )
    }

    const isCurrentValid = await bcrypt.compare(
      payload.OLD_PASSWORD,
      staff.PASSWORD
    )
    if (!isCurrentValid) {
      throw new UnAuthorizedError('La contraseña actual no es correcta.')
    }

    const isSamePassword = await bcrypt.compare(
      payload.NEW_PASSWORD,
      staff.PASSWORD
    )
    if (isSamePassword) {
      throw new BadRequestError(
        'La nueva contraseña debe ser diferente a la actual.'
      )
    }

    staff.PASSWORD = await bcrypt.hash(payload.NEW_PASSWORD, 10)
    staff.UPDATED_BY = sessionInfo.userId
    await this.staffRepository.save(staff)

    return this.success({ message: 'Contraseña actualizada exitosamente.' })
  }

  private async assertRoleExistsWithRepo(
    roleRepo: Repository<Role>,
    roleId: number
  ): Promise<void> {
    const role = await roleRepo.findOneBy({
      ROLE_ID: roleId,
      STATE: 'A' as never,
    })

    if (!role) {
      throw new NotFoundError(`Rol con id '${roleId}' no encontrado.`)
    }
  }

  private async assertUsernameAvailableWithRepo(
    staffRepo: Repository<Staff>,
    username: string,
    currentStaffId?: number
  ): Promise<void> {
    const query = staffRepo
      .createQueryBuilder('u')
      .where('LOWER(u.USERNAME) = LOWER(:username)', { username })

    if (currentStaffId) {
      query.andWhere('u.STAFF_ID != :currentStaffId', { currentStaffId })
    }

    const exists = await query.getOne()

    if (exists) {
      throw new DbConflictError(`El usuario '${username}' ya existe.`)
    }
  }

  private async assertIdentityDocumentAvailableWithRepo(
    personRepo: Repository<Person>,
    businessId: number,
    identityDocument: string | null,
    currentPersonId?: number
  ): Promise<void> {
    if (!identityDocument) {
      return
    }

    const duplicated = await personRepo.findOne({
      where: {
        BUSINESS_ID: businessId,
        IDENTITY_DOCUMENT: identityDocument,
      },
    })

    if (duplicated && duplicated.PERSON_ID !== currentPersonId) {
      throw new DbConflictError(
        `La cédula '${identityDocument}' ya está registrada.`
      )
    }
  }

  private normalizeDate(value?: Date | string | null): Date | null {
    if (!value) return null
    const date = value instanceof Date ? value : new Date(value)

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestError('BIRTH_DATE no tiene un formato válido.')
    }

    return date
  }

  private resolveContactsFromPayload(
    payload: CreateStaffAccessPayload | UpdateStaffAccessPayload,
    forceEmptyArray = false
  ): NormalizedContact[] | undefined {
    if (Array.isArray(payload.CONTACTS)) {
      return normalizeContacts(payload.CONTACTS)
    }

    const hasLegacyFields =
      payload.EMAIL !== undefined || payload.PHONE !== undefined

    if (hasLegacyFields) {
      return normalizeContacts(
        contactsFromLegacyFields({ EMAIL: payload.EMAIL, PHONE: payload.PHONE })
      )
    }

    return forceEmptyArray ? [] : undefined
  }

  private async replaceContacts(
    contactRepo: Repository<Contact>,
    personId: number,
    contacts: NormalizedContact[],
    userId: number
  ): Promise<void> {
    await contactRepo.delete({ PERSON_ID: personId })

    if (!contacts.length) {
      return
    }

    const rows = contacts.map((contact) =>
      contactRepo.create({
        PERSON_ID: personId,
        TYPE: contact.TYPE,
        USAGE: contact.USAGE,
        VALUE: contact.VALUE,
        IS_PRIMARY: contact.IS_PRIMARY,
        STATE: 'A',
        CREATED_BY: userId,
      })
    )

    await contactRepo.save(rows)
  }

  private async findAccess(userId?: number, username?: string): Promise<Staff> {
    if (!userId && !username) {
      throw new BadRequestError('Debe enviar USER_ID o USERNAME.')
    }

    const where = userId ? { STAFF_ID: userId } : { USERNAME: username }
    const staff = await this.staffRepository.findOne({
      where,
      relations: ['PERSON', 'ROLE'],
    })

    if (!staff) {
      throw new NotFoundError('Acceso no encontrado.')
    }

    return staff
  }

  private async getAccessById(staffId: number): Promise<Staff> {
    const staff = await this.staffRepository.findOne({
      where: { STAFF_ID: staffId },
      relations: ['PERSON', 'PERSON.CONTACTS', 'ROLE'],
    })

    if (!staff) {
      throw new NotFoundError(`Acceso con id '${staffId}' no encontrado.`)
    }

    return staff
  }

  private mapAccess(
    staff: Staff,
    contacts: Contact[] = []
  ): StaffAccessResponse {
    const person = staff.PERSON as Person
    const role = staff.ROLE as Role

    return {
      USER_ID: staff.STAFF_ID,
      USERNAME: staff.USERNAME,
      NAME: person?.NAME || '',
      LAST_NAME: person?.LAST_NAME || '',
      AVATAR: staff.AVATAR || '',
      IS_ACTIVE: staff.STATE === 'A',
      ROLES: role?.NAME || '',
      CREATED_AT: staff.CREATED_AT?.toISOString?.() || '',
      STATE: staff.STATE || 'A',
      IDENTITY_DOCUMENT: person?.IDENTITY_DOCUMENT || '',
      EMAIL: getPrimaryContactValue(contacts, ContactType.EMAIL),
      PHONE:
        getPrimaryContactValue(contacts, ContactType.PHONE) ||
        getPrimaryContactValue(contacts, ContactType.WHATSAPP),
      CONTACTS: contacts.map((contact) => ({
        CONTACT_ID: contact.CONTACT_ID,
        TYPE: contact.TYPE,
        USAGE: contact.USAGE,
        VALUE: contact.VALUE,
        IS_PRIMARY: Boolean(contact.IS_PRIMARY),
      })),
      BIRTH_DATE: person?.BIRTH_DATE?.toISOString?.() || '',
      GENDER: person?.GENDER || '',
      ADDRESS: person?.ADDRESS || '',
      STAFF_ID: person?.PERSON_ID || 0,
      ROLE_ID: staff.ROLE_ID,
    }
  }

  private mapPaginatedAccess(
    staff: StaffAccessPaginationRow,
    contacts: Contact[] = []
  ): StaffAccessResponse {
    return {
      USER_ID: Number(staff.USER_ID),
      USERNAME: staff.USERNAME || '',
      NAME: staff.NAME || '',
      LAST_NAME: staff.LAST_NAME || '',
      AVATAR: staff.AVATAR || '',
      IS_ACTIVE: staff.STATE === 'A',
      ROLES: staff.ROLES || '',
      CREATED_AT: this.toIsoString(staff.CREATED_AT),
      STATE: staff.STATE || 'A',
      IDENTITY_DOCUMENT: staff.IDENTITY_DOCUMENT || '',
      EMAIL: getPrimaryContactValue(contacts, ContactType.EMAIL),
      PHONE:
        getPrimaryContactValue(contacts, ContactType.PHONE) ||
        getPrimaryContactValue(contacts, ContactType.WHATSAPP),
      CONTACTS: contacts.map((contact) => ({
        CONTACT_ID: contact.CONTACT_ID,
        TYPE: contact.TYPE,
        USAGE: contact.USAGE,
        VALUE: contact.VALUE,
        IS_PRIMARY: Boolean(contact.IS_PRIMARY),
      })),
      BIRTH_DATE: this.toIsoString(staff.BIRTH_DATE),
      GENDER: staff.GENDER || '',
      ADDRESS: staff.ADDRESS || '',
      STAFF_ID: Number(staff.PERSON_ID),
      ROLE_ID: Number(staff.ROLE_ID),
    }
  }

  private toIsoString(value?: Date | string | null): string {
    if (!value) return ''

    if (typeof value === 'string') {
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? value : date.toISOString()
    }

    return value.toISOString()
  }

  private async getContactsByPersonIds(
    personIds: number[]
  ): Promise<Map<number, Contact[]>> {
    if (!personIds.length) {
      return new Map<number, Contact[]>()
    }

    const contacts = await this.contactRepository
      .createQueryBuilder('c')
      .where('c.PERSON_ID IN (:...personIds)', { personIds })
      .andWhere('c.STATE = :state', { state: 'A' })
      .orderBy('c.IS_PRIMARY', 'DESC')
      .addOrderBy('c.CONTACT_ID', 'ASC')
      .getMany()

    const map = new Map<number, Contact[]>()

    contacts.forEach((contact) => {
      const rows = map.get(contact.PERSON_ID) || []
      rows.push(contact)
      map.set(contact.PERSON_ID, rows)
    })

    return map
  }
}
