import { BaseService, CatchServiceError } from './base.service'
import {
  IdentityDocumentValidationResult,
  PersonResponse,
  PersonService,
} from './person.service'
import { Person } from '@entity/Person'
import {
  AdvancedCondition,
  ApiResponse,
  Pagination,
  SessionInfo,
} from '@src/types/api.types'
import { BadRequestError, NotFoundError } from '@api/errors/http.error'

type CustomerPayload = {
  CUSTOMER_ID?: number
  PERSON_ID?: number
  STAFF_ID?: number
  NAME?: string
  LAST_NAME?: string | null
  IDENTITY_DOCUMENT?: string | null
  BIRTH_DATE?: Date | string | null
  GENDER?: string | null
  ADDRESS?: string | null
  CONTACTS?: Array<{
    TYPE?: string
    USAGE?: string
    VALUE?: string
    IS_PRIMARY?: boolean
  }>
  EMAIL?: string | null
  PHONE?: string | null
  STATE?: string
}

export class CustomerService extends BaseService {
  private personService: PersonService

  constructor() {
    super()
    this.personService = new PersonService()
  }

  @CatchServiceError()
  async create(
    payload: CustomerPayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<PersonResponse>> {
    const response = await this.personService.create(payload, sessionInfo)
    this.assertResponseIsCustomer(response.data)
    return response
  }

  @CatchServiceError()
  async update(
    payload: CustomerPayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<PersonResponse>> {
    const customerId = this.resolveCustomerId(payload)
    await this.assertPersonIsCustomer(customerId)

    const response = await this.personService.update(
      {
        ...payload,
        PERSON_ID: customerId,
      },
      sessionInfo
    )

    this.assertResponseIsCustomer(response.data)
    return response
  }

  @CatchServiceError()
  async getOne(customerId: number): Promise<ApiResponse<PersonResponse>> {
    await this.assertPersonIsCustomer(customerId)
    const response = await this.personService.getOne(customerId)
    this.assertResponseIsCustomer(response.data)

    return response
  }

  @CatchServiceError()
  async getPagination(
    conditions: AdvancedCondition<Person>[] = [],
    pagination: Pagination
  ): Promise<ApiResponse<PersonResponse[]>> {
    const conditionWithClientsOnly: AdvancedCondition<Person>[] = [
      ...conditions,
      {
        field: 'USER_ID' as never,
        operator: 'IS NULL',
        value: '',
      },
    ]

    const response = await this.personService.getPagination(
      conditionWithClientsOnly,
      pagination
    )

    return {
      ...response,
      data: (response.data || []).filter((item) => !item.USER_ID),
    }
  }

  @CatchServiceError()
  async validateIdentityDocument(
    identityDocument: string
  ): Promise<ApiResponse<IdentityDocumentValidationResult>> {
    return this.personService.validateIdentityDocument(identityDocument)
  }

  private resolveCustomerId(payload: CustomerPayload): number {
    const customerId = Number(
      payload.CUSTOMER_ID || payload.PERSON_ID || payload.STAFF_ID
    )

    if (!customerId) {
      throw new BadRequestError(
        'Debe enviar CUSTOMER_ID o PERSON_ID para actualizar el cliente.'
      )
    }

    return customerId
  }

  private async assertPersonIsCustomer(personId: number): Promise<void> {
    const person = await this.personRepository.findOne({
      where: { PERSON_ID: personId },
      relations: ['STAFF'],
    })

    if (!person) {
      throw new NotFoundError(`Cliente con id '${personId}' no encontrado.`)
    }

    if (person.STAFF) {
      throw new BadRequestError(
        `La persona con id '${personId}' tiene acceso al sistema y no puede gestionarse como cliente.`
      )
    }
  }

  private assertResponseIsCustomer(person?: PersonResponse): void {
    if (!person) {
      return
    }

    if (person.USER_ID) {
      throw new BadRequestError(
        `La persona con id '${person.PERSON_ID}' tiene acceso al sistema y no puede gestionarse como cliente.`
      )
    }
  }
}
