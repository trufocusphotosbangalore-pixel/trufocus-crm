export type BackupStatus = 'not_started' | 'backing_up' | 'completed' | 'verified'
export type DataCopiedStatus = 'no' | 'yes' | 'partial'
export type StorageDeviceOption =
  | 'SSD 1'
  | 'SSD 2'
  | 'SSD 3'
  | 'WD Passport 4TB'
  | 'Seagate 2TB'
  | 'NAS Server'
  | 'Cloud Storage'
  | 'Custom Device'

export interface DataStorageRecord {
  id: string
  work_order_id: string
  work_order_number: string
  customer_name: string
  event_id: string
  event_name: string
  event_date?: string | null
  service_id: string
  service_name: string
  employee_id: string
  employee_name: string
  role_title?: string
  storage_device: string
  folder_path: string
  memory_card: string
  backup_status: BackupStatus
  data_copied: DataCopiedStatus
  remark: string
  updated_by?: string
  updated_at: string
}

export interface WorkOrderDataGroup {
  work_order_id: string
  work_order_number: string
  customer_name: string
  mobile: string
  event_type: string
  booking_date: string | null
  city: string | null
  total_records: number
  completed_records: number
  has_issue: boolean
  events: {
    event_id: string
    event_name: string
    event_date?: string | null
    records: DataStorageRecord[]
  }[]
}

export const BACKUP_STATUS_LABELS: Record<BackupStatus, string> = {
  not_started: 'Not Started',
  backing_up: 'Backing Up',
  completed: 'Backup Completed',
  verified: 'Verified',
}

export const BACKUP_STATUS_COLORS: Record<BackupStatus, { bg: string; text: string }> = {
  not_started: { bg: 'bg-gray-100 border border-gray-200',  text: 'text-gray-600' },
  backing_up:  { bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-700' },
  completed:   { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700' },
  verified:    { bg: 'bg-purple-50 border border-purple-200',  text: 'text-purple-700' },
}

export const DATA_COPIED_LABELS: Record<DataCopiedStatus, string> = {
  no: 'No',
  yes: 'Yes',
  partial: 'Partial',
}

export const STORAGE_DEVICE_OPTIONS: StorageDeviceOption[] = [
  'SSD 1',
  'SSD 2',
  'SSD 3',
  'WD Passport 4TB',
  'Seagate 2TB',
  'NAS Server',
  'Cloud Storage',
  'Custom Device',
]
