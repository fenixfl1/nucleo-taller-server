import { Repository, SelectQueryBuilder } from 'typeorm'
import { BaseService, CatchServiceError } from './base.service'
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
} from '@api/errors/http.error'
import { paginate } from '@src/helpers/query-utils'
import {
  ContactInput,
  contactsFromLegacyFields,
  getPrimaryContactValue,
  normalizeContacts,
  NormalizedContact,
} from '@helpers/contact-utils'

type PersonPayload = {
  PERSON_ID?: number
  STAFF_ID?: number
  NAME?: string
  LAST_NAME?: string | null
  IDENTITY_DOCUMENT?: string | null
  BIRTH_DATE?: Date | string | null
  GENDER?: string | null
  ADDRESS?: string | null
  STATE?: string
  CONTACTS?: ContactInput[]
  EMAIL?: string | null
  PHONE?: string | null
}

export type PersonContactResponse = {
  CONTACT_ID: number
  TYPE: ContactType
  USAGE: ContactUsage
  VALUE: string
  IS_PRIMARY: boolean
}

export type PersonResponse = {
  PERSON_ID: number
  STAFF_ID: number
  NAME: string
  LAST_NAME: string
  IDENTITY_DOCUMENT: string
  BIRTH_DATE?: Date | null
  GENDER: string
  ADDRESS: string
  EMAIL: string
  PHONE: string
  CONTACTS: PersonContactResponse[]
  USER_ID: number | null
  STATE: string
  CREATED_AT?: Date | null
}

export type IdentityDocumentValidationResult = {
  identityDocument: string
  isValidFormat: boolean
  isInUse: boolean
}

export class PersonService extends BaseService {
  @CatchServiceError()
  async create(
    payload: PersonPayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<PersonResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const identityDocument = payload.IDENTITY_DOCUMENT?.trim() || null
    const contacts = this.resolveContactsFromPayload(payload, true)

    let createdPersonId = 0

    await this.datasource.transaction(async (manager) => {
      const personRepo = manager.getRepository(Person)
      const contactRepo = manager.getRepository(Contact)

      await this.assertIdentityDocumentAvailable(
        personRepo,
        businessId,
        identityDocument
      )

      const person = personRepo.create({
        BUSINESS_ID: businessId,
        NAME: payload.NAME?.trim() || '',
        LAST_NAME: payload.LAST_NAME?.trim() || null,
        IDENTITY_DOCUMENT: identityDocument,
        BIRTH_DATE: this.normalizeDate(payload.BIRTH_DATE),
        GENDER: payload.GENDER?.trim() || null,
        ADDRESS: payload.ADDRESS?.trim() || null,
        STATE: payload.STATE || 'A',
        CREATED_BY: sessionInfo.userId,
      })

      const savedPerson = await personRepo.save(person)
      createdPersonId = savedPerson.PERSON_ID

      await this.replaceContacts(
        contactRepo,
        createdPersonId,
        contacts,
        sessionInfo.userId
      )
    })

    return this.success({
      data: await this.buildPersonResponse(createdPersonId),
    })
  }

  @CatchServiceError()
  async update(
    payload: PersonPayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<PersonResponse>> {
    const personId = Number(payload.PERSON_ID || payload.STAFF_ID)

    if (!personId) {
      throw new BadRequestError('El campo PERSON_ID es requerido.')
    }

    await this.datasource.transaction(async (manager) => {
      const personRepo = manager.getRepository(Person)
      const contactRepo = manager.getRepository(Contact)

      const person = await personRepo.findOneBy({ PERSON_ID: personId })

      if (!person) {
        throw new NotFoundError(`Persona con id '${personId}' no encontrada.`)
      }

      const identityDocument = payload.IDENTITY_DOCUMENT?.trim() || null

      if (payload.IDENTITY_DOCUMENT !== undefined) {
        await this.assertIdentityDocumentAvailable(
          personRepo,
          person.BUSINESS_ID,
          identityDocument,
          person.PERSON_ID
        )
        person.IDENTITY_DOCUMENT = identityDocument
      }

      if (typeof payload.NAME === 'string') person.NAME = payload.NAME.trim()
      if (payload.LAST_NAME !== undefined)
        person.LAST_NAME = payload.LAST_NAME?.trim() || null
      if (payload.BIRTH_DATE !== undefined)
        person.BIRTH_DATE = this.normalizeDate(payload.BIRTH_DATE)
      if (payload.GENDER !== undefined) person.GENDER = payload.GENDER || null
      if (payload.ADDRESS !== undefined)
        person.ADDRESS = payload.ADDRESS?.trim() || null
      if (payload.STATE) person.STATE = payload.STATE

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
    })

    return this.success({
      data: await this.buildPersonResponse(personId),
    })
  }

  @CatchServiceError()
  async getOne(personId: number): Promise<ApiResponse<PersonResponse>> {
    return this.success({
      data: await this.buildPersonResponse(personId),
    })
  }

  @CatchServiceError()
  async getPagination(
    conditions: AdvancedCondition<Person>[] = [],
    pagination: Pagination
  ): Promise<ApiResponse<PersonResponse[]>> {
    const qb = this.personRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.STAFF', 'u')

    if (conditions.length) {
      this.applyConditions(qb, conditions)
    }

    qb.orderBy('"p"."PERSON_ID"', 'DESC')

    const { data, metadata } = await paginate(qb, pagination)

    const personIds = data.map((item) => item.PERSON_ID)
    const contactsByPerson = await this.getContactsByPersonIds(personIds)

    const rows = data.map((person) =>
      this.mapPersonWithAccess(person, contactsByPerson.get(person.PERSON_ID) || [])
    )

    return this.success({ data: rows, metadata })
  }

  @CatchServiceError()
  async validateIdentityDocument(
    identityDocument: string
  ): Promise<ApiResponse<IdentityDocumentValidationResult>> {
    const normalized = identityDocument.trim()
    const isValidFormat = /^[0-9]{11}$/.test(normalized)

    const count = await this.personRepository.countBy({
      IDENTITY_DOCUMENT: normalized,
    })

    return this.success({
      data: {
        identityDocument: normalized,
        isValidFormat,
        isInUse: count > 0,
      },
    })
  }

  private async buildPersonResponse(personId: number): Promise<PersonResponse> {
    const person = await this.personRepository.findOne({
      where: { PERSON_ID: personId },
      relations: ['STAFF', 'CONTACTS'],
    })

    if (!person) {
      throw new NotFoundError(`Persona con id '${personId}' no encontrada.`)
    }

    return this.mapPersonWithAccess(person, person.CONTACTS || [])
  }

  private mapPersonWithAccess(
    person: Person,
    contacts: Contact[] = []
  ): PersonResponse {
    const linkedAccess = person.STAFF as Staff | undefined

    return {
      PERSON_ID: person.PERSON_ID,
      STAFF_ID: person.PERSON_ID,
      NAME: person.NAME,
      LAST_NAME: person.LAST_NAME || '',
      IDENTITY_DOCUMENT: person.IDENTITY_DOCUMENT || '',
      BIRTH_DATE: person.BIRTH_DATE,
      GENDER: person.GENDER || '',
      ADDRESS: person.ADDRESS || '',
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
      USER_ID: linkedAccess?.STAFF_ID ?? null,
      STATE: person.STATE || 'A',
      CREATED_AT: person.CREATED_AT,
    }
  }

  private applyConditions(
    qb: SelectQueryBuilder<Person>,
    conditions: AdvancedCondition<Person>[]
  ): void {
    conditions.forEach((condition, index) => {
      const operator = (condition.operator || '').toUpperCase()
      const paramName = `param_${index}`
      const fields = Array.isArray(condition.field)
        ? condition.field.map((item) => String(item))
        : [String(condition.field)]
      const columns = fields.map((field) => this.resolveColumn(field))
      const expression =
        columns.length > 1 ? columns.join(` || ' ' || `) : columns[0]

      switch (operator) {
        case '=':
        case '!=':
        case '<':
        case '<=':
        case '>':
        case '>=':
          qb.andWhere(`${expression} ${operator} :${paramName}`, {
            [paramName]: condition.value,
          })
          break
        case 'LIKE':
          qb.andWhere(
            `UPPER(unaccent(${expression}::text)) LIKE UPPER(:${paramName})`,
            {
              [paramName]: `%${condition.value}%`,
            }
          )
          break
        case 'IN':
        case 'NOT IN':
          if (!Array.isArray(condition.value)) {
            throw new BadRequestError(
              `El operador '${operator}' requiere un arreglo de valores.`
            )
          }
          qb.andWhere(`${columns[0]} ${operator} (:...${paramName})`, {
            [paramName]: condition.value,
          })
          break
        case 'BETWEEN':
          if (!Array.isArray(condition.value) || condition.value.length !== 2) {
            throw new BadRequestError(
              "El operador 'BETWEEN' requiere exactamente dos valores."
            )
          }
          qb.andWhere(
            `${columns[0]} BETWEEN :${paramName}_start AND :${paramName}_end`,
            {
              [`${paramName}_start`]: condition.value[0],
              [`${paramName}_end`]: condition.value[1],
            }
          )
          break
        case 'IS NULL':
          qb.andWhere(`${columns[0]} IS NULL`)
          break
        case 'IS NOT NULL':
          qb.andWhere(`${columns[0]} IS NOT NULL`)
          break
        default:
          throw new BadRequestError(
            `Operador '${condition.operator}' no soportado.`
          )
      }
    })
  }

  private resolveColumn(field: string): string {
    const normalized = field.toUpperCase()

    if (normalized === 'PERSON_ID') return '"p"."PERSON_ID"'
    if (normalized === 'STAFF_ID') return '"p"."PERSON_ID"'
    if (normalized === 'USER_ID') return '"u"."STAFF_ID"'
    if (normalized === 'USERNAME') return '"u"."USERNAME"'
    if (normalized === 'ROLE_ID') return '"u"."ROLE_ID"'

    return `"p"."${normalized}"`
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
    payload: PersonPayload,
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

  private async assertIdentityDocumentAvailable(
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
