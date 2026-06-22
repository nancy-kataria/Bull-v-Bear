'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUser } from '@/app/auth/get-session'

export function useProtected() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        const user = await getUser()
        if (isMounted) {
          if (!user) {
            router.replace('/')
          } else {
            setIsAuthenticated(true)
          }
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        if (isMounted) {
          router.replace('/')
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [router])

  return { isLoading, isAuthenticated }
}
