import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const { error: showError } = useToast()

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [emailError, setEmailError] = useState('')

  const validate = () => {
    if (!email) { setEmailError('Email is required'); return false }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('Enter a valid email'); return false }
    setEmailError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    try {
      await resetPassword(email)
      setIsSuccess(true)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-4">
        <div className="flex justify-center mb-4">
          <div className="size-12 rounded-full bg-[var(--color-success-light)] flex items-center justify-center">
            <CheckCircle size={24} className="text-[var(--color-success)]" />
          </div>
        </div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Check your email</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          We've sent a password reset link to <strong className="text-[var(--color-text-primary)]">{email}</strong>.
          Please check your inbox.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
        >
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Reset password</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="forgot-email"
          label="Email address"
          type="email"
          placeholder="you@trufocus.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          leftIcon={<Mail size={15} />}
          autoComplete="email"
          autoFocus
        />

        <Button type="submit" fullWidth isLoading={isLoading} id="forgot-submit">
          Send reset link
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    </div>
  )
}
