import { useState } from 'react'
import { HardDrive, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function CrewEquipmentPage() {
  const [search, setSearch] = useState('')

  const equipmentList = [
    { id: 'eq_1', name: 'Sony A7IV Body', serial: 'SN-998822', assigned: 'Murali', condition: 'Excellent', status: 'Assigned' },
    { id: 'eq_2', name: 'Sony 24-70mm f/2.8 GM Lens', serial: 'SN-443311', assigned: 'Murali', condition: 'Good', status: 'Assigned' },
    { id: 'eq_3', name: 'DJI Mavic 3 Pro Drone Kit', serial: 'SN-772299', assigned: 'Murali', condition: 'Excellent', status: 'Assigned' },
    { id: 'eq_4', name: 'Aputure 300d Light + Softbox', serial: 'SN-112233', assigned: 'Studio Locker', condition: 'Fair', status: 'Available' },
    { id: 'eq_5', name: 'Sennheiser Wireless Mic Pack', serial: 'SN-556677', assigned: 'Murali', condition: 'Good', status: 'Assigned' },
  ]

  const handleReportIssue = (name: string) => {
    toast.success(`Damage / maintenance report initiated for ${name}`)
  }

  const filtered = equipmentList.filter((e) => !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.serial.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 text-gray-900 font-sans max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <HardDrive size={24} className="text-[#5B3FD9]" /> Equipment & Gear Management
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Track camera gear, lenses, lighting, audio equipment & drone kits assigned to your workflow.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search gear or serial no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#5B3FD9] shadow-xs"
          />
        </div>
      </div>

      {/* CRM Equipment Data Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-gray-200 text-gray-500 font-bold uppercase">
              <tr>
                <th className="py-3.5 px-4">Equipment Item</th>
                <th className="py-3.5 px-4">Serial Number</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4">Condition</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80">
                  <td className="py-4 px-4 font-extrabold text-gray-900">{item.name}</td>
                  <td className="py-4 px-4 font-bold text-[#5B3FD9]">{item.serial}</td>
                  <td className="py-4 px-4 text-gray-700">{item.assigned}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                      {item.condition}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => handleReportIssue(item.name)}
                      className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-extrabold transition-all cursor-pointer"
                    >
                      Report Issue
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
