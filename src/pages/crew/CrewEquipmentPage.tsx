import { useState, useEffect } from 'react'
import {
  HardDrive, Search, Camera, AlertTriangle, CheckCircle2,
  RefreshCw, X, ShieldAlert, Radio
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils/cn'
import {
  type EquipmentItem,
  loadAllEquipmentItems,
  syncEquipmentWithCloud,
  reportEquipmentDamage,
} from '@/services/equipmentService'
import { getCrewSession } from '@/services/crewSessionService'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'

export default function CrewEquipmentPage() {
  const [crewUser] = useState(() => getCrewSession())
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>(() => loadAllEquipmentItems())
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'mine'>('all')

  // Report Issue Modal
  const [reportingItem, setReportingItem] = useState<EquipmentItem | null>(null)
  const [damageDescription, setDamageDescription] = useState('')
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

  const reloadData = async () => {
    setLoading(true)
    try {
      const fresh = await syncEquipmentWithCloud()
      setEquipmentList(fresh)
    } catch (e) {
      console.warn('Equipment sync error:', e)
    } finally {
      setLoading(false)
    }
  }

  useRealtimeSync(reloadData)

  useEffect(() => {
    reloadData()
    const handleUpdate = () => {
      setEquipmentList(loadAllEquipmentItems())
    }
    window.addEventListener('trufocus_equipment_updated', handleUpdate)
    return () => {
      window.removeEventListener('trufocus_equipment_updated', handleUpdate)
    }
  }, [])

  const currentUserName = crewUser?.full_name || crewUser?.username || crewUser?.employee_name || ''
  const currentUserId = crewUser?.id || crewUser?.employee_id || ''

  const handleOpenReport = (item: EquipmentItem) => {
    setReportingItem(item)
    setDamageDescription('')
    setSeverity('Medium')
  }

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportingItem) return
    if (!damageDescription.trim()) {
      toast.error('Please describe the issue or damage')
      return
    }

    setIsSubmittingReport(true)
    try {
      reportEquipmentDamage({
        equipment_id: reportingItem.id,
        equipment_name: `${reportingItem.item_name} (${reportingItem.serial_number})`,
        employee_id: currentUserId || 'Crew Member',
        employee_name: currentUserName || 'Crew Member',
        damage_description: damageDescription.trim(),
        severity,
      })

      toast.success(`Damage report submitted for ${reportingItem.item_name}. Studio manager notified.`)
      setReportingItem(null)
      setEquipmentList(loadAllEquipmentItems())
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit damage report')
    } finally {
      setIsSubmittingReport(false)
    }
  }

  const filtered = equipmentList.filter((e) => {
    const q = search.toLowerCase()
    const matchSearch =
      !search ||
      e.item_name.toLowerCase().includes(q) ||
      e.serial_number.toLowerCase().includes(q) ||
      (e.assigned_to_employee_name || '').toLowerCase().includes(q) ||
      (e.brand || '').toLowerCase().includes(q)

    if (!matchSearch) return false

    if (filterMode === 'mine') {
      const assignedId = (e.assigned_to_employee_id || '').toLowerCase()
      const assignedName = (e.assigned_to_employee_name || '').toLowerCase()
      const myId = currentUserId.toLowerCase()
      const myName = currentUserName.toLowerCase()

      const isMine =
        (myId && assignedId === myId) ||
        (myName && assignedName.includes(myName)) ||
        (myName && myName.includes(assignedName) && assignedName !== 'studio locker')

      return isMine
    }

    return true
  })

  return (
    <div className="space-y-6 text-gray-900 font-sans max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <HardDrive size={24} className="text-[#5B3FD9]" /> Equipment & Gear Management
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Track camera gear, lenses, lighting, audio equipment & drone kits assigned to your workflow.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Filter Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-gray-100 border border-gray-200 text-xs font-bold">
            <button
              onClick={() => setFilterMode('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                filterMode === 'all'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              All Studio Gear ({equipmentList.length})
            </button>
            <button
              onClick={() => setFilterMode('mine')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                filterMode === 'mine'
                  ? 'bg-[#5B3FD9] text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              My Assigned Gear
            </button>
          </div>

          <div className="relative w-full sm:w-60">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search gear or serial no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#5B3FD9] shadow-xs"
            />
          </div>

          <button
            onClick={reloadData}
            disabled={loading}
            className="size-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors shrink-0 cursor-pointer"
            title="Refresh equipment list"
          >
            <RefreshCw size={14} className={cn(loading && 'animate-spin text-[#5B3FD9]')} />
          </button>
        </div>
      </div>

      {/* CRM Equipment Data Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
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
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Camera size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-xs text-gray-500">
                      {filterMode === 'mine'
                        ? 'No equipment currently assigned to you.'
                        : 'No equipment found matching criteria.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const assignedName = item.assigned_to_employee_name || 'Studio Locker'
                  const isAvailable = item.return_status === 'Available' || assignedName === 'Studio Locker'

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-extrabold text-gray-900">
                        <div className="flex items-center gap-2">
                          {item.category === 'Camera' ? (
                            <Camera size={14} className="text-[#5B3FD9] shrink-0" />
                          ) : item.category === 'Audio / Mic' ? (
                            <Radio size={14} className="text-[#5B3FD9] shrink-0" />
                          ) : (
                            <HardDrive size={14} className="text-[#5B3FD9] shrink-0" />
                          )}
                          <span>{item.item_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-[#5B3FD9]">{item.serial_number}</td>
                      <td className="py-4 px-4 text-gray-700">
                        {isAvailable ? (
                          <span className="text-gray-400 italic">Studio Locker</span>
                        ) : (
                          <span className="font-bold text-gray-900">{assignedName}</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[10px] font-extrabold border',
                            item.condition === 'Excellent' && 'bg-blue-50 text-blue-700 border-blue-200',
                            item.condition === 'Good' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            item.condition === 'Fair' && 'bg-amber-50 text-amber-700 border-amber-200',
                            (item.condition === 'Needs Service' || item.condition === 'Damaged') &&
                              'bg-rose-50 text-rose-700 border-rose-200'
                          )}
                        >
                          {item.condition}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border',
                            item.return_status === 'Available' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            item.return_status === 'Assigned' && 'bg-blue-50 text-blue-700 border-blue-200',
                            item.return_status === 'In Maintenance' && 'bg-rose-50 text-rose-700 border-rose-200',
                            item.return_status === 'Retired' && 'bg-gray-100 text-gray-600 border-gray-200'
                          )}
                        >
                          {item.return_status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleOpenReport(item)}
                          className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-extrabold transition-all cursor-pointer"
                        >
                          Report Issue
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Issue Modal */}
      {reportingItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-200 bg-amber-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-amber-600" size={20} />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-gray-900">Report Damage / Maintenance</h3>
                  <p className="text-xs text-gray-500 font-medium">{reportingItem.item_name} ({reportingItem.serial_number})</p>
                </div>
              </div>
              <button
                onClick={() => setReportingItem(null)}
                className="size-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Issue Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9] font-medium"
                >
                  <option value="Low">Low - Minor cosmetic scratch / cleaning needed</option>
                  <option value="Medium">Medium - Battery drain / sticky dial / maintenance check</option>
                  <option value="High">High - Autofocus error / sensor dust / faulty port</option>
                  <option value="Critical">Critical - Physical drop / broken mount / unusable</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Describe Damage / Malfunction <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail what happened, when the issue was observed, and current condition of the gear..."
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9] focus:bg-white"
                />
              </div>

              <div className="pt-2 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportingItem(null)}
                  className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-5 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
