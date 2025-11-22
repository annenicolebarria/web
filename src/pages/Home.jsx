import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Trophy, CheckCircle, Clock, BookOpen, TrendingUp, Award, ChevronDown, ChevronUp, Video, Image, MapPin, FileText, Users, Lightbulb, BarChart2, Megaphone, Palette, Mail, Target, Play, ThumbsUp, ThumbsDown, MessageCircle, User, Maximize2, Minimize2, X } from 'lucide-react'
import IdeaCard from '../components/IdeaCard'
import { getEcoQuestActivities } from '../utils/adminUtils'

// Icon mapping for activities
const iconMap = {
  'video': Video,
  'image': Image,
  'mappin': MapPin,
  'filetext': FileText,
  'users': Users,
  'award': Award,
  'lightbulb': Lightbulb,
  'barchart2': BarChart2,
  'megaphone': Megaphone,
  'trendingup': TrendingUp,
  'palette': Palette,
  'checkcircle': CheckCircle,
  'mail': Mail,
  'target': Target,
}

// Utility function to count completed activities
const countCompletedActivities = (userId) => {
  if (!userId) return 0
  try {
    const key = `activity_completions_${userId}`
    const saved = localStorage.getItem(key)
    if (!saved) return 0

    const completions = JSON.parse(saved)
    let count = 0

    // Count all completed activities across all categories
    Object.keys(completions).forEach(category => {
      if (typeof completions[category] === 'object' && completions[category] !== null) {
        Object.keys(completions[category]).forEach(activityId => {
          // Skip metadata keys like 'completedAt'
          if (activityId !== 'completedAt' && completions[category][activityId] === true) {
            count++
          }
        })
      }
    })

    return count
  } catch (error) {
    console.error('Error counting completed activities:', error)
    return 0
  }
}

// Utility function to get user points
export const getUserPoints = (userId) => {
  if (!userId) return 0 // Default starting points
  try {
    const key = `user_points_${userId}`
    const saved = localStorage.getItem(key)
    const completedCount = countCompletedActivities(userId)

    // Calculate earned points from completed activities
    const earnedPoints = completedCount * 10

    if (saved) {
      const currentPoints = parseInt(saved, 10)
      return currentPoints
    } else {
      // If points don't exist, initialize based on existing completions
      const initialPoints = completedCount * 10 // Start from 0, add 10 per completed activity
      setUserPoints(userId, initialPoints)
      return initialPoints
    }
  } catch (error) {
    console.error('Error getting user points:', error)
    return 0
  }
}

// Utility function to set user points
export const setUserPoints = (userId, points) => {
  if (!userId) return
  try {
    const key = `user_points_${userId}`
    localStorage.setItem(key, points.toString())
  } catch (error) {
    console.error('Error setting user points:', error)
  }
}

// Utility function to count finished articles from existing data
const countFinishedArticles = (userId) => {
  if (!userId) return 0
  try {
    const key = `ecolearn_user_reactions_${userId}`
    const saved = localStorage.getItem(key)
    if (!saved) return 0

    const reactions = JSON.parse(saved)
    let count = 0
    Object.keys(reactions).forEach(articleId => {
      if (reactions[articleId]?.status === 'finished') {
        count++
      }
    })
    return count
  } catch (error) {
    console.error('Error counting finished articles:', error)
    return 0
  }
}

// Utility function to count joined advocacies from existing data
const countJoinedAdvocacies = (userId) => {
  if (!userId) return 0
  try {
    const key = `activista_user_reactions_${userId}`
    const saved = localStorage.getItem(key)
    if (!saved) return 0

    const reactions = JSON.parse(saved)
    let count = 0
    Object.keys(reactions).forEach(postId => {
      if (reactions[postId]?.participating === true) {
        count++
      }
    })
    return count
  } catch (error) {
    console.error('Error counting joined advocacies:', error)
    return 0
  }
}

// Utility function to get user stats
export const getUserStats = (userId) => {
  if (!userId) {
    return {
      articlesRead: 0,
      trendsJoined: 0,
      ideasPosted: 0,
      advocacies: 0
    }
  }
  try {
    const key = `user_stats_${userId}`
    const saved = localStorage.getItem(key)

    if (saved) {
      const stats = JSON.parse(saved)
      // Ensure all stats exist and are valid numbers
      let cleanedStats = {
        articlesRead: typeof stats.articlesRead === 'number' ? stats.articlesRead : 0,
        trendsJoined: typeof stats.trendsJoined === 'number' ? stats.trendsJoined : 0,
        ideasPosted: typeof stats.ideasPosted === 'number' ? stats.ideasPosted : 0,
        advocacies: typeof stats.advocacies === 'number' ? stats.advocacies : 0
      }

      // Migration logic: Only reset once if migration flag doesn't exist
      // Check if migration has been done for this user
      const migrationKey = `user_stats_migration_${userId}`
      const migrationDone = localStorage.getItem(migrationKey)

      if (!migrationDone) {
        // First time migration: Reset advocacies and ideasPosted to 0 if they seem incorrect
        // This handles old hardcoded values from before the tracking system
        let needsSave = false

        if (cleanedStats.advocacies > 0) {
          // Reset to 0 - advocacies should only count new posts after this migration
          cleanedStats.advocacies = 0
          needsSave = true
        }
        if (cleanedStats.ideasPosted > 0) {
          // Reset to 0 - ideasPosted should only count new posts after this migration
          cleanedStats.ideasPosted = 0
          needsSave = true
        }

        if (needsSave) {
          saveUserStats(userId, cleanedStats)
        }

        // Mark migration as done
        try {
          localStorage.setItem(migrationKey, 'true')
        } catch (error) {
          console.error('Error saving migration flag:', error)
        }
      }

      return cleanedStats
    } else {
      // Initialize stats based on existing data
      const stats = {
        articlesRead: countFinishedArticles(userId),
        trendsJoined: countJoinedAdvocacies(userId),
        ideasPosted: 0, // Start at 0, only increment with new posts
        advocacies: 0 // Start at 0, only increment with new posts
      }
      // Save initialized stats
      saveUserStats(userId, stats)
      return stats
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    return {
      articlesRead: 0,
      trendsJoined: 0,
      ideasPosted: 0,
      advocacies: 0
    }
  }
}

// Utility function to save user stats
export const saveUserStats = (userId, stats) => {
  if (!userId) return
  try {
    const key = `user_stats_${userId}`
    localStorage.setItem(key, JSON.stringify(stats))
    // Dispatch event to notify Home component to update stats
    window.dispatchEvent(new CustomEvent('userStatsUpdated'))
  } catch (error) {
    console.error('Error saving user stats:', error)
  }
}

// Utility function to increment a specific stat
export const incrementUserStat = (userId, statName) => {
  if (!userId) return
  const stats = getUserStats(userId)
  stats[statName] = (stats[statName] || 0) + 1
  saveUserStats(userId, stats)
}

// Utility function to store post ownership (postId -> userId)
export const setPostOwner = (postId, userId, postType = 'post') => {
  if (!postId || !userId) return
  try {
    const key = `post_owners_${postType}`
    const saved = localStorage.getItem(key)
    const owners = saved ? JSON.parse(saved) : {}
    owners[postId] = userId
    localStorage.setItem(key, JSON.stringify(owners))
  } catch (error) {
    console.error('Error setting post owner:', error)
  }
}

// Utility function to get post owner
export const getPostOwner = (postId, postType = 'post') => {
  if (!postId) return null
  try {
    const key = `post_owners_${postType}`
    const saved = localStorage.getItem(key)
    if (saved) {
      const owners = JSON.parse(saved)
      const ownerId = owners[postId]
      if (ownerId) return ownerId
    }

    // For Home page ideas, try to match by author name if ownership not set
    // This is a fallback for hardcoded ideas that don't have ownership set
    if (postType === 'home') {
      // Try to find a user whose name matches the idea author
      // We'll check this when we have access to the idea data
      // For now, return null and let the caller handle it
      return null
    }

    return null
  } catch (error) {
    console.error('Error getting post owner:', error)
    return null
  }
}

// Utility function to add user activity
export const addUserActivity = (userId, activity) => {
  if (!userId) return
  try {
    const key = `user_activities_${userId}`
    const saved = localStorage.getItem(key)
    const activities = saved ? JSON.parse(saved) : []

    // Add new activity with timestamp
    const newActivity = {
      ...activity,
      timestamp: new Date().toISOString(),
      id: Date.now() + Math.random()
    }

    // Add to beginning and keep only last 50 activities
    const updatedActivities = [newActivity, ...activities].slice(0, 50)

    localStorage.setItem(key, JSON.stringify(updatedActivities))

    // Dispatch event to notify Home component to update activities
    window.dispatchEvent(new CustomEvent('userActivityAdded'))
  } catch (error) {
    console.error('Error adding user activity:', error)
  }
}

// Utility function to notify content owner of interaction
export const notifyContentOwner = (postId, userId, interactionType, contentTitle, postType = 'post') => {
  if (!postId || !userId) return
  const ownerId = getPostOwner(postId, postType)
  if (ownerId && ownerId !== userId) {
    // This is someone else's content, notify the owner
    let activityTitle = ''
    let activityType = 'notification'

    if (interactionType === 'like') {
      activityTitle = `Someone liked your post: ${contentTitle}`
      activityType = 'liked'
    } else if (interactionType === 'unlike') {
      activityTitle = `Someone unliked your post: ${contentTitle}`
      activityType = 'unliked'
    } else if (interactionType === 'comment') {
      activityTitle = `Someone commented on your post: ${contentTitle}`
      activityType = 'commented'
    }

    if (activityTitle) {
      addUserActivity(ownerId, {
        type: activityType,
        title: activityTitle,
        postId: postId,
        postType: postType
      })
    }
  }
}

// Utility function to get user activities
export const getUserActivities = (userId) => {
  if (!userId) return []
  try {
    const key = `user_activities_${userId}`
    const saved = localStorage.getItem(key)
    if (saved) {
      return JSON.parse(saved)
    }
    return []
  } catch (error) {
    console.error('Error getting user activities:', error)
    return []
  }
}

// Helper function to format relative time
// Helper function to validate and fix invalid dates
export const validateAndFixDate = (dateValue) => {
  if (!dateValue) {
    // If no date, return dummy date from 1 month ago
    const dummyDate = new Date()
    dummyDate.setMonth(dummyDate.getMonth() - 1)
    return dummyDate.toISOString()
  }

  const date = new Date(dateValue)

  // Check if date is invalid
  if (isNaN(date.getTime())) {
    // If invalid, return dummy date from 1 month ago with proper year, month, day
    const dummyDate = new Date()
    dummyDate.setMonth(dummyDate.getMonth() - 1)
    return dummyDate.toISOString()
  }

  return dateValue
}

export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'just now'

  const now = new Date()
  const validatedTimestamp = validateAndFixDate(timestamp)
  const time = new Date(validatedTimestamp)

  // Double check after validation
  if (isNaN(time.getTime())) {
    return 'just now'
  }

  const diffInSeconds = Math.floor((now - time) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  } else {
    const weeks = Math.floor(diffInSeconds / 604800)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  }
}

// Utility function to add points to user
export const addUserPoints = (userId, pointsToAdd) => {
  if (!userId) return 0
  const currentPoints = getUserPoints(userId)
  const newPoints = currentPoints + pointsToAdd
  setUserPoints(userId, newPoints)
  return newPoints
}

// Utility function to mark activity as complete
export const markActivityComplete = (category, activityId, userId) => {
  if (!userId) return
  try {
    const key = `activity_completions_${userId}`
    const saved = localStorage.getItem(key)
    const completions = saved ? JSON.parse(saved) : {}

    if (!completions[category]) {
      completions[category] = {}
    }

    // Check if activity is already completed (to avoid giving points twice)
    const wasAlreadyCompleted = completions[category][activityId] === true

    // Mark as complete
    completions[category][activityId] = true
    completions[category].completedAt = new Date().toISOString()

    localStorage.setItem(key, JSON.stringify(completions))

    // Add 10 points if this is a new completion
    if (!wasAlreadyCompleted) {
      addUserPoints(userId, 10)
      // Dispatch custom event to notify Home component to update points
      window.dispatchEvent(new CustomEvent('activityCompleted', { detail: { category, activityId } }))
    }
  } catch (error) {
    console.error('Error marking activity complete:', error)
  }
}

// Utility function to check if activity is complete
export const isActivityComplete = (category, activityId, userId) => {
  if (!userId) return false
  try {
    const key = `activity_completions_${userId}`
    const saved = localStorage.getItem(key)
    if (!saved) return false

    const completions = JSON.parse(saved)
    return completions[category]?.[activityId] === true
  } catch (error) {
    console.error('Error checking activity completion:', error)
    return false
  }
}

// Activity Card Component
function ActivityCard({ number, title, icon: Icon, objective, instructions, category, activityId }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  const getUserId = () => {
    return user?.id || user?.email || null
  }

  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const userId = getUserId()
    if (userId) {
      setIsComplete(isActivityComplete(category, activityId, userId))
    }
  }, [category, activityId, user])

  const handleStart = (e) => {
    e.stopPropagation() // Prevent expanding/collapsing when clicking Start

    if (category === 'collabspace') {
      // Navigate to CollabSpace with pitch type
      navigate(`/collabspace?pitchType=${activityId}`)
    } else if (category === 'activista') {
      // Navigate to ActiVista with activity type
      navigate(`/activista?activityType=${activityId}`)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition-shadow">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-start justify-between text-left ${isComplete ? 'bg-green-50' : ''}`}
      >
        <div className="flex items-start space-x-3 flex-1">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isComplete ? 'bg-green-100' : 'bg-primary-100'}`}>
            {isComplete ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <span className="text-xs font-bold text-primary-700">{number}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${isComplete ? 'text-green-600' : 'text-primary-600'}`} />}
              <h5 className={`font-medium text-sm ${isComplete ? 'text-green-900' : 'text-gray-900'}`}>
                {title}
                {isComplete && <span className="ml-2 text-xs text-green-600">✓ Completed</span>}
              </h5>
            </div>
          </div>
        </div>
        <div className="ml-2 flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 space-y-2 sm:space-y-3">
          {objective && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Objective:</p>
              <p className="text-xs text-gray-600 leading-relaxed">{objective}</p>
            </div>
          )}
          {instructions && instructions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600">
                {instructions.map((instruction, idx) => (
                  <li key={idx} className="leading-relaxed">{instruction}</li>
                ))}
              </ol>
            </div>
          )}
          {(category && activityId) && (
            <button
              onClick={handleStart}
              className="w-full mt-3 px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Start Activity</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Activity Progress Badge Component
function ActivityProgressBadge({ title, category, activityIds, icon: Icon, iconColor, bgColor, borderColor, completedBgColor, completedTextColor, refreshKey }) {
  const { user } = useAuth()
  const [completedCount, setCompletedCount] = useState(0)

  const getUserId = () => {
    return user?.id || user?.email || null
  }

  useEffect(() => {
    const userId = getUserId()
    if (userId) {
      let count = 0
      activityIds.forEach(activityId => {
        if (isActivityComplete(category, activityId, userId)) {
          count++
        }
      })
      setCompletedCount(count)
    } else {
      setCompletedCount(0)
    }
  }, [category, activityIds, user, refreshKey])

  const totalCount = activityIds.length
  const isFullyComplete = completedCount === totalCount
  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className={`border ${isFullyComplete ? borderColor : 'border-gray-200'} rounded-lg p-3 ${isFullyComplete ? completedBgColor : bgColor} transition-all`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1">
          <Icon className={`w-5 h-5 ${isFullyComplete ? iconColor : 'text-gray-500'}`} />
          <div className="flex-1 min-w-0">
            <h5 className={`text-xs font-semibold ${isFullyComplete ? completedTextColor : 'text-gray-700'}`}>
              {title}
            </h5>
            <p className={`text-xs mt-0.5 ${isFullyComplete ? completedTextColor : 'text-gray-600'}`}>
              {completedCount} / {totalCount} completed
            </p>
          </div>
        </div>
        {isFullyComplete && (
          <CheckCircle className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
        )}
      </div>
      {/* Progress Bar */}
      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${isFullyComplete ? 'bg-green-500' : 'bg-primary-600'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Poll Question Component
function PollQuestion({ number, question, options, activityId }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  const getUserId = () => {
    return user?.id || user?.email || null
  }

  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const userId = getUserId()
    if (userId && activityId) {
      setIsComplete(isActivityComplete('collabspace', activityId, userId))
    }
  }, [activityId, user])

  const handleStart = (e) => {
    e.stopPropagation()
    // Navigate to CollabSpace to create/view polls
    navigate('/collabspace?pitchType=eco-poll')
  }

  return (
    <div className={`border ${isComplete ? 'border-green-200' : 'border-gray-200'} rounded-lg p-3 ${isComplete ? 'bg-green-50' : 'bg-white'} hover:shadow-md transition-shadow`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start justify-between text-left"
      >
        <div className="flex items-start space-x-3 flex-1">
          <div className={`w-6 h-6 ${isComplete ? 'bg-green-200' : 'bg-green-100'} rounded flex items-center justify-center flex-shrink-0 mt-0.5`}>
            {isComplete ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <span className="text-xs font-bold text-green-700">{number}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h5 className={`font-medium text-xs ${isComplete ? 'text-green-900' : 'text-gray-900'} leading-snug`}>
                {question}
              </h5>
              {isComplete && <span className="text-xs text-green-600">✓</span>}
            </div>
          </div>
        </div>
        <div className="ml-2 flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
          {options && options.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Options:</p>
              <ul className="space-y-1">
                {options.map((option, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start space-x-2">
                    <span className="text-primary-600 mt-0.5">•</span>
                    <span>{option}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={handleStart}
            className="w-full mt-2 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Play className="w-3 h-3" />
            <span>Start Poll</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)
  const [isEcoQuestExpanded, setIsEcoQuestExpanded] = useState(false)
  const [showRedeemForm, setShowRedeemForm] = useState(false)
  const [redeemData, setRedeemData] = useState({
    fullName: '',
    contactNumber: '',
    pointsToRedeem: '',
    redemptionMethod: '',
    accountDetails: '',
    gcashName: '',
    bankName: '',
    bankAccountName: ''
  })
  const [redeemError, setRedeemError] = useState('')
  const [redeemSuccess, setRedeemSuccess] = useState('')

  const getUserId = () => {
    return user?.id || user?.email || null
  }

  // Load user stats and points from localStorage
  const loadUserStats = useCallback(() => {
    const userId = getUserId()
    if (userId) {
      const stats = getUserStats(userId)
      const points = getUserPoints(userId)
      setUserStats({
        ...stats,
        points
      })
    } else {
      setUserStats({
        points: 0,
        articlesRead: 0,
        trendsJoined: 0,
        ideasPosted: 0,
        advocacies: 0
      })
    }
  }, [user])

  // Refresh completion status when user changes or when component mounts
  useEffect(() => {
    setRefreshKey(prev => prev + 1)
    loadUserStats()
  }, [user, loadUserStats])

  // Listen for activity completion events to update points
  useEffect(() => {
    const handleActivityCompleted = () => {
      loadUserStats()
    }

    window.addEventListener('activityCompleted', handleActivityCompleted)

    return () => {
      window.removeEventListener('activityCompleted', handleActivityCompleted)
    }
  }, [loadUserStats])

  // Listen for stats update events
  useEffect(() => {
    const handleStatsUpdated = () => {
      loadUserStats()
    }

    window.addEventListener('userStatsUpdated', handleStatsUpdated)

    return () => {
      window.removeEventListener('userStatsUpdated', handleStatsUpdated)
    }
  }, [loadUserStats])

  // Handle redeem form submission
  const handleRedeemSubmit = async (e) => {
    e.preventDefault()
    setRedeemError('')
    setRedeemSuccess('')

    // Validation
    if (!redeemData.fullName || !redeemData.contactNumber || !redeemData.pointsToRedeem ||
      !redeemData.redemptionMethod) {
      setRedeemError('Please fill in all required fields')
      return
    }

    // Method-specific validation
    if (redeemData.redemptionMethod === 'gcash' && (!redeemData.gcashName || !redeemData.accountDetails)) {
      setRedeemError('Please provide GCash account name and number')
      return
    }
    if (redeemData.redemptionMethod === 'bank' && (!redeemData.bankName || !redeemData.bankAccountName || !redeemData.accountDetails)) {
      setRedeemError('Please provide complete bank details')
      return
    }
    if (redeemData.redemptionMethod === 'cash' && !redeemData.accountDetails) {
      setRedeemError('Please provide pickup location')
      return
    }

    const pointsToRedeem = parseInt(redeemData.pointsToRedeem, 10)
    if (pointsToRedeem < 100) {
      setRedeemError('Minimum redemption is 100 points')
      return
    }

    if (pointsToRedeem > userStats.points) {
      setRedeemError('Insufficient points')
      return
    }

    try {
      const response = await fetch('http://72.61.125.98:3001/api/redeem-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: getUserId(),
          userName: user?.name || user?.username || 'Unknown User',
          userEmail: user?.email || 'No email provided',
          fullName: redeemData.fullName,
          contactNumber: redeemData.contactNumber,
          pointsToRedeem: pointsToRedeem,
          redemptionMethod: redeemData.redemptionMethod,
          accountDetails: redeemData.accountDetails,
          gcashName: redeemData.gcashName,
          bankName: redeemData.bankName,
          bankAccountName: redeemData.bankAccountName,
          currentPoints: userStats.points
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Deduct points from user's balance
        const newPoints = userStats.points - pointsToRedeem
        const userId = getUserId()

        // Update localStorage
        localStorage.setItem(`user_points_${userId}`, newPoints.toString())

        // Update state
        setUserStats(prev => ({
          ...prev,
          points: newPoints
        }))

        setRedeemSuccess('Redemption request submitted successfully! The admin will contact you soon.')
        setRedeemData({
          fullName: '',
          contactNumber: '',
          pointsToRedeem: '',
          redemptionMethod: '',
          accountDetails: '',
          gcashName: '',
          bankName: '',
          bankAccountName: ''
        })
        setTimeout(() => {
          setShowRedeemForm(false)
          setRedeemSuccess('')
        }, 3000)
      } else {
        setRedeemError(data.error || 'Failed to submit redemption request')
      }
    } catch (error) {
      console.error('Redemption error:', error)
      setRedeemError('Failed to submit request. Please try again.')
    }
  }

  // Default activities mapping (hardcoded defaults)
  const defaultActivitiesMap = {
    collabspace: {
      'eco-pitch': { number: '1', title: 'Eco-Pitch: 60-Second Solution Challenge', icon: Video, objective: 'To encourage students to quickly identify an environmental or urban problem and propose a concise, feasible solution.', instructions: ['Choose one local issue (flooding, waste buildup, lack of green space, etc.).', 'Record a 60-second video or write a 120-150 word pitch explaining: The problem, Your proposed solution, The expected impact.', 'Upload your pitch to the platform.', 'Classmates may react and leave constructive comments.'] },
      'greenspace': { number: '2', title: 'GreenSpace Redesign Pitch', icon: Image, objective: 'To promote creative thinking on how to improve underutilized community or school spaces.', instructions: ['Take a photo of an area on campus or in your barangay that needs improvement.', 'Sketch a simple redesign (using paper, mobile editor, or drawing tool).', 'Write a brief pitch (2-3 sentences) explaining your redesign.', 'Submit your redesign for peer voting.'] },
      'fix-street': { number: '3', title: 'Fix-My-Street Pitch Board', icon: MapPin, objective: 'To train students to identify real-world environmental issues and propose simple, actionable fixes.', instructions: ['Upload a photo or description of a real environmental problem in your area.', 'Complete the pitch template: The Problem (What is happening?), Your Solution (What can be done?), Outcome (How will this help?).', 'Submit your entry to the public pitch board.', 'Review at least two peers\' pitches and react using 👍 or 💡.'] },
      'plan-it': { number: '4', title: 'Plan-It Pitch Competition', icon: FileText, objective: 'To engage students in collaborative planning through short presentation-style proposals.', instructions: ['Form a group of 3-5 students.', 'Create a 3-5 slide mini-pitch deck on a chosen environmental or urban topic.', 'Include: Problem statement, Proposed solution, Feasibility, Expected benefits.', 'Upload your deck to CollabSpace.', 'Vote for the top three most feasible proposals.'] },
      'community-map': { number: '5', title: 'Community Map Pitch', icon: MapPin, objective: 'To help students analyze environmental issues spatially by marking real areas that need improvement.', instructions: ['Open the digital community map tool.', 'Place a pin on a chosen location (flood zone, waste hotspot, unsafe public path, etc.).', 'Write a short pitch (2-4 sentences): Why you selected this spot, What improvement is needed.', 'Submit your map entry.', 'Respond to at least one peer\'s pin with a suggestion.'] },
      'wish-barangay': { number: '6', title: 'I Wish My Barangay Had… Pitch Form', icon: Lightbulb, objective: 'To give students a structured format to express civic needs and propose enhancements.', instructions: ['Fill out the pitch form: What do you wish your barangay had?, Why do we need it?, Who will benefit?, What small role can youth play?', 'Upload your entry.', 'Read and rate at least two classmates\' submissions.'] },
      'slogan': { number: '7', title: 'Sustainability Slogan Pitch', icon: Award, objective: 'To promote participation through visual advocacy paired with critical thinking.', instructions: ['Create a simple digital or hand-drawn slogan addressing an urban or environmental issue.', 'Write a 2-3 sentence pitch explaining: The issue, The purpose of your poster, Your proposed call-to-action.', 'Submit your poster to the gallery.', 'View and vote for posters that inspire action.'] },
      'idea-duo': { number: '8', title: 'Idea Duos - Partner Pitch', icon: Users, objective: 'To build communication skills and teamwork by co-developing a proposal.', instructions: ['Pair up with a classmate.', 'Choose any urban issue and propose a joint solution.', 'Write a combined pitch (150-200 words).', 'Submit as a "Duo Pitch" entry.', 'Peer reviewers will give feedback on feasibility.'] },
    },
    activista: {
      'advocacy-post': { number: '1', title: 'Advocacy Post Creation', icon: Megaphone, objective: 'To empower students to express strong environmental positions and persuade peers to support meaningful environmental actions.', instructions: ['Choose an environmental issue you want to advocate for.', 'Write a short persuasive message OR create a simple infographic/poster.', 'Upload your advocacy post to the platform\'s ActiVista feed.', 'Add a short explanation (1-2 sentences) about the intended impact of your post.'] },
      'peer-influence': { number: '2', title: 'Peer Influence Message', icon: TrendingUp, objective: 'To encourage students to influence others to act on an important environmental issue.', instructions: ['Select an environmental action you want your classmates to support.', 'Write a one-sentence powerful persuasive message.', 'Post it on the platform so your peers can see and respond.'] },
      'micro-campaign': { number: '3', title: 'Micro-Campaign Design', icon: Palette, objective: 'To develop students\' ability to create advocacy campaigns that encourage environmental behavior change.', instructions: ['Choose a cause (ex: waste reduction, heat mitigation, clean-up drive).', 'Create a slogan, call-to-action, and 2-3 sentence explanation.', 'Include optional images, icons, or colors to improve the campaign.', 'Publish it in the campaign gallery.'] },
      'endorsement': { number: '4', title: 'Support & Endorse a Peer\'s Idea', icon: CheckCircle, objective: 'To strengthen peer-led activism by encouraging students to endorse and justify support for environmental proposals.', instructions: ['Browse your classmates\' proposals in the platform.', 'Choose one idea you genuinely support.', 'Write a short endorsement (2-3 sentences) explaining why others should support it too.', 'Post your endorsement under the proposal.'] },
      'cta-poster': { number: '5', title: 'Call-to-Action (CTA) Poster', icon: Image, objective: 'To let students create persuasive visual materials that inspire specific environmental actions.', instructions: ['Select a behavior or change you want to promote.', 'Design a poster using simple text and graphics.', 'Include one clear call-to-action (ex: "Segregate your waste today!").', 'Upload it and provide a short explanation for your chosen CTA.'] },
      'video-spotlight': { number: '6', title: 'Issue Spotlight Video (30-60 seconds)', icon: Video, objective: 'To train students to articulate environmental issues and advocate for solutions through short digital content.', instructions: ['Choose a local environmental issue to highlight.', 'Record a 30-60 second video explaining the problem and your proposed action.', 'Upload the video to the platform.', 'Add 1 sentence summarizing the main message of your spotlight.'] },
      'petition': { number: '7', title: 'Youth Petition Draft (Internal Only)', icon: FileText, objective: 'To help students practice formal advocacy by drafting petitions that highlight environmental concerns.', instructions: ['Choose an issue that requires attention (ex: lack of trees, waste bins, poor drainage).', 'Write a short petition-style statement (3-5 sentences).', 'State the problem, the requested action, and who benefits from the change.', 'Submit your draft within the platform.'] },
      'eco-pledge-influence': { number: '8', title: 'Eco-Pledge Influence Challenge', icon: Users, objective: 'To promote activism by encouraging students to motivate others to join environmental commitments.', instructions: ['Choose a pledge from the platform (ex: plastic-free week).', 'Encourage two classmates to join the same pledge.', 'Write how you convinced them (1-2 sentences per person).', 'Submit your reflection after both have joined.'] },
      'solution-advocacy': { number: '9', title: 'Solution Advocacy Write-Up', icon: Lightbulb, objective: 'To develop students\' persuasive writing skills by having them advocate for specific environmental solutions.', instructions: ['Identify an environmental issue in your school or community.', 'Write a short advocacy article (3-5 sentences) proposing a solution.', 'Explain why this solution should be prioritized.', 'Post your advocacy write-up on ActiVista.'] },
      'letter-concern': { number: '10', title: 'Digital "Letter of Concern" (Internal Only)', icon: Mail, objective: 'To guide students in expressing environmental concerns formally and proposing actionable solutions.', instructions: ['Choose a recipient (ex: school admin, barangay official, youth org).', 'Write a brief letter (4-6 sentences) identifying the issue and the needed action.', 'Use respectful, formal tone.', 'Submit your digital letter draft via the platform.'] },
    }
  }

  // Load and merge activities
  const loadActivities = () => {
    try {
      const adminActivities = getEcoQuestActivities()

      // Merge admin activities with defaults
      const merged = {
        collabspace: [],
        activista: []
      }

      // Process collabspace activities - merge admin with defaults
      const defaultCollabspaceIds = Object.keys(defaultActivitiesMap.collabspace)

      // Start with all default activities
      merged.collabspace = defaultCollabspaceIds.map(id => ({
        id,
        ...defaultActivitiesMap.collabspace[id],
        category: 'collabspace'
      }))

      // Add/update with admin activities
      if (adminActivities.collabspace && adminActivities.collabspace.length > 0) {
        adminActivities.collabspace.forEach(adminActivity => {
          const existingIndex = merged.collabspace.findIndex(a => a.id === adminActivity.id)
          const defaultActivity = defaultActivitiesMap.collabspace[adminActivity.id] || {}

          // Map icon
          let IconComponent = defaultActivity.icon || Video
          if (adminActivity.icon && typeof adminActivity.icon !== 'string') {
            IconComponent = adminActivity.icon
          } else if (adminActivity.iconName && iconMap[adminActivity.iconName.toLowerCase()]) {
            IconComponent = iconMap[adminActivity.iconName.toLowerCase()]
          }

          const mergedActivity = {
            ...defaultActivity,
            ...adminActivity, // Admin data overrides defaults
            icon: IconComponent,
            category: 'collabspace'
          }

          if (existingIndex >= 0) {
            // Update existing
            merged.collabspace[existingIndex] = mergedActivity
          } else {
            // Add new
            merged.collabspace.push(mergedActivity)
          }
        })
      }

      // Process activista activities - merge admin with defaults
      const defaultActivistaIds = Object.keys(defaultActivitiesMap.activista)

      // Start with all default activities
      merged.activista = defaultActivistaIds.map(id => ({
        id,
        ...defaultActivitiesMap.activista[id],
        category: 'activista'
      }))

      // Add/update with admin activities
      if (adminActivities.activista && adminActivities.activista.length > 0) {
        adminActivities.activista.forEach(adminActivity => {
          const existingIndex = merged.activista.findIndex(a => a.id === adminActivity.id)
          const defaultActivity = defaultActivitiesMap.activista[adminActivity.id] || {}

          // Map icon
          let IconComponent = defaultActivity.icon || Megaphone
          if (adminActivity.icon && typeof adminActivity.icon !== 'string') {
            IconComponent = adminActivity.icon
          } else if (adminActivity.iconName && iconMap[adminActivity.iconName.toLowerCase()]) {
            IconComponent = iconMap[adminActivity.iconName.toLowerCase()]
          }

          const mergedActivity = {
            ...defaultActivity,
            ...adminActivity, // Admin data overrides defaults
            icon: IconComponent,
            category: 'activista'
          }

          if (existingIndex >= 0) {
            // Update existing
            merged.activista[existingIndex] = mergedActivity
          } else {
            // Add new
            merged.activista.push(mergedActivity)
          }
        })
      }

      return merged
    } catch (error) {
      console.error('Error loading activities:', error)
      // Fallback to defaults
      return {
        collabspace: Object.keys(defaultActivitiesMap.collabspace).map(id => ({
          id,
          ...defaultActivitiesMap.collabspace[id],
          category: 'collabspace'
        })),
        activista: Object.keys(defaultActivitiesMap.activista).map(id => ({
          id,
          ...defaultActivitiesMap.activista[id],
          category: 'activista'
        }))
      }
    }
  }

  const [activities, setActivities] = useState(loadActivities())
  const [activitiesRefreshKey, setActivitiesRefreshKey] = useState(0)

  // Listen for admin activity updates
  useEffect(() => {
    const handleActivitiesUpdated = () => {
      setActivities(loadActivities())
      setActivitiesRefreshKey(prev => prev + 1)
      setRefreshKey(prev => prev + 1) // Also refresh progress badges
    }

    window.addEventListener('ecoquestActivitiesUpdated', handleActivitiesUpdated)

    return () => {
      window.removeEventListener('ecoquestActivitiesUpdated', handleActivitiesUpdated)
    }
  }, [])

  const [tasks, setTasks] = useState([
    { id: 1, title: 'Read 3 articles', progress: 2, target: 3, reward: 50, completed: false },
    { id: 2, title: 'Post an idea', progress: 0, target: 1, reward: 30, completed: false },
    { id: 3, title: 'Join 2 trends', progress: 1, target: 2, reward: 40, completed: false },
    { id: 4, title: 'Vote on 5 forum posts', progress: 3, target: 5, reward: 60, completed: false },
  ])

  const [userStats, setUserStats] = useState({
    points: 0,
    articlesRead: 0,
    trendsJoined: 0,
    ideasPosted: 0,
    advocacies: 0,
  })

  const [recentActivities, setRecentActivities] = useState([])
  const [showAllActivities, setShowAllActivities] = useState(false)
  const [allActivities, setAllActivities] = useState([]) // Store all activities

  // Load user activities from localStorage
  const loadUserActivities = useCallback(() => {
    const userId = getUserId()
    if (userId) {
      const activities = getUserActivities(userId)
      // Map activities to display format with icons
      const mappedActivities = activities.map(activity => {
        let icon = CheckCircle // default icon
        if (activity.type === 'article') icon = BookOpen
        else if (activity.type === 'trend' || activity.type === 'joined-trend') icon = TrendingUp
        else if (activity.type === 'idea') icon = Lightbulb
        else if (activity.type === 'vote' || activity.type === 'poll-vote') icon = Trophy
        else if (activity.type === 'advocacy') icon = Megaphone
        else if (activity.type === 'comment' || activity.type === 'commented') icon = MessageCircle
        else if (activity.type === 'activity-completed') icon = Award
        else if (activity.type === 'like' || activity.type === 'liked') icon = ThumbsUp
        else if (activity.type === 'unlike' || activity.type === 'unliked') icon = ThumbsDown

        return {
          ...activity,
          icon,
          date: activity.timestamp ? formatRelativeTime(activity.timestamp) : activity.date || 'just now'
        }
      })
      // Store all activities
      setAllActivities(mappedActivities)
    } else {
      setAllActivities([])
    }
  }, [user])

  // Update displayed activities based on showAllActivities state
  useEffect(() => {
    if (showAllActivities) {
      setRecentActivities(allActivities)
    } else {
      setRecentActivities(allActivities.slice(0, 10))
    }
  }, [allActivities, showAllActivities])

  // Load activities on mount and when user changes
  useEffect(() => {
    loadUserActivities()
  }, [loadUserActivities])

  // Listen for new activity events
  useEffect(() => {
    const handleActivityAdded = () => {
      loadUserActivities()
    }

    window.addEventListener('userActivityAdded', handleActivityAdded)

    return () => {
      window.removeEventListener('userActivityAdded', handleActivityAdded)
    }
  }, [loadUserActivities])

  // Load posts with high engagement from CollabSpace and ActiVista
  const loadHighEngagementIdeas = () => {
    try {
      const ideas = []

      // Load CollabSpace posts
      const collabspaceSaved = localStorage.getItem('collabspace_posts')
      const collabspaceAggregateCounts = (() => {
        try {
          const saved = localStorage.getItem('collabspace_aggregate_counts')
          return saved ? JSON.parse(saved) : {}
        } catch (error) {
          return {}
        }
      })()

      if (collabspaceSaved) {
        try {
          const collabspacePosts = JSON.parse(collabspaceSaved)
          collabspacePosts.forEach(post => {
            if (post.pitchType === 'eco-poll') return // Skip polls
            const counts = collabspaceAggregateCounts[post.id] || {}
            const likes = post.reactions?.likes || counts.likes || 0
            const hearts = post.reactions?.hearts || counts.hearts || 0
            const comments = counts.comments || 0
            const engagement = likes + hearts + comments

            if (engagement > 0) { // Only include posts with engagement
              ideas.push({
                id: `collabspace-${post.id}`,
                author: post.author || 'Anonymous',
                title: post.title || 'Untitled',
                content: post.content || post.pitchData?.content || '',
                date: validateAndFixDate(post.date),
                tags: post.tags || [],
                likes,
                hearts,
                comments,
                engagement,
                source: 'CollabSpace'
              })
            }
          })
        } catch (error) {
          console.error('Error loading CollabSpace posts:', error)
        }
      }

      // Load ActiVista posts
      const activistaSaved = localStorage.getItem('activista_posts')
      const activistaAggregateCounts = (() => {
        try {
          const saved = localStorage.getItem('activista_aggregate_counts')
          return saved ? JSON.parse(saved) : {}
        } catch (error) {
          return {}
        }
      })()

      if (activistaSaved) {
        try {
          const activistaPosts = JSON.parse(activistaSaved)
          activistaPosts.forEach(post => {
            const counts = activistaAggregateCounts[post.id] || {}
            const likes = post.likes || counts.likes || 0
            const hearts = post.hearts || counts.hearts || 0
            const comments = post.comments || counts.comments || 0
            const engagement = likes + hearts + comments

            if (engagement > 0) { // Only include posts with engagement
              ideas.push({
                id: `activista-${post.id}`,
                author: post.author || 'Anonymous',
                title: post.title || 'Untitled',
                content: post.content || '',
                date: validateAndFixDate(post.date),
                tags: post.tags || [],
                likes,
                hearts,
                comments,
                engagement,
                source: 'ActiVista'
              })
            }
          })
        } catch (error) {
          console.error('Error loading ActiVista posts:', error)
        }
      }

      // Sort by engagement (highest first), then by date (newest first) if same engagement
      ideas.sort((a, b) => {
        if (b.engagement !== a.engagement) {
          return b.engagement - a.engagement
        }
        return new Date(b.date) - new Date(a.date)
      })

      // Return top 10 posts with highest engagement
      return ideas.slice(0, 10)
    } catch (error) {
      console.error('Error loading high engagement ideas:', error)
      return []
    }
  }

  const [recentIdeas, setRecentIdeas] = useState(loadHighEngagementIdeas)

  // Listen for post updates from CollabSpace and ActiVista
  useEffect(() => {
    // Listen for storage events (when posts are added/updated in other tabs or pages)
    const handleStorageChange = (e) => {
      if (e.key === 'collabspace_posts' || e.key === 'activista_posts' ||
        e.key === 'collabspace_aggregate_counts' || e.key === 'activista_aggregate_counts') {
        setRecentIdeas(loadHighEngagementIdeas())
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also check periodically for updates (in case same tab updates localStorage)
    const interval = setInterval(() => {
      setRecentIdeas(loadHighEngagementIdeas())
    }, 5000) // Check every 5 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const completeTask = (taskId) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId && task.progress >= task.target && !task.completed) {
        const userId = getUserId()
        if (userId) {
          const newPoints = addUserPoints(userId, task.reward)
          setUserStats({ ...userStats, points: newPoints })
        } else {
          setUserStats({ ...userStats, points: userStats.points + task.reward })
        }
        return { ...task, completed: true }
      }
      return task
    }))
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome back, Eco Warrior!</h1>
        <p className="text-sm sm:text-base text-gray-600">EcoQuest: Complete environmental activities to earn digital points and badges, exchangeable for food or monetary rewards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Left Column - Profile & Stats */}
        <div className="md:col-span-2 lg:col-span-1 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto space-y-4 sm:space-y-6">
          {/* User Profile Card */}
          <div className="card">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name || user.username || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {user ? (user.name || user.username || 'Eco Student') : 'Eco Student'}
              </h2>
              <p className="text-gray-600 mb-4">Environmental Activist</p>

              <div className="bg-primary-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Trophy className="w-6 h-6 text-primary-600" />
                  <span className="text-2xl font-bold text-primary-700">{userStats.points} pts</span>
                </div>
                <p className="text-center text-sm text-gray-600 mb-3">
                  100 pts = ₱100
                </p>
                <button
                  onClick={() => setShowRedeemForm(true)}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Redeem Points
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.articlesRead}</div>
                  <div className="text-sm text-gray-600">Articles Read</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.trendsJoined}</div>
                  <div className="text-sm text-gray-600">Trends Joined</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.ideasPosted}</div>
                  <div className="text-sm text-gray-600">Ideas Posted</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.advocacies}</div>
                  <div className="text-sm text-gray-600">Advocacies</div>
                </div>
              </div>

              {/* Activity Progress Section */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Activity Progress</h4>
                <div className="space-y-2 sm:space-y-3">
                  {/* Pitch Activities (CollabSpace) */}
                  <ActivityProgressBadge
                    title="Pitch Activities (CollabSpace)"
                    category="collabspace"
                    activityIds={activities.collabspace.filter(a => !a.id.startsWith('eco-poll-')).map(a => a.id)}
                    icon={Users}
                    iconColor="text-blue-600"
                    bgColor="bg-blue-50"
                    borderColor="border-blue-200"
                    completedBgColor="bg-blue-100"
                    completedTextColor="text-blue-900"
                    refreshKey={refreshKey}
                  />

                  {/* Eco Poll Ideas (CollabSpace) */}
                  <ActivityProgressBadge
                    title="Eco Poll Ideas (CollabSpace)"
                    category="collabspace"
                    activityIds={['eco-poll-1', 'eco-poll-2', 'eco-poll-3', 'eco-poll-4', 'eco-poll-5', 'eco-poll-6', 'eco-poll-7', 'eco-poll-8', 'eco-poll-9', 'eco-poll-10']}
                    icon={BarChart2}
                    iconColor="text-green-600"
                    bgColor="bg-green-50"
                    borderColor="border-green-200"
                    completedBgColor="bg-green-100"
                    completedTextColor="text-green-900"
                    refreshKey={refreshKey}
                  />

                  {/* Activism Activities (ActiVista) */}
                  <ActivityProgressBadge
                    title="Activism Activities (ActiVista)"
                    category="activista"
                    activityIds={activities.activista.map(a => a.id)}
                    icon={Megaphone}
                    iconColor="text-purple-600"
                    bgColor="bg-purple-50"
                    borderColor="border-purple-200"
                    completedBgColor="bg-purple-100"
                    completedTextColor="text-purple-900"
                    refreshKey={refreshKey}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* EcoQuest: Activities - Only show if user is logged in */}
          {user && (
            <div className={`card transition-all duration-300 ${isEcoQuestExpanded ? 'fixed inset-2 sm:inset-4 z-50 overflow-y-auto' : ''}`}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">EcoQuest: Activities</h3>
                </div>
                <button
                  onClick={() => setIsEcoQuestExpanded(!isEcoQuestExpanded)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isEcoQuestExpanded ? 'Minimize' : 'Maximize'}
                >
                  {isEcoQuestExpanded ? (
                    <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  ) : (
                    <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  )}
                </button>
              </div>

              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2" key={activitiesRefreshKey}>
                {/* Pitch Activities Section */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">Pitch Activities (CollabSpace)</h4>
                  <div className="space-y-4">
                    {activities.collabspace.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        number={activity.number || ''}
                        title={activity.title}
                        icon={activity.icon}
                        category={activity.category || 'collabspace'}
                        activityId={activity.id}
                        objective={activity.objective || ''}
                        instructions={activity.instructions || []}
                      />
                    ))}
                  </div>
                </div>

                {/* Eco Polls Section */}
                <div className="pt-3 sm:pt-4 border-t">
                  <h4 className="text-sm sm:text-md font-semibold text-gray-800 mb-2 sm:mb-3 border-b pb-2 flex items-center space-x-2">
                    <BarChart2 className="w-4 h-4" />
                    <span>Eco Poll Ideas (CollabSpace)</span>
                  </h4>
                  <div className="space-y-2 sm:space-y-3">
                    <PollQuestion number="1" question="Which environmental issue should be prioritized in your barangay?" options={["Flooding", "Waste management", "Lack of green spaces", "Noise pollution", "Poor drainage"]} activityId="eco-poll-1" />
                    <PollQuestion number="2" question="What project should your school implement first?" options={["Campus tree-planting", "Waste-segregation program", "Flood-prevention improvements", "Campus clean-up drives", "Eco-brick collection station"]} activityId="eco-poll-2" />
                    <PollQuestion number="3" question="Which eco-solution is most feasible for students to support?" options={["Reducing single-use plastics", "School recycling program", "Monthly clean-up", "Creating green corners", "Energy-saving habits"]} activityId="eco-poll-3" />
                    <PollQuestion number="4" question="What type of public space does your community need most?" options={["Playground / recreation areas", "Community garden", "Open green space", "Youth center", "Safe bike lanes"]} activityId="eco-poll-4" />
                    <PollQuestion number="5" question="Which cause would you personally advocate for?" options={["Climate action", "Waste reduction", "Plastic-free environment", "Biodiversity protection", "Clean air for all"]} activityId="eco-poll-5" />
                    <PollQuestion number="6" question="What environmental factor affects you the most daily?" options={["Heat inside the community", "Poor air quality", "Litter and overflowing bins", "Unwalkable sidewalks", "Lack of shade/trees"]} activityId="eco-poll-6" />
                    <PollQuestion number="7" question="Where is the biggest environmental problem in your school?" options={["Canteen waste", "Restroom water waste", "Hallway litter", "Open fields", "Classrooms"]} activityId="eco-poll-7" />
                    <PollQuestion number="8" question="Which urban improvement should be added to your barangay?" options={["Waste segregation bins", "Flood barriers", "Tree-planting zones", "Community compost area", "Street lighting improvements"]} activityId="eco-poll-8" />
                    <PollQuestion number="9" question="What motivates you more to support environmental actions?" options={["Rewards and recognition", "Peer influence", "Personal concern", "Assignments or school tasks", "Social media influence"]} activityId="eco-poll-9" />
                    <PollQuestion number="10" question="Which environmental topic do you want to learn more about?" options={["Urban heat islands", "Waste-to-energy", "Disaster preparedness", "Plastic pollution", "Nature-based solutions"]} activityId="eco-poll-10" />
                  </div>
                </div>

                {/* Activism Activities Section */}
                <div className="pt-3 sm:pt-4 border-t">
                  <h4 className="text-sm sm:text-md font-semibold text-gray-800 mb-2 sm:mb-3 border-b pb-2">Activism Activities (ActiVista)</h4>
                  <div className="space-y-3 sm:space-y-4">
                    {activities.activista.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        number={activity.number || ''}
                        title={activity.title}
                        icon={activity.icon}
                        category={activity.category || 'activista'}
                        activityId={activity.id}
                        objective={activity.objective || ''}
                        instructions={activity.instructions || []}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Activities & Recent Ideas */}
        <div className="md:col-span-2 lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Recent Activities */}
          <div className="card sticky top-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Activities</h3>
            <div className="space-y-3 sm:space-y-4">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div key={activity.id || index} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <p className="text-sm text-gray-500">{activity.date}</p>
                    </div>
                  </div>
                )
              })}
              {allActivities.length > 10 && (
                <button
                  onClick={() => setShowAllActivities(!showAllActivities)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <span>{showAllActivities ? 'See less' : `See more (${allActivities.length - 10} more)`}</span>
                  {showAllActivities ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Redeem Points Modal */}
      {showRedeemForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Redeem Points</h3>
              <button
                onClick={() => setShowRedeemForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-primary-50 rounded-lg p-4 text-center mb-4">
                <p className="text-sm text-gray-600 mb-2">Available Points</p>
                <p className="text-3xl font-bold text-primary-700">{userStats.points} pts</p>
                <p className="text-sm text-gray-600 mt-2">= ₱{userStats.points}</p>
              </div>

              {redeemError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {redeemError}
                </div>
              )}

              {redeemSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                  {redeemSuccess}
                </div>
              )}

              <form onSubmit={handleRedeemSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={redeemData.fullName}
                    onChange={(e) => setRedeemData({ ...redeemData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={redeemData.contactNumber}
                    onChange={(e) => setRedeemData({ ...redeemData, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="09XX XXX XXXX"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points to Redeem
                  </label>
                  <input
                    type="number"
                    min="100"
                    max={userStats.points}
                    value={redeemData.pointsToRedeem}
                    onChange={(e) => setRedeemData({ ...redeemData, pointsToRedeem: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Minimum 100 pts"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Redemption Method
                  </label>
                  <select
                    value={redeemData.redemptionMethod}
                    onChange={(e) => setRedeemData({ ...redeemData, redemptionMethod: e.target.value, accountDetails: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select method</option>
                    <option value="gcash">GCash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cash">Cash Pickup</option>
                  </select>
                </div>

                {redeemData.redemptionMethod === 'gcash' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GCash Account Name
                      </label>
                      <input
                        type="text"
                        value={redeemData.gcashName || ''}
                        onChange={(e) => setRedeemData({ ...redeemData, gcashName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Name on GCash account"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GCash Number
                      </label>
                      <input
                        type="tel"
                        value={redeemData.accountDetails}
                        onChange={(e) => setRedeemData({ ...redeemData, accountDetails: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="09XX XXX XXXX"
                        required
                      />
                    </div>
                  </>
                )}

                {redeemData.redemptionMethod === 'bank' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={redeemData.bankName || ''}
                        onChange={(e) => setRedeemData({ ...redeemData, bankName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g., BDO, BPI, Metrobank"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={redeemData.bankAccountName || ''}
                        onChange={(e) => setRedeemData({ ...redeemData, bankAccountName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Name on bank account"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={redeemData.accountDetails}
                        onChange={(e) => setRedeemData({ ...redeemData, accountDetails: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Bank account number"
                        required
                      />
                    </div>
                  </>
                )}

                {redeemData.redemptionMethod === 'cash' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Location / Address
                    </label>
                    <textarea
                      value={redeemData.accountDetails}
                      onChange={(e) => setRedeemData({ ...redeemData, accountDetails: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Preferred pickup location or address"
                      rows="3"
                      required
                    />
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRedeemForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
