'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getUser } from '@/app/auth/get-session'

export function useProtected() {
  const router = useRouter()

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth-user'],
    queryFn: () => getUser(),
    staleTime: 0,
    retry: false,
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/')
    }
  }, [isLoading, user, router])

  return { isLoading, isAuthenticated: !!user }
}
