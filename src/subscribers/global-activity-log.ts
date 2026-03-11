import { asyncLocalStorage } from '../api/middlewares/storage.middleware'
import { ActivityLog } from '@entity/ActivityLog'
import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm'

@EventSubscriber()
export class GlobalActivitySubscriber implements EntitySubscriberInterface {
  async afterInsert(event: InsertEvent<any>) {
    if (event.metadata.name === 'ActivityLog') return
    const { userId, ip, userAgent } = this.getRequestContext()
    if (!userId) return

    const { objectId, compositeId } = this.extractObjectId(event)

    const log = new ActivityLog()
    log.STAFF_ID = userId
    log.ACTION = 'INSERT'
    log.MODEL = event.metadata.name
    log.OBJECT_ID = objectId as never // <-- null si PK compuesta
    log.IP = ip
    log.USER_AGENT = userAgent
    // En CHANGES incluimos además el compositeId si existe
    log.CHANGES = { __id: compositeId ?? objectId, ...event.entity }

    await event.manager.getRepository(ActivityLog).save(log)
  }

  async afterUpdate(event: UpdateEvent<any>) {
    if (event.metadata.name === 'ActivityLog') return
    const { userId, ip, userAgent } = this.getRequestContext()
    if (!userId) return

    const { objectId, compositeId } = this.extractObjectId(event)

    const changes = event.updatedColumns.reduce(
      (acc, col) => {
        acc[col.propertyName] = (event.entity as any)?.[col.propertyName]
        return acc
      },
      {} as Record<string, any>
    )

    const log = new ActivityLog()
    log.STAFF_ID = userId
    log.ACTION = 'UPDATE'
    log.MODEL = event.metadata.name
    log.OBJECT_ID = objectId as never
    log.IP = ip
    log.USER_AGENT = userAgent
    log.CHANGES = { __id: compositeId ?? objectId, ...changes }

    await event.manager.getRepository(ActivityLog).save(log)
  }

  async afterRemove(event: RemoveEvent<any>) {
    if (event.metadata.name === 'ActivityLog') return
    const { userId, ip, userAgent } = this.getRequestContext()
    if (!userId) return

    const { objectId, compositeId } = this.extractObjectId(event)

    const log = new ActivityLog()
    log.STAFF_ID = userId
    log.ACTION = 'DELETE'
    log.MODEL = event.metadata.name
    log.OBJECT_ID = objectId as never
    log.IP = ip
    log.USER_AGENT = userAgent
    log.CHANGES = { __id: compositeId ?? objectId, ...(event.entity ?? {}) }

    await event.manager.getRepository(ActivityLog).save(log)
  }

  private getRequestContext(): {
    userId: number | null
    ip?: string
    userAgent?: string
  } {
    const storage = asyncLocalStorage.getStore()
    return {
      userId: storage?.userId ?? null,
      ip: storage?.ip,
      userAgent: storage?.userAgent,
    }
  }

  /**
   * Si la PK es simple -> objectId = número/string, compositeId = null
   * Si la PK es compuesta -> objectId = null, compositeId = objeto { col: valor, ... }
   */
  private extractObjectId(
    event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>
  ): {
    objectId: number | string | null
    compositeId: Record<string, any> | null
  } {
    const cols = event.metadata.primaryColumns
    if (!cols || cols.length === 0) return { objectId: null, compositeId: null }

    // Intentar leer desde entity; si no, de databaseEntity
    const readValue = (prop: string) =>
      (event as any).entity?.[prop] ?? (event as any).databaseEntity?.[prop]

    if (cols.length === 1) {
      const prop = cols[0].propertyName
      const val = readValue(prop)
      // Sólo aceptamos simple
      if (val == null) return { objectId: null, compositeId: null }
      return { objectId: val, compositeId: null }
    }

    // Compuesta
    const idObj: Record<string, any> = {}
    for (const c of cols) {
      idObj[c.propertyName] = readValue(c.propertyName)
    }
    return { objectId: null, compositeId: idObj }
  }
}
