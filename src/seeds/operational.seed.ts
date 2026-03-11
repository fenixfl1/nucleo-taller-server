import 'reflect-metadata'
import { In } from 'typeorm'
import { AppDataSource } from '@src/data-source'
import Business from '@entity/Business'
import { Person } from '@entity/Person'
import { Staff } from '@entity/Staff'
import { Vehicle } from '@entity/Vehicle'
import { Article } from '@entity/Article'
import { ArticleCompatibility } from '@entity/ArticleCompatibility'
import { WorkOrder } from '@entity/WorkOrder'
import { InternalPurchaseOrder } from '@entity/InternalPurchaseOrder'
import { WorkOrderStatus } from '@entity/WorkOrderStatus'
import {
  InventoryMovementService,
  INVENTORY_MOVEMENT_TYPES,
} from '@api/services/inventory-movement.service'
import { WorkOrderService } from '@api/services/work-order.service'
import { DeliveryReceiptService } from '@api/services/delivery-receipt.service'
import {
  InternalPurchaseOrderService,
  INTERNAL_PURCHASE_ORDER_STATUSES,
} from '@api/services/internal-purchase-order.service'
import { SessionInfo } from '@src/types/api.types'

type Mode = 'all' | 'vehicles' | 'orders' | 'internal-orders'

type Args = {
  dryRun: boolean
  mode: Mode
  vehicles: number
  orders: number
  internalOrders: number
}

type VehicleSeedPlan = {
  seedKey: string
  customerId: number
  plate: string
  vin: string
  brand: string
  model: string
  year: number | null
  engine: string | null
  color: string
  notes: string
}

type VehicleRuntime = {
  VEHICLE_ID: number
  CUSTOMER_ID: number
  BRAND: string
  MODEL: string
  YEAR: number | null
  ENGINE: string | null
  PLATE: string | null
}

type OrderBlueprint = {
  customerId: number
  vehicleId: number
  statusCode:
    | 'CREADA'
    | 'DIAGNOSTICO'
    | 'REPARACION'
    | 'LISTA_ENTREGA'
    | 'ENTREGADA'
    | 'CANCELADA'
  symptom: string
  diagnosis: string | null
  workPerformed: string | null
  customerObservations: string | null
  promisedAt: string | null
  requiresDisassembly: boolean
  serviceLines: Array<{
    SERVICE_TYPE: string
    DESCRIPTION: string
    QUANTITY: number
    REFERENCE_AMOUNT: number
    NOTES?: string | null
  }>
  consumedItems: Array<{
    ARTICLE_ID: number
    QUANTITY: number
    UNIT_COST_REFERENCE?: number | null
    NOTES?: string | null
  }>
  technicians: Array<{
    STAFF_ID: number
    ROLE_ON_JOB?: string | null
    IS_LEAD?: boolean
    REFERENCE_PERCENT?: number | null
    REFERENCE_AMOUNT?: number | null
    NOTES?: string | null
  }>
  internalNotes: string
}

type InternalPurchaseOrderBlueprint = {
  status: keyof typeof INTERNAL_PURCHASE_ORDER_STATUSES
  orderDate: string
  notes: string
  items: Array<{
    ARTICLE_ID: number
    QUANTITY: number
    UNIT_COST_REFERENCE?: number | null
    NOTES?: string | null
  }>
}

type Summary = {
  business: {
    BUSINESS_ID: number
    NAME: string
  }
  mode: Mode
  dryRun: boolean
  vehicles: {
    target: number
    existingSeeded: number
    created: number
  }
  stockEntry: {
    created: number
    detailLines: number
    totalQuantity: number
  }
  workOrders: {
    target: number
    existingSeeded: number
    created: number
    delivered: number
    cancelled: number
  }
  internalPurchaseOrders: {
    target: number
    existingSeeded: number
    created: number
    received: number
    cancelled: number
  }
}

const SEED_MARKER = 'SEED_OPERATIVO_V1'
const VEHICLE_MARKER = `${SEED_MARKER}|VEHICLE`
const ORDER_MARKER = `${SEED_MARKER}|WORK_ORDER`
const INTERNAL_ORDER_MARKER = `${SEED_MARKER}|INTERNAL_PURCHASE_ORDER`
const STOCK_MARKER = `${SEED_MARKER}|STOCK_ENTRY`

const DEFAULT_ARGS: Args = {
  dryRun: false,
  mode: 'all',
  vehicles: 40,
  orders: 60,
  internalOrders: 8,
}

const VEHICLE_COLORS = [
  'Blanco',
  'Negro',
  'Gris',
  'Azul',
  'Rojo',
  'Plata',
]

const ORDER_STATUS_SEQUENCE: OrderBlueprint['statusCode'][] = [
  'CREADA',
  'DIAGNOSTICO',
  'REPARACION',
  'REPARACION',
  'LISTA_ENTREGA',
  'ENTREGADA',
  'CANCELADA',
]

const INTERNAL_ORDER_STATUS_SEQUENCE: Array<
  keyof typeof INTERNAL_PURCHASE_ORDER_STATUSES
> = ['GENERADA', 'ENVIADA', 'RECIBIDA', 'CANCELADA']

function parseArgs(argv: string[]): Args {
  const args = { ...DEFAULT_ARGS }

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    const next = argv[index + 1]

    switch (current) {
      case '--dry-run':
        args.dryRun = true
        break
      case '--mode':
        if (
          next === 'all' ||
          next === 'vehicles' ||
          next === 'orders' ||
          next === 'internal-orders'
        ) {
          args.mode = next
        }
        index += 1
        break
      case '--vehicles':
        args.vehicles = normalizePositiveInteger(next, args.vehicles)
        index += 1
        break
      case '--orders':
        args.orders = normalizePositiveInteger(next, args.orders)
        index += 1
        break
      case '--internal-orders':
        args.internalOrders = normalizePositiveInteger(next, args.internalOrders)
        index += 1
        break
      default:
        break
    }
  }

  return args
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

function normalizeText(value?: string | null): string {
  return `${value || ''}`.replace(/\s+/g, ' ').trim()
}

function normalizeLookupKey(value?: string | null): string {
  return normalizeText(value).toUpperCase()
}

function toDateString(offsetDays = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString()
}

function toMoney(value: number): number {
  return Number(value.toFixed(2))
}

function pickFrom<T>(rows: T[], index: number): T {
  return rows[index % rows.length]
}

function buildPlate(sequence: number): string {
  return `NT-${String(sequence).padStart(5, '0')}`
}

function buildVin(sequence: number): string {
  return `SEEDVIN${String(sequence).padStart(9, '0')}`
}

function buildVehicleNote(plan: VehicleSeedPlan): string {
  return [
    VEHICLE_MARKER,
    `CUSTOMER_ID=${plan.customerId}`,
    `BRAND=${plan.brand}`,
    `MODEL=${plan.model}`,
  ].join(' | ')
}

function buildWorkOrderNote(statusCode: OrderBlueprint['statusCode'], index: number) {
  return `${ORDER_MARKER} | STATUS=${statusCode} | SEQ=${index + 1}`
}

function buildInternalOrderNote(status: keyof typeof INTERNAL_PURCHASE_ORDER_STATUSES, index: number) {
  return `${INTERNAL_ORDER_MARKER} | STATUS=${status} | SEQ=${index + 1}`
}

function matchesVehicleCompatibility(
  vehicle: Pick<VehicleRuntime, 'BRAND' | 'MODEL' | 'YEAR' | 'ENGINE'>,
  compatibility: ArticleCompatibility
): boolean {
  if (
    normalizeLookupKey(vehicle.BRAND) !== normalizeLookupKey(compatibility.BRAND) ||
    normalizeLookupKey(vehicle.MODEL) !== normalizeLookupKey(compatibility.MODEL)
  ) {
    return false
  }

  if (
    vehicle.YEAR &&
    compatibility.YEAR_FROM &&
    vehicle.YEAR < compatibility.YEAR_FROM
  ) {
    return false
  }

  if (
    vehicle.YEAR &&
    compatibility.YEAR_TO &&
    vehicle.YEAR > compatibility.YEAR_TO
  ) {
    return false
  }

  if (compatibility.ENGINE) {
    return normalizeLookupKey(vehicle.ENGINE).includes(
      normalizeLookupKey(compatibility.ENGINE)
    )
  }

  return true
}

function isSeededText(value?: string | null, marker = SEED_MARKER): boolean {
  return normalizeText(value).includes(marker)
}

async function resolveBusiness(): Promise<Business> {
  const business = await AppDataSource.getRepository(Business).findOne({
    where: { STATE: 'A' },
  })

  if (!business) {
    throw new Error('No existe una empresa activa para ejecutar el seed.')
  }

  return business
}

async function resolveSessionInfo(businessId: number): Promise<SessionInfo> {
  const staff = await AppDataSource.getRepository(Staff).findOne({
    where: { BUSINESS_ID: businessId, STATE: 'A' },
    order: { STAFF_ID: 'ASC' },
  })

  if (!staff) {
    throw new Error('No existe personal activo para ejecutar el seed operativo.')
  }

  return {
    userId: staff.STAFF_ID,
    username: staff.USERNAME,
  }
}

async function loadCustomers(businessId: number): Promise<Person[]> {
  const rows = await AppDataSource.getRepository(Person).find({
    where: { BUSINESS_ID: businessId, STATE: 'A' },
    relations: ['STAFF', 'CONTACTS'],
    order: { PERSON_ID: 'ASC' },
  })

  return rows.filter((item) => !item.STAFF)
}

async function loadArticles(businessId: number): Promise<Article[]> {
  return AppDataSource.getRepository(Article).find({
    where: { BUSINESS_ID: businessId, STATE: 'A' },
    relations: ['COMPATIBILITIES'],
    order: { ARTICLE_ID: 'ASC' },
  })
}

async function loadSeededVehicles(businessId: number): Promise<Vehicle[]> {
  const rows = await AppDataSource.getRepository(Vehicle).find({
    where: { BUSINESS_ID: businessId, STATE: 'A' },
    order: { VEHICLE_ID: 'ASC' },
  })

  return rows.filter((item) => isSeededText(item.NOTES, VEHICLE_MARKER))
}

async function loadSeededWorkOrders(businessId: number): Promise<WorkOrder[]> {
  const rows = await AppDataSource.getRepository(WorkOrder).find({
    where: { BUSINESS_ID: businessId },
    order: { WORK_ORDER_ID: 'ASC' },
  })

  return rows.filter((item) => isSeededText(item.INTERNAL_NOTES, ORDER_MARKER))
}

async function loadSeededInternalOrders(
  businessId: number
): Promise<InternalPurchaseOrder[]> {
  const rows = await AppDataSource.getRepository(InternalPurchaseOrder).find({
    where: { BUSINESS_ID: businessId },
    order: { INTERNAL_PURCHASE_ORDER_ID: 'ASC' },
  })

  return rows.filter((item) => isSeededText(item.NOTES, INTERNAL_ORDER_MARKER))
}

async function resolveStatuses(
  businessId: number
): Promise<Record<string, WorkOrderStatus>> {
  const rows = await AppDataSource.getRepository(WorkOrderStatus).find({
    where: [
      { BUSINESS_ID: businessId, STATE: 'A' },
      { BUSINESS_ID: null, STATE: 'A' },
    ],
    order: { ORDER_INDEX: 'ASC' },
  })

  const map: Record<string, WorkOrderStatus> = {}
  rows.forEach((row) => {
    if (!map[row.CODE]) {
      map[row.CODE] = row
    }
  })

  for (const code of [
    'CREADA',
    'DIAGNOSTICO',
    'REPARACION',
    'LISTA_ENTREGA',
    'ENTREGADA',
    'CANCELADA',
  ]) {
    if (!map[code]) {
      throw new Error(`No existe el estado de OT '${code}'.`)
    }
  }

  return map
}

function buildVehiclePlans(
  customers: Person[],
  articles: Article[],
  existingSeededVehicles: number,
  target: number
): VehicleSeedPlan[] {
  const needed = Math.max(0, target - existingSeededVehicles)
  if (!needed) return []

  const seen = new Set<string>()
  const compatibilityPool = articles.flatMap((article) =>
    (article.COMPATIBILITIES || []).map((compatibility) => ({
      brand: normalizeText(compatibility.BRAND),
      model: normalizeText(compatibility.MODEL),
      year:
        compatibility.YEAR_FROM ||
        compatibility.YEAR_TO ||
        null,
      engine: normalizeText(compatibility.ENGINE) || null,
    }))
  )

  const uniqueCompatibilities = compatibilityPool.filter((item) => {
    const key = [
      normalizeLookupKey(item.brand),
      normalizeLookupKey(item.model),
      item.year || '',
      normalizeLookupKey(item.engine),
    ].join('|')

    if (!item.brand || !item.model || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })

  if (!uniqueCompatibilities.length) {
    throw new Error(
      'No existen compatibilidades suficientes para generar vehículos operativos.'
    )
  }

  return Array.from({ length: needed }, (_, index) => {
    const compatibility = pickFrom(uniqueCompatibilities, index)
    const customer = pickFrom(customers, existingSeededVehicles + index)
    const sequence = existingSeededVehicles + index + 1
    const plan: VehicleSeedPlan = {
      seedKey: `${customer.PERSON_ID}-${sequence}`,
      customerId: customer.PERSON_ID,
      plate: buildPlate(sequence),
      vin: buildVin(sequence),
      brand: compatibility.brand,
      model: compatibility.model,
      year: compatibility.year,
      engine: compatibility.engine,
      color: pickFrom(VEHICLE_COLORS, index),
      notes: '',
    }

    plan.notes = buildVehicleNote(plan)
    return plan
  })
}

async function createVehicles(
  businessId: number,
  sessionInfo: SessionInfo,
  plans: VehicleSeedPlan[]
): Promise<VehicleRuntime[]> {
  if (!plans.length) return []

  const repository = AppDataSource.getRepository(Vehicle)
  const saved = await repository.save(
    plans.map((plan) =>
      repository.create({
        BUSINESS_ID: businessId,
        CUSTOMER_ID: plan.customerId,
        PLATE: plan.plate,
        VIN: plan.vin,
        BRAND: plan.brand,
        MODEL: plan.model,
        YEAR: plan.year,
        COLOR: plan.color,
        ENGINE: plan.engine,
        NOTES: plan.notes,
        STATE: 'A',
        CREATED_BY: sessionInfo.userId,
      })
    )
  )

  return saved.map((item) => ({
    VEHICLE_ID: item.VEHICLE_ID,
    CUSTOMER_ID: item.CUSTOMER_ID,
    BRAND: item.BRAND,
    MODEL: item.MODEL,
    YEAR: item.YEAR,
    ENGINE: item.ENGINE,
    PLATE: item.PLATE,
  }))
}

function toVehicleRuntime(item: Vehicle): VehicleRuntime {
  return {
    VEHICLE_ID: item.VEHICLE_ID,
    CUSTOMER_ID: item.CUSTOMER_ID,
    BRAND: item.BRAND,
    MODEL: item.MODEL,
    YEAR: item.YEAR,
    ENGINE: item.ENGINE,
    PLATE: item.PLATE,
  }
}

function buildCompatibleArticlePool(
  vehicle: VehicleRuntime,
  articles: Article[]
): Article[] {
  const compatible = articles.filter((article) =>
    (article.COMPATIBILITIES || []).some((compatibility) =>
      matchesVehicleCompatibility(vehicle, compatibility)
    )
  )

  if (compatible.length) {
    return compatible
  }

  const sameBrand = articles.filter(
    (article) =>
      (article.COMPATIBILITIES || []).some(
        (compatibility) =>
          normalizeLookupKey(compatibility.BRAND) ===
          normalizeLookupKey(vehicle.BRAND)
      )
  )

  return sameBrand.length ? sameBrand : articles.slice(0, 10)
}

function buildWorkOrderBlueprints(
  vehicles: VehicleRuntime[],
  staff: Staff[],
  articles: Article[],
  existingSeededOrders: number,
  target: number
): OrderBlueprint[] {
  const needed = Math.max(0, target - existingSeededOrders)
  if (!needed) return []
  if (!vehicles.length) {
    throw new Error('No hay vehículos disponibles para generar órdenes.')
  }
  if (!staff.length) {
    throw new Error('No hay personal disponible para asignar a las órdenes.')
  }

  return Array.from({ length: needed }, (_, index) => {
    const vehicle = pickFrom(vehicles, existingSeededOrders + index)
    const compatibleArticles = buildCompatibleArticlePool(vehicle, articles)
    const statusCode = pickFrom(ORDER_STATUS_SEQUENCE, index)
    const shouldConsume =
      statusCode === 'REPARACION' ||
      statusCode === 'LISTA_ENTREGA' ||
      statusCode === 'ENTREGADA' ||
      statusCode === 'CANCELADA'
    const itemCount = shouldConsume
      ? Math.min(
          compatibleArticles.length,
          1 + ((existingSeededOrders + index) % 2)
        )
      : 0

    const consumedItems = Array.from({ length: itemCount }, (_, itemIndex) => {
      const article = pickFrom(compatibleArticles, index + itemIndex)
      const quantity = itemIndex === 0 ? 1 : 2

      return {
        ARTICLE_ID: article.ARTICLE_ID,
        QUANTITY: quantity,
        UNIT_COST_REFERENCE:
          article.COST_REFERENCE === null
            ? null
            : Number(article.COST_REFERENCE),
        NOTES: `Consumo semilla para ${vehicle.BRAND} ${vehicle.MODEL}`,
      }
    })

    const leadTechnician = pickFrom(staff, index)
    const assistantTechnician =
      staff.length > 1 && index % 3 === 0 ? pickFrom(staff, index + 1) : null

    return {
      customerId: vehicle.CUSTOMER_ID,
      vehicleId: vehicle.VEHICLE_ID,
      statusCode,
      symptom: `Revisión de radiador y sistema de enfriamiento en ${vehicle.BRAND} ${vehicle.MODEL}.`,
      diagnosis:
        statusCode === 'CREADA'
          ? null
          : `Se detecta fuga moderada y necesidad de limpieza en ${vehicle.BRAND} ${vehicle.MODEL}.`,
      workPerformed:
        statusCode === 'CREADA' || statusCode === 'DIAGNOSTICO'
          ? null
          : 'Limpieza, prueba de presión y ajuste de componentes del sistema.',
      customerObservations:
        index % 2 === 0 ? 'Cliente reporta calentamiento en trayectos largos.' : null,
      promisedAt: toDateString(1 + (index % 5)),
      requiresDisassembly: shouldConsume,
      serviceLines: [
        {
          SERVICE_TYPE: 'DIAGNOSTICO',
          DESCRIPTION: `Diagnóstico general del sistema de enfriamiento ${vehicle.BRAND} ${vehicle.MODEL}.`,
          QUANTITY: 1,
          REFERENCE_AMOUNT: 750,
        },
        ...(shouldConsume
          ? [
              {
                SERVICE_TYPE: 'REPARACION',
                DESCRIPTION: 'Reparación y ajuste del radiador.',
                QUANTITY: 1,
                REFERENCE_AMOUNT: 1800 + (index % 4) * 250,
              },
            ]
          : []),
      ],
      consumedItems,
      technicians: [
        {
          STAFF_ID: leadTechnician.STAFF_ID,
          ROLE_ON_JOB: 'Técnico líder',
          IS_LEAD: true,
          REFERENCE_PERCENT: 60,
        },
        ...(assistantTechnician
          ? [
              {
                STAFF_ID: assistantTechnician.STAFF_ID,
                ROLE_ON_JOB: 'Soporte técnico',
                IS_LEAD: false,
                REFERENCE_PERCENT: 40,
              },
            ]
          : []),
      ],
      internalNotes: buildWorkOrderNote(statusCode, existingSeededOrders + index),
    }
  })
}

function aggregateRequiredStock(orders: OrderBlueprint[]): Map<number, number> {
  const stockByArticle = new Map<number, number>()

  orders.forEach((order) => {
    order.consumedItems.forEach((item) => {
      stockByArticle.set(
        item.ARTICLE_ID,
        Number(
          ((stockByArticle.get(item.ARTICLE_ID) || 0) + Number(item.QUANTITY)).toFixed(
            2
          )
        )
      )
    })
  })

  return stockByArticle
}

async function createStockEntryIfNeeded(
  businessId: number,
  sessionInfo: SessionInfo,
  articles: Article[],
  requiredStock: Map<number, number>,
  dryRun: boolean
): Promise<{ created: number; detailLines: number; totalQuantity: number }> {
  const details = [...requiredStock.entries()]
    .map(([articleId, required]) => {
      const article = articles.find((item) => item.ARTICLE_ID === articleId)
      if (!article) return null

      const currentStock = Number(article.CURRENT_STOCK || 0)
      const targetStock = required + Math.max(2, Math.ceil(required * 0.5))
      const quantity = Number((targetStock - currentStock).toFixed(2))

      if (quantity <= 0) {
        return null
      }

      return {
        ARTICLE_ID: articleId,
        QUANTITY: quantity,
        UNIT_COST_REFERENCE:
          article.COST_REFERENCE === null ? null : Number(article.COST_REFERENCE),
        NOTES: 'Entrada inicial para seed operativo',
      }
    })
    .filter(Boolean) as Array<{
    ARTICLE_ID: number
    QUANTITY: number
    UNIT_COST_REFERENCE?: number | null
    NOTES?: string | null
  }>

  if (!details.length) {
    return { created: 0, detailLines: 0, totalQuantity: 0 }
  }

  const totalQuantity = toMoney(
    details.reduce((acc, item) => acc + Number(item.QUANTITY), 0)
  )

  if (dryRun) {
    return {
      created: 1,
      detailLines: details.length,
      totalQuantity,
    }
  }

  const movementService = new InventoryMovementService()
  await movementService.create(
    {
      MOVEMENT_TYPE: INVENTORY_MOVEMENT_TYPES.ENTRY,
      MOVEMENT_DATE: new Date(),
      NOTES: `${STOCK_MARKER} | Abastecimiento inicial para órdenes operativas`,
      DETAILS: details,
      STATE: 'A',
    },
    sessionInfo
  )

  return {
    created: 1,
    detailLines: details.length,
    totalQuantity,
  }
}

async function createWorkOrders(
  blueprints: OrderBlueprint[],
  statusMap: Record<string, WorkOrderStatus>,
  sessionInfo: SessionInfo,
  dryRun: boolean
): Promise<{ created: number; delivered: number; cancelled: number }> {
  if (dryRun || !blueprints.length) {
    return {
      created: blueprints.length,
      delivered: blueprints.filter((item) => item.statusCode === 'ENTREGADA').length,
      cancelled: blueprints.filter((item) => item.statusCode === 'CANCELADA').length,
    }
  }

  const workOrderService = new WorkOrderService()
  const deliveryReceiptService = new DeliveryReceiptService()
  let delivered = 0
  let cancelled = 0

  for (let index = 0; index < blueprints.length; index += 1) {
    const blueprint = blueprints[index]
    const initialStatusCode =
      blueprint.statusCode === 'ENTREGADA'
        ? 'LISTA_ENTREGA'
        : blueprint.statusCode === 'CANCELADA'
          ? 'REPARACION'
          : blueprint.statusCode

    const created = await workOrderService.create(
      {
        CUSTOMER_ID: blueprint.customerId,
        VEHICLE_ID: blueprint.vehicleId,
        STATUS_ID: statusMap[initialStatusCode].STATUS_ID,
        PROMISED_AT: blueprint.promisedAt,
        SYMPTOM: blueprint.symptom,
        DIAGNOSIS: blueprint.diagnosis,
        WORK_PERFORMED: blueprint.workPerformed,
        INTERNAL_NOTES: blueprint.internalNotes,
        CUSTOMER_OBSERVATIONS: blueprint.customerObservations,
        REQUIRES_DISASSEMBLY: blueprint.requiresDisassembly,
        SERVICE_LINES: blueprint.serviceLines,
        CONSUMED_ITEMS: blueprint.consumedItems,
        TECHNICIANS: blueprint.technicians,
        STATE: 'A',
      },
      sessionInfo
    )

    if (blueprint.statusCode === 'CANCELADA') {
      await workOrderService.update(
        {
          WORK_ORDER_ID: created.data?.WORK_ORDER_ID,
          STATUS_ID: statusMap.CANCELADA.STATUS_ID,
          STATUS_CHANGE_NOTES: 'Cancelada desde seed operativo.',
        },
        sessionInfo
      )
      cancelled += 1
      continue
    }

    if (blueprint.statusCode === 'ENTREGADA') {
      await deliveryReceiptService.create(
        {
          WORK_ORDER_ID: created.data?.WORK_ORDER_ID,
          DELIVERY_DATE: new Date(),
          RECEIVED_BY_NAME: created.data?.CUSTOMER_NAME || 'Cliente',
          RECEIVED_BY_PHONE: null,
          OBSERVATIONS: 'Entrega generada desde seed operativo.',
          STATE: 'A',
        },
        sessionInfo
      )
      delivered += 1
    }
  }

  return { created: blueprints.length, delivered, cancelled }
}

function buildInternalPurchaseOrderBlueprints(
  articles: Article[],
  existingSeededOrders: number,
  target: number
): InternalPurchaseOrderBlueprint[] {
  const needed = Math.max(0, target - existingSeededOrders)
  if (!needed) return []

  const pool = articles
    .slice()
    .sort(
      (a, b) =>
        Number(a.CURRENT_STOCK || 0) - Number(b.CURRENT_STOCK || 0) ||
        a.ARTICLE_ID - b.ARTICLE_ID
    )
    .slice(0, Math.max(10, needed * 3))

  return Array.from({ length: needed }, (_, index) => {
    const itemCount = Math.min(pool.length, 2 + (index % 2))
    const items = Array.from({ length: itemCount }, (_, itemIndex) => {
      const article = pickFrom(pool, existingSeededOrders + index + itemIndex)
      return {
        ARTICLE_ID: article.ARTICLE_ID,
        QUANTITY: 2 + ((index + itemIndex) % 3),
        UNIT_COST_REFERENCE:
          article.COST_REFERENCE === null ? null : Number(article.COST_REFERENCE),
        NOTES: 'Solicitud interna para reposición operativa.',
      }
    })

    return {
      status: pickFrom(INTERNAL_ORDER_STATUS_SEQUENCE, index),
      orderDate: toDateString(-(index % 6)),
      notes: buildInternalOrderNote(
        pickFrom(INTERNAL_ORDER_STATUS_SEQUENCE, index),
        existingSeededOrders + index
      ),
      items,
    }
  })
}

async function createInternalPurchaseOrders(
  blueprints: InternalPurchaseOrderBlueprint[],
  sessionInfo: SessionInfo,
  dryRun: boolean
): Promise<{ created: number; received: number; cancelled: number }> {
  if (dryRun || !blueprints.length) {
    return {
      created: blueprints.length,
      received: blueprints.filter((item) => item.status === 'RECIBIDA').length,
      cancelled: blueprints.filter((item) => item.status === 'CANCELADA').length,
    }
  }

  const service = new InternalPurchaseOrderService()
  let received = 0
  let cancelled = 0

  for (const blueprint of blueprints) {
    const created = await service.create(
      {
        ORDER_DATE: blueprint.orderDate,
        NOTES: blueprint.notes,
        ITEMS: blueprint.items,
        STATE: 'A',
      },
      sessionInfo
    )

    const orderId = created.data?.INTERNAL_PURCHASE_ORDER_ID
    if (!orderId || blueprint.status === 'GENERADA') {
      continue
    }

    if (blueprint.status === 'ENVIADA') {
      await service.updateStatus(
        {
          INTERNAL_PURCHASE_ORDER_ID: orderId,
          STATUS: INTERNAL_PURCHASE_ORDER_STATUSES.ENVIADA,
        },
        sessionInfo
      )
      continue
    }

    if (blueprint.status === 'RECIBIDA') {
      await service.updateStatus(
        {
          INTERNAL_PURCHASE_ORDER_ID: orderId,
          STATUS: INTERNAL_PURCHASE_ORDER_STATUSES.RECIBIDA,
        },
        sessionInfo
      )
      received += 1
      continue
    }

    await service.updateStatus(
      {
        INTERNAL_PURCHASE_ORDER_ID: orderId,
        STATUS: INTERNAL_PURCHASE_ORDER_STATUSES.CANCELADA,
      },
      sessionInfo
    )
    cancelled += 1
  }

  return { created: blueprints.length, received, cancelled }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  await AppDataSource.initialize()

  try {
    const business = await resolveBusiness()
    const sessionInfo = await resolveSessionInfo(business.BUSINESS_ID)
    const customers = await loadCustomers(business.BUSINESS_ID)
    const articles = await loadArticles(business.BUSINESS_ID)
    const staff = await AppDataSource.getRepository(Staff).find({
      where: { BUSINESS_ID: business.BUSINESS_ID, STATE: 'A' },
      order: { STAFF_ID: 'ASC' },
    })

    if (!customers.length) {
      throw new Error('No hay clientes disponibles. Importe contactos primero.')
    }

    if (!articles.length) {
      throw new Error('No hay artículos disponibles. Importe artículos primero.')
    }

    const summary: Summary = {
      business: {
        BUSINESS_ID: business.BUSINESS_ID,
        NAME: business.NAME,
      },
      mode: args.mode,
      dryRun: args.dryRun,
      vehicles: {
        target: args.vehicles,
        existingSeeded: 0,
        created: 0,
      },
      stockEntry: {
        created: 0,
        detailLines: 0,
        totalQuantity: 0,
      },
      workOrders: {
        target: args.orders,
        existingSeeded: 0,
        created: 0,
        delivered: 0,
        cancelled: 0,
      },
      internalPurchaseOrders: {
        target: args.internalOrders,
        existingSeeded: 0,
        created: 0,
        received: 0,
        cancelled: 0,
      },
    }

    const seededVehicles = await loadSeededVehicles(business.BUSINESS_ID)
    summary.vehicles.existingSeeded = seededVehicles.length

    const vehiclePlans =
      args.mode === 'all' || args.mode === 'vehicles' || args.mode === 'orders'
        ? buildVehiclePlans(
            customers,
            articles,
            summary.vehicles.existingSeeded,
            args.vehicles
          )
        : []

    const createdVehicles =
      args.dryRun || !vehiclePlans.length
        ? vehiclePlans.map((plan, index) => ({
            VEHICLE_ID: -(index + 1),
            CUSTOMER_ID: plan.customerId,
            BRAND: plan.brand,
            MODEL: plan.model,
            YEAR: plan.year,
            ENGINE: plan.engine,
            PLATE: plan.plate,
          }))
        : await createVehicles(business.BUSINESS_ID, sessionInfo, vehiclePlans)

    summary.vehicles.created = vehiclePlans.length

    if (args.mode === 'all' || args.mode === 'orders') {
      const seededWorkOrders = await loadSeededWorkOrders(business.BUSINESS_ID)
      summary.workOrders.existingSeeded = seededWorkOrders.length
      const statusMap = await resolveStatuses(business.BUSINESS_ID)

      const availableVehicles = [
        ...seededVehicles.map(toVehicleRuntime),
        ...createdVehicles,
      ]

      const orderBlueprints = buildWorkOrderBlueprints(
        availableVehicles,
        staff,
        articles,
        summary.workOrders.existingSeeded,
        args.orders
      )

      const stockEntry = await createStockEntryIfNeeded(
        business.BUSINESS_ID,
        sessionInfo,
        articles,
        aggregateRequiredStock(orderBlueprints),
        args.dryRun
      )

      summary.stockEntry = stockEntry

      const createdOrders = await createWorkOrders(
        orderBlueprints,
        statusMap,
        sessionInfo,
        args.dryRun
      )

      summary.workOrders.created = createdOrders.created
      summary.workOrders.delivered = createdOrders.delivered
      summary.workOrders.cancelled = createdOrders.cancelled
    }

    if (args.mode === 'all' || args.mode === 'internal-orders') {
      const seededInternalOrders = await loadSeededInternalOrders(
        business.BUSINESS_ID
      )
      summary.internalPurchaseOrders.existingSeeded = seededInternalOrders.length

      const internalOrderBlueprints = buildInternalPurchaseOrderBlueprints(
        articles,
        seededInternalOrders.length,
        args.internalOrders
      )

      const internalOrderResult = await createInternalPurchaseOrders(
        internalOrderBlueprints,
        sessionInfo,
        args.dryRun
      )

      summary.internalPurchaseOrders.created = internalOrderResult.created
      summary.internalPurchaseOrders.received = internalOrderResult.received
      summary.internalPurchaseOrders.cancelled = internalOrderResult.cancelled
    }

    console.log(
      [
        `Negocio destino: ${business.NAME} (${business.BUSINESS_ID})`,
        `Modo: ${args.mode}`,
        `Dry run: ${args.dryRun ? 'SI' : 'NO'}`,
        '',
        'Resumen seed operativo',
        JSON.stringify(summary, null, 2),
      ].join('\n')
    )
  } finally {
    await AppDataSource.destroy()
  }
}

main().catch((error) => {
  console.error(
    `Error ejecutando el seed operativo: ${error instanceof Error ? error.message : error}`
  )
  process.exitCode = 1
})
