import { Repository } from 'typeorm'
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

type PersonPaginationRow = {
  PERSON_ID: number
  NAME: string
  LAST_NAME: string | null
  IDENTITY_DOCUMENT: string | null
  BIRTH_DATE: Date | null
  GENDER: string | null
  ADDRESS: string | null
  STATE: string | null
  CREATED_AT: Date | null
  USER_ID: number | null
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
    const normalizedConditions = preparePaginationConditions(conditions, [
      'NAME',
      'LAST_NAME',
      'IDENTITY_DOCUMENT',
      'ADDRESS',
      'USERNAME',
    ])
    const { whereClause, values } = whereClauseBuilder(
      normalizedConditions as AdvancedCondition<Record<string, unknown>>[]
    )
    const statement = `
      SELECT
        "PERSON_ID",
        "NAME",
        "LAST_NAME",
        "IDENTITY_DOCUMENT",
        "BIRTH_DATE",
        "GENDER",
        "ADDRESS",
        "STATE",
        "CREATED_AT",
        "USER_ID"
      FROM (
        SELECT
          "p"."PERSON_ID" AS "PERSON_ID",
          "p"."BUSINESS_ID" AS "BUSINESS_ID",
          "p"."NAME" AS "NAME",
          "p"."LAST_NAME" AS "LAST_NAME",
          "p"."IDENTITY_DOCUMENT" AS "IDENTITY_DOCUMENT",
          "p"."BIRTH_DATE" AS "BIRTH_DATE",
          "p"."GENDER" AS "GENDER",
          "p"."ADDRESS" AS "ADDRESS",
          "p"."STATE" AS "STATE",
          "p"."CREATED_AT" AS "CREATED_AT",
          "u"."STAFF_ID" AS "USER_ID",
          "u"."USERNAME" AS "USERNAME",
          "u"."ROLE_ID" AS "ROLE_ID"
        FROM "PERSON" "p"
        LEFT JOIN "STAFF" "u"
          ON "u"."PERSON_ID" = "p"."PERSON_ID"
      ) AS "person_rows"
      ${whereClause}
      ORDER BY "PERSON_ID" DESC
    `

    const [data, metadata] = await paginatedQuery<PersonPaginationRow>({
      statement,
      values,
      pagination,
    })

    const personIds = data.map((item) => item.PERSON_ID)
    const contactsByPerson = await this.getContactsByPersonIds(personIds)

    const rows = data.map((person) =>
      this.mapPaginatedRow(person, contactsByPerson.get(person.PERSON_ID) || [])
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

  private mapPaginatedRow(
    person: PersonPaginationRow,
    contacts: Contact[] = []
  ): PersonResponse {
    return {
      PERSON_ID: Number(person.PERSON_ID),
      STAFF_ID: Number(person.PERSON_ID),
      NAME: person.NAME || '',
      LAST_NAME: person.LAST_NAME || '',
      IDENTITY_DOCUMENT: person.IDENTITY_DOCUMENT || '',
      BIRTH_DATE: person.BIRTH_DATE || null,
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
      USER_ID: person.USER_ID ? Number(person.USER_ID) : null,
      STATE: person.STATE || 'A',
      CREATED_AT: person.CREATED_AT || null,
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
