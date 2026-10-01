import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PhotographerWorkspace } from '@/components/dashboard/PhotographerWorkspace'
import { EditorWorkspace } from '@/components/dashboard/EditorWorkspace'
import { ManagerWorkspace } from '@/components/dashboard/ManagerWorkspace'
import { getLocalWorkOrders } from '@/services/supabase/workOrders'
import {
  getActivityLogs,
  getAssignedShootsForUser,
  getAssignedEditingTasksForUser,
} from '@/services/personalQueueStore'
import type { AssignmentActivityLog, PersonalEditingTask, PersonalShootTask } from '@/types/personalQueue'

interface WorkspaceRouterProps {
  simulatedRole?: string
  onRefresh?: () => void
  children?: React.ReactNode // Default Owner/Admin Dashboard Content
}

export function WorkspaceRouter({ simulatedRole, onRefresh, children }: WorkspaceRouterProps) {
  const { user } = useAuth()
  const [shoots, setShoots] = useState<PersonalShootTask[]>([])
  const [editingTasks, setEditingTasks] = useState<PersonalEditingTask[]>([])
  const [managerLogs, setManagerLogs] = useState<AssignmentActivityLog[]>([])
  const [unassignedCount, setUnassignedCount] = useState(0)

  const actualRole = (user?.workspace_role || user?.role || 'owner').toLowerCase()
  const effectiveRole = (simulatedRole || actualRole).toLowerCase()
  const userName = user?.full_name || user?.email?.split('@')[0] || 'Staff Member'
  const userEmailOrEmpId = user?.email || user?.id || ''

  const canSeeWorkOrders = user?.module_access ? Boolean(user.module_access.work_orders) : true
  const canSeePostProd = user?.module_access ? Boolean(user.module_access.post_production) : true

  const loadWorkspaceData = useCallback(async () => {
    if ((effectiveRole === 'photographer' || effectiveRole === 'videographer') && canSeeWorkOrders) {
      const nextShoots = await getAssignedShootsForUser(userName, userEmailOrEmpId, effectiveRole)
      setShoots(nextShoots)
      return
    }

    if (effectiveRole === 'photo_editor' && canSeePostProd) {
      const nextTasks = await getAssignedEditingTasksForUser(userName, 'photo', userEmailOrEmpId)
      setEditingTasks(nextTasks)
      return
    }

    if (effectiveRole === 'video_editor' && canSeePostProd) {
      const nextTasks = await getAssignedEditingTasksForUser(userName, 'video', userEmailOrEmpId)
      setEditingTasks(nextTasks)
      return
    }

    if (effectiveRole === 'album_designer' && canSeePostProd) {
      const nextTasks = await getAssignedEditingTasksForUser(userName, 'album', userEmailOrEmpId)
      setEditingTasks(nextTasks)
      return
    }

    if (effectiveRole === 'manager' && canSeeWorkOrders) {
      const logs = await getActivityLogs()
      setManagerLogs(logs)

      const workOrders = getLocalWorkOrders().filter((w) => !w.deleted_at && w.status !== 'deleted')
      const unassigned = workOrders.filter((w) => {
        let hasAssignment = false
        w.events?.forEach((e) => {
          e.services?.forEach((s) => {
            if (s.assigned_team && s.assigned_team.length > 0) hasAssignment = true
          })
        })
        return !hasAssignment
      })
      setUnassignedCount(unassigned.length)
    }
  }, [canSeePostProd, canSeeWorkOrders, effectiveRole, userEmailOrEmpId, userName])

  useEffect(() => {
    void loadWorkspaceData()

    const onSync = () => {
      void loadWorkspaceData()
    }

    window.addEventListener('workOrdersUpdated', onSync)
    window.addEventListener('trufocus_cloud_synced', onSync)

    return () => {
      window.removeEventListener('workOrdersUpdated', onSync)
      window.removeEventListener('trufocus_cloud_synced', onSync)
    }
  }, [loadWorkspaceData])

  const handleRefresh = () => {
    void loadWorkspaceData()
    if (onRefresh) onRefresh()
  }

  // 1. Photographer & Videographer Workspace Router
  if ((effectiveRole === 'photographer' || effectiveRole === 'videographer') && canSeeWorkOrders) {
    return (
      <PhotographerWorkspace
        userName={userName}
        userRole={effectiveRole as 'photographer' | 'videographer'}
        shoots={shoots}
        onRefresh={handleRefresh}
      />
    )
  }

  // 2. Photo Editor Workspace Router
  if (effectiveRole === 'photo_editor' && canSeePostProd) {
    return (
      <EditorWorkspace
        userName={userName}
        roleCategory="photo"
        tasks={editingTasks}
        onRefresh={handleRefresh}
      />
    )
  }

  // 3. Video Editor Workspace Router
  if (effectiveRole === 'video_editor' && canSeePostProd) {
    return (
      <EditorWorkspace
        userName={userName}
        roleCategory="video"
        tasks={editingTasks}
        onRefresh={handleRefresh}
      />
    )
  }

  // 4. Album Designer Workspace Router
  if (effectiveRole === 'album_designer' && canSeePostProd) {
    return (
      <EditorWorkspace
        userName={userName}
        roleCategory="album"
        tasks={editingTasks}
        onRefresh={handleRefresh}
      />
    )
  }

  // 5. Manager Workspace Router
  if (effectiveRole === 'manager' && canSeeWorkOrders) {
    return <ManagerWorkspace userName={userName} onRefresh={handleRefresh} logs={managerLogs} unassignedCount={unassignedCount} />
  }

  // 6. Owner & Administrator Default Workspace
  return <>{children}</>
}
