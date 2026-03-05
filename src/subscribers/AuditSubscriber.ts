import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm'

// TODO: Replace with proper per-request context injection via middleware
export class AuditContext {
  private static _userId: number | null = null
  static setUserId(userId: number | null) {
    this._userId = userId
  }
  static get userId(): number | null {
    return this._userId
  }
}

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  constructor(dataSource: DataSource) {
    dataSource?.subscribers?.push?.(this)
  }

  beforeInsert(event: InsertEvent<any>) {
    const entity: any = event.entity
    if (!entity) return

    const now = new Date()
    if ('CREATED_AT' in entity && entity.CREATED_AT == null) {
      entity.CREATED_AT = now
    }
    if ('UPDATED_AT' in entity && entity.UPDATED_AT == null) {
      entity.UPDATED_AT = now
    }
    const uid = AuditContext.userId
    if (uid != null) {
      if ('CREATED_BY' in entity && entity.CREATED_BY == null) {
        entity.CREATED_BY = uid
      }
      if ('UPDATED_BY' in entity && entity.UPDATED_BY == null) {
        entity.UPDATED_BY = uid
      }
    }
  }

  beforeUpdate(event: UpdateEvent<any>) {
    const entity: any = event.entity
    if (!entity) return
    const now = new Date()
    if ('UPDATED_AT' in entity) {
      entity.UPDATED_AT = now
    }
    const uid = AuditContext.userId
    if (uid != null && 'UPDATED_BY' in entity) {
      entity.UPDATED_BY = uid
    }
  }
}
