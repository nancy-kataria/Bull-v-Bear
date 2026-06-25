'use client'

import { useState } from 'react'
import { signUpWithEmail, signInWithGoogle } from '@/app/auth/actions'
import { useRouter } from 'next/navigation'
import { X, Loader2 } from 'lucide-react'
interface SignUpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SignUpModal({ isOpen, onClose }: SignUpModalProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const result = await signUpWithEmail(email, password, name)

      if (!result.success) {
        setError(result.error || 'Failed to sign up')
        setLoading(false)
        return
      }

      // Show success message
      setSuccess(true)
      setName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')

      // Redirect to /dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
        onClose()
      }, 1500)
    } catch {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError('')
    setLoading(true)
    await signInWithGoogle()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-8 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Create Account</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-surface transition"
            aria-label="Close modal"
            disabled={loading}
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="rounded-lg border border-bull/40 bg-bull-dim/20 px-4 py-4 text-sm text-bull">
              ✓ Account created successfully!
            </div>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </div>
        ) : (
          <>
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none transition focus:border-system focus:shadow-[0_0_0_2px_rgba(0,0,0,0.1)]"
                  disabled={loading}
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none transition focus:border-system focus:shadow-[0_0_0_2px_rgba(0,0,0,0.1)]"
                  disabled={loading}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none transition focus:border-system focus:shadow-[0_0_0_2px_rgba(0,0,0,0.1)]"
                  disabled={loading}
                />
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none transition focus:border-system focus:shadow-[0_0_0_2px_rgba(0,0,0,0.1)]"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="rounded-lg border border-bear/40 bg-bear-dim/20 px-4 py-2.5 text-sm text-bear">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !name || !email || !password || !confirmPassword}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-system px-5 py-3 text-sm font-semibold text-system-foreground transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {loading ? 'Signing up...' : 'Sign up with Google'}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Already have an account?{' '}
              <button 
                type="button"
                onClick={onClose}
                className="text-system hover:underline"
              >
                Sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
