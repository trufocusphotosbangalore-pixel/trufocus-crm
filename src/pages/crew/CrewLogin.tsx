import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyStaffPin } from '@/services/crewAuthService'
import { setCrewSession } from '@/services/crewSessionService'
import { ArrowRight, User } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function CrewLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefillId = searchParams.get('id') || ''

  const [identifier, setIdentifier] = useState(prefillId)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePinKeyClick = (val: string) => {
    if (val === 'clear') {
      setPin('')
    } else if (val === 'backspace') {
      setPin((prev) => prev.slice(0, -1))
    } else {
      if (pin.length < 6) {
        setPin((prev) => prev + val)
      }
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) {
      toast.error('Please enter your Employee ID or Mobile Number.')
      return
    }
    if (!pin || pin.length < 4) {
      toast.error('Please enter your 4-digit Staff PIN.')
      return
    }

    setLoading(true)
    try {
      const res = await verifyStaffPin(identifier.trim(), pin)
      if (res.success && res.employee) {
        setCrewSession(res.employee)
        toast.success(`Welcome back, ${res.employee.employee_name || res.employee.full_name}!`)
        navigate('/crew/dashboard', { replace: true })
      } else {
        toast.error(res.message || 'Authentication failed.')
      }
    } catch (err: any) {
      console.error('Crew Login Error:', err)
      toast.error('Failed to authenticate. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center p-4 font-sans text-gray-900">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="size-14 rounded-2xl bg-[#5B3FD9] text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-md shadow-[#5B3FD9]/20">
            TC
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Trufocus <span className="text-[#5B3FD9]">Crew</span>
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Staff Portal • Enter credentials or PIN to access your workspace
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">
              Employee ID / Mobile Number
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. EMP-1002 or 9876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-50 border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9] focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">
              4-Digit Access PIN
            </label>
            <input
              type="password"
              maxLength={6}
              placeholder="••••"
              value={pin}
              readOnly
              className="w-full h-12 text-center text-xl tracking-widest font-extrabold rounded-xl bg-slate-50 border border-gray-200 text-[#5B3FD9] focus:outline-none"
            />
          </div>

          {/* Onscreen Numpad */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handlePinKeyClick(key)}
                className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 border border-gray-200 text-sm font-extrabold text-gray-900 flex items-center justify-center transition-all cursor-pointer"
              >
                {key === 'clear' ? 'C' : key === 'backspace' ? '⌫' : key}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : <>Login to Crew Portal <ArrowRight size={16} /></>}
          </button>
        </form>
      </div>
    </div>
  )
}
