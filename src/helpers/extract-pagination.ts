import {
  DEFAULT_PAGINATION_PAGE_NUMBER,
  DEFAULT_PAGINATION_PAGE_SIZE,
} from '@src/constants/general'
import { Pagination } from '@src/types/api.types'
import { assert } from './assert'

export const extractPagination = (
  query: Record<string, unknown>
): Pagination => {
  const {
    page = DEFAULT_PAGINATION_PAGE_NUMBER,
    size = DEFAULT_PAGINATION_PAGE_SIZE,

    order = 'DESC',
  } = query

  const orderBy = query?.orderBy as string

  assert<'ASC' | 'DESC'>(order)

  return { page: Number(page), size: Number(size), orderBy, order }
}
