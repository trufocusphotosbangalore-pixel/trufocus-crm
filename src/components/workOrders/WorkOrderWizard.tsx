import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  X, Check, ClipboardList, Calendar, Package,
  CreditCard, FileText, Clock, Eye,
  Plus, Trash2, ChevronDown, Users, Search,
  MapPin, ExternalLink, Save, ArrowRight, ArrowLeft,
  Building2, UserCheck, Sparkles, Phone, Mail,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { ENQUIRY_SOURCE_LABELS } from '@/types/enquiries'
import {
  DEFAULT_WIZARD_DATA,
  type WorkOrderWizardData, type WizardEventForm, type WizardServiceForm,
  type WizardTeamAssignment, type WizardDeliverableItem,
} from '@/types/workOrders'
import { getLocalWorkOrders } from '@/services/supabase/workOrders'
import { fetchEnquiriesLocal } from '@/services/supabase/enquiries'
import { loadSettingsFromStorage } from '@/services/settingsStore'
import { AssignTeamModal } from './AssignTeamModal'
import { RecordPaymentModal } from './RecordPaymentModal'
import { RichTextEditor } from '@/components/common/RichTextEditor'
import { toast } from 'react-hot-toast'

// ─── 7-Step Workflow Config ───────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: '01 Overview', labelFull: 'Overview', sub: 'Project Basics', icon: ClipboardList },
  { id: 2, label: '02 Events & Services', labelFull: 'Events & Services', sub: 'Schedule & Services', icon: Calendar },
  { id: 3, label: '03 Deliverables', labelFull: 'Deliverables', sub: 'Outputs & Products', icon: Package },
  { id: 4, label: '04 Payments', labelFull: 'Payments', sub: 'Payment Details', icon: CreditCard },
  { id: 5, label: '05 Contract', labelFull: 'Contract', sub: 'Terms & Conditions', icon: FileText },
  { id: 6, label: '06 Calendar', labelFull: 'Calendar', sub: 'Team & Dates', icon: Clock },
  { id: 7, label: '07 Review & Create', labelFull: 'Review & Create', sub: 'Review & Confirm', icon: Eye },
]

// ─── Customer Interface for Search Autocomplete ───────────────────────────────

interface ExistingCustomerRecord {
  id: string
  name: string
  mobile: string
  whatsapp_number: string
  alternate_mobile: string
  email: string
  source?: string
}

// ─── Shared UI Helpers ────────────────────────────────────────────────────────

function Field({ label, required, children, hint, className }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string; className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-xs font-extrabold text-gray-700 block">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 font-medium">{hint}</p>}
    </div>
  )
}

const inputCls = cn(
  'w-full h-10 px-3.5 text-xs rounded-xl bg-gray-50/80',
  'text-gray-900 border border-gray-200 font-medium',
  'placeholder:text-gray-400 placeholder:font-normal',
  'focus:outline-none focus:border-[#5B3FD9] focus:bg-white focus:ring-2 focus:ring-[#5B3FD9]/15',
  'transition-all'
)

const selectCls = cn(inputCls, 'appearance-none cursor-pointer pr-8 font-semibold')

function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />
}

function FormSelect({
  value, onChange, children, className, ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange} className={cn(selectCls, className)} {...rest}>
        {children}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )
}

function FormTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={props.rows ?? 3}
      className={cn(
        'w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50/80',
        'text-gray-900 border border-gray-200 font-medium',
        'placeholder:text-gray-400 resize-none',
        'focus:outline-none focus:border-[#5B3FD9] focus:bg-white focus:ring-2 focus:ring-[#5B3FD9]/15',
        'transition-all',
        props.className
      )}
    />
  )
}

// ─── Step 1: Redesigned Overview Page ─────────────────────────────────────────

function StepOverview({
  data,
  set,
  setFormData,
}: {
  data: WorkOrderWizardData
  set: (k: keyof WorkOrderWizardData, v: unknown) => void
  setFormData: React.Dispatch<React.SetStateAction<WorkOrderWizardData>>
}) {
  const settings = loadSettingsFromStorage()
  const activeEventTypes = settings.eventTypes.filter(e => e.is_active)

  // 1. Existing Customers Autocomplete state
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)

  // Aggregate unique customers from Work Orders & Enquiries
  const existingCustomers = useMemo(() => {
    const map = new Map<string, ExistingCustomerRecord>()

    // From Work Orders
    const wos = getLocalWorkOrders()
    wos.forEach((wo) => {
      if (wo.customer_name && wo.mobile) {
        const key = wo.mobile.trim().replace(/\D/g, '') || wo.customer_name.toLowerCase().trim()
        if (!map.has(key)) {
          map.set(key, {
            id: wo.id,
            name: wo.customer_name,
            mobile: wo.mobile || '',
            whatsapp_number: wo.whatsapp_number || '',
            alternate_mobile: wo.alternate_mobile || '',
            email: wo.email || '',
            source: wo.source || undefined,
          })
        }
      }
    })

    // From Enquiries
    const enqs = fetchEnquiriesLocal()
    enqs.forEach((enq) => {
      if (enq.customer_name && enq.mobile) {
        const key = enq.mobile.trim().replace(/\D/g, '') || enq.customer_name.toLowerCase().trim()
        if (!map.has(key)) {
          map.set(key, {
            id: enq.id,
            name: enq.customer_name,
            mobile: enq.mobile || '',
            whatsapp_number: enq.mobile || '',
            alternate_mobile: enq.alternate_mobile || '',
            email: enq.email || '',
            source: enq.source || undefined,
          })
        }
      }
    })

    return Array.from(map.values())
  }, [])

  const filteredCustomerResults = useMemo(() => {
    if (!customerSearchQuery.trim()) return []
    const q = customerSearchQuery.toLowerCase().trim()
    return existingCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    ).slice(0, 6)
  }, [customerSearchQuery, existingCustomers])

  const handleSelectCustomer = (cust: ExistingCustomerRecord) => {
    setFormData((prev) => ({
      ...prev,
      customer_name: cust.name,
      mobile: cust.mobile,
      whatsapp_number: cust.whatsapp_number || cust.mobile,
      alternate_mobile: cust.alternate_mobile || '',
      email: cust.email || '',
    }))
    setCustomerSearchQuery(`${cust.name} (${cust.mobile})`)
    setIsCustomerDropdownOpen(false)
    toast.success(`Selected customer: ${cust.name}`)
  }

  // 2. Shoot Schedule Handlers (bi-directional sync with data.events)
  const addScheduleRow = () => {
    const defaultType = activeEventTypes[0]
    const newEv: WizardEventForm = {
      id: 'ev-' + Date.now(),
      event_type_id: defaultType?.id || '',
      event_type_name: defaultType?.name || data.event_type || 'Wedding',
      event_date: data.booking_date || new Date().toISOString().split('T')[0],
      event_time: '10:00 AM — 08:00 PM',
      venue: data.venue || '',
      google_map_link: data.google_map_link || '',
      notes: '',
      services: [],
    }
    set('events', [...data.events, newEv])
  }

  const removeScheduleRow = (index: number) => {
    const updated = data.events.filter((_, idx) => idx !== index)
    set('events', updated)
  }

  const updateScheduleRow = (index: number, field: keyof WizardEventForm, val: any) => {
    const updated = data.events.map((ev, idx) => {
      if (idx !== index) return ev
      if (field === 'event_type_id') {
        const sel = activeEventTypes.find((t) => t.id === val)
        return { ...ev, event_type_id: val, event_type_name: sel?.name || ev.event_type_name }
      }
      return { ...ev, [field]: val }
    })
    set('events', updated)
  }

  // Auto-initialize first shoot schedule event if empty
  useEffect(() => {
    if (data.events.length === 0 && activeEventTypes.length > 0) {
      const defaultType = activeEventTypes[0]
      const initialEv: WizardEventForm = {
        id: 'ev-' + Date.now(),
        event_type_id: defaultType?.id || '',
        event_type_name: defaultType?.name || 'Wedding',
        event_date: new Date().toISOString().split('T')[0],
        event_time: '10:00 AM — 08:00 PM',
        venue: data.venue || '',
        google_map_link: data.google_map_link || '',
        notes: '',
        services: [],
      }
      set('events', [initialEv])
    }
  }, [data.events.length, activeEventTypes, set, data.venue, data.google_map_link])

  return (
    <div className="space-y-6 font-sans">
      {/* ─── CUSTOMER INFORMATION CARD ─── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <span className="p-2 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
            <Users size={18} />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-[#111827]">Customer Information</h3>
            <p className="text-[11px] text-gray-500 font-medium">Search existing client directory or enter new customer details</p>
          </div>
        </div>

        {/* Existing Customer Autocomplete */}
        <div className="relative">
          <label className="text-xs font-extrabold text-gray-700 mb-1.5 block">Existing Customer Search</label>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search customer by name, mobile or email..."
              value={customerSearchQuery}
              onChange={(e) => {
                setCustomerSearchQuery(e.target.value)
                setIsCustomerDropdownOpen(true)
              }}
              onFocus={() => setIsCustomerDropdownOpen(true)}
              className={cn(inputCls, 'pl-10')}
            />
          </div>

          {/* Autocomplete Dropdown */}
          {isCustomerDropdownOpen && filteredCustomerResults.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100">
              {filteredCustomerResults.map((cust) => (
                <button
                  key={cust.id}
                  type="button"
                  onClick={() => handleSelectCustomer(cust)}
                  className="w-full p-3 text-left hover:bg-purple-50/60 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <span className="font-extrabold text-xs text-[#111827] group-hover:text-[#5B3FD9] block">{cust.name}</span>
                    <span className="text-[11px] text-gray-500 font-medium">{cust.mobile} {cust.email && `• ${cust.email}`}</span>
                  </div>
                  <UserCheck size={16} className="text-[#5B3FD9] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Customer Name" required>
            <FormInput
              placeholder="Full name of customer"
              value={data.customer_name}
              onChange={(e) => set('customer_name', e.target.value)}
            />
          </Field>

          <Field label="Mobile Number" required>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs font-bold text-gray-500 flex items-center gap-1 border-r border-gray-200 pr-2">
                🇮🇳 +91
              </span>
              <FormInput
                placeholder="98765 43210"
                value={data.mobile}
                onChange={(e) => set('mobile', e.target.value)}
                className="pl-20 font-mono text-xs"
              />
            </div>
          </Field>

          <Field label="WhatsApp Number">
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs font-bold text-emerald-600 flex items-center gap-1 border-r border-gray-200 pr-2">
                💬 +91
              </span>
              <FormInput
                placeholder="Secondary WhatsApp contact"
                value={data.whatsapp_number}
                onChange={(e) => set('whatsapp_number', e.target.value)}
                className="pl-20 font-mono text-xs"
              />
            </div>
          </Field>

          <Field label="Alternate Mobile">
            <div className="relative flex items-center">
              <Phone size={14} className="absolute left-3 text-gray-400" />
              <FormInput
                placeholder="Secondary contact number"
                value={data.alternate_mobile}
                onChange={(e) => set('alternate_mobile', e.target.value)}
                className="pl-9 font-mono text-xs"
              />
            </div>
          </Field>

          <Field label="Email Address" className="sm:col-span-2">
            <div className="relative flex items-center">
              <Mail size={14} className="absolute left-3 text-gray-400" />
              <FormInput
                type="email"
                placeholder="customer@email.com"
                value={data.email}
                onChange={(e) => set('email', e.target.value)}
                className="pl-9"
              />
            </div>
          </Field>
        </div>
      </div>

      {/* ─── PROJECT DETAILS CARD ─── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <span className="p-2 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
            <Building2 size={18} />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-[#111827]">Project Details</h3>
            <p className="text-[11px] text-gray-500 font-medium">Define project title, event category, booking date, and lead source</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Project Name" required className="sm:col-span-2">
            <FormInput
              placeholder="e.g. Anush & Sagar Wedding"
              value={data.project_name}
              onChange={(e) => set('project_name', e.target.value)}
            />
          </Field>

          <Field label="Primary Event Type" required>
            <FormSelect
              value={data.event_type}
              onChange={(e) => set('event_type', e.target.value)}
            >
              <option value="">Select primary event type</option>
              {activeEventTypes.map((et) => (
                <option key={et.id} value={et.name}>
                  {et.name}
                </option>
              ))}
            </FormSelect>
          </Field>

          <Field label="Booking Date" required>
            <FormInput
              type="date"
              value={data.booking_date}
              onChange={(e) => set('booking_date', e.target.value)}
            />
          </Field>

          <Field label="Source">
            <FormSelect
              value={data.source}
              onChange={(e) => set('source', e.target.value)}
            >
              <option value="">Select source</option>
              {Object.entries(ENQUIRY_SOURCE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </FormSelect>
          </Field>

          <Field label="City" required>
            <FormInput
              placeholder="Bengaluru"
              value={data.city}
              onChange={(e) => set('city', e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* ─── EVENT LOCATION CARD ─── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <span className="p-2 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
            <MapPin size={18} />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-[#111827]">Event Location</h3>
            <p className="text-[11px] text-gray-500 font-medium">Primary shoot venue name, address, and Google Maps location URL</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Venue Name" required>
            <FormInput
              placeholder="Venue name (e.g. White Petals)"
              value={data.venue}
              onChange={(e) => set('venue', e.target.value)}
            />
          </Field>

          <Field label="Full Venue Address" required>
            <FormInput
              placeholder="Full address of the venue"
              value={data.venue}
              onChange={(e) => set('venue', e.target.value)}
            />
          </Field>

          <Field label="Google Maps Link" className="sm:col-span-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <FormInput
                  placeholder="https://maps.google.com/..."
                  value={data.google_map_link}
                  onChange={(e) => set('google_map_link', e.target.value)}
                />
              </div>
              {data.google_map_link ? (
                <a
                  href={data.google_map_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 h-10 rounded-xl bg-purple-50 border border-purple-200 text-[#5B3FD9] text-xs font-extrabold flex items-center gap-1.5 hover:bg-purple-100 transition-colors shrink-0"
                >
                  <ExternalLink size={14} /> Open in Google Maps
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="px-4 h-10 rounded-xl bg-gray-100 border border-gray-200 text-gray-400 text-xs font-bold flex items-center gap-1.5 shrink-0 opacity-60 cursor-not-allowed"
                >
                  <ExternalLink size={14} /> Open in Google Maps
                </button>
              )}
            </div>
          </Field>
        </div>
      </div>

      {/* ─── SHOOT SCHEDULE CARD (CRITICAL REQUIREMENT) ─── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <Calendar size={18} />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-[#111827]">Shoot Schedule</h3>
              <p className="text-[11px] text-gray-500 font-medium">Add all event dates and timings for this project</p>
            </div>
          </div>

          <button
            type="button"
            onClick={addScheduleRow}
            className="px-3.5 py-2 text-xs font-extrabold rounded-xl bg-purple-50 border border-purple-200 text-[#5B3FD9] hover:bg-[#5B3FD9] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus size={14} /> Add Another Event
          </button>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-extrabold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 w-[160px]">Date *</th>
                <th className="p-3 w-[180px]">Event Type *</th>
                <th className="p-3 w-[140px]">Start Time</th>
                <th className="p-3 w-[140px]">End Time</th>
                <th className="p-3">Venue</th>
                <th className="p-3 w-[60px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {data.events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400 italic text-xs">
                    No shoot events scheduled yet. Click "+ Add Another Event" above to schedule dates.
                  </td>
                </tr>
              ) : (
                data.events.map((ev, idx) => (
                  <tr key={ev.id || idx} className="hover:bg-gray-50/60">
                    <td className="p-2.5">
                      <FormInput
                        type="date"
                        value={ev.event_date}
                        onChange={(e) => updateScheduleRow(idx, 'event_date', e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </td>
                    <td className="p-2.5">
                      <FormSelect
                        value={ev.event_type_id}
                        onChange={(e) => updateScheduleRow(idx, 'event_type_id', e.target.value)}
                        className="h-8 text-xs"
                      >
                        {activeEventTypes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </FormSelect>
                    </td>
                    <td className="p-2.5">
                      <FormInput
                        type="text"
                        placeholder="10:00 AM"
                        value={ev.event_time ? ev.event_time.split('—')[0]?.trim() || '' : '10:00 AM'}
                        onChange={(e) => updateScheduleRow(idx, 'event_time', `${e.target.value} — ${ev.event_time.split('—')[1] || '08:00 PM'}`)}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="p-2.5">
                      <FormInput
                        type="text"
                        placeholder="08:00 PM"
                        value={ev.event_time ? ev.event_time.split('—')[1]?.trim() || '' : '08:00 PM'}
                        onChange={(e) => updateScheduleRow(idx, 'event_time', `${ev.event_time.split('—')[0] || '10:00 AM'} — ${e.target.value}`)}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="p-2.5">
                      <FormInput
                        placeholder="Venue location"
                        value={ev.venue || data.venue}
                        onChange={(e) => updateScheduleRow(idx, 'venue', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeScheduleRow(idx)}
                        disabled={data.events.length <= 1}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── NOTES (OPTIONAL) CARD ─── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-3">
        <label className="text-xs font-extrabold text-[#111827] block">Notes (Optional)</label>
        <FormTextarea
          placeholder="Internal notes about this work order..."
          value={data.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  )
}

// ─── Step 2: Events & Services ────────────────────────────────────────────────

function StepEventsAndServices({ data, set }: { data: WorkOrderWizardData; set: (k: keyof WorkOrderWizardData, v: unknown) => void }) {
  const settings = loadSettingsFromStorage()
  const activeServices = settings.services.filter(s => s.is_active)

  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean; eventIndex: number; serviceIndex: number; serviceId: string; serviceName: string; quantity: number; assignedTeam: WizardTeamAssignment[]
  }>({
    isOpen: false, eventIndex: -1, serviceIndex: -1, serviceId: '', serviceName: '', quantity: 1, assignedTeam: []
  })

  const addServiceToEvent = (eventIndex: number) => {
    const defaultSrv = activeServices[0]
    const blankSrv: WizardServiceForm = {
      id: 'srv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      service_id: defaultSrv?.id || '',
      service_name: defaultSrv?.name || 'Traditional Photography',
      quantity: 1,
      start_time: '09:00',
      end_time: '18:00',
      remarks: '',
      assigned_team: [],
    }
    const updatedEvents = data.events.map((ev, idx) => {
      if (idx !== eventIndex) return ev
      return { ...ev, services: [...ev.services, blankSrv] }
    })
    set('events', updatedEvents)
  }

  const updateServiceInEvent = (eventIndex: number, serviceIndex: number, field: keyof WizardServiceForm, val: any) => {
    const updatedEvents = data.events.map((ev, eIdx) => {
      if (eIdx !== eventIndex) return ev
      const updatedServices = ev.services.map((srv, sIdx) => {
        if (sIdx !== serviceIndex) return srv
        if (field === 'service_id') {
          const selectedMaster = activeServices.find(s => s.id === val)
          return { ...srv, service_id: val, service_name: selectedMaster?.name || '' }
        }
        if (field === 'quantity') {
          const newQty = Math.max(1, parseInt(val) || 1)
          let currentTeam = [...(srv.assigned_team || []).map(t => ({ ...t }))]
          if (currentTeam.length > newQty) {
            currentTeam = currentTeam.slice(0, newQty)
          }
          return { ...srv, quantity: newQty, assigned_team: currentTeam }
        }
        if (field === 'assigned_team') {
          return { ...srv, assigned_team: Array.isArray(val) ? val.map((t: any) => ({ ...t })) : [] }
        }
        return { ...srv, [field]: val }
      })
      return { ...ev, services: updatedServices }
    })
    set('events', updatedEvents)
  }

  const removeServiceFromEvent = (eventIndex: number, serviceIndex: number) => {
    const updatedEvents = data.events.map((ev, eIdx) => {
      if (eIdx !== eventIndex) return ev
      return { ...ev, services: ev.services.filter((_, sIdx) => sIdx !== serviceIndex) }
    })
    set('events', updatedEvents)
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h3 className="text-sm font-extrabold text-[#111827]">Events & Services Configuration</h3>
        <p className="text-xs text-gray-500 font-medium">Configure services and team assignments for each scheduled event date.</p>
      </div>

      {data.events.map((ev, eIdx) => (
        <div key={ev.id || eIdx} className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="size-7 rounded-xl bg-[#5B3FD9] text-white font-extrabold text-xs flex items-center justify-center">
                {eIdx + 1}
              </span>
              <span className="font-extrabold text-sm text-[#111827]">
                {ev.event_type_name} ({ev.event_date || 'Date TBD'})
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                Services for {ev.event_type_name} ({ev.services.length})
              </h4>
              <button
                type="button"
                onClick={() => addServiceToEvent(eIdx)}
                className="px-3 py-1.5 text-xs font-extrabold rounded-xl bg-purple-50 text-[#5B3FD9] hover:bg-[#5B3FD9] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Add Service
              </button>
            </div>

            {ev.services.length === 0 ? (
              <p className="text-xs text-gray-400 italic p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                No services added for this event yet. Click "+ Add Service" above.
              </p>
            ) : (
              <div className="space-y-3">
                {ev.services.map((srv, sIdx) => (
                  <div key={srv.id || sIdx} className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                      <Field label="Service Name">
                        <FormSelect value={srv.service_id} onChange={e => updateServiceInEvent(eIdx, sIdx, 'service_id', e.target.value)}>
                          {activeServices.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </FormSelect>
                      </Field>
                      <Field label="Quantity">
                        <FormInput type="number" min="1" value={srv.quantity} onChange={e => updateServiceInEvent(eIdx, sIdx, 'quantity', parseInt(e.target.value) || 1)} />
                      </Field>
                      <Field label="Start Time">
                        <FormInput type="time" value={srv.start_time} onChange={e => updateServiceInEvent(eIdx, sIdx, 'start_time', e.target.value)} />
                      </Field>
                      <Field label="End Time">
                        <FormInput type="time" value={srv.end_time} onChange={e => updateServiceInEvent(eIdx, sIdx, 'end_time', e.target.value)} />
                      </Field>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200">
                      <div className="flex-1 min-w-[200px]">
                        <FormInput
                          placeholder="Special remarks for crew..."
                          value={srv.remarks}
                          onChange={e => updateServiceInEvent(eIdx, sIdx, 'remarks', e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAssignModal({
                            isOpen: true, eventIndex: eIdx, serviceIndex: sIdx, serviceId: srv.id, serviceName: srv.service_name, quantity: srv.quantity, assignedTeam: srv.assigned_team
                          })}
                          className="px-3 py-1.5 text-xs font-extrabold rounded-xl bg-white border border-[#5B3FD9] text-[#5B3FD9] hover:bg-[#5B3FD9] hover:text-white transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Users size={13} /> Assign Team {srv.assigned_team.length > 0 && `(${srv.assigned_team.length})`}
                        </button>

                        <button
                          type="button"
                          onClick={() => removeServiceFromEvent(eIdx, sIdx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {srv.assigned_team.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-gray-400 uppercase font-extrabold">Assigned:</span>
                        {srv.assigned_team.map((member) => (
                          <span key={member.employee_id} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#5B3FD9] text-xs font-extrabold">
                            {member.employee_name}
                            {member.role_title && <span className="text-[10px] opacity-75">({member.role_title})</span>}
                            {member.assigned_camera && (
                              <span className="text-[10px] font-bold bg-white text-purple-800 px-1.5 py-0.5 rounded-md border border-purple-200">
                                📷 {member.assigned_camera}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      <AssignTeamModal
        isOpen={assignModal.isOpen}
        onClose={() => setAssignModal(prev => ({ ...prev, isOpen: false }))}
        serviceId={assignModal.serviceId}
        serviceName={assignModal.serviceName}
        quantity={assignModal.quantity}
        assignedTeam={assignModal.assignedTeam}
        onSave={(team) => {
          updateServiceInEvent(assignModal.eventIndex, assignModal.serviceIndex, 'assigned_team', team)
          toast.success('Team assigned successfully!')
        }}
      />
    </div>
  )
}

// ─── Step 3: Deliverables ─────────────────────────────────────────────────────

function StepDeliverables({ data, set }: { data: WorkOrderWizardData; set: (k: keyof WorkOrderWizardData, v: unknown) => void }) {
  const settings = loadSettingsFromStorage()
  const masterDeliverables = settings.deliverables.filter(d => d.is_active)

  useEffect(() => {
    if (data.deliverables.length === 0 && masterDeliverables.length > 0) {
      const initial: WizardDeliverableItem[] = masterDeliverables.map(m => ({
        deliverable_id: m.id,
        name: m.name,
        is_included: false,
        notes: '',
      }))
      set('deliverables', initial)
    }
  }, [data.deliverables.length, masterDeliverables, set])

  const toggleIncluded = (delId: string) => {
    const updated = data.deliverables.map(d => d.deliverable_id === delId ? { ...d, is_included: !d.is_included } : d)
    set('deliverables', updated)
  }

  const updateNotes = (delId: string, notes: string) => {
    const updated = data.deliverables.map(d => d.deliverable_id === delId ? { ...d, notes } : d)
    set('deliverables', updated)
  }

  return (
    <div className="space-y-4 font-sans">
      <div>
        <h3 className="text-sm font-extrabold text-[#111827]">Deliverables Selection</h3>
        <p className="text-xs text-gray-500 font-medium">Select photo & video deliverables included in this work order.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.deliverables.map((item) => (
          <div
            key={item.deliverable_id}
            className={cn(
              'p-4 rounded-2xl border transition-all space-y-2',
              item.is_included
                ? 'bg-purple-50/50 border-[#5B3FD9]'
                : 'bg-white border-gray-200 hover:border-gray-300'
            )}
          >
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleIncluded(item.deliverable_id)}>
              <span className="text-xs font-extrabold text-[#111827]">{item.name}</span>
              <div className={cn('size-5 rounded-lg flex items-center justify-center border transition-colors',
                item.is_included ? 'bg-[#5B3FD9] border-[#5B3FD9] text-white' : 'border-gray-300 bg-white')}>
                {item.is_included && <Check size={12} />}
              </div>
            </div>

            {item.is_included && (
              <input
                type="text"
                placeholder="Notes (e.g. Pen Drive 64GB, Teaser Reel)"
                value={item.notes}
                onChange={(e) => updateNotes(item.deliverable_id, e.target.value)}
                className="w-full h-8 px-3 text-xs rounded-xl bg-white border border-gray-200 text-gray-900 font-medium focus:outline-none focus:border-[#5B3FD9]"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 4: Payments ─────────────────────────────────────────────────────────

function StepPayment({ data, set }: { data: WorkOrderWizardData; set: (k: keyof WorkOrderWizardData, v: unknown) => void }) {
  const p = data.payment
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false)

  const packageAmt = parseFloat(p.package_amount) || 0
  const discountAmt = parseFloat(p.discount_amount) || 0
  const isGstApplicable = p.gst_applicable ?? false
  const gstPct = isGstApplicable ? (parseFloat(p.gst_percent) || 0) : 0
  const gstAmt = isGstApplicable ? (packageAmt * gstPct) / 100 : 0
  const netAmt = packageAmt + gstAmt - discountAmt

  const totalReceived = p.ledger.reduce((sum, item) => sum + item.amount, 0)
  const balance = Math.max(0, netAmt - totalReceived)
  const paymentPct = netAmt > 0 ? Math.min(100, Math.round((totalReceived / netAmt) * 100)) : 0

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h3 className="text-sm font-extrabold text-[#111827]">Payment Structure & Ledger</h3>
        <p className="text-xs text-gray-500 font-medium">Configure pricing, GST tax settings, and advance payment transactions.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Package Amount (₹)" required>
          <FormInput
            type="number"
            min="0"
            value={p.package_amount}
            onChange={e => set('payment', { ...p, package_amount: e.target.value })}
          />
        </Field>
        <Field label="Discount (₹)">
          <FormInput
            type="number"
            min="0"
            value={p.discount_amount}
            onChange={e => set('payment', { ...p, discount_amount: e.target.value })}
          />
        </Field>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-3 shadow-xs">
        <label className="flex items-center gap-2 cursor-pointer font-extrabold text-xs text-[#111827]">
          <input
            type="checkbox"
            checked={p.gst_applicable ?? false}
            onChange={(e) => set('payment', { ...p, gst_applicable: e.target.checked })}
            className="size-4 rounded accent-[#5B3FD9]"
          />
          <span>Enable GST Calculation (Tax Invoice)</span>
        </label>
        {p.gst_applicable && (
          <div className="pt-2 border-t border-gray-100 max-w-xs">
            <label className="block text-xs font-extrabold text-gray-700 mb-1">GST Percentage (%)</label>
            <FormInput
              type="number"
              min="0"
              max="100"
              value={p.gst_percent ?? '18'}
              onChange={(e) => set('payment', { ...p, gst_percent: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-1 shadow-xs">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Net Package</span>
          <p className="text-base font-extrabold text-[#111827]">₹{netAmt.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-1 shadow-xs">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Advance Received</span>
          <p className="text-base font-extrabold text-emerald-600">₹{totalReceived.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-1 shadow-xs">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Balance Due</span>
          <p className="text-base font-extrabold text-amber-600">₹{balance.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-1 shadow-xs">
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">Paid Percentage</span>
          <p className="text-base font-extrabold text-blue-600">{paymentPct}%</p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
            Payment Ledger ({p.ledger.length} entries)
          </h4>
          <button
            type="button"
            onClick={() => setIsLedgerModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-extrabold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus size={14} /> Record Payment
          </button>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-extrabold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Reference</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {p.ledger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-400 italic text-xs">
                    No payment transactions recorded yet. Click "+ Record Payment" above.
                  </td>
                </tr>
              ) : (
                p.ledger.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-3 font-semibold">{item.payment_date}</td>
                    <td className="p-3 font-extrabold text-emerald-600 font-mono">₹{item.amount.toLocaleString('en-IN')}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-extrabold">{item.payment_mode}</span></td>
                    <td className="p-3 font-mono text-gray-500">{item.transaction_ref || '-'}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => set('payment', { ...p, ledger: p.ledger.filter(l => l.id !== item.id) })} className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RecordPaymentModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        onAddPayment={(entry) => {
          set('payment', { ...p, ledger: [...p.ledger, entry] })
          toast.success('Payment recorded!')
        }}
      />
    </div>
  )
}

// ─── Step 5: Contract ─────────────────────────────────────────────────────────

function StepContract({ data, set }: { data: WorkOrderWizardData; set: (k: keyof WorkOrderWizardData, v: unknown) => void }) {
  const settings = loadSettingsFromStorage()
  const activeTemplates = settings.contractTemplates.filter(t => t.is_active)
  const c = data.contract

  return (
    <div className="space-y-5 font-sans">
      <div>
        <h3 className="text-sm font-extrabold text-[#111827]">Legal Agreement & Contract</h3>
        <p className="text-xs text-gray-500 font-medium">Configure terms & conditions agreement details.</p>
      </div>

      {activeTemplates.length > 0 && (
        <div className="p-4 rounded-2xl bg-white border border-gray-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <span className="text-xs text-gray-700 font-extrabold">Load reusable Contract Template:</span>
          <select
            onChange={(e) => {
              const tpl = activeTemplates.find(t => t.id === e.target.value)
              if (tpl) set('contract', { ...c, title: tpl.title, terms_content: tpl.content })
            }}
            className="h-9 px-3 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-extrabold cursor-pointer"
          >
            <option value="">Choose a Template...</option>
            {activeTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Contract Title" required>
          <FormInput value={c.title} onChange={e => set('contract', { ...c, title: e.target.value })} />
        </Field>
        <Field label="Agreement Date">
          <FormInput type="date" value={c.agreement_date} onChange={e => set('contract', { ...c, agreement_date: e.target.value })} />
        </Field>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-extrabold text-gray-700">Terms & Conditions (Rich Text Legal Agreement)</label>
        <RichTextEditor
          value={c.terms_content}
          onChange={(html) => set('contract', { ...c, terms_content: html })}
          minHeight="320px"
        />
      </div>
    </div>
  )
}

// ─── Step 6: Calendar ─────────────────────────────────────────────────────────

function StepCalendar({ data, set }: { data: WorkOrderWizardData; set: (k: keyof WorkOrderWizardData, v: unknown) => void }) {
  return (
    <div className="space-y-5 font-sans">
      <div>
        <h3 className="text-sm font-extrabold text-[#111827]">Delivery Dates & Calendar</h3>
        <p className="text-xs text-gray-500 font-medium">Set target final delivery date and album completion deadlines.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Album Delivery Date">
          <FormInput type="date" value={data.album_delivery_date} onChange={e => set('album_delivery_date', e.target.value)} />
        </Field>
        <Field label="Final Delivery Date">
          <FormInput type="date" value={data.final_delivery_date} onChange={e => set('final_delivery_date', e.target.value)} />
        </Field>
      </div>

      {data.events.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-gray-100">
          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Scheduled Shoot Summary</p>
          {data.events.map((e, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 text-xs border border-gray-200">
              <span className="font-extrabold text-[#111827]">{e.event_type_name} • {e.venue || 'Venue TBD'}</span>
              <span className="font-mono text-[#5B3FD9] font-extrabold">{e.event_date || 'Date TBD'} ({e.event_time || '10 AM - 8 PM'})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Step 7: Review & Create Screen ───────────────────────────────────────────

function StepReview({ data }: { data: WorkOrderWizardData }) {
  const p = data.payment
  const packageAmt = parseFloat(p.package_amount) || 0
  const discountAmt = parseFloat(p.discount_amount) || 0
  const gstPct = parseFloat(p.gst_percent) || 0
  const gstAmt = p.gst_applicable ? (packageAmt * gstPct) / 100 : 0
  const netAmt = packageAmt + gstAmt - discountAmt
  const totalReceived = p.ledger.reduce((sum, item) => sum + item.amount, 0)
  const balance = Math.max(0, netAmt - totalReceived)

  const includedDeliverables = data.deliverables.filter(d => d.is_included)

  return (
    <div className="space-y-6 font-sans">
      <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center gap-3">
        <Sparkles size={20} className="text-[#5B3FD9] shrink-0" />
        <p className="text-xs font-extrabold text-[#5B3FD9]">
          Please review the project details below before creating the Work Order.
        </p>
      </div>

      {/* Project Overview */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-xs">
        <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">PROJECT OVERVIEW</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div><span className="text-gray-400 font-bold block text-[10px] uppercase">Project Name</span><p className="font-extrabold text-[#111827] mt-0.5">{data.project_name}</p></div>
          <div><span className="text-gray-400 font-bold block text-[10px] uppercase">Customer</span><p className="font-extrabold text-[#111827] mt-0.5">{data.customer_name} ({data.mobile})</p></div>
          <div><span className="text-gray-400 font-bold block text-[10px] uppercase">Primary Event</span><p className="font-extrabold text-[#111827] mt-0.5">{data.event_type}</p></div>
          <div><span className="text-gray-400 font-bold block text-[10px] uppercase">Booking Date</span><p className="font-extrabold text-[#111827] mt-0.5">{data.booking_date || 'Today'}</p></div>
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-xs">
        <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">SHOOT SCHEDULE ({data.events.length})</h4>
        <div className="space-y-2">
          {data.events.map((e, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-gray-50 text-xs border border-gray-200">
              <span className="font-extrabold text-[#111827]">{e.event_type_name} — {e.venue || data.venue || 'Venue TBD'}</span>
              <span className="font-mono font-extrabold text-[#5B3FD9]">{e.event_date} ({e.event_time || '10:00 AM - 08:00 PM'})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Deliverables & Payments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-xs">
          <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">DELIVERABLES ({includedDeliverables.length})</h4>
          <div className="flex flex-wrap gap-1.5">
            {includedDeliverables.length === 0 ? (
              <span className="text-xs text-gray-400 italic">No deliverables configured</span>
            ) : (
              includedDeliverables.map((d) => (
                <span key={d.deliverable_id} className="px-3 py-1 rounded-xl bg-purple-50 text-[#5B3FD9] text-xs font-extrabold border border-purple-100">
                  ✓ {d.name}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-xs">
          <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">PAYMENT BREAKDOWN</h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-gray-500 font-bold">Net Package:</span><span className="font-extrabold">₹{netAmt.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-emerald-600"><span className="font-bold">Advance Received:</span><span className="font-extrabold">₹{totalReceived.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-amber-600 border-t border-gray-100 pt-1.5"><span className="font-bold">Balance Due:</span><span className="font-extrabold">₹{balance.toLocaleString('en-IN')}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── RIGHT COLUMN: LIVE PROJECT SUMMARY PANEL ─────────────────────────────────

function LiveProjectSummaryPanel({ data }: { data: WorkOrderWizardData }) {
  const p = data.payment
  const packageAmt = parseFloat(p.package_amount) || 0
  const discountAmt = parseFloat(p.discount_amount) || 0
  const gstPct = parseFloat(p.gst_percent) || 0
  const gstAmt = p.gst_applicable ? (packageAmt * gstPct) / 100 : 0
  const netAmt = packageAmt + gstAmt - discountAmt

  const includedDeliverables = data.deliverables.filter((d) => d.is_included)
  const totalServices = data.events.reduce((sum, e) => sum + (e.services?.length || 0), 0)
  const totalAssignedTeam = data.events.reduce((sum, e) => {
    return sum + (e.services || []).reduce((sSum, s) => sSum + (s.assigned_team?.length || 0), 0)
  }, 0)

  const shootDateDisplay = useMemo(() => {
    if (data.events.length === 0) return 'Not scheduled'
    if (data.events.length === 1) return `${data.events[0].event_date || 'Date TBD'} (1 Event)`
    return `${data.events[0].event_date || 'TBD'} + ${data.events.length - 1} more (${data.events.length} Events)`
  }, [data.events])

  return (
    <div className="sticky top-6 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4 font-sans">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <span className="p-2 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
          <Eye size={18} />
        </span>
        <div>
          <h3 className="text-sm font-extrabold text-[#111827]">Project Summary</h3>
          <p className="text-[11px] text-gray-500 font-medium">Live preview of your work order</p>
        </div>
      </div>

      <div className="space-y-3.5 text-xs">
        {/* Customer */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-bold flex items-center gap-1.5">
            <Users size={14} className="text-gray-400" /> Customer
          </span>
          <span className="font-extrabold text-[#111827] max-w-[140px] truncate text-right">
            {data.customer_name || 'Mr & Mrs Nagaraj'}
          </span>
        </div>

        {/* Event Type */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-bold flex items-center gap-1.5">
            <Sparkles size={14} className="text-gray-400" /> Event Type
          </span>
          <span className="font-extrabold text-[#111827]">
            {data.event_type || 'Wedding'}
          </span>
        </div>

        {/* Shoot Date */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-bold flex items-center gap-1.5">
            <Calendar size={14} className="text-gray-400" /> Shoot Date(s)
          </span>
          <span className="font-mono font-extrabold text-[#5B3FD9] text-right">
            {shootDateDisplay}
          </span>
        </div>

        {/* Venue */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-bold flex items-center gap-1.5">
            <MapPin size={14} className="text-gray-400" /> Venue
          </span>
          <span className="font-extrabold text-[#111827] max-w-[140px] truncate text-right">
            {data.venue || 'White Petals, Bengaluru'}
          </span>
        </div>

        {/* City */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-bold flex items-center gap-1.5">
            <Building2 size={14} className="text-gray-400" /> City
          </span>
          <span className="font-extrabold text-[#111827]">
            {data.city || 'Bengaluru'}
          </span>
        </div>

        {/* Services */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
          <span className="text-gray-500 font-bold flex items-center gap-1.5">
            <Check size={14} className="text-gray-400" /> Services
          </span>
          <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-extrabold',
            totalServices > 0 ? 'bg-purple-50 text-[#5B3FD9]' : 'bg-gray-100 text-gray-500')}>
            {totalServices > 0 ? `${totalServices} Selected` : 'No services selected yet'}
          </span>
        </div>

        {/* Deliverables */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-bold flex items-center gap-1.5">
            <Package size={14} className="text-gray-400" /> Deliverables
          </span>
          <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-extrabold',
            includedDeliverables.length > 0 ? 'bg-purple-50 text-[#5B3FD9]' : 'bg-gray-100 text-gray-500')}>
            {includedDeliverables.length > 0 ? `${includedDeliverables.length} Configured` : 'Not configured yet'}
          </span>
        </div>

        {/* Team */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-bold flex items-center gap-1.5">
            <Users size={14} className="text-gray-400" /> Team
          </span>
          <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-extrabold',
            totalAssignedTeam > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
            {totalAssignedTeam > 0 ? `${totalAssignedTeam} Assigned` : 'Pending Assignment'}
          </span>
        </div>

        {/* Payment */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-bold flex items-center gap-1.5">
            <CreditCard size={14} className="text-gray-400" /> Payment
          </span>
          <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-extrabold',
            netAmt > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
            {netAmt > 0 ? `₹${netAmt.toLocaleString('en-IN')}` : 'Not Started'}
          </span>
        </div>

        {/* Contract */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-bold flex items-center gap-1.5">
            <FileText size={14} className="text-gray-400" /> Contract
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700">
            {data.contract?.customer_signature ? 'Signed' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Tip Box */}
      <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 space-y-1">
        <p className="text-[11px] font-extrabold text-[#5B3FD9] flex items-center gap-1">
          <Sparkles size={13} /> Tip
        </p>
        <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
          You can save this work order as draft and continue later from the Work Orders list.
        </p>
      </div>
    </div>
  )
}

// ─── MAIN WORK ORDER WIZARD MODAL ─────────────────────────────────────────────

interface WorkOrderWizardProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: WorkOrderWizardData) => void
  onSaveDraft?: (data: WorkOrderWizardData) => void
  initialData?: WorkOrderWizardData
  isSubmitting?: boolean
}

export function WorkOrderWizard({
  isOpen,
  onClose,
  onSubmit,
  onSaveDraft,
  initialData,
  isSubmitting = false,
}: WorkOrderWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<WorkOrderWizardData>(() => ({
    ...DEFAULT_WIZARD_DATA,
    ...(initialData || {}),
    payment: { ...DEFAULT_WIZARD_DATA.payment, ...(initialData?.payment || {}) },
    contract: { ...DEFAULT_WIZARD_DATA.contract, ...(initialData?.contract || {}) },
    events: initialData?.events || [],
    deliverables: initialData?.deliverables || [],
  }))

  const prevIsOpenRef = useRef(false)
  const prevDataKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const dataKey = initialData ? `${initialData.project_name}_${initialData.customer_name}_${initialData.mobile}_${initialData.booking_date}` : 'new'
    if (isOpen && (!prevIsOpenRef.current || prevDataKeyRef.current !== dataKey)) {
      setFormData({
        ...DEFAULT_WIZARD_DATA,
        ...(initialData || {}),
        payment: { ...DEFAULT_WIZARD_DATA.payment, ...(initialData?.payment || {}) },
        contract: { ...DEFAULT_WIZARD_DATA.contract, ...(initialData?.contract || {}) },
        events: initialData?.events || [],
        deliverables: initialData?.deliverables || [],
      })
      setCurrentStep(1)
      prevDataKeyRef.current = dataKey
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen, initialData])

  if (!isOpen) return null

  const isEditMode = !!initialData

  const setField = (key: keyof WorkOrderWizardData, val: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: val }))
  }

  const handleNext = () => {
    // Validation for Step 1
    if (currentStep === 1) {
      if (!formData.customer_name?.trim()) {
        toast.error('Required Field Missing: Customer Name * is required.')
        return
      }
      if (!formData.mobile?.trim()) {
        toast.error('Required Field Missing: Mobile Number * is required.')
        return
      }
      if (!formData.project_name?.trim()) {
        toast.error('Required Field Missing: Project Name * is required.')
        return
      }
      if (!formData.event_type?.trim()) {
        toast.error('Required Field Missing: Primary Event Type * is required.')
        return
      }
      if (!formData.events || formData.events.length === 0 || !formData.events[0].event_date) {
        toast.error('Required Field Missing: At least one scheduled shoot date * is required.')
        return
      }
    }

    if (currentStep < STEPS.length) {
      setCurrentStep((s) => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleFinalSubmit = () => {
    if (!formData.customer_name?.trim()) {
      toast.error('Required Field Missing: Customer Name * is required.')
      setCurrentStep(1)
      return
    }
    if (!formData.mobile?.trim()) {
      toast.error('Required Field Missing: Mobile Number * is required.')
      setCurrentStep(1)
      return
    }
    if (!formData.project_name?.trim()) {
      toast.error('Required Field Missing: Project Name * is required.')
      setCurrentStep(1)
      return
    }

    onSubmit(formData)
  }

  const handleSaveDraftClick = () => {
    if (onSaveDraft) {
      onSaveDraft(formData)
    } else {
      toast.success('Draft saved successfully!')
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans space-y-6">
      {/* ─── Top Header Card ─── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2.5 py-1 rounded-lg text-xs uppercase">
                STEP {currentStep} OF {STEPS.length}
              </span>
              <h1 className="text-2xl font-extrabold text-[#111827]">
                {isEditMode ? 'Edit Work Order' : 'Create Work Order Project'}
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Step {currentStep}: {STEPS[currentStep - 1]?.labelFull} — {STEPS[currentStep - 1]?.sub}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-extrabold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <X size={15} /> Cancel & Return
            </button>

            {currentStep === STEPS.length ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 text-xs font-extrabold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-2 shadow-md shadow-[#5B3FD9]/20 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Check size={16} /> {isSubmitting ? 'Creating Work Order...' : isEditMode ? 'Update Work Order' : 'Create Work Order'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 text-xs font-extrabold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-2 shadow-md shadow-[#5B3FD9]/20 cursor-pointer transition-all"
              >
                Next Step <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>

        {/* ─── 7-Step Progress Stepper ─── */}
        <div className="pt-3 border-t border-gray-100 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {STEPS.map((s) => {
              const Icon = s.icon
              const isDone = currentStep > s.id
              const isCurrent = currentStep === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentStep(s.id)}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold rounded-xl shrink-0 transition-all cursor-pointer',
                    isCurrent
                      ? 'bg-[#5B3FD9] text-white shadow-md shadow-[#5B3FD9]/25'
                      : isDone
                      ? 'bg-purple-50 text-[#5B3FD9] border border-purple-200 hover:bg-purple-100'
                      : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                  )}
                >
                  {isDone ? <Check size={14} className="text-[#5B3FD9]" /> : <Icon size={14} />}
                  <span>{s.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── Two-Column Body Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Data Entry Area */}
        <div className="lg:col-span-2 space-y-6">
          {currentStep === 1 && <StepOverview data={formData} set={setField} setFormData={setFormData} />}
          {currentStep === 2 && <StepEventsAndServices data={formData} set={setField} />}
          {currentStep === 3 && <StepDeliverables data={formData} set={setField} />}
          {currentStep === 4 && <StepPayment data={formData} set={setField} />}
          {currentStep === 5 && <StepContract data={formData} set={setField} />}
          {currentStep === 6 && <StepCalendar data={formData} set={setField} />}
          {currentStep === 7 && <StepReview data={formData} />}

          {/* ─── Bottom Navigation Bar ─── */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-5 py-2.5 text-xs font-extrabold rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} /> Back
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraftClick}
                className="px-4 py-2.5 text-xs font-extrabold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save size={15} /> Save Draft
              </button>

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 text-xs font-extrabold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] shadow-md shadow-[#5B3FD9]/20 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  Next Step <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="px-7 py-2.5 text-xs font-extrabold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] shadow-md shadow-[#5B3FD9]/20 flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <Check size={16} /> {isSubmitting ? 'Creating Work Order...' : isEditMode ? 'Update Work Order' : 'Create Work Order'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Live Summary Panel */}
        <div className="lg:col-span-1">
          <LiveProjectSummaryPanel data={formData} />
        </div>
      </div>
    </div>
  )
}
