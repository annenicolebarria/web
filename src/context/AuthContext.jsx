import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
const API_URL = 'http://72.61.125.98:3001/api/auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in from localStorage (token)
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      // Verify token with backend
      verifyToken(token)
        .then(userData => {
          if (userData) {
            setUser(JSON.parse(savedUser))
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        })
        .catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${API_URL}/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        return data.user
      }
      return null
    } catch (error) {
      console.error('Token verification error:', error)
      return null
    }
  }

  const login = async (userData, token) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', token)

    // Save user profile for admin dashboard visibility
    const userId = userData.id || userData.email
    if (userId) {
      const profileKey = `user_profile_${userId}`
      localStorage.setItem(profileKey, JSON.stringify({
        name: userData.name,
        username: userData.username,
        email: userData.email,
        role: userData.role || 'user',
        isAdmin: userData.isAdmin || false,
        lastLogin: new Date().toISOString()
      }))
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  const signup = async (userData, token) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', token)

    // Save user profile for admin dashboard visibility
    const userId = userData.id || userData.email
    if (userId) {
      const profileKey = `user_profile_${userId}`
      localStorage.setItem(profileKey, JSON.stringify({
        name: userData.name,
        username: userData.username,
        email: userData.email,
        role: userData.role || 'user',
        isAdmin: userData.isAdmin || false,
        createdAt: new Date().toISOString()
      }))
    }
  }

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData)
    localStorage.setItem('user', JSON.stringify(updatedUserData))
  }

  // Check if user is admin
  const isAdmin = () => {
    if (!user) return false
    // Check if user has admin role or is admin email
    const adminEmails = ['admin@ecosphere.com', 'admin@ecosphereplatform.com']
    return user.role === 'admin' || user.isAdmin === true || (user.email && adminEmails.includes(user.email.toLowerCase()))
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, updateUser, loading, API_URL, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
