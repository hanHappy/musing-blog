'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // 이미 로그인된 경우 /admin으로 리디렉션
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/admin')
      }
    }
    checkSession()
  }, [router, supabase.auth])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      // 관리자 이메일 확인
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
      if (data.user?.email !== adminEmail) {
        await supabase.auth.signOut()
        setError('Unauthorized. Admin access only.')
        setLoading(false)
        return
      }

      // 성공 - /admin으로 리디렉션
      router.push('/admin')
    } catch (_err) {
      console.error('Login error:', _err);
      setError('An unexpected error occurred.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 로고/타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
            muse.log
          </h1>
          <div className="w-16 h-1 mx-auto" style={{ background: 'var(--color-primary)' }}></div>
        </div>

        {/* 로그인 카드 */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 text-center">Login to Admin</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm text-center" style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--color-primary)',
              color: 'var(--color-primary)'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* 이메일 입력 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border outline-none transition-all"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary)'
                  e.target.style.boxShadow = 'var(--shadow-md)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)'
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="admin@example.com"
              />
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border outline-none transition-all"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary)'
                  e.target.style.boxShadow = 'var(--shadow-md)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)'
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="••••••••"
              />
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium transition-all"
              style={{
                background: loading ? 'var(--text-muted)' : 'var(--color-primary)',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'var(--color-primary-light)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'var(--color-primary)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        {/* 하단 안내 */}
        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Admin access only. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  )
}
