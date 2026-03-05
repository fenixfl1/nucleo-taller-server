export type PaginationLinks = {
  nextPage?: Nullable<string>
  previousPage?: Nullable<string>
  first?: string
  previous?: string
  next?: string
  last?: string
}

export interface Metadata {
  pagination: {
    currentPage: number
    totalPages: number
    totalRows: number
    count: number
    pageSize: number
    links?: PaginationLinks
  }
}

export interface ApiResponse<T = unknown> {
  error?: boolean
  message?: string
  data?: T
  metadata?: Metadata
  status?: number
}

export type Nullable<T> = T | null

export interface SessionInfo {
  userId: number
  username: string
}

export type ParamsLocation = 'params' | 'body' | 'query'

export interface QueryParam {
  [key: string]: string
}

export interface Pagination {
  page: number
  size: number
  orderBy: string
  order: 'ASC' | 'DESC'
}

export interface SimpleCondition<T = unknown> {
  condition: { [P in keyof T]?: T[P] }
  select?: (keyof T)[]
  orden?: Record<keyof T, 'ASC' | 'DESC'>
}

export interface AdvancedCondition<T = unknown> {
  value: string | number | boolean | (string | number)[]
  field: keyof T | (keyof T)[]
  operator: string
}
