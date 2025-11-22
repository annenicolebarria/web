import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Lock, Camera, Save, ArrowLeft } from 'lucide-react'
import Modal from '../components/Modal'

export default function UserSettings() {
  const navigate = useNavigate()
  const { user, updateUser, API_URL } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' })

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    profilePicture: null,
    profilePicturePreview: null,
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Load user data
  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // Load user profile data from localStorage (includes profile picture)
    const userId = user.id || user.email
    if (userId) {
      const profileKey = `user_profile_${userId}`
      const savedProfile = localStorage.getItem(profileKey)

      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile)
          setFormData({
            name: profile.name || user.name || '',
            username: profile.username || user.username || '',
            email: profile.email || user.email || '',
            profilePicture: profile.profilePicture || null,
            profilePicturePreview: profile.profilePicture || null,
          })
        } catch (error) {
          console.error('Error loading profile:', error)
        }
      } else {
        // Initialize with current user data
        setFormData({
          name: user.name || '',
          username: user.username || '',
          email: user.email || '',
          profilePicture: null,
          profilePicturePreview: null,
        })
      }
    }
  }, [user, navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
    setSuccess('')
  }

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setModal({
        isOpen: true,
        title: 'Invalid File',
        message: 'Please select an image file.',
        type: 'warning'
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setModal({
        isOpen: true,
        title: 'File Too Large',
        message: 'Image must be less than 5MB.',
        type: 'warning'
      })
      return
    }

    // Read file as base64
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        profilePicture: reader.result,
        profilePicturePreview: reader.result
      }))
    }
    reader.readAsDataURL(file)
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const userId = user.id || user.email
      if (!userId) {
        setError('User ID not found')
        setLoading(false)
        return
      }

      // Save profile data to localStorage
      const profileKey = `user_profile_${userId}`
      const profileData = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        profilePicture: formData.profilePicture,
      }

      localStorage.setItem(profileKey, JSON.stringify(profileData))

      // Update user in context and localStorage
      const updatedUser = {
        ...user,
        name: formData.name,
        username: formData.username,
        email: formData.email,
        profilePicture: formData.profilePicture,
      }

      updateUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))

      setSuccess('Profile updated successfully!')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
      setError('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('All password fields are required')
      setLoading(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    try {
      // Call backend API to change password
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setModal({
          isOpen: true,
          title: 'Success',
          message: 'Password changed successfully!',
          type: 'success'
        })
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        setError(data.error || 'Failed to change password')
      }
    } catch (error) {
      console.error('Password change error:', error)
      setError('Failed to connect to server. Please check if the backend server is running.')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Back</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your account information and preferences</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Picture Section */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Camera className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Profile Picture</h2>
            </div>

            <div className="flex items-center space-x-6">
              <div className="relative">
                {formData.profilePicturePreview ? (
                  <img
                    src={formData.profilePicturePreview}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary-200"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center border-4 border-primary-200">
                    <span className="text-3xl font-bold text-white">
                      {getInitials(formData.name || formData.username || user.name || user.username)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                  <span className="btn-primary cursor-pointer inline-flex items-center space-x-2">
                    <Camera className="w-4 h-4" />
                    <span>Change Photo</span>
                  </span>
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Note: Changing email may require verification
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Password Change Section */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Lock className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>{loading ? 'Changing...' : 'Change Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  )
}

