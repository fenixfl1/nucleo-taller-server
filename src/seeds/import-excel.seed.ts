import 'reflect-metadata'
import path from 'path'
import { execFileSync } from 'child_process'
import { EntityManager } from 'typeorm'
import { AppDataSource } from '@src/data-source'
import Business from '@entity/Business'
import { Person } from '@entity/Person'
import { Contact, ContactType, ContactUsage } from '@entity/Contact'
import { Article } from '@entity/Article'
import { ArticleCompatibility } from '@entity/ArticleCompatibility'
import { Staff } from '@entity/Staff'
import { Vehicle } from '@entity/Vehicle'
import { WorkOrder } from '@entity/WorkOrder'
import { WorkOrderServiceLine } from '@entity/WorkOrderServiceLine'
import { WorkOrderStatus } from '@entity/WorkOrderStatus'
import { WorkOrderStatusHistory } from '@entity/WorkOrderStatusHistory'
import { DeliveryReceipt } from '@entity/DeliveryReceipt'

type ImportMode = 'all' | 'contacts' | 'articles' | 'work-orders'

type ExtractedContact = {
  name: string
  phones: string[]
  note?: string
  source_row: number
}

type ExtractedCompatibility = {
  brand: string
  model: string
  year_from?: number | null
  year_to?: number | null
  engine?: string | null
  notes?: string | null
}

type ExtractedArticle = {
  code: string
  name: string
  cost_reference?: number | null
  compatibilities: ExtractedCompatibility[]
  source_row: number
}

type ExtractedWorkOrder = {
  source_row: number
  legacy_no?: string | null
  opened_at?: string | null
  detail?: string | null
  vehicle?: string | null
  customer?: string | null
  phones?: string[]
  price?: number | null
  payment_method?: string | null
  requires_disassembly?: boolean | null
  has_itbis?: boolean | null
  desmont_amount?: number | null
  itbis_amount?: number | null
  piece_amount?: number | null
  other_discounts_amount?: number | null
  operation_cost_amount?: number | null
  coolant_amount?: number | null
  tapon_amount?: number | null
  other_services_amount?: number | null
  technician_amount?: number | null
  technician_percent?: number | null
  total_rdb_amount?: number | null
  total_rdb_percent?: number | null
}

type ExtractedWorkbook = {
  file: string
  contacts: ExtractedContact[]
  articles: ExtractedArticle[]
  work_orders: ExtractedWorkOrder[]
}

type Args = {
  file?: string
  businessId?: number
  businessRnc?: string
  dryRun: boolean
  mode: ImportMode
}

type ImportSummary = {
  contacts: {
    sourceRows: number
    createdPeople: number
    reusedPeople: number
    createdContacts: number
    skipped: number
  }
  articles: {
    sourceRows: number
    created: number
    updated: number
    compatibilitiesCreated: number
    skipped: number
  }
  workOrders: {
    sourceRows: number
    createdCustomers: number
    reusedCustomers: number
    createdContacts: number
    createdVehicles: number
    reusedVehicles: number
    created: number
    createdReceipts: number
    alreadyImported: number
    skipped: number
  }
}

type CustomerCacheEntry = {
  PERSON_ID: number
  NAME: string
  phoneSet: Set<string>
}

type VehicleCacheEntry = {
  VEHICLE_ID: number
  CUSTOMER_ID: number
  rawKey: string
  descriptorKey: string
}

type ParsedVehicle = {
  rawLabel: string
  brand: string
  model: string
  year: number | null
}

const DEFAULT_FILE = path.resolve(
  process.cwd(),
  '..',
  'plantilla excel taller radiadores.xlsm'
)

const VEHICLE_IMPORT_NOTE_PREFIX = 'IMPORT_TRABAJOS_LABEL='
const WORK_ORDER_IMPORT_MARKER = 'IMPORT_TRABAJOS_ROW='

function resolvePythonRunner(): { bin: string; prefixArgs: string[] } {
  const candidates: Array<{ bin: string; prefixArgs: string[] }> = []

  if (process.env.PYTHON_BIN) {
    candidates.push({ bin: process.env.PYTHON_BIN, prefixArgs: [] })
  }

  if (process.platform === 'win32') {
    candidates.push({ bin: 'py', prefixArgs: ['-3'] })
    candidates.push({ bin: 'python', prefixArgs: [] })
  }

  candidates.push({ bin: 'python3', prefixArgs: [] })
  candidates.push({ bin: '/usr/bin/python3', prefixArgs: [] })

  for (const candidate of candidates) {
    try {
      execFileSync(candidate.bin, [...candidate.prefixArgs, '--version'], {
        stdio: 'ignore',
      })
      return candidate
    } catch {
      continue
    }
  }

  throw new Error(
    'No se encontro un interprete de Python. Defina PYTHON_BIN o instale python/py.'
  )
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    dryRun: false,
    mode: 'all',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    const next = argv[index + 1]

    switch (current) {
      case '--file':
        args.file = next
        index += 1
        break
      case '--business-id':
        args.businessId = Number(next)
        index += 1
        break
      case '--business-rnc':
        args.businessRnc = next
        index += 1
        break
      case '--mode':
        if (
          next === 'all' ||
          next === 'contacts' ||
          next === 'articles' ||
          next === 'work-orders'
        ) {
          args.mode = next
        }
        index += 1
        break
      case '--dry-run':
        args.dryRun = true
        break
      default:
        break
    }
  }

  return args
}

function normalizeText(value?: string | null): string {
  return `${value || ''}`
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeLookupKey(value?: string | null): string {
  return normalizeText(value).toUpperCase()
}

function normalizePhone(value?: string | null): string {
  let digits = `${value || ''}`.replace(/\D/g, '')

  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1)
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  return digits
}

function normalizeMoney(value?: number | null): number | null {
  if (value === undefined || value === null || !Number.isFinite(Number(value))) {
    return null
  }

  return Number(Number(value).toFixed(2))
}

function parseImportedVehicleLabel(notes?: string | null): string {
  const normalized = normalizeText(notes)
  if (!normalized.startsWith(VEHICLE_IMPORT_NOTE_PREFIX)) {
    return ''
  }

  return normalizeText(normalized.slice(VEHICLE_IMPORT_NOTE_PREFIX.length))
}

function buildVehicleImportNote(rawLabel: string): string {
  return `${VEHICLE_IMPORT_NOTE_PREFIX}${normalizeText(rawLabel)}`
}

function buildWorkOrderImportMarker(sourceRow: number, legacyNo?: string | null): string {
  const safeLegacyNo = normalizeText(legacyNo) || 'N/A'
  return `${WORK_ORDER_IMPORT_MARKER}${sourceRow};LEGACY_NO=${safeLegacyNo}`
}

function extractImportedWorkOrderRow(notes?: string | null): number | null {
  const match = normalizeText(notes).match(/IMPORT_TRABAJOS_ROW=(\d+)/)
  return match ? Number(match[1]) : null
}

function buildCompatibilityKey(item: ExtractedCompatibility): string {
  return [
    normalizeLookupKey(item.brand),
    normalizeLookupKey(item.model),
    item.year_from ?? '',
    item.year_to ?? '',
    normalizeLookupKey(item.engine),
  ].join('|')
}

function parseVehicleDescriptor(value?: string | null): ParsedVehicle | null {
  const rawLabel = normalizeText(value)
  if (!rawLabel) return null

  const yearMatch = rawLabel.match(/\b(19\d{2}|20\d{2})\b/)
  const year = yearMatch ? Number(yearMatch[1]) : null
  const cleaned = normalizeText(
    rawLabel.replace(/\b(19\d{2}|20\d{2})\b/g, '').replace(/[/_-]+/g, ' ')
  )
  const tokens = cleaned.split(' ').filter(Boolean)

  if (!tokens.length) return null

  return {
    rawLabel,
    brand: tokens[0].toUpperCase(),
    model: tokens.slice(1).join(' ') || 'SIN MODELO',
    year,
  }
}

function buildVehicleRawKey(customerId: number, rawLabel?: string | null): string {
  return `${customerId}|${normalizeLookupKey(rawLabel)}`
}

function buildVehicleDescriptorKey(
  customerId: number,
  descriptor: ParsedVehicle
): string {
  return [
    customerId,
    normalizeLookupKey(descriptor.brand),
    normalizeLookupKey(descriptor.model),
    descriptor.year ?? '',
  ].join('|')
}

function loadWorkbook(filePath: string): ExtractedWorkbook {
  const pythonScript = path.resolve(__dirname, 'extract_excel_workbook.py')
  const python = resolvePythonRunner()
  const output = execFileSync(
    python.bin,
    [...python.prefixArgs, pythonScript, filePath],
    {
      encoding: 'utf8',
    }
  )

  return JSON.parse(output) as ExtractedWorkbook
}

async function resolveBusiness(args: Args): Promise<Business> {
  const repository = AppDataSource.getRepository(Business)

  if (args.businessId) {
    const business = await repository.findOne({
      where: { BUSINESS_ID: args.businessId },
    })

    if (!business) {
      throw new Error(`No existe negocio con BUSINESS_ID=${args.businessId}`)
    }

    return business
  }

  if (args.businessRnc) {
    const business = await repository.findOne({
      where: { RNC: args.businessRnc },
    })

    if (!business) {
      throw new Error(`No existe negocio con RNC='${args.businessRnc}'`)
    }

    return business
  }

  const businesses = await repository.find({
    order: { BUSINESS_ID: 'ASC' },
    take: 2,
  })

  if (businesses.length === 0) {
    throw new Error('No existe ningun negocio para importar la data.')
  }

  if (businesses.length > 1) {
    throw new Error(
      'Hay multiples negocios. Use --business-id o --business-rnc para indicar el destino.'
    )
  }

  return businesses[0]
}

async function importContacts(
  businessId: number,
  contacts: ExtractedContact[],
  dryRun: boolean
): Promise<ImportSummary['contacts']> {
  const personRepository = AppDataSource.getRepository(Person)
  const contactRepository = AppDataSource.getRepository(Contact)

  const existingPeople = await personRepository.find({
    where: { BUSINESS_ID: businessId },
    relations: ['CONTACTS', 'STAFF'],
  })

  const nameMap = new Map<string, Person>()
  const phoneMap = new Map<string, Person>()

  existingPeople.forEach((person) => {
    if (person.STAFF) {
      return
    }

    const key = normalizeLookupKey(person.NAME)
    if (key && !nameMap.has(key)) {
      nameMap.set(key, person)
    }

    ;(person.CONTACTS || []).forEach((contact) => {
      const phone = normalizePhone(contact.VALUE)
      if (phone && !phoneMap.has(phone)) {
        phoneMap.set(phone, person)
      }
    })
  })

  const summary: ImportSummary['contacts'] = {
    sourceRows: contacts.length,
    createdPeople: 0,
    reusedPeople: 0,
    createdContacts: 0,
    skipped: 0,
  }

  if (dryRun) {
    contacts.forEach((item) => {
      const lookupPhones = item.phones.map(normalizePhone).filter(Boolean)
      const person =
        lookupPhones.map((phone) => phoneMap.get(phone)).find(Boolean) ||
        nameMap.get(normalizeLookupKey(item.name))

      if (person) {
        summary.reusedPeople += 1
      } else {
        summary.createdPeople += 1
      }

      const existingValues = new Set(
        ((person?.CONTACTS || []) as Contact[]).map((contact) =>
          normalizePhone(contact.VALUE)
        )
      )

      summary.createdContacts += lookupPhones.filter(
        (phone) => !existingValues.has(phone)
      ).length

      if (!item.name || lookupPhones.length === 0) {
        summary.skipped += 1
      }
    })

    return summary
  }

  for (const item of contacts) {
    const normalizedName = normalizeText(item.name)
    const lookupPhones = item.phones.map(normalizePhone).filter(Boolean)

    if (!normalizedName && lookupPhones.length === 0) {
      summary.skipped += 1
      continue
    }

    let person =
      lookupPhones.map((phone) => phoneMap.get(phone)).find(Boolean) ||
      nameMap.get(normalizeLookupKey(normalizedName))

    if (person) {
      summary.reusedPeople += 1
    } else {
      person = await personRepository.save(
        personRepository.create({
          BUSINESS_ID: businessId,
          NAME: normalizedName,
          LAST_NAME: null,
          IDENTITY_DOCUMENT: null,
          BIRTH_DATE: null,
          GENDER: null,
          ADDRESS: null,
          STATE: 'A',
        })
      )
      summary.createdPeople += 1
      nameMap.set(normalizeLookupKey(normalizedName), person)
    }

    const currentContacts = await contactRepository.find({
      where: { PERSON_ID: person.PERSON_ID },
    })
    const currentPhones = new Set(
      currentContacts.map((contact) => normalizePhone(contact.VALUE))
    )

    for (const phone of lookupPhones) {
      if (currentPhones.has(phone)) {
        continue
      }

      const contact = contactRepository.create({
        PERSON_ID: person.PERSON_ID,
        TYPE: ContactType.PHONE,
        USAGE: ContactUsage.PERSONAL,
        VALUE: phone,
        IS_PRIMARY: currentContacts.length === 0,
        STATE: 'A',
      })

      await contactRepository.save(contact)
      currentContacts.push(contact)
      currentPhones.add(phone)
      phoneMap.set(phone, person)
      summary.createdContacts += 1
    }
  }

  return summary
}

async function importArticles(
  businessId: number,
  articles: ExtractedArticle[],
  dryRun: boolean
): Promise<ImportSummary['articles']> {
  const articleRepository = AppDataSource.getRepository(Article)
  const compatibilityRepository = AppDataSource.getRepository(ArticleCompatibility)

  const existingArticles = await articleRepository.find({
    where: { BUSINESS_ID: businessId },
    relations: ['COMPATIBILITIES'],
  })
  const articleMap = new Map(
    existingArticles.map((item) => [normalizeLookupKey(item.CODE), item])
  )

  const summary: ImportSummary['articles'] = {
    sourceRows: articles.length,
    created: 0,
    updated: 0,
    compatibilitiesCreated: 0,
    skipped: 0,
  }

  for (const source of articles) {
    const code = normalizeLookupKey(source.code)
    const name = normalizeText(source.name)

    if (!code || !name) {
      summary.skipped += 1
      continue
    }

    let article = articleMap.get(code)

    if (!article) {
      if (dryRun) {
        summary.created += 1
      } else {
        article = await articleRepository.save(
          articleRepository.create({
            BUSINESS_ID: businessId,
            CODE: code,
            NAME: name,
            ITEM_TYPE: 'RADIADOR',
            UNIT_MEASURE: 'UND',
            CATEGORY: 'IMPORTADO EXCEL',
            MIN_STOCK: 0,
            MAX_STOCK: null,
            CURRENT_STOCK: 0,
            COST_REFERENCE:
              source.cost_reference === undefined ? null : source.cost_reference,
            DESCRIPTION: `Importado desde PRECIOS RC (fila ${source.source_row})`,
            STATE: 'A',
          })
        )
        articleMap.set(code, article)
      }
    } else {
      const hasChanges =
        normalizeText(article.NAME) !== name ||
        Number(article.COST_REFERENCE ?? 0) !== Number(source.cost_reference ?? 0)

      if (hasChanges) {
        summary.updated += 1
      }

      if (!dryRun && hasChanges) {
        article.NAME = name
        article.COST_REFERENCE =
          source.cost_reference === undefined ? null : source.cost_reference
        article.ITEM_TYPE = article.ITEM_TYPE || 'RADIADOR'
        article.UNIT_MEASURE = article.UNIT_MEASURE || 'UND'
        article.CATEGORY = article.CATEGORY || 'IMPORTADO EXCEL'
        article.STATE = article.STATE || 'A'
        await articleRepository.save(article)
      }
    }

    const existingCompatibilityKeys = new Set(
      ((article?.COMPATIBILITIES || []) as ArticleCompatibility[]).map((item) =>
        buildCompatibilityKey({
          brand: item.BRAND,
          model: item.MODEL,
          year_from: item.YEAR_FROM,
          year_to: item.YEAR_TO,
          engine: item.ENGINE,
        })
      )
    )

    for (const compatibility of source.compatibilities || []) {
      const key = buildCompatibilityKey(compatibility)
      if (existingCompatibilityKeys.has(key)) {
        continue
      }

      summary.compatibilitiesCreated += 1

      if (dryRun || !article) {
        existingCompatibilityKeys.add(key)
        continue
      }

      const entity = compatibilityRepository.create({
        ARTICLE_ID: article.ARTICLE_ID,
        BRAND: normalizeText(compatibility.brand),
        MODEL: normalizeText(compatibility.model),
        YEAR_FROM: compatibility.year_from ?? null,
        YEAR_TO: compatibility.year_to ?? null,
        ENGINE: normalizeText(compatibility.engine) || null,
        NOTES: normalizeText(compatibility.notes) || null,
        STATE: 'A',
      })

      await compatibilityRepository.save(entity)
      article.COMPATIBILITIES = [...(article.COMPATIBILITIES || []), entity]
      existingCompatibilityKeys.add(key)
    }
  }

  return summary
}

async function resolveFallbackStaff(businessId: number): Promise<Staff> {
  const repository = AppDataSource.getRepository(Staff)
  const staff = await repository.findOne({
    where: { BUSINESS_ID: businessId, STATE: 'A' },
    relations: ['PERSON'],
    order: { STAFF_ID: 'ASC' },
  })

  if (!staff) {
    throw new Error(
      'No existe personal activo para registrar las ordenes importadas.'
    )
  }

  return staff
}

async function resolveWorkOrderStatus(
  businessId: number,
  code: string
): Promise<WorkOrderStatus> {
  const repository = AppDataSource.getRepository(WorkOrderStatus)
  const status = await repository.findOne({
    where: [
      { BUSINESS_ID: businessId, CODE: code, STATE: 'A' },
      { BUSINESS_ID: null, CODE: code, STATE: 'A' },
    ],
    order: { BUSINESS_ID: 'DESC' as never },
  })

  if (!status) {
    throw new Error(`No existe estado de orden '${code}' para importar.`)
  }

  return status
}

function buildOrderNo(workOrderId: number): string {
  return `OT-${String(workOrderId).padStart(6, '0')}`
}

function buildReceiptNo(receiptId: number): string {
  return `ENT-${String(receiptId).padStart(6, '0')}`
}

function buildCustomerCaches(people: Person[]) {
  const nameMap = new Map<string, CustomerCacheEntry>()
  const phoneMap = new Map<string, CustomerCacheEntry>()

  people.forEach((person) => {
    if (person.STAFF) return

    const entry: CustomerCacheEntry = {
      PERSON_ID: person.PERSON_ID,
      NAME: normalizeText(person.NAME),
      phoneSet: new Set(
        (person.CONTACTS || []).map((contact) => normalizePhone(contact.VALUE))
      ),
    }

    const nameKey = normalizeLookupKey(person.NAME)
    if (nameKey && !nameMap.has(nameKey)) {
      nameMap.set(nameKey, entry)
    }

    entry.phoneSet.forEach((phone) => {
      if (phone && !phoneMap.has(phone)) {
        phoneMap.set(phone, entry)
      }
    })
  })

  return { nameMap, phoneMap }
}

function buildVehicleCaches(vehicles: Vehicle[]) {
  const rawMap = new Map<string, VehicleCacheEntry>()
  const descriptorMap = new Map<string, VehicleCacheEntry>()

  vehicles.forEach((vehicle) => {
    const descriptor = parseVehicleDescriptor(
      `${vehicle.BRAND || ''} ${vehicle.MODEL || ''} ${vehicle.YEAR || ''}`
    )

    if (!descriptor) return

    const descriptorKey = buildVehicleDescriptorKey(vehicle.CUSTOMER_ID, descriptor)
    const rawLabel = parseImportedVehicleLabel(vehicle.NOTES)
    const rawKey = rawLabel
      ? buildVehicleRawKey(vehicle.CUSTOMER_ID, rawLabel)
      : buildVehicleRawKey(
          vehicle.CUSTOMER_ID,
          `${vehicle.BRAND || ''} ${vehicle.MODEL || ''} ${vehicle.YEAR || ''}`
        )

    const entry: VehicleCacheEntry = {
      VEHICLE_ID: vehicle.VEHICLE_ID,
      CUSTOMER_ID: vehicle.CUSTOMER_ID,
      rawKey,
      descriptorKey,
    }

    if (rawKey && !rawMap.has(rawKey)) {
      rawMap.set(rawKey, entry)
    }

    if (descriptorKey && !descriptorMap.has(descriptorKey)) {
      descriptorMap.set(descriptorKey, entry)
    }
  })

  return { rawMap, descriptorMap }
}

function buildWorkOrderImportedRowSet(workOrders: WorkOrder[]): Set<number> {
  const importedRows = new Set<number>()

  workOrders.forEach((workOrder) => {
    const sourceRow = extractImportedWorkOrderRow(workOrder.INTERNAL_NOTES)
    if (sourceRow) {
      importedRows.add(sourceRow)
    }
  })

  return importedRows
}

function buildImportedWorkOrderNotes(source: ExtractedWorkOrder): string {
  const segments = [
    buildWorkOrderImportMarker(source.source_row, source.legacy_no),
    source.payment_method
      ? `FORMA_PAGO=${normalizeText(source.payment_method)}`
      : '',
    source.has_itbis === true ? 'ITBIS=SI' : '',
    source.has_itbis === false ? 'ITBIS=NO' : '',
    source.price ? `PRECIO=${source.price}` : '',
    source.desmont_amount ? `DESMONTE_REF=${source.desmont_amount}` : '',
    source.other_discounts_amount
      ? `OTROS_DESCUENTOS=${source.other_discounts_amount}`
      : '',
    source.operation_cost_amount
      ? `COSTO_OPERACION=${source.operation_cost_amount}`
      : '',
    source.coolant_amount ? `COOLANT_REF=${source.coolant_amount}` : '',
    source.tapon_amount ? `TAPON_REF=${source.tapon_amount}` : '',
    source.piece_amount ? `PIEZA_REF=${source.piece_amount}` : '',
    source.technician_amount ? `TECNICOS_REF=${source.technician_amount}` : '',
    source.total_rdb_amount ? `TOTAL_RDB=${source.total_rdb_amount}` : '',
  ].filter(Boolean)

  return segments.join(' | ')
}

function buildImportedServiceLines(source: ExtractedWorkOrder) {
  const lines: Array<{
    SERVICE_TYPE: string
    DESCRIPTION: string
    QUANTITY: number
    REFERENCE_AMOUNT: number
    NOTES: string | null
  }> = []

  const mainDescription =
    normalizeText(source.detail) || 'Trabajo importado desde hoja TRABAJOS'

  lines.push({
    SERVICE_TYPE: 'SERVICIO_IMPORTADO',
    DESCRIPTION: mainDescription,
    QUANTITY: 1,
    REFERENCE_AMOUNT: normalizeMoney(source.price) ?? 0,
    NOTES: source.legacy_no
      ? `No. legacy ${normalizeText(source.legacy_no)}`
      : null,
  })

  if (source.requires_disassembly && (source.desmont_amount || 0) > 0) {
    lines.push({
      SERVICE_TYPE: 'DESMONTE',
      DESCRIPTION: 'Desmonte importado desde Excel',
      QUANTITY: 1,
      REFERENCE_AMOUNT: normalizeMoney(source.desmont_amount) ?? 0,
      NOTES: null,
    })
  }

  if ((source.other_services_amount || 0) > 0) {
    lines.push({
      SERVICE_TYPE: 'OTROS_SERVICIOS',
      DESCRIPTION: 'Otros servicios importados desde Excel',
      QUANTITY: 1,
      REFERENCE_AMOUNT: normalizeMoney(source.other_services_amount) ?? 0,
      NOTES: null,
    })
  }

  return lines
}

function parseSourceDate(value?: string | null): Date {
  if (!value) return new Date()

  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

async function ensureCustomerForWorkOrder(
  manager: EntityManager,
  businessId: number,
  source: ExtractedWorkOrder,
  caches: {
    nameMap: Map<string, CustomerCacheEntry>
    phoneMap: Map<string, CustomerCacheEntry>
  },
  summary: ImportSummary['workOrders']
): Promise<CustomerCacheEntry> {
  const normalizedName = normalizeText(source.customer)
  const phoneCandidates = (source.phones || []).map(normalizePhone).filter(Boolean)
  const nameKey = normalizeLookupKey(normalizedName)

  let customer =
    phoneCandidates.map((phone) => caches.phoneMap.get(phone)).find(Boolean) ||
    caches.nameMap.get(nameKey)

  if (customer) {
    summary.reusedCustomers += 1
  } else {
    const personRepository = manager.getRepository(Person)
    const saved = await personRepository.save(
      personRepository.create({
        BUSINESS_ID: businessId,
        NAME: normalizedName,
        LAST_NAME: null,
        IDENTITY_DOCUMENT: null,
        BIRTH_DATE: null,
        GENDER: null,
        ADDRESS: null,
        STATE: 'A',
      })
    )

    customer = {
      PERSON_ID: saved.PERSON_ID,
      NAME: normalizedName,
      phoneSet: new Set<string>(),
    }

    summary.createdCustomers += 1
    if (nameKey) {
      caches.nameMap.set(nameKey, customer)
    }
  }

  const contactRepository = manager.getRepository(Contact)
  for (const phone of phoneCandidates) {
    if (customer.phoneSet.has(phone)) {
      continue
    }

    await contactRepository.save(
      contactRepository.create({
        PERSON_ID: customer.PERSON_ID,
        TYPE: ContactType.PHONE,
        USAGE: ContactUsage.PERSONAL,
        VALUE: phone,
        IS_PRIMARY: customer.phoneSet.size === 0,
        STATE: 'A',
      })
    )

    customer.phoneSet.add(phone)
    caches.phoneMap.set(phone, customer)
    summary.createdContacts += 1
  }

  if (nameKey && !caches.nameMap.has(nameKey)) {
    caches.nameMap.set(nameKey, customer)
  }

  return customer
}

async function ensureVehicleForWorkOrder(
  manager: EntityManager,
  businessId: number,
  customerId: number,
  source: ExtractedWorkOrder,
  caches: {
    rawMap: Map<string, VehicleCacheEntry>
    descriptorMap: Map<string, VehicleCacheEntry>
  },
  summary: ImportSummary['workOrders']
): Promise<VehicleCacheEntry> {
  const descriptor = parseVehicleDescriptor(source.vehicle)

  if (!descriptor) {
    throw new Error(`Vehiculo invalido en fila ${source.source_row}`)
  }

  const rawKey = buildVehicleRawKey(customerId, descriptor.rawLabel)
  const descriptorKey = buildVehicleDescriptorKey(customerId, descriptor)

  let vehicle = caches.rawMap.get(rawKey) || caches.descriptorMap.get(descriptorKey)

  if (vehicle) {
    summary.reusedVehicles += 1
    return vehicle
  }

  const vehicleRepository = manager.getRepository(Vehicle)
  const saved = await vehicleRepository.save(
    vehicleRepository.create({
      BUSINESS_ID: businessId,
      CUSTOMER_ID: customerId,
      PLATE: null,
      VIN: null,
      BRAND: descriptor.brand,
      MODEL: descriptor.model,
      YEAR: descriptor.year,
      COLOR: null,
      ENGINE: null,
      NOTES: buildVehicleImportNote(descriptor.rawLabel),
      STATE: 'A',
    })
  )

  vehicle = {
    VEHICLE_ID: saved.VEHICLE_ID,
    CUSTOMER_ID: customerId,
    rawKey,
    descriptorKey,
  }

  caches.rawMap.set(rawKey, vehicle)
  caches.descriptorMap.set(descriptorKey, vehicle)
  summary.createdVehicles += 1

  return vehicle
}

async function createImportedWorkOrder(
  manager: EntityManager,
  params: {
    businessId: number
    source: ExtractedWorkOrder
    customerId: number
    vehicleId: number
    deliveredStatusId: number
    fallbackStaffId: number
  }
): Promise<void> {
  const { businessId, source, customerId, vehicleId, deliveredStatusId, fallbackStaffId } =
    params
  const openedAt = parseSourceDate(source.opened_at)
  const internalNotes = buildImportedWorkOrderNotes(source)
  const phone = (source.phones || []).map(normalizePhone).find(Boolean) || null

  const workOrderRepository = manager.getRepository(WorkOrder)
  const serviceLineRepository = manager.getRepository(WorkOrderServiceLine)
  const historyRepository = manager.getRepository(WorkOrderStatusHistory)
  const receiptRepository = manager.getRepository(DeliveryReceipt)

  const savedWorkOrder = await workOrderRepository.save(
    workOrderRepository.create({
      BUSINESS_ID: businessId,
      CUSTOMER_ID: customerId,
      VEHICLE_ID: vehicleId,
      STATUS_ID: deliveredStatusId,
      RECEIVED_BY_STAFF_ID: fallbackStaffId,
      DELIVERED_BY_STAFF_ID: fallbackStaffId,
      OPENED_AT: openedAt,
      PROMISED_AT: null,
      CLOSED_AT: openedAt,
      CANCELLED_AT: null,
      SYMPTOM:
        normalizeText(source.detail) || 'Orden importada desde hoja TRABAJOS',
      DIAGNOSIS: null,
      WORK_PERFORMED: normalizeText(source.detail) || null,
      INTERNAL_NOTES: internalNotes,
      CUSTOMER_OBSERVATIONS: source.payment_method
        ? `Forma de pago original: ${normalizeText(source.payment_method)}`
        : null,
      REQUIRES_DISASSEMBLY: Boolean(source.requires_disassembly),
      STATE: 'A',
      CREATED_BY: fallbackStaffId,
      UPDATED_BY: fallbackStaffId,
    })
  )

  savedWorkOrder.ORDER_NO = buildOrderNo(savedWorkOrder.WORK_ORDER_ID)
  await workOrderRepository.save(savedWorkOrder)

  const serviceLines = buildImportedServiceLines(source)
  if (serviceLines.length) {
    await serviceLineRepository.save(
      serviceLines.map((line) =>
        serviceLineRepository.create({
          WORK_ORDER_ID: savedWorkOrder.WORK_ORDER_ID,
          SERVICE_TYPE: line.SERVICE_TYPE,
          DESCRIPTION: line.DESCRIPTION,
          QUANTITY: line.QUANTITY,
          REFERENCE_AMOUNT: line.REFERENCE_AMOUNT,
          NOTES: line.NOTES,
          CREATED_BY: fallbackStaffId,
          STATE: 'A',
        })
      )
    )
  }

  await historyRepository.save(
    historyRepository.create({
      WORK_ORDER_ID: savedWorkOrder.WORK_ORDER_ID,
      STATUS_ID: deliveredStatusId,
      CHANGED_BY_STAFF_ID: fallbackStaffId,
      CHANGED_AT: openedAt,
      NOTES: 'Orden importada desde hoja TRABAJOS',
    })
  )

  const savedReceipt = await receiptRepository.save(
    receiptRepository.create({
      BUSINESS_ID: businessId,
      WORK_ORDER_ID: savedWorkOrder.WORK_ORDER_ID,
      DELIVERED_BY_STAFF_ID: fallbackStaffId,
      DELIVERY_DATE: openedAt,
      RECEIVED_BY_NAME: normalizeText(source.customer) || 'Cliente',
      RECEIVED_BY_DOCUMENT: null,
      RECEIVED_BY_PHONE: phone,
      OBSERVATIONS: `Importado desde hoja TRABAJOS (fila ${source.source_row})`,
      STATE: 'A',
      CREATED_BY: fallbackStaffId,
      UPDATED_BY: fallbackStaffId,
    })
  )

  savedReceipt.RECEIPT_NO = buildReceiptNo(savedReceipt.DELIVERY_RECEIPT_ID)
  await receiptRepository.save(savedReceipt)
}

function resolveOrCreateDryRunCustomer(
  source: ExtractedWorkOrder,
  caches: {
    nameMap: Map<string, CustomerCacheEntry>
    phoneMap: Map<string, CustomerCacheEntry>
    nextTempId: number
  },
  summary: ImportSummary['workOrders']
): CustomerCacheEntry {
  const normalizedName = normalizeText(source.customer)
  const nameKey = normalizeLookupKey(normalizedName)
  const phoneCandidates = (source.phones || []).map(normalizePhone).filter(Boolean)

  let customer =
    phoneCandidates.map((phone) => caches.phoneMap.get(phone)).find(Boolean) ||
    caches.nameMap.get(nameKey)

  if (customer) {
    summary.reusedCustomers += 1
  } else {
    customer = {
      PERSON_ID: caches.nextTempId--,
      NAME: normalizedName,
      phoneSet: new Set<string>(),
    }
    summary.createdCustomers += 1
    if (nameKey) {
      caches.nameMap.set(nameKey, customer)
    }
  }

  phoneCandidates.forEach((phone) => {
    if (customer && !customer.phoneSet.has(phone)) {
      customer.phoneSet.add(phone)
      caches.phoneMap.set(phone, customer)
      summary.createdContacts += 1
    }
  })

  return customer
}

function resolveOrCreateDryRunVehicle(
  customerId: number,
  source: ExtractedWorkOrder,
  caches: {
    rawMap: Map<string, VehicleCacheEntry>
    descriptorMap: Map<string, VehicleCacheEntry>
    nextTempId: number
  },
  summary: ImportSummary['workOrders']
): VehicleCacheEntry {
  const descriptor = parseVehicleDescriptor(source.vehicle)

  if (!descriptor) {
    throw new Error(`Vehiculo invalido en fila ${source.source_row}`)
  }

  const rawKey = buildVehicleRawKey(customerId, descriptor.rawLabel)
  const descriptorKey = buildVehicleDescriptorKey(customerId, descriptor)
  let vehicle = caches.rawMap.get(rawKey) || caches.descriptorMap.get(descriptorKey)

  if (vehicle) {
    summary.reusedVehicles += 1
    return vehicle
  }

  vehicle = {
    VEHICLE_ID: caches.nextTempId--,
    CUSTOMER_ID: customerId,
    rawKey,
    descriptorKey,
  }

  caches.rawMap.set(rawKey, vehicle)
  caches.descriptorMap.set(descriptorKey, vehicle)
  summary.createdVehicles += 1
  return vehicle
}

async function importWorkOrders(
  businessId: number,
  workOrders: ExtractedWorkOrder[],
  dryRun: boolean
): Promise<ImportSummary['workOrders']> {
  const personRepository = AppDataSource.getRepository(Person)
  const vehicleRepository = AppDataSource.getRepository(Vehicle)
  const workOrderRepository = AppDataSource.getRepository(WorkOrder)

  const existingPeople = await personRepository.find({
    where: { BUSINESS_ID: businessId },
    relations: ['CONTACTS', 'STAFF'],
  })
  const existingVehicles = await vehicleRepository.find({
    where: { BUSINESS_ID: businessId },
  })
  const existingWorkOrders = await workOrderRepository.find({
    where: { BUSINESS_ID: businessId },
  })

  const customerCaches = buildCustomerCaches(existingPeople)
  const vehicleCaches = buildVehicleCaches(existingVehicles)
  const importedRows = buildWorkOrderImportedRowSet(existingWorkOrders)
  const summary: ImportSummary['workOrders'] = {
    sourceRows: workOrders.length,
    createdCustomers: 0,
    reusedCustomers: 0,
    createdContacts: 0,
    createdVehicles: 0,
    reusedVehicles: 0,
    created: 0,
    createdReceipts: 0,
    alreadyImported: 0,
    skipped: 0,
  }

  if (dryRun) {
    const dryRunCustomerCaches = {
      ...customerCaches,
      nextTempId: -1,
    }
    const dryRunVehicleCaches = {
      ...vehicleCaches,
      nextTempId: -1,
    }

    for (const source of workOrders) {
      const customerName = normalizeText(source.customer)
      const vehicleLabel = normalizeText(source.vehicle)

      if (!customerName || !vehicleLabel) {
        summary.skipped += 1
        continue
      }

      if (importedRows.has(source.source_row)) {
        summary.alreadyImported += 1
        continue
      }

      const customer = resolveOrCreateDryRunCustomer(
        source,
        dryRunCustomerCaches,
        summary
      )
      resolveOrCreateDryRunVehicle(
        customer.PERSON_ID,
        source,
        dryRunVehicleCaches,
        summary
      )

      importedRows.add(source.source_row)
      summary.created += 1
      summary.createdReceipts += 1
    }

    return summary
  }

  const fallbackStaff = await resolveFallbackStaff(businessId)
  const deliveredStatus = await resolveWorkOrderStatus(businessId, 'ENTREGADA')

  for (const source of workOrders) {
    const customerName = normalizeText(source.customer)
    const vehicleLabel = normalizeText(source.vehicle)

    if (!customerName || !vehicleLabel) {
      summary.skipped += 1
      continue
    }

    if (importedRows.has(source.source_row)) {
      summary.alreadyImported += 1
      continue
    }

    try {
      await AppDataSource.transaction(async (manager) => {
        const customer = await ensureCustomerForWorkOrder(
          manager,
          businessId,
          source,
          customerCaches,
          summary
        )
        const vehicle = await ensureVehicleForWorkOrder(
          manager,
          businessId,
          customer.PERSON_ID,
          source,
          vehicleCaches,
          summary
        )

        await createImportedWorkOrder(manager, {
          businessId,
          source,
          customerId: customer.PERSON_ID,
          vehicleId: vehicle.VEHICLE_ID,
          deliveredStatusId: deliveredStatus.STATUS_ID,
          fallbackStaffId: fallbackStaff.STAFF_ID,
        })
      })
    } catch (error) {
      throw new Error(
        `Error importando TRABAJOS en fila ${source.source_row}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }

    importedRows.add(source.source_row)
    summary.created += 1
    summary.createdReceipts += 1
  }

  return summary
}

async function run(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const filePath = path.resolve(args.file || DEFAULT_FILE)

  const workbook = loadWorkbook(filePath)
  await AppDataSource.initialize()

  try {
    const business = await resolveBusiness(args)

    console.info(`Archivo: ${workbook.file}`)
    console.info(`Negocio destino: ${business.NAME} (${business.BUSINESS_ID})`)
    console.info(`Modo: ${args.mode}`)
    console.info(`Dry run: ${args.dryRun ? 'SI' : 'NO'}`)

    const summary: ImportSummary = {
      contacts: {
        sourceRows: 0,
        createdPeople: 0,
        reusedPeople: 0,
        createdContacts: 0,
        skipped: 0,
      },
      articles: {
        sourceRows: 0,
        created: 0,
        updated: 0,
        compatibilitiesCreated: 0,
        skipped: 0,
      },
      workOrders: {
        sourceRows: 0,
        createdCustomers: 0,
        reusedCustomers: 0,
        createdContacts: 0,
        createdVehicles: 0,
        reusedVehicles: 0,
        created: 0,
        createdReceipts: 0,
        alreadyImported: 0,
        skipped: 0,
      },
    }

    if (args.mode === 'all' || args.mode === 'contacts') {
      summary.contacts = await importContacts(
        business.BUSINESS_ID,
        workbook.contacts,
        args.dryRun
      )
    }

    if (args.mode === 'all' || args.mode === 'articles') {
      summary.articles = await importArticles(
        business.BUSINESS_ID,
        workbook.articles,
        args.dryRun
      )
    }

    if (args.mode === 'all' || args.mode === 'work-orders') {
      summary.workOrders = await importWorkOrders(
        business.BUSINESS_ID,
        workbook.work_orders || [],
        args.dryRun
      )
    }

    console.info('\nResumen importacion')
    console.info(JSON.stringify(summary, null, 2))
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy()
    }
  }
}

run().catch((error) => {
  console.error('Error ejecutando importacion desde Excel')
  console.error(error)
  process.exit(1)
})
