import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, Lock, User, ArrowRight, ShieldCheck, Cloud, Smartphone,
  Zap, Database, Sparkles, CheckCircle2, Phone, Mail, Globe, MapPin,
  MessageCircle, Users, CreditCard, Image,
  BarChart3, ClipboardList, MessageSquare,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'
import * as authService from '@/services/authService'
import { loadBusinessProfile } from '@/services/businessProfileStore'

export default function Login() {
  const { signIn } = useAuth()
  const { success, error: showError } = useToast()
  const navigate = useNavigate()

  // Dynamic Business Profile & Official Logo Hook
  const [bizProfile, setBizProfile] = useState(() => loadBusinessProfile())
  const [logoSrc, setLogoSrc] = useState(
    () => bizProfile.logo_url || '/trufocus_logo.png'
  )

  useEffect(() => {
    const handleProfileSync = () => {
      const updated = loadBusinessProfile()
      setBizProfile(updated)
      setLogoSrc(updated.logo_url || '/trufocus_logo.png')
    }
    window.addEventListener('trufocus_business_profile_updated', handleProfileSync)
    return () => window.removeEventListener('trufocus_business_profile_updated', handleProfileSync)
  }, [])

  // Form state
  const [form, setForm] = useState({ usernameOrEmail: '', password: '' })
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.usernameOrEmail.trim()) e.usernameOrEmail = 'Username or Email is required.'
    if (!form.password) e.password = 'Password is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)

    const rawInput = form.usernameOrEmail.trim()
    console.log('[Auth Step 1] Username/Email received:', rawInput)

    try {
    // Step 2: Resolve Email from login identifier via AuthService
    const resolvedEmail = await authService.resolveLoginIdentifier(rawInput)
      console.log('[Auth Step 2 Completed] Resolved login email to:', resolvedEmail)

      // Step 3-6: Execute Supabase Auth & DB session creation
      await signIn(resolvedEmail, form.password)
      success('Authenticated successfully. Welcome to Trufocus CRM!')
      navigate('/dashboard')
    } catch (err) {
      console.error('[Auth Exception]:', err)
      showError(err instanceof Error ? err.message : 'Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }

  // Quick Demo Login Auto-fill
  const fillDemoAccount = (username: string, pass: string) => {
    setForm({ usernameOrEmail: username, password: pass })
    setErrors({})
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1E293B] font-sans flex flex-col justify-between selection:bg-[#2563EB] selection:text-white relative overflow-hidden">
      
      {/* ─── TOP SAAS HEADER / BRAND BAR ─── */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-[#E2E8F0]/60 relative z-10">
        <div className="flex items-center gap-3">
          <img
            src={logoSrc}
            alt="Trufocus Photography Logo"
            className="h-10 sm:h-12 w-auto object-contain max-w-[200px]"
            onError={(e) => {
              // fallback if custom URL fails
              ;(e.target as HTMLImageElement).src = '/trufocus_logo.png'
            }}
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <a
            href={bizProfile.website ? (bizProfile.website.startsWith('http') ? bizProfile.website : `https://${bizProfile.website}`) : 'https://trufocus.photos'}
            target="_blank"
            rel="noreferrer"
            className="text-[#64748B] hover:text-[#2563EB] transition-colors hidden sm:flex items-center gap-1.5"
          >
            <Globe size={14} /> Visit Studio Website
          </a>
          <span className="text-gray-300 hidden sm:inline">•</span>
          <span className="px-3 py-1 rounded-full bg-[#2563EB]/10 text-[#2563EB] font-bold text-[11px] border border-[#2563EB]/20">
            v2.4 Enterprise
          </span>
        </div>
      </header>

      {/* ─── MAIN HERO SPLIT SECTION ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        
        {/* ─── LEFT SIDE: MARKETING & VALUE PROPOSITION ─── */}
        <div className="lg:col-span-7 space-y-8 pr-0 lg:pr-6">
          
          {/* Logo & Headline Badge */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-xs font-bold shadow-2xs">
              <Sparkles size={14} className="animate-pulse" />
              <span>Next-Gen Photography CRM</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0F172A] leading-[1.15]">
              Welcome to <br />
              <span className="bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">
                Trufocus CRM
              </span>
            </h1>

            <p className="text-base sm:text-lg font-semibold text-[#2563EB]">
              Photography & Videography Studio Management Platform
            </p>

            <p className="text-sm text-[#64748B] leading-relaxed max-w-xl font-medium">
              Manage your enquiries, work orders, customer portal, team, finances, galleries, AI assistant and post-production from one beautiful dashboard.
            </p>
          </div>

          {/* ─── 8 FEATURE CARDS GRID ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { label: 'Enquiry Management', icon: MessageSquare },
              { label: 'Work Orders', icon: ClipboardList },
              { label: 'Client Portal', icon: Globe },
              { label: 'Finance & Payments', icon: CreditCard },
              { label: 'Team Assignment', icon: Users },
              { label: 'AI Assistant', icon: Sparkles },
              { label: 'Gallery Delivery', icon: Image },
              { label: 'Analytics & Reports', icon: BarChart3 },
            ].map((feat, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-white hover:shadow-md transition-all group cursor-default flex flex-col justify-between space-y-2"
              >
                <div className="size-8 rounded-xl bg-white border border-[#E2E8F0] group-hover:bg-[#2563EB] group-hover:text-white text-[#2563EB] flex items-center justify-center transition-colors shadow-2xs">
                  <feat.icon size={16} />
                </div>
                <span className="text-xs font-bold text-[#1E293B] group-hover:text-[#2563EB] transition-colors leading-tight">
                  {feat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Luxury Photography Visual Hero Frame */}
          <div className="relative rounded-3xl overflow-hidden border border-[#E2E8F0] bg-gradient-to-br from-[#2563EB]/5 via-[#3B82F6]/10 to-[#F8FAFC] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-sm">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2563EB] bg-[#2563EB]/10 px-2.5 py-0.5 rounded-md">
                Studio Excellence
              </span>
              <h3 className="text-sm font-extrabold text-[#0F172A]">
                Built for High-End Wedding & Event Studios
              </h3>
              <p className="text-xs text-[#64748B]">
                Automate contracts, track lead conversions, dispatch shoot crews, and deliver galleries seamlessly.
              </p>
            </div>

            <div className="flex sm:flex-col gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs text-[11px] font-extrabold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-500" /> 100% Real-time Sync
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs text-[11px] font-extrabold text-[#2563EB] flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#2563EB]" /> GPT-4o AI Studio
              </span>
            </div>
          </div>

        </div>

        {/* ─── RIGHT SIDE: FLOATING GLASS LOGIN CARD ─── */}
        <div className="lg:col-span-5 w-full flex justify-center">
          <div className="w-full max-w-[460px] bg-white/90 backdrop-blur-xl border border-[#E2E8F0] shadow-[0_20px_50px_rgba(37,99,235,0.09)] rounded-[24px] p-6 sm:p-10 space-y-6 relative">
            
            {/* Soft Ambient Glow Effect behind card */}
            <div className="absolute -top-10 -right-10 size-40 bg-[#2563EB]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 size-40 bg-[#60A5FA]/20 rounded-full blur-3xl pointer-events-none" />

            {/* Top Logo & Title */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <img
                  src={logoSrc}
                  alt="Trufocus Logo"
                  className="h-12 sm:h-14 w-auto object-contain max-w-[220px]"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = '/trufocus_logo.png'
                  }}
                />
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A]">
                  Sign in to Trufocus CRM
                </h2>
                <p className="text-xs text-[#64748B] mt-1 font-medium">
                  Secure access to your photography studio dashboard.
                </p>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              
              {/* Username / Email Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-[#334155]">
                  Username or Email
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="e.g. trufocus.admin / photographer01"
                    value={form.usernameOrEmail}
                    onChange={(e) => setForm((f) => ({ ...f, usernameOrEmail: e.target.value }))}
                    className={cn(
                      'w-full h-11 pl-10 pr-3.5 text-xs font-semibold rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A]',
                      'focus:outline-none focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 transition-all',
                      errors.usernameOrEmail && 'border-red-500 focus:border-red-500 focus:ring-red-100'
                    )}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                {errors.usernameOrEmail && (
                  <p className="text-[11px] text-red-500 font-medium">{errors.usernameOrEmail}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-[#334155]">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-bold text-[#2563EB] hover:underline transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3 text-[#94A3B8]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className={cn(
                      'w-full h-11 pl-10 pr-10 text-xs font-semibold rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A]',
                      'focus:outline-none focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 transition-all',
                      errors.password && 'border-red-500 focus:border-red-500 focus:ring-red-100'
                    )}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-3 text-[#94A3B8] hover:text-[#0F172A] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-red-500 font-medium">{errors.password}</p>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]/20 accent-[#2563EB] cursor-pointer"
                  />
                  <span className="text-xs font-medium text-[#475569]">Remember me on this device</span>
                </label>
              </div>

              {/* Primary Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all transform active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-[#E2E8F0] w-full" />
              <span className="bg-white px-3 text-[10px] uppercase font-bold text-[#94A3B8] absolute">
                OR
              </span>
            </div>

            {/* Secondary Google Sign-In Button */}
            <button
              type="button"
              onClick={() => showError('Google Single Sign-On is managed via Supabase Auth.')}
              className="w-full h-11 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#334155] font-extrabold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-2xs"
            >
              <svg className="size-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Quick Demo Test Logins Accordion */}
            <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block text-center">
                Quick Demo Role Auto-Fill
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-bold">
                {[
                  { role: 'Admin', user: 'owner.admin', pass: 'AdminOwner@2026' },
                  { role: 'Photographer', user: 'photographer01', pass: 'photo123' },
                  { role: 'Sales', user: 'sales.manager', pass: 'sales123' },
                  { role: 'Editor', user: 'video.editor', pass: 'edit123' },
                ].map((demo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => fillDemoAccount(demo.user, demo.pass)}
                    className="px-2.5 py-1 rounded-md bg-[#F1F5F9] hover:bg-[#2563EB] hover:text-white text-[#475569] transition-all cursor-pointer"
                  >
                    {demo.role}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* ─── TRUST BADGES SECTION ─── */}
      <section className="w-full bg-[#F8FAFC] border-y border-[#E2E8F0] py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-around gap-6 text-xs font-bold text-[#475569]">
            {[
              { label: 'Enterprise Grade Security', icon: ShieldCheck },
              { label: 'Cloud Sync', icon: Cloud },
              { label: 'Multi Device Access', icon: Smartphone },
              { label: 'Real Time Updates', icon: Zap },
              { label: 'Supabase Powered', icon: Database },
              { label: 'AI Powered Studio', icon: Sparkles },
            ].map((trust, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[#334155] hover:text-[#2563EB] transition-colors">
                <trust.icon size={16} className="text-[#2563EB]" />
                <span>{trust.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATISTICS CARDS GRID ─── */}
      <section className="w-full py-12 bg-white relative z-10 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { number: '10,000+', label: 'Projects Managed', sub: 'Weddings & Events' },
              { number: '98%', label: 'Customer Satisfaction', sub: 'Client Rating' },
              { number: '99.9%', label: 'Cloud Uptime', sub: 'High Availability' },
              { number: '24/7', label: 'Dedicated Support', sub: 'Studio Assistance' },
            ].map((stat, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 shadow-2xs hover:border-[#2563EB] transition-all">
                <span className="text-2xl sm:text-3xl font-black text-[#2563EB] font-mono tracking-tight block">
                  {stat.number}
                </span>
                <span className="text-xs font-extrabold text-[#0F172A] block">
                  {stat.label}
                </span>
                <span className="text-[10px] text-[#64748B] font-medium block">
                  {stat.sub}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER SECTION ─── */}
      <footer className="w-full bg-[#0F172A] text-white py-12 relative z-10 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[#334155]">
            
            {/* Col 1: Logo & Business Info */}
            <div className="md:col-span-5 space-y-3">
              <img
                src={logoSrc}
                alt="Trufocus Photography"
                className="h-10 w-auto object-contain brightness-200 invert max-w-[200px]"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = '/trufocus_logo.png'
                }}
              />
              <p className="text-xs font-bold text-[#60A5FA]">
                {bizProfile.business_name || 'Trufocus Photography'}
              </p>
              <p className="text-xs text-gray-400 max-w-sm italic">
                "{bizProfile.tagline || 'Your Event, Online and On Point.'}"
              </p>
              <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                Comprehensive photography & videography management software engineered for high-growth studios.
              </p>
            </div>

            {/* Col 2: Contact Info */}
            <div className="md:col-span-4 space-y-2 text-xs text-gray-300">
              <span className="text-[10px] font-mono font-bold uppercase text-[#60A5FA] tracking-wider block mb-1">
                Studio Contact Info
              </span>
              <p className="flex items-center gap-2">
                <Phone size={14} className="text-[#60A5FA]" />
                <span>{bizProfile.primary_mobile || '+91 98765 43210'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail size={14} className="text-[#60A5FA]" />
                <span>{bizProfile.email || 'trufocusphotosbangalore@gmail.com'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Globe size={14} className="text-[#60A5FA]" />
                <span>{bizProfile.website || 'trufocus.photos'}</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin size={14} className="text-[#60A5FA]" />
                <span>{bizProfile.city || 'Bangalore'}, {bizProfile.state || 'Karnataka'}, {bizProfile.country || 'India'}</span>
              </p>
            </div>

            {/* Col 3: Social Connections */}
            <div className="md:col-span-3 space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase text-[#60A5FA] tracking-wider block">
                Connect With Us
              </span>
              <div className="flex items-center gap-3">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="size-9 rounded-xl bg-[#1E293B] hover:bg-[#2563EB] text-gray-300 hover:text-white flex items-center justify-center transition-colors"
                  title="Instagram"
                >
                  <svg className="size-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="size-9 rounded-xl bg-[#1E293B] hover:bg-[#2563EB] text-gray-300 hover:text-white flex items-center justify-center transition-colors"
                  title="Facebook"
                >
                  <svg className="size-4 fill-current" viewBox="0 0 24 24">
                    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z" />
                  </svg>
                </a>
                <a
                  href={`https://wa.me/${(bizProfile.primary_mobile || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="size-9 rounded-xl bg-[#1E293B] hover:bg-[#25D366] text-gray-300 hover:text-white flex items-center justify-center transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle size={18} />
                </a>
              </div>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
            <p>© {new Date().getFullYear()} {bizProfile.business_name || 'Trufocus Photography'}. All rights reserved.</p>
            <div className="flex items-center gap-4 text-gray-400 text-xs">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <span>•</span>
              <a href="#" className="hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
