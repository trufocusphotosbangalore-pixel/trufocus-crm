import { useState, useEffect, useCallback, useRef } from 'react'
import * as woService from '@/services/supabase/workOrders'
import type { WorkOrder, WorkOrderFilters, WorkOrderWizardData } from '@/types/workOrders'
import type { SortConfig, PaginatedResult, ApiResponse } from '@/types/common'
import { useDebounce } from './useDebounce'
import { useRealtimeSync } from './useRealtimeSync'

// ─── Work Orders Hook (Instant Local Initialization + Silent Cloud Sync v1.1) ──────────
const DEFAULT_FILTERS: WorkOrderFilters = {
  search: '', status: 'all', event_type: 'all', payment_status: 'all', date_range: 'all',
}

const DEFAULT_SORT: SortConfig = { field: 'created_at', direction: 'desc' }

interface UseWorkOrdersReturn {
  result: PaginatedResult<WorkOrder>
  isLoading: boolean
  filters: WorkOrderFilters
  sort: SortConfig
  page: number
  pageSize: number
  setFilters: (f: Partial<WorkOrderFilters>) => void
  resetFilters: () => void
  setSort: (s: SortConfig) => void
  setPage: (p: number) => void
  setPageSize: (s: number) => void
  refresh: () => void
  createWorkOrder: (data: WorkOrderWizardData, userId: string, isDraft?: boolean) => Promise<{ data?: WorkOrder | null; error: string | null }>
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => Promise<{ error: string | null }>
  deleteWorkOrder: (id: string) => Promise<{ error: string | null }>
  archiveWorkOrder: (id: string, reason?: string) => Promise<{ success: boolean; message: string }>
  unarchiveWorkOrder: (id: string) => Promise<{ success: boolean; message: string }>
  recordPayment: (params: woService.RecordPaymentParams) => Promise<ApiResponse<woService.RecordPaymentResult>>
}

export function useWorkOrders(): UseWorkOrdersReturn {
  const [filters, setFiltersState] = useState<WorkOrderFilters>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<SortConfig>(DEFAULT_SORT)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const debouncedSearch = useDebounce(filters.search, 350)

  const [result, setResult] = useState<PaginatedResult<WorkOrder>>(() => {
    return woService.fetchWorkOrdersLocal(DEFAULT_FILTERS, DEFAULT_SORT, page, pageSize)
  })
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async (isSilent = false) => {
    const shouldShowSkeleton = !isSilent && result.items.length === 0
    if (shouldShowSkeleton) setIsLoading(true)
    try {
      const data = await woService.fetchWorkOrders(
        { ...filters, search: debouncedSearch }, sort, page, pageSize
      )
      setResult(data)
    } finally {
      if (shouldShowSkeleton) setIsLoading(false)
    }
  }, [filters.status, filters.event_type, filters.payment_status, filters.date_range, debouncedSearch, sort.field, sort.direction, page, pageSize, result.items.length])

  useEffect(() => { load(true) }, [load])

  const handleRealtimeSync = useCallback(() => {
    load(true)
  }, [load])

  useRealtimeSync(handleRealtimeSync)

  const setFilters = useCallback((partial: Partial<WorkOrderFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }))
    setPage(1)
  }, [])

  const resetFilters = useCallback(() => { setFiltersState(DEFAULT_FILTERS); setPage(1) }, [])

  const refresh = useCallback(() => { load(false) }, [load])

  const createWorkOrder = useCallback(async (data: WorkOrderWizardData, userId: string, isDraft = false) => {
    const r = await woService.createWorkOrder(data, userId, isDraft)
    if (!r.error) refresh()
    return { data: r.data, error: r.error }
  }, [refresh])

  const updateWorkOrder = useCallback(async (id: string, updates: Partial<WorkOrder>) => {
    const r = await woService.updateWorkOrder(id, updates)
    if (!r.error) refresh()
    return { error: r.error }
  }, [refresh])

  const deleteWorkOrder = useCallback(async (id: string) => {
    const r = await woService.deleteWorkOrder(id)
    if (!r.error) refresh()
    return { error: r.error }
  }, [refresh])

  const archiveWorkOrder = useCallback(async (id: string, reason = '') => {
    const res = woService.archiveWorkOrder(id, 'Admin', reason)
    refresh()
    return res
  }, [refresh])

  const unarchiveWorkOrder = useCallback(async (id: string) => {
    const res = woService.unarchiveWorkOrder(id, 'Admin')
    refresh()
    return res
  }, [refresh])

  const recordPayment = useCallback(async (params: woService.RecordPaymentParams) => {
    const r = await woService.recordWorkOrderPayment(params)
    if (!r.error) refresh()
    return r
  }, [refresh])

  return {
    result, isLoading, filters, sort, page, pageSize,
    setFilters, resetFilters, setSort, setPage, setPageSize, refresh,
    createWorkOrder, updateWorkOrder, deleteWorkOrder, archiveWorkOrder, unarchiveWorkOrder, recordPayment,
  }
}
