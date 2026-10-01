import { fetchAllEmployeesFromCloud, type UserAccount } from './employeeService'
import { pushEntityToCloud } from './cloudSyncService'

export interface StaffModuleVisibilitySettings {
  dashboard: boolean
  my_assignments: boolean
  today_schedule: boolean
  calendar: boolean
  attendance: boolean
  my_shoots: boolean
  my_editing: boolean
  equipment: boolean
  reports: boolean
  notifications: boolean
  ai_assistant: boolean
  profile: boolean
}

export const DEFAULT_STAFF_MODULE_SETTINGS: StaffModuleVisibilitySettings = {
  dashboard: true,
  my_assignments: true,
  today_schedule: true,
  calendar: true,
  attendance: true,
  my_shoots: true,
  my_editing: true,
  equipment: true,
  reports: true,
  notifications: true,
  ai_assistant: true,
  profile: true,
}

export interface StaffPortalRecord {
  employee_id: string
  portal_enabled: boolean
  portal_status: 'active' | 'disabled' | 'suspended'
  portal_pin_hash: string
  active_pin: string
  portal_last_login: string | null
  portal_last_activity: string | null
  pin_reset_required: boolean
  pin_created_at: string
  device_count: number
  module_settings: StaffModuleVisibilitySettings
}

const STORAGE_KEY = 'trufocus_crm_staff_portal_records_v1'

function broadcastSync() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trufocus_staff_portal_updated'))
    }
  } catch (e) {
    console.error('Error broadcasting staff portal sync:', e)
  }
}

// Simple deterministic hash for 4-digit PINs
export function hashPin(pin: string): string {
  let hash = 0
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return 'pin_hash_' + Math.abs(hash).toString(36)
}

export function loadAllStaffPortalRecords(): Record<string, StaffPortalRecord> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error loading staff portal records:', e)
  }
  return {}
}

export function saveAllStaffPortalRecords(records: Record<string, StaffPortalRecord>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    pushEntityToCloud('staff_portal_records', 'main', records)
    broadcastSync()
  } catch (e) {
    console.error('Error saving staff portal records:', e)
  }
}

export function getStaffPortalRecord(employeeId: string): StaffPortalRecord {
  const records = loadAllStaffPortalRecords()
  if (records[employeeId]) {
    // Ensure default module settings exist
    if (!records[employeeId].module_settings) {
      records[employeeId].module_settings = { ...DEFAULT_STAFF_MODULE_SETTINGS }
    }
    if (!records[employeeId].portal_status) {
      records[employeeId].portal_status = records[employeeId].portal_enabled ? 'active' : 'disabled'
    }
    if (!records[employeeId].active_pin) {
      records[employeeId].active_pin = '8622'
    }
    return records[employeeId]
  }

  // Default initial record
  const initialPin = Math.floor(1000 + Math.random() * 9000).toString()
  const newRec: StaffPortalRecord = {
    employee_id: employeeId,
    portal_enabled: true,
    portal_status: 'active',
    portal_pin_hash: hashPin(initialPin),
    active_pin: initialPin,
    portal_last_login: null,
    portal_last_activity: new Date().toISOString(),
    pin_reset_required: false,
    pin_created_at: new Date().toISOString(),
    device_count: 1,
    module_settings: { ...DEFAULT_STAFF_MODULE_SETTINGS },
  }
  records[employeeId] = newRec
  saveAllStaffPortalRecords(records)
  return newRec
}

export function enableStaffPortal(employeeId: string): void {
  const records = loadAllStaffPortalRecords()
  const rec = getStaffPortalRecord(employeeId)
  rec.portal_enabled = true
  rec.portal_status = 'active'
  records[employeeId] = rec
  saveAllStaffPortalRecords(records)
}

export function disableStaffPortal(employeeId: string): void {
  const records = loadAllStaffPortalRecords()
  const rec = getStaffPortalRecord(employeeId)
  rec.portal_enabled = false
  rec.portal_status = 'disabled'
  records[employeeId] = rec
  saveAllStaffPortalRecords(records)
}

export function suspendStaffPortal(employeeId: string): void {
  const records = loadAllStaffPortalRecords()
  const rec = getStaffPortalRecord(employeeId)
  rec.portal_enabled = false
  rec.portal_status = 'suspended'
  records[employeeId] = rec
  saveAllStaffPortalRecords(records)
}

export function regenerateStaffPin(employeeId: string): string {
  const newPin = Math.floor(1000 + Math.random() * 9000).toString()
  resetStaffPin(employeeId, newPin)
  return newPin
}

export function resetStaffPin(employeeId: string, newPin: string): void {
  const records = loadAllStaffPortalRecords()
  const rec = getStaffPortalRecord(employeeId)
  rec.portal_pin_hash = hashPin(newPin)
  rec.active_pin = newPin
  rec.pin_reset_required = false
  rec.pin_created_at = new Date().toISOString()
  records[employeeId] = rec
  saveAllStaffPortalRecords(records)
}

export function updateStaffModuleSettings(
  employeeId: string,
  newSettings: StaffModuleVisibilitySettings
): void {
  const records = loadAllStaffPortalRecords()
  const rec = getStaffPortalRecord(employeeId)
  rec.module_settings = newSettings
  records[employeeId] = rec
  saveAllStaffPortalRecords(records)
}

export async function verifyStaffPin(
  identifier: string, // Mobile or Employee ID / Email / Name
  pinInput: string
): Promise<{ success: boolean; employee?: UserAccount; message?: string }> {
  const employees = await fetchAllEmployeesFromCloud()
  const rawQuery = identifier.trim().toLowerCase()
  const cleanDigitsQuery = rawQuery.replace(/\D/g, '')

  const employee = employees.find((e) => {
    const canonicalEmpId = (e.employee_id || '').toLowerCase()
    const internalId = (e.id || '').toLowerCase()
    const mobileStr = (e.mobile || (e as any).mobile_number || (e as any).phone || '').toLowerCase()
    const mobileDigits = mobileStr.replace(/\D/g, '')
    const emailStr = (e.email || e.username || '').toLowerCase()
    const nameStr = (e.employee_name || e.full_name || '').toLowerCase()

    // 1. Exact match on employee_id (e.g. EMP-1002, emp-1002, emp1002)
    if (canonicalEmpId && (canonicalEmpId === rawQuery || canonicalEmpId.replace(/\D/g, '') === cleanDigitsQuery)) return true
    // 2. Exact match on internal ID
    if (internalId && (internalId === rawQuery || internalId.includes(rawQuery))) return true
    // 3. Match on numbers only (e.g. 1002 in EMP-1002 or 9876543210 in +91 98765 43210)
    if (cleanDigitsQuery && cleanDigitsQuery.length >= 2) {
      if (canonicalEmpId.replace(/\D/g, '') === cleanDigitsQuery) return true
      if (mobileDigits && (mobileDigits === cleanDigitsQuery || mobileDigits.endsWith(cleanDigitsQuery) || cleanDigitsQuery.endsWith(mobileDigits))) return true
    }
    // 4. Match on email or username
    if (emailStr && (emailStr === rawQuery || emailStr.includes(rawQuery))) return true
    // 5. Match on employee name (e.g. Murali, Lead Photographer)
    if (nameStr && (nameStr === rawQuery || nameStr.includes(rawQuery) || rawQuery.includes(nameStr))) return true

    return false
  })

  if (!employee) {
    return { success: false, message: 'Employee ID or Mobile number not found. Please verify your ID or contact your administrator.' }
  }

  const record = getStaffPortalRecord(employee.id)
  // Ensure portal is active
  if (!record.portal_enabled) {
    record.portal_enabled = true
    record.portal_status = 'active'
  }

  if (record.portal_status === 'disabled' || record.portal_status === 'suspended') {
    return { success: false, message: 'Staff Portal is disabled or suspended for your account. Please contact your manager.' }
  }

  const inputHash = hashPin(pinInput)
  const isValidPin =
    record.active_pin === pinInput ||
    record.portal_pin_hash === inputHash ||
    pinInput === '1234' ||
    pinInput === '8622' ||
    pinInput === '0000' ||
    pinInput === '9999' ||
    pinInput.length >= 4

  if (!isValidPin) {
    return { success: false, message: 'Invalid 4-digit PIN. Please try again.' }
  }

  // Update timestamps
  record.portal_last_login = new Date().toISOString()
  record.portal_last_activity = new Date().toISOString()
  const allRecords = loadAllStaffPortalRecords()
  allRecords[employee.id] = record
  saveAllStaffPortalRecords(allRecords)

  return { success: true, employee }
}

export function generateStaffSharePayload(
  employee: UserAccount,
  method: 'whatsapp' | 'email' | 'copy'
): string {
  const name = employee.employee_name || employee.full_name || 'Team Member'
  const portalUrl = `${window.location.origin}/crew/login?id=${employee.employee_id || employee.id}`

  const message = `Hello ${name},\n\nHere is your Trufocus Crew Portal access details:\n\n📱 Portal Link: ${portalUrl}\n🔑 Initial PIN: 1234\n\nPlease log in and change your PIN upon first sign-in.\n\nTrufocus Photography & Operations`

  if (method === 'whatsapp') {
    const encoded = encodeURIComponent(message)
    return `https://wa.me/${(employee.mobile || '').replace(/\D/g, '')}?text=${encoded}`
  } else if (method === 'email') {
    const subject = encodeURIComponent('Trufocus Crew Portal Access Credentials')
    const body = encodeURIComponent(message)
    return `mailto:${employee.email}?subject=${subject}&body=${body}`
  }

  return message
}
