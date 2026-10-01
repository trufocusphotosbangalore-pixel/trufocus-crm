import type {
  SettingsState, EventTypeMaster, ServiceMaster, DeliverableMaster,
  PaymentModeMaster, ContractTemplateMaster, DepartmentMaster,
  EmployeeRoleMaster, EmployeeProfile,
} from '@/types/settings'

// ─── Default Seed Data ────────────────────────────────────────────────────────

const DEFAULT_EVENT_TYPES: EventTypeMaster[] = [
  { id: 'et-1', name: 'Wedding', code: 'wedding', description: 'Main wedding ceremony', is_active: true },
  { id: 'et-2', name: 'Reception', code: 'reception', description: 'Evening reception party', is_active: true },
  { id: 'et-3', name: 'Engagement', code: 'engagement', description: 'Ring ceremony / Engagement', is_active: true },
  { id: 'et-4', name: 'Haldi', code: 'haldi', description: 'Haldi ceremony', is_active: true },
  { id: 'et-5', name: 'Sangeet / Mehendi', code: 'sangeet', description: 'Sangeet & Mehendi night', is_active: true },
  { id: 'et-6', name: 'Pre-Wedding Shoot', code: 'pre_wedding', description: 'Outdoor pre-wedding shoot', is_active: true },
  { id: 'et-7', name: 'Maternity / Baby Shoot', code: 'maternity', description: 'Maternity or newborn shoot', is_active: true },
  { id: 'et-8', name: 'Corporate Event', code: 'corporate', description: 'Corporate conference or gala', is_active: true },
  { id: 'et-9', name: 'Birthday / Private Party', code: 'birthday', description: 'Birthday & private celebrations', is_active: true },
]

const DEFAULT_DEPARTMENTS: DepartmentMaster[] = [
  { id: 'dept-1', name: 'Photography', code: 'PHOTO', is_active: true },
  { id: 'dept-2', name: 'Videography', code: 'VIDEO', is_active: true },
  { id: 'dept-3', name: 'Post-Production', code: 'POST', is_active: true },
  { id: 'dept-4', name: 'Operations & Tech', code: 'OPS', is_active: true },
]

const DEFAULT_SERVICES: ServiceMaster[] = [
  { id: 'srv-1', name: 'Traditional Photography', department_id: 'dept-1', department_name: 'Photography', default_rate: 15000, is_active: true },
  { id: 'srv-2', name: 'Candid Photography', department_id: 'dept-1', department_name: 'Photography', default_rate: 25000, is_active: true },
  { id: 'srv-3', name: 'Traditional Videography', department_id: 'dept-2', department_name: 'Videography', default_rate: 18000, is_active: true },
  { id: 'srv-4', name: 'Cinematic Videography', department_id: 'dept-2', department_name: 'Videography', default_rate: 35000, is_active: true },
  { id: 'srv-5', name: 'Drone Coverage', department_id: 'dept-2', department_name: 'Videography', default_rate: 12000, is_active: true },
  { id: 'srv-6', name: 'LED Display Wall', department_id: 'dept-4', department_name: 'Operations & Tech', default_rate: 20000, is_active: true },
  { id: 'srv-7', name: 'Live Streaming', department_id: 'dept-4', department_name: 'Operations & Tech', default_rate: 15000, is_active: true },
  { id: 'srv-8', name: 'Pre-Wedding Outdoor Shoot', department_id: 'dept-1', department_name: 'Photography', default_rate: 30000, is_active: true },
]

const DEFAULT_DELIVERABLES: DeliverableMaster[] = [
  { id: 'del-1', name: 'Edited Photos', category: 'Photography', description: 'High-res color corrected photos', is_active: true },
  { id: 'del-2', name: 'Traditional Video', category: 'Videography', description: 'Full length edited traditional video', is_active: true },
  { id: 'del-3', name: 'Cinematic Film', category: 'Videography', description: '3-5 min cinematic teaser/film', is_active: true },
  { id: 'del-4', name: 'Instagram Reel', category: 'Social Media', description: '1-min vertical reel highlight', is_active: true },
  { id: 'del-5', name: 'Highlight Film', category: 'Videography', description: '10-15 min event highlight film', is_active: true },
  { id: 'del-6', name: 'Luxury Album', category: 'Albums', description: 'Canvera/Photopark Premium Photobook', is_active: true },
  { id: 'del-7', name: 'Mini Album', category: 'Albums', description: 'Parent / Mini copy album', is_active: true },
  { id: 'del-8', name: 'Photo Frame', category: 'Prints', description: 'Large wooden/acrylic wall frame', is_active: true },
  { id: 'del-9', name: 'Canvas Print', category: 'Prints', description: 'Textured canvas wall art print', is_active: true },
  { id: 'del-10', name: 'Pen Drive', category: 'Physical Media', description: 'Branded 64GB USB Flash Drive with raw/final files', is_active: true },
  { id: 'del-11', name: 'Online Gallery', category: 'Digital Media', description: 'Password protected digital client web gallery', is_active: true },
]

const DEFAULT_PAYMENT_MODES: PaymentModeMaster[] = [
  { id: 'pm-1', name: 'Cash', code: 'cash', requires_reference: false, is_active: true },
  { id: 'pm-2', name: 'UPI', code: 'upi', requires_reference: true, is_active: true },
  { id: 'pm-3', name: 'Bank Transfer', code: 'bank_transfer', requires_reference: true, is_active: true },
  { id: 'pm-4', name: 'Card', code: 'card', requires_reference: true, is_active: true },
  { id: 'pm-5', name: 'Cheque', code: 'cheque', requires_reference: true, is_active: true },
]

const DEFAULT_CONTRACT_TEMPLATES: ContractTemplateMaster[] = [
  {
    id: 'ct-1',
    title: 'Standard Wedding Photography & Videography Agreement',
    is_default: true,
    is_active: true,
    content: `<h2>1. Booking & Retainer</h2>
<p>A non-refundable retainer fee of <strong>25%</strong> is required upon signing this contract to secure the shoot date(s). The balance amount shall be paid as per the agreed payment schedule.</p>

<h2>2. Coverage & Services</h2>
<p>Trufocus Photography agrees to provide the photographic and videographic coverage detailed in the Work Order. Any extra hours or additional services requested on-site will be billed separately.</p>

<h2>3. Deliverables & Timeline</h2>
<ul>
  <li><strong>Edited High-Resolution Photos:</strong> Delivered within 21 to 30 working days after selection.</li>
  <li><strong>Cinematic Teaser & Highlight Video:</strong> Delivered within 45 working days post-event.</li>
  <li><strong>Photobooks & Printed Media:</strong> Delivered within 30 days after client album proof approval.</li>
</ul>

<h2>4. Copyright & Usage Rights</h2>
<p>Trufocus Photography retains copyright for all images and video footage. The client is granted a non-exclusive license for personal usage, printing, and social media sharing.</p>

<h2>5. Cancellation & Rescheduling</h2>
<p>In the event of cancellation by the client, retainer payments remain non-refundable. Rescheduling is subject to studio calendar availability.</p>`,
  },
  {
    id: 'ct-2',
    title: 'Event Photography Agreement (Corporate / Parties)',
    is_default: false,
    is_active: true,
    content: `<h2>1. Scope of Work</h2>
<p>The studio agrees to provide professional coverage as specified in the service agreement for the event duration.</p>

<h2>2. Payment Terms</h2>
<p>Payment must be settled in full within 7 business days following the conclusion of the event.</p>

<h2>3. Delivery</h2>
<p>Digital gallery files delivered within 10 business days.</p>`,
  },
]

const DEFAULT_EMPLOYEE_ROLES: EmployeeRoleMaster[] = [
  { id: 'role-1', title: 'Lead Photographer', department_id: 'dept-1', department_name: 'Photography', is_active: true },
  { id: 'role-2', title: 'Traditional Photographer', department_id: 'dept-1', department_name: 'Photography', is_active: true },
  { id: 'role-3', title: 'Candid Photographer', department_id: 'dept-1', department_name: 'Photography', is_active: true },
  { id: 'role-4', title: 'Lead Videographer', department_id: 'dept-2', department_name: 'Videography', is_active: true },
  { id: 'role-5', title: 'Traditional Videographer', department_id: 'dept-2', department_name: 'Videography', is_active: true },
  { id: 'role-6', title: 'Cinematic Videographer', department_id: 'dept-2', department_name: 'Videography', is_active: true },
  { id: 'role-7', title: 'Drone Operator', department_id: 'dept-2', department_name: 'Videography', is_active: true },
  { id: 'role-8', title: 'LED & Tech Engineer', department_id: 'dept-4', department_name: 'Operations & Tech', is_active: true },
]

const DEFAULT_EMPLOYEES: EmployeeProfile[] = []

// ─── Local Storage Store Helper ───────────────────────────────────────────────

const STORAGE_KEY = 'trufocus_crm_settings_v1'

export function loadSettingsFromStorage(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        eventTypes: parsed.eventTypes || DEFAULT_EVENT_TYPES,
        services: parsed.services || DEFAULT_SERVICES,
        deliverables: parsed.deliverables || DEFAULT_DELIVERABLES,
        paymentModes: parsed.paymentModes || DEFAULT_PAYMENT_MODES,
        contractTemplates: parsed.contractTemplates || DEFAULT_CONTRACT_TEMPLATES,
        departments: parsed.departments || DEFAULT_DEPARTMENTS,
        employeeRoles: parsed.employeeRoles || DEFAULT_EMPLOYEE_ROLES,
        // Employees list must be sourced exclusively from EmployeeService (no browser persistence)
        employees: DEFAULT_EMPLOYEES,
      }
    }
  } catch (e) {
    console.error('Failed to load settings from storage', e)
  }
  return {
    eventTypes: DEFAULT_EVENT_TYPES,
    services: DEFAULT_SERVICES,
    deliverables: DEFAULT_DELIVERABLES,
    paymentModes: DEFAULT_PAYMENT_MODES,
    contractTemplates: DEFAULT_CONTRACT_TEMPLATES,
    departments: DEFAULT_DEPARTMENTS,
    employeeRoles: DEFAULT_EMPLOYEE_ROLES,
    employees: DEFAULT_EMPLOYEES,
  }
}

export function saveSettingsToStorage(state: SettingsState): void {
  try {
    // Ensure we never persist employee lists to settings storage
    const { employees, ...sanitized } = state as any
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized))
  } catch (e) {
    console.error('Failed to save settings to storage', e)
  }
}
