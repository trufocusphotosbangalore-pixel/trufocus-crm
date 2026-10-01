import React, { useState } from 'react'
import {
  Building2,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Globe,
  CreditCard,
  CheckCircle2,
  Image,
  Award,
  Hash,
} from 'lucide-react'
import { loadBusinessProfile, saveBusinessProfile } from '@/services/businessProfileStore'
import type { BusinessProfileData } from '@/types/businessProfile'
import { toast } from 'react-hot-toast'

export function BusinessProfileTab() {
  const [profile, setProfile] = useState<BusinessProfileData>(() => loadBusinessProfile())
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = (field: keyof BusinessProfileData, value: any) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    // Sync business_name with brand_name for backward compatibility
    const updated: BusinessProfileData = {
      ...profile,
      business_name: profile.brand_name || profile.business_name || 'Trufocus Photos',
    }

    const ok = saveBusinessProfile(updated)
    setIsSaving(false)

    if (ok) {
      toast.success('🎉 Business profile & legal branding saved successfully!')
      setProfile(loadBusinessProfile())
    } else {
      toast.error('Failed to save business profile.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans text-xs">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
            <Building2 size={24} />
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-[#111827]">Business Profile & Branding Layer</h2>
            <p className="text-xs text-gray-500">
              Separate customer-facing brand identity (<span className="font-extrabold text-[#5B3FD9]">{profile.brand_name || 'Trufocus Photos'}</span>) from legal company compliance (<span className="font-extrabold text-gray-700">{profile.legal_company_name || 'Chaaya AI Technologies Private Limited'}</span>)
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-2 shadow-md shadow-[#5B3FD9]/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 size={16} /> Save Business Profile
        </button>
      </div>

      {/* Section 1: Brand & Legal Identity */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 text-sm font-bold text-gray-800">
          <Award size={18} className="text-[#5B3FD9]" />
          <span>Brand Identity & Legal Ownership</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block font-extrabold text-gray-700 mb-1">
              Customer Brand Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Trufocus Photos"
              value={profile.brand_name || ''}
              onChange={(e) => handleChange('brand_name', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
            <p className="text-[10px] text-gray-500 mt-1">Displayed on customer portal, quotes & receipts</p>
          </div>

          <div>
            <label className="block font-extrabold text-gray-700 mb-1">
              Parent Brand Line *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. A Brand of Chaaya AI Technologies Private Limited"
              value={profile.parent_company_line || ''}
              onChange={(e) => handleChange('parent_company_line', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
            <p className="text-[10px] text-gray-500 mt-1">Displayed under logo on GST Invoices & Quotes</p>
          </div>

          <div>
            <label className="block font-extrabold text-gray-700 mb-1">
              Legal Company Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Chaaya AI Technologies Private Limited"
              value={profile.legal_company_name || ''}
              onChange={(e) => handleChange('legal_company_name', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 font-extrabold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
            <p className="text-[10px] text-gray-500 mt-1">Used in legal compliance, GST invoices & tax audit</p>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Business Tagline</label>
            <input
              type="text"
              placeholder="Capturing Timeless Moments & Studio Productions"
              value={profile.tagline || ''}
              onChange={(e) => handleChange('tagline', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Authorized Representative</label>
            <input
              type="text"
              placeholder="e.g. Trufocus Studio Owner"
              value={profile.owner_name || ''}
              onChange={(e) => handleChange('owner_name', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
              <Image size={13} className="text-[#5B3FD9]" /> Brand Logo URL
            </label>
            <input
              type="text"
              placeholder="/trufocus_logo.png"
              value={profile.logo_url || ''}
              onChange={(e) => handleChange('logo_url', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Tax & Registration */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 text-sm font-bold text-gray-800">
          <ShieldCheck size={18} className="text-[#5B3FD9]" />
          <span>Tax & Statutory Compliance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-extrabold text-gray-700 mb-1">GSTIN Number</label>
            <input
              type="text"
              placeholder="29AAAAA0000A1Z5"
              value={profile.gst_number || ''}
              onChange={(e) => handleChange('gst_number', e.target.value.toUpperCase())}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block font-extrabold text-gray-700 mb-1">PAN Number</label>
            <input
              type="text"
              placeholder="AAAAA0000A"
              value={profile.pan_number || ''}
              onChange={(e) => handleChange('pan_number', e.target.value.toUpperCase())}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">CIN / Registration #</label>
            <input
              type="text"
              placeholder="U72900KA2024PTC000000"
              value={profile.registration_number || ''}
              onChange={(e) => handleChange('registration_number', e.target.value.toUpperCase())}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Document Number Prefixes */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 text-sm font-bold text-gray-800">
          <Hash size={18} className="text-[#5B3FD9]" />
          <span>Document Numbering Prefixes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block font-extrabold text-gray-700 mb-1">Invoice Prefix</label>
            <input
              type="text"
              placeholder="INV-"
              value={profile.invoice_prefix || 'INV-'}
              onChange={(e) => handleChange('invoice_prefix', e.target.value.toUpperCase())}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block font-extrabold text-gray-700 mb-1">Receipt Prefix</label>
            <input
              type="text"
              placeholder="RCT-"
              value={profile.receipt_prefix || 'RCT-'}
              onChange={(e) => handleChange('receipt_prefix', e.target.value.toUpperCase())}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block font-extrabold text-gray-700 mb-1">Quotation Prefix</label>
            <input
              type="text"
              placeholder="QUO-"
              value={profile.quotation_prefix || 'QUO-'}
              onChange={(e) => handleChange('quotation_prefix', e.target.value.toUpperCase())}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block font-extrabold text-gray-700 mb-1">Work Order Prefix</label>
            <input
              type="text"
              placeholder="WO-"
              value={profile.workorder_prefix || 'WO-'}
              onChange={(e) => handleChange('workorder_prefix', e.target.value.toUpperCase())}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Address & Contact Details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 text-sm font-bold text-gray-800">
          <MapPin size={18} className="text-[#5B3FD9]" />
          <span>Address & Communication Channels</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block font-bold text-gray-700 mb-1">Street Address</label>
            <input
              type="text"
              placeholder="123 Studio Main Road, Indiranagar"
              value={profile.address_line_1 || ''}
              onChange={(e) => handleChange('address_line_1', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">City</label>
            <input
              type="text"
              placeholder="Bengaluru"
              value={profile.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">State</label>
            <input
              type="text"
              placeholder="Karnataka"
              value={profile.state || ''}
              onChange={(e) => handleChange('state', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Pincode</label>
            <input
              type="text"
              placeholder="560038"
              value={profile.pincode || ''}
              onChange={(e) => handleChange('pincode', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
              <Mail size={13} className="text-[#5B3FD9]" /> Primary Email Address
            </label>
            <input
              type="email"
              placeholder="contact@trufocusphotos.com"
              value={profile.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
              <Phone size={13} className="text-[#5B3FD9]" /> Phone / Mobile Number
            </label>
            <input
              type="text"
              placeholder="+91 98765 43210"
              value={profile.primary_mobile || ''}
              onChange={(e) => handleChange('primary_mobile', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
              <Globe size={13} className="text-[#5B3FD9]" /> Website URL
            </label>
            <input
              type="text"
              placeholder="https://trufocusphotos.com"
              value={profile.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>
        </div>
      </div>

      {/* Section 5: Banking & UPI Details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 text-sm font-bold text-gray-800">
          <CreditCard size={18} className="text-[#5B3FD9]" />
          <span>Bank Account & UPI Payment Details</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Bank Name</label>
            <input
              type="text"
              placeholder="HDFC Bank"
              value={profile.bank_name || ''}
              onChange={(e) => handleChange('bank_name', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Account Holder Name</label>
            <input
              type="text"
              placeholder="Chaaya AI Technologies Pvt Ltd"
              value={profile.account_holder || ''}
              onChange={(e) => handleChange('account_holder', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Account Number</label>
            <input
              type="text"
              placeholder="50200012345678"
              value={profile.account_number || ''}
              onChange={(e) => handleChange('account_number', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">IFSC Code</label>
            <input
              type="text"
              placeholder="HDFC0001234"
              value={profile.ifsc_code || ''}
              onChange={(e) => handleChange('ifsc_code', e.target.value.toUpperCase())}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Branch</label>
            <input
              type="text"
              placeholder="Indiranagar Branch, Bengaluru"
              value={profile.branch || ''}
              onChange={(e) => handleChange('branch', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">UPI ID</label>
            <input
              type="text"
              placeholder="trufocus@hdfcbank"
              value={profile.upi_id || ''}
              onChange={(e) => handleChange('upi_id', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-300 font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>
        </div>
      </div>
    </form>
  )
}
