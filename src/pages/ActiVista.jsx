import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, ThumbsDown, Users, Share2, MessageCircle, ThumbsUp, Award, Heart, Megaphone, TrendingUp, Palette, CheckCircle, Image as ImageIcon, Video, FileText, Mail, Lightbulb, Target, Info, Trash2, CornerDownLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { markActivityComplete, isActivityComplete, incrementUserStat, addUserActivity, setPostOwner, notifyContentOwner, formatRelativeTime, validateAndFixDate } from './Home'

export default function ActiVista() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showPostForm, setShowPostForm] = useState(false)
  const [showPledgeForm, setShowPledgeForm] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' })
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, postId: null })

  // Activity type definitions with objectives and instructions
  const activityTypes = [
    {
      id: 'advocacy-post',
      name: 'Advocacy Post Creation',
      icon: Megaphone,
      description: 'Express environmental positions and persuade peers',
      objective: 'To empower students to express strong environmental positions and persuade peers to support meaningful environmental actions.',
      instructions: [
        'Choose an environmental issue you want to advocate for.',
        'Write a short persuasive message OR create a simple infographic/poster.',
        'Upload your advocacy post to the platform\'s ActiVista feed.',
        'Add a short explanation (1–2 sentences) about the intended impact of your post.'
      ]
    },
    {
      id: 'peer-influence',
      name: 'Peer Influence Message',
      icon: TrendingUp,
      description: 'Influence others to act on environmental issues',
      objective: 'To encourage students to influence others to act on an important environmental issue.',
      instructions: [
        'Select an environmental action you want your classmates to support.',
        'Write a one-sentence powerful persuasive message.',
        'Post it on the platform so your peers can see and respond.'
      ]
    },
    {
      id: 'micro-campaign',
      name: 'Micro-Campaign Design',
      icon: Palette,
      description: 'Create advocacy campaigns with slogans and CTAs',
      objective: 'To develop students\' ability to create advocacy campaigns that encourage environmental behavior change.',
      instructions: [
        'Choose a cause (ex: waste reduction, heat mitigation, clean-up drive).',
        'Create a slogan, call-to-action, and 2–3 sentence explanation.',
        'Include optional images, icons, or colors to improve the campaign.',
        'Publish it in the campaign gallery.'
      ]
    },
    {
      id: 'endorsement',
      name: 'Support & Endorse Peer Idea',
      icon: CheckCircle,
      description: 'Endorse and justify support for proposals',
      objective: 'To strengthen peer-led activism by encouraging students to endorse and justify support for environmental proposals.',
      instructions: [
        'Browse your classmates\' proposals in the platform.',
        'Choose one idea you genuinely support.',
        'Write a short endorsement (2–3 sentences) explaining why others should support it too.',
        'Post your endorsement under the proposal.'
      ]
    },
    {
      id: 'cta-poster',
      name: 'Call-to-Action Poster',
      icon: ImageIcon,
      description: 'Create persuasive visual materials',
      objective: 'To let students create persuasive visual materials that inspire specific environmental actions.',
      instructions: [
        'Select a behavior or change you want to promote.',
        'Design a poster using simple text and graphics.',
        'Include one clear call-to-action (ex: "Segregate your waste today!").',
        'Upload it and provide a short explanation for your chosen CTA.'
      ]
    },
    {
      id: 'video-spotlight',
      name: 'Issue Spotlight Video',
      icon: Video,
      description: '30-60 second video explaining problems and solutions',
      objective: 'To train students to articulate environmental issues and advocate for solutions through short digital content.',
      instructions: [
        'Choose a local environmental issue to highlight.',
        'Record a 30–60 second video explaining the problem and your proposed action.',
        'Upload the video to the platform.',
        'Add 1 sentence summarizing the main message of your spotlight.'
      ]
    },
    {
      id: 'petition',
      name: 'Youth Petition Draft',
      icon: FileText,
      description: 'Draft petitions highlighting environmental concerns',
      objective: 'To help students practice formal advocacy by drafting petitions that highlight environmental concerns.',
      instructions: [
        'Choose an issue that requires attention (ex: lack of trees, waste bins, poor drainage).',
        'Write a short petition-style statement (3–5 sentences).',
        'State the problem, the requested action, and who benefits from the change.',
        'Submit your draft within the platform.'
      ]
    },
    {
      id: 'eco-pledge-influence',
      name: 'Eco-Pledge Influence Challenge',
      icon: Users,
      description: 'Motivate others to join environmental commitments',
      objective: 'To promote activism by encouraging students to motivate others to join environmental commitments.',
      instructions: [
        'Choose a pledge from the platform (ex: plastic-free week).',
        'Encourage two classmates to join the same pledge.',
        'Write how you convinced them (1–2 sentences per person).',
        'Submit your reflection after both have joined.'
      ]
    },
    {
      id: 'solution-advocacy',
      name: 'Solution Advocacy Write-Up',
      icon: Lightbulb,
      description: 'Advocate for specific environmental solutions',
      objective: 'To develop students\' persuasive writing skills by having them advocate for specific environmental solutions.',
      instructions: [
        'Identify an environmental issue in your school or community.',
        'Write a short advocacy article (3–5 sentences) proposing a solution.',
        'Explain why this solution should be prioritized.',
        'Post your advocacy write-up on ActiVista.'
      ]
    },
    {
      id: 'letter-concern',
      name: 'Digital Letter of Concern',
      icon: Mail,
      description: 'Express concerns formally with actionable solutions',
      objective: 'To guide students in expressing environmental concerns formally and proposing actionable solutions.',
      instructions: [
        'Choose a recipient (ex: school admin, barangay official, youth org).',
        'Write a brief letter (4–6 sentences) identifying the issue and the needed action.',
        'Use respectful, formal tone.',
        'Submit your digital letter draft via the platform.'
      ]
    },
    {
      id: 'pledge',
      name: 'Digital Pledge',
      icon: Award,
      description: 'Create and join digital pledges',
      objective: 'To create and share digital commitments for environmental actions.',
      instructions: [
        'Choose an environmental action you want to commit to.',
        'Write your pledge details describing your commitment.',
        'Submit your pledge to the platform.',
        'Encourage others to join your pledge.'
      ]
    },
  ]

  // Check if user needs to login
  const requireAuth = () => {
    if (!user) {
      navigate('/login')
      return false
    }
    return true
  }

  // Get user ID for per-user storage
  const getUserId = () => {
    return user?.id || user?.email || 'anonymous'
  }

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'advocacy-post', // Activity type
    // Fields for different activity types
    impactExplanation: '', // For advocacy post
    persuasiveMessage: '', // For peer influence
    slogan: '', // For micro-campaign
    callToAction: '', // For micro-campaign and CTA poster
    campaignExplanation: '', // For micro-campaign
    optionalMedia: '', // For micro-campaign (images, icons, colors)
    endorsementReason: '', // For endorsement
    posterImageUrl: '', // For CTA poster
    ctaExplanation: '', // For CTA poster
    videoUrl: '', // For video spotlight
    videoSummary: '', // For video spotlight
    petitionStatement: '', // For petition
    requestedAction: '', // For petition
    whoBenefits: '', // For petition
    pledgeId: '', // For eco-pledge influence
    classmate1Name: '', // For eco-pledge influence
    classmate1Reason: '', // For eco-pledge influence
    classmate2Name: '', // For eco-pledge influence
    classmate2Reason: '', // For eco-pledge influence
    issueIdentified: '', // For solution advocacy
    solutionProposed: '', // For solution advocacy
    whyPrioritize: '', // For solution advocacy
    recipient: '', // For letter of concern
    issueDescription: '', // For letter of concern
    neededAction: '', // For letter of concern
    pledgeDetails: '', // For digital pledge
  })

  // Default posts - dates are ISO timestamps for real-time relative time display
  const defaultPosts = [
    {
      id: 1,
      author: 'Green Warriors',
      title: 'Stand Against Deforestation',
      content: 'Join us in advocating for stronger forest protection laws. Our forests are disappearing at an alarming rate, and we need your voice to make a difference.',
      type: 'advocacy-post',
      date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      tags: ['Forest', 'Protection', 'Policy'],
      likes: 0,
      hearts: 0,
      comments: 0,
      participants: 0,
      status: 'active',
      activityData: {
        type: 'advocacy-post',
        impactExplanation: 'This advocacy aims to raise awareness and mobilize support for forest protection legislation that could prevent further deforestation and protect biodiversity.',
      },
    },
    {
      id: 2,
      author: 'Eco Student',
      title: 'Digital Pledge: Reduce Plastic Use',
      content: 'I pledge to reduce my plastic consumption by 80% this year. This means saying no to single-use plastics, using reusable bags, and choosing products with minimal packaging. Who\'s with me?',
      type: 'pledge',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      tags: ['Pledge', 'Personal'],
      likes: 0,
      hearts: 0,
      comments: 0,
      participants: 0,
      status: 'active',
      activityData: {
        type: 'pledge',
        pledgeDetails: 'I pledge to reduce my plastic consumption by 80% this year. This means saying no to single-use plastics, using reusable bags, and choosing products with minimal packaging.',
      },
    },
    {
      id: 3,
      author: 'Climate Action Group',
      title: 'Support Renewable Energy Bill',
      content: 'There\'s a renewable energy bill being discussed in congress. We need everyone to contact their representatives and show support for clean energy initiatives.',
      type: 'advocacy-post',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      tags: ['Energy', 'Policy', 'Action'],
      likes: 0,
      hearts: 0,
      comments: 0,
      participants: 0,
      status: 'active',
      activityData: {
        type: 'advocacy-post',
        impactExplanation: 'This advocacy aims to mobilize community support for renewable energy initiatives that could significantly reduce carbon emissions.',
      },
    },
    {
      id: 4,
      author: 'Sustainability Club',
      title: 'Zero Waste Challenge',
      content: 'Join our Zero Waste Challenge! Pledge to go waste-free for one month. We\'ll provide tips, resources, and a supportive community to help you succeed.',
      type: 'pledge',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      tags: ['Pledge', 'Personal'],
      likes: 0,
      hearts: 0,
      comments: 0,
      participants: 0,
      status: 'active',
      activityData: {
        type: 'pledge',
        pledgeDetails: 'Join our Zero Waste Challenge! Pledge to go waste-free for one month. We\'ll provide tips, resources, and a supportive community to help you succeed. Let\'s make a real impact together!',
      },
    },
  ]

  // Load user reactions from localStorage (per-user)
  const loadUserReactions = () => {
    if (!user) return {}
    try {
      if (typeof window === 'undefined' || !window.localStorage) return {}
      const userId = getUserId()
      const saved = localStorage.getItem(`activista_user_reactions_${userId}`)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading user reactions:', error)
    }
    return {}
  }

  // Load aggregate counts (shared across all users)
  const loadAggregateCounts = () => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return {}
      const saved = localStorage.getItem('activista_aggregate_counts')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading aggregate counts:', error)
    }
    return {}
  }

  // Save aggregate counts (shared across all users)
  const saveAggregateCounts = (counts) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('activista_aggregate_counts', JSON.stringify(counts))
      }
    } catch (error) {
      console.error('Error saving aggregate counts:', error)
    }
  }

  // Load posts from localStorage (posts are global/shared)
  const loadPosts = () => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return defaultPosts
      const saved = localStorage.getItem('activista_posts')
      const aggregateCounts = loadAggregateCounts()

      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.map(post => ({
          ...post,
          likes: aggregateCounts[post.id]?.likes || 0,
          hearts: aggregateCounts[post.id]?.hearts || 0,
          comments: aggregateCounts[post.id]?.comments || 0,
          participants: aggregateCounts[post.id]?.participants || 0
        }))
      }
    } catch (error) {
      console.error('Error loading posts:', error)
    }
    const aggregateCounts = loadAggregateCounts()
    return defaultPosts.map(post => ({
      ...post,
      likes: aggregateCounts[post.id]?.likes || 0,
      hearts: aggregateCounts[post.id]?.hearts || 0,
      comments: aggregateCounts[post.id]?.comments || 0,
      participants: aggregateCounts[post.id]?.participants || 0
    }))
  }

  const [userReactions, setUserReactions] = useState(() => {
    // Load immediately on mount
    try {
      const userId = user?.id || user?.email
      if (!userId) return {}
      const saved = localStorage.getItem(`activista_user_reactions_${userId}`)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading initial reactions:', error)
    }
    return {}
  })
  const [advocacyPosts, setAdvocacyPosts] = useState(loadPosts())
  const [timeUpdateKey, setTimeUpdateKey] = useState(0) // Force re-render for time updates
  const [showComments, setShowComments] = useState({})

  // Update time display in real-time every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUpdateKey(prev => prev + 1)
    }, 5000) // Update every 5 seconds for real-time feel

    return () => clearInterval(interval)
  }, [])
  const [newComment, setNewComment] = useState({})
  const [replyingTo, setReplyingTo] = useState({}) // { postId: { 'path': 'text' } } e.g., '0' for comment 0, '0-0' for reply 0 of comment 0
  const [showReplies, setShowReplies] = useState({}) // { postId: { 'path': true/false } }

  // Load user comments from localStorage (per-user)
  const loadUserComments = () => {
    if (!user) return {}
    const userId = getUserId()
    const saved = localStorage.getItem(`activista_user_comments_${userId}`)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (error) {
        console.error('Error loading user comments from localStorage:', error)
        return {}
      }
    }
    return {}
  }

  // Save user comments to localStorage (per-user)
  const saveUserComments = (comments) => {
    if (!user) return
    const userId = getUserId()
    try {
      localStorage.setItem(`activista_user_comments_${userId}`, JSON.stringify(comments))
    } catch (error) {
      console.error('Error saving user comments to localStorage:', error)
    }
  }

  const [userComments, setUserComments] = useState(() => {
    // Load immediately on mount
    try {
      if (!user) return {}
      const userId = user?.id || user?.email || 'anonymous'
      const saved = localStorage.getItem(`activista_user_comments_${userId}`)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading initial comments:', error)
    }
    return {}
  })

  // Reload user comments when user changes (login/logout)
  useEffect(() => {
    try {
      if (user && (user.id || user.email)) {
        const userId = user.id || user.email || 'anonymous'
        const commentsKey = `activista_user_comments_${userId}`
        const savedComments = localStorage.getItem(commentsKey)
        if (savedComments) {
          try {
            setUserComments(JSON.parse(savedComments))
          } catch (error) {
            console.error('Error parsing user comments:', error)
          }
        }
      }
    } catch (error) {
      console.error('Error reloading user comments:', error)
    }
  }, [user?.id, user?.email])

  // Save user comments to localStorage whenever they change
  useEffect(() => {
    if (!user) return
    // Check if there's actual comment data
    const hasComments = Object.keys(userComments).some(key =>
      Array.isArray(userComments[key]) && userComments[key].length > 0
    )
    if (hasComments) {
      saveUserComments(userComments)
      console.log('Saved comments:', userComments)
    }
  }, [userComments, user])

  // Delete post function
  const deletePost = (postId) => {
    if (!user) return

    // Check if user is the author
    const post = advocacyPosts.find(p => p.id === postId)
    if (!post) return

    const isAuthor = post.author === user.name || post.author === user.username || post.author === 'You'
    if (!isAuthor) {
      setModal({
        isOpen: true,
        title: 'Permission Denied',
        message: 'You can only delete your own posts.',
        type: 'warning'
      })
      return
    }

    // Show confirmation modal
    setDeleteConfirmModal({ isOpen: true, postId })
  }

  // Confirm delete action
  const handleConfirmDelete = () => {
    const { postId } = deleteConfirmModal
    if (!postId) return

    const post = advocacyPosts.find(p => p.id === postId)
    if (!post) return

    // Remove post from state
    const updatedPosts = advocacyPosts.filter(p => p.id !== postId)
    setAdvocacyPosts(updatedPosts)

    // Clean up aggregate counts
    const aggregateCounts = loadAggregateCounts()
    if (aggregateCounts[postId]) {
      delete aggregateCounts[postId]
      saveAggregateCounts(aggregateCounts)
    }

    // Clean up post ownership
    try {
      const postOwners = JSON.parse(localStorage.getItem('post_owners_activista') || '{}')
      if (postOwners[postId]) {
        delete postOwners[postId]
        localStorage.setItem('post_owners_activista', JSON.stringify(postOwners))
      }
    } catch (error) {
      console.error('Error cleaning up post ownership:', error)
    }

    // Close confirmation modal
    setDeleteConfirmModal({ isOpen: false, postId: null })

    // Show success message
    setModal({
      isOpen: true,
      title: 'Post Deleted',
      message: 'Your post has been successfully deleted.',
      type: 'success'
    })
  }

  // Cancel delete action
  const handleCancelDelete = () => {
    setDeleteConfirmModal({ isOpen: false, postId: null })
  }

  // Get comments for a post (all users - aggregate)
  const getAllComments = (postId) => {
    const allComments = []
    const currentUserId = user ? getUserId() : null
    const keys = Object.keys(localStorage)
    const seenCommentIds = new Set()

    keys.forEach(key => {
      if (key.startsWith('activista_user_comments_')) {
        try {
          const userPostComments = JSON.parse(localStorage.getItem(key))
          if (userPostComments[postId]) {
            userPostComments[postId].forEach(comment => {
              // Add only if not already added (avoid duplicates)
              if (!seenCommentIds.has(comment.id)) {
                allComments.push(comment)
                seenCommentIds.add(comment.id)
              }
            })
          }
        } catch (error) {
          // Skip invalid entries
        }
      }
    })

    // Add current user's NEW comments from state that aren't in localStorage yet
    if (user && userComments[postId]) {
      const currentUserStateComments = userComments[postId] || []
      currentUserStateComments.forEach(comment => {
        if (!seenCommentIds.has(comment.id)) {
          allComments.push(comment)
          seenCommentIds.add(comment.id)
        }
      })
    }

    // Sort by date (newest first)
    allComments.sort((a, b) => new Date(b.date) - new Date(a.date))

    // Organize comments into nested structure based on parentId
    const commentMap = new Map()
    const rootComments = []

    // First pass: create map of all comments
    allComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Second pass: organize into tree structure
    allComments.forEach(comment => {
      const commentNode = commentMap.get(comment.id)
      if (comment.parentId && commentMap.has(comment.parentId)) {
        // This is a reply, add to parent's replies
        commentMap.get(comment.parentId).replies.push(commentNode)
      } else {
        // This is a root comment
        rootComments.push(commentNode)
      }
    })

    return rootComments
  }

  // Reload user data when user changes (login/logout)
  useEffect(() => {
    try {
      if (user && (user.id || user.email)) {
        // Load data for the logged-in user
        const userId = user.id || user.email || 'anonymous'
        const reactionsKey = `activista_user_reactions_${userId}`

        const savedReactions = localStorage.getItem(reactionsKey)

        if (savedReactions) {
          try {
            setUserReactions(JSON.parse(savedReactions))
          } catch (error) {
            console.error('Error parsing user reactions:', error)
          }
        }
      }
    } catch (error) {
      console.error('Error reloading user data:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email])

  const handleSubmitPost = (e) => {
    e.preventDefault()
    if (!requireAuth()) return
    if (!newPost.title.trim()) return

    // Check if activity is already completed (prevent double posting)
    if (newPost.type !== 'pledge') {
      const userId = getUserId()
      const completed = userId ? isActivityComplete('activista', newPost.type, userId) : false
      if (completed) {
        setModal({
          isOpen: true,
          title: 'Activity Already Completed',
          message: 'This activity has already been completed! You cannot post again for this activity type.',
          type: 'warning'
        })
        return
      }
    }

    // Validate required fields based on activity type
    if (newPost.type === 'peer-influence' && !newPost.persuasiveMessage.trim()) {
      setModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please enter a persuasive message',
        type: 'warning'
      })
      return
    }
    if (newPost.type === 'micro-campaign' && (!newPost.slogan.trim() || !newPost.callToAction.trim() || !newPost.campaignExplanation.trim())) {
      setModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please fill in all required fields for micro-campaign',
        type: 'warning'
      })
      return
    }
    if (newPost.type === 'endorsement' && !newPost.endorsementReason.trim()) {
      setModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please provide an endorsement reason',
        type: 'warning'
      })
      return
    }
    if (newPost.type === 'cta-poster' && (!newPost.callToAction.trim() || !newPost.ctaExplanation.trim())) {
      setModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please fill in call-to-action and explanation',
        type: 'warning'
      })
      return
    }
    if (newPost.type === 'video-spotlight' && (!newPost.videoUrl.trim() || !newPost.videoSummary.trim())) {
      setModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please provide video URL and summary',
        type: 'warning'
      })
      return
    }
    if (newPost.type === 'petition' && (!newPost.petitionStatement.trim() || !newPost.requestedAction.trim() || !newPost.whoBenefits.trim())) {
      setModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please fill in all required petition fields',
        type: 'warning'
      })
      return
    }
    if (newPost.type === 'eco-pledge-influence' && (!newPost.pledgeId || !newPost.classmate1Name.trim() || !newPost.classmate1Reason.trim() || !newPost.classmate2Name.trim() || !newPost.classmate2Reason.trim())) {
      setModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please fill in all required fields for eco-pledge influence',
        type: 'warning'
      })
      return
    }
    if (newPost.type === 'solution-advocacy' && (!newPost.issueIdentified.trim() || !newPost.solutionProposed.trim() || !newPost.whyPrioritize.trim())) {
      setModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please fill in all required solution advocacy fields',
        type: 'warning'
      })
      return
    }
    if (newPost.type === 'letter-concern' && (!newPost.recipient.trim() || !newPost.issueDescription.trim() || !newPost.neededAction.trim())) {
      setModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please fill in all required letter fields',
        type: 'warning'
      })
      return
    }
    if (newPost.type === 'pledge' && !newPost.pledgeDetails.trim()) {
      setModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please provide pledge details',
        type: 'warning'
      })
      return
    }

    // Build activity data based on type
    const activityData = {
      type: newPost.type,
      impactExplanation: newPost.impactExplanation,
      persuasiveMessage: newPost.persuasiveMessage,
      slogan: newPost.slogan,
      callToAction: newPost.callToAction,
      campaignExplanation: newPost.campaignExplanation,
      optionalMedia: newPost.optionalMedia,
      endorsementReason: newPost.endorsementReason,
      posterImageUrl: newPost.posterImageUrl,
      ctaExplanation: newPost.ctaExplanation,
      videoUrl: newPost.videoUrl,
      videoSummary: newPost.videoSummary,
      petitionStatement: newPost.petitionStatement,
      requestedAction: newPost.requestedAction,
      whoBenefits: newPost.whoBenefits,
      pledgeId: newPost.pledgeId,
      classmate1Name: newPost.classmate1Name,
      classmate1Reason: newPost.classmate1Reason,
      classmate2Name: newPost.classmate2Name,
      classmate2Reason: newPost.classmate2Reason,
      issueIdentified: newPost.issueIdentified,
      solutionProposed: newPost.solutionProposed,
      whyPrioritize: newPost.whyPrioritize,
      recipient: newPost.recipient,
      issueDescription: newPost.issueDescription,
      neededAction: newPost.neededAction,
      pledgeDetails: newPost.pledgeDetails,
    }

    // Determine tags based on activity type
    const activityInfo = activityTypes.find(a => a.id === newPost.type)
    const tags = newPost.type === 'pledge' ? ['Pledge', 'Personal'] :
      newPost.type === 'endorsement' ? ['Endorsement', 'Support'] :
        newPost.type === 'petition' ? ['Petition', 'Advocacy'] :
          newPost.type === 'letter-concern' ? ['Letter', 'Concern'] :
            [activityInfo?.name || 'Advocacy', 'Action']

    const post = {
      id: advocacyPosts.length + 1,
      author: user.name || user.username || 'You',
      title: newPost.title,
      content: newPost.content || newPost.persuasiveMessage || newPost.petitionStatement || newPost.pledgeDetails || '',
      type: newPost.type,
      date: new Date().toISOString(), // Store actual timestamp
      tags: tags,
      likes: 0,
      hearts: 0,
      comments: 0,
      participants: 0,
      status: 'active',
      activityData: activityData,
    }

    setAdvocacyPosts([post, ...advocacyPosts])

    const userId = getUserId()

    // Store post ownership
    if (userId && post.id) {
      setPostOwner(post.id, userId, 'activista')
    }

    // Increment advocacies stat for non-pledge posts
    if (newPost.type !== 'pledge' && userId) {
      incrementUserStat(userId, 'advocacies')
      // Add activity
      addUserActivity(userId, {
        type: 'advocacy',
        title: newPost.title || 'Posted an advocacy',
        postId: post.id
      })
    }

    // Mark activity as complete (skip 'pledge' type as it's separate)
    if (newPost.type !== 'pledge' && userId) {
      markActivityComplete('activista', newPost.type, userId)
      // Add activity for completed activity
      const activityTypeInfo = activityTypes.find(a => a.id === newPost.type)
      if (activityTypeInfo) {
        addUserActivity(userId, {
          type: 'activity-completed',
          title: `Completed: ${activityTypeInfo.name}`,
          category: 'activista',
          activityId: newPost.type
        })
      }
    }

    setNewPost({
      title: '',
      content: '',
      type: 'advocacy-post',
      impactExplanation: '',
      persuasiveMessage: '',
      slogan: '',
      callToAction: '',
      campaignExplanation: '',
      optionalMedia: '',
      endorsementReason: '',
      posterImageUrl: '',
      ctaExplanation: '',
      videoUrl: '',
      videoSummary: '',
      petitionStatement: '',
      requestedAction: '',
      whoBenefits: '',
      pledgeId: '',
      classmate1Name: '',
      classmate1Reason: '',
      classmate2Name: '',
      classmate2Reason: '',
      issueIdentified: '',
      solutionProposed: '',
      whyPrioritize: '',
      recipient: '',
      issueDescription: '',
      neededAction: '',
      pledgeDetails: '',
    })
    setShowPostForm(false)
    setShowPledgeForm(false)
  }

  // Save posts to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('activista_posts', JSON.stringify(advocacyPosts))
      }
    } catch (error) {
      console.error('Error saving posts:', error)
    }
  }, [advocacyPosts])

  // Save user reactions to localStorage (per-user)
  useEffect(() => {
    if (!user) return
    // Only save if userReactions is not empty
    if (Object.keys(userReactions).length > 0) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const userId = getUserId()
          localStorage.setItem(`activista_user_reactions_${userId}`, JSON.stringify(userReactions))
        }
      } catch (error) {
        console.error('Error saving user reactions:', error)
      }
    }
  }, [userReactions, user])

  // Check URL params for activityType and auto-open form
  useEffect(() => {
    const activityTypeParam = searchParams.get('activityType')
    if (activityTypeParam && activityTypes.find(at => at.id === activityTypeParam)) {
      // Check if activity is already completed
      const userId = getUserId()
      const completed = userId ? isActivityComplete('activista', activityTypeParam, userId) : false

      if (completed) {
        // Show message that activity is already completed
        setModal({
          isOpen: true,
          title: 'Activity Already Completed',
          message: 'This activity has already been completed! You cannot post again for this activity type.',
          type: 'warning'
        })
        setSearchParams({})
        return
      }

      // Set the activity type and open the form
      setNewPost(prev => ({ ...prev, type: activityTypeParam }))
      setShowPostForm(true)
      setShowPledgeForm(false)
      setShowInstructions(true)
      // Clear the query parameter
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  // Calculate display count - show aggregate counts (all users)
  const getDisplayCount = (postId, baseCount, reactionType) => {
    const post = advocacyPosts.find(p => p.id === postId)
    if (!post) return 0

    // When logged out, show aggregate counts
    if (!user) {
      if (reactionType === 'likes') return post.likes || 0
      if (reactionType === 'unliked') return post.hearts || 0
      if (reactionType === 'participants') return post.participants || 0
      if (reactionType === 'comments') return post.comments || 0
      return 0
    }

    // When logged in, show aggregate counts
    if (reactionType === 'likes') return post.likes || 0
    if (reactionType === 'unliked') return post.hearts || 0
    if (reactionType === 'participants') return post.participants || 0
    if (reactionType === 'comments') return post.comments || 0
    return 0
  }

  const toggleLike = (postId) => {
    if (!requireAuth()) return

    const isLiked = userReactions[postId]?.liked || false
    const wasUnliked = userReactions[postId]?.unliked || false

    // Update user reactions
    setUserReactions({
      ...userReactions,
      [postId]: {
        ...userReactions[postId],
        liked: !isLiked,
        unliked: false
      }
    })

    // Update aggregate counts
    const aggregateCounts = loadAggregateCounts()
    if (!aggregateCounts[postId]) {
      aggregateCounts[postId] = { likes: 0, hearts: 0, comments: 0, participants: 0 }
    }

    if (!isLiked) {
      aggregateCounts[postId].likes = (aggregateCounts[postId].likes || 0) + 1
      if (wasUnliked && aggregateCounts[postId].hearts > 0) {
        aggregateCounts[postId].hearts = Math.max(0, aggregateCounts[postId].hearts - 1)
      }
      // Notify content owner if it's someone else's post
      const userId = getUserId()
      const post = advocacyPosts.find(p => p.id === postId)
      if (userId && post) {
        notifyContentOwner(postId, userId, 'like', post.title, 'activista')
        // Track user's own like action
        addUserActivity(userId, {
          type: 'like',
          title: `Liked: ${post.title}`,
          postId: post.id
        })
      }
    } else {
      aggregateCounts[postId].likes = Math.max(0, (aggregateCounts[postId].likes || 0) - 1)
    }

    saveAggregateCounts(aggregateCounts)

    // Update posts state
    setAdvocacyPosts(advocacyPosts.map(post =>
      post.id === postId
        ? { ...post, likes: aggregateCounts[postId].likes, hearts: aggregateCounts[postId].hearts }
        : post
    ))
  }

  const toggleUnlike = (postId) => {
    if (!requireAuth()) return

    const isUnliked = userReactions[postId]?.unliked || false
    const wasLiked = userReactions[postId]?.liked || false

    // Update user reactions
    setUserReactions({
      ...userReactions,
      [postId]: {
        ...userReactions[postId],
        unliked: !isUnliked,
        liked: false
      }
    })

    // Update aggregate counts
    const aggregateCounts = loadAggregateCounts()
    if (!aggregateCounts[postId]) {
      aggregateCounts[postId] = { likes: 0, hearts: 0, comments: 0, participants: 0 }
    }

    if (!isUnliked) {
      aggregateCounts[postId].hearts = (aggregateCounts[postId].hearts || 0) + 1
      if (wasLiked && aggregateCounts[postId].likes > 0) {
        aggregateCounts[postId].likes = Math.max(0, aggregateCounts[postId].likes - 1)
      }
      // Notify content owner if it's someone else's post
      const userId = getUserId()
      const post = advocacyPosts.find(p => p.id === postId)
      if (userId && post) {
        notifyContentOwner(postId, userId, 'unlike', post.title, 'activista')
        // Track user's own unlike action
        addUserActivity(userId, {
          type: 'unlike',
          title: `Unliked: ${post.title}`,
          postId: post.id
        })
      }
    } else {
      aggregateCounts[postId].hearts = Math.max(0, (aggregateCounts[postId].hearts || 0) - 1)
    }

    saveAggregateCounts(aggregateCounts)

    // Update posts state
    setAdvocacyPosts(advocacyPosts.map(post =>
      post.id === postId
        ? { ...post, likes: aggregateCounts[postId].likes, hearts: aggregateCounts[postId].hearts }
        : post
    ))
  }

  const joinAdvocacy = (postId) => {
    if (!requireAuth()) return
    const userReaction = userReactions[postId]
    const isParticipating = userReaction?.participating || false

    // Update user reactions
    setUserReactions({
      ...userReactions,
      [postId]: {
        ...userReactions[postId],
        participating: !isParticipating
      }
    })

    // Update aggregate counts
    const aggregateCounts = loadAggregateCounts()
    if (!aggregateCounts[postId]) {
      aggregateCounts[postId] = { likes: 0, hearts: 0, comments: 0, participants: 0 }
    }

    if (!isParticipating) {
      aggregateCounts[postId].participants = (aggregateCounts[postId].participants || 0) + 1
      // Increment trendsJoined stat when joining an advocacy/pledge
      const userId = getUserId()
      if (userId) {
        incrementUserStat(userId, 'trendsJoined')
        // Add activity
        const post = advocacyPosts.find(p => p.id === postId)
        if (post) {
          addUserActivity(userId, {
            type: 'joined-trend',
            title: `Joined trend: ${post.title}`,
            postId: post.id
          })
        }
      }
    } else {
      aggregateCounts[postId].participants = Math.max(0, (aggregateCounts[postId].participants || 0) - 1)
    }

    saveAggregateCounts(aggregateCounts)

    // Update posts state
    setAdvocacyPosts(advocacyPosts.map(post =>
      post.id === postId
        ? { ...post, participants: aggregateCounts[postId].participants }
        : post
    ))
  }

  const handleShare = (post) => {
    const postUrl = `${window.location.origin}/activista?post=${post.id}`
    const shareText = `Check out this advocacy: ${post.title}`

    // Try to use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: shareText,
        url: postUrl
      }).then(() => {
        console.log('Shared successfully')
      }).catch((error) => {
        console.log('Error sharing:', error)
        // Fallback to clipboard
        copyToClipboard(postUrl)
      })
    } else {
      // Fallback: copy to clipboard
      copyToClipboard(postUrl)
    }
  }

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setModal({
          isOpen: true,
          title: 'Link Copied!',
          message: 'Post link has been copied to clipboard. You can now share it!',
          type: 'success'
        })
      }).catch(() => {
        fallbackCopyToClipboard(text)
      })
    } else {
      fallbackCopyToClipboard(text)
    }
  }

  const fallbackCopyToClipboard = (text) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      setModal({
        isOpen: true,
        title: 'Link Copied!',
        message: 'Post link has been copied to clipboard. You can now share it!',
        type: 'success'
      })
    } catch (err) {
      console.error('Failed to copy:', err)
      setModal({
        isOpen: true,
        title: 'Share Link',
        message: `Copy this link to share: ${text}`,
        type: 'info'
      })
    }
    document.body.removeChild(textArea)
  }

  // Helper function to add comment at a specific path (supports nested replies)
  const addCommentAtPath = (comments, path, newComment) => {
    if (!path || path === '') {
      return [...comments, newComment]
    }

    const pathParts = path.split('-').map(Number)
    const updatedComments = [...comments]
    let current = updatedComments

    for (let i = 0; i < pathParts.length - 1; i++) {
      const idx = pathParts[i]
      if (!current[idx]) {
        console.error('Invalid comment path:', path, 'at index', idx)
        return comments
      }
      if (!current[idx].replies) {
        current[idx].replies = []
      }
      current = current[idx].replies
    }

    const finalIdx = pathParts[pathParts.length - 1]
    if (!current[finalIdx]) {
      console.error('Invalid comment path:', path, 'at final index', finalIdx)
      return comments
    }
    if (!current[finalIdx].replies) {
      current[finalIdx].replies = []
    }
    current[finalIdx].replies.push(newComment)

    return updatedComments
  }

  // Helper function to recursively delete a comment by ID
  const deleteCommentById = (comments, commentId) => {
    let deletedCount = 0
    const filtered = comments.filter(comment => {
      // Compare IDs (handle both number and string)
      if (String(comment.id) === String(commentId)) {
        // Count this comment and all its replies
        deletedCount = 1 + (comment.replies ? comment.replies.length : 0)
        return false
      }
      return true
    }).map(comment => {
      // Recursively check and filter replies (create new object to avoid mutation)
      if (comment.replies && comment.replies.length > 0) {
        const { filtered: filteredReplies, deleted: repliesDeleted } = deleteCommentById(comment.replies, commentId)
        deletedCount += repliesDeleted
        return { ...comment, replies: filteredReplies }
      }
      return comment
    })
    return { filtered, deleted: deletedCount }
  }

  const deleteComment = (postId, commentId) => {
    if (!requireAuth()) return

    const postComments = userComments[postId] || []
    const { filtered: updatedComments, deleted: deletedCount } = deleteCommentById(postComments, commentId)

    if (deletedCount === 0) return // Comment not found

    setUserComments({
      ...userComments,
      [postId]: updatedComments
    })

    // Track delete activity
    const userId = getUserId()
    const post = advocacyPosts.find(p => p.id === postId)
    if (userId && post) {
      addUserActivity(userId, {
        type: 'delete_comment',
        title: `Deleted comment on: ${post.title}`,
        postId: post.id
      })
    }

    // Update aggregate counts
    const aggregateCounts = loadAggregateCounts()
    if (!aggregateCounts[postId]) {
      aggregateCounts[postId] = { likes: 0, hearts: 0, comments: 0, participants: 0 }
    }
    aggregateCounts[postId].comments = Math.max(0, (aggregateCounts[postId].comments || 0) - deletedCount)
    saveAggregateCounts(aggregateCounts)

    setAdvocacyPosts(advocacyPosts.map(post =>
      post.id === postId
        ? { ...post, comments: aggregateCounts[postId].comments }
        : post
    ))
  }

  const addComment = (postId, parentPath = null) => {
    if (!requireAuth()) return

    let commentText = ''
    if (parentPath !== null) {
      commentText = replyingTo[postId]?.[parentPath] || ''
      if (!commentText.trim()) return
    } else {
      commentText = newComment[postId] || ''
      if (!commentText.trim()) return
    }

    // Extract mentions from comment text (@username or @full name)
    // Match @ followed by one or more words (allowing spaces between words)
    const mentionRegex = /@([\w]+(?:\s+[\w]+)*)/g
    const mentions = []
    let match
    while ((match = mentionRegex.exec(commentText)) !== null) {
      mentions.push(match[1])
    }

    // Find the parent comment ID if this is a reply
    let parentCommentId = null
    if (parentPath) {
      const allComments = getAllComments(postId)
      const pathParts = parentPath.split('-').map(Number)
      let targetComment = allComments[pathParts[0]]
      for (let i = 1; i < pathParts.length; i++) {
        if (targetComment && targetComment.replies) {
          targetComment = targetComment.replies[pathParts[i]]
        }
      }
      if (targetComment) {
        parentCommentId = targetComment.id
      }
    }

    const comment = {
      id: Date.now() + Math.random(),
      author: user.name || user.username || 'You',
      userId: user.id || user.email,
      comment: commentText,
      date: new Date().toISOString(),
      replies: [],
      mentions: mentions.length > 0 ? mentions : undefined,
      parentId: parentCommentId // Store parent comment ID for replies
    }

    // Always add as top-level comment - replies will be grouped by parentId during display
    const postComments = userComments[postId] || []
    const updatedComments = [...postComments, comment]
    setUserComments({
      ...userComments,
      [postId]: updatedComments
    })

    if (parentPath !== null) {
      setReplyingTo({ ...replyingTo, [postId]: { ...replyingTo[postId], [parentPath]: '' } })
    } else {
      setNewComment({ ...newComment, [postId]: '' })
    }

    // Add activity for comment
    const userId = getUserId()
    if (userId && postId) {
      const post = advocacyPosts.find(p => p.id === postId)
      if (post) {
        addUserActivity(userId, {
          type: parentCommentId ? 'reply' : 'comment',
          title: parentCommentId ? `Replied to a comment on: ${post.title}` : `Commented on: ${post.title}`,
          postId: post.id
        })

        // If this is a reply, notify the parent comment author
        if (parentCommentId && parentPath) {
          const allComments = getAllComments(postId)
          const pathParts = parentPath.split('-').map(Number)
          let parentComment = allComments[pathParts[0]]
          for (let i = 1; i < pathParts.length; i++) {
            if (parentComment && parentComment.replies) {
              parentComment = parentComment.replies[pathParts[i]]
            }
          }
          // Notify parent comment author if it's someone else
          if (parentComment && parentComment.userId && parentComment.userId !== userId) {
            addUserActivity(parentComment.userId, {
              type: 'received_reply',
              title: `${user.name || user.username} replied to your comment on: ${post.title}`,
              postId: post.id,
              fromUser: user.name || user.username
            })
          }
        }
      }
    }

    // Update aggregate counts
    const aggregateCounts = loadAggregateCounts()
    if (!aggregateCounts[postId]) {
      aggregateCounts[postId] = { likes: 0, hearts: 0, comments: 0, participants: 0 }
    }
    aggregateCounts[postId].comments = (aggregateCounts[postId].comments || 0) + 1
    saveAggregateCounts(aggregateCounts)

    setAdvocacyPosts(advocacyPosts.map(post =>
      post.id === postId
        ? { ...post, comments: aggregateCounts[postId].comments }
        : post
    ))
  }

  // Helper function to render mentions in text
  const renderMentions = (text) => {
    if (!text || typeof text !== 'string') {
      return <span style={{ color: '#374151' }}>{text}</span>
    }

    // Check if there are any mentions at all - if not, return plain text
    if (!text.includes('@')) {
      return <span style={{ color: '#374151' }}>{text}</span>
    }

    const parts = []
    // Match @ followed by one or more words (allowing spaces between words)
    // Only matches if @ is at word boundary (start of string or after whitespace)
    // Stops at whitespace, punctuation, or end of string
    const mentionRegex = /(?:^|\s)(@[\w]+(?:\s+[\w]+)*)(?=\s|$|[.,;:!?])/g
    let lastIndex = 0
    let match

    // Reset regex lastIndex
    mentionRegex.lastIndex = 0

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      const textBefore = text.substring(lastIndex, match.index)
      if (textBefore) {
        // Ensure text before is rendered as plain text (black) - explicit inline style
        parts.push(<span key={`text-${match.index}`} style={{ color: '#374151' }}>{textBefore}</span>)
      }

      // Extract the mention part (includes @ and name)
      const fullMention = match[1] // This is "@John" or "@John Doe"

      // Add mention with styling - ONLY the mention gets green styling
      parts.push(
        <span key={`mention-${match.index}`} style={{ color: '#059669', fontWeight: '600' }}>
          {fullMention}
        </span>
      )

      // Update lastIndex to after the full match
      lastIndex = mentionRegex.lastIndex
    }

    // Add remaining text after all mentions
    if (lastIndex < text.length) {
      const remaining = text.substring(lastIndex)
      if (remaining) {
        // Ensure remaining text is rendered as plain text (black) - explicit inline style
        parts.push(<span key={`text-end-${lastIndex}`} style={{ color: '#374151' }}>{remaining}</span>)
      }
    }

    // If no mentions were found after processing, return the original text
    if (parts.length === 0) {
      return <span style={{ color: '#374151' }}>{text}</span>
    }

    return <>{parts}</>
  }

  // Recursive component to render comments with nested replies
  const CommentItem = ({ comment, postId, path, depth = 0 }) => {
    const isReplying = replyingTo[postId]?.[path] !== undefined
    const isShowingReplies = showReplies[postId]?.[path] !== false && depth < 3

    return (
      <div className={depth > 0 ? "bg-white rounded p-2 border-l-2 border-primary-300 ml-4 mt-2" : "bg-gray-50 rounded-lg p-3"}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <span className={`font-medium ${depth > 0 ? 'text-sm' : ''} text-gray-900`}>{comment.author}</span>
            <span className={`text-gray-500 ${depth > 0 ? 'text-xs' : 'text-sm'}`}>•</span>
            <span className={`text-gray-500 ${depth > 0 ? 'text-xs' : 'text-sm'}`} key={`comment-time-${comment.id}-${timeUpdateKey}`}>
              {comment.date ? formatRelativeTime(validateAndFixDate(comment.date)) : 'just now'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (!requireAuth()) return
                const currentValue = replyingTo[postId]?.[path] || ''
                setReplyingTo({
                  ...replyingTo,
                  [postId]: {
                    ...replyingTo[postId],
                    [path]: currentValue || `@${comment.author} `
                  }
                })
              }}
              className={`text-primary-600 hover:text-primary-700 ${depth > 0 ? 'text-xs' : 'text-sm'} flex items-center gap-1`}
              title="Reply"
            >
              <CornerDownLeft className={`${depth > 0 ? 'w-3 h-3' : 'w-4 h-4'}`} />
            </button>
            {user && (comment.userId === (user.id || user.email) || comment.author === user.name || comment.author === user.username || comment.author === 'You') && (
              <button
                onClick={() => {
                  setModal({
                    isOpen: true,
                    title: 'Delete Comment',
                    message: 'Are you sure you want to delete this comment? This action cannot be undone.',
                    type: 'warning',
                    showConfirm: true,
                    onConfirm: () => {
                      deleteComment(postId, comment.id)
                      setModal({ ...modal, isOpen: false })
                    },
                    onCancel: () => setModal({ ...modal, isOpen: false })
                  })
                }}
                className={`text-red-600 hover:text-red-700 ${depth > 0 ? 'text-xs' : 'text-sm'} flex items-center gap-1`}
                title="Delete comment"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <div className={`mb-2 ${depth > 0 ? 'text-sm' : ''}`} style={{ color: '#374151', WebkitTextFillColor: '#374151' }}>
          {renderMentions(comment.comment)}
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-4 mt-2 space-y-2">
            {depth < 2 && (
              <button
                onClick={() => setShowReplies({ ...showReplies, [postId]: { ...showReplies[postId], [path]: !showReplies[postId]?.[path] } })}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                {showReplies[postId]?.[path] === false ? 'Show' : 'Hide'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
            {(isShowingReplies || depth >= 2) && (
              <div className="space-y-2 mt-2">
                {comment.replies.map((reply, replyIndex) => (
                  <CommentItem
                    key={reply.id || replyIndex}
                    comment={reply}
                    postId={postId}
                    path={path ? `${path}-${replyIndex}` : `${replyIndex}`}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {isReplying && (
          <div className="mt-2 ml-4 flex space-x-2" key={`reply-input-${postId}-${path}`}>
            <input
              key={`input-${postId}-${path}`}
              type="text"
              placeholder={`Reply to ${comment.author}... (use @username to mention)`}
              value={replyingTo[postId]?.[path] || ''}
              onChange={(e) => {
                const value = e.target.value
                setReplyingTo(prev => ({
                  ...prev,
                  [postId]: {
                    ...(prev[postId] || {}),
                    [path]: value
                  }
                }))
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addComment(postId, path)
                }
              }}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={() => addComment(postId, path)}
              className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-1"
              title="Reply"
            >
              <CornerDownLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const updated = { ...replyingTo }
                if (updated[postId]) {
                  delete updated[postId][path]
                  if (Object.keys(updated[postId]).length === 0) {
                    delete updated[postId]
                  }
                }
                setReplyingTo(updated)
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">ActiVista: The Advocacy Board</h1>
        <p className="text-sm sm:text-base text-gray-600">Convert your understanding into digital activism. Create and share advocacy posts, digital pledges, and campaign materials to encourage sustainability and responsible actions</p>
      </div>

      {/* Action Button */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => {
            if (!requireAuth()) return
            setShowPostForm(!showPostForm)
            setShowPledgeForm(false)
          }}
          className="btn-primary flex items-center space-x-2 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Create Activity</span>
        </button>
      </div>

      {/* Activity Form */}
      {(showPostForm || showPledgeForm) && (() => {
        const userId = getUserId()
        const activityType = newPost.type
        const isCompleted = activityType !== 'pledge' && userId ? isActivityComplete('activista', activityType, userId) : false

        return (
          <div className="card mb-4 sm:mb-6">
            {isCompleted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 flex items-center space-x-2 sm:space-x-3">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-green-900 mb-1">Activity Already Completed</h3>
                  <p className="text-xs sm:text-sm text-green-700">You have already completed this activity. You cannot post again for this activity type.</p>
                </div>
              </div>
            ) : null}
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Create Activism Activity</h2>
            <form onSubmit={handleSubmitPost} className="space-y-4">
              {/* Activity Type Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Activity Type</label>
                  {activityTypes.find(t => t.id === newPost.type)?.objective && (
                    <button
                      type="button"
                      onClick={() => setShowInstructions(!showInstructions)}
                      className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium"
                    >
                      <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{showInstructions ? 'Hide' : 'Show'} Instructions</span>
                      <span className="sm:hidden">{showInstructions ? 'Hide' : 'Show'}</span>
                    </button>
                  )}
                </div>
                <select
                  value={newPost.type}
                  onChange={(e) => {
                    const newActivityType = e.target.value
                    const userId = getUserId()
                    // Check if the new activity type is already completed
                    if (newActivityType !== 'pledge' && userId && isActivityComplete('activista', newActivityType, userId)) {
                      setModal({
                        isOpen: true,
                        title: 'Activity Already Completed',
                        message: 'This activity has already been completed! You cannot post again for this activity type.',
                        type: 'warning'
                      })
                      return
                    }
                    setNewPost({ ...newPost, type: newActivityType })
                    setShowInstructions(true) // Auto-show instructions when type changes
                  }}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  required
                  disabled={isCompleted && newPost.type !== 'pledge'}
                >
                  {activityTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <option key={type.id} value={type.id}>
                        {type.name} - {type.description}
                      </option>
                    )
                  })}
                </select>
                {activityTypes.find(t => t.id === newPost.type)?.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {activityTypes.find(t => t.id === newPost.type).description}
                  </p>
                )}

                {/* Instructions Display */}
                {showInstructions && activityTypes.find(t => t.id === newPost.type)?.objective && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
                      <Info className="w-5 h-5" />
                      <span>Activity Instructions</span>
                    </h4>
                    {activityTypes.find(t => t.id === newPost.type)?.objective && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-blue-800 mb-1">Objective:</p>
                        <p className="text-sm text-blue-700">
                          {activityTypes.find(t => t.id === newPost.type).objective}
                        </p>
                      </div>
                    )}
                    {activityTypes.find(t => t.id === newPost.type)?.instructions &&
                      activityTypes.find(t => t.id === newPost.type).instructions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-blue-800 mb-2">Instructions:</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                            {activityTypes.find(t => t.id === newPost.type).instructions.map((instruction, idx) => (
                              <li key={idx}>{instruction}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="Enter activity title..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Advocacy Post Creation Fields */}
              {newPost.type === 'advocacy-post' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Advocacy Message</label>
                    <textarea
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      placeholder="Write your persuasive message or advocacy post..."
                      rows="5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Media URL (optional)</label>
                    <input
                      type="url"
                      value={newPost.optionalMedia}
                      onChange={(e) => setNewPost({ ...newPost, optionalMedia: e.target.value })}
                      placeholder="Link to infographic/poster image..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Intended Impact (1-2 sentences)</label>
                    <textarea
                      value={newPost.impactExplanation}
                      onChange={(e) => setNewPost({ ...newPost, impactExplanation: e.target.value })}
                      placeholder="Explain the intended impact of your post..."
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Peer Influence Message Fields */}
              {newPost.type === 'peer-influence' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">One-Sentence Persuasive Message *</label>
                    <textarea
                      value={newPost.persuasiveMessage}
                      onChange={(e) => setNewPost({ ...newPost, persuasiveMessage: e.target.value })}
                      placeholder="Write a powerful one-sentence message to influence your classmates..."
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </>
              )}

              {/* Micro-Campaign Design Fields */}
              {newPost.type === 'micro-campaign' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Slogan *</label>
                    <input
                      type="text"
                      value={newPost.slogan}
                      onChange={(e) => setNewPost({ ...newPost, slogan: e.target.value })}
                      placeholder="Create a catchy slogan..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Call-to-Action *</label>
                    <input
                      type="text"
                      value={newPost.callToAction}
                      onChange={(e) => setNewPost({ ...newPost, callToAction: e.target.value })}
                      placeholder="What action should people take?"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Explanation (2-3 sentences) *</label>
                    <textarea
                      value={newPost.campaignExplanation}
                      onChange={(e) => setNewPost({ ...newPost, campaignExplanation: e.target.value })}
                      placeholder="Explain your campaign..."
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Optional Media (images, icons, colors)</label>
                    <input
                      type="text"
                      value={newPost.optionalMedia}
                      onChange={(e) => setNewPost({ ...newPost, optionalMedia: e.target.value })}
                      placeholder="Describe or link to images, icons, or colors used..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Support & Endorse Peer Idea Fields */}
              {newPost.type === 'endorsement' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Peer's Proposal Title</label>
                    <input
                      type="text"
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      placeholder="Title of the proposal you're endorsing..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Endorsement (2-3 sentences) *</label>
                    <textarea
                      value={newPost.endorsementReason}
                      onChange={(e) => setNewPost({ ...newPost, endorsementReason: e.target.value })}
                      placeholder="Explain why others should support this proposal..."
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </>
              )}

              {/* CTA Poster Fields */}
              {newPost.type === 'cta-poster' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Poster Image URL</label>
                    <input
                      type="url"
                      value={newPost.posterImageUrl}
                      onChange={(e) => setNewPost({ ...newPost, posterImageUrl: e.target.value })}
                      placeholder="Link to your poster image..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Clear Call-to-Action *</label>
                    <input
                      type="text"
                      value={newPost.callToAction}
                      onChange={(e) => setNewPost({ ...newPost, callToAction: e.target.value })}
                      placeholder="e.g., 'Segregate your waste today!'"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Explanation for CTA *</label>
                    <textarea
                      value={newPost.ctaExplanation}
                      onChange={(e) => setNewPost({ ...newPost, ctaExplanation: e.target.value })}
                      placeholder="Explain why you chose this call-to-action..."
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </>
              )}

              {/* Issue Spotlight Video Fields */}
              {newPost.type === 'video-spotlight' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Video URL (30-60 seconds) *</label>
                    <input
                      type="url"
                      value={newPost.videoUrl}
                      onChange={(e) => setNewPost({ ...newPost, videoUrl: e.target.value })}
                      placeholder="Link to your video..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Local Environmental Issue</label>
                    <input
                      type="text"
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      placeholder="What issue are you highlighting?"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Main Message Summary (1 sentence) *</label>
                    <textarea
                      value={newPost.videoSummary}
                      onChange={(e) => setNewPost({ ...newPost, videoSummary: e.target.value })}
                      placeholder="Summarize the main message of your video..."
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </>
              )}

              {/* Youth Petition Draft Fields */}
              {newPost.type === 'petition' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Petition Statement (3-5 sentences) *</label>
                    <textarea
                      value={newPost.petitionStatement}
                      onChange={(e) => setNewPost({ ...newPost, petitionStatement: e.target.value })}
                      placeholder="State the problem, requested action, and who benefits..."
                      rows="5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Requested Action *</label>
                    <input
                      type="text"
                      value={newPost.requestedAction}
                      onChange={(e) => setNewPost({ ...newPost, requestedAction: e.target.value })}
                      placeholder="What action are you requesting?"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Who Benefits *</label>
                    <input
                      type="text"
                      value={newPost.whoBenefits}
                      onChange={(e) => setNewPost({ ...newPost, whoBenefits: e.target.value })}
                      placeholder="Who will benefit from this change?"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </>
              )}

              {/* Eco-Pledge Influence Challenge Fields */}
              {newPost.type === 'eco-pledge-influence' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pledge Title/ID</label>
                    <input
                      type="text"
                      value={newPost.pledgeId}
                      onChange={(e) => setNewPost({ ...newPost, pledgeId: e.target.value })}
                      placeholder="Title or ID of the pledge from the platform..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Classmate Name *</label>
                    <input
                      type="text"
                      value={newPost.classmate1Name}
                      onChange={(e) => setNewPost({ ...newPost, classmate1Name: e.target.value })}
                      placeholder="Name of first classmate you convinced..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">How you convinced them (1-2 sentences) *</label>
                    <textarea
                      value={newPost.classmate1Reason}
                      onChange={(e) => setNewPost({ ...newPost, classmate1Reason: e.target.value })}
                      placeholder="Explain how you convinced the first classmate..."
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Second Classmate Name *</label>
                    <input
                      type="text"
                      value={newPost.classmate2Name}
                      onChange={(e) => setNewPost({ ...newPost, classmate2Name: e.target.value })}
                      placeholder="Name of second classmate you convinced..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">How you convinced them (1-2 sentences) *</label>
                    <textarea
                      value={newPost.classmate2Reason}
                      onChange={(e) => setNewPost({ ...newPost, classmate2Reason: e.target.value })}
                      placeholder="Explain how you convinced the second classmate..."
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </>
              )}

              {/* Solution Advocacy Write-Up Fields */}
              {newPost.type === 'solution-advocacy' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Environmental Issue Identified *</label>
                    <input
                      type="text"
                      value={newPost.issueIdentified}
                      onChange={(e) => setNewPost({ ...newPost, issueIdentified: e.target.value })}
                      placeholder="What issue did you identify in your school/community?"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Proposed Solution (3-5 sentences) *</label>
                    <textarea
                      value={newPost.solutionProposed}
                      onChange={(e) => setNewPost({ ...newPost, solutionProposed: e.target.value })}
                      placeholder="Write your advocacy article proposing a solution..."
                      rows="5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Why this solution should be prioritized *</label>
                    <textarea
                      value={newPost.whyPrioritize}
                      onChange={(e) => setNewPost({ ...newPost, whyPrioritize: e.target.value })}
                      placeholder="Explain why this solution should be prioritized..."
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </>
              )}

              {/* Digital Letter of Concern Fields */}
              {newPost.type === 'letter-concern' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recipient *</label>
                    <input
                      type="text"
                      value={newPost.recipient}
                      onChange={(e) => setNewPost({ ...newPost, recipient: e.target.value })}
                      placeholder="e.g., School Admin, Barangay Official, Youth Org..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Letter (4-6 sentences) *</label>
                    <textarea
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      placeholder="Write your brief letter identifying the issue and needed action. Use respectful, formal tone..."
                      rows="6"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Issue Description</label>
                    <textarea
                      value={newPost.issueDescription}
                      onChange={(e) => setNewPost({ ...newPost, issueDescription: e.target.value })}
                      placeholder="Describe the environmental issue..."
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Needed Action *</label>
                    <textarea
                      value={newPost.neededAction}
                      onChange={(e) => setNewPost({ ...newPost, neededAction: e.target.value })}
                      placeholder="What action is needed?"
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </>
              )}

              {/* Digital Pledge Fields */}
              {newPost.type === 'pledge' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pledge Details *</label>
                    <textarea
                      value={newPost.pledgeDetails}
                      onChange={(e) => setNewPost({ ...newPost, pledgeDetails: e.target.value })}
                      placeholder="Describe your pledge commitment..."
                      rows="5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </>
              )}

              {/* General Content Field (for types that need it) */}
              {!['advocacy-post', 'peer-influence', 'micro-campaign', 'endorsement', 'cta-poster', 'video-spotlight', 'petition', 'eco-pledge-influence', 'solution-advocacy', 'letter-concern', 'pledge'].includes(newPost.type) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="Describe your activity..."
                    rows="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className={`btn-primary ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isCompleted}
                >
                  {isCompleted ? 'Activity Already Completed' : 'Submit Activity'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPostForm(false)
                    setShowPledgeForm(false)
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )
      })()}

      {/* Advocacy Posts */}
      <div className="space-y-4 sm:space-y-6">
        {advocacyPosts.map((post) => (
          <div key={post.id} className="card">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                {(() => {
                  const activityInfo = activityTypes.find(a => a.id === post.type)
                  const ActivityIcon = activityInfo?.icon || (post.type === 'pledge' ? Award : Heart)
                  return <ActivityIcon className="w-6 h-6 text-primary-600" />
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-1 sm:gap-2 mb-2 relative">
                  <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${post.type === 'pledge'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-primary-100 text-primary-700'
                    }`}>
                    {(() => {
                      const activityInfo = activityTypes.find(a => a.id === post.type)
                      return activityInfo?.name || (post.type === 'pledge' ? 'Digital Pledge' : 'Advocacy Post')
                    })()}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500">•</span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900">{post.author}</span>
                  <span className="text-xs sm:text-sm text-gray-500">•</span>
                  <span className="text-xs sm:text-sm text-gray-500" key={`time-${post.id}-${timeUpdateKey}`}>
                    {post.date ? formatRelativeTime(validateAndFixDate(post.date)) : 'just now'}
                  </span>
                  {/* Delete button - only show if user is the author */}
                  {user && (post.author === user.name || post.author === user.username || post.author === 'You') && (
                    <button
                      onClick={() => deletePost(post.id)}
                      className="absolute top-0 right-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
                {post.content && <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">{post.content}</p>}

                {/* Activity-specific fields display */}
                {post.activityData && (
                  <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-3">
                    {post.activityData.impactExplanation && (
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Intended Impact:</h4>
                        <p className="text-sm sm:text-base text-gray-700">{post.activityData.impactExplanation}</p>
                      </div>
                    )}
                    {post.activityData.persuasiveMessage && (
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Persuasive Message:</h4>
                        <p className="text-sm sm:text-base text-gray-700 font-medium">{post.activityData.persuasiveMessage}</p>
                      </div>
                    )}
                    {post.activityData.slogan && (
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Slogan:</h4>
                        <p className="text-base sm:text-lg text-gray-700 font-semibold">{post.activityData.slogan}</p>
                      </div>
                    )}
                    {post.activityData.callToAction && (
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Call-to-Action:</h4>
                        <p className="text-sm sm:text-base text-gray-700 font-medium">{post.activityData.callToAction}</p>
                      </div>
                    )}
                    {post.activityData.campaignExplanation && (
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Campaign Explanation:</h4>
                        <p className="text-sm sm:text-base text-gray-700">{post.activityData.campaignExplanation}</p>
                      </div>
                    )}
                    {post.activityData.endorsementReason && (
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Endorsement:</h4>
                        <p className="text-sm sm:text-base text-gray-700">{post.activityData.endorsementReason}</p>
                      </div>
                    )}
                    {post.activityData.posterImageUrl && (
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Poster:</h4>
                        <a
                          href={post.activityData.posterImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 underline break-all"
                        >
                          {post.activityData.posterImageUrl}
                        </a>
                      </div>
                    )}
                    {post.activityData.ctaExplanation && (
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">CTA Explanation:</h4>
                        <p className="text-sm sm:text-base text-gray-700">{post.activityData.ctaExplanation}</p>
                      </div>
                    )}
                    {post.activityData.videoUrl && (
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Video:</h4>
                        <a
                          href={post.activityData.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 underline break-all"
                        >
                          {post.activityData.videoUrl}
                        </a>
                      </div>
                    )}
                    {post.activityData.videoSummary && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Main Message:</h4>
                        <p className="text-gray-700">{post.activityData.videoSummary}</p>
                      </div>
                    )}
                    {post.activityData.petitionStatement && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Petition Statement:</h4>
                        <p className="text-gray-700">{post.activityData.petitionStatement}</p>
                      </div>
                    )}
                    {post.activityData.requestedAction && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Requested Action:</h4>
                        <p className="text-gray-700">{post.activityData.requestedAction}</p>
                      </div>
                    )}
                    {post.activityData.whoBenefits && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Who Benefits:</h4>
                        <p className="text-gray-700">{post.activityData.whoBenefits}</p>
                      </div>
                    )}
                    {post.activityData.classmate1Name && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Eco-Pledge Influence:</h4>
                        <div className="space-y-2">
                          <div>
                            <p className="font-medium text-gray-900">{post.activityData.classmate1Name}:</p>
                            <p className="text-gray-700 text-sm">{post.activityData.classmate1Reason}</p>
                          </div>
                          {post.activityData.classmate2Name && (
                            <div>
                              <p className="font-medium text-gray-900">{post.activityData.classmate2Name}:</p>
                              <p className="text-gray-700 text-sm">{post.activityData.classmate2Reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {post.activityData.issueIdentified && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Issue Identified:</h4>
                        <p className="text-gray-700">{post.activityData.issueIdentified}</p>
                      </div>
                    )}
                    {post.activityData.solutionProposed && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Proposed Solution:</h4>
                        <p className="text-gray-700">{post.activityData.solutionProposed}</p>
                      </div>
                    )}
                    {post.activityData.whyPrioritize && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Why Prioritize:</h4>
                        <p className="text-gray-700">{post.activityData.whyPrioritize}</p>
                      </div>
                    )}
                    {post.activityData.recipient && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Recipient:</h4>
                        <p className="text-gray-700">{post.activityData.recipient}</p>
                      </div>
                    )}
                    {post.activityData.issueDescription && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Issue Description:</h4>
                        <p className="text-gray-700">{post.activityData.issueDescription}</p>
                      </div>
                    )}
                    {post.activityData.neededAction && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Needed Action:</h4>
                        <p className="text-gray-700">{post.activityData.neededAction}</p>
                      </div>
                    )}
                    {post.activityData.pledgeDetails && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Pledge Details:</h4>
                        <p className="text-gray-700">{post.activityData.pledgeDetails}</p>
                      </div>
                    )}
                    {post.activityData.optionalMedia && (
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Media:</h4>
                        {post.activityData.optionalMedia.startsWith('http') ? (
                          <a
                            href={post.activityData.optionalMedia}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 underline break-all"
                          >
                            {post.activityData.optionalMedia}
                          </a>
                        ) : (
                          <p className="text-gray-700">{post.activityData.optionalMedia}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 sm:px-3 py-0.5 sm:py-1 bg-primary-50 text-primary-700 rounded-full text-xs sm:text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats and Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 pt-3 sm:pt-4 border-t border-gray-100" key={`reactions-${post.id}`}>
                  <div className="flex items-center flex-wrap gap-3 sm:gap-4 md:gap-6">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center space-x-1.5 sm:space-x-2 transition-colors ${userReactions[post.id]?.liked
                        ? 'text-primary-600'
                        : 'text-gray-600 hover:text-primary-600'
                        }`}
                    >
                      <ThumbsUp className={`w-4 h-4 sm:w-5 sm:h-5 ${userReactions[post.id]?.liked ? 'fill-current' : ''}`} />
                      <span className="text-sm sm:text-base">{getDisplayCount(post.id, 0, 'likes')}</span>
                    </button>
                    <button
                      onClick={() => toggleUnlike(post.id)}
                      className={`flex items-center space-x-1.5 sm:space-x-2 transition-colors ${userReactions[post.id]?.unliked
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                        }`}
                      title={userReactions[post.id]?.unliked ? 'Remove unlike' : 'Unlike'}
                    >
                      <ThumbsDown className={`w-4 h-4 sm:w-5 sm:h-5 ${userReactions[post.id]?.unliked ? 'fill-current' : ''}`} />
                      <span className="text-sm sm:text-base">{getDisplayCount(post.id, 0, 'unliked')}</span>
                    </button>
                    <button
                      onClick={() => setShowComments({ ...showComments, [post.id]: !showComments[post.id] })}
                      className={`flex items-center space-x-1.5 sm:space-x-2 transition-colors ${showComments[post.id]
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                        }`}
                    >
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base">{getDisplayCount(post.id, 0, 'comments')}</span>
                    </button>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 text-gray-600">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base">{getDisplayCount(post.id, 0, 'participants')} <span className="hidden sm:inline">{getDisplayCount(post.id, 0, 'participants') === 1 ? 'participant' : 'participants'}</span></span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      onClick={() => joinAdvocacy(post.id)}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium ${userReactions[post.id]?.participating
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                        }`}
                    >
                      {userReactions[post.id]?.participating
                        ? (post.type === 'pledge' ? 'Joined' : 'Supported')
                        : (post.type === 'pledge' ? 'Join Pledge' : 'Support')
                      }
                    </button>
                    <button
                      onClick={() => handleShare(post)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Share this post"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                {showComments[post.id] && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-3">Comments</h4>

                    {/* Existing Comments */}
                    <div className="space-y-3 mb-4">
                      {getAllComments(post.id).map((comment, index) => (
                        <CommentItem
                          key={comment.id || index}
                          comment={comment}
                          postId={post.id}
                          path={String(index)}
                          depth={0}
                        />
                      ))}
                    </div>

                    {/* Add Comment */}
                    {user && (
                      <div className="flex space-x-2">
                        <input
                          key={`new-comment-${post.id}`}
                          type="text"
                          placeholder="Leave a comment..."
                          value={newComment[post.id] || ''}
                          onChange={(e) => {
                            const value = e.target.value
                            setNewComment(prev => ({
                              ...prev,
                              [post.id]: value
                            }))
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addComment(post.id)
                            }
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => addComment(post.id)}
                          className="btn-primary"
                        >
                          Post
                        </button>
                      </div>
                    )}
                    {!user && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        <button
                          onClick={() => navigate('/login')}
                          className="text-primary-600 hover:text-primary-700 underline"
                        >
                          Log in
                        </button>
                        {' to leave a comment'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {advocacyPosts.length === 0 && (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No advocacy posts yet. Be the first to share your cause!</p>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        showConfirm={modal.showConfirm}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmModal.isOpen}
        onClose={handleCancelDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        type="warning"
        showConfirm={true}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  )
}
