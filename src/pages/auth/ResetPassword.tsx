import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const { success, error: showError } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<typeof form>>({})

  const validate = () => {
    const e: Partial<typeof form> = {}
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (!form.confirm) e.confirm = 'Please confirm your password'
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Password strength
  const getStrength = (pw: string): { label: string; color: string; width: string } => {
    if (pw.length === 0) return { label: '', color: '', width: '0%' }
    const hasUpper = /[A-Z]/.test(pw)
    const hasLower = /[a-z]/.test(pw)
    const hasNumber = /\d/.test(pw)
    const hasSpecial = /[^A-Za-z0-9]/.test(pw)
    const score = [pw.length >= 8, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length
    if (score <= 2) return { label: 'Weak', color: 'bg-[var(--color-error)]', width: '33%' }
    if (score <= 3) return { label: 'Fair', color: 'bg-[var(--color-warning)]', width: '66%' }
    return { label: 'Strong', color: 'bg-[var(--color-success)]', width: '100%' }
  }

  const strength = getStrength(form.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    try {
      await updatePassword(form.password)
      success('Password updated successfully!')
      navigate('/dashboard')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Set new password</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Choose a strong password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <Input
            id="reset-password"
            label="New password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            error={errors.password}
            leftIcon={<Lock size={15} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="hover:text-[var(--color-text-primary)] transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
            autoComplete="new-password"
            autoFocus
          />
          {form.password.length > 0 && (
            <div className="mt-2">
              <div className="h-1 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className="text-xs mt-1 text-[var(--color-text-muted)]">
                Strength: <span className="font-medium text-[var(--color-text-secondary)]">{strength.label}</span>
              </p>
            </div>
          )}
        </div>

        <Input
          id="reset-confirm"
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Repeat your password"
          value={form.confirm}
          onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
          error={errors.confirm}
          leftIcon={
            form.confirm && form.confirm === form.password
              ? <CheckCircle size={15} className="text-[var(--color-success)]" />
              : <Lock size={15} />
          }
          autoComplete="new-password"
        />

        <Button type="submit" fullWidth isLoading={isLoading} id="reset-submit" className="mt-2">
          Update password
        </Button>
      </form>
    </div>
  )
}
