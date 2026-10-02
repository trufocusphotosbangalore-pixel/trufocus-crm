import { useState, useEffect } from 'react'
import {
  Camera, Plus, Search, Edit2, Trash2, UserCheck, Wrench,
  CheckCircle2, AlertTriangle, ShieldAlert,
  HardDrive, Filter, RefreshCw, X, ChevronDown, Check,
  Radio, Sparkles
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils/cn'
import {
  type EquipmentItem,
  type EquipmentCategory,
  type EquipmentCondition,
  type EquipmentStatus,
  loadAllEquipmentItems,
  syncEquipmentWithCloud,
  addEquipmentItem,
  updateEquipmentItem,
  deleteEquipmentItem,
  assignEquipment,
  returnEquipment,
  loadAllDamageReports,
  type EquipmentDamageReport,
} from '@/services/equipmentService'
import { fetchAllEmployeesFromCloud } from '@/services/employeeService'
import type { UserAccount } from '@/types/teamLogin'

const CATEGORIES: EquipmentCategory[] = [
  'Camera',
  'Lens',
  'Drone',
  'Lighting',
  'Flash',
  'Audio / Mic',
  'Gimbal',
  'Tripod',
  'Battery',
  'Memory Card',
  'Accessory',
]

const CONDITIONS: EquipmentCondition[] = ['Excellent', 'Good', 'Fair', 'Needs Service', 'Damaged']

const STATUSES: EquipmentStatus[] = ['Available', 'Assigned', 'In Maintenance', 'Retired']

export function EquipmentManagementTab() {
  const [items, setItems] = useState<EquipmentItem[]>(() => loadAllEquipmentItems())
  const [employees, setEmployees] = useState<UserAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null)
  const [assigningItem, setAssigningItem] = useState<EquipmentItem | null>(null)
  const [showDamageReports, setShowDamageReports] = useState(false)
  const [damageReports, setDamageReports] = useState<EquipmentDamageReport[]>([])

  // Form State
  const [formData, setFormData] = useState({
    item_name: '',
    category: 'Camera' as EquipmentCategory,
    brand: '',
    model: '',
    serial_number: '',
    assigned_to_employee_id: '',
    assigned_to_employee_name: '',
    condition: 'Excellent' as EquipmentCondition,
    battery_percentage: 100,
    return_status: 'Available' as EquipmentStatus,
    notes: '',
  })

  // Load cloud data & employees
  useEffect(() => {
    let isMounted = true
    setLoading(true)

    Promise.all([
      syncEquipmentWithCloud(),
      fetchAllEmployeesFromCloud(),
    ])
      .then(([eqData, empData]) => {
        if (isMounted) {
          if (eqData) setItems(eqData)
          if (empData) setEmployees(empData.filter((e) => e.status === 'active' || e.account_status === 'active'))
          setDamageReports(loadAllDamageReports())
          setLoading(false)
        }
      })
      .catch((e) => {
        console.warn('Failed initial equipment load:', e)
        if (isMounted) setLoading(false)
      })

    const handleUpdate = () => {
      setItems(loadAllEquipmentItems())
      setDamageReports(loadAllDamageReports())
    }

    window.addEventListener('trufocus_equipment_updated', handleUpdate)
    return () => {
      isMounted = false
      window.removeEventListener('trufocus_equipment_updated', handleUpdate)
    }
  }, [])

  // KPI calculations
  const totalGear = items.length
  const totalCameras = items.filter((i) => i.category === 'Camera').length
  const availableGear = items.filter((i) => i.return_status === 'Available').length
  const assignedGear = items.filter((i) => i.return_status === 'Assigned').length
  const maintenanceGear = items.filter((i) => i.return_status === 'In Maintenance' || i.condition === 'Damaged' || i.condition === 'Needs Service').length

  // Filtered Items
  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    const matchSearch =
      !search ||
      i.item_name.toLowerCase().includes(q) ||
      i.serial_number.toLowerCase().includes(q) ||
      (i.brand || '').toLowerCase().includes(q) ||
      (i.model || '').toLowerCase().includes(q) ||
      (i.assigned_to_employee_name || '').toLowerCase().includes(q)

    const matchCategory = categoryFilter === 'all' || i.category === categoryFilter
    const matchStatus = statusFilter === 'all' || i.return_status === statusFilter

    return matchSearch && matchCategory && matchStatus
  })

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({
      item_name: '',
      category: 'Camera',
      brand: 'Sony',
      model: '',
      serial_number: '',
      assigned_to_employee_id: '',
      assigned_to_employee_name: '',
      condition: 'Excellent',
      battery_percentage: 100,
      return_status: 'Available',
      notes: '',
    })
    setIsAddEditOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (item: EquipmentItem) => {
    setEditingItem(item)
    setFormData({
      item_name: item.item_name,
      category: item.category,
      brand: item.brand || '',
      model: item.model || '',
      serial_number: item.serial_number,
      assigned_to_employee_id: item.assigned_to_employee_id || '',
      assigned_to_employee_name: item.assigned_to_employee_name || '',
      condition: item.condition,
      battery_percentage: item.battery_percentage ?? 100,
      return_status: item.return_status,
      notes: item.notes || '',
    })
    setIsAddEditOpen(true)
  }

  // Submit Add / Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.item_name.trim()) {
      toast.error('Please enter equipment name')
      return
    }
    if (!formData.serial_number.trim()) {
      toast.error('Please enter serial number')
      return
    }

    let assignedName = formData.assigned_to_employee_name
    if (formData.assigned_to_employee_id) {
      const matchedEmp = employees.find(
        (emp) => emp.id === formData.assigned_to_employee_id || emp.employee_id === formData.assigned_to_employee_id
      )
      if (matchedEmp) {
        assignedName = matchedEmp.full_name || matchedEmp.employee_name || matchedEmp.username || 'Staff'
      }
    } else {
      assignedName = 'Studio Locker'
    }

    const payload = {
      ...formData,
      assigned_to_employee_name: assignedName,
      return_status: formData.assigned_to_employee_id ? ('Assigned' as EquipmentStatus) : formData.return_status,
    }

    if (editingItem) {
      await updateEquipmentItem({
        ...editingItem,
        ...payload,
      })
      toast.success('Equipment updated successfully!')
    } else {
      await addEquipmentItem(payload)
      toast.success('New equipment added to studio inventory!')
    }

    setItems(loadAllEquipmentItems())
    setIsAddEditOpen(false)
  }

  // Handle Quick Assign / Return
  const handleConfirmAssign = async (employeeId: string) => {
    if (!assigningItem) return

    if (!employeeId || employeeId === 'studio_locker') {
      await returnEquipment(assigningItem.id)
      toast.success(`${assigningItem.item_name} returned to Studio Locker`)
    } else {
      const emp = employees.find((e) => e.id === employeeId || e.employee_id === employeeId)
      const empName = emp ? (emp.full_name || emp.employee_name || emp.username) : 'Staff'
      await assignEquipment(assigningItem.id, employeeId, empName)
      toast.success(`${assigningItem.item_name} assigned to ${empName}`)
    }

    setItems(loadAllEquipmentItems())
    setAssigningItem(null)
  }

  // Delete handler
  const handleDelete = async (item: EquipmentItem) => {
    if (!confirm(`Are you sure you want to remove "${item.item_name}" (${item.serial_number}) from equipment inventory?`)) {
      return
    }
    await deleteEquipmentItem(item.id)
    setItems(loadAllEquipmentItems())
    toast.success('Equipment removed successfully')
  }

  // Refresh from cloud
  const handleRefresh = async () => {
    setLoading(true)
    const fresh = await syncEquipmentWithCloud()
    setItems(fresh)
    setLoading(false)
    toast.success('Equipment inventory synced with cloud')
  }

  return (
    <div className="space-y-6 text-gray-900 font-sans">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Camera className="text-[#5B3FD9]" size={22} />
            Equipment & Gear Management
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Register cameras, lenses, drones & kits. Assign gear to photographers and videographers for assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {damageReports.length > 0 && (
            <button
              onClick={() => setShowDamageReports(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <AlertTriangle size={14} className="text-amber-600" />
              Damage Reports ({damageReports.length})
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Sync with cloud"
          >
            <RefreshCw size={15} className={cn(loading && 'animate-spin text-[#5B3FD9]')} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus size={15} />
            Add Camera / Gear
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Total Gear</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-gray-900">{totalGear}</span>
            <HardDrive size={18} className="text-gray-400" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B3FD9] block">Cameras</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-[#5B3FD9]">{totalCameras}</span>
            <Camera size={18} className="text-[#5B3FD9]" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Available (Locker)</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-emerald-700">{availableGear}</span>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Assigned to Crew</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-blue-700">{assignedGear}</span>
            <UserCheck size={18} className="text-blue-600" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/80 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Maintenance / Damaged</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-rose-700">{maintenanceGear}</span>
            <Wrench size={18} className="text-rose-600" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search gear by name, model, serial no, or assigned crew..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-[#5B3FD9] focus:bg-white transition-all shadow-2xs"
          />
        </div>

        {/* Category & Status Selectors */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-gray-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 px-3 text-xs font-semibold rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:border-[#5B3FD9] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 text-xs font-semibold rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:border-[#5B3FD9] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Equipment Item</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Serial Number</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4">Condition</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Camera size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-xs text-gray-500">No equipment found matching criteria.</p>
                    <button
                      onClick={handleOpenAdd}
                      className="mt-3 text-xs font-bold text-[#5B3FD9] hover:underline"
                    >
                      + Add New Equipment
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isAssigned = item.return_status === 'Assigned' && item.assigned_to_employee_name && item.assigned_to_employee_name !== 'Studio Locker'

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-purple-50 text-[#5B3FD9] border border-purple-200 flex items-center justify-center shrink-0">
                            {item.category === 'Camera' ? (
                              <Camera size={16} />
                            ) : item.category === 'Audio / Mic' ? (
                              <Radio size={16} />
                            ) : (
                              <HardDrive size={16} />
                            )}
                          </div>
                          <div>
                            <span className="font-extrabold text-gray-900 block">{item.item_name}</span>
                            {item.brand && (
                              <span className="text-[10px] text-gray-500 font-semibold">
                                {item.brand} {item.model ? `• ${item.model}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-[#5B3FD9]">
                        {item.serial_number}
                      </td>

                      <td className="py-3.5 px-4">
                        {isAssigned ? (
                          <div className="flex items-center gap-1.5">
                            <div className="size-5 rounded-full bg-[#5B3FD9] text-white flex items-center justify-center text-[9px] font-black">
                              {(item.assigned_to_employee_name || 'C').slice(0, 1).toUpperCase()}
                            </div>
                            <span className="font-bold text-gray-900">{item.assigned_to_employee_name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-semibold italic text-[11px]">
                            Studio Locker (Available)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border',
                            item.condition === 'Excellent' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            item.condition === 'Good' && 'bg-blue-50 text-blue-700 border-blue-200',
                            item.condition === 'Fair' && 'bg-amber-50 text-amber-700 border-amber-200',
                            (item.condition === 'Needs Service' || item.condition === 'Damaged') && 'bg-rose-50 text-rose-700 border-rose-200'
                          )}
                        >
                          {item.condition}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border',
                            item.return_status === 'Available' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            item.return_status === 'Assigned' && 'bg-purple-50 text-[#5B3FD9] border-purple-200',
                            item.return_status === 'In Maintenance' && 'bg-rose-50 text-rose-700 border-rose-200',
                            item.return_status === 'Retired' && 'bg-gray-100 text-gray-600 border-gray-200'
                          )}
                        >
                          {item.return_status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Assign to Photographer / Videographer"
                            onClick={() => setAssigningItem(item)}
                            className="px-2.5 py-1 rounded-lg border border-[#5B3FD9]/30 bg-purple-50/70 hover:bg-purple-100 text-[#5B3FD9] text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <UserCheck size={12} />
                            {isAssigned ? 'Reassign' : 'Assign'}
                          </button>

                          <button
                            title="Edit Equipment Details"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            title="Delete Item"
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Add / Edit Equipment Modal ─── */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  {editingItem ? 'Edit Equipment Details' : 'Add New Camera / Equipment'}
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Register hardware specifications and initial assignment status.
                </p>
              </div>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="size-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Item Name */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Equipment / Camera Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony A7IV Body, Sony FX3, Canon EOS R5"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9] focus:bg-white"
                />
              </div>

              {/* Category & Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as EquipmentCategory })}
                    className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9] focus:bg-white font-medium"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Sony, Canon, DJI, Godox"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9] focus:bg-white"
                  />
                </div>
              </div>

              {/* Model & Serial Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Model / Specs</label>
                  <input
                    type="text"
                    placeholder="e.g. ILCE-7M4, 24-70mm GM"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Serial Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SN-998822"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    className="w-full h-9 px-3 font-mono rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9] focus:bg-white"
                  />
                </div>
              </div>

              {/* Assign To Photographer / Videographer */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Assign to Photographer / Videographer
                </label>
                <select
                  value={formData.assigned_to_employee_id}
                  onChange={(e) => {
                    const empId = e.target.value
                    const matched = employees.find((emp) => emp.id === empId || emp.employee_id === empId)
                    setFormData({
                      ...formData,
                      assigned_to_employee_id: empId,
                      assigned_to_employee_name: matched ? (matched.full_name || matched.employee_name || matched.username) : 'Studio Locker',
                      return_status: empId ? 'Assigned' : 'Available',
                    })
                  }}
                  className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9] focus:bg-white font-medium"
                >
                  <option value="">Studio Locker (Unassigned / Available)</option>
                  {employees.map((emp) => {
                    const empName = emp.full_name || emp.employee_name || emp.username || 'Staff'
                    const role = emp.job_role || (emp.job_roles && emp.job_roles[0]) || 'Crew'
                    return (
                      <option key={emp.id} value={emp.id}>
                        {empName} ({role})
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Condition & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Condition</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as EquipmentCondition })}
                    className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9] focus:bg-white font-medium"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Status</label>
                  <select
                    value={formData.return_status}
                    onChange={(e) => setFormData({ ...formData, return_status: e.target.value as EquipmentStatus })}
                    className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9] focus:bg-white font-medium"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">Notes / Kit Contents</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Includes 2x batteries, 128GB card, dual charger..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9] focus:bg-white"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#5B3FD9] hover:bg-[#4C34C3] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Register Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Quick Assign Modal ─── */}
      {assigningItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Assign Gear</h3>
                <p className="text-xs text-gray-500 font-medium">
                  {assigningItem.item_name} ({assigningItem.serial_number})
                </p>
              </div>
              <button
                onClick={() => setAssigningItem(null)}
                className="size-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-2 overflow-y-auto flex-1 text-xs">
              {/* Option to return to locker */}
              <div
                onClick={() => handleConfirmAssign('studio_locker')}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                  !assigningItem.assigned_to_employee_id
                    ? 'bg-purple-50 border-[#5B3FD9] text-[#5B3FD9] font-bold'
                    : 'bg-white border-gray-200 hover:border-gray-300 text-gray-800'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                    🏢
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Studio Locker</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Store gear in studio / unassigned</p>
                  </div>
                </div>
                {!assigningItem.assigned_to_employee_id && <Check size={16} className="text-[#5B3FD9]" />}
              </div>

              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  Photographers & Crew Members:
                </span>
                <div className="space-y-1.5">
                  {employees.map((emp) => {
                    const isCurrent = assigningItem.assigned_to_employee_id === emp.id || assigningItem.assigned_to_employee_id === emp.employee_id
                    const empName = emp.full_name || emp.employee_name || emp.username || 'Staff'
                    const role = emp.job_role || (emp.job_roles && emp.job_roles[0]) || 'Photographer'

                    return (
                      <div
                        key={emp.id}
                        onClick={() => handleConfirmAssign(emp.id)}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                          isCurrent
                            ? 'bg-purple-50 border-[#5B3FD9] text-[#5B3FD9] font-bold ring-1 ring-[#5B3FD9]'
                            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-800'
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-full bg-[#5B3FD9] text-white flex items-center justify-center font-bold text-xs">
                            {empName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{empName}</h4>
                            <p className="text-[10px] text-gray-500 font-medium">{role}</p>
                          </div>
                        </div>
                        {isCurrent && <Check size={16} className="text-[#5B3FD9]" />}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Damage Reports Modal ─── */}
      {showDamageReports && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-gray-200 bg-amber-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-amber-600" size={20} />
                <div>
                  <h3 className="font-extrabold text-base text-amber-900">Equipment Damage & Maintenance Reports</h3>
                  <p className="text-xs text-amber-700 font-medium">
                    Issues submitted by crew members from the Staff Operating System.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDamageReports(false)}
                className="size-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto flex-1 text-xs">
              {damageReports.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No damage reports submitted.</p>
              ) : (
                damageReports.map((rep) => (
                  <div key={rep.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-gray-900">{rep.equipment_name}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {rep.status}
                      </span>
                    </div>
                    <p className="text-gray-700">{rep.damage_description}</p>
                    <p className="text-[10px] text-gray-500">
                      Reported by: <strong className="text-gray-700">{rep.employee_name || rep.employee_id}</strong> •{' '}
                      {new Date(rep.reported_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
