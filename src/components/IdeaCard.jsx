import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { ThumbsDown, MessageCircle, ThumbsUp, Share2, User, Trash2, CornerDownLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { addUserActivity, setPostOwner, notifyContentOwner, formatRelativeTime, validateAndFixDate } from '../pages/Home'

export default function IdeaCard({ idea, onReact }) {
  const navigate = useNavigate()
  const { user } = useAuth()

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

  // Likes state (global, from backend)
  const [likes, setLikes] = useState([])
  const [userLiked, setUserLiked] = useState(false)
  const [likesLoading, setLikesLoading] = useState(false)

  // Comments state (global, from backend)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState({}) // { 'path': 'text' } e.g., '0' for comment 0, '0-0' for reply 0 of comment 0
  const [showReplies, setShowReplies] = useState({}) // { 'path': true/false }
  const [countUpdateKey, setCountUpdateKey] = useState(0) // Force re-render when counts change
  const [timeUpdateKey, setTimeUpdateKey] = useState(0) // Force re-render for time updates

  // Update time display in real-time every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUpdateKey(prev => prev + 1)
    }, 5000) // Update every 5 seconds for real-time feel

    return () => clearInterval(interval)
  }, [])

  // Fetch comments from backend
  const fetchComments = async () => {
    setCommentsLoading(true)
    try {
      const res = await axios.get(`/api/posts/${idea.id}/comments`)
      setComments(res.data)
    } catch (err) {
      setComments([])
    }
    setCommentsLoading(false)
  }

  // Fetch likes from backend
  const fetchLikes = async () => {
    setLikesLoading(true)
    try {
      const res = await axios.get(`/api/posts/${idea.id}/likes`)
      setLikes(res.data)
      if (user) {
        setUserLiked(res.data.some(like => like.user_id === user.id))
      } else {
        setUserLiked(false)
      }
    } catch (err) {
      setLikes([])
      setUserLiked(false)
    }
    setLikesLoading(false)
  }

  // Fetch comments and likes on mount and when idea/user changes
  useEffect(() => {
    fetchComments()
    fetchLikes()
    // eslint-disable-next-line
  }, [idea.id, user?.id])

  // Add a comment via backend
  const handleAddComment = async (commentText) => {
    if (!requireAuth() || !commentText.trim()) return
    try {
      await axios.post(`/api/posts/${idea.id}/comments`, { comment: commentText }, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      fetchComments()
    } catch (err) {
      // Optionally show error
    }
  }

  // Comments are now flat from backend; optionally, you can nest them if you support replies
  const getAllComments = () => {
    // Sort by created_at if available
    return [...comments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }

  // Reload user data when user changes (login/logout)
  useEffect(() => {
    try {
      if (user && (user.id || user.email)) {
        // Load data for the logged-in user
        const userId = user.id || user.email || 'anonymous'
        const reactionsKey = `home_ideas_user_reactions_${userId}`

        const savedReactions = localStorage.getItem(reactionsKey)

        if (savedReactions) {
          try {
            const reactions = JSON.parse(savedReactions)
            setUserReactions(reactions)
            console.log('Loaded reactions for user:', userId, reactions)
          } catch (error) {
            console.error('Error parsing user reactions:', error)
          }
        }

        // Force update of counts when user data loads
        setCountUpdateKey(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error reloading user data:', error)
    }
  }, [user?.id, user?.email, idea.id])

  // Save reactions to localStorage (per-user) - only when userReactions has actual data
  useEffect(() => {
    if (!user) return
    const userId = getUserId()
    // Only save if userReactions is not empty or has changed
    if (Object.keys(userReactions).length > 0) {
      try {
        localStorage.setItem(`home_ideas_user_reactions_${userId}`, JSON.stringify(userReactions))
      } catch (error) {
        console.error('Error saving user reactions to localStorage:', error)
      }
    }
  }, [userReactions, user])

  // Load aggregate counts (shared across all users)
  const loadAggregateCounts = () => {
    try {
      const saved = localStorage.getItem('home_ideas_aggregate_counts')
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
      localStorage.setItem('home_ideas_aggregate_counts', JSON.stringify(counts))
    } catch (error) {
      console.error('Error saving aggregate counts:', error)
    }
  }

  // Helper function to count all comments recursively (including nested replies)
  const countAllComments = (comments) => {
    if (!comments || !Array.isArray(comments)) return 0
    let count = comments.length
    comments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        count += countAllComments(comment.replies)
      }
    })
    return count
  }

  // Display count from backend
  const getDisplayCount = (reactionType) => {
    if (reactionType === 'comments') return comments.length
    if (reactionType === 'likes') return likes.length
    return 0
  }

  // Like/unlike using backend
  const toggleLike = async () => {
    if (!requireAuth() || !user) return
    try {
      if (!userLiked) {
        await axios.post(`/api/posts/${idea.id}/like`, {}, {
          headers: { Authorization: `Bearer ${user.token}` }
        })
      } else {
        await axios.delete(`/api/posts/${idea.id}/like`, {
          headers: { Authorization: `Bearer ${user.token}` }
        })
      }
      fetchLikes()
      if (onReact) onReact(idea.id, 'likes')
    } catch (err) {
      // Optionally show error
    }
  }

  const toggleUnlike = () => {
    if (!requireAuth()) return

    const isUnliked = userReactions[idea.id]?.unliked || false
    const wasLiked = userReactions[idea.id]?.liked || false

    // Update user reactions
    setUserReactions({
      ...userReactions,
      [idea.id]: {
        ...userReactions[idea.id],
        unliked: !isUnliked,
        liked: false // Reset like if unliked
      }
    })

    // Update aggregate counts
    const aggregateCounts = loadAggregateCounts()
    if (!aggregateCounts[idea.id]) {
      aggregateCounts[idea.id] = { likes: 0, hearts: 0, comments: 0 }
    }

    if (!isUnliked) {
      aggregateCounts[idea.id].hearts = (aggregateCounts[idea.id].hearts || 0) + 1
      if (wasLiked && aggregateCounts[idea.id].likes > 0) {
        aggregateCounts[idea.id].likes = Math.max(0, aggregateCounts[idea.id].likes - 1)
      }
      // Track user's own unlike action and notify content owner
      const userId = getUserId()
      if (userId && idea) {
        notifyContentOwner(idea.id, userId, 'unlike', idea.title || 'idea', 'home')
        addUserActivity(userId, {
          type: 'unlike',
          title: `Unliked: ${idea.title}`,
          ideaId: idea.id
        })
      }
    } else {
      aggregateCounts[idea.id].hearts = Math.max(baseHearts, (aggregateCounts[idea.id].hearts || baseHearts) - 1)
    }

    saveAggregateCounts(aggregateCounts)

    if (onReact) onReact(idea.id, 'hearts')
  }

  const handleShare = async () => {
    const shareData = {
      title: idea.title || 'Check out this idea!',
      text: idea.content ? `${idea.content.substring(0, 100)}...` : 'An interesting environmental idea',
      url: window.location.href
    }

    try {
      // Check if Web Share API is supported
      if (navigator.share) {
        await navigator.share(shareData)
        // Add activity for successful share
        const userId = getUserId()
        if (userId && user) {
          addUserActivity(userId, {
            type: 'share',
            title: `Shared: ${idea.title}`,
            ideaId: idea.id
          })
        }
      } else {
        // Fallback: Copy link to clipboard
        const textToCopy = `${idea.title}\n\n${shareData.url}`
        await navigator.clipboard.writeText(textToCopy)
        alert('Link copied to clipboard!')

        // Add activity for successful copy
        const userId = getUserId()
        if (userId && user) {
          addUserActivity(userId, {
            type: 'share',
            title: `Copied link: ${idea.title}`,
            ideaId: idea.id
          })
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error)
        // Silent fail - user might have cancelled
      }
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

  const deleteComment = (commentId) => {
    if (!requireAuth()) return

    const { filtered: updatedComments, deleted: deletedCount } = deleteCommentById(userComments, commentId)

    if (deletedCount === 0) return // Comment not found

    setUserComments(updatedComments)

    // Update aggregate counts
    const aggregateCounts = loadAggregateCounts()
    if (!aggregateCounts[idea.id]) {
      aggregateCounts[idea.id] = { likes: 0, hearts: 0, comments: 0 }
    }
    aggregateCounts[idea.id].comments = Math.max(0, (aggregateCounts[idea.id].comments || 0) - deletedCount)
    saveAggregateCounts(aggregateCounts)

    // Force re-render to update display count
    setCountUpdateKey(prev => prev + 1)

    if (onReact) onReact(idea.id, 'comments')
  }

  const addComment = (parentPath = null) => {
    if (!requireAuth()) return

    let commentText = ''
    if (parentPath !== null) {
      commentText = replyingTo[parentPath] || ''
      if (!commentText.trim()) return
    } else {
      commentText = newComment || ''
      if (!commentText.trim()) return
    }

    // Find the parent comment ID if this is a reply
    let parentCommentId = null
    if (parentPath) {
      const allComments = getAllComments()
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
    // Match @ followed by one or more words (allowing spaces between words)
    const mentionRegex = /@([\w]+(?:\s+[\w]+)*)/g
    const mentions = []
    let match
    while ((match = mentionRegex.exec(commentText)) !== null) {
      mentions.push(match[1])
    }

    const comment = {
      id: Date.now() + Math.random(),
      author: user.name || user.username || 'You',
      comment: commentText,
      date: new Date().toISOString(),
      replies: [],
      mentions: mentions.length > 0 ? mentions : undefined,
      parentId: parentCommentId // Store parent comment ID for replies
    }

    // Always add as top-level comment - replies will be grouped by parentId during display
    const updatedComments = [...userComments, comment]
    setUserComments(updatedComments)

    if (parentPath !== null) {
      setReplyingTo({ ...replyingTo, [parentPath]: '' })
    } else {
      setNewComment('')
    }

    // Update aggregate counts
    const aggregateCounts = loadAggregateCounts()
    if (!aggregateCounts[idea.id]) {
      aggregateCounts[idea.id] = { likes: 0, hearts: 0, comments: 0 }
    }
    aggregateCounts[idea.id].comments = (aggregateCounts[idea.id].comments || 0) + 1
    saveAggregateCounts(aggregateCounts)

    // Force re-render to update display count
    setCountUpdateKey(prev => prev + 1)

    // Add activity for comment and notify content owner if it's someone else's idea
    const userId = getUserId()
    if (userId && idea) {
      // Track user's own comment action
      addUserActivity(userId, {
        type: 'comment',
        title: `Commented on: ${idea.title}`,
        ideaId: idea.id
      })
      // Check if this is someone else's idea and notify them
      // Since ideas on Home page have hardcoded authors, check if idea.author matches user name
      const isUserIdea = idea.author && (idea.author === user.name || idea.author === user.username)
      if (!isUserIdea && idea.author) {
        // This is someone else's idea, try to notify them if we can match by author name
        // Note: Since we're using localStorage per-user, we can't directly notify another user
        // But we can track ownership if the idea author matches a user
        notifyContentOwner(idea.id, userId, 'comment', idea.title || 'idea', 'home')
      }
    }

    if (onReact) onReact(idea.id, 'comments')
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
  const CommentItem = ({ comment, path, depth = 0 }) => {
    const isReplying = replyingTo[path] !== undefined
    const isShowingReplies = showReplies[path] !== false && depth < 3

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
                const currentValue = replyingTo[path] || ''
                setReplyingTo({
                  ...replyingTo,
                  [path]: currentValue || `@${comment.author} `
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
                  if (window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
                    deleteComment(comment.id)
                  }
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
                onClick={() => setShowReplies({ ...showReplies, [path]: !showReplies[path] })}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                {showReplies[path] === false ? 'Show' : 'Hide'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
            {(isShowingReplies || depth >= 2) && (
              <div className="space-y-2 mt-2">
                {comment.replies.map((reply, replyIndex) => (
                  <CommentItem
                    key={reply.id || replyIndex}
                    comment={reply}
                    path={path ? `${path}-${replyIndex}` : `${replyIndex}`}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {isReplying && (
          <div className="mt-2 ml-4 flex space-x-2" key={`reply-input-${path}`}>
            <input
              key={`input-${path}`}
              type="text"
              placeholder={`Reply to ${comment.author}... (use @username to mention)`}
              value={replyingTo[path] || ''}
              onChange={(e) => {
                const value = e.target.value
                setReplyingTo(prev => ({
                  ...prev,
                  [path]: value
                }))
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addComment(path)
                }
              }}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={() => addComment(path)}
              className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-1"
              title="Reply"
            >
              <CornerDownLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const updated = { ...replyingTo }
                delete updated[path]
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

  const handleComment = () => {
    if (!requireAuth()) return
    setShowComments(!showComments)
  }

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-semibold text-gray-900">{idea.author}</span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-500" key={`idea-time-${idea.id}-${timeUpdateKey}`}>
              {idea.date ? formatRelativeTime(validateAndFixDate(idea.date)) : 'just now'}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{idea.title}</h3>
          <p className="text-gray-600 mb-4">{idea.content}</p>

          {idea.tags && idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {idea.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-6 pt-4 border-t border-gray-100" key={`reactions-${idea.id}-${countUpdateKey}`}>
            <button
              onClick={toggleLike}
              className={`flex items-center space-x-2 transition-colors ${userReactions[idea.id]?.liked
                ? 'text-primary-600'
                : 'text-gray-600 hover:text-primary-600'
                }`}
            >
              <ThumbsUp className={`w-5 h-5 ${userReactions[idea.id]?.liked ? 'fill-current' : ''}`} />
              <span>{getDisplayCount('likes')}</span>
            </button>
            <button
              onClick={toggleUnlike}
              className={`flex items-center space-x-2 transition-colors ${userReactions[idea.id]?.unliked
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
                }`}
              title={userReactions[idea.id]?.unliked ? 'Remove unlike' : 'Unlike'}
            >
              <ThumbsDown className={`w-5 h-5 ${userReactions[idea.id]?.unliked ? 'fill-current' : ''}`} />
              <span>{getDisplayCount('hearts')}</span>
            </button>
            <button
              onClick={handleComment}
              className={`flex items-center space-x-2 transition-colors ${showComments
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
                }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span>{getDisplayCount('comments')}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-3">Comments</h4>

              {/* Existing Comments */}
              <div className="space-y-3 mb-4">
                {getAllComments().map((comment, index) => (
                  <CommentItem
                    key={comment.id || index}
                    comment={comment}
                    path={String(index)}
                    depth={0}
                  />
                ))}
              </div>

              {/* Add Comment */}
              {user && (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Leave a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addComment()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => addComment()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
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
}
