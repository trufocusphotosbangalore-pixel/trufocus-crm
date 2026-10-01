import type { LandingPageSettings, PublicEnquiryFormPayload } from '@/types/landingPage'
import type { Enquiry } from '@/types/enquiries'
import { fetchEnquiriesLocal } from './supabase/enquiries'
import { broadcastPaymentSync } from '@/hooks/useRealtimeSync'

const LANDING_SETTINGS_KEY = 'trufocus_crm_landing_settings_v1'

export const DEFAULT_LANDING_SETTINGS: LandingPageSettings = {
  id: 'lp-default',
  public_id: 'TRF-LP-2026',
  cover_image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1600',
  headline: 'Your Wedding Deserves More Than Just Photos.',
  description: 'Luxury Wedding Photography & Cinematic Films',
  hero_title: 'TRUFOCUS PHOTOGRAPHY',
  hero_subtitle: 'Your Event, Online and On Point.',
  submit_button_text: 'Reserve My Date',
  success_message: 'Your enquiry has been received. Our wedding consultant will contact you shortly.',
  footer_text: '© 2026 TRUFOCUS PHOTOGRAPHY. All rights reserved.',

  logo_url: '',
  company_name: 'TRUFOCUS PHOTOGRAPHY',
  primary_color: '#111111',
  accent_color: '#D4AF37',
  button_color: '#111111',
  bg_color: '#0A0A0A',

  show_trust_bar: true,
  show_reviews: true,
  show_portfolio: true,

  show_venue: true,
  show_location: true,
  show_guests_count: true,
  show_budget: true,
  show_email: true,
  show_source: true,
  show_contact_time: false,
  show_special_requirements: true,
  show_instagram_username: true,
  show_referral_name: true,

  phone_number: '919071114965',
  whatsapp_number: '919071114965',
  instagram_url: 'https://instagram.com/trufocusphotos',
  facebook_url: 'https://facebook.com/trufocusphotos',
  website_url: 'https://trufocus.photos',
  youtube_url: 'https://youtube.com',

  updated_at: new Date().toISOString(),
}

export function getLandingPageSettings(): LandingPageSettings {
  try {
    const raw = localStorage.getItem(LANDING_SETTINGS_KEY)
    if (raw) return { ...DEFAULT_LANDING_SETTINGS, ...JSON.parse(raw) }
  } catch (e) {
    console.error('Error reading landing page settings', e)
  }
  return DEFAULT_LANDING_SETTINGS
}

export function saveLandingPageSettings(settings: LandingPageSettings): void {
  try {
    localStorage.setItem(LANDING_SETTINGS_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Error saving landing page settings', e)
  }
}

export interface SubmitResult {
  success: boolean
  error?: string
  enquiry?: Enquiry
}

export function submitPublicEnquiry(payload: PublicEnquiryFormPayload): SubmitResult {
  try {
    const existing = fetchEnquiriesLocal()
    const cleanMobile = payload.mobile.replace(/\D/g, '')

    // 1. Check Duplicate Mobile
    const duplicate = existing.find(
      e => e.mobile.replace(/\D/g, '') === cleanMobile && e.status !== 'rejected'
    )

    if (duplicate) {
      return {
        success: false,
        error: `An enquiry already exists for mobile number ${payload.mobile} (Enquiry #${duplicate.enquiry_number}). Our team will reach out to you shortly.`,
      }
    }

    // 2. Auto-Generate Sequential Enquiry Number (ENQ-2026-XXXX)
    const year = new Date().getFullYear()
    let maxNum = 0
    existing.forEach(e => {
      const match = e.enquiry_number.match(/ENQ-\d+-(\d+)/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (!isNaN(num) && num > maxNum) maxNum = num
      }
    })
    const nextNum = maxNum + 1
    const seqStr = nextNum.toString().padStart(4, '0')
    const enquiryNumber = `ENQ-${year}-${seqStr}`
    const now = new Date().toISOString()

    const formattedCity = payload.city || payload.location || ''
    const budgetVal = payload.budget ? Number(payload.budget) : null

    const newEnquiry: Enquiry = {
      id: `enq-pub-${Date.now()}`,
      enquiry_number: enquiryNumber,
      customer_name: payload.customer_name.trim(),
      mobile: payload.mobile.trim(),
      alternate_mobile: payload.whatsapp_mobile?.trim() || null,
      email: payload.email?.trim() || null,
      event_type: (payload.event_type as any) || 'wedding',
      event_date: payload.event_date || null,
      event_time: null,
      venue: payload.venue?.trim() || null,
      location: formattedCity,
      budget: budgetVal,
      source: (payload.source as any) || 'whatsapp',
      status: 'new',
      assigned_to: null,
      assigned_to_name: 'Unassigned (New Lead)',
      notes: `[Luxury Onboarding] Budget Tier: ${payload.budget_tier || 'N/A'}. ${payload.special_requirements ? 'Requirements: ' + payload.special_requirements : ''} ${payload.inspiration_links ? 'Inspiration: ' + payload.inspiration_links : ''}`,
      preferred_contact_method: 'whatsapp',
      deleted_at: null,
      created_by: 'public_landing_page',
      created_at: now,
      updated_at: now,
    }

    const updatedList = [newEnquiry, ...existing]
    localStorage.setItem('trufocus_crm_enquiries_v1', JSON.stringify(updatedList))

    // 3. Broadcast Real-Time Cross-Tab & Cross-Device Sync
    broadcastPaymentSync({
      type: 'NEW_ENQUIRY',
      enquiryNumber: newEnquiry.enquiry_number,
      customerName: newEnquiry.customer_name,
    })

    return { success: true, enquiry: newEnquiry }
  } catch (err) {
    console.error('Error submitting public enquiry', err)
    return {
      success: false,
      error: 'Unable to submit enquiry due to a system error. Please try again or contact Trufocus Photography directly.',
    }
  }
}
