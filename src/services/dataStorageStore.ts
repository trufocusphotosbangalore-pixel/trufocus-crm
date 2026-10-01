import { broadcastPaymentSync } from '@/hooks/useRealtimeSync'
import { getLocalWorkOrders } from '@/services/supabase/workOrders'
import type {
  DataStorageRecord,
  WorkOrderDataGroup,
} from '@/types/dataStorage'

const STORAGE_KEY = 'trufocus_crm_data_storage_v1'

const DEFAULT_SAMPLE_STORAGE_RECORDS: DataStorageRecord[] = []

export function getStoredDataRecords(): DataStorageRecord[] {
  let records: DataStorageRecord[] = []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) records = JSON.parse(raw)
    else records = DEFAULT_SAMPLE_STORAGE_RECORDS
  } catch (e) {
    console.error('Error reading data storage records', e)
    records = DEFAULT_SAMPLE_STORAGE_RECORDS
  }

  const activeWOs = getLocalWorkOrders().filter((w) => !w.deleted_at && w.status !== 'deleted')
  const activeIds = new Set(activeWOs.map((w) => w.id))
  const activeWOnums = new Set(activeWOs.map((w) => w.work_order_number))

  return records.filter(
    (r) => activeIds.has(r.work_order_id) || activeWOnums.has(r.work_order_number)
  )
}

export function saveStoredDataRecords(records: DataStorageRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    broadcastPaymentSync()
  } catch (e) {
    console.error('Error saving data storage records', e)
  }
}

/**
 * Automatically fetch active Work Orders and generate data groups with crew member rows.
 * Existing records are merged seamlessly so user edits are preserved!
 */
export function getWorkOrderDataGroups(): WorkOrderDataGroup[] {
  const workOrders = getLocalWorkOrders().filter((wo) => !wo.deleted_at && wo.status !== 'deleted')
  const savedRecords = getStoredDataRecords()
  const recordMap = new Map<string, DataStorageRecord>()
  savedRecords.forEach((r) => recordMap.set(r.id, r))

  const groups: WorkOrderDataGroup[] = []

  workOrders.forEach((wo) => {
    let totalRecords = 0
    let completedRecords = 0
    let hasIssue = false

    const eventGroups: WorkOrderDataGroup['events'] = []
    const safeCustomerName = wo.customer_name || 'Customer'
    const safeWONumber = wo.work_order_number || 'WO'

    const events = wo.events || []
    events.forEach((evt) => {
      const evtRecords: DataStorageRecord[] = []
      const services = evt.services || []

      services.forEach((srv) => {
        const team = srv.assigned_team || []
        team.forEach((member) => {
          totalRecords++
          const recordId = `ds-${wo.id}-${evt.id}-${srv.id}-${member.employee_id || Math.random()}`

          const existing = recordMap.get(recordId)
          if (existing) {
            evtRecords.push(existing)
            if (existing.backup_status === 'completed' || existing.backup_status === 'verified') {
              completedRecords++
            }
            if (existing.remark && existing.remark.toLowerCase().includes('missing')) {
              hasIssue = true
            }
          } else {
            // Auto-generate record
            const newRecord: DataStorageRecord = {
              id: recordId,
              work_order_id: wo.id,
              work_order_number: safeWONumber,
              customer_name: safeCustomerName,
              event_id: evt.id,
              event_name: evt.event_type_name || 'Event',
              event_date: evt.event_date,
              service_id: srv.id,
              service_name: srv.service_name || 'Photography',
              employee_id: member.employee_id || 'emp-unknown',
              employee_name: member.employee_name || 'Crew Member',
              role_title: member.role_title || srv.service_name || 'Crew Member',
              storage_device: 'SSD 1',
              folder_path: `D:\\Trufocus\\${new Date().getFullYear()}\\${safeCustomerName.replace(/\s+/g, '_')}\\${safeWONumber}`,
              memory_card: 'SanDisk SD 128GB',
              backup_status: 'not_started',
              data_copied: 'no',
              remark: '',
              updated_at: new Date().toISOString(),
            }
            evtRecords.push(newRecord)
          }
        })
      })

      if (evtRecords.length > 0) {
        eventGroups.push({
          event_id: evt.id,
          event_name: evt.event_type_name || 'Event Shoot',
          event_date: evt.event_date,
          records: evtRecords,
        })
      }
    })

    // Fallback default crew rows if work order has no assigned crew yet
    if (eventGroups.length === 0) {
      const fallbackRecords: DataStorageRecord[] = [
        {
          id: `ds-${wo.id}-default-1`,
          work_order_id: wo.id,
          work_order_number: safeWONumber,
          customer_name: safeCustomerName,
          event_id: `ev-${wo.id}-1`,
          event_name: wo.event_type || 'Main Event Shoot',
          event_date: wo.booking_date,
          service_id: 'srv-default-1',
          service_name: 'Lead Photography',
          employee_id: 'emp-lead-1',
          employee_name: 'Ram Sharma',
          role_title: 'Traditional Photographer',
          storage_device: 'SSD 1',
          folder_path: `D:\\Trufocus\\${new Date().getFullYear()}\\${safeWONumber}`,
          memory_card: 'Sony CF Express 160GB',
          backup_status: 'not_started',
          data_copied: 'no',
          remark: '',
          updated_at: new Date().toISOString(),
        },
        {
          id: `ds-${wo.id}-default-2`,
          work_order_id: wo.id,
          work_order_number: safeWONumber,
          customer_name: safeCustomerName,
          event_id: `ev-${wo.id}-1`,
          event_name: wo.event_type || 'Main Event Shoot',
          event_date: wo.booking_date,
          service_id: 'srv-default-2',
          service_name: 'Cinematic Videography',
          employee_id: 'emp-lead-2',
          employee_name: 'Suresh Menon',
          role_title: 'Cinematographer',
          storage_device: 'WD Passport 4TB',
          folder_path: `D:\\Trufocus\\${new Date().getFullYear()}\\${safeWONumber}`,
          memory_card: 'SanDisk SD 128GB',
          backup_status: 'not_started',
          data_copied: 'no',
          remark: '',
          updated_at: new Date().toISOString(),
        },
      ]

      totalRecords = 2
      eventGroups.push({
        event_id: `ev-${wo.id}-1`,
        event_name: wo.event_type || 'Main Event Shoot',
        event_date: wo.booking_date,
        records: fallbackRecords,
      })
    }

    groups.push({
      work_order_id: wo.id,
      work_order_number: safeWONumber,
      customer_name: safeCustomerName,
      mobile: wo.mobile || '',
      event_type: wo.event_type || 'Photography',
      booking_date: wo.booking_date || null,
      city: wo.city || null,
      total_records: totalRecords,
      completed_records: completedRecords,
      has_issue: hasIssue,
      events: eventGroups,
    })
  })

  return groups
}

export function saveBulkStorageRecords(recordsToSave: DataStorageRecord[]): void {
  const current = getStoredDataRecords()
  const map = new Map<string, DataStorageRecord>()
  current.forEach((r) => map.set(r.id, r))
  recordsToSave.forEach((r) => map.set(r.id, { ...r, updated_at: new Date().toISOString() }))

  saveStoredDataRecords(Array.from(map.values()))
}
