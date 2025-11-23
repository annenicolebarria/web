import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, TrendingUp, TrendingDown, MessageCircle, ThumbsDown, ThumbsUp, User, Tag, Video, Image, MapPin, FileText, Users, Award, Lightbulb, BarChart2, Info, CheckCircle, Trash2, CornerDownLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import IdeaCard from '../components/IdeaCard'
import Modal from '../components/Modal'
import { markActivityComplete, isActivityComplete, incrementUserStat, addUserActivity, setPostOwner, notifyContentOwner, formatRelativeTime, validateAndFixDate } from './Home'

// Backend-powered support state
// Structure: { [postId]: { supported: boolean, count: number } }

export default function CollabSpace() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showPostForm, setShowPostForm] = useState(false)
  const [sortBy, setSortBy] = useState('trending') // 'trending', 'newest', 'most-votes'
  const [filterByType, setFilterByType] = useState('all') // Filter by pitch type
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' })
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, postId: null })
  const [supportByPost, setSupportByPost] = useState({})
  const [forumPosts, setForumPosts] = useState([])
  // Fetch support state for all posts from backend
  useEffect(() => {
    const fetchSupport = async () => {
      if (!forumPosts.length) return
      const newSupportByPost = {}
      for (const post of forumPosts) {
        try {
          // Get support count
          const res = await fetch(`http://72.61.125.98:3001/api/posts/${post.id}/support`)
          let count = 0
          let supported = false
          if (res.ok) {
            const data = await res.json()
            count = Array.isArray(data) ? data.length : 0
            // Check if current user supports this post
            if (user) {
              supported = data.some(s => String(s.user_id) === String(user.id || user.email))
            }
          }
          newSupportByPost[post.id] = { supported, count }
        } catch {
          newSupportByPost[post.id] = { supported: false, count: 0 }
        }
      }
      setSupportByPost(newSupportByPost)
    }
    fetchSupport()
    // Poll for real-time updates
    const interval = setInterval(fetchSupport, 5000)
    return () => clearInterval(interval)
  }, [forumPosts, user])

  // Support/un-support a post
  const toggleSupport = async (postId) => {
    if (!requireAuth()) return
    if (!user) return
    const supported = supportByPost[postId]?.supported
    try {
      const url = `http://72.61.125.98:3001/api/posts/${postId}/support`
      const method = supported ? 'DELETE' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(supported ? { Authorization: '' } : {}) },
        // If using JWT, add Authorization header here
        // body: JSON.stringify({ userId: user.id || user.email })
      })
      if (!res.ok) throw new Error('Failed to update support')
    } catch (e) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update support. Please try again.',
        type: 'error'
      })
      return
    }
    // Refresh support for this post (will be picked up by polling, but refresh immediately)
    try {
      const res = await fetch(`http://72.61.125.98:3001/api/posts/${postId}/support`)
      if (res.ok) {
        const data = await res.json()
        setSupportByPost(prev => ({
          ...prev,
          [postId]: {
            supported: user ? data.some(s => String(s.user_id) === String(user.id || user.email)) : false,
            count: Array.isArray(data) ? data.length : 0
          }
        }))
      }
    } catch { }
  }
  // Pitch type definitions with objectives and instructions
  const pitchTypes = [
    {
      id: 'general',
      name: 'General Post',
      icon: MessageCircle,
      objective: '',
      instructions: []
    },
    {
      id: 'eco-pitch',
      name: 'Eco-Pitch: 60-Second Solution',
      icon: Video,
      description: '60-second video or 120-150 word pitch',
      objective: 'To encourage students to quickly identify an environmental or urban problem and propose a concise, feasible solution.',
      instructions: [
        'Choose one local issue (flooding, waste buildup, lack of green space, etc.).',
        'Record a 60-second video or write a 120–150 word pitch explaining: The problem, Your proposed solution, The expected impact.',
        'Upload your pitch to the platform.',
        'Classmates may react and leave constructive comments.'
      ]
    },
    {
      id: 'greenspace',
      name: 'GreenSpace Redesign',
      icon: Image,
      description: 'Photo + sketch redesign',
      objective: 'To promote creative thinking on how to improve underutilized community or school spaces.',
      instructions: [
        'Take a photo of an area on campus or in your barangay that needs improvement.',
        'Sketch a simple redesign (using paper, mobile editor, or drawing tool).',
        'Write a brief pitch (2–3 sentences) explaining your redesign.',
        'Submit your redesign for peer voting.'
      ]
    },
    {
      id: 'fix-street',
      name: 'Fix-My-Street Pitch',
      icon: MapPin,
      description: 'Photo/description + structured pitch',
      objective: 'To train students to identify real-world environmental issues and propose simple, actionable fixes.',
      instructions: [
        'Upload a photo or description of a real environmental problem in your area.',
        'Complete the pitch template: The Problem (What is happening?), Your Solution (What can be done?), Outcome (How will this help?).',
        'Submit your entry to the public pitch board.',
        'Review at least two peers\' pitches and react using 👍 or 💡.'
      ]
    },
    {
      id: 'plan-it',
      name: 'Plan-It Pitch Competition',
      icon: FileText,
      description: '3-5 slide mini-pitch deck',
      objective: 'To engage students in collaborative planning through short presentation-style proposals.',
      instructions: [
        'Form a group of 3–5 students.',
        'Create a 3–5 slide mini-pitch deck on a chosen environmental or urban topic.',
        'Include: Problem statement, Proposed solution, Feasibility, Expected benefits.',
        'Upload your deck to CollabSpace.',
        'Vote for the top three most feasible proposals.'
      ]
    },
    {
      id: 'community-map',
      name: 'Community Map Pitch',
      icon: MapPin,
      description: 'Map pin with location pitch',
      objective: 'To help students analyze environmental issues spatially by marking real areas that need improvement.',
      instructions: [
        'Open the digital community map tool.',
        'Place a pin on a chosen location (flood zone, waste hotspot, unsafe public path, etc.).',
        'Write a short pitch (2–4 sentences): Why you selected this spot, What improvement is needed.',
        'Submit your map entry.',
        'Respond to at least one peer\'s pin with a suggestion.'
      ]
    },
    {
      id: 'wish-barangay',
      name: 'I Wish My Barangay Had...',
      icon: Lightbulb,
      description: 'Structured wish form',
      objective: 'To give students a structured format to express civic needs and propose enhancements.',
      instructions: [
        'Fill out the pitch form: What do you wish your barangay had?, Why do we need it?, Who will benefit?, What small role can youth play?',
        'Upload your entry.',
        'Read and rate at least two classmates\' submissions.'
      ]
    },
    {
      id: 'slogan',
      name: 'Sustainability Slogan',
      icon: Award,
      description: 'Poster/slogan with pitch',
      objective: 'To promote participation through visual advocacy paired with critical thinking.',
      instructions: [
        'Create a simple digital or hand-drawn slogan addressing an urban or environmental issue.',
        'Write a 2–3 sentence pitch explaining: The issue, The purpose of your poster, Your proposed call-to-action.',
        'Submit your poster to the gallery.',
        'View and vote for posters that inspire action.'
      ]
    },
    {
      id: 'idea-duo',
      name: 'Idea Duos – Partner Pitch',
      icon: Users,
      description: 'Partner collaboration pitch',
      objective: 'To build communication skills and teamwork by co-developing a proposal.',
      instructions: [
        'Pair up with a classmate.',
        'Choose any urban issue and propose a joint solution.',
        'Write a combined pitch (150–200 words).',
        'Submit as a "Duo Pitch" entry.',
        'Peer reviewers will give feedback on feasibility.'
      ]
    },
    {
      id: 'eco-poll',
      name: 'Eco Poll',
      icon: BarChart2,
      description: 'Create a poll with multiple options',
      objective: 'To gather community opinions on environmental topics through interactive polling.',
      instructions: [
        'Create a poll question about an environmental issue.',
        'Add at least 2 poll options for users to choose from.',
        'Submit your poll to the platform.',
        'Users can vote on poll options and see real-time results.'
      ]
    },
  ]

  const [showInstructions, setShowInstructions] = useState(false)

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
    tags: '',
    pitchType: 'general',
    // Fields for different pitch types
    problem: '',
    solution: '',
    impact: '',
    mediaUrl: '', // For video/image URLs
    location: '', // For map pins
    partner: '', // For duo pitches
    redesignDescription: '',
    outcome: '',
    groupMembers: '',
    feasibility: '',
    expectedBenefits: '',
    whySelected: '',
    neededImprovement: '',
    wishWhat: '',
    wishWhy: '',
    wishWhoBenefits: '',
    wishYouthRole: '',
    sloganIssue: '',
    sloganPurpose: '',
    callToAction: '',
    // Poll fields
    pollOptions: ['', ''], // Array of poll option strings
  })

  // Default posts
  // Default posts - dates are ISO timestamps for real-time relative time display
  const defaultPosts = [
    {
      id: 1,
      author: 'Alex Rivera',
      title: 'Proposal: Community Tree Planting Initiative',
      content: 'I propose we organize a monthly community tree planting event in our local parks. This would help combat climate change while bringing our community together. We could partner with local environmental organizations and make it a fun, educational experience for families.',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      tags: ['Community', 'Trees', 'Climate Action'],
      votes: 0,
      userVote: null, // 'up', 'down', or null
      comments: 0,
      reactions: { likes: 0, hearts: 0 },
      category: 'Proposal',
      pitchType: 'general',
    },
    {
      id: 2,
      author: 'Sofia Martinez',
      title: 'Opinion: Why We Should Ban Single-Use Plastics',
      content: 'Single-use plastics are destroying our oceans and harming marine life. I believe we should push for local legislation to ban these items. What are your thoughts on alternative solutions?',
      date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      tags: ['Plastic', 'Policy', 'Opinion'],
      votes: 0,
      userVote: null,
      comments: 0,
      reactions: { likes: 0, hearts: 0 },
      category: 'Opinion',
      pitchType: 'general',
    },
    {
      id: 3,
      author: 'Carlos Chen',
      title: 'Solution: Composting Program for Schools',
      content: 'Here\'s my idea: implement a composting program in all local schools. Students would learn about waste reduction while creating nutrient-rich soil for school gardens. We could start with pilot programs in 3 schools.',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      tags: ['Education', 'Composting', 'Solution'],
      votes: 0,
      userVote: null,
      comments: 0,
      reactions: { likes: 0, hearts: 0 },
      category: 'Solution',
      pitchType: 'general',
    },
    {
      id: 4,
      author: 'Luna Park',
      title: 'Vote: Should We Implement Bike Lanes?',
      content: 'Let\'s vote on whether we should advocate for dedicated bike lanes in our city. This would reduce carbon emissions and promote healthier lifestyles. What do you think?',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      tags: ['Transportation', 'Vote', 'Infrastructure'],
      votes: 0,
      userVote: null,
      comments: 0,
      reactions: { likes: 0, hearts: 0 },
      category: 'Vote',
      pitchType: 'general',
    },
  ]

  // Default polls based on 10 eco poll ideas - dates are ISO timestamps for real-time relative time display
  const defaultPolls = [
    {
      id: 1001,
      author: 'EcoSphere Platform',
      title: 'Which environmental issue should be prioritized in your barangay?',
      content: 'Help us understand what environmental issues matter most to your community.',
      pitchType: 'eco-poll',
      date: new Date(Date.now() - 30 * 1000).toISOString(), // 30 seconds ago (just now)
      tags: ['Poll', 'Community', 'Priority'],
      pollOptions: ['Flooding', 'Waste management', 'Lack of green spaces', 'Noise pollution', 'Poor drainage'],
      pollVotes: {}, // { optionIndex: voteCount }
      userPollVote: null, // null or optionIndex
      totalVotes: 0,
      votes: 0,
      userVote: null,
      comments: 0,
      reactions: { likes: 0, hearts: 0 },
      category: 'Poll',
    },
    {
      id: 1002,
      author: 'EcoSphere Platform',
      title: 'What project should your school implement first?',
      content: 'Share your opinion on what environmental project your school should prioritize.',
      pitchType: 'eco-poll',
      date: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 minute ago
      tags: ['Poll', 'School', 'Projects'],
      pollOptions: ['Campus tree-planting', 'Waste-segregation program', 'Flood-prevention improvements', 'Campus clean-up drives', 'Eco-brick collection station'],
      pollVotes: {},
      userPollVote: null,
      totalVotes: 0,
      votes: 0,
      userVote: null,
      comments: 0,
      reactions: { likes: 0, hearts: 0 },
      category: 'Poll',
    },
    {
      id: 1003,
      author: 'EcoSphere Platform',
      title: 'Which eco-solution is most feasible for students to support?',
      content: 'What environmental action do you think students can most effectively support?',
      pitchType: 'eco-poll',
      date: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
      tags: ['Poll', 'Students', 'Solutions'],
      pollOptions: ['Reducing single-use plastics', 'School recycling program', 'Monthly clean-up', 'Creating green corners', 'Energy-saving habits'],
      pollVotes: {},
      userPollVote: null,
      totalVotes: 0,
      votes: 0,
      userVote: null,
      comments: 0,
      reactions: { likes: 0, hearts: 0 },
      category: 'Poll',
    },
    {
      id: 1004,
      author: 'EcoSphere Platform',
      title: 'What type of public space does your community need most?',
      content: 'Help identify what kind of public space would benefit your community the most.',
      pitchType: 'eco-poll',
      date: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 minutes ago
      tags: ['Poll', 'Community', 'Public Space'],
      pollOptions: ['Playground / recreation areas', 'Community garden', 'Open green space', 'Youth center', 'Safe bike lanes'],
      pollVotes: {},
      userPollVote: null,
      totalVotes: 0,
      votes: 0,
      userVote: null,
      comments: 0,
      reactions: { likes: 0, hearts: 0 },
      category: 'Poll',
    },
    {
      id: 1005,
      author: 'EcoSphere Platform',
      title: 'Which cause would you personally advocate for?',
      content: 'Which environmental cause are you most passionate about advocating for?',
      pitchType: 'eco-poll',
      date: new Date(Date.now() - 4 * 60 * 1000).toISOString(), // 4 minutes ago
      tags: ['Poll', 'Advocacy', 'Causes'],
      pollOptions: ['Climate action', 'Waste reduction', 'Plastic-free environment', 'Biodiversity protection', 'Clean air for all'],
      pollVotes: {},
      userPollVote: null,
      totalVotes: 0,
      votes: 0,
      userVote: null,
      comments: 0,
      reactions: { likes: 0, hearts: 0 },
      category: 'Poll',
    },
    {
      id: 1006,
      author: 'EcoSphere Platform',
      title: 'What environmental factor affects you the most daily?',
      content: 'Share which environmental issue impacts your daily life the most.',
      pitchType: 'eco-poll',
      date: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      tags: ['Poll', 'Daily Life', 'Impact'],
      pollOptions: ['Heat inside the community', 'Poor air quality', 'Litter and overflowing bins', 'Unwalkable sidewalks', 'Lack of shade/trees'],
      pollVotes: {},
      userPollVote: null,
      totalVotes: 0,
      votes: 0,
      userVote: null,
      comments: 0,
      reactions: { likes: 0, hearts: 0 },
      category: 'Poll',
    },
    {
      id: 1007,
      author: 'EcoSphere Platform',
      title: 'Where is the biggest environmental problem in your school?',
      content: 'Identify where the most significant environmental issue exists in your school.',
      pitchType: 'eco-poll',
      date: new Date(Date.now() - 6 * 60 * 1000).toISOString(), // 6 minutes ago
      tags: ['Poll', 'School', 'Problems'],
      pollOptions: ['Canteen waste', 'Restroom water waste', 'Hallway litter', 'Open fields', 'Classrooms'],
      pollVotes: {},
      userPollVote: null,
      totalVotes: 0,
      votes: 0,
      userVote: null,
      comments: 0,
      reactions: { likes: 0, hearts: 0 },
      category: 'Poll',
    },
    {
      id: 1008,
      author: 'EcoSphere Platform',
      title: 'Which urban improvement should be added to your barangay?',
      content: 'What urban improvement would make the biggest positive impact in your barangay?',
      pitchType: 'eco-poll',
      date: new Date(Date.now() - 7 * 60 * 1000).toISOString(), // 7 minutes ago
      tags: ['Poll', 'Urban', 'Improvement'],
      pollOptions: ['Waste segregation bins', 'Flood barriers', 'Tree-planting zones', 'Community compost area', 'Street lighting improvements'],
      pollVotes: {},
      userPollVote: null,
      totalVotes: 0,
      votes: 0,
      userVote: null,
      comments: 0,
      reactions: { likes: 0, hearts: 0 },
      category: 'Poll',
    },
    {
      id: 1009,
      author: 'EcoSphere Platform',
      title: 'What motivates you more to support environmental actions?',
      content: 'What drives you to participate in environmental activities?',
      pitchType: 'eco-poll',
      date: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 minutes ago
      tags: ['Poll', 'Motivation', 'Participation'],
      pollOptions: ['Rewards and recognition', 'Peer influence', 'Personal concern', 'Assignments or school tasks', 'Social media influence'],
      pollVotes: {},
      userPollVote: null,
      totalVotes: 0,
      votes: 0,
      userVote: null,
      comments: 0,
      reactions: { likes: 0, hearts: 0 },
      category: 'Poll',
    },
    {
      id: 1010,
      author: 'EcoSphere Platform',
      title: 'Which environmental topic do you want to learn more about?',
      content: 'Help us understand what environmental topics interest you most for future learning.',
      pitchType: 'eco-poll',
      date: new Date(Date.now() - 9 * 60 * 1000).toISOString(), // 9 minutes ago
      tags: ['Poll', 'Education', 'Topics'],
      pollOptions: ['Urban heat islands', 'Waste-to-energy', 'Disaster preparedness', 'Plastic pollution', 'Nature-based solutions'],
      pollVotes: {},
      userPollVote: null,
      totalVotes: 0,
      votes: 0,
      userVote: null,
      comments: 0,
      reactions: { likes: 0, hearts: 0 },
      category: 'Poll',
    },
  ]


  // Backend-powered reactions state
  // Structure: { [postId]: { liked: boolean, unliked: boolean } }
  const [userReactions, setUserReactions] = useState({})

  // Fetch user reactions for all posts from backend
  useEffect(() => {
    const fetchReactions = async () => {
      if (!user || !forumPosts.length) return
      const userId = user.id || user.email
      const newReactions = {}
      for (const post of forumPosts) {
        try {
          const res = await fetch(`http://72.61.125.98:3001/api/likes/${post.id}/user/${userId}`)
          if (res.ok) {
            const data = await res.json()
            newReactions[post.id] = {
              liked: !!data.liked,
              unliked: !!data.unliked
            }
          } else {
            newReactions[post.id] = { liked: false, unliked: false }
          }
        } catch (e) {
          newReactions[post.id] = { liked: false, unliked: false }
        }
      }
      setUserReactions(newReactions)
    }
    fetchReactions()
    // Optionally, poll for real-time updates
    const interval = setInterval(fetchReactions, 5000)
    return () => clearInterval(interval)
  }, [user, forumPosts])

  // Load aggregate counts (shared across all users)
  const loadAggregateCounts = () => {
    try {
      const saved = localStorage.getItem('collabspace_aggregate_counts')
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
      localStorage.setItem('collabspace_aggregate_counts', JSON.stringify(counts))
    } catch (error) {
      console.error('Error saving aggregate counts:', error)
    }
  }

  // Load aggregate poll votes (shared across all users)
  const loadAggregatePollVotes = () => {
    try {
      const saved = localStorage.getItem('collabspace_aggregate_poll_votes')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading aggregate poll votes:', error)
    }
    return {}
  }

  // Save aggregate poll votes (shared across all users)
  const saveAggregatePollVotes = (votes) => {
    try {
      localStorage.setItem('collabspace_aggregate_poll_votes', JSON.stringify(votes))
    } catch (error) {
      console.error('Error saving aggregate poll votes:', error)
    }
  }

  // Fetch posts from backend
  const fetchPosts = async () => {
    try {
      const response = await fetch('http://72.61.125.98:3001/api/posts')
      if (response.ok) {
        const posts = await response.json()
        setForumPosts(posts)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

  useEffect(() => {
    fetchPosts()
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchPosts, 10000)
    return () => clearInterval(interval)
  }, [])

  // ...userReactions state now handled above...
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
  // Backend-powered comments state
  // Structure: { [postId]: [comments array] }
  const [commentsByPost, setCommentsByPost] = useState({})

  // Fetch comments for all posts (or for visible posts) from backend
  useEffect(() => {
    const fetchComments = async () => {
      if (!forumPosts.length) return
      const newCommentsByPost = {}
      for (const post of forumPosts) {
        try {
          const res = await fetch(`http://72.61.125.98:3001/api/comments/${post.id}`)
          if (res.ok) {
            const data = await res.json()
            newCommentsByPost[post.id] = data.comments || []
          } else {
            newCommentsByPost[post.id] = []
          }
        } catch (e) {
          newCommentsByPost[post.id] = []
        }
      }
      setCommentsByPost(newCommentsByPost)
    }
    fetchComments()
    // Optionally, poll for real-time updates
    const interval = setInterval(fetchComments, 5000)
    return () => clearInterval(interval)
  }, [forumPosts])

  // Delete post function
  const deletePost = (postId) => {
    if (!user) return

    // Check if user is the author
    const post = forumPosts.find(p => p.id === postId)
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

    const post = forumPosts.find(p => p.id === postId)
    if (!post) return

    // Remove post from state
    const updatedPosts = forumPosts.filter(p => p.id !== postId)
    setForumPosts(updatedPosts)

    // Clean up aggregate counts
    const aggregateCounts = loadAggregateCounts()
    if (aggregateCounts[postId]) {
      delete aggregateCounts[postId]
      saveAggregateCounts(aggregateCounts)
    }

    // Clean up poll votes if it's a poll
    if (post.pitchType === 'eco-poll') {
      const aggregatePollVotes = loadAggregatePollVotes()
      if (aggregatePollVotes[postId]) {
        delete aggregatePollVotes[postId]
        saveAggregatePollVotes(aggregatePollVotes)
      }
    }

    // Clean up user reactions (per-user, need to clean for all users)
    // Note: We can't clean other users' reactions easily, but that's okay
    // The reactions will just be orphaned but won't cause issues

    // Clean up comments (per-user, need to clean for all users)
    // Note: Comments will also be orphaned but won't cause issues

    // Clean up post ownership
    try {
      const postOwners = JSON.parse(localStorage.getItem('post_owners_collabspace') || '{}')
      if (postOwners[postId]) {
        delete postOwners[postId]
        localStorage.setItem('post_owners_collabspace', JSON.stringify(postOwners))
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

  // Get comments for a post (from backend-powered state)
  const getAllComments = (postId) => {
    const allComments = commentsByPost[postId] || []
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

  // ...userReactions now loaded from backend above...

  const filteredAndSortedPosts = [...forumPosts]
    .filter(post => {
      // Filter by pitch type
      if (filterByType !== 'all') {
        return post.pitchType === filterByType
      }
      return true
    })
    .map(post => {
      // Merge with aggregate counts for accurate sorting
      const aggregateCounts = loadAggregateCounts()
      const postCounts = aggregateCounts[post.id] || {}
      return {
        ...post,
        votes: postCounts.votes || post.votes || 0,
        comments: postCounts.comments || post.comments || 0,
        reactions: {
          likes: postCounts.likes || post.reactions?.likes || 0,
          hearts: postCounts.hearts || post.reactions?.hearts || 0
        }
      }
    })
    .sort((a, b) => {
      if (sortBy === 'trending') {
        // Sort by engagement (votes + comments + likes + hearts)
        const aEngagement = (a.votes || 0) + (a.comments || 0) + (a.reactions?.likes || 0) + (a.reactions?.hearts || 0)
        const bEngagement = (b.votes || 0) + (b.comments || 0) + (b.reactions?.likes || 0) + (b.reactions?.hearts || 0)
        if (bEngagement !== aEngagement) {
          return bEngagement - aEngagement
        }
        // If same engagement, sort by date (newer first)
        return new Date(b.date) - new Date(a.date)
      }
      if (sortBy === 'most-votes') {
        // Sort by votes only (likes + hearts)
        const aVotes = (a.reactions?.likes || 0) + (a.reactions?.hearts || 0)
        const bVotes = (b.reactions?.likes || 0) + (b.reactions?.hearts || 0)
        if (bVotes !== aVotes) {
          return bVotes - aVotes
        }
        // If same votes, sort by date (newer first)
        return new Date(b.date) - new Date(a.date)
      }
      if (sortBy === 'newest') {
        return new Date(b.date) - new Date(a.date)
      }
      return 0
    })

  // Save posts to localStorage (posts are global)
  useEffect(() => {
    localStorage.setItem('collabspace_posts', JSON.stringify(forumPosts))
  }, [forumPosts])

  // ...userReactions now saved to backend, not localStorage...

  // Check URL params for pitchType and auto-open form
  useEffect(() => {
    const pitchTypeParam = searchParams.get('pitchType')
    if (pitchTypeParam && pitchTypes.find(pt => pt.id === pitchTypeParam)) {
      // Check if activity is already completed
      const userId = getUserId()
      const completed = userId ? isActivityComplete('collabspace', pitchTypeParam, userId) : false

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

      // Set the pitch type and open the form
      setNewPost(prev => ({ ...prev, pitchType: pitchTypeParam }))
      setShowPostForm(true)
      setShowInstructions(true)
      // Clear the query parameter
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  // Calculate display count - show aggregate counts (all users)
  const getDisplayCount = (postId, baseCount, reactionType) => {
    const post = forumPosts.find(p => p.id === postId)
    if (!post) return 0

    // When logged out, show aggregate counts
    if (!user) {
      if (reactionType === 'likes') return post.reactions.likes || 0
      if (reactionType === 'unliked') return post.reactions.hearts || 0
      if (reactionType === 'votes') {
        // For votes, show net votes (up - down)
        const aggregateCounts = loadAggregateCounts()
        const voteData = aggregateCounts[postId]?.voteData || { up: 0, down: 0 }
        return voteData.up - voteData.down
      }
      if (reactionType === 'comments') return post.comments || 0
      return 0
    }

    // When logged in, show aggregate counts
    if (reactionType === 'likes') return post.reactions.likes || 0
    if (reactionType === 'unliked') return post.reactions.hearts || 0
    if (reactionType === 'votes') {
      // Show net votes (up - down) from aggregate
      const aggregateCounts = loadAggregateCounts()
      const voteData = aggregateCounts[postId]?.voteData || { up: 0, down: 0 }
      return voteData.up - voteData.down
    }
    if (reactionType === 'comments') return post.comments || 0
    return 0
  }

  // Get user's vote for a post
  const getUserVote = (postId) => {
    if (!user) return null
    return userReactions[postId]?.vote || null
  }

  const toggleLike = async (postId) => {
    if (!requireAuth()) return
    if (!user) return
    const userId = user.id || user.email
    const isLiked = userReactions[postId]?.liked || false
    try {
      const res = await fetch(`http://72.61.125.98:3001/api/likes/${postId}`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      if (!res.ok) throw new Error('Failed to update like')
    } catch (e) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update like. Please try again.',
        type: 'error'
      })
      return
    }
    // Refresh reactions for this post (will be picked up by polling, but refresh immediately)
    try {
      const res = await fetch(`http://72.61.125.98:3001/api/likes/${postId}/user/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setUserReactions(prev => ({ ...prev, [postId]: { liked: !!data.liked, unliked: !!data.unliked } }))
      }
    } catch { }
  }

  const toggleUnlike = async (postId) => {
    if (!requireAuth()) return
    if (!user) return
    const userId = user.id || user.email
    const isUnliked = userReactions[postId]?.unliked || false
    try {
      const res = await fetch(`http://72.61.125.98:3001/api/unlikes/${postId}`, {
        method: isUnliked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      if (!res.ok) throw new Error('Failed to update unlike')
    } catch (e) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update unlike. Please try again.',
        type: 'error'
      })
      return
    }
    // Refresh reactions for this post (will be picked up by polling, but refresh immediately)
    try {
      const res = await fetch(`http://72.61.125.98:3001/api/likes/${postId}/user/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setUserReactions(prev => ({ ...prev, [postId]: { liked: !!data.liked, unliked: !!data.unliked } }))
      }
    } catch { }
  }

  const handlePollVote = (postId, optionIndex) => {
    if (!requireAuth()) return

    const post = forumPosts.find(p => p.id === postId)
    if (!post || post.pitchType !== 'eco-poll') return

    const userId = getUserId()
    const userPollVotesKey = `collabspace_poll_votes_${userId}`
    const currentUserVotes = JSON.parse(localStorage.getItem(userPollVotesKey) || '{}')
    const previousVote = currentUserVotes[postId]

    // Load aggregate poll votes
    const aggregatePollVotes = loadAggregatePollVotes()
    if (!aggregatePollVotes[postId]) {
      aggregatePollVotes[postId] = {}
    }

    // Remove previous vote if exists
    if (previousVote !== null && previousVote !== undefined) {
      aggregatePollVotes[postId][previousVote] = Math.max(0, (aggregatePollVotes[postId][previousVote] || 0) - 1)
    }

    // Add new vote (only if different from previous)
    if (previousVote !== optionIndex) {
      aggregatePollVotes[postId][optionIndex] = (aggregatePollVotes[postId][optionIndex] || 0) + 1
      currentUserVotes[postId] = optionIndex

      // Mark poll activity as complete when user votes (poll IDs 1001-1010 map to eco-poll-1 to eco-poll-10)
      // Only mark as complete if this is a new vote (previousVote was null/undefined)
      if (postId >= 1001 && postId <= 1010 && (previousVote === null || previousVote === undefined)) {
        const activityId = `eco-poll-${postId - 1000}` // 1001 -> eco-poll-1, 1002 -> eco-poll-2, etc.
        markActivityComplete('collabspace', activityId, userId)
        // Add activity
        if (post) {
          const selectedOption = post.pollOptions[optionIndex]
          addUserActivity(userId, {
            type: 'poll-vote',
            title: `Voted on poll: ${post.title} (${selectedOption})`,
            postId: post.id
          })
        }
      } else if (postId < 1001 || postId > 1010) {
        // For non-default polls, add activity on any vote
        if (post && previousVote === null || previousVote === undefined) {
          const selectedOption = post.pollOptions[optionIndex]
          addUserActivity(userId, {
            type: 'poll-vote',
            title: `Voted on poll: ${post.title} (${selectedOption})`,
            postId: post.id
          })
        }
      }
    } else {
      // If clicking the same option, remove vote
      currentUserVotes[postId] = null
    }

    // Save user poll votes
    try {
      localStorage.setItem(userPollVotesKey, JSON.stringify(currentUserVotes))
    } catch (error) {
      console.error('Error saving user poll votes:', error)
    }

    // Save aggregate poll votes
    saveAggregatePollVotes(aggregatePollVotes)

    // Update posts state
    setForumPosts(forumPosts.map(p =>
      p.id === postId
        ? {
          ...p,
          pollVotes: aggregatePollVotes[postId],
          totalVotes: Object.values(aggregatePollVotes[postId]).reduce((a, b) => a + b, 0),
        }
        : p
    ))
  }

  const getUserPollVote = (postId) => {
    if (!user) return null
    try {
      const userId = getUserId()
      const userPollVotesKey = `collabspace_poll_votes_${userId}`
      const currentUserVotes = JSON.parse(localStorage.getItem(userPollVotesKey) || '{}')
      return currentUserVotes[postId] ?? null
    } catch (error) {
      return null
    }
  }

  // Helper function to add comment at a specific path (supports nested replies)
  const addCommentAtPath = (comments, path, newComment) => {
    if (!path || path === '') {
      // Top-level comment
      return [...comments, newComment]
    }

    const pathParts = path.split('-').map(Number)
    const updatedComments = [...comments]
    let current = updatedComments

    // Navigate to the parent
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

    // Add the new comment/reply
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

  const deleteComment = async (postId, commentId) => {
    if (!requireAuth()) return

    // Call backend API to delete comment
    try {
      const res = await fetch(`http://72.61.125.98:3001/api/comments/${postId}/${commentId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete comment')
    } catch (e) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to delete comment. Please try again.',
        type: 'error'
      })
      return
    }

    // Refresh comments for this post (will be picked up by polling, but refresh immediately)
    try {
      const res = await fetch(`http://72.61.125.98:3001/api/comments/${postId}`)
      if (res.ok) {
        const data = await res.json()
        setCommentsByPost(prev => ({ ...prev, [postId]: data.comments || [] }))
      }
    } catch { }
  }

  const addComment = async (postId, parentPath = null) => {
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

    // Call backend API to add comment
    try {
      const res = await fetch(`http://72.61.125.98:3001/api/comments/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: user.name || user.username || 'You',
          userId: user.id || user.email,
          comment: commentText,
          parentId: parentCommentId,
          mentions: mentions.length > 0 ? mentions : undefined
        })
      })
      if (!res.ok) throw new Error('Failed to add comment')
    } catch (e) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to add comment. Please try again.',
        type: 'error'
      })
      return
    }

    // Clear input
    if (parentPath !== null) {
      setReplyingTo({ ...replyingTo, [postId]: { ...replyingTo[postId], [parentPath]: '' } })
    } else {
      setNewComment({ ...newComment, [postId]: '' })
    }

    // Refresh comments for this post (will be picked up by polling, but refresh immediately)
    try {
      const res = await fetch(`http://72.61.125.98:3001/api/comments/${postId}`)
      if (res.ok) {
        const data = await res.json()
        setCommentsByPost(prev => ({ ...prev, [postId]: data.comments || [] }))
      }
    } catch { }
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
    const isShowingReplies = showReplies[postId]?.[path] !== false && depth < 3 // Limit depth to 3 levels

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

        {/* Nested Replies */}
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

        {/* Reply Input */}
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

  const handleVote = (postId, direction) => {
    if (!requireAuth()) return

    const currentVote = userReactions[postId]?.vote || null
    let newVote = null

    // Update user reactions
    if (currentVote === direction) {
      newVote = null // Remove vote
    } else {
      newVote = direction // New vote or change vote direction
    }

    setUserReactions({
      ...userReactions,
      [postId]: {
        ...userReactions[postId],
        vote: newVote
      }
    })

    // Update aggregate vote counts
    const aggregateCounts = loadAggregateCounts()
    if (!aggregateCounts[postId]) {
      aggregateCounts[postId] = { likes: 0, hearts: 0, comments: 0, voteData: { up: 0, down: 0 } }
    }
    if (!aggregateCounts[postId].voteData) {
      aggregateCounts[postId].voteData = { up: 0, down: 0 }
    }

    // Adjust votes based on current and new vote
    if (currentVote === 'up') {
      aggregateCounts[postId].voteData.up = Math.max(0, aggregateCounts[postId].voteData.up - 1)
    } else if (currentVote === 'down') {
      aggregateCounts[postId].voteData.down = Math.max(0, aggregateCounts[postId].voteData.down - 1)
    }

    if (newVote === 'up') {
      aggregateCounts[postId].voteData.up = (aggregateCounts[postId].voteData.up || 0) + 1
    } else if (newVote === 'down') {
      aggregateCounts[postId].voteData.down = (aggregateCounts[postId].voteData.down || 0) + 1
    }

    saveAggregateCounts(aggregateCounts)

    // Update posts state
    setForumPosts(forumPosts.map(post =>
      post.id === postId
        ? {
          ...post,
          votes: aggregateCounts[postId].voteData.up - aggregateCounts[postId].voteData.down
        }
        : post
    ))
  }

  const handleSubmitPost = (e) => {
    e.preventDefault()
    if (!requireAuth()) return
    if (!newPost.title.trim() || !newPost.content.trim()) return

    // Check if activity is already completed (prevent double posting)
    if (newPost.pitchType !== 'general') {
      const userId = getUserId()
      const completed = userId ? isActivityComplete('collabspace', newPost.pitchType, userId) : false
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

    const tags = newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag)

    // Build pitch data based on pitch type
    const pitchData = {
      pitchType: newPost.pitchType,
    }

    // Add type-specific fields
    if (newPost.pitchType === 'eco-pitch') {
      pitchData.problem = newPost.problem
      pitchData.solution = newPost.solution
      pitchData.impact = newPost.impact
      pitchData.mediaUrl = newPost.mediaUrl
    } else if (newPost.pitchType === 'greenspace') {
      pitchData.mediaUrl = newPost.mediaUrl
      pitchData.redesignDescription = newPost.redesignDescription
    } else if (newPost.pitchType === 'fix-street') {
      pitchData.problem = newPost.problem
      pitchData.solution = newPost.solution
      pitchData.outcome = newPost.outcome
      pitchData.mediaUrl = newPost.mediaUrl
    } else if (newPost.pitchType === 'plan-it') {
      pitchData.problem = newPost.problem
      pitchData.solution = newPost.solution
      pitchData.feasibility = newPost.feasibility
      pitchData.expectedBenefits = newPost.expectedBenefits
      pitchData.groupMembers = newPost.groupMembers
      pitchData.mediaUrl = newPost.mediaUrl
    } else if (newPost.pitchType === 'community-map') {
      pitchData.location = newPost.location
      pitchData.whySelected = newPost.whySelected
      pitchData.neededImprovement = newPost.neededImprovement
    } else if (newPost.pitchType === 'wish-barangay') {
      pitchData.wishWhat = newPost.wishWhat
      pitchData.wishWhy = newPost.wishWhy
      pitchData.wishWhoBenefits = newPost.wishWhoBenefits
      pitchData.wishYouthRole = newPost.wishYouthRole
    } else if (newPost.pitchType === 'slogan') {
      pitchData.sloganIssue = newPost.sloganIssue
      pitchData.sloganPurpose = newPost.sloganPurpose
      pitchData.callToAction = newPost.callToAction
      pitchData.mediaUrl = newPost.mediaUrl
    } else if (newPost.pitchType === 'idea-duo') {
      pitchData.partner = newPost.partner
      pitchData.problem = newPost.problem
      pitchData.solution = newPost.solution
    } else if (newPost.pitchType === 'eco-poll') {
      // Validate poll options - at least 2 non-empty options
      const validOptions = newPost.pollOptions.filter(opt => opt.trim().length > 0)
      if (validOptions.length < 2) {
        setModal({
          isOpen: true,
          title: 'Validation Error',
          message: 'Please provide at least 2 poll options',
          type: 'warning'
        })
        return
      }
    }

    const post = {
      id: Date.now(),
      author: user.name || user.username || 'You',
      title: newPost.title,
      content: newPost.content,
      date: new Date().toISOString(), // Store actual timestamp
      tags: tags,
      votes: 0,
      userVote: null,
      comments: 0,
      reactions: { likes: 0, hearts: 0 },
      category: newPost.pitchType === 'eco-poll' ? 'Poll' : 'Proposal',
      pitchType: newPost.pitchType,
      pitchData: pitchData,
      // Poll-specific fields
      ...(newPost.pitchType === 'eco-poll' && {
        pollOptions: newPost.pollOptions.filter(opt => opt.trim().length > 0),
        pollVotes: {},
        totalVotes: 0,
      }),
    }

    setForumPosts([post, ...forumPosts])

    const userId = getUserId()

    // Store post ownership
    if (userId && post.id) {
      setPostOwner(post.id, userId, 'collabspace')
    }

    // Increment ideasPosted stat for general posts
    if (newPost.pitchType === 'general' && userId) {
      incrementUserStat(userId, 'ideasPosted')
      // Add activity
      addUserActivity(userId, {
        type: 'idea',
        title: newPost.title || 'Posted an idea',
        postId: post.id
      })
    }

    // Mark activity as complete if pitchType is not 'general'
    if (newPost.pitchType !== 'general' && userId) {
      markActivityComplete('collabspace', newPost.pitchType, userId)
      // Add activity for completed activity
      const pitchTypeInfo = pitchTypes.find(p => p.id === newPost.pitchType)
      if (pitchTypeInfo) {
        addUserActivity(userId, {
          type: 'activity-completed',
          title: `Completed: ${pitchTypeInfo.name}`,
          category: 'collabspace',
          activityId: newPost.pitchType
        })
      }
    }

    // Reset form
    setNewPost({
      title: '',
      content: '',
      tags: '',
      pitchType: 'general',
      problem: '',
      solution: '',
      impact: '',
      mediaUrl: '',
      location: '',
      partner: '',
      redesignDescription: '',
      outcome: '',
      groupMembers: '',
      feasibility: '',
      expectedBenefits: '',
      whySelected: '',
      neededImprovement: '',
      wishWhat: '',
      wishWhy: '',
      wishWhoBenefits: '',
      wishYouthRole: '',
      sloganIssue: '',
      sloganPurpose: '',
      callToAction: '',
      pollOptions: ['', ''],
    })
    setShowPostForm(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">CollabSpace: The Interactive Forum</h1>
          <p className="text-sm sm:text-base text-gray-600">Propose ideas, share opinions, and vote on environmental solutions. Participate in idea pitch contests, eco-polls, and joint mapping tasks</p>
        </div>
        <button
          onClick={() => {
            if (!requireAuth()) return
            setShowPostForm(!showPostForm)
          }}
          className="btn-primary flex items-center space-x-2 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Post Idea</span>
        </button>
      </div>

      {/* Post Form */}
      {showPostForm && (() => {
        const userId = getUserId()
        const pitchType = newPost.pitchType
        const isCompleted = pitchType !== 'general' && userId ? isActivityComplete('collabspace', pitchType, userId) : false

        return (
          <div className="card mb-6">
            {isCompleted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">Activity Already Completed</h3>
                  <p className="text-sm text-green-700">You have already completed this activity. You cannot post again for this activity type.</p>
                </div>
              </div>
            ) : null}
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create a Pitch</h2>
            <form onSubmit={handleSubmitPost} className="space-y-4">
              {/* Pitch Type Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Pitch Type</label>
                  {pitchTypes.find(t => t.id === newPost.pitchType)?.objective && (
                    <button
                      type="button"
                      onClick={() => setShowInstructions(!showInstructions)}
                      className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      <Info className="w-4 h-4" />
                      <span>{showInstructions ? 'Hide' : 'Show'} Instructions</span>
                    </button>
                  )}
                </div>
                <select
                  value={newPost.pitchType}
                  onChange={(e) => {
                    const newPitchType = e.target.value
                    const userId = getUserId()
                    // Check if the new pitch type is already completed
                    if (newPitchType !== 'general' && userId && isActivityComplete('collabspace', newPitchType, userId)) {
                      setModal({
                        isOpen: true,
                        title: 'Activity Already Completed',
                        message: 'This activity has already been completed! You cannot post again for this activity type.',
                        type: 'warning'
                      })
                      return
                    }
                    setNewPost({ ...newPost, pitchType: newPitchType })
                    setShowInstructions(true) // Auto-show instructions when type changes
                  }}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  required
                  disabled={isCompleted && newPost.pitchType !== 'general'}
                >
                  {pitchTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <option key={type.id} value={type.id}>
                        {type.name} {type.description && `- ${type.description}`}
                      </option>
                    )
                  })}
                </select>
                {pitchTypes.find(t => t.id === newPost.pitchType)?.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {pitchTypes.find(t => t.id === newPost.pitchType).description}
                  </p>
                )}

                {/* Instructions Display */}
                {showInstructions && pitchTypes.find(t => t.id === newPost.pitchType)?.objective && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
                      <Info className="w-5 h-5" />
                      <span>Activity Instructions</span>
                    </h4>
                    {pitchTypes.find(t => t.id === newPost.pitchType)?.objective && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-blue-800 mb-1">Objective:</p>
                        <p className="text-sm text-blue-700">
                          {pitchTypes.find(t => t.id === newPost.pitchType).objective}
                        </p>
                      </div>
                    )}
                    {pitchTypes.find(t => t.id === newPost.pitchType)?.instructions &&
                      pitchTypes.find(t => t.id === newPost.pitchType).instructions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-blue-800 mb-2">Instructions:</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                            {pitchTypes.find(t => t.id === newPost.pitchType).instructions.map((instruction, idx) => (
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
                  placeholder="Enter your pitch title..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Eco-Pitch Fields */}
              {newPost.pitchType === 'eco-pitch' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">The Problem</label>
                    <textarea
                      value={newPost.problem}
                      onChange={(e) => setNewPost({ ...newPost, problem: e.target.value })}
                      placeholder="Describe the environmental or urban problem..."
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Proposed Solution</label>
                    <textarea
                      value={newPost.solution}
                      onChange={(e) => setNewPost({ ...newPost, solution: e.target.value })}
                      placeholder="Explain your solution..."
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Impact</label>
                    <textarea
                      value={newPost.impact}
                      onChange={(e) => setNewPost({ ...newPost, impact: e.target.value })}
                      placeholder="What impact will this have?"
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Video URL (optional)</label>
                    <input
                      type="url"
                      value={newPost.mediaUrl}
                      onChange={(e) => setNewPost({ ...newPost, mediaUrl: e.target.value })}
                      placeholder="https://youtube.com/..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* GreenSpace Redesign Fields */}
              {newPost.pitchType === 'greenspace' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Photo/Image URL</label>
                    <input
                      type="url"
                      value={newPost.mediaUrl}
                      onChange={(e) => setNewPost({ ...newPost, mediaUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg or image upload URL"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Redesign Description</label>
                    <textarea
                      value={newPost.redesignDescription}
                      onChange={(e) => setNewPost({ ...newPost, redesignDescription: e.target.value })}
                      placeholder="Explain your redesign in 2-3 sentences..."
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Fix-My-Street Fields */}
              {newPost.pitchType === 'fix-street' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Photo/Description of Problem</label>
                    <input
                      type="url"
                      value={newPost.mediaUrl}
                      onChange={(e) => setNewPost({ ...newPost, mediaUrl: e.target.value })}
                      placeholder="Photo URL or describe the problem..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">The Problem: What is happening?</label>
                    <textarea
                      value={newPost.problem}
                      onChange={(e) => setNewPost({ ...newPost, problem: e.target.value })}
                      placeholder="Describe the problem..."
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Solution: What can be done?</label>
                    <textarea
                      value={newPost.solution}
                      onChange={(e) => setNewPost({ ...newPost, solution: e.target.value })}
                      placeholder="What solution do you propose?"
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Outcome: How will this help?</label>
                    <textarea
                      value={newPost.outcome}
                      onChange={(e) => setNewPost({ ...newPost, outcome: e.target.value })}
                      placeholder="Expected outcome..."
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Plan-It Pitch Competition Fields */}
              {newPost.pitchType === 'plan-it' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group Members (3-5 students)</label>
                    <input
                      type="text"
                      value={newPost.groupMembers}
                      onChange={(e) => setNewPost({ ...newPost, groupMembers: e.target.value })}
                      placeholder="e.g., Juan, Maria, Pedro, Sofia, Carlos"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Problem Statement</label>
                    <textarea
                      value={newPost.problem}
                      onChange={(e) => setNewPost({ ...newPost, problem: e.target.value })}
                      placeholder="Describe the problem..."
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Proposed Solution</label>
                    <textarea
                      value={newPost.solution}
                      onChange={(e) => setNewPost({ ...newPost, solution: e.target.value })}
                      placeholder="Explain your solution..."
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Feasibility</label>
                    <textarea
                      value={newPost.feasibility}
                      onChange={(e) => setNewPost({ ...newPost, feasibility: e.target.value })}
                      placeholder="Why is this solution feasible?"
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Benefits</label>
                    <textarea
                      value={newPost.expectedBenefits}
                      onChange={(e) => setNewPost({ ...newPost, expectedBenefits: e.target.value })}
                      placeholder="What benefits will this bring?"
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pitch Deck URL (3-5 slides)</label>
                    <input
                      type="url"
                      value={newPost.mediaUrl}
                      onChange={(e) => setNewPost({ ...newPost, mediaUrl: e.target.value })}
                      placeholder="Link to your presentation..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Community Map Pitch Fields */}
              {newPost.pitchType === 'community-map' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={newPost.location}
                      onChange={(e) => setNewPost({ ...newPost, location: e.target.value })}
                      placeholder="e.g., Barangay Hall, School Main Gate, Flood Zone near Market..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Why you selected this spot</label>
                    <textarea
                      value={newPost.whySelected}
                      onChange={(e) => setNewPost({ ...newPost, whySelected: e.target.value })}
                      placeholder="Explain why this location needs attention..."
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">What improvement is needed</label>
                    <textarea
                      value={newPost.neededImprovement}
                      onChange={(e) => setNewPost({ ...newPost, neededImprovement: e.target.value })}
                      placeholder="Describe what needs to be improved..."
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Wish Barangay Fields */}
              {newPost.pitchType === 'wish-barangay' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">What do you wish your barangay had?</label>
                    <input
                      type="text"
                      value={newPost.wishWhat}
                      onChange={(e) => setNewPost({ ...newPost, wishWhat: e.target.value })}
                      placeholder="e.g., Community Garden, Recycling Center, Bike Lanes..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Why do we need it?</label>
                    <textarea
                      value={newPost.wishWhy}
                      onChange={(e) => setNewPost({ ...newPost, wishWhy: e.target.value })}
                      placeholder="Explain the need..."
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Who will benefit?</label>
                    <textarea
                      value={newPost.wishWhoBenefits}
                      onChange={(e) => setNewPost({ ...newPost, wishWhoBenefits: e.target.value })}
                      placeholder="Who will benefit from this?"
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">What small role can youth play?</label>
                    <textarea
                      value={newPost.wishYouthRole}
                      onChange={(e) => setNewPost({ ...newPost, wishYouthRole: e.target.value })}
                      placeholder="How can young people contribute?"
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Sustainability Slogan Fields */}
              {newPost.pitchType === 'slogan' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Poster/Slogan Image URL</label>
                    <input
                      type="url"
                      value={newPost.mediaUrl}
                      onChange={(e) => setNewPost({ ...newPost, mediaUrl: e.target.value })}
                      placeholder="Link to your poster or slogan image..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">The Issue</label>
                    <textarea
                      value={newPost.sloganIssue}
                      onChange={(e) => setNewPost({ ...newPost, sloganIssue: e.target.value })}
                      placeholder="What issue does your slogan address?"
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Purpose of your poster</label>
                    <textarea
                      value={newPost.sloganPurpose}
                      onChange={(e) => setNewPost({ ...newPost, sloganPurpose: e.target.value })}
                      placeholder="What is the purpose of your poster?"
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Proposed Call-to-Action</label>
                    <textarea
                      value={newPost.callToAction}
                      onChange={(e) => setNewPost({ ...newPost, callToAction: e.target.value })}
                      placeholder="What action do you want people to take?"
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Idea Duos Fields */}
              {newPost.pitchType === 'idea-duo' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Partner Name</label>
                    <input
                      type="text"
                      value={newPost.partner}
                      onChange={(e) => setNewPost({ ...newPost, partner: e.target.value })}
                      placeholder="Your partner's name..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Urban Issue</label>
                    <input
                      type="text"
                      value={newPost.problem}
                      onChange={(e) => setNewPost({ ...newPost, problem: e.target.value })}
                      placeholder="What issue are you addressing?"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Joint Solution (150-200 words)</label>
                    <textarea
                      value={newPost.solution}
                      onChange={(e) => setNewPost({ ...newPost, solution: e.target.value })}
                      placeholder="Write your combined pitch explaining your joint solution..."
                      rows="6"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Eco Poll Fields */}
              {newPost.pitchType === 'eco-poll' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Poll Options (at least 2 required)</label>
                  {newPost.pollOptions.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newPost.pollOptions]
                          newOptions[index] = e.target.value
                          setNewPost({ ...newPost, pollOptions: newOptions })
                        }}
                        placeholder={`Option ${index + 1}...`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {newPost.pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newOptions = newPost.pollOptions.filter((_, i) => i !== index)
                            setNewPost({ ...newPost, pollOptions: newOptions })
                          }}
                          className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setNewPost({ ...newPost, pollOptions: [...newPost.pollOptions, ''] })
                    }}
                    className="px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    + Add Option
                  </button>
                </div>
              )}

              {/* General Content Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {newPost.pitchType === 'general' ? 'Content' : newPost.pitchType === 'eco-poll' ? 'Description (optional)' : 'Additional Notes'}
                </label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder={newPost.pitchType === 'general' ? 'Describe your idea, opinion, or solution...' : 'Any additional information...'}
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required={newPost.pitchType === 'general'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newPost.tags}
                  onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                  placeholder="e.g., Climate, Community, Recycling"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className={`btn-primary ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isCompleted}
                >
                  {isCompleted ? 'Activity Already Completed' : 'Submit Pitch'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPostForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )
      })()}

      {/* Filter and Sort Options */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <select
            value={filterByType}
            onChange={(e) => setFilterByType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Pitch Types</option>
            {pitchTypes.map((type) => {
              const Icon = type.icon
              return (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              )
            })}
          </select>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setSortBy('trending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${sortBy === 'trending'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Trending
            </button>
            <button
              onClick={() => setSortBy('newest')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${sortBy === 'newest'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Newest
            </button>
            <button
              onClick={() => setSortBy('most-votes')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${sortBy === 'most-votes'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Most Votes
            </button>
          </div>
        </div>
      </div>

      {/* Forum Posts */}
      <div className="space-y-6">
        {filteredAndSortedPosts.map((post) => {
          const pitchTypeInfo = pitchTypes.find(t => t.id === post.pitchType) || pitchTypes[0]
          const PitchIcon = pitchTypeInfo.icon

          return (
            <div key={post.id} className="card">
              <div className="flex items-start space-x-4">
                {/* Voting Section */}
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={() => handleVote(post.id, 'up')}
                    className={`p-2 rounded-lg transition-colors ${getUserVote(post.id) === 'up'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-gray-400 hover:text-primary-600 hover:bg-gray-100'
                      }`}
                  >
                    <TrendingUp className="w-6 h-6" />
                  </button>
                  <span className={`text-lg font-bold ${getUserVote(post.id) === 'up' ? 'text-primary-600' :
                    getUserVote(post.id) === 'down' ? 'text-red-600' :
                      'text-gray-700'
                    }`}>
                    {getDisplayCount(post.id, 0, 'votes')}
                  </span>
                  <button
                    onClick={() => handleVote(post.id, 'down')}
                    className={`p-2 rounded-lg transition-colors ${getUserVote(post.id) === 'down'
                      ? 'bg-red-100 text-red-600'
                      : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'
                      }`}
                  >
                    <TrendingDown className="w-6 h-6" />
                  </button>
                </div>

                {/* Post Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-2 relative">
                    <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium flex items-center space-x-1">
                      <PitchIcon className="w-3 h-3" />
                      <span>{pitchTypeInfo.name}</span>
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      {post.category}
                    </span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="font-semibold text-gray-900">{post.author}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500" key={`time-${post.id}-${timeUpdateKey}`}>
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
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
                  <p className="text-gray-600 mb-4">{post.content}</p>

                  {/* Pitch-specific fields display */}
                  {post.pitchData && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                      {post.pitchData.problem && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">The Problem:</h4>
                          <p className="text-gray-700">{post.pitchData.problem}</p>
                        </div>
                      )}
                      {post.pitchData.solution && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Solution:</h4>
                          <p className="text-gray-700">{post.pitchData.solution}</p>
                        </div>
                      )}
                      {post.pitchData.impact && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Expected Impact:</h4>
                          <p className="text-gray-700">{post.pitchData.impact}</p>
                        </div>
                      )}
                      {post.pitchData.outcome && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Outcome:</h4>
                          <p className="text-gray-700">{post.pitchData.outcome}</p>
                        </div>
                      )}
                      {post.pitchData.redesignDescription && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Redesign Description:</h4>
                          <p className="text-gray-700">{post.pitchData.redesignDescription}</p>
                        </div>
                      )}
                      {post.pitchData.location && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1 flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>Location:</span>
                          </h4>
                          <p className="text-gray-700">{post.pitchData.location}</p>
                        </div>
                      )}
                      {post.pitchData.whySelected && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Why Selected:</h4>
                          <p className="text-gray-700">{post.pitchData.whySelected}</p>
                        </div>
                      )}
                      {post.pitchData.neededImprovement && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Needed Improvement:</h4>
                          <p className="text-gray-700">{post.pitchData.neededImprovement}</p>
                        </div>
                      )}
                      {post.pitchData.partner && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1 flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>Partner:</span>
                          </h4>
                          <p className="text-gray-700">{post.pitchData.partner}</p>
                        </div>
                      )}
                      {post.pitchData.groupMembers && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1 flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>Group Members:</span>
                          </h4>
                          <p className="text-gray-700">{post.pitchData.groupMembers}</p>
                        </div>
                      )}
                      {post.pitchData.feasibility && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Feasibility:</h4>
                          <p className="text-gray-700">{post.pitchData.feasibility}</p>
                        </div>
                      )}
                      {post.pitchData.expectedBenefits && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Expected Benefits:</h4>
                          <p className="text-gray-700">{post.pitchData.expectedBenefits}</p>
                        </div>
                      )}
                      {post.pitchData.wishWhat && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">I Wish My Barangay Had:</h4>
                          <p className="text-gray-700 font-medium">{post.pitchData.wishWhat}</p>
                        </div>
                      )}
                      {post.pitchData.wishWhy && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Why do we need it?</h4>
                          <p className="text-gray-700">{post.pitchData.wishWhy}</p>
                        </div>
                      )}
                      {post.pitchData.wishWhoBenefits && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Who will benefit?</h4>
                          <p className="text-gray-700">{post.pitchData.wishWhoBenefits}</p>
                        </div>
                      )}
                      {post.pitchData.wishYouthRole && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Youth's Role:</h4>
                          <p className="text-gray-700">{post.pitchData.wishYouthRole}</p>
                        </div>
                      )}
                      {post.pitchData.sloganIssue && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Issue:</h4>
                          <p className="text-gray-700">{post.pitchData.sloganIssue}</p>
                        </div>
                      )}
                      {post.pitchData.sloganPurpose && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Purpose:</h4>
                          <p className="text-gray-700">{post.pitchData.sloganPurpose}</p>
                        </div>
                      )}
                      {post.pitchData.callToAction && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Call to Action:</h4>
                          <p className="text-gray-700">{post.pitchData.callToAction}</p>
                        </div>
                      )}
                      {post.pitchData.mediaUrl && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {post.pitchType === 'eco-pitch' ? 'Video:' :
                              post.pitchType === 'slogan' ? 'Poster/Slogan:' :
                                post.pitchType === 'plan-it' ? 'Pitch Deck:' :
                                  'Media:'}
                          </h4>
                          <a
                            href={post.pitchData.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 underline"
                          >
                            {post.pitchData.mediaUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Poll Display */}
                  {post.pitchType === 'eco-poll' && post.pollOptions && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Poll Options</h4>
                        {post.totalVotes > 0 && (
                          <span className="text-sm text-gray-500">{post.totalVotes} {post.totalVotes === 1 ? 'vote' : 'votes'}</span>
                        )}
                      </div>
                      {post.pollOptions.map((option, optionIndex) => {
                        const voteCount = post.pollVotes?.[optionIndex] || 0
                        const percentage = post.totalVotes > 0 ? Math.round((voteCount / post.totalVotes) * 100) : 0
                        const userVote = getUserPollVote(post.id)
                        const isSelected = userVote === optionIndex

                        return (
                          <div key={optionIndex}>
                            {user ? (
                              <button
                                onClick={() => handlePollVote(post.id, optionIndex)}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${isSelected
                                  ? 'border-primary-600 bg-primary-50'
                                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                                  }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`font-medium ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
                                    {option}
                                  </span>
                                  {isSelected && (
                                    <span className="text-sm text-primary-600 font-medium">✓ Your vote</span>
                                  )}
                                </div>
                                {post.totalVotes > 0 && (
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                      <span className="text-gray-600">{voteCount} {voteCount === 1 ? 'vote' : 'votes'}</span>
                                      <span className="text-gray-600">{percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full transition-all ${isSelected ? 'bg-primary-600' : 'bg-primary-400'
                                          }`}
                                        style={{ width: `${percentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </button>
                            ) : (
                              <div className="w-full text-left p-3 rounded-lg border-2 border-gray-200 bg-white">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-gray-900">{option}</span>
                                </div>
                                {post.totalVotes > 0 ? (
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                      <span className="text-gray-600">{voteCount} {voteCount === 1 ? 'vote' : 'votes'}</span>
                                      <span className="text-gray-600">{percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className="h-2 rounded-full bg-primary-400 transition-all"
                                        style={{ width: `${percentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-500">No votes yet</span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {!user && (
                        <p className="text-sm text-gray-500 text-center mt-2">
                          <button
                            onClick={() => navigate('/login')}
                            className="text-primary-600 hover:text-primary-700 underline"
                          >
                            Log in
                          </button>
                          {' to vote on this poll'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Reactions */}
                  <div className="flex items-center space-x-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center space-x-2 transition-colors ${userReactions[post.id]?.liked
                        ? 'text-primary-600'
                        : 'text-gray-600 hover:text-primary-600'
                        }`}
                    >
                      <ThumbsUp className={`w-5 h-5 ${userReactions[post.id]?.liked ? 'fill-current' : ''}`} />
                      <span>{getDisplayCount(post.id, 0, 'likes')}</span>
                    </button>
                    <button
                      onClick={() => toggleUnlike(post.id)}
                      className={`flex items-center space-x-2 transition-colors ${userReactions[post.id]?.unliked
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                        }`}
                      title={userReactions[post.id]?.unliked ? 'Remove unlike' : 'Unlike'}
                    >
                      <ThumbsDown className={`w-5 h-5 ${userReactions[post.id]?.unliked ? 'fill-current' : ''}`} />
                      <span>{getDisplayCount(post.id, 0, 'unliked')}</span>
                    </button>
                    <button
                      onClick={() => toggleSupport(post.id)}
                      className={`flex items-center space-x-2 transition-colors ${supportByPost[post.id]?.supported
                        ? 'text-green-600'
                        : 'text-gray-600 hover:text-green-600'
                        }`}
                      title={supportByPost[post.id]?.supported ? 'Remove support' : 'Support'}
                    >
                      <CheckCircle className={`w-5 h-5 ${supportByPost[post.id]?.supported ? 'fill-current' : ''}`} />
                      <span>{supportByPost[post.id]?.count || 0}</span>
                    </button>
                    <button
                      onClick={() => setShowComments({ ...showComments, [post.id]: !showComments[post.id] })}
                      className={`flex items-center space-x-2 transition-colors ${showComments[post.id]
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                        }`}
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{getDisplayCount(post.id, 0, 'comments')}</span>
                    </button>
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
          )
        })}
      </div>

      {filteredAndSortedPosts.length === 0 && (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {filterByType !== 'all'
              ? `No ${pitchTypes.find(t => t.id === filterByType)?.name || 'pitch type'} submissions yet. Be the first to submit!`
              : 'No forum posts yet. Be the first to share your idea!'}
          </p>
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
