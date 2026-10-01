import { useState, useEffect, useCallback, useRef } from 'react'
import * as enquiryService from '@/services/supabase/enquiries'
import type { Enquiry, EnquiryFilters, EnquiryFormData } from '@/types/enquiries'
import type { SortConfig, PaginatedResult } from '@/types/common'
import { useDebounce } from './useDebounce'
import { useRealtimeSync } from './useRealtimeSync'

const DEFAULT_FILTERS: EnquiryFilters = {
  search: '',
  status: 'all',
  source: 'all',
  event_type: 'all',
  date_range: 'all',
  date_from: '',
  date_to: '',
}

const DEFAULT_SORT: SortConfig = {
  field: 'created_at',
  direction: 'desc',
}

interface UseEnquiriesReturn {
  result: PaginatedResult<Enquiry>
  isLoading: boolean
  filters: EnquiryFilters
  sort: SortConfig
  page: number
  pageSize: number
  setFilters: (filters: Partial<EnquiryFilters>) => void
  resetFilters: () => void
  setSort: (sort: SortConfig) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  refresh: () => void
  createEnquiry: (form: EnquiryFormData, userId: string) => Promise<{ error: string | null }>
  updateEnquiry: (id: string, form: Partial<EnquiryFormData>) => Promise<{ error: string | null }>
  deleteEnquiry: (id: string) => Promise<{ error: string | null }>
}

export function useEnquiries(): UseEnquiriesReturn {
  const [result, setResult] = useState<PaginatedResult<Enquiry>>({
    items: [],
    meta: { page: 1, pageSize: 25, total: 0, totalPages: 0 },
  })
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFiltersState] = useState<EnquiryFilters>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<SortConfig>(DEFAULT_SORT)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const refreshCounter = useRef(0)

  // Debounce search to avoid hammering the DB
  const debouncedSearch = useDebounce(filters.search, 350)

  const isInitialLoad = useRef(true)

  const load = useCallback(async (showSkeleton = false) => {
    if (showSkeleton) {
      setIsLoading(true)
    }
    try {
      const effectiveFilters = { ...filters, search: debouncedSearch }
      const data = await enquiryService.fetchEnquiries(effectiveFilters, sort, page, pageSize)
      setResult(data)
    } finally {
      setIsLoading(false)
    }
  }, [filters, debouncedSearch, sort, page, pageSize])

  useEffect(() => {
    load(isInitialLoad.current)
    isInitialLoad.current = false
  }, [load])

  // Instant Cross-Tab Real-Time Sync (silent background update)
  const handleSilentSync = useCallback(() => {
    load(false)
  }, [load])

  useRealtimeSync(handleSilentSync)

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters.status, filters.source, filters.event_type, filters.date_range])

  const setFilters = useCallback((partial: Partial<EnquiryFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }))
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS)
    setPage(1)
  }, [])

  const refresh = useCallback(() => {
    refreshCounter.current += 1
    load()
  }, [load])

  const createEnquiry = useCallback(
    async (form: EnquiryFormData, userId: string) => {
      const result = await enquiryService.createEnquiry(form, userId)
      if (!result.error) refresh()
      return { error: result.error }
    },
    [refresh]
  )

  const updateEnquiry = useCallback(
    async (id: string, form: Partial<EnquiryFormData>) => {
      const result = await enquiryService.updateEnquiry(id, form)
      if (!result.error) refresh()
      return { error: result.error }
    },
    [refresh]
  )

  const deleteEnquiry = useCallback(
    async (id: string) => {
      const result = await enquiryService.deleteEnquiry(id)
      if (!result.error) refresh()
      return { error: result.error }
    },
    [refresh]
  )

  return {
    result,
    isLoading,
    filters,
    sort,
    page,
    pageSize,
    setFilters,
    resetFilters,
    setSort,
    setPage,
    setPageSize,
    refresh,
    createEnquiry,
    updateEnquiry,
    deleteEnquiry,
  }
}
