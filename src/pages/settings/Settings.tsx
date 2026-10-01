import { useEffect, useState } from 'react'
import {
  Settings as SettingsIcon, Calendar, Layers, Package,
  CreditCard, FileText, Building2, Users, Plus, Trash2, ShieldCheck, Briefcase, Cpu, Tag, Film as FilmIcon,
} from 'lucide-react'
import { ServiceCatalogTab } from '@/components/settings/ServiceCatalogTab'
import { BusinessProfileTab } from '@/components/settings/BusinessProfileTab'
import { cn } from '@/utils/cn'
import {
  loadSettingsFromStorage,
  saveSettingsToStorage,
} from '@/services/settingsStore'
import type {
  SettingsState, EventTypeMaster, ServiceMaster, DeliverableMaster,
  PaymentModeMaster, ContractTemplateMaster, DepartmentMaster,
  EmployeeRoleMaster, EmployeeProfile,
} from '@/types/settings'
import { toast } from 'react-hot-toast'
import {
  fetchAllEmployeesFromCloud,
  createEmployeeInCloud,
  updateEmployeeInCloud,
  deleteEmployeeFromCloud,
} from '@/services/employeeService'
import { RichTextEditor } from '@/components/common/RichTextEditor'
import { TeamAccessTab } from '@/components/settings/TeamAccessTab'
import { DeletedWorkOrdersTab } from '@/components/settings/DeletedWorkOrdersTab'
import { DeletedEnquiriesTab } from '@/components/settings/DeletedEnquiriesTab'
import { JobRolesTab } from '@/components/settings/JobRolesTab'
import { AiDeveloperTab } from '@/components/settings/AiDeveloperTab'
import { WeddingFilmsManagerTab } from '@/components/settings/WeddingFilmsManagerTab'

type TabType =
  | 'wedding_films'
  | 'business_profile'
  | 'job_roles'
  | 'team_access'
  | 'service_catalog'
  | 'deleted_work_orders'
  | 'deleted_enquiries'
  | 'ai_developer'
  | 'event_types'
  | 'services'
  | 'deliverables'
  | 'payment_modes'
  | 'contract_templates'
  | 'departments'
  | 'staff'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('team_access')
  const [settings, setSettings] = useState<SettingsState>(() => loadSettingsFromStorage())

  const saveState = (updated: SettingsState) => {
    setSettings(updated)
    saveSettingsToStorage(updated)
    toast.success('Settings updated successfully!')
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  // Delete handlers
  const deleteEventType = (id: string) => {
    const updated = { ...settings, eventTypes: settings.eventTypes.filter(e => e.id !== id) }
    saveState(updated)
  }

  const deleteService = (id: string) => {
    const updated = { ...settings, services: settings.services.filter(s => s.id !== id) }
    saveState(updated)
  }

  const deleteDeliverable = (id: string) => {
    const updated = { ...settings, deliverables: settings.deliverables.filter(d => d.id !== id) }
    saveState(updated)
  }

  const deletePaymentMode = (id: string) => {
    const updated = { ...settings, paymentModes: settings.paymentModes.filter(p => p.id !== id) }
    saveState(updated)
  }

  const deleteContractTemplate = (id: string) => {
    const updated = { ...settings, contractTemplates: settings.contractTemplates.filter(c => c.id !== id) }
    saveState(updated)
  }

  const deleteDepartment = (id: string) => {
    const updated = { ...settings, departments: settings.departments.filter(d => d.id !== id) }
    saveState(updated)
  }

  // Toggle Active status
  const toggleActive = (collection: keyof SettingsState, id: string) => {
    const list = settings[collection] as any[]
    const updatedList = list.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item)
    const updated = { ...settings, [collection]: updatedList }
    saveState(updated)
  }

  const TABS = [
    { id: 'wedding_films', label: 'Wedding Films Manager', icon: FilmIcon },
    { id: 'business_profile', label: 'Business Profile & Branding', icon: Building2 },
    { id: 'job_roles', label: 'Job Roles Master', icon: Briefcase },
    { id: 'team_access', label: 'Team Access & Permissions', icon: ShieldCheck },
    { id: 'service_catalog', label: 'Service Catalog', icon: Tag },
    { id: 'ai_developer', label: 'AI & Developer Settings', icon: Cpu },
    { id: 'deleted_work_orders', label: 'Deleted Work Orders / Trash', icon: Trash2 },
    { id: 'deleted_enquiries', label: 'Deleted Enquiries / Trash', icon: Trash2 },
    { id: 'event_types', label: 'Event Types', icon: Calendar },
    { id: 'services', label: 'Services Master', icon: Layers },
    { id: 'deliverables', label: 'Deliverables Master', icon: Package },
    { id: 'payment_modes', label: 'Payment Modes', icon: CreditCard },
    { id: 'contract_templates', label: 'Contract Templates', icon: FileText },
    { id: 'departments', label: 'Departments & Roles', icon: Building2 },
    { id: 'staff', label: 'Staff & Team Eligibility', icon: Users },
  ] as const

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-5">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-[var(--color-primary)]/15 flex items-center justify-center text-[var(--color-primary)]">
            <SettingsIcon size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              Studio Settings & Configuration
            </h1>
            <p className="text-xs text-[var(--color-text-muted)]">
              Configure brand identity, statutory compliance, team access, and catalog masters
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--color-border-default)] pb-px no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition-colors shrink-0',
                isActive
                  ? 'bg-[var(--color-bg-surface)] text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] font-semibold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]/50'
              )}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-xl)] p-5 shadow-xs">
        {/* -2. WEDDING FILMS MANAGER */}
        {activeTab === 'wedding_films' && <WeddingFilmsManagerTab />}

        {/* -1. BUSINESS PROFILE & BRANDING */}
        {activeTab === 'business_profile' && <BusinessProfileTab />}

        {/* 0.0 JOB ROLES MASTER */}
        {activeTab === 'job_roles' && <JobRolesTab />}

        {/* 0. TEAM ACCESS & PERMISSIONS */}
        {activeTab === 'team_access' && <TeamAccessTab />}

        {/* 0.05 SERVICE CATALOG MASTER */}
        {activeTab === 'service_catalog' && <ServiceCatalogTab />}

        {/* 0.1 AI & DEVELOPER SETTINGS */}
        {activeTab === 'ai_developer' && <AiDeveloperTab />}

        {/* 0.5 DELETED WORK ORDERS / TRASH */}
        {activeTab === 'deleted_work_orders' && <DeletedWorkOrdersTab />}

        {/* 0.6 DELETED ENQUIRIES / TRASH */}
        {activeTab === 'deleted_enquiries' && <DeletedEnquiriesTab />}

        {/* 1. EVENT TYPES */}
        {activeTab === 'event_types' && (
          <EventTypesTab
            eventTypes={settings.eventTypes}
            onToggleActive={(id) => toggleActive('eventTypes', id)}
            onDelete={deleteEventType}
            onSave={(items) => saveState({ ...settings, eventTypes: items })}
          />
        )}

        {/* 2. SERVICES MASTER */}
        {activeTab === 'services' && (
          <ServicesTab
            services={settings.services}
            departments={settings.departments}
            onToggleActive={(id) => toggleActive('services', id)}
            onDelete={deleteService}
            onSave={(items) => saveState({ ...settings, services: items })}
          />
        )}

        {/* 3. DELIVERABLES MASTER */}
        {activeTab === 'deliverables' && (
          <DeliverablesTab
            deliverables={settings.deliverables}
            onToggleActive={(id) => toggleActive('deliverables', id)}
            onDelete={deleteDeliverable}
            onSave={(items) => saveState({ ...settings, deliverables: items })}
          />
        )}

        {/* 4. PAYMENT MODES */}
        {activeTab === 'payment_modes' && (
          <PaymentModesTab
            paymentModes={settings.paymentModes}
            onToggleActive={(id) => toggleActive('paymentModes', id)}
            onDelete={deletePaymentMode}
            onSave={(items) => saveState({ ...settings, paymentModes: items })}
          />
        )}

        {/* 5. CONTRACT TEMPLATES */}
        {activeTab === 'contract_templates' && (
          <ContractTemplatesTab
            templates={settings.contractTemplates}
            onToggleActive={(id) => toggleActive('contractTemplates', id)}
            onDelete={deleteContractTemplate}
            onSave={(items) => saveState({ ...settings, contractTemplates: items })}
          />
        )}

        {/* 6. DEPARTMENTS & ROLES */}
        {activeTab === 'departments' && (
          <DepartmentsTab
            departments={settings.departments}
            employeeRoles={settings.employeeRoles}
            onDeleteDepartment={deleteDepartment}
            onSaveDepartments={(depts) => saveState({ ...settings, departments: depts })}
            onSaveRoles={(roles) => saveState({ ...settings, employeeRoles: roles })}
          />
        )}

        {/* 7. STAFF ELIGIBILITY */}
        {activeTab === 'staff' && (
          <StaffTab
            services={settings.services}
            roles={settings.employeeRoles}
          />
        )}
      </div>
    </div>
  )
}

// ─── 1. Event Types Tab ───────────────────────────────────────────────────────

function EventTypesTab({
  eventTypes,
  onToggleActive,
  onDelete,
  onSave,
}: {
  eventTypes: EventTypeMaster[]
  onToggleActive: (id: string) => void
  onDelete: (id: string) => void
  onSave: (items: EventTypeMaster[]) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const newItem: EventTypeMaster = {
      id: 'et-' + Date.now(),
      name: name.trim(),
      code: name.trim().toLowerCase().replace(/\s+/g, '_'),
      description: description.trim(),
      is_active: true,
    }
    onSave([...eventTypes, newItem])
    setName('')
    setDescription('')
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Event Types Master</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Configure shoot event categories available in Work Orders</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap gap-3 p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]">
        <input
          type="text"
          placeholder="Event Type Name (e.g. Haldi, Sangeet)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 px-3 text-xs rounded-md bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] flex-1 min-w-[200px]"
          required
        />
        <input
          type="text"
          placeholder="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-9 px-3 text-xs rounded-md bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] flex-1 min-w-[240px]"
        />
        <button type="submit" className="h-9 px-4 text-xs font-medium rounded-md bg-[var(--color-primary)] text-white flex items-center gap-1.5 hover:bg-[var(--color-primary-dark)]">
          <Plus size={14} /> Add Event Type
        </button>
      </form>

      <div className="overflow-x-auto border border-[var(--color-border-default)] rounded-lg">
        <table className="w-full text-left text-xs text-[var(--color-text-primary)]">
          <thead className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-default)] text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3">Event Type</th>
              <th className="p-3">Code</th>
              <th className="p-3">Description</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {eventTypes.map((et) => (
              <tr key={et.id} className="hover:bg-[var(--color-bg-elevated)]/40">
                <td className="p-3 font-medium">{et.name}</td>
                <td className="p-3 text-[var(--color-text-muted)] font-mono">{et.code}</td>
                <td className="p-3 text-[var(--color-text-muted)]">{et.description || '-'}</td>
                <td className="p-3">
                  <button
                    onClick={() => onToggleActive(et.id)}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                      et.is_active ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
                    )}
                  >
                    {et.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => onDelete(et.id)} className="p-1 text-[var(--color-text-muted)] hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── 2. Services Master Tab ───────────────────────────────────────────────────

function ServicesTab({
  services,
  departments,
  onToggleActive,
  onDelete,
  onSave,
}: {
  services: ServiceMaster[]
  departments: DepartmentMaster[]
  onToggleActive: (id: string) => void
  onDelete: (id: string) => void
  onSave: (items: ServiceMaster[]) => void
}) {
  const [name, setName] = useState('')
  const [deptId, setDeptId] = useState(() => departments[0]?.id || '')
  const [rate, setRate] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const dept = departments.find(d => d.id === deptId)
    const newItem: ServiceMaster = {
      id: 'srv-' + Date.now(),
      name: name.trim(),
      department_id: deptId,
      department_name: dept?.name || '',
      default_rate: parseFloat(rate) || 0,
      is_active: true,
    }
    onSave([...services, newItem])
    setName('')
    setRate('')
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Services Master</h3>
        <p className="text-xs text-[var(--color-text-muted)]">Configure shoot services that can be added under each Event in Work Orders</p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap gap-3 p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]">
        <input
          type="text"
          placeholder="Service Name (e.g. Candid Photography)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 px-3 text-xs rounded-md bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] flex-1 min-w-[200px]"
          required
        />
        <select
          value={deptId}
          onChange={(e) => setDeptId(e.target.value)}
          className="h-9 px-3 text-xs rounded-md bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)]"
        >
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Default Rate (₹)"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="h-9 px-3 text-xs rounded-md bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] w-36"
        />
        <button type="submit" className="h-9 px-4 text-xs font-medium rounded-md bg-[var(--color-primary)] text-white flex items-center gap-1.5 hover:bg-[var(--color-primary-dark)]">
          <Plus size={14} /> Add Service
        </button>
      </form>

      <div className="overflow-x-auto border border-[var(--color-border-default)] rounded-lg">
        <table className="w-full text-left text-xs text-[var(--color-text-primary)]">
          <thead className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-default)] text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3">Service Name</th>
              <th className="p-3">Department</th>
              <th className="p-3">Default Rate</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-[var(--color-bg-elevated)]/40">
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3 text-[var(--color-text-muted)]">{s.department_name || '-'}</td>
                <td className="p-3 font-mono">₹{(s.default_rate || 0).toLocaleString('en-IN')}</td>
                <td className="p-3">
                  <button
                    onClick={() => onToggleActive(s.id)}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                      s.is_active ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
                    )}
                  >
                    {s.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => onDelete(s.id)} className="p-1 text-[var(--color-text-muted)] hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── 3. Deliverables Master Tab ───────────────────────────────────────────────

function DeliverablesTab({
  deliverables,
  onToggleActive,
  onDelete,
  onSave,
}: {
  deliverables: DeliverableMaster[]
  onToggleActive: (id: string) => void
  onDelete: (id: string) => void
  onSave: (items: DeliverableMaster[]) => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Photography')
  const [description, setDescription] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const newItem: DeliverableMaster = {
      id: 'del-' + Date.now(),
      name: name.trim(),
      category,
      description: description.trim(),
      is_active: true,
    }
    onSave([...deliverables, newItem])
    setName('')
    setDescription('')
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Deliverables Master</h3>
        <p className="text-xs text-[var(--color-text-muted)]">Configure physical/digital deliverables loaded dynamically into Work Orders</p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap gap-3 p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]">
        <input
          type="text"
          placeholder="Deliverable Name (e.g. Highlight Film, Luxury Album)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 px-3 text-xs rounded-md bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] flex-1 min-w-[200px]"
          required
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 px-3 text-xs rounded-md bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)]"
        >
          <option value="Photography">Photography</option>
          <option value="Videography">Videography</option>
          <option value="Albums">Albums</option>
          <option value="Prints">Prints</option>
          <option value="Social Media">Social Media</option>
          <option value="Physical Media">Physical Media</option>
        </select>
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-9 px-3 text-xs rounded-md bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] flex-1 min-w-[200px]"
        />
        <button type="submit" className="h-9 px-4 text-xs font-medium rounded-md bg-[var(--color-primary)] text-white flex items-center gap-1.5 hover:bg-[var(--color-primary-dark)]">
          <Plus size={14} /> Add Deliverable
        </button>
      </form>

      <div className="overflow-x-auto border border-[var(--color-border-default)] rounded-lg">
        <table className="w-full text-left text-xs text-[var(--color-text-primary)]">
          <thead className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-default)] text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3">Deliverable Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Description</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {deliverables.map((d) => (
              <tr key={d.id} className="hover:bg-[var(--color-bg-elevated)]/40">
                <td className="p-3 font-medium">{d.name}</td>
                <td className="p-3 text-[var(--color-text-muted)]">{d.category || '-'}</td>
                <td className="p-3 text-[var(--color-text-muted)]">{d.description || '-'}</td>
                <td className="p-3">
                  <button
                    onClick={() => onToggleActive(d.id)}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                      d.is_active ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
                    )}
                  >
                    {d.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => onDelete(d.id)} className="p-1 text-[var(--color-text-muted)] hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── 4. Payment Modes Tab ─────────────────────────────────────────────────────

function PaymentModesTab({
  paymentModes,
  onToggleActive,
  onDelete,
  onSave,
}: {
  paymentModes: PaymentModeMaster[]
  onToggleActive: (id: string) => void
  onDelete: (id: string) => void
  onSave: (items: PaymentModeMaster[]) => void
}) {
  const [name, setName] = useState('')
  const [requiresRef, setRequiresRef] = useState(true)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const newItem: PaymentModeMaster = {
      id: 'pm-' + Date.now(),
      name: name.trim(),
      code: name.trim().toLowerCase().replace(/\s+/g, '_'),
      requires_reference: requiresRef,
      is_active: true,
    }
    onSave([...paymentModes, newItem])
    setName('')
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Payment Modes Master</h3>
        <p className="text-xs text-[var(--color-text-muted)]">Configure payment methods available in the Payment Ledger</p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]">
        <input
          type="text"
          placeholder="Payment Mode Name (e.g. UPI, Cash, Card)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 px-3 text-xs rounded-md bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] flex-1 min-w-[200px]"
          required
        />
        <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] cursor-pointer">
          <input
            type="checkbox"
            checked={requiresRef}
            onChange={(e) => setRequiresRef(e.target.checked)}
            className="rounded border-[var(--color-border-default)]"
          />
          Requires Reference / UTR Number
        </label>
        <button type="submit" className="h-9 px-4 text-xs font-medium rounded-md bg-[var(--color-primary)] text-white flex items-center gap-1.5 hover:bg-[var(--color-primary-dark)]">
          <Plus size={14} /> Add Mode
        </button>
      </form>

      <div className="overflow-x-auto border border-[var(--color-border-default)] rounded-lg">
        <table className="w-full text-left text-xs text-[var(--color-text-primary)]">
          <thead className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-default)] text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3">Payment Mode</th>
              <th className="p-3">Code</th>
              <th className="p-3">Reference Required</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {paymentModes.map((pm) => (
              <tr key={pm.id} className="hover:bg-[var(--color-bg-elevated)]/40">
                <td className="p-3 font-medium">{pm.name}</td>
                <td className="p-3 text-[var(--color-text-muted)] font-mono">{pm.code}</td>
                <td className="p-3 text-[var(--color-text-muted)]">{pm.requires_reference ? 'Yes' : 'No'}</td>
                <td className="p-3">
                  <button
                    onClick={() => onToggleActive(pm.id)}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                      pm.is_active ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
                    )}
                  >
                    {pm.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => onDelete(pm.id)} className="p-1 text-[var(--color-text-muted)] hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── 5. Contract Templates Tab ────────────────────────────────────────────────

function ContractTemplatesTab({
  templates,
  onToggleActive,
  onDelete,
  onSave,
}: {
  templates: ContractTemplateMaster[]
  onToggleActive: (id: string) => void
  onDelete: (id: string) => void
  onSave: (items: ContractTemplateMaster[]) => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleCreate = () => {
    if (!title.trim()) return
    const newItem: ContractTemplateMaster = {
      id: 'ct-' + Date.now(),
      title: title.trim(),
      content: content || '<h2>Terms and Conditions</h2><p>Agreement details...</p>',
      is_active: true,
    }
    onSave([...templates, newItem])
    setTitle('')
    setContent('')
    toast.success('Contract template added!')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Contract Templates Master</h3>
        <p className="text-xs text-[var(--color-text-muted)]">Configure reusable legal contract agreements for Work Orders</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Form */}
        <div className="space-y-4 p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Create Contract Template</h4>
          <input
            type="text"
            placeholder="Contract Template Title (e.g. Standard Wedding Agreement)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-9 px-3 text-xs rounded-md bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)]"
          />
          <div className="space-y-1">
            <label className="text-xs text-[var(--color-text-muted)]">Template Terms & Conditions (Rich Text)</label>
            <RichTextEditor value={content} onChange={setContent} minHeight="240px" />
          </div>
          <button onClick={handleCreate} className="px-4 py-2 text-xs font-medium rounded-md bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]">
            Save Contract Template
          </button>
        </div>

        {/* Existing Templates */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Existing Templates ({templates.length})</h4>
          {templates.map((tpl) => (
            <div key={tpl.id} className="p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold text-sm text-[var(--color-text-primary)]">{tpl.title}</h5>
                <div className="flex items-center gap-2">
                  <button onClick={() => onToggleActive(tpl.id)} className={cn('px-2 py-0.5 rounded-full text-[10px] border', tpl.is_active ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400')}>
                    {tpl.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => onDelete(tpl.id)} className="text-[var(--color-text-muted)] hover:text-red-400 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div
                className="text-xs text-[var(--color-text-muted)] max-h-28 overflow-y-auto p-2 bg-[var(--color-bg-surface)] rounded border border-[var(--color-border-subtle)] prose prose-invert"
                dangerouslySetInnerHTML={{ __html: tpl.content }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 6. Departments & Roles Tab ───────────────────────────────────────────────

function DepartmentsTab({
  departments,
  employeeRoles,
  onDeleteDepartment,
  onSaveDepartments,
  onSaveRoles,
}: {
  departments: DepartmentMaster[]
  employeeRoles: EmployeeRoleMaster[]
  onDeleteDepartment: (id: string) => void
  onSaveDepartments: (items: DepartmentMaster[]) => void
  onSaveRoles: (items: EmployeeRoleMaster[]) => void
}) {
  const [deptName, setDeptName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [roleDeptId, setRoleDeptId] = useState(() => departments[0]?.id || '')

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault()
    if (!deptName.trim()) return
    const newItem: DepartmentMaster = {
      id: 'dept-' + Date.now(),
      name: deptName.trim(),
      code: deptName.trim().toUpperCase().slice(0, 4),
      is_active: true,
    }
    onSaveDepartments([...departments, newItem])
    setDeptName('')
  }

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleTitle.trim()) return
    const dept = departments.find((d) => d.id === roleDeptId)
    const newRole: EmployeeRoleMaster = {
      id: 'role-' + Date.now(),
      title: roleTitle.trim(),
      department_id: roleDeptId,
      department_name: dept?.name || '',
      is_active: true,
    }
    onSaveRoles([...employeeRoles, newRole])
    setRoleTitle('')
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Departments */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Departments</h3>
          <form onSubmit={handleAddDept} className="flex gap-2">
            <input
              type="text"
              placeholder="Department Name"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className="h-9 px-3 text-xs rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] flex-1"
            />
            <button type="submit" className="h-9 px-3 text-xs font-medium rounded-md bg-[var(--color-primary)] text-white">Add</button>
          </form>
          <div className="divide-y divide-[var(--color-border-subtle)] border border-[var(--color-border-default)] rounded-lg">
            {departments.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 text-xs">
                <div>
                  <span className="font-medium text-[var(--color-text-primary)]">{d.name}</span>
                  <span className="ml-2 font-mono text-[var(--color-text-muted)]">({d.code})</span>
                </div>
                <button onClick={() => onDeleteDepartment(d.id)} className="text-[var(--color-text-muted)] hover:text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Employee Roles</h3>
          <form onSubmit={handleAddRole} className="flex gap-2">
            <input
              type="text"
              placeholder="Role Title (e.g. Lead Photographer)"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              className="h-9 px-3 text-xs rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] flex-1"
            />
            <select
              value={roleDeptId}
              onChange={(e) => setRoleDeptId(e.target.value)}
              className="h-9 px-2 text-xs rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] text-[var(--color-text-primary)]"
            >
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <button type="submit" className="h-9 px-3 text-xs font-medium rounded-md bg-[var(--color-primary)] text-white">Add</button>
          </form>
          <div className="divide-y divide-[var(--color-border-subtle)] border border-[var(--color-border-default)] rounded-lg max-h-72 overflow-y-auto">
            {employeeRoles.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 text-xs">
                <div>
                  <span className="font-medium text-[var(--color-text-primary)]">{r.title}</span>
                  <span className="ml-2 text-[var(--color-text-muted)]">• {r.department_name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 7. Staff & Service Eligibility Tab ───────────────────────────────────────

function StaffTab({
  services,
  roles,
}: {
  services: ServiceMaster[]
  roles: EmployeeRoleMaster[]
}) {
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [roleId, setRoleId] = useState(() => roles[0]?.id || '')
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [employeesState, setEmployeesState] = useState<EmployeeProfile[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)

  const mapAccountToEmployeeProfile = (a: any): EmployeeProfile => ({
    id: a.id,
    full_name: a.employee_name || a.full_name || '',
    mobile: a.mobile || a.mobile_number || '',
    role_id: a.role_id || a.workspace_role || '',
    role_title: a.role_name || a.role_name || '',
    department_id: a.department || '',
    department_name: a.department || '',
    eligible_service_ids: [],
    is_active: a.account_status === 'active' || a.is_active !== false,
  })

  useEffect(() => {
    let mounted = true
    setIsLoadingEmployees(true)
    fetchAllEmployeesFromCloud()
      .then((accs) => {
        if (!mounted) return
        const mapped = accs.map(mapAccountToEmployeeProfile)
        setEmployeesState(mapped)
      })
      .catch((e) => {
        console.error('Failed to load employees for Settings staff tab:', e)
        toast.error('Failed to load employees. See console for details.')
      })
      .finally(() => { if (mounted) setIsLoadingEmployees(false) })
    return () => { mounted = false }
  }, [])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const role = roles.find((r) => r.id === roleId)
    const newEmp: EmployeeProfile = {
      id: 'emp-' + Date.now(),
      full_name: name.trim(),
      mobile: mobile.trim() || '+91 98765 00000',
      role_id: roleId,
      role_title: role?.title || '',
      department_id: role?.department_id || '',
      department_name: role?.department_name || '',
      eligible_service_ids: selectedServiceIds,
      is_active: true,
    }
    // Create via EmployeeService (canonical source)
    createEmployeeInCloud({
      employee_name: newEmp.full_name,
      mobile: newEmp.mobile,
      role_id: newEmp.role_id as any,
      role_name: newEmp.role_title,
      employment_type: 'in_house',
      tenant_id: 'studio_main',
    } as any).then((created) => {
      if (created) {
        // refresh list
        fetchAllEmployeesFromCloud().then((accs) => {
          const mapped = accs.map(mapAccountToEmployeeProfile)
          setEmployeesState(mapped)
        })
      }
    }).catch((e) => {
      console.error('Failed to create employee:', e)
      toast.error('Failed to create employee. See console for details.')
    })
    setName('')
    setMobile('')
    setSelectedServiceIds([])
    toast.success('Staff member registered!')
  }

  const toggleService = (srvId: string) => {
    if (selectedServiceIds.includes(srvId)) {
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== srvId))
    } else {
      setSelectedServiceIds([...selectedServiceIds, srvId])
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Staff & Service Eligibility</h3>
        <p className="text-xs text-[var(--color-text-muted)]">Register team members and assign service eligibility for the "Assign Team" popup in Work Orders</p>
      </div>

      {/* Form */}
      <form onSubmit={handleAdd} className="space-y-3 p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Add Team Member</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 px-3 text-xs rounded-md bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)]"
            required
          />
          <input
            type="text"
            placeholder="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="h-9 px-3 text-xs rounded-md bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)]"
          />
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="h-9 px-3 text-xs rounded-md bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)]"
          >
            {roles.map((r) => <option key={r.id} value={r.id}>{r.title} ({r.department_name})</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[var(--color-text-muted)] font-medium">Eligible Services (for Assign Team popup filter)</label>
          <div className="flex flex-wrap gap-2">
            {services.map((srv) => {
              const selected = selectedServiceIds.includes(srv.id)
              return (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => toggleService(srv.id)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-md border transition-colors',
                    selected
                      ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)] font-medium'
                      : 'bg-[var(--color-bg-surface)] border-[var(--color-border-default)] text-[var(--color-text-secondary)]'
                  )}
                >
                  {srv.name}
                </button>
              )
            })}
          </div>
        </div>

        <button type="submit" className="h-9 px-4 text-xs font-medium rounded-md bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]">
          Register Staff Member
        </button>
      </form>

      {/* Staff Table */}
      <div className="overflow-x-auto border border-[var(--color-border-default)] rounded-lg">
        <table className="w-full text-left text-xs text-[var(--color-text-primary)]">
          <thead className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-default)] text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3">Staff Name</th>
              <th className="p-3">Role</th>
              <th className="p-3">Mobile</th>
              <th className="p-3">Eligible Services</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {(isLoadingEmployees ? [] : employeesState).map((emp) => (
              <tr key={emp.id} className="hover:bg-[var(--color-bg-elevated)]/40">
                <td className="p-3 font-medium">{emp.full_name}</td>
                <td className="p-3 text-[var(--color-text-muted)]">{emp.role_title || '-'}</td>
                <td className="p-3 text-[var(--color-text-muted)]">{emp.mobile}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {emp.eligible_service_ids.length === 0 ? (
                      <span className="text-[var(--color-text-muted)]">All services</span>
                    ) : (
                      emp.eligible_service_ids.map((sId) => {
                        const srv = services.find((s) => s.id === sId)
                        return srv ? (
                          <span key={sId} className="px-1.5 py-0.5 rounded bg-[var(--color-bg-elevated)] text-[10px] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                            {srv.name}
                          </span>
                        ) : null
                      })
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => {
                      // Toggle via EmployeeService
                      const newStatus = !emp.is_active
                      updateEmployeeInCloud(emp.id, { account_status: newStatus ? 'active' : 'inactive' } as any)
                        .then(() =>
                          fetchAllEmployeesFromCloud()
                            .then((accs) =>
                              setEmployeesState(
                                accs.map(mapAccountToEmployeeProfile)
                              )
                            )
                        )
                        .catch((e) => {
                          console.error('Failed to toggle active:', e)
                          toast.error('Failed to update user status')
                        })
                    }}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                      emp.is_active ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
                    )}
                  >
                    {emp.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => {
                      deleteEmployeeFromCloud(emp.id)
                        .then(() =>
                          fetchAllEmployeesFromCloud()
                            .then((accs) =>
                              setEmployeesState(
                                accs.map(mapAccountToEmployeeProfile)
                              )
                            )
                        )
                        .catch((e) => {
                          console.error('Failed to delete employee:', e)
                          toast.error('Failed to delete employee')
                        })
                    }}
                    className="p-1 text-[var(--color-text-muted)] hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
