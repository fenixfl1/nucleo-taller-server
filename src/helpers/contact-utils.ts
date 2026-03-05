import { BadRequestError } from '@api/errors/http.error'
import { ContactType, ContactUsage } from '@entity/Contact'

export type ContactInput = {
  TYPE?: ContactType | string
  USAGE?: ContactUsage | string
  VALUE?: string
  IS_PRIMARY?: boolean
}

export type NormalizedContact = {
  TYPE: ContactType
  USAGE: ContactUsage
  VALUE: string
  IS_PRIMARY: boolean
}

const validContactTypes = new Set<string>(Object.values(ContactType))
const validContactUsage = new Set<string>(Object.values(ContactUsage))

const normalizeType = (value?: string): ContactType => {
  const normalized = (value || '').trim().toLowerCase()

  if (!validContactTypes.has(normalized)) {
    throw new BadRequestError(`Tipo de contacto inválido: '${value}'.`)
  }

  return normalized as ContactType
}

const normalizeUsage = (value?: string): ContactUsage => {
  const normalized = (value || ContactUsage.PERSONAL).trim().toLowerCase()

  if (!validContactUsage.has(normalized)) {
    throw new BadRequestError(`Uso de contacto inválido: '${value}'.`)
  }

  return normalized as ContactUsage
}

export const normalizeContacts = (
  contacts: ContactInput[] = []
): NormalizedContact[] => {
  const normalized = (contacts || [])
    .filter(Boolean)
    .map((contact) => {
      const TYPE = normalizeType(String(contact.TYPE || ''))
      const USAGE = normalizeUsage(
        typeof contact.USAGE === 'string' ? contact.USAGE : undefined
      )
      const VALUE = String(contact.VALUE || '').trim()
      const IS_PRIMARY = Boolean(contact.IS_PRIMARY)

      if (!VALUE) {
        throw new BadRequestError(
          `El valor del contacto de tipo '${TYPE}' es requerido.`
        )
      }

      return { TYPE, USAGE, VALUE, IS_PRIMARY }
    })

  const dedupMap = new Map<string, NormalizedContact>()
  normalized.forEach((contact) => {
    const key = `${contact.TYPE}|${contact.USAGE}|${contact.VALUE.toLowerCase()}`
    if (!dedupMap.has(key)) {
      dedupMap.set(key, contact)
    }
  })

  const uniqueContacts = Array.from(dedupMap.values())

  const primaryByType = new Map<ContactType, number>()
  uniqueContacts.forEach((contact) => {
    if (!contact.IS_PRIMARY) return

    const currentCount = primaryByType.get(contact.TYPE) || 0
    primaryByType.set(contact.TYPE, currentCount + 1)
  })

  for (const [type, count] of primaryByType.entries()) {
    if (count > 1) {
      throw new BadRequestError(
        `Solo puede existir un contacto principal para el tipo '${type}'.`
      )
    }
  }

  return uniqueContacts
}

export const contactsFromLegacyFields = ({
  EMAIL,
  PHONE,
}: {
  EMAIL?: string | null
  PHONE?: string | null
}): ContactInput[] => {
  const contacts: ContactInput[] = []

  if (EMAIL?.trim()) {
    contacts.push({
      TYPE: ContactType.EMAIL,
      USAGE: ContactUsage.PERSONAL,
      VALUE: EMAIL.trim(),
      IS_PRIMARY: true,
    })
  }

  if (PHONE?.trim()) {
    contacts.push({
      TYPE: ContactType.PHONE,
      USAGE: ContactUsage.PERSONAL,
      VALUE: PHONE.trim(),
      IS_PRIMARY: true,
    })
  }

  return contacts
}

export const getPrimaryContactValue = (
  contacts: Array<{ TYPE: ContactType; VALUE: string; IS_PRIMARY: boolean }>,
  type: ContactType
): string => {
  if (!contacts?.length) return ''

  const primary = contacts.find(
    (contact) => contact.TYPE === type && contact.IS_PRIMARY
  )
  if (primary?.VALUE) return primary.VALUE

  const first = contacts.find((contact) => contact.TYPE === type)
  return first?.VALUE || ''
}
