/**
 * Identifiers for initial mock/demo work orders that should never resurrect in production.
 */
export const LEGACY_DEMO_WO_NUMBERS = new Set<string>([
  'WO-2025-915',
  'WO-2025-245',
  'WO-2025-783',
  'WO-2025-187',
  'WO-2025-168',
  'WO-2025-444',
  'WO-2025-988',
  'WO-2025-976',
  'WO-2025-806',
  'WO-2025-159',
  'WO-2025-589',
  'WO-2025-940',
  'WO-2025-317',
])

export const LEGACY_DEMO_WO_IDS = new Set<string>([
  'wo-1785920742092',
  'wo-1785913573322',
  'wo-1785913403094',
  'wo-1785913150507',
  'wo-1785912924529',
  'wo-1785912719974',
  'wo-1785912419464',
  'wo-1785912163251',
  'wo-1785911946785',
  'wo-1785911544016',
  'wo-1785910976632',
  'wo-1785910542100',
  'wo-1785853783806',
])

export function isLegacyDemoWorkOrder(w: any): boolean {
  if (!w) return false
  const woNum = (w.work_order_number || '').trim().toUpperCase()
  const woId = (w.id || '').trim().toLowerCase()

  if (woNum && LEGACY_DEMO_WO_NUMBERS.has(woNum)) return true
  if (woId && LEGACY_DEMO_WO_IDS.has(woId)) return true
  return false
}

export function filterOutLegacyDemoItems<T = any>(items: T[]): T[] {
  if (!Array.isArray(items)) return []
  return items.filter((item: any) => {
    if (!item) return false
    const woNum = (item.work_order_number || item.workOrderNumber || '').trim().toUpperCase()
    const woId = (item.work_order_id || item.workOrderId || item.id || '').trim().toLowerCase()

    if (woNum && LEGACY_DEMO_WO_NUMBERS.has(woNum)) return false
    if (woId && LEGACY_DEMO_WO_IDS.has(woId)) return false
    return true
  })
}
