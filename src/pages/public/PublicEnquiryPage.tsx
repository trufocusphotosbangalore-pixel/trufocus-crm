import React, { useState, useRef } from 'react'
import {
  CheckCircle2, MessageCircle, ArrowRight, ShieldCheck,
  Phone, Star, Clock, Sparkles, ChevronLeft, Heart, ExternalLink,
  MapPin,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { getLandingPageSettings, submitPublicEnquiry } from '@/services/landingPageStore'
import { loadBusinessProfile } from '@/services/businessProfileStore'
import type { Enquiry } from '@/types/enquiries'
import { toast } from 'react-hot-toast'

const EVENT_TYPE_OPTIONS = [
  { id: 'wedding', label: 'Wedding', icon: '💍' },
  { id: 'reception', label: 'Reception', icon: '🥂' },
  { id: 'engagement', label: 'Engagement', icon: '💎' },
  { id: 'haldi', label: 'Haldi / Mehendi', icon: '🌼' },
  { id: 'pre_wedding', label: 'Pre Wedding', icon: '📸' },
  { id: 'destination_wedding', label: 'Destination Wedding', icon: '✈️' },
  { id: 'birthday', label: 'Birthday', icon: '🎂' },
  { id: 'corporate', label: 'Corporate', icon: '💼' },
  { id: 'naming_ceremony', label: 'Naming Ceremony', icon: '👶' },
  { id: 'baby_shower', label: 'Baby Shower', icon: '🍼' },
  { id: 'housewarming', label: 'Housewarming', icon: '🏡' },
]

const BUDGET_TIERS = [
  'Under ₹75K',
  '₹75K–₹1.5L',
  '₹1.5L–₹3L',
  '₹3L+',
  'Custom Budget',
]

export default function PublicEnquiryPage() {
  const settings = getLandingPageSettings()
  const bizProfile = loadBusinessProfile()
  const formRef = useRef<HTMLDivElement>(null)

  // Step State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  // Form Fields State
  const [customerName, setCustomerName] = useState('')
  const [mobile, setMobile] = useState('')
  const [whatsappMobile, setWhatsappMobile] = useState('')
  const [sameAsMobile, setSameAsMobile] = useState(true)

  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(['wedding'])
  const [eventDate, setEventDate] = useState('')
  const [city, setCity] = useState('')
  const [venue, setVenue] = useState('')

  const [budgetTier, setBudgetTier] = useState('₹1.5L–₹3L')
  const [specialRequirements, setSpecialRequirements] = useState('')
  const [inspirationLinks, setInspirationLinks] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedEnquiry, setSubmittedEnquiry] = useState<Enquiry | null>(null)

  const toggleEventType = (id: string) => {
    if (selectedEventTypes.includes(id)) {
      if (selectedEventTypes.length === 1) {
        toast.error('Please keep at least one event type selected.', { id: 'min-event-type' })
        return
      }
      setSelectedEventTypes(selectedEventTypes.filter((t) => t !== id))
    } else {
      setSelectedEventTypes([...selectedEventTypes, id])
    }
  }

  const handleNextStep = (targetStep: 2 | 3) => {
    if (currentStep === 1) {
      if (!customerName.trim()) {
        toast.error('Please enter your full name.')
        return
      }
      if (!mobile.trim() || mobile.trim().length < 10) {
        toast.error('Please enter a valid 10-digit mobile number.')
        return
      }
    }

    if (currentStep === 2 && targetStep === 3) {
      if (selectedEventTypes.length === 0) {
        toast.error('Please select at least one event type.')
        return
      }
      if (!eventDate) {
        toast.error('Please select your event date.')
        return
      }
    }

    setCurrentStep(targetStep)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSameAsMobileToggle = (checked: boolean) => {
    setSameAsMobile(checked)
    if (checked) {
      setWhatsappMobile(mobile)
    }
  }

  const handleMobileChange = (val: string) => {
    setMobile(val)
    if (sameAsMobile) {
      setWhatsappMobile(val)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName.trim() || !mobile.trim() || !eventDate || selectedEventTypes.length === 0) {
      toast.error('Please complete all required fields.')
      return
    }

    const formattedEventTypes = selectedEventTypes
      .map((id) => EVENT_TYPE_OPTIONS.find((opt) => opt.id === id)?.label || id)
      .join(', ')

    setIsSubmitting(true)
    setTimeout(() => {
      const res = submitPublicEnquiry({
        customer_name: customerName,
        mobile,
        whatsapp_mobile: sameAsMobile ? mobile : whatsappMobile,
        whatsapp_same_as_mobile: sameAsMobile,
        event_type: formattedEventTypes,
        event_date: eventDate,
        city: city || 'Bangalore',
        venue: venue || '',
        budget_tier: budgetTier,
        special_requirements: specialRequirements,
        inspiration_links: inspirationLinks,
        source: 'whatsapp',
      })

      setIsSubmitting(false)

      if (res.success && res.enquiry) {
        setSubmittedEnquiry(res.enquiry)
        toast.success(`🎉 Reservation requested! Reference: #${res.enquiry.enquiry_number}`)
      } else {
        toast.error(res.error || 'Unable to submit enquiry. Please try again.')
      }
    }, 600)
  }

  const companyLogo = bizProfile.logo_url || settings.logo_url
  const companyPhone = bizProfile.primary_mobile || settings.phone_number || '9071114965'
  const companyWhatsapp = bizProfile.whatsapp_number || settings.whatsapp_number || '9071114965'
  const companyWebsite = bizProfile.website || settings.website_url || 'https://trufocus.photos'
  const companyEmail = bizProfile.email || 'info@trufocusphotos.com'

  const fullStudioAddress = [
    bizProfile.address_line_1,
    bizProfile.address_line_2,
    bizProfile.landmark,
    bizProfile.city,
    bizProfile.state && bizProfile.pincode ? `${bizProfile.state} - ${bizProfile.pincode}` : bizProfile.pincode,
  ].filter(Boolean).join(', ') || '2934, Triveni Arcade, First Floor, 2nd Stage, Rajajinagar, Bangalore - 560010'

  const handleWhatsAppChat = () => {
    const cleanPhone = companyWhatsapp.replace(/\D/g, '')
    const message = submittedEnquiry
      ? `Hi TRUFOCUS PHOTOGRAPHY, I just submitted enquiry #${submittedEnquiry.enquiry_number} for my ${submittedEnquiry.event_type} on ${submittedEnquiry.event_date}. My name is ${submittedEnquiry.customer_name}.`
      : `Hi TRUFOCUS PHOTOGRAPHY, I would like to check availability for photography services.`
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleDirectCall = () => {
    const cleanPhone = companyPhone.replace(/\D/g, '')
    window.location.href = `tel:+91${cleanPhone}`
  }

  // ─── THANK YOU SCREEN (FULLY AUDITED) ───────────────────────────────────────
  if (submittedEnquiry) {
    return (
      <div className="min-h-screen bg-[#0F172A] font-sans text-white flex items-center justify-center p-4 sm:p-6 selection:bg-[#D4AF37] selection:text-white">
        <div className="max-w-lg w-full bg-[#252F45] rounded-[20px] border border-[#334155] shadow-2xl p-6 sm:p-8 text-center space-y-6 animate-in fade-in duration-300">
          {/* Top Gold Badge */}
          <div className="size-20 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border-2 border-[#D4AF37] flex items-center justify-center mx-auto shadow-xl shadow-[#D4AF37]/20">
            <CheckCircle2 size={42} />
          </div>

          <div className="space-y-2">
            <span style={{ color: '#D4AF37' }} className="text-xs font-mono font-bold uppercase tracking-widest bg-[#D4AF37]/10 px-4 py-1 rounded-full border border-[#D4AF37]/30 inline-block">
              Reservation Confirmed
            </span>
            <h2 style={{ color: '#FFFFFF' }} className="text-2xl sm:text-3xl font-black pt-2">
              🎉 Thank You, <span style={{ color: '#D4AF37' }}>{submittedEnquiry.customer_name}</span>!
            </h2>
            <p style={{ color: '#D1D5DB' }} className="text-xs font-medium leading-relaxed max-w-sm mx-auto">
              Your enquiry has been received. Our luxury wedding consultant will contact you shortly to prepare your customized quotation.
            </p>
          </div>

          {/* Reference Card */}
          <div className="p-4 rounded-[16px] bg-[#1B2336] border border-[#334155] text-xs space-y-2.5 text-left font-mono">
            <div className="flex justify-between items-center border-b border-[#334155] pb-2">
              <span style={{ color: '#CBD5E1' }} className="font-semibold text-[10px] uppercase">Reference Number:</span>
              <span style={{ color: '#D4AF37' }} className="font-extrabold text-sm">{submittedEnquiry.enquiry_number}</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: '#CBD5E1' }} className="font-semibold text-[10px] uppercase">Event Type:</span>
              <span style={{ color: '#FFFFFF' }} className="font-bold capitalize">{submittedEnquiry.event_type}</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: '#CBD5E1' }} className="font-semibold text-[10px] uppercase">Event Date:</span>
              <span style={{ color: '#FFFFFF' }} className="font-bold">{submittedEnquiry.event_date}</span>
            </div>
          </div>

          {/* Direct Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleWhatsAppChat}
              style={{ color: '#FFFFFF' }}
              className="w-full h-14 rounded-[16px] bg-[#25D366] hover:bg-[#20bd5a] font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <MessageCircle size={20} /> 📱 Chat on WhatsApp
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDirectCall}
                style={{ color: '#FFFFFF' }}
                className="h-12 rounded-[16px] bg-[#D4AF37] hover:bg-[#F4D58D] hover:text-[#0F172A] font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md border-2 border-[#D4AF37]"
              >
                <Phone size={15} /> 📞 Call Now
              </button>

              <a
                href={companyWebsite}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#FFFFFF' }}
                className="h-12 rounded-[16px] bg-[#1B2336] border border-[#334155] hover:bg-[#252F45] font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ExternalLink size={15} /> 🏠 Visit Website
              </a>
            </div>
          </div>

          <p style={{ color: '#CBD5E1' }} className="text-[10px] font-semibold">
            © {new Date().getFullYear()} TRUFOCUS PHOTOGRAPHY • All rights reserved.
          </p>
        </div>
      </div>
    )
  }

  // ─── MAIN LUXURY ONBOARDING PAGE (FULLY AUDITED) ─────────────────────────────
  return (
    <div className="min-h-screen bg-[#0F172A] font-sans pb-24 selection:bg-[#D4AF37] selection:text-white">
      {/* ─── HERO BANNER SECTION ─── */}
      <div className="relative min-h-[500px] sm:min-h-[560px] flex flex-col justify-between p-6 sm:p-10 overflow-hidden border-b border-[#334155]">
        {/* Background Image with Midnight Navy Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url(${settings.cover_image_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/90 via-[#0F172A]/80 to-[#0F172A]" />

        {/* Brand Header Bar */}
        <div className="relative z-10 max-w-4xl mx-auto w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt="TRUFOCUS"
                className="max-h-14 object-contain"
              />
            ) : null}
            <div>
              <h1 style={{ color: '#F8FAFC' }} className="text-lg sm:text-xl font-black uppercase tracking-wider">
                TRUFOCUS <span style={{ color: '#D4AF37' }}>PHOTOGRAPHY</span>
              </h1>
              <p style={{ color: '#D4AF37' }} className="text-xs font-bold tracking-tight mt-0.5">
                Your Event, Online and On Point.
              </p>
            </div>
          </div>

          <div style={{ color: '#FFFFFF' }} className="hidden sm:flex items-center gap-2 bg-[#252F45]/80 backdrop-blur-md px-4 py-2 rounded-full border border-[#D4AF37]/40 text-xs font-extrabold shadow-lg">
            <Star size={14} className="fill-[#D4AF37] text-[#D4AF37]" />
            <span style={{ color: '#FFFFFF' }}>4.9 / 5.0 Rating</span>
          </div>
        </div>

        {/* Hero Title & Headline */}
        <div className="relative z-10 max-w-4xl mx-auto w-full text-center my-auto py-10 space-y-4">
          <div style={{ color: '#D4AF37' }} className="inline-flex items-center gap-2 bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-md">
            <Sparkles size={14} /> Luxury Client Onboarding
          </div>

          <h2 style={{ color: '#FFFFFF' }} className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight max-w-2xl mx-auto">
            Your Event Deserves <br />
            <span style={{ color: '#D4AF37' }}>
              More Than Just Photos.
            </span>
          </h2>

          <p style={{ color: '#D1D5DB' }} className="text-sm sm:text-base font-medium max-w-lg mx-auto leading-relaxed">
            Luxury Wedding Photography & Cinematic Films. Capturing timeless emotions with high-end craftsmanship.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-extrabold pt-3">
            <div className="flex items-center gap-1.5" style={{ color: '#CBD5E1' }}>
              <Star size={16} className="fill-[#D4AF37] text-[#D4AF37]" />
              <span style={{ color: '#CBD5E1' }}>4.9 Google Rating</span>
            </div>
            <span style={{ color: '#D4AF37' }}>•</span>
            <div className="flex items-center gap-1.5" style={{ color: '#CBD5E1' }}>
              <Heart size={16} className="text-[#D4AF37]" />
              <span style={{ color: '#CBD5E1' }}>1000+ Happy Couples</span>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              style={{ color: '#FFFFFF' }}
              className="px-8 h-14 rounded-[16px] bg-[#D4AF37] hover:bg-[#F4D58D] hover:text-[#0F172A] font-black text-sm inline-flex items-center gap-2 shadow-2xl transition-all transform hover:scale-105 cursor-pointer border-2 border-[#D4AF37]"
            >
              <span>Check Availability</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── TRUST BAR ─── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#252F45] border border-[#334155] p-4 rounded-[20px] text-center space-y-1 shadow-xl">
            <div className="size-10 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center mx-auto text-xl font-bold">
              📷
            </div>
            <span style={{ color: '#FFFFFF' }} className="block font-black text-lg">1000+</span>
            <span style={{ color: '#CBD5E1' }} className="text-[10px] font-extrabold uppercase tracking-wider block">Events Covered</span>
          </div>

          <div className="bg-[#252F45] border border-[#334155] p-4 rounded-[20px] text-center space-y-1 shadow-xl">
            <div className="size-10 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center mx-auto text-xl font-bold">
              ⭐
            </div>
            <span style={{ color: '#FFFFFF' }} className="block font-black text-lg">4.9 / 5</span>
            <span style={{ color: '#CBD5E1' }} className="text-[10px] font-extrabold uppercase tracking-wider block">Google Rating</span>
          </div>

          <div className="bg-[#252F45] border border-[#334155] p-4 rounded-[20px] text-center space-y-1 shadow-xl">
            <div className="size-10 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center mx-auto text-xl font-bold">
              ⚡
            </div>
            <span style={{ color: '#FFFFFF' }} className="block font-black text-lg">48 Hours</span>
            <span style={{ color: '#CBD5E1' }} className="text-[10px] font-extrabold uppercase tracking-wider block">Quick Response</span>
          </div>

          <div className="bg-[#252F45] border border-[#334155] p-4 rounded-[20px] text-center space-y-1 shadow-xl">
            <div className="size-10 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center mx-auto text-xl font-bold">
              🏆
            </div>
            <span style={{ color: '#FFFFFF' }} className="block font-black text-lg">Premium</span>
            <span style={{ color: '#CBD5E1' }} className="text-[10px] font-extrabold uppercase tracking-wider block">Experience</span>
          </div>
        </div>
      </div>

      {/* ─── 3-STEP LUXURY WIZARD FORM ─── */}
      <div ref={formRef} className="max-w-2xl mx-auto px-4 sm:px-6 pt-12">
        <div className="bg-[#252F45] rounded-[20px] border border-[#334155] p-6 sm:p-10 shadow-2xl space-y-8">
          {/* Progress Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span style={{ color: '#D4AF37' }} className="uppercase tracking-wider text-xs font-black">
                Step {currentStep} of 3 • {currentStep === 1 ? 'Your Details' : currentStep === 2 ? 'Event Details' : 'Budget & Inspiration'}
              </span>
              <span style={{ color: '#CBD5E1' }} className="flex items-center gap-1 font-mono text-xs font-bold">
                <Clock size={13} className="text-[#D4AF37]" /> ~45 seconds remaining
              </span>
            </div>

            {/* Progress Bar Indicator */}
            <div className="grid grid-cols-3 gap-2">
              <div className={cn('h-2 rounded-full transition-all duration-300', currentStep >= 1 ? 'bg-[#D4AF37]' : 'bg-[#1B2336]')} />
              <div className={cn('h-2 rounded-full transition-all duration-300', currentStep >= 2 ? 'bg-[#D4AF37]' : 'bg-[#1B2336]')} />
              <div className={cn('h-2 rounded-full transition-all duration-300', currentStep >= 3 ? 'bg-[#D4AF37]' : 'bg-[#1B2336]')} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ─── STEP 1: YOUR DETAILS ─── */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-[#334155] pb-4">
                  <h3 style={{ color: '#F8FAFC' }} className="text-2xl font-black">Your Contact Details</h3>
                  <p style={{ color: '#D1D5DB' }} className="text-xs font-medium mt-1">Provide your name and contact number for instant availability check.</p>
                </div>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label style={{ color: '#CBD5E1' }} className="block text-xs font-extrabold uppercase tracking-wider">
                      Full Name <span style={{ color: '#D4AF37' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{ color: '#FFFFFF' }}
                      className="w-full h-14 px-4 rounded-[16px] bg-[#1B2336] border border-[#334155] text-sm font-semibold placeholder:text-[#CBD5E1]/60 focus:outline-none focus:border-[#D4AF37] focus:bg-[#1F293D] transition-all"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-2">
                    <label style={{ color: '#CBD5E1' }} className="block text-xs font-extrabold uppercase tracking-wider">
                      Mobile Number <span style={{ color: '#D4AF37' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9886184495"
                      value={mobile}
                      onChange={(e) => handleMobileChange(e.target.value)}
                      style={{ color: '#FFFFFF' }}
                      className="w-full h-14 px-4 rounded-[16px] bg-[#1B2336] border border-[#334155] text-sm font-mono font-semibold placeholder:text-[#CBD5E1]/60 focus:outline-none focus:border-[#D4AF37] focus:bg-[#1F293D] transition-all"
                    />
                  </div>

                  {/* WhatsApp Checkbox */}
                  <div className="pt-2">
                    <label style={{ color: '#FFFFFF' }} className="flex items-center gap-3 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sameAsMobile}
                        onChange={(e) => handleSameAsMobileToggle(e.target.checked)}
                        className="size-5 rounded accent-[#D4AF37]"
                      />
                      <span style={{ color: '#FFFFFF' }}>WhatsApp number is the same as Mobile Number</span>
                    </label>
                  </div>

                  {/* WhatsApp Number (if different) */}
                  {!sameAsMobile && (
                    <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                      <label style={{ color: '#CBD5E1' }} className="block text-xs font-extrabold uppercase tracking-wider">
                        WhatsApp Number <span style={{ color: '#D4AF37' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9886184495"
                        value={whatsappMobile}
                        onChange={(e) => setWhatsappMobile(e.target.value)}
                        style={{ color: '#FFFFFF' }}
                        className="w-full h-14 px-4 rounded-[16px] bg-[#1B2336] border border-[#334155] text-sm font-mono font-semibold placeholder:text-[#CBD5E1]/60 focus:outline-none focus:border-[#D4AF37] focus:bg-[#1F293D] transition-all"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => handleNextStep(2)}
                    style={{ color: '#FFFFFF' }}
                    className="w-full h-14 rounded-[16px] bg-[#D4AF37] hover:bg-[#F4D58D] hover:text-[#0F172A] font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer border-2 border-[#D4AF37]"
                  >
                    <span>Continue to Event Details</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 2: EVENT DETAILS ─── */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-[#334155] pb-4">
                  <h3 style={{ color: '#F8FAFC' }} className="text-2xl font-black">Event & Location Details</h3>
                  <p style={{ color: '#D1D5DB' }} className="text-xs font-medium mt-1">Select your event type and target dates.</p>
                </div>

                {/* Event Type Visual Cards Grid */}
                <div className="space-y-2">
                  <label style={{ color: '#CBD5E1' }} className="block text-xs font-extrabold uppercase tracking-wider">
                    Select Event Type <span style={{ color: '#D4AF37' }}>*</span>
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {EVENT_TYPE_OPTIONS.map((opt) => {
                      const isSelected = selectedEventTypes.includes(opt.id)
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleEventType(opt.id)}
                          style={{ color: '#FFFFFF' }}
                          className={cn(
                            'p-3.5 rounded-[16px] border text-left flex items-center justify-between gap-2 transition-all cursor-pointer font-bold',
                            isSelected
                              ? 'bg-[#D4AF37] border-2 border-[#D4AF37] font-black shadow-lg shadow-[#D4AF37]/20 hover:text-[#0F172A]'
                              : 'bg-[#1B2336] border-[#334155] hover:border-[#F4D58D] hover:bg-[#1F293D]'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl shrink-0">{opt.icon}</span>
                            <span style={{ color: '#FFFFFF' }} className="text-xs font-extrabold truncate">{opt.label}</span>
                          </div>
                          {isSelected && (
                            <CheckCircle2 size={16} className="text-white shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Event Date */}
                  <div className="space-y-2">
                    <label style={{ color: '#CBD5E1' }} className="block text-xs font-extrabold uppercase tracking-wider">
                      Event Date <span style={{ color: '#D4AF37' }}>*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      style={{ color: '#FFFFFF' }}
                      className="w-full h-14 px-4 rounded-[16px] bg-[#1B2336] border border-[#334155] text-sm font-mono font-semibold focus:outline-none focus:border-[#D4AF37] focus:bg-[#1F293D] transition-all"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <label style={{ color: '#CBD5E1' }} className="block text-xs font-extrabold uppercase tracking-wider">
                      City / Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bangalore, Mysore"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{ color: '#FFFFFF' }}
                      className="w-full h-14 px-4 rounded-[16px] bg-[#1B2336] border border-[#334155] text-sm font-semibold placeholder:text-[#CBD5E1]/60 focus:outline-none focus:border-[#D4AF37] focus:bg-[#1F293D] transition-all"
                    />
                  </div>
                </div>

                {/* Venue Name */}
                <div className="space-y-2">
                  <label style={{ color: '#CBD5E1' }} className="block text-xs font-extrabold uppercase tracking-wider">
                    Venue Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Triveni Arcade / Palace Grounds"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    style={{ color: '#FFFFFF' }}
                    className="w-full h-14 px-4 rounded-[16px] bg-[#1B2336] border border-[#334155] text-sm font-semibold placeholder:text-[#CBD5E1]/60 focus:outline-none focus:border-[#D4AF37] focus:bg-[#1F293D] transition-all"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    style={{ color: '#FFFFFF' }}
                    className="h-14 px-6 rounded-[16px] bg-[#1B2336] border border-[#334155] font-extrabold text-xs hover:bg-[#1F293D] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNextStep(3)}
                    style={{ color: '#FFFFFF' }}
                    className="flex-1 h-14 rounded-[16px] bg-[#D4AF37] hover:bg-[#F4D58D] hover:text-[#0F172A] font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer border-2 border-[#D4AF37]"
                  >
                    <span>Continue to Budget</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 3: BUDGET & INSPIRATION ─── */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-[#334155] pb-4">
                  <h3 style={{ color: '#F8FAFC' }} className="text-2xl font-black">Budget & Vision</h3>
                  <p style={{ color: '#D1D5DB' }} className="text-xs font-medium mt-1">Help us customize your package options.</p>
                </div>

                {/* Budget Selection Chips */}
                <div className="space-y-2">
                  <label style={{ color: '#CBD5E1' }} className="block text-xs font-extrabold uppercase tracking-wider">
                    Estimated Budget Range
                  </label>

                  <div className="flex flex-wrap gap-2.5">
                    {BUDGET_TIERS.map((tier) => {
                      const isSelected = budgetTier === tier
                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setBudgetTier(tier)}
                          style={{ color: '#FFFFFF' }}
                          className={cn(
                            'px-4 py-3 rounded-[16px] border text-xs font-black transition-all cursor-pointer',
                            isSelected
                              ? 'bg-[#D4AF37] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 hover:text-[#0F172A]'
                              : 'bg-[#1B2336] border-[#334155] hover:border-[#F4D58D] hover:bg-[#1F293D]'
                          )}
                        >
                          {tier}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Special Requirements */}
                <div className="space-y-2">
                  <label style={{ color: '#CBD5E1' }} className="block text-xs font-extrabold uppercase tracking-wider">
                    Special Requirements & Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about your event timeline, specific deliverables required (albums, reels, drone), or preferences..."
                    value={specialRequirements}
                    onChange={(e) => setSpecialRequirements(e.target.value)}
                    style={{ color: '#FFFFFF' }}
                    className="w-full p-4 rounded-[16px] bg-[#1B2336] border border-[#334155] text-sm font-semibold placeholder:text-[#CBD5E1]/60 focus:outline-none focus:border-[#D4AF37] focus:bg-[#1F293D] transition-all resize-none"
                  />
                </div>

                {/* Inspiration Links */}
                <div className="space-y-2">
                  <label style={{ color: '#CBD5E1' }} className="block text-xs font-extrabold uppercase tracking-wider">
                    Inspiration Photos / Pinterest Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="Paste Pinterest moodboard link or Instagram link..."
                    value={inspirationLinks}
                    onChange={(e) => setInspirationLinks(e.target.value)}
                    style={{ color: '#FFFFFF' }}
                    className="w-full h-14 px-4 rounded-[16px] bg-[#1B2336] border border-[#334155] text-sm font-mono font-semibold placeholder:text-[#CBD5E1]/60 focus:outline-none focus:border-[#D4AF37] focus:bg-[#1F293D] transition-all"
                  />
                </div>

                {/* Security Note */}
                <div className="p-4 rounded-[16px] bg-[#1B2336] border border-[#334155] flex items-center justify-center gap-2 text-xs font-bold">
                  <ShieldCheck size={18} className="text-[#D4AF37] shrink-0" />
                  <span style={{ color: '#D1D5DB' }}>🔒 Your information is secure and will only be used for preparing your quotation.</span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    style={{ color: '#FFFFFF' }}
                    className="h-14 px-6 rounded-[16px] bg-[#1B2336] border border-[#334155] font-extrabold text-xs hover:bg-[#1F293D] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{ color: '#FFFFFF' }}
                    className="flex-1 h-14 rounded-[16px] bg-[#D4AF37] hover:bg-[#F4D58D] hover:text-[#0F172A] font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all transform hover:scale-[1.02] cursor-pointer border-2 border-[#D4AF37] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Reserving Date...</span>
                    ) : (
                      <>
                        <span>Reserve My Date</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* ─── DYNAMIC STUDIO CONTACT & ADDRESS CARD ─── */}
        <div className="mt-8 p-6 rounded-[20px] bg-[#252F45] border border-[#334155] text-center space-y-3 shadow-xl">
          <div>
            <h4 style={{ color: '#F8FAFC' }} className="text-base font-black uppercase tracking-wider">
              {bizProfile.business_name || 'TRUFOCUS PHOTOGRAPHY'}
            </h4>
            <p style={{ color: '#D4AF37' }} className="text-xs font-bold mt-0.5">
              {bizProfile.tagline || 'Your Event, Online and On Point.'}
            </p>
          </div>

          <p style={{ color: '#D1D5DB' }} className="text-xs font-semibold max-w-md mx-auto leading-relaxed">
            <MapPin size={13} className="inline text-[#D4AF37] mr-1" />
            <span style={{ color: '#D1D5DB' }}>{fullStudioAddress}</span>
          </p>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-2 text-xs font-bold border-t border-[#334155]">
            <span style={{ color: '#FFFFFF' }} className="flex items-center gap-1">📞 <span style={{ color: '#CBD5E1' }}>{companyPhone}</span></span>
            <span style={{ color: '#FFFFFF' }} className="flex items-center gap-1">✉ <span style={{ color: '#CBD5E1' }}>{companyEmail}</span></span>
            <span style={{ color: '#FFFFFF' }} className="flex items-center gap-1">🌐 <span style={{ color: '#CBD5E1' }}>{companyWebsite.replace(/https?:\/\//, '')}</span></span>
          </div>
        </div>
      </div>

      {/* ─── FLOATING ACTION BUTTONS ─── */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={handleWhatsAppChat}
          style={{ color: '#FFFFFF' }}
          className="size-14 rounded-full bg-[#25D366] text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
          title="Chat on WhatsApp"
        >
          <MessageCircle size={28} />
        </button>
      </div>

      <div className="fixed bottom-5 left-5 z-40">
        <button
          onClick={handleDirectCall}
          style={{ color: '#FFFFFF' }}
          className="size-14 rounded-full bg-[#D4AF37] hover:text-[#0F172A] shadow-2xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer font-bold border-2 border-[#D4AF37]"
          title="Call Studio"
        >
          <Phone size={24} />
        </button>
      </div>

      {/* ─── MOBILE STICKY BOTTOM BAR ─── */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-[#0F172A]/95 backdrop-blur-md border-t border-[#334155] p-3 flex items-center justify-between gap-3">
        <div>
          <span style={{ color: '#CBD5E1' }} className="block text-[10px] font-extrabold uppercase">TRUFOCUS PHOTOGRAPHY</span>
          <span style={{ color: '#D4AF37' }} className="text-xs font-black">Limited Availability</span>
        </div>
        <button
          onClick={() => {
            if (currentStep === 3) {
              const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement
              submitBtn?.click()
            } else {
              formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }}
          style={{ color: '#FFFFFF' }}
          className="px-5 h-11 rounded-[12px] bg-[#D4AF37] hover:bg-[#F4D58D] hover:text-[#0F172A] font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer border-2 border-[#D4AF37]"
        >
          <span>{currentStep === 3 ? 'Reserve Date' : 'Check Availability'}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
