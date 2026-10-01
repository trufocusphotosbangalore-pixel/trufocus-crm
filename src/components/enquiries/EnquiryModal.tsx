import { useState, useEffect, useCallback } from 'react'
import {
  User, Phone, Mail, Calendar, MapPin, DollarSign,
  Share2, FileText, MessageCircle, Clock, Home, ArrowRight, Sparkles, CheckCircle2, XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'
import { getQuotationByEnquiryId } from '@/services/quotationStore'
import type { Quotation } from '@/types/quotation'
import {
  ENQUIRY_STATUS_LABELS,
  ENQUIRY_SOURCE_LABELS,
  EVENT_TYPE_LABELS,
} from '@/types/enquiries'
import type {
  Enquiry, EnquiryFormData, EnquiryStatus, EnquirySource, EventType,
} from '@/types/enquiries'

// ─── Default Form ─────────────────────────────────────────────────────────────

const DEFAULT_FORM: EnquiryFormData = {
  customer_name: '',
  mobile: '',
  alternate_mobile: '',
  email: '',
  event_type: '',
  event_date: '',
  event_time: '',
  venue: '',
  location: '',
  budget: '',
  source: '',
  status: 'new',
  assigned_to: '',
  notes: '',
  preferred_contact_method: 'whatsapp',
}

// ─── Form Field Error Map ─────────────────────────────────────────────────────

type FormErrors = Partial<Record<keyof EnquiryFormData, string>>

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 pt-1">
      <div className="size-6 rounded-md bg-[var(--color-primary-light)] flex items-center justify-center">
        <Icon size={13} className="text-[var(--color-primary)]" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
        {title}
      </p>
    </div>
  )
}

// ─── Form Select ──────────────────────────────────────────────────────────────

interface FormSelectProps {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  error?: string
  required?: boolean
}

function FormSelect({ label, value, onChange, options, placeholder, error, required }: FormSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
        {label} {required && <span className="text-[var(--color-error)]">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full h-10 px-3 rounded-[var(--radius-md)] text-sm appearance-none',
          'bg-[var(--color-bg-input)] text-[var(--color-text-primary)]',
          'border transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]',
          error
            ? 'border-[var(--color-error)] focus:border-[var(--color-error)]'
            : 'border-[var(--color-border-default)] focus:border-[var(--color-primary)]',
          !value && 'text-[var(--color-text-muted)]'
        )}
      >
        <option value="">{placeholder ?? `Select ${label}`}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-[var(--color-error)]">{error}</p>}
    </div>
  )
}

// ─── Contact Method Radio ─────────────────────────────────────────────────────

function ContactMethodPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const options = [
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-400' },
    { value: 'phone', label: 'Phone', icon: Phone, color: 'text-[var(--color-primary)]' },
    { value: 'email', label: 'Email', icon: Mail, color: 'text-[var(--color-info)]' },
  ]

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
        Preferred Contact Method
      </label>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 h-10 rounded-[var(--radius-md)] text-sm font-medium',
              'border transition-all duration-150',
              value === opt.value
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                : 'border-[var(--color-border-default)] bg-[var(--color-bg-input)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'
            )}
          >
            <opt.icon size={14} className={value === opt.value ? '' : opt.color} />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── View Mode ────────────────────────────────────────────────────────────────

function ViewField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-text-muted)] mb-0.5">{label}</p>
      <p className="text-sm text-[var(--color-text-primary)] font-medium">
        {value ?? <span className="text-[var(--color-text-muted)] font-normal">—</span>}
      </p>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface EnquiryModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit' | 'view'
  enquiry?: Enquiry | null
  onSubmit: (form: EnquiryFormData) => Promise<void>
  onCreateQuotation?: (e: Enquiry) => void
}

export function EnquiryModal({
  isOpen,
  onClose,
  mode,
  enquiry,
  onSubmit,
  onCreateQuotation,
}: EnquiryModalProps) {
  const [form, setForm] = useState<EnquiryFormData>(DEFAULT_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [linkedQuotation, setLinkedQuotation] = useState<Quotation | null>(null)

  // Populate form and load quotation when viewing/editing
  useEffect(() => {
    if (!isOpen) return

    if (enquiry && (mode === 'edit' || mode === 'view')) {
      setForm({
        customer_name: enquiry.customer_name,
        mobile: enquiry.mobile,
        alternate_mobile: enquiry.alternate_mobile ?? '',
        email: enquiry.email ?? '',
        event_type: enquiry.event_type,
        event_date: enquiry.event_date ?? '',
        event_time: enquiry.event_time ?? '',
        venue: enquiry.venue ?? '',
        location: enquiry.location ?? '',
        budget: enquiry.budget != null ? String(enquiry.budget) : '',
        source: enquiry.source,
        status: enquiry.status,
        assigned_to: enquiry.assigned_to ?? '',
        notes: enquiry.notes ?? '',
        preferred_contact_method: enquiry.preferred_contact_method ?? 'whatsapp',
      })

      getQuotationByEnquiryId(enquiry.id).then(setLinkedQuotation)
    } else if (mode === 'create') {
      setForm(DEFAULT_FORM)
      setLinkedQuotation(null)
    }
    setErrors({})
  }, [enquiry?.id, mode, isOpen])

  const set = useCallback(<K extends keyof EnquiryFormData>(key: K, value: EnquiryFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }, [])

  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!form.customer_name.trim()) e.customer_name = 'Customer name is required'
    if (!form.mobile.trim()) {
      e.mobile = 'Mobile number is required'
    } else if (!/^[0-9+\-\s()]{7,15}$/.test(form.mobile.trim())) {
      e.mobile = 'Enter a valid mobile number'
    }
    if (!form.event_type) e.event_type = 'Event type is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'view') return
    if (!validate()) return
    setIsSubmitting(true)
    try {
      await onSubmit(form)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = mode === 'create' ? 'New Enquiry' : mode === 'edit' ? 'Edit Enquiry' : 'Enquiry Details'
  const isReadOnly = mode === 'view'

  const statusOptions = Object.entries(ENQUIRY_STATUS_LABELS).map(([value, label]) => ({ value, label }))
  const sourceOptions = Object.entries(ENQUIRY_SOURCE_LABELS).map(([value, label]) => ({ value, label }))
  const eventTypeOptions = Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))

  if (!isOpen) return null

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="size-10 rounded-xl border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
              title="Back to Enquiries"
            >
              <Home size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2.5 py-1 rounded-md text-xs">
                  {mode === 'create' ? 'NEW CLIENT ENQUIRY' : enquiry?.enquiry_number || 'ENQUIRY'}
                </span>
                <h1 className="ui-page-title text-[32px] font-extrabold text-[#111827]">{title}</h1>
              </div>
              <p className="ui-small-label text-[13px] text-gray-500 mt-1">
                {mode === 'create' ? 'Fill in client information and event specifics below.' : 'View & manage client details.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="ui-button-text text-[15px] px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-2 cursor-pointer font-bold"
            >
              Cancel & Return
            </button>
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="ui-button-text text-[15px] px-6 py-2.5 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-2 shadow-md shadow-[#5B3FD9]/20 cursor-pointer font-extrabold"
              >
                {mode === 'create' ? 'Create Client Enquiry' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs">
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-6">

          {/* ─── Customer Information ─── */}
          <div>
            <SectionHeader icon={User} title="Customer Information" />
            <div className="grid grid-cols-2 gap-3">
              {isReadOnly ? (
                <>
                  <ViewField label="Customer Name" value={form.customer_name} />
                  <ViewField label="Mobile Number" value={form.mobile} />
                  <ViewField label="Alternate Number" value={form.alternate_mobile} />
                  <ViewField label="Email" value={form.email} />
                </>
              ) : (
                <>
                  <div className="col-span-2 sm:col-span-1">
                    <Input
                      id="eq-customer-name"
                      label="Customer Name"
                      placeholder="Full name"
                      value={form.customer_name}
                      onChange={(e) => set('customer_name', e.target.value)}
                      error={errors.customer_name}
                      leftIcon={<User size={14} />}
                      required
                    />
                  </div>
                  <Input
                    id="eq-mobile"
                    label="Mobile Number"
                    placeholder="+91 98765 43210"
                    value={form.mobile}
                    onChange={(e) => set('mobile', e.target.value)}
                    error={errors.mobile}
                    leftIcon={<Phone size={14} />}
                    required
                  />
                  <Input
                    id="eq-alt-mobile"
                    label="Alternate Number"
                    placeholder="Optional"
                    value={form.alternate_mobile}
                    onChange={(e) => set('alternate_mobile', e.target.value)}
                    leftIcon={<Phone size={14} />}
                  />
                  <Input
                    id="eq-email"
                    label="Email"
                    type="email"
                    placeholder="customer@email.com"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    leftIcon={<Mail size={14} />}
                  />
                </>
              )}
            </div>
          </div>

          {/* ─── Event Details ─── */}
          <div>
            <SectionHeader icon={Calendar} title="Event Details" />
            <div className="grid grid-cols-2 gap-3">
              {isReadOnly ? (
                <>
                  <ViewField label="Event Type" value={form.event_type ? EVENT_TYPE_LABELS[form.event_type as EventType] : undefined} />
                  <ViewField label="Event Date" value={form.event_date} />
                  <ViewField label="Event Time" value={form.event_time} />
                  <ViewField label="Venue" value={form.venue} />
                </>
              ) : (
                <>
                  <FormSelect
                    label="Event Type"
                    value={form.event_type}
                    onChange={(v) => set('event_type', v as EventType | '')}
                    options={eventTypeOptions}
                    error={errors.event_type}
                    required
                  />
                  <Input
                    id="eq-event-date"
                    label="Event Date"
                    type="date"
                    value={form.event_date}
                    onChange={(e) => set('event_date', e.target.value)}
                    leftIcon={<Calendar size={14} />}
                  />
                  <Input
                    id="eq-event-time"
                    label="Event Time"
                    type="time"
                    value={form.event_time}
                    onChange={(e) => set('event_time', e.target.value)}
                    leftIcon={<Clock size={14} />}
                  />
                  <Input
                    id="eq-venue"
                    label="Venue"
                    placeholder="Venue / Hall name"
                    value={form.venue}
                    onChange={(e) => set('venue', e.target.value)}
                    leftIcon={<Home size={14} />}
                  />
                </>
              )}
            </div>
          </div>

          {/* ─── Location & Budget ─── */}
          <div>
            <SectionHeader icon={MapPin} title="Location & Budget" />
            <div className="grid grid-cols-2 gap-3">
              {isReadOnly ? (
                <>
                  <ViewField label="Location" value={form.location} />
                  <ViewField label="Budget" value={form.budget ? `₹${Number(form.budget).toLocaleString()}` : undefined} />
                </>
              ) : (
                <>
                  <Input
                    id="eq-location"
                    label="Location"
                    placeholder="City / Area"
                    value={form.location}
                    onChange={(e) => set('location', e.target.value)}
                    leftIcon={<MapPin size={14} />}
                  />
                  <Input
                    id="eq-budget"
                    label="Budget (₹)"
                    type="number"
                    placeholder="e.g. 50000"
                    value={form.budget}
                    onChange={(e) => set('budget', e.target.value)}
                    leftIcon={<DollarSign size={14} />}
                  />
                </>
              )}
            </div>
          </div>

          {/* ─── Lead Information ─── */}
          <div>
            <SectionHeader icon={Share2} title="Lead Information" />
            <div className="grid grid-cols-2 gap-3">
              {isReadOnly ? (
                <>
                  <ViewField label="Source" value={form.source ? ENQUIRY_SOURCE_LABELS[form.source as EnquirySource] : undefined} />
                  <ViewField label="Status" value={form.status ? ENQUIRY_STATUS_LABELS[form.status as EnquiryStatus] : undefined} />
                </>
              ) : (
                <>
                  <FormSelect
                    label="Lead Source"
                    value={form.source}
                    onChange={(v) => set('source', v as EnquirySource | '')}
                    options={sourceOptions}
                    placeholder="Select source"
                  />
                  <FormSelect
                    label="Status"
                    value={form.status}
                    onChange={(v) => set('status', v as EnquiryStatus)}
                    options={statusOptions}
                  />
                </>
              )}
            </div>
          </div>

          {/* ─── Quotation Proposal Section ─── */}
          {enquiry && (
            <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/40 space-y-3 font-sans">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-[#5B3FD9]" />
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Event Quotation Proposal
                  </h4>
                </div>
                {linkedQuotation ? (
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    linkedQuotation.status === 'accepted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : linkedQuotation.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : linkedQuotation.status === 'change_requested'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-purple-100 text-[#5B3FD9]'
                  }`}>
                    {linkedQuotation.status.replace('_', ' ')}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                    No Quotation Created
                  </span>
                )}
              </div>

              {linkedQuotation ? (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-purple-100">
                  <div>
                    <span className="font-mono text-xs font-extrabold text-[#5B3FD9]">
                      {linkedQuotation.quotation_number}
                    </span>
                    <p className="text-xs text-gray-600 font-medium">
                      Package Value: <strong className="font-mono text-gray-900">₹{linkedQuotation.final_amount.toLocaleString('en-IN')}</strong> ({linkedQuotation.events.length} events)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      if (onCreateQuotation) onCreateQuotation(enquiry)
                    }}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    View / Edit Quotation <ArrowRight size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-500 font-medium">
                    Generate an event-wise quotation breakdown with services, deliverables, and customer approval link.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      if (onCreateQuotation) onCreateQuotation(enquiry)
                    }}
                    className="px-4 py-2 text-xs font-extrabold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                  >
                    <Sparkles size={13} /> Create Event Quotation
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── Preferred Contact Method ─── */}
          {!isReadOnly && (
            <ContactMethodPicker
              value={form.preferred_contact_method}
              onChange={(v) => set('preferred_contact_method', v as 'whatsapp' | 'phone' | 'email')}
            />
          )}

          {/* ─── Notes ─── */}
          <div>
            <SectionHeader icon={FileText} title="Notes" />
            {isReadOnly ? (
              <ViewField label="Notes" value={form.notes} />
            ) : (
              <div>
                <textarea
                  id="eq-notes"
                  rows={3}
                  placeholder="Any additional notes, requirements or preferences..."
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm resize-none',
                    'bg-[var(--color-bg-input)] text-[var(--color-text-primary)]',
                    'border border-[var(--color-border-default)]',
                    'placeholder:text-[var(--color-text-muted)]',
                    'focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]',
                    'transition-colors duration-150'
                  )}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        {!isReadOnly && (
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-[#E5E7EB]">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              id={mode === 'create' ? 'create-enquiry-submit' : 'edit-enquiry-submit'}
            >
              {mode === 'create' ? 'Create Client Enquiry' : 'Save Changes'}
            </Button>
          </div>
        )}

        {isReadOnly && (
          <div className="flex justify-end pt-6 mt-6 border-t border-[#E5E7EB]">
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </form>
    </div>
  </div>
  )
}
