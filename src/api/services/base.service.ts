import { INTERNAL_SERVER_ERROR } from '@src/constants/error-types'
import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NO_CONTENT,
  HTTP_STATUS_OK,
} from '@src/constants/status-codes'
import { AppDataSource } from '@src/data-source'
import Business from '@entity/Business'
import { Staff } from '@entity/Staff'
import { BaseError } from '@api/errors/base.error'
import { NotFoundError } from '@api/errors/http.error'
import { parsePostgresError } from '@api/errors/parse.error'
import { ApiResponse, Metadata } from '@src/types/api.types'
import { DataSource, FindOptionsWhere, Repository } from 'typeorm'
import { Person } from '@src/entity/Person'
import { Contact } from '@src/entity/Contact'

interface SuccessResponse<T> {
  data?: T
  message?: string
  metadata?: Metadata
  status?: number
}

export abstract class BaseService {
  protected datasource: DataSource
  protected businessRepository: Repository<Business>
  protected staffRepository: Repository<Staff>
  protected personRepository: Repository<Person>
  protected contactRepository: Repository<Contact>

  constructor() {
    this.datasource = AppDataSource
    this.businessRepository = this.datasource.getRepository(Business)
    this.staffRepository = this.datasource.getRepository(Staff)
    this.personRepository = this.datasource.getRepository(Person)
    this.contactRepository = this.datasource.getRepository(Contact)
  }

  protected success<T>({
    data,
    message,
    metadata,
    status = HTTP_STATUS_OK,
  }: SuccessResponse<T>): ApiResponse<T> {
    return {
      status,
      message,
      data,
      metadata,
    }
  }

  protected noContent(): ApiResponse<any> {
    return this.success({ status: HTTP_STATUS_NO_CONTENT })
  }

  protected fail(
    message: string,
    status: number = HTTP_STATUS_INTERNAL_SERVER_ERROR,
    code: string = INTERNAL_SERVER_ERROR
  ): void {
    throw new BaseError(status, message, code)
  }

  /**
   * Validate if an specific field is already in use for another user
   * @param field: the database column name.
   * @param value - the value in the field
   * @return boolean
   */

  protected async getStaff(searchKey: number | string): Promise<Staff> {
    const staff = await this.staffRepository.findOneBy(
      typeof searchKey === 'string'
        ? { USERNAME: searchKey }
        : { STAFF_ID: searchKey }
    )

    if (!staff) {
      throw new NotFoundError('Usuario no encontrado.')
    }

    return staff
  }

  protected async getPerson(personId: number): Promise<Person> {
    const person = await this.personRepository.findOne({
      where: { PERSON_ID: personId },
    })

    if (!person) {
      throw new NotFoundError(`Persona con id '${personId}' no encontrada`)
    }

    return person
  }

  protected async getBusinessInfo(
    select?: (keyof Business)[]
  ): Promise<Business> {
    const business = await this.businessRepository.findOne({
      select,
      where: {
        STATE: 'A',
      },
    })

    if (!business) {
      throw new NotFoundError(`Empresa no encontrada.`)
    }

    return business
  }
}

/**
 * Method decorator to automatically catch and handle errors in service methods.
 *
 * This decorator is intended to be used on methods inside services that extend
 * from `BaseService`, which provides a `fail()` method.
 *
 * If the error is an instance of `BaseError`, it will call `this.fail()` with
 * the specific error message, status code, and error name. Otherwise, it calls
 * `this.fail()` with a generic error message.
 * @returns A wrapped method with centralized error handling.
 * @example
 * ```typescript
 * CatchServiceError()
 * async someServiceMethod() {
 *   // Your method logic
 * }
 * ```
 *
 */
export function CatchServiceError() {
  return function (target: any, propertyKey: string, descriptor: any) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args)
      } catch (error: any) {
        if (error instanceof BaseError) {
          this.fail(error.message, error.status, error.name)
        }

        const oraError = parsePostgresError(error)
        if (oraError) {
          this.fail(
            `${oraError.message}. ${oraError.code}`,
            HTTP_STATUS_INTERNAL_SERVER_ERROR,
            oraError.type
          )
        }

        this.fail(error.message)
      }
    }

    return descriptor
  }
}
