export interface EquipmentItem {
  id: string
  item_name: string
  category: 'Camera' | 'Lens' | 'Drone' | 'Tripod' | 'Battery' | 'Flash' | 'Mic' | 'Memory Card' | 'Accessory'
  serial_number: string
  assigned_to_employee_id: string
  condition: 'Good' | 'Fair' | 'Needs Service' | 'Damaged'
  battery_percentage?: number
  return_status: 'Assigned' | 'Received' | 'Returned' | 'Overdue'
  assigned_date: string
  notes?: string
}

export interface EquipmentDamageReport {
  id: string
  equipment_id: string
  equipment_name: string
  employee_id: string
  reported_at: string
  damage_description: string
  photos?: string[]
  status: 'Pending Review' | 'Repaired' | 'Replaced'
}

const EQUIPMENT_STORAGE_KEY = 'trufocus_crm_equipment_items_v1'
const DAMAGE_REPORTS_KEY = 'trufocus_crm_damage_reports_v1'

const DEFAULT_EQUIPMENT_ITEMS: EquipmentItem[] = [
  { id: 'eq_1', item_name: 'Sony A7IV Body (Primary)', category: 'Camera', serial_number: 'SN-998231', assigned_to_employee_id: 'acc_photographer_01', condition: 'Good', battery_percentage: 95, return_status: 'Assigned', assigned_date: '2026-08-01' },
  { id: 'eq_2', item_name: 'Sony FE 24-70mm f/2.8 GM II', category: 'Lens', serial_number: 'SN-443120', assigned_to_employee_id: 'acc_photographer_01', condition: 'Good', battery_percentage: 100, return_status: 'Assigned', assigned_date: '2026-08-01' },
  { id: 'eq_3', item_name: 'DJI Mavic 3 Pro Drone Combo', category: 'Drone', serial_number: 'SN-772183', assigned_to_employee_id: 'acc_photographer_01', condition: 'Good', battery_percentage: 88, return_status: 'Assigned', assigned_date: '2026-08-01' },
  { id: 'eq_4', item_name: 'Godox V1 Flash for Sony', category: 'Flash', serial_number: 'SN-110293', assigned_to_employee_id: 'acc_photographer_01', condition: 'Good', battery_percentage: 75, return_status: 'Assigned', assigned_date: '2026-08-01' },
  { id: 'eq_5', item_name: 'SanDisk Extreme Pro 128GB V90', category: 'Memory Card', serial_number: 'SD-0012', assigned_to_employee_id: 'acc_photographer_01', condition: 'Good', return_status: 'Assigned', assigned_date: '2026-08-01' },
]

export function loadAllEquipmentItems(): EquipmentItem[] {
  if (typeof window === 'undefined') return DEFAULT_EQUIPMENT_ITEMS
  try {
    const raw = localStorage.getItem(EQUIPMENT_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error loading equipment:', e)
  }
  return DEFAULT_EQUIPMENT_ITEMS
}

export function saveAllEquipmentItems(items: EquipmentItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(EQUIPMENT_STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new CustomEvent('trufocus_equipment_updated'))
  } catch (e) {
    console.error('Error saving equipment:', e)
  }
}

export function getAssignedEquipmentForEmployee(employeeId: string): EquipmentItem[] {
  const items = loadAllEquipmentItems()
  return items.filter((item) => item.assigned_to_employee_id === employeeId || item.assigned_to_employee_id === 'all')
}

export function reportEquipmentDamage(report: Omit<EquipmentDamageReport, 'id' | 'reported_at' | 'status'>): EquipmentDamageReport {
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
  window.dispatchEvent(new CustomEvent('trufocus_equipment_updated'))
  return newReport
}

export function updateEquipmentStatus(equipmentId: string, returnStatus: EquipmentItem['return_status'], condition?: EquipmentItem['condition']): void {
  const items = loadAllEquipmentItems()
  const idx = items.findIndex((i) => i.id === equipmentId)
  if (idx !== -1) {
    items[idx].return_status = returnStatus
    if (condition) items[idx].condition = condition
    saveAllEquipmentItems(items)
  }
}
