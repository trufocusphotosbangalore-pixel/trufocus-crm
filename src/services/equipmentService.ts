import { pullTableFromCloud, pushEntityToCloud, isCloudConfigured } from './cloudSyncService'

export type EquipmentCategory =
  | 'Camera'
  | 'Lens'
  | 'Drone'
  | 'Lighting'
  | 'Flash'
  | 'Audio / Mic'
  | 'Gimbal'
  | 'Tripod'
  | 'Battery'
  | 'Memory Card'
  | 'Accessory'

export type EquipmentCondition = 'Excellent' | 'Good' | 'Fair' | 'Needs Service' | 'Damaged'

export type EquipmentStatus = 'Available' | 'Assigned' | 'In Maintenance' | 'Retired'

export interface EquipmentItem {
  id: string
  item_name: string
  category: EquipmentCategory
  brand?: string
  model?: string
  serial_number: string
  assigned_to_employee_id: string
  assigned_to_employee_name?: string
  condition: EquipmentCondition
  battery_percentage?: number
  return_status: EquipmentStatus
  purchase_date?: string
  purchase_price?: number
  assigned_date?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface EquipmentDamageReport {
  id: string
  equipment_id: string
  equipment_name: string
  employee_id: string
  employee_name?: string
  reported_at: string
  damage_description: string
  severity?: 'Low' | 'Medium' | 'High' | 'Critical'
  photos?: string[]
  status: 'Pending Review' | 'In Repair' | 'Repaired' | 'Written Off'
}

const EQUIPMENT_STORAGE_KEY = 'trufocus_crm_equipment_items_v1'
const DAMAGE_REPORTS_KEY = 'trufocus_crm_damage_reports_v1'

export const DEFAULT_EQUIPMENT_ITEMS: EquipmentItem[] = [
  {
    id: 'eq_1',
    item_name: 'Sony A7IV Body',
    category: 'Camera',
    brand: 'Sony',
    model: 'ILCE-7M4',
    serial_number: 'SN-998822',
    assigned_to_employee_id: 'emp_murali',
    assigned_to_employee_name: 'Murali',
    condition: 'Excellent',
    battery_percentage: 95,
    return_status: 'Assigned',
    assigned_date: '2026-08-01',
    notes: 'Primary full-frame body for photo & hybrid shoots',
    created_at: '2026-01-10T10:00:00.000Z',
    updated_at: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'eq_2',
    item_name: 'Sony 24-70mm f/2.8 GM Lens',
    category: 'Lens',
    brand: 'Sony',
    model: 'SEL2470GM',
    serial_number: 'SN-443311',
    assigned_to_employee_id: 'emp_murali',
    assigned_to_employee_name: 'Murali',
    condition: 'Good',
    battery_percentage: 100,
    return_status: 'Assigned',
    assigned_date: '2026-08-01',
    notes: 'Standard workhorse G-Master zoom lens',
    created_at: '2026-01-10T10:00:00.000Z',
    updated_at: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'eq_3',
    item_name: 'DJI Mavic 3 Pro Drone Kit',
    category: 'Drone',
    brand: 'DJI',
    model: 'Mavic 3 Pro',
    serial_number: 'SN-772299',
    assigned_to_employee_id: 'emp_murali',
    assigned_to_employee_name: 'Murali',
    condition: 'Excellent',
    battery_percentage: 92,
    return_status: 'Assigned',
    assigned_date: '2026-08-01',
    notes: 'Triple-camera aerial setup with RC Pro Controller',
    created_at: '2026-01-10T10:00:00.000Z',
    updated_at: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'eq_4',
    item_name: 'Aputure 300d Light + Softbox',
    category: 'Lighting',
    brand: 'Aputure',
    model: 'LS C300d II',
    serial_number: 'SN-112233',
    assigned_to_employee_id: '',
    assigned_to_employee_name: 'Studio Locker',
    condition: 'Fair',
    battery_percentage: 100,
    return_status: 'Available',
    assigned_date: '',
    notes: 'Studio stage light with Light Dome II diffuser',
    created_at: '2026-01-10T10:00:00.000Z',
    updated_at: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'eq_5',
    item_name: 'Sennheiser Wireless Mic Pack',
    category: 'Audio / Mic',
    brand: 'Sennheiser',
    model: 'EW-D SKM-S',
    serial_number: 'SN-556677',
    assigned_to_employee_id: 'emp_murali',
    assigned_to_employee_name: 'Murali',
    condition: 'Good',
    battery_percentage: 80,
    return_status: 'Assigned',
    assigned_date: '2026-08-01',
    notes: 'UHF Wireless lavalier receiver and transmitter pack',
    created_at: '2026-01-10T10:00:00.000Z',
    updated_at: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'eq_6',
    item_name: 'Sony FX3 Cinema Line Camera',
    category: 'Camera',
    brand: 'Sony',
    model: 'ILME-FX3',
    serial_number: 'SN-665511',
    assigned_to_employee_id: '',
    assigned_to_employee_name: 'Studio Locker',
    condition: 'Excellent',
    battery_percentage: 100,
    return_status: 'Available',
    assigned_date: '',
    notes: 'Full-frame cinema camera for professional 4K 120p videography',
    created_at: '2026-02-01T10:00:00.000Z',
    updated_at: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'eq_7',
    item_name: 'Canon EOS R5 Body',
    category: 'Camera',
    brand: 'Canon',
    model: 'EOS R5',
    serial_number: 'SN-332211',
    assigned_to_employee_id: '',
    assigned_to_employee_name: 'Studio Locker',
    condition: 'Excellent',
    battery_percentage: 100,
    return_status: 'Available',
    assigned_date: '',
    notes: 'High-resolution 45MP camera for wedding portraiture & fine art',
    created_at: '2026-02-01T10:00:00.000Z',
    updated_at: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'eq_8',
    item_name: 'Sony A7SIII Body',
    category: 'Camera',
    brand: 'Sony',
    model: 'ILCE-7SM3',
    serial_number: 'SN-882244',
    assigned_to_employee_id: '',
    assigned_to_employee_name: 'Studio Locker',
    condition: 'Good',
    battery_percentage: 90,
    return_status: 'Available',
    assigned_date: '',
    notes: 'Low-light specialist camera for reception videography & candid shoots',
    created_at: '2026-02-01T10:00:00.000Z',
    updated_at: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'eq_9',
    item_name: 'DJI RS3 Pro Gimbal Stabilizer',
    category: 'Gimbal',
    brand: 'DJI',
    model: 'RS3 Pro Combo',
    serial_number: 'SN-551122',
    assigned_to_employee_id: '',
    assigned_to_employee_name: 'Studio Locker',
    condition: 'Excellent',
    battery_percentage: 95,
    return_status: 'Available',
    assigned_date: '',
    notes: '3-axis motorized gimbal for cinematic camera movement',
    created_at: '2026-02-01T10:00:00.000Z',
    updated_at: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'eq_10',
    item_name: 'Godox V1 Flash for Sony',
    category: 'Flash',
    brand: 'Godox',
    model: 'V1-S',
    serial_number: 'SN-110293',
    assigned_to_employee_id: '',
    assigned_to_employee_name: 'Studio Locker',
    condition: 'Good',
    battery_percentage: 85,
    return_status: 'Available',
    assigned_date: '',
    notes: 'Round head camera flash speedlite with lithium battery',
    created_at: '2026-02-01T10:00:00.000Z',
    updated_at: '2026-02-01T10:00:00.000Z',
  },
]

export function loadAllEquipmentItems(): EquipmentItem[] {
  if (typeof window === 'undefined') return DEFAULT_EQUIPMENT_ITEMS
  try {
    const raw = localStorage.getItem(EQUIPMENT_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.error('Error loading equipment:', e)
  }
  // Initialize with defaults if empty
  try {
    localStorage.setItem(EQUIPMENT_STORAGE_KEY, JSON.stringify(DEFAULT_EQUIPMENT_ITEMS))
  } catch (e) {}
  return DEFAULT_EQUIPMENT_ITEMS
}

export function saveAllEquipmentItems(items: EquipmentItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(EQUIPMENT_STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new CustomEvent('trufocus_equipment_updated', { detail: items }))
  } catch (e) {
    console.error('Error saving equipment:', e)
  }
}

/** Pull equipment table from Firestore and merge with local */
export async function syncEquipmentWithCloud(): Promise<EquipmentItem[]> {
  const localItems = loadAllEquipmentItems()
  if (!isCloudConfigured()) return localItems

  try {
    const rawRows = await pullTableFromCloud('equipment')
    if (rawRows && rawRows.length > 0) {
      const entityMap = new Map<string, EquipmentItem>()

      const putIfNewer = (key: string, item: EquipmentItem) => {
        const existing = entityMap.get(key)
        if (!existing) {
          entityMap.set(key, item)
        } else {
          const eTime = new Date(existing.updated_at || existing.created_at || 0).getTime()
          const iTime = new Date(item.updated_at || item.created_at || 0).getTime()
          if (iTime >= eTime) entityMap.set(key, item)
        }
      }

      rawRows.forEach((row: any) => {
        if (!row) return
        const content = row.data !== undefined ? row.data : row
        if (Array.isArray(content)) {
          content.forEach((item: any) => {
            if (item && item.id) putIfNewer(item.id, item)
          })
        } else if (content && typeof content === 'object') {
          const merged = { ...row, ...content }
          if (merged.id && merged.id !== 'main') putIfNewer(merged.id, merged)
        }
      })

      if (entityMap.size > 0) {
        const localMap = new Map<string, EquipmentItem>()
        localItems.forEach((i) => localMap.set(i.id, i))

        const mergedMap = new Map<string, EquipmentItem>()
        const allKeys = new Set([...Array.from(entityMap.keys()), ...Array.from(localMap.keys())])

        allKeys.forEach((key) => {
          const cItem = entityMap.get(key)
          const lItem = localMap.get(key)
          if (cItem && lItem) {
            const cTime = new Date(cItem.updated_at || cItem.created_at || 0).getTime()
            const lTime = new Date(lItem.updated_at || lItem.created_at || 0).getTime()
            mergedMap.set(key, cTime >= lTime ? cItem : lItem)
          } else if (cItem) {
            mergedMap.set(key, cItem)
          } else if (lItem) {
            mergedMap.set(key, lItem)
          }
        })

        const finalList = Array.from(mergedMap.values())
        saveAllEquipmentItems(finalList)
        return finalList
      }
    }
  } catch (err) {
    console.warn('[EquipmentService] Cloud sync error:', err)
  }

  return localItems
}

/** Add a new equipment / camera item */
export async function addEquipmentItem(
  item: Omit<EquipmentItem, 'id' | 'created_at' | 'updated_at'>
): Promise<EquipmentItem> {
  const items = loadAllEquipmentItems()
  const now = new Date().toISOString()
  const newItem: EquipmentItem = {
    ...item,
    id: `eq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    created_at: now,
    updated_at: now,
  }

  const updated = [newItem, ...items]
  saveAllEquipmentItems(updated)

  if (isCloudConfigured()) {
    pushEntityToCloud('equipment', 'main', updated).catch((e) => console.warn(e))
    pushEntityToCloud('equipment', newItem.id, newItem).catch((e) => console.warn(e))
  }

  return newItem
}

/** Update an existing equipment / camera item */
export async function updateEquipmentItem(item: EquipmentItem): Promise<EquipmentItem> {
  const items = loadAllEquipmentItems()
  const now = new Date().toISOString()
  const updatedItem: EquipmentItem = {
    ...item,
    updated_at: now,
  }

  const updated = items.map((i) => (i.id === item.id ? updatedItem : i))
  saveAllEquipmentItems(updated)

  if (isCloudConfigured()) {
    pushEntityToCloud('equipment', 'main', updated).catch((e) => console.warn(e))
    pushEntityToCloud('equipment', item.id, updatedItem).catch((e) => console.warn(e))
  }

  return updatedItem
}

/** Delete an equipment item */
export async function deleteEquipmentItem(id: string): Promise<boolean> {
  const items = loadAllEquipmentItems()
  const updated = items.filter((i) => i.id !== id)
  saveAllEquipmentItems(updated)

  if (isCloudConfigured()) {
    pushEntityToCloud('equipment', 'main', updated).catch((e) => console.warn(e))
  }

  return true
}

/** Assign equipment to a photographer, videographer, or team member */
export async function assignEquipment(
  equipmentId: string,
  employeeId: string,
  employeeName: string
): Promise<boolean> {
  const items = loadAllEquipmentItems()
  const idx = items.findIndex((i) => i.id === equipmentId)
  if (idx === -1) return false

  const now = new Date().toISOString()
  const updatedItem: EquipmentItem = {
    ...items[idx],
    assigned_to_employee_id: employeeId,
    assigned_to_employee_name: employeeName,
    return_status: 'Assigned',
    assigned_date: now.split('T')[0],
    updated_at: now,
  }

  items[idx] = updatedItem
  saveAllEquipmentItems([...items])

  if (isCloudConfigured()) {
    pushEntityToCloud('equipment', 'main', items).catch((e) => console.warn(e))
    pushEntityToCloud('equipment', equipmentId, updatedItem).catch((e) => console.warn(e))
  }

  return true
}

/** Return equipment to studio locker (Unassigned) */
export async function returnEquipment(equipmentId: string): Promise<boolean> {
  const items = loadAllEquipmentItems()
  const idx = items.findIndex((i) => i.id === equipmentId)
  if (idx === -1) return false

  const now = new Date().toISOString()
  const updatedItem: EquipmentItem = {
    ...items[idx],
    assigned_to_employee_id: '',
    assigned_to_employee_name: 'Studio Locker',
    return_status: 'Available',
    assigned_date: '',
    updated_at: now,
  }

  items[idx] = updatedItem
  saveAllEquipmentItems([...items])

  if (isCloudConfigured()) {
    pushEntityToCloud('equipment', 'main', items).catch((e) => console.warn(e))
    pushEntityToCloud('equipment', equipmentId, updatedItem).catch((e) => console.warn(e))
  }

  return true
}

/** Update condition or maintenance status */
export function updateEquipmentStatus(
  equipmentId: string,
  returnStatus: EquipmentStatus,
  condition?: EquipmentCondition
): void {
  const items = loadAllEquipmentItems()
  const idx = items.findIndex((i) => i.id === equipmentId)
  if (idx !== -1) {
    items[idx].return_status = returnStatus
    if (condition) items[idx].condition = condition
    items[idx].updated_at = new Date().toISOString()
    saveAllEquipmentItems([...items])
    if (isCloudConfigured()) {
      pushEntityToCloud('equipment', 'main', items).catch((e) => console.warn(e))
      pushEntityToCloud('equipment', equipmentId, items[idx]).catch((e) => console.warn(e))
    }
  }
}

/** Get all cameras and gear suitable for assignment */
export function getCamerasForAssignment(): EquipmentItem[] {
  const items = loadAllEquipmentItems()
  return items.filter(
    (i) =>
      i.return_status !== 'In Maintenance' &&
      i.return_status !== 'Retired' &&
      i.condition !== 'Damaged'
  )
}

/** Get equipment assigned to a specific employee or accessible by them */
export function getAssignedEquipmentForEmployee(
  employeeId: string,
  employeeName?: string
): EquipmentItem[] {
  const items = loadAllEquipmentItems()
  const normId = (employeeId || '').toLowerCase().trim()
  const normName = (employeeName || '').toLowerCase().trim()

  return items.filter((item) => {
    const itemEmpId = (item.assigned_to_employee_id || '').toLowerCase().trim()
    const itemEmpName = (item.assigned_to_employee_name || '').toLowerCase().trim()

    if (normId && itemEmpId === normId) return true
    if (normName && itemEmpName === normName) return true
    if (normName && itemEmpName.includes(normName)) return true
    if (itemEmpId === 'all') return true
    return false
  })
}

/** Report equipment damage from crew portal */
export function reportEquipmentDamage(
  report: Omit<EquipmentDamageReport, 'id' | 'reported_at' | 'status'>
): EquipmentDamageReport {
  const newReport: EquipmentDamageReport = {
    ...report,
    id: 'dmg_' + Date.now(),
    reported_at: new Date().toISOString(),
    status: 'Pending Review',
  }

  let reports: EquipmentDamageReport[] = []
  try {
    const raw = localStorage.getItem(DAMAGE_REPORTS_KEY)
    if (raw) reports = JSON.parse(raw)
  } catch (e) {}

  reports.unshift(newReport)
  localStorage.setItem(DAMAGE_REPORTS_KEY, JSON.stringify(reports))

  // Update item condition if high or critical
  if (report.severity === 'High' || report.severity === 'Critical') {
    updateEquipmentStatus(report.equipment_id, 'In Maintenance', 'Needs Service')
  }

  window.dispatchEvent(new CustomEvent('trufocus_equipment_updated'))
  if (isCloudConfigured()) {
    pushEntityToCloud('equipment_reports', newReport.id, newReport).catch((e) => console.warn(e))
  }

  return newReport
}

export function loadAllDamageReports(): EquipmentDamageReport[] {
  try {
    const raw = localStorage.getItem(DAMAGE_REPORTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return []
}
