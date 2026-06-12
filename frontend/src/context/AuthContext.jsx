import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../lib/api.js'

const AuthContext = createContext(null)
const TOKEN_KEY = 'gp_token'
const DEV_USER_KEY = 'gp_dev_user'
const USER_KEY = 'gp_user'

const devUsers = {
  kaoyan: { id: 'dev-1', name: '考研测试用户', target: 'kaoyan', email: 'kaoyan@test.local', role: 'user', status: 'normal' },
  kaogong: { id: 'dev-2', name: '考公测试用户', target: 'kaogong', email: 'kaogong@test.local', role: 'user', status: 'normal' },
  job: { id: 'dev-3', name: '就业测试用户', target: 'job', email: 'job@test.local', role: 'user', status: 'normal' },
  liuxue: { id: 'dev-4', name: '留学测试用户', target: 'liuxue', email: 'liuxue@test.local', role: 'user', status: 'normal' },
  admin: { id: 'dev-0', name: '管理员测试用户', target: 'job', email: 'admin@test.local', role: 'admin', status: 'normal' },
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const hasRealToken = Boolean(token && token !== 'dev-token')
  const isAuthed = token === 'dev-token'
    ? Boolean(user)
    : Boolean(user) || (loading && hasRealToken)

  useEffect(() => {
    let active = true
    const restoreCachedUser = () => {
      const raw = localStorage.getItem(USER_KEY)
      if (!raw) return null
      try {
        return JSON.parse(raw)
      } catch {
        localStorage.removeItem(USER_KEY)
        return null
      }
    }

    const clearRealSession = () => {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      if (active) {
        setToken('')
        setUser(null)
      }
    }

    async function init() {
      if (token && token !== 'dev-token') {
        const cachedUser = restoreCachedUser()
        if (cachedUser && active) {
          setUser(cachedUser)
        }
        try {
          const me = await authApi.me(token)
          localStorage.removeItem(DEV_USER_KEY)
          localStorage.setItem(USER_KEY, JSON.stringify(me))
          if (active) {
            setUser(me)
          }
        } catch (err) {
          const status = err?.status
          if (status === 401 || status === 403) {
            clearRealSession()
          } else if (!cachedUser && active) {
            setUser(null)
          }
        } finally {
          if (active) {
            setLoading(false)
          }
        }
        return
      }

      // 开发模式：通过 localStorage 设置模拟用户，无需后端
      const devTarget = localStorage.getItem(DEV_USER_KEY)
      if (devTarget && devUsers[devTarget]) {
        const devUser = devUsers[devTarget]
        localStorage.setItem(USER_KEY, JSON.stringify(devUser))
        if (active) {
          setToken('dev-token')
          setUser(devUser)
          setLoading(false)
        }
        return
      }

      setLoading(false)
    }
    init()
    return () => {
      active = false
    }
  }, [token])

  function switchDevUser(target) {
    if (!target) {
      localStorage.removeItem(DEV_USER_KEY)
      localStorage.removeItem(USER_KEY)
      setToken('')
      setUser(null)
      return
    }
    const devUser = devUsers[target]
    if (devUser) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.setItem(DEV_USER_KEY, target)
      localStorage.setItem(USER_KEY, JSON.stringify(devUser))
      setToken('dev-token')
      setUser(devUser)
    }
  }

  async function login(payload) {
    const auth = await authApi.login(payload)
    localStorage.removeItem(DEV_USER_KEY)
    localStorage.setItem(TOKEN_KEY, auth.token)
    localStorage.setItem(USER_KEY, JSON.stringify(auth))
    setToken(auth.token)
    setUser(auth)
    return auth
  }

  async function register(payload) {
    const auth = await authApi.register(payload)
    localStorage.removeItem(DEV_USER_KEY)
    localStorage.setItem(TOKEN_KEY, auth.token)
    localStorage.setItem(USER_KEY, JSON.stringify(auth))
    setToken(auth.token)
    setUser(auth)
    return auth
  }

  async function logout() {
    try {
      if (token && token !== 'dev-token') {
        await authApi.logout(token)
      }
    } catch {
      // ignore network/logout failures for local session cleanup
    }
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(DEV_USER_KEY)
    localStorage.removeItem(USER_KEY)
    setToken('')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthed,
        login,
        register,
        logout,
        switchDevUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
