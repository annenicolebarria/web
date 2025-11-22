import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, BookOpen, CheckCircle, Clock, MessageCircle, ThumbsDown, ThumbsUp, Filter, Star, Trash2, CornerDownLeft, X, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import IdeaCard from '../components/IdeaCard'
import Modal from '../components/Modal'
import { incrementUserStat, addUserActivity, notifyContentOwner, formatRelativeTime, validateAndFixDate } from './Home'

// Default articles data
const defaultArticles = [
  {
    id: 1,
    title: 'What Is Urban Planning?',
    source: 'ArchDaily',
    author: 'Camilla Ghisleni',
    url: 'https://www.archdaily.com/984049/what-is-urban-planning',
    content: 'Urban planning is a process of elaborating solutions that aim both to improve or requalify an existing urban area, as well as to create a new urbanization in a given region. As a discipline and as a method of action, urban planning deals with the processes of production, structuring and appropriation of urban space. In this sense, its main objective is to point out what measures should be taken to improve the quality of life of the inhabitants, including matters such as transport, security, access opportunities and even interaction with the natural environment. In the urban planning process, problems arising from urbanization are dealt with, such as pollution, traffic jam, urban voids, ecological impacts, making it essential in the current context in which much is discussed about the future of cities and the aspirations of sustainability and mobility as a way of fighting climate change.',
    readTime: '6 min read',
    status: 'not-started',
    category: 'Urban Planning',
    date: '2022-07-05',
    likes: 0,
    hearts: 0,
    comments: 0,
    userComments: [],
  },
  {
    id: 2,
    title: 'Types of Waste and Waste Management',
    source: 'Repsol Energy',
    author: 'Repsol Editorial Team',
    url: 'https://www.repsol.com/en/energy-move-forward/energy/types-of-waste/index.cshtml',
    content: 'There are different types of waste that can be classified according to their origin, composition, or the risk they pose to health and the environment. Understanding these types helps in proper waste management. At Repsol, we adopt the circular economy in all countries and businesses in which we operate: from the production of energy and raw materials to ecodesign in the marketing of our products. In this way, we optimize resources, reduce consumption of raw materials, and reduce the carbon footprint. An example of this waste management based on the circular economy is the start-up in Cartagena of the first plant on the Iberian Peninsula dedicated exclusively to the production of fuels of 100% renewable origin from organic waste, which will prevent the emission of 900,000 annual tonnes of CO2.',
    readTime: '8 min read',
    status: 'not-started',
    category: 'Waste Management',
    date: '2024-01-10',
    likes: 0,
    hearts: 0,
    comments: 0,
    userComments: [],
  },
  {
    id: 3,
    title: 'Plastic Waste Pollution Crisis in the Philippines',
    source: 'Arowana Impact Capital',
    author: 'Environmental Research Team',
    url: 'https://arowanaimpactcapital.com/plastic-waste-pollution-crisis-philippines/',
    content: 'The Philippines faces a significant plastic waste pollution crisis that threatens marine ecosystems and public health. This article explores the extent of the problem, its impacts on the environment, and potential solutions. Understanding the root causes and implementing effective waste management strategies is crucial for protecting our oceans and marine life. The crisis requires urgent action from individuals, communities, businesses, and government to address this pressing environmental issue.',
    readTime: '10 min read',
    status: 'not-started',
    category: 'Pollution',
    date: '2024-01-08',
    likes: 0,
    hearts: 0,
    comments: 0,
    userComments: [],
  },
  {
    id: 4,
    title: 'Climate News from the Philippines',
    source: 'Philippine Atmospheric, Geophysical and Astronomical Services Administration (PAGASA)',
    author: 'PAGASA Climate Division',
    url: 'https://climate.gov.ph/news/923',
    content: 'Latest climate updates and information from the Philippines. This article provides insights into current climate conditions, weather patterns, and climate change impacts affecting the country. Understanding climate trends is essential for preparing communities and developing adaptation strategies for a more resilient future.',
    readTime: '5 min read',
    status: 'not-started',
    category: 'Climate',
    date: '2024-01-15',
    likes: 0,
    hearts: 0,
    comments: 0,
    userComments: [],
  },


  {
    id: 7,
    title: 'Sustainable Agriculture in Asia-Pacific',
    source: 'Food and Fertilizer Technology Center (FFTC)',
    author: 'FFTC Research Team',
    url: 'https://ap.fftc.org.tw/article/588',
    content: 'Sustainable agriculture practices in the Asia-Pacific region are crucial for food security and environmental protection. This article explores innovative farming techniques, resource management strategies, and policy approaches that can help feed growing populations while preserving natural resources. Modern agriculture faces numerous challenges, but sustainable practices offer hope for feeding the world while protecting the environment.',
    readTime: '7 min read',
    status: 'not-started',
    category: 'Agriculture',
    date: '2024-01-09',
    likes: 0,
    hearts: 0,
    comments: 0,
    userComments: [],
  },
  {
    id: 9,
    title: 'Environmental Resources',
    source: 'Google Share',
    author: 'Christell',
    url: 'https://share.google/efHXaQzSiuilNZOoh',
    content: 'Shared environmental resources and educational materials. This resource provides valuable information on environmental topics, sustainability practices, and educational content for students and educators.',
    readTime: '8 min read',
    status: 'not-started',
    category: 'Resources',
    date: '2025-11-20',
    likes: 0,
    hearts: 0,
    comments: 0,
    userComments: [],
  },
  {
    id: 13,
    title: 'Eco Environment Protection Infographic',
    source: 'Freepik',
    author: 'Freepik',
    url: 'https://www.google.com/imgres?imgurl=https://img.freepik.com/premium-vector/eco-environment-protection-infographic-design_8071-20857.jpg&tbnid=70nqy7wbEWyp9M&vet=1&imgrefurl=https://www.freepik.com/premium-vector/eco-environment-protection-infographic-design_33158358.htm&docid=vxAkvsiT_T6vAM&w=343&h=626&source=sh/x/im/m5/2&kgs=b48711d9c0cd21c5&shem=isst,shrtsdl&utm_source=isst,shrtsdl,sh/x/im/m5/2',
    content: 'Infographic about eco environment protection. View and download this resource for environmental education and awareness.',
    readTime: '2 min read',
    status: 'not-started',
    category: 'Infographic',
    date: '2025-11-20',
    likes: 0,
    hearts: 0,
    comments: 0,
    userComments: [],
  },
  {
    id: 10,
    title: 'Environmental Education Video',
    source: 'YouTube',
    author: 'YouTube',
    url: 'https://www.youtube.com/watch?v=fephtrPt6wk',
    content: 'Watch this YouTube video to learn about environmental issues and solutions. Visual learning materials help students understand complex environmental concepts.',
    readTime: '10 min read',
    status: 'not-started',
    category: 'Video Content',
    date: '2025-11-20',
    likes: 0,
    hearts: 0,
    comments: 0,
    userComments: [],
  },
  {
    id: 11,
    title: 'Environmental Learning Video',
    source: 'YouTube',
    author: 'YouTube',
    url: 'https://www.youtube.com/watch?v=MEb7nnMLcaA',
    content: 'This video covers important environmental topics and provides insights into how individuals and communities can contribute to a more sustainable future.',
    readTime: '10 min read',
    status: 'not-started',
    category: 'Video Content',
    date: '2025-11-20',
    likes: 0,
    hearts: 0,
    comments: 0,
    userComments: [],
  },
  {
    id: 12,
    title: 'Urban Experience Design Initiative',
    source: 'Urban Design Forum',
    author: 'Urban Design Forum',
    url: 'https://urbandesignforum.org/initiative/urban-experience-design/#events',
    content: 'Urban experience design focuses on creating better urban environments through thoughtful design and planning. This initiative explores how urban design can improve quality of life, sustainability, and community engagement in cities. Learn about events, workshops, and resources that connect urban designers, planners, and community members.',
    readTime: '7 min read',
    status: 'not-started',
    category: 'Urban Design',
    date: '2025-11-20',
    likes: 0,
    hearts: 0,
    comments: 0,
    userComments: [],
  },
]

export default function EcoLearn() {
  const navigate = useNavigate()
  const { user, API_URL } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' })

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

  // Load aggregate counts (shared across all users)
  const loadAggregateCounts = () => {
    try {
      const saved = localStorage.getItem('ecolearn_aggregate_counts')
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
      localStorage.setItem('ecolearn_aggregate_counts', JSON.stringify(counts))
    } catch (error) {
      console.error('Error saving aggregate counts:', error)
    }
  }

  // Load articles - articles are global, but we'll use per-user data for reactions/comments
  const loadArticles = () => {
    // Check if admin has saved articles in localStorage
    try {
      const savedArticles = localStorage.getItem('ecolearn_articles')
      if (savedArticles) {
        const adminArticles = JSON.parse(savedArticles)
        if (adminArticles.length > 0) {
          // Use admin-saved articles
          const aggregateCounts = loadAggregateCounts()
          return adminArticles.map(article => ({
            ...article,
            likes: aggregateCounts[article.id]?.likes || article.likes || 0,
            hearts: aggregateCounts[article.id]?.hearts || article.hearts || 0,
            comments: aggregateCounts[article.id]?.comments || article.comments || 0,
            userComments: [] // Comments stored per-user separately
          }))
        }
      }
    } catch (error) {
      console.error('Error loading admin articles:', error)
    }

    // Fall back to default articles
    const aggregateCounts = loadAggregateCounts()
    return defaultArticles.map(article => ({
      ...article,
      likes: aggregateCounts[article.id]?.likes || 0,
      hearts: aggregateCounts[article.id]?.hearts || 0,
      comments: aggregateCounts[article.id]?.comments || 0,
      userComments: [] // Comments stored per-user separately
    }))
  }

  const [articles, setArticles] = useState(loadArticles())

  // Listen for admin article updates
  useEffect(() => {
    const handleArticlesUpdate = () => {
      setArticles(loadArticles())
    }
    window.addEventListener('ecolearnArticlesUpdated', handleArticlesUpdate)
    return () => window.removeEventListener('ecolearnArticlesUpdated', handleArticlesUpdate)
  }, [])
  const [timeUpdateKey, setTimeUpdateKey] = useState(0) // Force re-render for time updates

  // Update time display in real-time every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUpdateKey(prev => prev + 1)
    }, 5000) // Update every 5 seconds for real-time feel

    return () => clearInterval(interval)
  }, [])

  const [showComments, setShowComments] = useState({})
  const [newComment, setNewComment] = useState({})
  const [replyingTo, setReplyingTo] = useState({}) // { articleId: { 'path': 'text' } } e.g., '0' for comment 0, '0-0' for reply 0 of comment 0
  const [showReplies, setShowReplies] = useState({}) // { articleId: { 'path': true/false } }

  // Load user reactions from localStorage (per-user)
  const loadUserReactions = () => {
    if (!user) return {}
    const userId = getUserId()
    const saved = localStorage.getItem(`ecolearn_user_reactions_${userId}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Migrate old "hearted" to "unliked" for backward compatibility
        const migrated = {}
        Object.keys(parsed).forEach(key => {
          if (parsed[key].hearted !== undefined) {
            migrated[key] = {
              ...parsed[key],
              unliked: parsed[key].hearted,
              hearted: undefined
            }
          } else {
            migrated[key] = parsed[key]
          }
        })
        return migrated
      } catch (error) {
        console.error('Error loading user reactions from localStorage:', error)
        return {}
      }
    }
    return {}
  }

  // Load user comments from localStorage (per-user)
  const loadUserComments = () => {
    if (!user) return {}
    const userId = getUserId()
    const saved = localStorage.getItem(`ecolearn_user_comments_${userId}`)
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

  // Track user reactions for each article
  const [userReactions, setUserReactions] = useState(() => {
    // Load immediately on mount
    try {
      if (!user) return {}
      const userId = user?.id || user?.email || 'anonymous'
      const saved = localStorage.getItem(`ecolearn_user_reactions_${userId}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Migrate old "hearted" to "unliked"
        const migrated = {}
        Object.keys(parsed).forEach(key => {
          if (parsed[key].hearted !== undefined) {
            migrated[key] = {
              ...parsed[key],
              unliked: parsed[key].hearted,
              hearted: undefined
            }
          } else {
            migrated[key] = parsed[key]
          }
        })
        return migrated
      }
    } catch (error) {
      console.error('Error loading initial reactions:', error)
    }
    return {}
  })
  // Track user comments per article
  const [userComments, setUserComments] = useState(() => {
    // Load immediately on mount
    try {
      if (!user) return {}
      const userId = user?.id || user?.email || 'anonymous'
      const saved = localStorage.getItem(`ecolearn_user_comments_${userId}`)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading initial comments:', error)
    }
    return {}
  })

  // Track which article is being viewed in modal
  const [viewingArticle, setViewingArticle] = useState(null)
  const [fetchedContent, setFetchedContent] = useState(null)
  const [fetchedData, setFetchedData] = useState(null)
  const [isLoadingContent, setIsLoadingContent] = useState(false)

  // Get proxy URL for article
  const getProxyUrl = (url) => {
    if (!url) return null
    const baseUrl = API_URL.replace('/api/auth', '')
    return `${baseUrl}/api/proxy?url=${encodeURIComponent(url)}`
  }

  // When article is selected for viewing, prepare proxy URL
  useEffect(() => {
    if (viewingArticle && viewingArticle.url) {
      // Reset states
      setFetchedData(null)
      setFetchedContent(null)
      setIsLoadingContent(true)

      // Use proxy server to show the actual article page
      const proxyUrl = getProxyUrl(viewingArticle.url)
      setFetchedData({
        success: true,
        useIframe: true,
        url: viewingArticle.url,
        proxyUrl: proxyUrl
      })

      // Set timeout to hide loading after 15 seconds
      const loadingTimeout = setTimeout(() => {
        setIsLoadingContent(false)
      }, 15000)

      return () => {
        clearTimeout(loadingTimeout)
      }
    } else {
      setFetchedData(null)
      setFetchedContent(null)
      setIsLoadingContent(false)
    }
  }, [viewingArticle, API_URL])

  // Close modal on Escape key press and prevent body scroll
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && viewingArticle) {
        setViewingArticle(null)
      }
    }

    if (viewingArticle) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEscape)
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset'
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [viewingArticle])

  // Reload user data when user changes (login/logout)
  useEffect(() => {
    try {
      if (user && (user.id || user.email)) {
        // Load data for the logged-in user
        const userId = user.id || user.email || 'anonymous'
        const reactionsKey = `ecolearn_user_reactions_${userId}`
        const commentsKey = `ecolearn_user_comments_${userId}`

        const savedReactions = localStorage.getItem(reactionsKey)
        const savedComments = localStorage.getItem(commentsKey)

        if (savedReactions) {
          try {
            const parsed = JSON.parse(savedReactions)
            // Migrate old "hearted" to "unliked" for backward compatibility
            const migrated = {}
            Object.keys(parsed).forEach(key => {
              if (parsed[key].hearted !== undefined) {
                migrated[key] = {
                  ...parsed[key],
                  unliked: parsed[key].hearted,
                  hearted: undefined
                }
              } else {
                migrated[key] = parsed[key]
              }
            })
            setUserReactions(migrated)
          } catch (error) {
            console.error('Error parsing user reactions:', error)
          }
        }

        if (savedComments) {
          try {
            setUserComments(JSON.parse(savedComments))
          } catch (error) {
            console.error('Error parsing user comments:', error)
          }
        }
      }
    } catch (error) {
      console.error('Error reloading user data:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email])

  // Save user reactions to localStorage whenever they change (per-user)
  useEffect(() => {
    if (!user) return
    const userId = getUserId()
    // Only save if userReactions is not empty
    if (Object.keys(userReactions).length > 0) {
      try {
        localStorage.setItem(`ecolearn_user_reactions_${userId}`, JSON.stringify(userReactions))
      } catch (error) {
        console.error('Error saving user reactions to localStorage:', error)
      }
    }
  }, [userReactions, user])

  // Save user comments to localStorage whenever they change (per-user)
  useEffect(() => {
    if (!user) return
    // Check if there's actual comment data (not just empty object)
    const hasComments = Object.keys(userComments).some(key =>
      Array.isArray(userComments[key]) && userComments[key].length > 0
    )
    if (hasComments) {
      const userId = getUserId()
      try {
        localStorage.setItem(`ecolearn_user_comments_${userId}`, JSON.stringify(userComments))
        console.log('Saved comments for user:', userId, userComments)
      } catch (error) {
        console.error('Error saving user comments to localStorage:', error)
      }
    }
  }, [userComments, user])

  // Reload articles with updated aggregate counts when component mounts or user changes
  useEffect(() => {
    setArticles(loadArticles())
  }, [user?.id, user?.email])

  // Get article status for current user
  const getArticleStatus = (articleId) => {
    if (!user) return 'not-started'
    return userReactions[articleId]?.status || 'not-started'
  }

  // Get comments for display - show ALL comments from all users
  const getArticleComments = (articleId) => {
    const allComments = []
    const keys = Object.keys(localStorage)
    const seenCommentIds = new Set()

    keys.forEach(key => {
      if (key.startsWith('ecolearn_user_comments_')) {
        try {
          const userArticleComments = JSON.parse(localStorage.getItem(key))
          if (userArticleComments[articleId]) {
            userArticleComments[articleId].forEach(comment => {
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
    if (user && userComments[articleId]) {
      const currentUserStateComments = userComments[articleId] || []
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

  // Calculate display count - show aggregate counts (all users)
  const getDisplayCount = (articleId, baseCount, reactionType) => {
    const article = articles.find(a => a.id === articleId)
    if (!article) return 0

    // When logged out, show aggregate counts
    if (!user) {
      if (reactionType === 'liked') return article.likes || 0
      if (reactionType === 'unliked') return article.hearts || 0
      if (reactionType === 'comments') {
        // For comments, we need to get total from aggregate
        const aggregateCounts = loadAggregateCounts()
        return aggregateCounts[articleId]?.comments || 0
      }
      return 0
    }

    // When logged in, show aggregate counts (which include their contribution)
    // But we can indicate if they've reacted
    const userReaction = userReactions[articleId]
    if (reactionType === 'liked') return article.likes || 0
    if (reactionType === 'unliked') return article.hearts || 0
    if (reactionType === 'comments') {
      // Show total comments from aggregate
      const aggregateCounts = loadAggregateCounts()
      return aggregateCounts[articleId]?.comments || 0
    }
    return 0
  }

  const filteredArticles = articles
    .filter((article) => {
      const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
      const articleStatus = getArticleStatus(article.id)
      const matchesFilter = selectedFilter === 'all' || articleStatus === selectedFilter
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      // Sort interested articles first
      const aInterested = userReactions[a.id]?.interested || false
      const bInterested = userReactions[b.id]?.interested || false

      if (aInterested && !bInterested) return -1
      if (!aInterested && bInterested) return 1
      return 0 // Keep original order for articles with same interested status
    })

  const toggleArticleStatus = (articleId) => {
    if (!requireAuth()) return

    // Store status in user reactions per-user
    const currentStatus = userReactions[articleId]?.status || 'not-started'
    let newStatus = currentStatus

    const timestamp = new Date().toISOString()

    if (currentStatus === 'not-started') {
      newStatus = 'reading'
      // Add activity when starting to read
      const userId = getUserId()
      if (userId) {
        const article = articles.find(a => a.id === articleId)
        if (article) {
          addUserActivity(userId, {
            type: 'article',
            title: `Started reading: ${article.title}`,
            articleId: article.id
          })
        }
      }
      // Store timestamp when started reading
      setUserReactions({
        ...userReactions,
        [articleId]: {
          ...userReactions[articleId],
          status: newStatus,
          startedAt: timestamp
        }
      })
    } else if (currentStatus === 'reading') {
      newStatus = 'finished'
      // Increment articlesRead stat when article is marked as finished
      const userId = getUserId()
      if (userId) {
        incrementUserStat(userId, 'articlesRead')
        // Add activity
        const article = articles.find(a => a.id === articleId)
        if (article) {
          addUserActivity(userId, {
            type: 'article',
            title: `Finished reading: ${article.title}`,
            articleId: article.id
          })
        }
      }
      // Store timestamp when finished reading
      setUserReactions({
        ...userReactions,
        [articleId]: {
          ...userReactions[articleId],
          status: newStatus,
          finishedAt: timestamp
        }
      })
    } else if (currentStatus === 'finished') {
      // Mark as unread - reset status
      newStatus = 'not-started'
      setUserReactions({
        ...userReactions,
        [articleId]: {
          ...userReactions[articleId],
          status: newStatus,
          startedAt: undefined,
          finishedAt: undefined
        }
      })
    }
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

  const deleteComment = (articleId, commentId) => {
    if (!requireAuth()) return

    const articleComments = userComments[articleId] || []
    const { filtered: updatedComments, deleted: deletedCount } = deleteCommentById(articleComments, commentId)

    if (deletedCount === 0) return // Comment not found

    setUserComments({
      ...userComments,
      [articleId]: updatedComments
    })

    // Track delete activity
    const userId = getUserId()
    const article = articles.find(a => a.id === articleId)
    if (userId && article) {
      addUserActivity(userId, {
        type: 'delete_comment',
        title: `Deleted comment on: ${article.title}`,
        postId: article.id
      })
    }

    // Update aggregate counts
    const aggregateCounts = loadAggregateCounts()
    if (!aggregateCounts[articleId]) {
      aggregateCounts[articleId] = { likes: 0, hearts: 0, comments: 0 }
    }
    aggregateCounts[articleId].comments = Math.max(0, (aggregateCounts[articleId].comments || 0) - deletedCount)
    saveAggregateCounts(aggregateCounts)

    setArticles(articles.map(article =>
      article.id === articleId
        ? { ...article, comments: aggregateCounts[articleId].comments }
        : article
    ))
  }

  const addComment = (articleId, parentPath = null) => {
    if (!requireAuth()) return

    let commentText = ''
    if (parentPath !== null) {
      commentText = replyingTo[articleId]?.[parentPath] || ''
      if (!commentText.trim()) return
    } else {
      commentText = newComment[articleId] || ''
      if (!commentText.trim()) return
    }

    // Find the parent comment ID if this is a reply
    let parentCommentId = null
    if (parentPath) {
      const allComments = getArticleComments(articleId)
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

    // Extract mentions from comment text (@username or @full name)
    const mentionRegex = /@([\w]+(?:\s+[\w]+)*)/g
    const mentions = []
    let match
    while ((match = mentionRegex.exec(commentText)) !== null) {
      mentions.push(match[1])
    }

    const comment = {
      id: Date.now() + Math.random(),
      author: user.name || user.username || 'You',
      userId: user.id || user.email,
      comment: commentText,
      date: new Date().toLocaleString(),
      replies: [],
      mentions: mentions.length > 0 ? mentions : undefined,
      parentId: parentCommentId // Store parent comment ID for replies
    }

    // Always add as top-level comment - replies will be grouped by parentId during display
    const articleComments = userComments[articleId] || []
    const updatedComments = [...articleComments, comment]

    setUserComments({
      ...userComments,
      [articleId]: updatedComments
    })

    if (parentPath !== null) {
      setReplyingTo({ ...replyingTo, [articleId]: { ...replyingTo[articleId], [parentPath]: '' } })
    } else {
      setNewComment({ ...newComment, [articleId]: '' })
    }

    // Add activity for comment
    const currentUserId = getUserId()
    if (currentUserId && articleId) {
      const article = articles.find(a => a.id === articleId)
      if (article) {
        addUserActivity(currentUserId, {
          type: parentCommentId ? 'reply' : 'comment',
          title: parentCommentId ? `Replied to a comment on: ${article.title}` : `Commented on: ${article.title}`,
          postId: article.id
        })

        // If this is a reply, notify the parent comment author
        if (parentCommentId && parentPath) {
          const allComments = getAllComments(articleId)
          const pathParts = parentPath.split('-').map(Number)
          let parentComment = allComments[pathParts[0]]
          for (let i = 1; i < pathParts.length; i++) {
            if (parentComment && parentComment.replies) {
              parentComment = parentComment.replies[pathParts[i]]
            }
          }
          // Notify parent comment author if it's someone else
          if (parentComment && parentComment.userId && parentComment.userId !== currentUserId) {
            addUserActivity(parentComment.userId, {
              type: 'received_reply',
              title: `${user.name || user.username} replied to your comment on: ${article.title}`,
              postId: article.id,
              fromUser: user.name || user.username
            })
          }
        }
      }
    }

    // Update aggregate counts
    const aggregateCounts = loadAggregateCounts()
    if (!aggregateCounts[articleId]) {
      aggregateCounts[articleId] = { likes: 0, hearts: 0, comments: 0 }
    }
    aggregateCounts[articleId].comments = (aggregateCounts[articleId].comments || 0) + 1
    saveAggregateCounts(aggregateCounts)

    setArticles(articles.map(article =>
      article.id === articleId
        ? { ...article, comments: aggregateCounts[articleId].comments }
        : article
    ))

    // Add activity for comment
    const userId = getUserId()
    if (userId && articleId) {
      const article = articles.find(a => a.id === articleId)
      if (article) {
        addUserActivity(userId, {
          type: 'comment',
          title: `Commented on: ${article.title}`,
          articleId: article.id
        })
      }
    }
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
  const CommentItem = ({ comment, articleId, path, depth = 0 }) => {
    const isReplying = replyingTo[articleId]?.[path] !== undefined
    const isShowingReplies = showReplies[articleId]?.[path] !== false && depth < 3

    return (
      <div className={depth > 0 ? "bg-white rounded p-2 border-l-2 border-primary-300 ml-4 mt-2" : "bg-gray-50 rounded-lg p-3"}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <span className={`font-medium ${depth > 0 ? 'text-sm' : ''} text-gray-900`}>{comment.author}</span>
            <span className={`text-gray-500 ${depth > 0 ? 'text-xs' : 'text-sm'}`}>•</span>
            <span className={`text-gray-500 ${depth > 0 ? 'text-xs' : 'text-sm'}`}>{comment.date}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (!requireAuth()) return
                const currentValue = replyingTo[articleId]?.[path] || ''
                setReplyingTo({
                  ...replyingTo,
                  [articleId]: {
                    ...replyingTo[articleId],
                    [path]: currentValue || `@${comment.author} `
                  }
                })
              }}
              className={`text-primary-600 hover:text-primary-700 ${depth > 0 ? 'text-xs' : 'text-sm'} flex items-center gap-1`}
              title="Reply"
            >
              <CornerDownLeft className={`${depth > 0 ? 'w-3 h-3' : 'w-4 h-4'}`} />
            </button>
            {user && (comment.author === user.name || comment.author === user.username || comment.author === 'You') && (
              <button
                onClick={() => {
                  setModal({
                    isOpen: true,
                    title: 'Delete Comment',
                    message: 'Are you sure you want to delete this comment? This action cannot be undone.',
                    type: 'warning',
                    showConfirm: true,
                    onConfirm: () => {
                      deleteComment(articleId, comment.id)
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
                onClick={() => setShowReplies({ ...showReplies, [articleId]: { ...showReplies[articleId], [path]: !showReplies[articleId]?.[path] } })}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                {showReplies[articleId]?.[path] === false ? 'Show' : 'Hide'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
            {(isShowingReplies || depth >= 2) && (
              <div className="space-y-2 mt-2">
                {comment.replies.map((reply, replyIndex) => (
                  <CommentItem
                    key={reply.id || replyIndex}
                    comment={reply}
                    articleId={articleId}
                    path={path ? `${path}-${replyIndex}` : `${replyIndex}`}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {isReplying && (
          <div className="mt-2 ml-4 flex space-x-2" key={`reply-input-${articleId}-${path}`}>
            <input
              key={`input-${articleId}-${path}`}
              type="text"
              placeholder={`Reply to ${comment.author}... (use @username to mention)`}
              value={replyingTo[articleId]?.[path] || ''}
              onChange={(e) => {
                const value = e.target.value
                setReplyingTo(prev => ({
                  ...prev,
                  [articleId]: {
                    ...(prev[articleId] || {}),
                    [path]: value
                  }
                }))
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addComment(articleId, path)
                }
              }}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={() => addComment(articleId, path)}
              className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-1"
              title="Reply"
            >
              <CornerDownLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const updated = { ...replyingTo }
                if (updated[articleId]) {
                  delete updated[articleId][path]
                  if (Object.keys(updated[articleId]).length === 0) {
                    delete updated[articleId]
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

  const toggleLike = (articleId) => {
    if (!requireAuth()) return

    const isLiked = userReactions[articleId]?.liked || false
    const wasUnliked = userReactions[articleId]?.unliked || false

    // Update user reactions
    setUserReactions({
      ...userReactions,
      [articleId]: {
        ...userReactions[articleId],
        liked: !isLiked,
        unliked: false // Reset unlike if liked
      }
    })

    // Update aggregate counts
    const aggregateCounts = loadAggregateCounts()
    if (!aggregateCounts[articleId]) {
      aggregateCounts[articleId] = { likes: 0, hearts: 0, comments: 0 }
    }

    if (!isLiked) {
      // Adding a like
      aggregateCounts[articleId].likes = (aggregateCounts[articleId].likes || 0) + 1
      // If was unliked, remove the unlike
      if (wasUnliked && aggregateCounts[articleId].hearts > 0) {
        aggregateCounts[articleId].hearts = Math.max(0, aggregateCounts[articleId].hearts - 1)
      }
      // Track user's own like action
      const userId = getUserId()
      const article = articles.find(a => a.id === articleId)
      if (userId && article) {
        addUserActivity(userId, {
          type: 'like',
          title: `Liked: ${article.title}`,
          articleId: article.id
        })
      }
    } else {
      // Removing a like
      aggregateCounts[articleId].likes = Math.max(0, (aggregateCounts[articleId].likes || 0) - 1)
      // Track unlike action
      const userId = getUserId()
      const article = articles.find(a => a.id === articleId)
      if (userId && article) {
        addUserActivity(userId, {
          type: 'unlike',
          title: `Unliked: ${article.title}`,
          articleId: article.id
        })
      }
    }

    saveAggregateCounts(aggregateCounts)

    // Update articles state to reflect new counts
    setArticles(articles.map(article =>
      article.id === articleId
        ? { ...article, likes: aggregateCounts[articleId].likes, hearts: aggregateCounts[articleId].hearts }
        : article
    ))
  }

  const toggleUnlike = (articleId) => {
    if (!requireAuth()) return

    const isUnliked = userReactions[articleId]?.unliked || false
    const wasLiked = userReactions[articleId]?.liked || false

    // Update user reactions
    setUserReactions({
      ...userReactions,
      [articleId]: {
        ...userReactions[articleId],
        unliked: !isUnliked,
        liked: false // Reset like if unliked
      }
    })

    // Update aggregate counts
    const aggregateCounts = loadAggregateCounts()
    if (!aggregateCounts[articleId]) {
      aggregateCounts[articleId] = { likes: 0, hearts: 0, comments: 0 }
    }

    if (!isUnliked) {
      // Adding an unlike
      aggregateCounts[articleId].hearts = (aggregateCounts[articleId].hearts || 0) + 1
      // If was liked, remove the like
      if (wasLiked && aggregateCounts[articleId].likes > 0) {
        aggregateCounts[articleId].likes = Math.max(0, aggregateCounts[articleId].likes - 1)
      }
      // Track user's own unlike action
      const userId = getUserId()
      const article = articles.find(a => a.id === articleId)
      if (userId && article) {
        addUserActivity(userId, {
          type: 'unlike',
          title: `Unliked: ${article.title}`,
          articleId: article.id
        })
      }
    } else {
      // Removing an unlike
      aggregateCounts[articleId].hearts = Math.max(0, (aggregateCounts[articleId].hearts || 0) - 1)
    }

    saveAggregateCounts(aggregateCounts)

    // Update articles state to reflect new counts
    setArticles(articles.map(article =>
      article.id === articleId
        ? { ...article, likes: aggregateCounts[articleId].likes, hearts: aggregateCounts[articleId].hearts }
        : article
    ))
  }

  const toggleInterested = (articleId) => {
    if (!requireAuth()) return

    const isInterested = userReactions[articleId]?.interested || false
    setUserReactions({
      ...userReactions,
      [articleId]: {
        ...userReactions[articleId],
        interested: !isInterested
      }
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">EcoLearn: The Knowledge Hub</h1>
        <p className="text-gray-600">Educational hub providing articles, infographics, and videos focused on sustainability, urban development, and environmental conservation</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="not-started">Not Started</option>
            <option value="reading">Reading</option>
            <option value="finished">Finished</option>
          </select>
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-6">
        {filteredArticles.map((article) => (
          <div key={article.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2 flex-wrap">
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    {article.category}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">{article.source}</span>
                  {article.author && (
                    <>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">By {article.author}</span>
                    </>
                  )}
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">{article.readTime}</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{article.title}</h2>
                <div className="text-gray-600 mb-4 line-clamp-3">
                  {article.content && article.content.length > 200
                    ? article.content.substring(0, 200) + '...'
                    : article.content}
                </div>
                {article.url && (
                  <button
                    onClick={() => {
                      setViewingArticle(article)
                      // Track that user is accessing the article
                      if (getArticleStatus(article.id) === 'not-started' && user) {
                        toggleArticleStatus(article.id)
                      }
                    }}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium mb-4"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Read Full Article</span>
                  </button>
                )}
                {!article.url && <div className="mb-4"></div>}
              </div>
              {getArticleStatus(article.id) === 'finished' && (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 ml-4" />
              )}
            </div>

            {/* Status Badge and Action Button */}
            <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                {getArticleStatus(article.id) === 'finished' && (
                  <span className="flex items-center space-x-1 text-green-600" key={`finished-${article.id}-${timeUpdateKey}`}>
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Finished Reading</span>
                    {userReactions[article.id]?.finishedAt && (
                      <span className="text-xs text-gray-500 ml-2">
                        {formatRelativeTime(validateAndFixDate(userReactions[article.id].finishedAt))}
                      </span>
                    )}
                  </span>
                )}
                {getArticleStatus(article.id) === 'reading' && (
                  <span className="flex items-center space-x-1 text-blue-600" key={`reading-${article.id}-${timeUpdateKey}`}>
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Continue Reading</span>
                    {userReactions[article.id]?.startedAt && (
                      <span className="text-xs text-gray-500 ml-2">
                        Started {formatRelativeTime(validateAndFixDate(userReactions[article.id].startedAt))}
                      </span>
                    )}
                  </span>
                )}
                {getArticleStatus(article.id) === 'not-started' && (
                  <span className="flex items-center space-x-1 text-gray-600">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Not Started</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const currentStatus = getArticleStatus(article.id)
                    if (currentStatus === 'not-started' && article.url) {
                      // Open article in modal when starting to read
                      setViewingArticle(article)
                    }
                    toggleArticleStatus(article.id)
                  }}
                  className={`${getArticleStatus(article.id) === 'finished'
                    ? 'btn-secondary'
                    : 'btn-primary'
                    }`}
                >
                  {getArticleStatus(article.id) === 'finished'
                    ? 'Mark as Unread'
                    : getArticleStatus(article.id) === 'reading'
                      ? 'Mark as Finished'
                      : 'Start Reading'}
                </button>
              </div>
            </div>

            {/* Reactions */}
            <div className="flex items-center space-x-6 mb-4 pb-4 border-b border-gray-100" key={`reactions-${article.id}`}>
              <button
                onClick={() => toggleLike(article.id)}
                className={`flex items-center space-x-2 transition-colors ${userReactions[article.id]?.liked
                  ? 'text-primary-600'
                  : 'text-gray-600 hover:text-primary-600'
                  }`}
              >
                <ThumbsUp className={`w-5 h-5 ${userReactions[article.id]?.liked ? 'fill-current' : ''}`} />
                <span>{getDisplayCount(article.id, 0, 'liked')}</span>
              </button>
              <button
                onClick={() => toggleUnlike(article.id)}
                className={`flex items-center space-x-2 transition-colors ${userReactions[article.id]?.unliked
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
                  }`}
                title={userReactions[article.id]?.unliked ? 'Remove unlike' : 'Unlike'}
              >
                <ThumbsDown className={`w-5 h-5 ${userReactions[article.id]?.unliked ? 'fill-current' : ''}`} />
                <span>{getDisplayCount(article.id, 0, 'unliked')}</span>
              </button>
              <button
                onClick={() => toggleInterested(article.id)}
                className={`flex items-center space-x-2 transition-colors ${userReactions[article.id]?.interested
                  ? 'text-yellow-600'
                  : 'text-gray-600 hover:text-yellow-600'
                  }`}
                title={userReactions[article.id]?.interested ? 'Remove from interested' : 'Mark as interested'}
              >
                <Star className={`w-5 h-5 ${userReactions[article.id]?.interested ? 'fill-current' : ''}`} />
                <span className="text-sm">{userReactions[article.id]?.interested ? 'Interested' : 'Interested'}</span>
              </button>
              <button
                onClick={() => setShowComments({ ...showComments, [article.id]: !showComments[article.id] })}
                className={`flex items-center space-x-2 transition-colors ${showComments[article.id]
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
                  }`}
              >
                <MessageCircle className="w-5 h-5" />
                <span>{getDisplayCount(article.id, 0, 'comments')}</span>
              </button>
            </div>

            {/* Comments Section */}
            {showComments[article.id] && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-3">Comments</h4>

                {/* Existing Comments */}
                <div className="space-y-3 mb-4">
                  {getArticleComments(article.id).map((comment, index) => (
                    <CommentItem
                      key={comment.id || index}
                      comment={comment}
                      articleId={article.id}
                      path={String(index)}
                      depth={0}
                    />
                  ))}
                </div>

                {/* Add Comment */}
                {user && (
                  <div className="flex space-x-2">
                    <input
                      key={`new-comment-${article.id}`}
                      type="text"
                      placeholder="Leave a comment..."
                      value={newComment[article.id] || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        setNewComment(prev => ({
                          ...prev,
                          [article.id]: value
                        }))
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addComment(article.id)
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => addComment(article.id)}
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
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No articles found. Try adjusting your search or filter.</p>
        </div>
      )}

      {/* Article Reader Modal - Full Screen Reading Experience */}
      {viewingArticle && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Modal Header - Sticky */}
          <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 bg-white shadow-sm">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <button
                onClick={() => setViewingArticle(null)}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                title="Back to Articles"
              >
                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">{viewingArticle.title}</h3>
                <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mt-1">
                  <p className="text-xs sm:text-sm text-gray-500">{viewingArticle.source}</p>
                  {(fetchedData?.author || viewingArticle.author) && (
                    <>
                      <span className="text-xs sm:text-sm text-gray-400">•</span>
                      <p className="text-xs sm:text-sm text-gray-500">By {fetchedData?.author || viewingArticle.author}</p>
                    </>
                  )}
                  {fetchedData?.publicationDate && (
                    <>
                      <span className="text-xs sm:text-sm text-gray-400">•</span>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {new Date(fetchedData.publicationDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </>
                  )}
                  {viewingArticle.readTime && (
                    <>
                      <span className="text-sm text-gray-400">•</span>
                      <p className="text-sm text-gray-500">{viewingArticle.readTime}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => setViewingArticle(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>

          {/* Article Content - Scrollable Reader View */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
              {/* Article Metadata */}
              <div className="mb-4 sm:mb-6 md:mb-8 pb-3 sm:pb-4 md:pb-6 border-b border-gray-200">
                <div className="flex items-center space-x-2 mb-2 sm:mb-3 flex-wrap gap-y-1">
                  {viewingArticle.category && (
                    <span className="px-2 sm:px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs sm:text-sm font-medium">
                      {viewingArticle.category}
                    </span>
                  )}
                  {viewingArticle.date && (
                    <>
                      <span className="text-xs sm:text-sm text-gray-400">•</span>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Published: {new Date(viewingArticle.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Article Content - Enhanced Readability */}
              {isLoadingContent ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading article content...</p>
                  </div>
                </div>
              ) : fetchedData?.isVideo ? (
                // YouTube Video Content
                <article className="prose prose-lg prose-gray max-w-none">
                  <div className="mb-6">
                    <p className="text-gray-700 mb-4">{fetchedContent || 'Watch the video below.'}</p>
                  </div>
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={fetchedData.embedUrl}
                      title={viewingArticle.title || 'Video'}
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </article>
              ) : fetchedData?.isPDF ? (
                // PDF Content
                <article className="prose prose-lg prose-gray max-w-none">
                  <div className="mb-6">
                    <p className="text-gray-700 mb-4">{fetchedContent || 'View the PDF document below.'}</p>
                  </div>
                  <div className="w-full h-screen border border-gray-300 rounded-lg overflow-hidden">
                    <iframe
                      src={fetchedData.pdfUrl}
                      title={viewingArticle.title || 'PDF'}
                      className="w-full h-full"
                      frameBorder="0"
                    ></iframe>
                  </div>
                </article>
              ) : fetchedData?.isGoogleShare ? (
                // Google Share Content
                <article className="prose prose-lg prose-gray max-w-none">
                  <div className="mb-6">
                    <p className="text-gray-700 mb-4">{fetchedContent || 'This is shared content from Google.'}</p>
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mt-4">
                      <p className="text-sm text-gray-600 mb-3">
                        To view the shared content, please access the original link:
                      </p>
                      <a
                        href={viewingArticle.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                      >
                        <span>Open Shared Content</span>
                      </a>
                    </div>
                  </div>
                </article>
              ) : (
                // Show actual article using proxy server in iframe
                <article className="prose prose-lg prose-gray max-w-none">
                  <div className="w-full border border-gray-300 rounded-lg overflow-hidden bg-white relative" style={{ minHeight: '80vh' }}>
                    {isLoadingContent && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                          <p className="text-gray-500">Loading article content...</p>
                        </div>
                      </div>
                    )}
                    <iframe
                      key={viewingArticle.url} // Force reload when article changes
                      src={fetchedData?.proxyUrl || getProxyUrl(viewingArticle.url)}
                      title={viewingArticle.title || 'Article'}
                      className="w-full"
                      style={{
                        height: '85vh',
                        border: 'none',
                        display: 'block',
                        visibility: isLoadingContent ? 'hidden' : 'visible'
                      }}
                      frameBorder="0"
                      allow="fullscreen"
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
                      loading="lazy"
                      onError={(e) => {
                        console.error('Iframe load error:', e)
                        setIsLoadingContent(false)
                      }}
                      onLoad={() => {
                        console.log('Iframe loaded successfully')
                        setIsLoadingContent(false)
                      }}
                    ></iframe>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Article Source:</strong>{' '}
                      <a
                        href={viewingArticle.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 underline"
                      >
                        {viewingArticle.url}
                      </a>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Article is being served through our proxy server. If it doesn't load properly, you can open it in a new tab using the link above.
                    </p>
                  </div>
                </article>
              )}
            </div>
          </div>

          {/* Modal Footer - Sticky */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white shadow-sm">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  toggleArticleStatus(viewingArticle.id)
                  setViewingArticle(null)
                }}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${getArticleStatus(viewingArticle.id) === 'finished'
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {getArticleStatus(viewingArticle.id) === 'finished'
                    ? 'Mark as Unread'
                    : 'Mark as Finished'}
                </span>
              </button>
            </div>
            <button
              onClick={() => setViewingArticle(null)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
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
    </div>
  )
}
