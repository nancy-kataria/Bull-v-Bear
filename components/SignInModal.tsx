'use client'

import { useState } from 'react'
import { signInWithEmail } from '@/app/auth/actions'
import { useRouter } from 'next/navigation'
import { X, Loader2 } from 'lucide-react'
import type { SignInModalProps } from '@/types'

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signInWithEmail(email, password)
      
      if (!result.success) {
        setError(result.error || 'Failed to sign in')
        setLoading(false)
        return
      }

      // Redirect to /chat on successful login
      router.push('/chat')
    } catch {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-8 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Sign In</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-surface transition"
            aria-label="Close modal"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-bear/40 bg-bear-dim/20 px-4 py-2.5 text-sm text-bear">
              {error}
            </div>
          )}

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-system px-5 py-3 text-sm font-semibold text-system-foreground transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{' '}
          <a href="#" className="text-system hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
