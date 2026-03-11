import { RequestContext } from '@src/types/api.types'
import { AsyncLocalStorage } from 'async_hooks'

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>()
