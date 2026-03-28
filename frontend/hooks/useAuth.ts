'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User, Session } from '@supabase/supabase-js';

// Create browser client using @supabase/ssr
// This correctly handles cookie setting unlike the plain supabase-js client
function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function useAuth() {
  const [user,    setUser]    = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    const supabase = getSupabase()
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase()
    return supabase.auth.signInWithPassword({ email, password })
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase()
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
  }, [])

  const signInWithGitHub = useCallback(async () => {
    const supabase = getSupabase()
    return supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabase()
    return supabase.auth.signOut()
  }, [])

  const getToken = useCallback(async () => {
    const supabase = getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ''
  }, [])

  return {
    user, session, loading,
    isAuthenticated: !!user,
    signUp, signIn,
    signInWithGoogle, signInWithGitHub,
    signOut, getToken,
  }
}
