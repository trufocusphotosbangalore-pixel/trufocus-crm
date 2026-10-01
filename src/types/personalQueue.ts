export type AssignmentStage =
  | 'assigned'
  | 'picked_up'
  | 'in_progress'
  | 'ready_for_review'
  | 'completed'
  | 'rejected'

export type TaskCategory = 'photography' | 'videography' | 'editing' | 'album_design'

export interface AssignmentActivityLog {
  id: string
  work_order_id: string
  work_order_number: string
  customer_name: string
  customer_mobile: string
  task_type: TaskCategory
  title: string
  event_date?: string
  event_time?: string
  venue?: string
  google_map_link?: string
  assigned_to_id: string
  assigned_to_name: string
  assigned_by: string
  assigned_at: string
  accepted_at?: string
  started_at?: string
  completed_at?: string
  current_stage: AssignmentStage
  completion_notes?: string
  rejection_reason?: string
  memory_card_status?: 'pending' | 'submitted' | 'na'
}

export interface PersonalShootTask {
  id: string
  work_order_id: string
  work_order_number: string
  customer_name: string
  customer_mobile: string
  event_type: string
  event_date: string
  event_time: string
  venue: string
  google_map_link?: string
  assigned_service_id: string
  service_name: string
  role_title?: string
  stage: AssignmentStage
  assigned_team_members?: { id: string; name: string; role?: string }[]
  accepted_at?: string
  started_at?: string
  completed_at?: string
  notes?: string
  completion_notes?: string
  rejection_reason?: string
  memory_card_submitted?: boolean
}

export interface PersonalEditingTask {
  id: string
  work_order_id: string
  work_order_number: string
  customer_name: string
  deliverable_name: string
  category: 'photo_editing' | 'video_editing' | 'album_design'
  due_date: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  stage: AssignmentStage
  assigned_to_id?: string
  assigned_to_name?: string
  assigned_by: string
  assigned_at: string
  accepted_at?: string
  started_at?: string
  completed_at?: string
  progress_percent: number
  notes?: string
}

export interface ManagerLiveTeamStatus {
  employee_id: string
  employee_name: string
  role: string
  status: 'idle' | 'picked_up' | 'shooting' | 'editing' | 'completed' | 'rejected'
  current_task_title?: string
  work_order_number?: string
  started_at?: string
}
