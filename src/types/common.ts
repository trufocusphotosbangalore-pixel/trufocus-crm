/**
 * Common shared TypeScript types used across the application.
 */

/** Generic API response wrapper */
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

/** Pagination metadata */
export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

/** Paginated list result */
export interface PaginatedResult<T> {
  items: T[]
  meta: PaginationMeta
}

/** Sort direction */
export type SortDirection = 'asc' | 'desc'

/** Sort config */
export interface SortConfig {
  field: string
  direction: SortDirection
}

/** Filter config */
export interface FilterConfig {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'in'
  value: unknown
}

/** Status badge variant */
export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'

/** Sidebar navigation item */
export interface NavItem {
  id: string
  label: string
  path: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: number
}

/** Notification item */
export interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  created_at: string
  type: 'info' | 'success' | 'warning' | 'error'
}

/** Base entity fields present on all database records */
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}
