export type BusinessType =
  | 'Photography Studio'
  | 'Photography & Videography'
  | 'Event Management'
  | 'Production House'
  | 'Other'

export interface BusinessDocumentFile {
  id: string
  name: string
  category: 'GST Certificate' | 'PAN Card' | 'Business Registration' | 'MSME Certificate' | 'Logo File' | 'Brand Guidelines'
  url: string
  file_size: string
  uploaded_at: string
}

export interface BusinessProfileData {
  // Section 1 - Business Information
  logo_url: string
  digital_signature_url?: string
  cover_image_url: string
  brand_name: string
  parent_company_line: string
  legal_company_name: string
  business_name: string
  tagline: string
  owner_name: string
  gst_number: string
  pan_number: string
  registration_number: string
  established_year: string
  business_type: BusinessType

  // Section 2 - Contact Information
  primary_mobile: string
  secondary_mobile: string
  whatsapp_number: string
  email: string
  support_email: string
  website: string
  is_email_verified: boolean
  is_phone_verified: boolean

  // Section 3 - Business Address
  address_line_1: string
  address_line_2: string
  landmark: string
  city: string
  district: string
  state: string
  country: string
  pincode: string
  google_maps_url: string
  latitude: string
  longitude: string

  // Section 4 - Branding
  white_logo_url: string
  dark_logo_url: string
  favicon_url: string
  primary_color: string
  secondary_color: string
  accent_color: string
  heading_font: string
  body_font: string

  // Section 5 - Social Media
  instagram_url: string
  facebook_url: string
  threads_url: string
  linkedin_url: string
  youtube_url: string
  pinterest_url: string
  google_business_url: string
  behance_url: string
  other_website_url: string

  // Section 6 - Documents
  documents: BusinessDocumentFile[]

  // Section 7 - Banking Details
  bank_name: string
  account_holder: string
  account_number: string
  ifsc_code: string
  branch: string
  upi_id: string
  qr_code_url: string

  // Section 8 - Default Business Settings
  currency: string
  timezone: string
  date_format: string
  opening_time: string
  closing_time: string
  working_days: string[]
  gst_percentage: number
  invoice_prefix: string
  quotation_prefix: string
  workorder_prefix: string
  enquiry_prefix: string
  receipt_prefix: string

  created_at: string
  updated_at: string
}
