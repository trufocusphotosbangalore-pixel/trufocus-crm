import { useState, useEffect } from 'react'
import { X, Check, Users, Search, AlertCircle, Camera } from 'lucide-react'
import { cn } from '@/utils/cn'
import { getTeamMembers } from '@/services/teamStore'
import { fetchAllEmployeesFromCloud } from '@/services/employeeService'
import { getCamerasForAssignment, type EquipmentItem } from '@/services/equipmentService'
import type { UserAccount } from '@/types/teamLogin'
import type { TeamMember } from '@/types/team'
import type { WizardTeamAssignment } from '@/types/workOrders'
import { toast } from 'react-hot-toast'

interface AssignTeamModalProps {
  isOpen: boolean
  onClose: () => void
  serviceName: string
  serviceId?: string
  quantity?: number
  assignedTeam: WizardTeamAssignment[]
  onSave: (team: WizardTeamAssignment[]) => void
}

type AnyMember = UserAccount | TeamMember

export function AssignTeamModal({
  isOpen,
  onClose,
  serviceName,
  serviceId,
  quantity = 1,
  assignedTeam,
  onSave,
}: AssignTeamModalProps) {
  const [cloudEmployees, setCloudEmployees] = useState<UserAccount[]>([])
  const [availableCameras, setAvailableCameras] = useState<EquipmentItem[]>([])
  const [selectedStaffCameras, setSelectedStaffCameras] = useState<Record<string, { cameraName: string; equipmentId: string }>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let isMounted = true
    setAvailableCameras(getCamerasForAssignment())
    fetchAllEmployeesFromCloud().then((data) => {
      if (isMounted && data && data.length > 0) {
        setCloudEmployees(data.filter((e) => e.status === 'active' || e.account_status === 'active'))
      }
    })

    const handleGearSync = () => {
      setAvailableCameras(getCamerasForAssignment())
    }
    window.addEventListener('trufocus_equipment_updated', handleGearSync)

    return () => {
      isMounted = false
      window.removeEventListener('trufocus_equipment_updated', handleGearSync)
    }
  }, [])

  const localTeamMembers = getTeamMembers().filter((m) => m.status === 'active')
  const teamMembers: AnyMember[] = cloudEmployees.length > 0 ? cloudEmployees : localTeamMembers

  // Reset and sync selected team members whenever modal opens or service changes
  useEffect(() => {
    if (isOpen) {
      const initial = new Set((assignedTeam || []).map((t) => t.employee_id))
      setSelectedIds(initial)
      const initialCameras: Record<string, { cameraName: string; equipmentId: string }> = {}
      ;(assignedTeam || []).forEach((t) => {
        if (t.assigned_camera) {
          initialCameras[t.employee_id] = {
            cameraName: t.assigned_camera,
            equipmentId: t.assigned_equipment_id || '',
          }
        }
      })
      setSelectedStaffCameras(initialCameras)
      setSearchTerm('')
    }
  }, [isOpen, serviceId, assignedTeam])

  if (!isOpen) return null

  const maxAllowed = Math.max(1, quantity)

  const getMemberName = (emp?: AnyMember): string => {
    if (!emp) return 'Staff'
    return emp.full_name || (emp as any).employee_name || (emp as any).username || 'Staff'
  }

  const eligibleEmployees = teamMembers.filter((emp) => {
    const name = getMemberName(emp)
    const rolesStr = (emp.job_roles || [emp.job_role || 'Staff']).join(' ')
    const dept = emp.department || ''
    const matchSearch =
      !searchTerm ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rolesStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.toLowerCase().includes(searchTerm.toLowerCase())
    return matchSearch
  })

  const toggleSelect = (empId: string) => {
    const next = new Set(selectedIds)
    if (next.has(empId)) {
      next.delete(empId)
    } else {
      if (next.size >= maxAllowed) {
        toast.error(
          `Cannot assign more than ${maxAllowed} member(s) to this service. (Service Quantity = ${maxAllowed})`,
          { id: 'qty-limit-error' }
        )
        return
      }
      next.add(empId)
    }
    setSelectedIds(next)
  }

  const handleConfirm = () => {
    const team: WizardTeamAssignment[] = Array.from(selectedIds).map((id) => {
      const emp = teamMembers.find((e) => e.id === id || e.employee_id === id)
      const empName = emp ? getMemberName(emp) : id
      const primaryRole = emp?.job_role || (emp?.job_roles && emp.job_roles[0]) || 'Team Member'
      const camInfo = selectedStaffCameras[id]
      return {
        employee_id: id,
        employee_name: empName,
        role_title: primaryRole,
        assigned_camera: camInfo?.cameraName || undefined,
        assigned_equipment_id: camInfo?.equipmentId || undefined,
      }
    })
    onSave(team)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[75vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-[#5B3FD9]/15 flex items-center justify-center text-[#5B3FD9]">
              <Users size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                Assign Team Members
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Service: <span className="font-bold text-gray-800">{serviceName}</span> •{' '}
                <span className="font-extrabold text-[#5B3FD9]">Quantity: {maxAllowed}</span> (Max {maxAllowed} Staff)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quantity Warning Banner */}
        <div className="px-5 py-2 bg-purple-50 border-b border-purple-100 flex items-center gap-2 text-xs font-semibold text-[#5B3FD9] shrink-0">
          <AlertCircle size={14} className="shrink-0 text-[#5B3FD9]" />
          <span>
            Quantity limit: Select up to <strong>{maxAllowed}</strong> team member{maxAllowed > 1 ? 's' : ''} for this service.
          </span>
        </div>

        {/* Search Bar */}
        <div className="p-3.5 border-b border-gray-200 bg-gray-50/50 shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search eligible staff by name or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B3FD9]"
            />
          </div>
        </div>

        {/* Employee List (Scrollable Area) */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 min-h-0">
          {eligibleEmployees.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400 font-medium">
              No eligible team members found for this service.
            </div>
          ) : (
            eligibleEmployees.map((emp) => {
              const isSelected = selectedIds.has(emp.id)
              const empName = getMemberName(emp)
              const isInHouse = emp.team_type === 'in_house' || (emp as any).employment_type === 'in_house'

              return (
                <div
                  key={emp.id}
                  onClick={() => toggleSelect(emp.id)}
                  className={cn(
                    'p-3 rounded-xl border cursor-pointer transition-all text-xs space-y-2.5',
                    isSelected
                      ? 'bg-purple-50/80 border-[#5B3FD9] text-[#5B3FD9] ring-1 ring-[#5B3FD9]'
                      : 'bg-white border-gray-200 hover:border-gray-300 text-gray-800'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-xs text-gray-700 shrink-0">
                        {empName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">
                          {empName}
                        </h4>
                        <p className="text-[11px] text-gray-500 font-medium">
                          {(emp.job_roles || [emp.job_role || 'Staff']).join(', ')} • {emp.department || 'Production'} •{' '}
                          {isInHouse ? 'In-House' : 'Freelancer'}
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'size-5 rounded-md flex items-center justify-center border transition-colors shrink-0',
                        isSelected
                          ? 'bg-[#5B3FD9] border-[#5B3FD9] text-white'
                          : 'border-gray-300 bg-white'
                      )}
                    >
                      {isSelected && <Check size={13} />}
                    </div>
                  </div>

                  {/* Camera / Gear assignment dropdown */}
                  {isSelected && (
                    <div
                      className="pt-2 border-t border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700">
                        <Camera size={13} className="text-[#5B3FD9]" />
                        <span>Assign Camera:</span>
                      </div>
                      <select
                        value={selectedStaffCameras[emp.id]?.equipmentId || ''}
                        onChange={(e) => {
                          const eqId = e.target.value
                          const foundEq = availableCameras.find((c) => c.id === eqId)
                          setSelectedStaffCameras((prev) => ({
                            ...prev,
                            [emp.id]: {
                              equipmentId: eqId,
                              cameraName: foundEq ? `${foundEq.item_name} (${foundEq.serial_number})` : '',
                            },
                          }))
                        }}
                        className="h-7 text-[11px] font-medium rounded-lg bg-white border border-gray-300 text-gray-800 px-2 focus:outline-none focus:border-[#5B3FD9]"
                      >
                        <option value="">No Camera / Staff's Own Gear</option>
                        {availableCameras.map((eq) => (
                          <option key={eq.id} value={eq.id}>
                            {eq.item_name} ({eq.serial_number}) {eq.assigned_to_employee_name ? `• ${eq.assigned_to_employee_name}` : '• Locker'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Sticky Footer (Always Visible at Bottom) */}
        <div className="shrink-0 sticky bottom-0 z-30 flex items-center justify-between px-5 py-3.5 border-t border-gray-200 bg-gray-50 shadow-md">
          <span className="text-xs text-gray-600 font-semibold">
            <strong className="text-[#5B3FD9] text-sm">{selectedIds.size}</strong> of {maxAllowed} selected
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white transition-colors shadow-sm cursor-pointer"
            >
              Save Team Assignments
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
