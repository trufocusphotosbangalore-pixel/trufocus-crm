import type { UserAccount } from './employeeService'

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'half_day'
  | 'leave'
  | 'work_from_home'

export interface GeoLocationPayload {
  latitude: number
  longitude: number
  accuracy?: number
  address?: string
  within_office_radius?: boolean
}

export interface AttendanceRecord {
  id: string
  employee_id: string
  employee_name: string
  email: string
  department: string
  workspace_role: string
  employment_type: string
  date: string // YYYY-MM-DD
  status: AttendanceStatus
  check_in_time: string | null // ISO String or HH:MM AM/PM
  check_out_time: string | null
  duration_minutes: number
  location?: GeoLocationPayload | null
  device_info?: string | null
  remarks?: string | null
  approved_by?: string | null
  is_manual_entry?: boolean
  created_at: string
  updated_at: string
}

const STORAGE_KEY = 'trufocus_crm_attendance_v1'

// Mock Default Seeding
function seedInitialAttendance(dateStr: string, employees: UserAccount[]): AttendanceRecord[] {
  const statuses: AttendanceStatus[] = ['present', 'present', 'present', 'late', 'work_from_home', 'absent']
  return employees.map((emp, idx) => {
    const status = statuses[idx % statuses.length]
    const isPresent = status === 'present' || status === 'late' || status === 'work_from_home'
    const isLate = status === 'late'
    
    const checkIn = isPresent ? `${isLate ? '10:15 AM' : '09:30 AM'}` : null
    const checkOut = isPresent ? '06:30 PM' : null
    const duration = isPresent ? (isLate ? 495 : 540) : 0

    return {
      id: `att_${emp.id}_${dateStr}`,
      employee_id: emp.id,
      employee_name: emp.employee_name || emp.full_name || 'Staff Member',
      email: emp.email || '',
      department: emp.department || 'Photography',
      workspace_role: emp.workspace_role || 'staff',
      employment_type: emp.employment_type || emp.team_type || 'in_house',
      date: dateStr,
      status,
      check_in_time: checkIn,
      check_out_time: checkOut,
      duration_minutes: duration,
      location: isPresent
        ? {
            latitude: 12.9716,
            longitude: 77.5946,
            accuracy: 10,
            address: 'Trufocus Studio HQ, Bangalore',
            within_office_radius: true,
          }
        : null,
      device_info: isPresent ? 'Chrome 122.0 (Windows 11 Desktop)' : null,
      remarks: status === 'work_from_home' ? 'Approved WFH for editing assignment' : null,
      approved_by: 'Studio Manager',
      is_manual_entry: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  })
}

export function loadAttendanceRecords(dateStr?: string): AttendanceRecord[] {
  const targetDate = dateStr || new Date().toISOString().split('T')[0]
  if (typeof window === 'undefined') return []
  
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${targetDate}`)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    console.warn('[AttendanceStore] Error loading attendance:', e)
  }

  // Seed default dataset if missing
  const employees = loadCachedEmployeesSync()
  const seeded = seedInitialAttendance(targetDate, employees)
  saveAttendanceRecords(targetDate, seeded)
  return seeded
}

export function saveAttendanceRecords(dateStr: string, records: AttendanceRecord[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${STORAGE_KEY}_${dateStr}`, JSON.stringify(records))
    window.dispatchEvent(new CustomEvent('trufocus_attendance_updated', { detail: { date: dateStr } }))
  } catch (e) {
    console.error('[AttendanceStore] Error saving attendance:', e)
  }
}

function loadCachedEmployeesSync(): UserAccount[] {
  try {
    const raw = localStorage.getItem('trufocus_crm_user_accounts_v1')
    if (raw) return JSON.parse(raw)
  } catch {}
  return [
    {
      id: 'acc_admin_owner',
      employee_id: 'OWNER-001',
      employee_name: 'Trufocus Studio Owner',
      email: 'owner@trufocusphotos.com',
      department: 'Executive',
      workspace_role: 'owner',
      employment_type: 'in_house',
    } as any,
    {
      id: 'acc_photographer_01',
      employee_id: 'EMP-1002',
      employee_name: 'Lead Photographer',
      email: 'photographer01@trufocusphotos.com',
      department: 'Photography',
      workspace_role: 'photographer',
      employment_type: 'in_house',
    } as any,
    {
      id: 'acc_sales_manager',
      employee_id: 'EMP-1003',
      employee_name: 'Sales Manager',
      email: 'sales.manager@trufocusphotos.com',
      department: 'Sales',
      workspace_role: 'sales_executive',
      employment_type: 'in_house',
    } as any,
    {
      id: 'acc_video_editor',
      employee_id: 'EMP-1004',
      employee_name: 'Video Editor',
      email: 'video.editor@trufocusphotos.com',
      department: 'Post-Production',
      workspace_role: 'video_editor',
      employment_type: 'in_house',
    } as any,
  ]
}

export function checkInEmployee(
  employeeId: string,
  employeeName: string,
  email: string,
  location?: GeoLocationPayload | null,
  remarks?: string
): AttendanceRecord {
  const today = new Date().toISOString().split('T')[0]
  const records = loadAttendanceRecords(today)
  const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Device'

  let record = records.find((r) => r.employee_id === employeeId || r.email.toLowerCase() === email.toLowerCase())

  if (record) {
    record.check_in_time = timeNow
    record.status = 'present'
    record.location = location || record.location
    record.device_info = userAgent
    record.remarks = remarks || record.remarks
    record.updated_at = new Date().toISOString()
  } else {
    record = {
      id: `att_${employeeId}_${today}`,
      employee_id: employeeId,
      employee_name: employeeName,
      email,
      department: 'General',
      workspace_role: 'staff',
      employment_type: 'in_house',
      date: today,
      status: 'present',
      check_in_time: timeNow,
      check_out_time: null,
      duration_minutes: 0,
      location: location || null,
      device_info: userAgent,
      remarks: remarks || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    records.push(record)
  }

  saveAttendanceRecords(today, records)
  return record
}

export function checkOutEmployee(
  employeeId: string,
  email: string,
  remarks?: string
): AttendanceRecord | null {
  const today = new Date().toISOString().split('T')[0]
  const records = loadAttendanceRecords(today)
  const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const record = records.find((r) => r.employee_id === employeeId || r.email.toLowerCase() === email.toLowerCase())
  if (!record) return null

  record.check_out_time = timeNow
  record.remarks = remarks ? (record.remarks ? `${record.remarks} | ${remarks}` : remarks) : record.remarks
  record.duration_minutes = 540 // Default 9 hours
  record.updated_at = new Date().toISOString()

  saveAttendanceRecords(today, records)
  return record
}

export function manualUpdateAttendanceRecord(
  dateStr: string,
  recordId: string,
  updates: Partial<AttendanceRecord>
): AttendanceRecord | null {
  const records = loadAttendanceRecords(dateStr)
  const idx = records.findIndex((r) => r.id === recordId)
  if (idx === -1) return null

  records[idx] = {
    ...records[idx],
    ...updates,
    is_manual_entry: true,
    updated_at: new Date().toISOString(),
  }

  saveAttendanceRecords(dateStr, records)
  return records[idx]
}

export function getAttendanceMetrics(dateStr?: string) {
  const records = loadAttendanceRecords(dateStr)
  const total = records.length
  const present = records.filter((r) => r.status === 'present' || r.status === 'late' || r.status === 'work_from_home').length
  const absent = records.filter((r) => r.status === 'absent' || r.status === 'leave').length
  const notCheckedOut = records.filter((r) => r.check_in_time && !r.check_out_time).length
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0

  return {
    total,
    present,
    absent,
    notCheckedOut,
    percentage,
  }
}
