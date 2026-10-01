import {
  getAssignmentActivityLogs,
  getPersonalEditingTasks,
  getPersonalShootTasks,
  updateAssignmentStage,
} from '@/services/assignmentEngineService'
import type {
  AssignmentActivityLog,
  PersonalShootTask,
  PersonalEditingTask,
  AssignmentStage,
} from '@/types/personalQueue'

export async function getActivityLogs(): Promise<AssignmentActivityLog[]> {
  return getAssignmentActivityLogs()
}

/** Strictly filter shoots assigned to logged in user ID/name */
export async function getAssignedShootsForUser(
  userIdOrName: string,
  userEmailOrEmpId: string,
  role: string
): Promise<PersonalShootTask[]> {
  return getPersonalShootTasks(userIdOrName, userEmailOrEmpId, role)
}

/** Strictly filter editing deliverables for Photo Editor, Video Editor, or Album Designer */
export async function getAssignedEditingTasksForUser(
  userIdOrName: string,
  roleCategory: 'photo' | 'video' | 'album',
  userEmailOrEmpId = ''
): Promise<PersonalEditingTask[]> {
  return getPersonalEditingTasks(userIdOrName, userEmailOrEmpId, roleCategory)
}

/** Update assignment stage (Pick Work/Accept, Start, Mark Ready for Review, Complete, Reject) */
export async function updateTaskStage(
  taskId: string,
  workOrderId: string,
  workOrderNumber: string,
  taskTitle: string,
  userName: string,
  newStage: AssignmentStage,
  notes?: string,
  rejectionReason?: string
): Promise<void> {
  await updateAssignmentStage({
    taskId,
    workOrderId,
    workOrderNumber,
    taskTitle,
    userName,
    newStage,
    notes,
    rejectionReason,
  })
}
