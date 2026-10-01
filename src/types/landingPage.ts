export interface LandingPageSettings {
  id: string
  public_id: string
  cover_image_url: string
  headline: string
  description: string
  hero_title?: string
  hero_subtitle?: string
  submit_button_text: string
  success_message: string
  footer_text: string

  // Branding
  logo_url: string
  company_name: string
  primary_color: string
  accent_color?: string
  button_color: string
  bg_color: string

  // Section Toggles
  show_trust_bar?: boolean
  show_reviews?: boolean
  show_portfolio?: boolean

  // Field Toggles
  show_venue: boolean
  show_location: boolean
  show_guests_count: boolean
  show_budget: boolean
  show_email: boolean
  show_source: boolean
  show_contact_time: boolean
  show_special_requirements: boolean
  show_instagram_username: boolean
  show_referral_name: boolean

  // Social & Direct Contacts
  phone_number?: string
  whatsapp_number?: string
  instagram_url?: string
  facebook_url?: string
  website_url?: string
  youtube_url?: string

  updated_at: string
}

export interface PublicEnquiryFormPayload {
  customer_name: string
  mobile: string
  whatsapp_mobile?: string
  whatsapp_same_as_mobile?: boolean
  event_type: string
  event_date: string
  venue?: string
  location?: string
  city?: string
  guests_count?: number
  budget?: number | string
  budget_tier?: string
  email?: string
  source?: string
  contact_time?: string
  special_requirements?: string
  inspiration_links?: string
  instagram_username?: string
  referral_name?: string
}
