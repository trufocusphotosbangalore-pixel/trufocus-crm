import type { BusinessProfileData } from '@/types/businessProfile'
import { pushEntityToCloud } from '@/services/cloudSyncService'

const BUSINESS_PROFILE_KEY = 'trufocus_crm_business_profile_v1'

const DEFAULT_BUSINESS_PROFILE: BusinessProfileData = {
  // Section 1
  logo_url: '/trufocus_logo.png',
  digital_signature_url: '',
  cover_image_url: '',
  brand_name: 'Trufocus Photos',
  parent_company_line: 'A Brand of Chaaya AI Technologies Private Limited',
  legal_company_name: 'Chaaya AI Technologies Private Limited',
  business_name: 'Trufocus Photos',
  tagline: 'Capturing Timeless Moments & Studio Productions',
  owner_name: 'Trufocus Studio Owner',
  gst_number: '29AAAAA0000A1Z5',
  pan_number: 'AAAAA0000A',
  registration_number: 'U72900KA2024PTC000000',
  established_year: '2024',
  business_type: 'Photography & Videography',

  // Section 2 - Contact Information
  primary_mobile: '+91 98765 43210',
  secondary_mobile: '+91 98765 43211',
  whatsapp_number: '+91 98765 43210',
  email: 'info@trufocus.photos',
  support_email: 'support@trufocus.photos',
  website: 'https://trufocus.photos',
  is_email_verified: true,
  is_phone_verified: true,

  // Section 3 - Business Address
  address_line_1: 'Studio #102, Premier Heritage Heights',
  address_line_2: '100 Feet Road, Indiranagar',
  landmark: 'Near Metro Station',
  city: 'Bengaluru',
  district: 'Bengaluru Urban',
  state: 'Karnataka',
  country: 'India',
  pincode: '560038',
  google_maps_url: '',
  latitude: '',
  longitude: '',

  // Section 4
  white_logo_url: '',
  dark_logo_url: '',
  favicon_url: '',
  primary_color: '#5B3FD9',
  secondary_color: '#1E1B3A',
  accent_color: '#10B981',
  heading_font: 'Inter',
  body_font: 'Inter',

  // Section 5
  instagram_url: '',
  facebook_url: '',
  threads_url: '',
  linkedin_url: '',
  youtube_url: '',
  pinterest_url: '',
  google_business_url: '',
  behance_url: '',
  other_website_url: '',

  // Section 6
  documents: [],

  // Section 7
  bank_name: '',
  account_holder: '',
  account_number: '',
  ifsc_code: '',
  branch: '',
  upi_id: '',
  qr_code_url: '',

  // Section 8
  currency: 'INR ₹',
  timezone: 'Asia/Kolkata',
  date_format: 'DD/MM/YYYY',
  opening_time: '09:00 AM',
  closing_time: '08:00 PM',
  working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  gst_percentage: 18,
  invoice_prefix: 'INV-',
  quotation_prefix: 'QT-',
  workorder_prefix: 'WO-',
  enquiry_prefix: 'ENQ-',
  receipt_prefix: 'RCT-',

  created_at: '2024-01-01T00:00:00Z',
  updated_at: new Date().toISOString(),
}

function broadcastProfileUpdate() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('workOrdersUpdated'))
      window.dispatchEvent(new CustomEvent('trufocus_business_profile_updated'))
    }
  } catch (e) {
    console.error('Error broadcasting profile update:', e)
  }
}

export function loadBusinessProfile(): BusinessProfileData {
  try {
    const raw = localStorage.getItem(BUSINESS_PROFILE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error loading business profile:', e)
  }
  return DEFAULT_BUSINESS_PROFILE
}

export function saveBusinessProfile(profile: BusinessProfileData): boolean {
  try {
    const updated = {
      ...profile,
      updated_at: new Date().toISOString(),
    }
    localStorage.setItem(BUSINESS_PROFILE_KEY, JSON.stringify(updated))
    pushEntityToCloud('business_profile', 'main', updated)
    broadcastProfileUpdate()
    return true
  } catch (e) {
    console.error('Error saving business profile to localStorage:', e)
    try {
      const lightweight = {
        ...profile,
        documents: [],
        updated_at: new Date().toISOString(),
      }
      localStorage.setItem(BUSINESS_PROFILE_KEY, JSON.stringify(lightweight))
      broadcastProfileUpdate()
      return true
    } catch (err2) {
      console.error('Critical storage quota failure:', err2)
      return false
    }
  }
}

export function resetBusinessProfile(): BusinessProfileData {
  saveBusinessProfile(DEFAULT_BUSINESS_PROFILE)
  return DEFAULT_BUSINESS_PROFILE
}

export function exportBusinessProfileJSON(): string {
  const data = loadBusinessProfile()
  return JSON.stringify(data, null, 2)
}

export function importBusinessProfileJSON(jsonString: string): { success: boolean; data?: BusinessProfileData; message: string } {
  try {
    const parsed = JSON.parse(jsonString) as BusinessProfileData
    if (!parsed.business_name || !parsed.email) {
      return { success: false, message: 'Invalid JSON format: missing business name or email.' }
    }
    saveBusinessProfile(parsed)
    return { success: true, data: parsed, message: '🎉 Business Profile imported successfully!' }
  } catch {
    return { success: false, message: 'Failed to parse JSON file.' }
  }
}
