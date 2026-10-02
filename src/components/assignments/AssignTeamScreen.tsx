import { useState, useEffect } from 'react'
import {
  Users, Calendar, Clock, MapPin, UserPlus, RefreshCw, Trash2, Eye,
  ArrowLeft, Search, Check, AlertTriangle, Camera
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { toast } from 'react-hot-toast'
import type { WorkOrder, WorkOrderService } from '@/types/workOrders'
import { AssignmentService } from '@/services/assignmentService'
import { fetchAllEmployeesFromCloud } from '@/services/employeeService'
import { getWorkRolesForEmployee } from '@/services/employeeWorkRolesService'
import { getCamerasForAssignment, type EquipmentItem } from '@/services/equipmentService'
import type { UserAccount } from '@/types/teamLogin'
import { EmployeeProfileDrawer } from './EmployeeProfileDrawer'

interface AssignTeamScreenProps {
  workOrder: WorkOrder
  onBack?: () => void
  onUpdated?: () => void
  canManage?: boolean
}

export function AssignTeamScreen({
  workOrder,
  onBack,
  onUpdated,
  canManage = true,
}: AssignTeamScreenProps) {
  const [employees, setEmployees] = useState<UserAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState<string>(workOrder.events?.[0]?.id || '')

  // Modals & Drawers state
  const [assigningService, setAssigningService] = useState<{ eventId: string; service: WorkOrderService } | null>(null)
  const [reassigningMember, setReassigningMember] = useState<{
    eventId: string
    serviceId: string
    oldEmployeeId: string
    oldEmployeeName: string
  } | null>(null)
  const [removingMember, setRemovingMember] = useState<{
    eventId: string
    serviceId: string
    employeeId: string
    employeeName: string
  } | null>(null)
  const [viewingEmployee, setViewingEmployee] = useState<UserAccount | null>(null)

  // Selection state inside modal
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set())
  const [selectedStaffCameras, setSelectedStaffCameras] = useState<Record<string, { cameraName: string; equipmentId: string }>>({})
  const [availableCameras, setAvailableCameras] = useState<EquipmentItem[]>([])
  const [staffSearch, setStaffSearch] = useState('')

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setAvailableCameras(getCamerasForAssignment())
    fetchAllEmployeesFromCloud()
      .then((data) => {
        if (isMounted) {
          setEmployees(data || [])
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false)
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

  const events = workOrder.events || []
  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0]

  // Open Assign Dialog
  const handleOpenAssignModal = (eventId: string, service: WorkOrderService) => {
    setAssigningService({ eventId, service })
    const initial = new Set((service.assigned_team || []).map((m) => m.employee_id))
    setSelectedStaffIds(initial)
    const initialCameras: Record<string, { cameraName: string; equipmentId: string }> = {}
    ;(service.assigned_team || []).forEach((m) => {
      if (m.assigned_camera) {
        initialCameras[m.employee_id] = {
          cameraName: m.assigned_camera,
          equipmentId: m.assigned_equipment_id || '',
        }
      }
    })
    setSelectedStaffCameras(initialCameras)
    setStaffSearch('')
  }

  // Confirm Assign / Reassign Save
  const handleSaveAssignments = async () => {
    if (!assigningService) return
    const { eventId, service } = assigningService

    const selectedMembers = Array.from(selectedStaffIds).map((id) => {
      const emp = employees.find((e) => e.id === id || e.employee_id === id)
      const empName = emp ? (emp.full_name || emp.employee_name || emp.username) : id
      const primaryRole = emp?.job_role || (emp?.job_roles && emp.job_roles[0]) || 'Crew Member'
      const camInfo = selectedStaffCameras[id]
      return {
        employee_id: id,
        employee_name: empName,
        role_title: primaryRole,
        assigned_camera: camInfo?.cameraName || undefined,
        assigned_equipment_id: camInfo?.equipmentId || undefined,
      }
    })

    const res = await AssignmentService.assignTeamToService({
      workOrderId: workOrder.id,
      eventId,
      serviceId: service.id,
      assignedMembers: selectedMembers,
    })

    if (res.success) {
      toast.success(res.message)
      setAssigningService(null)
      if (onUpdated) onUpdated()
    } else {
      toast.error(res.message)
    }
  }

  // Confirm Reassign
  const handleConfirmReassign = async (newEmp: UserAccount) => {
    if (!reassigningMember) return
    const { eventId, serviceId, oldEmployeeId } = reassigningMember
    const empName = newEmp.full_name || newEmp.employee_name || newEmp.username || 'Staff'

    const res = await AssignmentService.reassignTeamMember({
      workOrderId: workOrder.id,
      eventId,
      serviceId,
      oldEmployeeId,
      newMember: {
        employee_id: newEmp.id,
        employee_name: empName,
        role_title: newEmp.job_role || (newEmp.job_roles && newEmp.job_roles[0]) || 'Staff',
      },
    })

    if (res.success) {
      toast.success(`Reassigned to ${empName}`)
      setReassigningMember(null)
      if (onUpdated) onUpdated()
    } else {
      toast.error(res.message)
    }
  }

  // Confirm Remove Assignment
  const handleConfirmRemove = async () => {
    if (!removingMember) return
    const { eventId, serviceId, employeeId, employeeName } = removingMember

    const res = await AssignmentService.removeAssignment({
      workOrderId: workOrder.id,
      eventId,
      serviceId,
      employeeId,
    })

    if (res.success) {
      toast.success(`Removed ${employeeName} from assignment.`)
      setRemovingMember(null)
      if (onUpdated) onUpdated()
    } else {
      toast.error(res.message)
    }
  }

  // Helper for status badge styling
  const getStatusBadge = (status?: string, assignedCount = 0) => {
    const norm = (status || (assignedCount > 0 ? 'assigned' : 'pending_assignment')).toLowerCase()
    switch (norm) {
      case 'approved':
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">Completed / Approved</span>
      case 'submitted':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">Submitted for QC</span>
      case 'in_progress':
      case 'started':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1"><span className="size-1.5 rounded-full bg-amber-600 animate-ping" /> In Progress</span>
      case 'accepted':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300">Accepted</span>
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">Rejected</span>
      case 'assigned':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-300">Assigned</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gray-100 text-gray-700 border border-gray-300">Pending Assignment</span>
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ── Top Header Navigation ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="size-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-[#5B3FD9] border border-purple-200">
                Assignment Engine
              </span>
              <span className="font-mono text-xs font-bold text-gray-500">{workOrder.work_order_number}</span>
            </div>
            <h1 className="text-xl font-black text-gray-900 mt-0.5">Assign Team & Service Staff</h1>
          </div>
        </div>

        {/* Work Order Info Bar */}
        <div className="flex items-center gap-4 text-xs font-medium text-gray-600 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Customer</span>
            <span className="font-bold text-gray-900">{workOrder.customer_name}</span>
          </div>
          <div className="h-6 w-px bg-gray-200" />
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Event Type</span>
            <span className="font-semibold text-gray-800">{workOrder.event_type}</span>
          </div>
        </div>
      </div>

      {/* ── Event Tabs Header ── */}
      {events.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {events.map((evt, idx) => {
            const isSelected = (activeEvent?.id || events[0].id) === evt.id
            const assignedCount = (evt.services || []).filter((s) => (s.assigned_team || []).length > 0).length
            const totalServices = (evt.services || []).length

            return (
              <button
                key={evt.id || idx}
                onClick={() => setSelectedEventId(evt.id)}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2.5 cursor-pointer whitespace-nowrap',
                  isSelected
                    ? 'bg-[#5B3FD9] text-white border-[#5B3FD9] shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                )}
              >
                <span>{evt.event_type_name || `Event ${idx + 1}`}</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-extrabold',
                    isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {assignedCount}/{totalServices} Staffed
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Active Event Card Details ── */}
      {activeEvent ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-xs">
          {/* Header Details */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-gray-900">{activeEvent.event_type_name}</h2>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 mt-1">
                <span className="flex items-center gap-1.5 text-gray-700">
                  <Calendar size={14} className="text-[#5B3FD9]" />
                  {activeEvent.event_date || 'Date TBD'}
                </span>
                <span className="flex items-center gap-1.5 text-gray-700">
                  <Clock size={14} className="text-[#5B3FD9]" />
                  {activeEvent.event_time || 'Time TBD'}
                </span>
                <span className="flex items-center gap-1.5 text-gray-700">
                  <MapPin size={14} className="text-[#5B3FD9]" />
                  {activeEvent.venue || workOrder.venue || 'Venue TBD'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-gray-400 block font-medium">Services Required</span>
              <span className="text-lg font-black text-[#5B3FD9]">
                {(activeEvent.services || []).length} Service(s)
              </span>
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (activeEvent.services || []).length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center text-gray-400 space-y-2 border-2 border-dashed border-gray-200 rounded-2xl">
              <Users size={36} className="mx-auto text-gray-300" />
              <p className="text-xs font-semibold">No services configured for this event yet.</p>
            </div>
          ) : (
            /* Services Grid */
            <div className="space-y-4">
              {(activeEvent.services || []).map((service, sIdx) => {
                const assignedTeam = service.assigned_team || []
                const maxQuantity = service.quantity || 1

                return (
                  <div
                    key={service.id || sIdx}
                    className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all space-y-4 shadow-2xs"
                  >
                    {/* Service Row Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/80 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-purple-100 text-[#5B3FD9] font-extrabold flex items-center justify-center text-sm border border-purple-200">
                          {sIdx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-sm text-gray-900">{service.service_name}</h3>
                            {getStatusBadge(service.status, assignedTeam.length)}
                          </div>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Staff Required: <strong className="text-gray-900">{maxQuantity}</strong> •{' '}
                            Start: <strong className="text-gray-800">{service.start_time || '09:00 AM'}</strong> • End:{' '}
                            <strong className="text-gray-800">{service.end_time || '06:00 PM'}</strong>
                          </p>
                        </div>
                      </div>

                      {canManage && (
                        <button
                          onClick={() => handleOpenAssignModal(activeEvent.id, service)}
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <UserPlus size={14} />
                          {assignedTeam.length > 0 ? 'Edit Team Assignment' : 'Assign Staff'}
                        </button>
                      )}
                    </div>

                    {/* Assigned Staff List */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                        Assigned Staff Members ({assignedTeam.length} / {maxQuantity})
                      </span>

                      {assignedTeam.length === 0 ? (
                        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between text-xs text-amber-800">
                          <span className="font-medium">⚠️ No team members assigned to this service yet.</span>
                          {canManage && (
                            <button
                              onClick={() => handleOpenAssignModal(activeEvent.id, service)}
                              className="font-bold underline hover:text-amber-900 cursor-pointer"
                            >
                              Assign Now
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {assignedTeam.map((member) => {
                            const empObj = employees.find((e) => e.id === member.employee_id || e.employee_id === member.employee_id)

                            return (
                              <div
                                key={member.employee_id}
                                className="p-3 rounded-xl bg-white border border-gray-200 shadow-2xs flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="size-8 rounded-full bg-[#5B3FD9] text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                                    {(member.employee_name || 'Staff').slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="truncate">
                                    <h4 className="text-xs font-bold text-gray-900 truncate">
                                      {member.employee_name}
                                    </h4>
                                    <p className="text-[10px] text-gray-500 font-medium truncate">
                                      {member.role_title}
                                    </p>
                                    {member.assigned_camera && (
                                      <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold text-[#5B3FD9] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/80 truncate">
                                        <Camera size={10} className="shrink-0" />
                                        <span className="truncate">{member.assigned_camera}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Action Buttons for Member */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {empObj && (
                                    <button
                                      title="View Employee Details"
                                      onClick={() => setViewingEmployee(empObj)}
                                      className="size-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                                    >
                                      <Eye size={13} />
                                    </button>
                                  )}
                                  {canManage && (
                                    <>
                                      <button
                                        title="Reassign Staff"
                                        onClick={() =>
                                          setReassigningMember({
                                            eventId: activeEvent.id,
                                            serviceId: service.id,
                                            oldEmployeeId: member.employee_id,
                                            oldEmployeeName: member.employee_name,
                                          })
                                        }
                                        className="size-7 rounded-lg hover:bg-purple-50 flex items-center justify-center text-[#5B3FD9] transition-colors cursor-pointer"
                                      >
                                        <RefreshCw size={13} />
                                      </button>
                                      <button
                                        title="Remove Staff Assignment"
                                        onClick={() =>
                                          setRemovingMember({
                                            eventId: activeEvent.id,
                                            serviceId: service.id,
                                            employeeId: member.employee_id,
                                            employeeName: member.employee_name,
                                          })
                                        }
                                        className="size-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-rose-600 transition-colors cursor-pointer"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* ── Assign Staff Dialog ── */}
      {assigningService && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Assign Staff Members</h3>
                <p className="text-xs text-gray-500 font-medium">
                  Service: <strong className="text-gray-800">{assigningService.service.service_name}</strong> (Max {assigningService.service.quantity || 1} Staff)
                </p>
              </div>
              <button
                onClick={() => setAssigningService(null)}
                className="size-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3.5 border-b border-gray-200 bg-white">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff by name or job role..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-xs rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5B3FD9]"
                />
              </div>
            </div>

            {/* Staff list */}
            <div className="p-4 space-y-2 overflow-y-auto flex-1">
              {employees
                .filter((emp) => {
                  const empName = emp.full_name || emp.employee_name || emp.username || ''
                  return (
                    !staffSearch ||
                    empName.toLowerCase().includes(staffSearch.toLowerCase()) ||
                    (emp.job_role || '').toLowerCase().includes(staffSearch.toLowerCase())
                  )
                })
                .map((emp) => {
                  const isSelected = selectedStaffIds.has(emp.id)
                  const maxQty = assigningService.service.quantity || 1
                  const empName = emp.full_name || emp.employee_name || emp.username || 'Staff'

                  const toggle = () => {
                    const next = new Set(selectedStaffIds)
                    if (next.has(emp.id)) {
                      next.delete(emp.id)
                    } else {
                      if (next.size >= maxQty) {
                        toast.error(`Cannot select more than ${maxQty} staff member(s).`)
                        return
                      }
                      next.add(emp.id)
                    }
                    setSelectedStaffIds(next)
                  }

                  const workRoles = getWorkRolesForEmployee(emp.id)

                  return (
                    <div
                      key={emp.id}
                      onClick={toggle}
                      className={cn(
                        'p-3 rounded-xl border cursor-pointer transition-all text-xs space-y-2.5',
                        isSelected
                          ? 'bg-purple-50/70 border-[#5B3FD9] text-[#5B3FD9] ring-1 ring-[#5B3FD9]'
                          : 'bg-white border-gray-200 hover:border-gray-300 text-gray-800'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700">
                            {empName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{empName}</h4>
                            {workRoles.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {workRoles.map((wr) => (
                                  <span key={wr.role_id} className="px-1.5 py-0.5 rounded bg-purple-50 text-[#5B3FD9] border border-purple-200 text-[10px] font-bold">
                                    {wr.role_name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-gray-400 font-medium">No work roles assigned</p>
                            )}
                          </div>
                        </div>
                        <div
                          className={cn(
                            'size-5 rounded-md flex items-center justify-center border shrink-0',
                            isSelected ? 'bg-[#5B3FD9] border-[#5B3FD9] text-white' : 'border-gray-300 bg-white'
                          )}
                        >
                          {isSelected && <Check size={12} />}
                        </div>
                      </div>

                      {/* Camera / Gear Assignment Dropdown for Selected Staff */}
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
                })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-600 font-semibold">
                Selected: <strong className="text-[#5B3FD9]">{selectedStaffIds.size}</strong> / {assigningService.service.quantity || 1}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAssigningService(null)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssignments}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white cursor-pointer"
                >
                  Save Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Reassign Modal ── */}
      {reassigningMember && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-purple-100 text-[#5B3FD9] flex items-center justify-center">
                <RefreshCw size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Reassign Staff</h3>
                <p className="text-xs text-gray-500">
                  Replacing <strong className="text-gray-800">{reassigningMember.oldEmployeeName}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600">Select a replacement employee from the active team list below:</p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {employees
                .filter((e) => e.id !== reassigningMember.oldEmployeeId)
                .map((emp) => {
                  const empName = emp.full_name || emp.employee_name || emp.username || 'Staff'
                  return (
                    <div
                      key={emp.id}
                      onClick={() => handleConfirmReassign(emp)}
                      className="p-3 rounded-xl border border-gray-200 hover:border-[#5B3FD9] hover:bg-purple-50 cursor-pointer transition-all flex items-center justify-between text-xs font-semibold"
                    >
                      <div>
                        <span className="font-bold text-gray-900 block">{empName}</span>
                        <span className="text-[11px] text-gray-500 font-normal">{emp.job_role || 'Staff'}</span>
                      </div>
                      <span className="text-[#5B3FD9] font-extrabold text-[11px]">Select →</span>
                    </div>
                  )
                })}
            </div>

            <button
              onClick={() => setReassigningMember(null)}
              className="w-full py-2 text-xs font-bold rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Remove Confirmation Dialog ── */}
      {removingMember && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-gray-200 shadow-2xl p-6 space-y-4 text-center">
            <div className="size-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-black text-base text-gray-900">Remove Assignment?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to remove <strong className="text-gray-900">{removingMember.employeeName}</strong> from this service assignment?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setRemovingMember(null)}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Employee Profile Drawer ── */}
      <EmployeeProfileDrawer
        isOpen={Boolean(viewingEmployee)}
        onClose={() => setViewingEmployee(null)}
        employee={viewingEmployee}
      />
    </div>
  )
}
