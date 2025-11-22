import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Shield, Plus, Edit, Trash2, Users, FileText, MessageSquare,
  Award, BookOpen, Save, X, Search, ArrowLeft, Eye, EyeOff,
  Video, Image, MapPin, FileText as FileTextIcon, Users as UsersIcon,
  Lightbulb, BarChart2, Megaphone, TrendingUp, Palette, CheckCircle,
  Image as ImageIcon, Video as VideoIcon, Mail, Target
} from 'lucide-react'
import Modal from '../components/Modal'
import {
  getEcoQuestActivities, saveEcoQuestActivities,
  getEcoLearnArticles, saveEcoLearnArticles,
  getAllUsers, updateUserInfo, clearUsersCache,
  getAllPosts, deletePost as deletePostUtil,
  getAllComments, deleteComment as deleteCommentUtil
} from '../utils/adminUtils'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, isAdmin, API_URL } = useAuth()
  const [activeTab, setActiveTab] = useState('activities')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info', showConfirm: false, onConfirm: null, onCancel: null })

  // Check admin access
  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/')
    }
  }, [user, isAdmin, navigate])

  if (!user || !isAdmin()) {
    return null
  }

  // Tab components
  const EcoQuestActivitiesTab = () => {
    const [activities, setActivities] = useState(getEcoQuestActivities())
    const [editingActivity, setEditingActivity] = useState(null)
    const [showActivityForm, setShowActivityForm] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [newActivity, setNewActivity] = useState({
      id: '',
      number: '',
      title: '',
      category: 'collabspace', // 'collabspace' or 'activista'
      objective: '',
      instructions: []
    })

    const icons = {
      Video, Image, MapPin, FileTextIcon, UsersIcon, Award, Lightbulb, BarChart2,
      Megaphone, TrendingUp, Palette, CheckCircle, ImageIcon, VideoIcon, Mail, Target
    }

    useEffect(() => {
      const handleUpdate = () => {
        setActivities(getEcoQuestActivities())
      }
      window.addEventListener('ecoquestActivitiesUpdated', handleUpdate)
      return () => window.removeEventListener('ecoquestActivitiesUpdated', handleUpdate)
    }, [])

    const handleSaveActivity = () => {
      if (!newActivity.id || !newActivity.title) {
        setModal({
          isOpen: true,
          title: 'Validation Error',
          message: 'Please fill in Activity ID and Title',
          type: 'warning'
        })
        return
      }

      const updated = { ...activities }
      if (!updated[newActivity.category]) {
        updated[newActivity.category] = []
      }

      if (editingActivity) {
        // Update existing
        const index = updated[newActivity.category].findIndex(a => a.id === editingActivity.id)
        if (index !== -1) {
          updated[newActivity.category][index] = { ...newActivity }
        }
      } else {
        // Add new
        updated[newActivity.category].push({ ...newActivity })
      }

      if (saveEcoQuestActivities(updated)) {
        setActivities(updated)
        setShowActivityForm(false)
        setEditingActivity(null)
        setNewActivity({ id: '', number: '', title: '', category: 'collabspace', objective: '', instructions: [] })
        setModal({
          isOpen: true,
          title: 'Success',
          message: 'Activity saved successfully!',
          type: 'success'
        })
      }
    }

    const handleDeleteActivity = (category, activityId) => {
      setModal({
        isOpen: true,
        title: 'Delete Activity',
        message: 'Are you sure you want to delete this activity? This action cannot be undone.',
        type: 'warning',
        showConfirm: true,
        onConfirm: () => {
          const updated = { ...activities }
          updated[category] = updated[category].filter(a => a.id !== activityId)
          if (saveEcoQuestActivities(updated)) {
            setActivities(updated)
            setModal({ ...modal, isOpen: false })
          }
        },
        onCancel: () => setModal({ ...modal, isOpen: false })
      })
    }

    const handleEditActivity = (activity) => {
      setEditingActivity(activity)
      setNewActivity({ ...activity, instructions: [...activity.instructions] })
      setShowActivityForm(true)
    }

    const allActivities = [
      ...(activities.collabspace || []).map(a => ({ ...a, category: 'collabspace' })),
      ...(activities.activista || []).map(a => ({ ...a, category: 'activista' }))
    ]

    const filteredActivities = allActivities.filter(activity =>
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.id.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">EcoQuest Activities</h3>
            <p className="text-gray-600 mt-1">Manage activities for CollabSpace and ActiVista</p>
          </div>
          <button
            onClick={() => {
              setEditingActivity(null)
              setNewActivity({ id: '', number: '', title: '', category: 'collabspace', objective: '', instructions: [] })
              setShowActivityForm(true)
            }}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Activity</span>
          </button>
        </div>

        {/* Activity Form Modal */}
        {showActivityForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{editingActivity ? 'Edit Activity' : 'Add New Activity'}</h3>
                <button onClick={() => { setShowActivityForm(false); setEditingActivity(null) }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activity ID *</label>
                  <input
                    type="text"
                    value={newActivity.id}
                    onChange={(e) => setNewActivity({ ...newActivity, id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., eco-pitch"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activity Number</label>
                  <input
                    type="text"
                    value={newActivity.number}
                    onChange={(e) => setNewActivity({ ...newActivity, number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={newActivity.title}
                    onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Activity title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={newActivity.category}
                    onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="collabspace">CollabSpace</option>
                    <option value="activista">ActiVista</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Objective</label>
                  <textarea
                    value={newActivity.objective}
                    onChange={(e) => setNewActivity({ ...newActivity, objective: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows="3"
                    placeholder="Activity objective"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                  <div className="space-y-2">
                    {newActivity.instructions.map((instruction, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={instruction}
                          onChange={(e) => {
                            const updated = [...newActivity.instructions]
                            updated[idx] = e.target.value
                            setNewActivity({ ...newActivity, instructions: updated })
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder={`Instruction ${idx + 1}`}
                        />
                        <button
                          onClick={() => {
                            const updated = newActivity.instructions.filter((_, i) => i !== idx)
                            setNewActivity({ ...newActivity, instructions: updated })
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setNewActivity({ ...newActivity, instructions: [...newActivity.instructions, ''] })}
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      + Add Instruction
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-4 border-t">
                  <button onClick={handleSaveActivity} className="btn-primary">
                    <Save className="w-4 h-4 mr-2" />
                    Save Activity
                  </button>
                  <button onClick={() => { setShowActivityForm(false); setEditingActivity(null) }} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Activities List */}
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div key={`${activity.category}-${activity.id}`} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                      {activity.category}
                    </span>
                    {activity.number && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        #{activity.number}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{activity.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{activity.objective}</p>
                  {activity.instructions && activity.instructions.length > 0 && (
                    <div className="text-sm text-gray-500">
                      <strong>Instructions:</strong>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        {activity.instructions.map((inst, idx) => (
                          <li key={idx}>{inst}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEditActivity(activity)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteActivity(activity.category, activity.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredActivities.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No activities found. Click "Add Activity" to create one.
            </div>
          )}
        </div>
      </div>
    )
  }

  const EcoLearnArticlesTab = () => {
    const [articles, setArticles] = useState(getEcoLearnArticles())
    const [editingArticle, setEditingArticle] = useState(null)
    const [showArticleForm, setShowArticleForm] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [fetchingContent, setFetchingContent] = useState(false)
    const [newArticle, setNewArticle] = useState({
      id: Date.now(),
      title: '',
      source: '',
      author: '',
      url: '',
      content: '',
      readTime: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      likes: 0,
      hearts: 0,
      comments: 0,
    })

    useEffect(() => {
      const handleUpdate = () => {
        setArticles(getEcoLearnArticles())
      }
      window.addEventListener('ecolearnArticlesUpdated', handleUpdate)
      return () => window.removeEventListener('ecolearnArticlesUpdated', handleUpdate)
    }, [])

    // Load default articles on first load
    useEffect(() => {
      const loadedArticles = getEcoLearnArticles()
      if (loadedArticles.length > 0 && articles.length === 0) {
        setArticles(loadedArticles)
      }
    }, [])

    const handleFetchContent = async () => {
      if (!newArticle.url) {
        setModal({
          isOpen: true,
          title: 'Validation Error',
          message: 'Please enter a URL first',
          type: 'warning'
        })
        return
      }

      setFetchingContent(true)
      try {
        const encodedUrl = encodeURIComponent(newArticle.url)
        // Use base URL without /api/auth since article fetch endpoint is at root level
        const baseUrl = API_URL.replace('/api/auth', '')
        const fetchUrl = `${baseUrl}/api/article/fetch?url=${encodedUrl}`
        console.log('Fetching from:', fetchUrl)

        const response = await fetch(fetchUrl)
        console.log('Response status:', response.status)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: response.statusText }))
          console.error('Fetch error:', errorData)
          throw new Error(errorData.error || 'Failed to fetch article content')
        }

        const data = await response.json()
        console.log('Fetched data:', data)

        // Handle different response structures (video, PDF, article, etc.)
        const title = data.title || newArticle.title || 'Untitled Article'
        const content = data.content || data.description || 'Content could not be extracted. Please add manually.'
        const source = data.source || (data.isVideo ? 'YouTube' : '') || newArticle.source || ''
        const author = data.author || (data.isVideo ? 'YouTube' : '') || newArticle.author || ''

        // Auto-fill fields with fetched data
        setNewArticle({
          ...newArticle,
          title: title,
          content: content,
          source: source,
          author: author,
        })

        console.log('Updated article:', { title, content, source, author })

        // Don't show modal immediately - let user see the filled fields
        // setModal({
        //   isOpen: true,
        //   title: 'Success',
        //   message: 'Article content fetched successfully! Please review and adjust as needed.',
        //   type: 'success'
        // })
      } catch (error) {
        console.error('Error fetching article:', error)
        setModal({
          isOpen: true,
          title: 'Fetch Error',
          message: `Could not fetch article content: ${error.message}. You can still add content manually.`,
          type: 'error'
        })
      } finally {
        setFetchingContent(false)
      }
    }

    const handleSaveArticle = () => {
      if (!newArticle.title || !newArticle.url) {
        setModal({
          isOpen: true,
          title: 'Validation Error',
          message: 'Please fill in Title and URL',
          type: 'warning'
        })
        return
      }

      const updated = [...articles]

      if (editingArticle) {
        const index = updated.findIndex(a => a.id === editingArticle.id)
        if (index !== -1) {
          updated[index] = { ...newArticle }
        }
      } else {
        updated.push({ ...newArticle, id: Date.now() })
      }

      if (saveEcoLearnArticles(updated)) {
        setArticles(updated)
        setShowArticleForm(false)
        setEditingArticle(null)
        setNewArticle({
          id: Date.now(),
          title: '',
          source: '',
          author: '',
          url: '',
          content: '',
          readTime: '',
          category: '',
          date: new Date().toISOString().split('T')[0],
          likes: 0,
          hearts: 0,
          comments: 0,
        })
        setModal({
          isOpen: true,
          title: 'Success',
          message: 'Article saved successfully!',
          type: 'success'
        })
      }
    }

    const handleDeleteArticle = (articleId) => {
      setModal({
        isOpen: true,
        title: 'Delete Article',
        message: 'Are you sure you want to delete this article? This action cannot be undone.',
        type: 'warning',
        showConfirm: true,
        onConfirm: () => {
          const updated = articles.filter(a => a.id !== articleId)
          if (saveEcoLearnArticles(updated)) {
            setArticles(updated)
            setModal({ ...modal, isOpen: false })
          }
        },
        onCancel: () => setModal({ ...modal, isOpen: false })
      })
    }

    const handleEditArticle = (article) => {
      setEditingArticle(article)
      setNewArticle({ ...article })
      setShowArticleForm(true)
    }

    const filteredArticles = articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">EcoLearn Articles</h3>
            <p className="text-gray-600 mt-1">Manage articles for the EcoLearn section</p>
          </div>
          <button
            onClick={() => {
              setEditingArticle(null)
              setNewArticle({
                id: Date.now(),
                title: '',
                source: '',
                author: '',
                url: '',
                content: '',
                readTime: '',
                category: '',
                date: new Date().toISOString().split('T')[0],
                likes: 0,
                hearts: 0,
                comments: 0,
              })
              setShowArticleForm(true)
            }}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Article</span>
          </button>
        </div>

        {/* Article Form Modal */}
        {showArticleForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{editingArticle ? 'Edit Article' : 'Add New Article'}</h3>
                <button onClick={() => { setShowArticleForm(false); setEditingArticle(null) }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* URL Field - Primary Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Article URL *</label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={newArticle.url}
                      onChange={(e) => setNewArticle({ ...newArticle, url: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="https://example.com/article"
                    />
                    <button
                      onClick={handleFetchContent}
                      disabled={fetchingContent || !newArticle.url}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {fetchingContent ? 'Fetching...' : 'Fetch Content'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the article URL and click "Fetch Content" to automatically extract the article information.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={newArticle.title}
                      onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={newArticle.category}
                      onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Urban Planning"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                    <input
                      type="text"
                      value={newArticle.source}
                      onChange={(e) => setNewArticle({ ...newArticle, source: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                    <input
                      type="text"
                      value={newArticle.author}
                      onChange={(e) => setNewArticle({ ...newArticle, author: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Read Time</label>
                    <input
                      type="text"
                      value={newArticle.readTime}
                      onChange={(e) => setNewArticle({ ...newArticle, readTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., 6 min read"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={newArticle.date}
                      onChange={(e) => setNewArticle({ ...newArticle, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Article Content *
                    <span className="text-xs text-gray-500 ml-1">(Auto-filled from URL or paste manually)</span>
                  </label>
                  <textarea
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows="15"
                    placeholder="Click 'Fetch Content' to automatically extract article text from the URL, or paste manually..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This content will be displayed when users click to read the article. Auto-fetched from URL or manually entered.
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-4 border-t">
                  <button onClick={handleSaveArticle} className="btn-primary">
                    <Save className="w-4 h-4 mr-2" />
                    Save Article
                  </button>
                  <button onClick={() => { setShowArticleForm(false); setEditingArticle(null) }} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Articles List */}
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <div key={article.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {article.category && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                        {article.category}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {article.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    By {article.author || 'Unknown'} • {article.source || 'Unknown Source'}
                  </p>
                  <p className="text-sm text-gray-500 line-clamp-2">{article.content}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEditArticle(article)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteArticle(article.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredArticles.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No articles found. Click "Add Article" to create one.
            </div>
          )}
        </div>
      </div>
    )
  }

  const UserManagementTab = () => {
    const [users, setUsers] = useState([])
    const [editingUser, setEditingUser] = useState(null)
    const [showUserForm, setShowUserForm] = useState(false)
    const [showCreateUserForm, setShowCreateUserForm] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [newUser, setNewUser] = useState({
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'user',
      isAdmin: false
    })
    const [userFormData, setUserFormData] = useState({
      name: '',
      username: '',
      email: '',
      role: 'user',
      isAdmin: false,
      newPassword: ''
    })

    useEffect(() => {
      loadUsers()
    }, [])

    const loadUsers = async () => {
      // Load localStorage users immediately for instant display
      const localUsers = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key.startsWith('user_profile_')) {
          try {
            const userData = JSON.parse(localStorage.getItem(key))
            if (userData && userData.id) {
              localUsers.push(userData)
            }
          } catch (e) {
            // Skip invalid entries
          }
        }
      }

      // Show localStorage users immediately
      if (localUsers.length > 0) {
        setUsers(localUsers)
        setLoading(false)
      } else {
        setLoading(true)
      }

      // Then try to load from backend in background
      try {
        const allUsers = await getAllUsers()
        if (allUsers.length > 0) {
          setUsers(allUsers)
        }
      } catch (error) {
        console.error('Error loading users from backend:', error)
        // Don't show error modal if we already have localStorage users
        if (localUsers.length === 0) {
          setModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to load users',
            type: 'error'
          })
        }
      } finally {
        setLoading(false)
      }
    }

    const handleCreateUser = async () => {
      if (!newUser.name || !newUser.username || !newUser.email || !newUser.password) {
        setModal({
          isOpen: true,
          title: 'Validation Error',
          message: 'Please fill in all required fields',
          type: 'warning'
        })
        return
      }

      if (newUser.password.length < 6) {
        setModal({
          isOpen: true,
          title: 'Validation Error',
          message: 'Password must be at least 6 characters',
          type: 'warning'
        })
        return
      }

      try {
        const response = await fetch(`${API_URL}/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newUser.name,
            username: newUser.username,
            email: newUser.email,
            password: newUser.password,
            role: newUser.role,
            isAdmin: newUser.isAdmin
          })
        })

        const data = await response.json()
        if (response.ok) {
          setModal({
            isOpen: true,
            title: 'Success',
            message: 'User created successfully!',
            type: 'success'
          })
          setShowCreateUserForm(false)
          setNewUser({ name: '', username: '', email: '', password: '', role: 'user', isAdmin: false })
          loadUsers()
        } else {
          setModal({
            isOpen: true,
            title: 'Error',
            message: data.error || 'Failed to create user',
            type: 'error'
          })
        }
      } catch (error) {
        setModal({
          isOpen: true,
          title: 'Error',
          message: 'Failed to connect to server',
          type: 'error'
        })
      }
    }

    const handleUpdateUser = async () => {
      if (!editingUser) return

      setLoading(true)
      try {
        const userId = editingUser.id || editingUser.email

        // Update user profile via backend API
        const updateResponse = await fetch(`${API_URL}/api/auth/admin/update-user`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            userId: userId,
            name: userFormData.name,
            username: userFormData.username,
            email: userFormData.email,
            role: userFormData.role,
            isAdmin: userFormData.isAdmin
          })
        })

        const updateData = await updateResponse.json()

        if (!updateResponse.ok) {
          setModal({
            isOpen: true,
            title: 'Error',
            message: updateData.error || 'Failed to update user',
            type: 'error'
          })
          setLoading(false)
          return
        }

        // If new password is provided, change it
        if (userFormData.newPassword && userFormData.newPassword.trim() !== '') {
          if (userFormData.newPassword.length < 6) {
            setModal({
              isOpen: true,
              title: 'Validation Error',
              message: 'Password must be at least 6 characters',
              type: 'warning'
            })
            setLoading(false)
            return
          }

          const passwordResponse = await fetch(`${API_URL}/api/auth/admin/change-user-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              userId: userId,
              newPassword: userFormData.newPassword
            })
          })

          const passwordData = await passwordResponse.json()

          if (!passwordResponse.ok) {
            setModal({
              isOpen: true,
              title: 'Error',
              message: passwordData.error || 'Failed to change password',
              type: 'error'
            })
            setLoading(false)
            return
          }
        }

        // Also update localStorage for backward compatibility
        updateUserInfo(userId, userFormData)

        setModal({
          isOpen: true,
          title: 'Success',
          message: 'User updated successfully!',
          type: 'success'
        })
        setShowUserForm(false)
        setEditingUser(null)
        setUserFormData({ name: '', username: '', email: '', role: 'user', isAdmin: false, newPassword: '' })
        loadUsers()
      } catch (error) {
        console.error('Update user error:', error)
        setModal({
          isOpen: true,
          title: 'Error',
          message: 'Failed to connect to server',
          type: 'error'
        })
      } finally {
        setLoading(false)
      }
    }

    const handleDeleteUser = (userId) => {
      setModal({
        isOpen: true,
        title: 'Delete User',
        message: 'Are you sure you want to delete this user? This will remove all their data.',
        type: 'warning',
        showConfirm: true,
        onConfirm: async () => {
          try {
            // Try to delete from backend first
            const token = localStorage.getItem('token')
            if (token) {
              try {
                const response = await fetch(`${API_URL}/admin/delete-user`, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ userId })
                })

                if (!response.ok) {
                  console.log('Backend delete failed, continuing with localStorage cleanup')
                }
              } catch (error) {
                console.log('Backend not available, continuing with localStorage cleanup')
              }
            }

            // Delete user data from localStorage
            const keys = Object.keys(localStorage)
            keys.forEach(key => {
              if (key.includes(userId)) {
                localStorage.removeItem(key)
              }
            })

            // Close modal first
            setModal({ ...modal, isOpen: false })

            // Clear cache and refresh user list immediately
            clearUsersCache()
            await loadUsers()            // Show success message after refresh
            setTimeout(() => {
              setModal({
                isOpen: true,
                title: 'Success',
                message: 'User deleted successfully',
                type: 'success'
              })
            }, 100)
          } catch (error) {
            console.error('Delete user error:', error)
            setModal({
              isOpen: true,
              title: 'Error',
              message: 'Failed to delete user',
              type: 'error'
            })
          }
        },
        onCancel: () => setModal({ ...modal, isOpen: false })
      })
    }

    const handleEditUser = (user) => {
      setEditingUser(user)
      setUserFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        role: user.role || 'user',
        isAdmin: user.isAdmin || false,
        newPassword: ''
      })
      setShowUserForm(true)
    }

    const filteredUsers = users.filter(u =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">User Management</h3>
            <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
          </div>
          <button
            onClick={() => {
              setNewUser({ name: '', username: '', email: '', password: '', role: 'user', isAdmin: false })
              setShowCreateUserForm(true)
            }}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create User</span>
          </button>
        </div>

        {/* Create User Form Modal */}
        {showCreateUserForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Create New User</h3>
                <button onClick={() => setShowCreateUserForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newUser.isAdmin}
                    onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">Admin Access</label>
                </div>

                <div className="flex items-center space-x-2 pt-4 border-t">
                  <button onClick={handleCreateUser} className="btn-primary">
                    <Save className="w-4 h-4 mr-2" />
                    Create User
                  </button>
                  <button onClick={() => setShowCreateUserForm(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Form Modal */}
        {showUserForm && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Edit User</h3>
                <button onClick={() => { setShowUserForm(false); setEditingUser(null) }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={userFormData.isAdmin}
                    onChange={(e) => setUserFormData({ ...userFormData, isAdmin: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">Admin Access</label>
                </div>

                {/* Change Password Section */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Change Password (Optional)</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current password"
                      value={userFormData.newPassword}
                      onChange={(e) => setUserFormData({ ...userFormData, newPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave blank if you don't want to change the password</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-4 border-t">
                  <button onClick={handleUpdateUser} disabled={loading} className="btn-primary">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                  <button onClick={() => { setShowUserForm(false); setEditingUser(null) }} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-gray-600">Loading users...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((u, index) => (
              <div key={u.email || u.id || `user-${index}`} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{u.name || 'No Name'}</h4>
                      <p className="text-sm text-gray-600">{u.username || 'No Username'}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                      {(u.role === 'admin' || u.isAdmin) && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditUser(u)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id || u.email)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              No users found.
            </div>
          )}
        </div>
      </div>
    )
  }

  const PostManagementTab = () => {
    const [collabspacePosts, setCollabspacePosts] = useState([])
    const [activistaPosts, setActivistaPosts] = useState([])
    const [selectedType, setSelectedType] = useState('collabspace')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
      loadPosts()
    }, [])

    useEffect(() => {
      const handleUpdate = () => {
        loadPosts()
      }
      window.addEventListener('postsUpdated', handleUpdate)
      return () => window.removeEventListener('postsUpdated', handleUpdate)
    }, [])

    const loadPosts = () => {
      setCollabspacePosts(getAllPosts('collabspace'))
      setActivistaPosts(getAllPosts('activista'))
    }

    const handleDeletePost = (type, postId) => {
      setModal({
        isOpen: true,
        title: 'Delete Post',
        message: 'Are you sure you want to delete this post? This action cannot be undone.',
        type: 'warning',
        showConfirm: true,
        onConfirm: () => {
          if (deletePostUtil(type, postId)) {
            loadPosts()
            setModal({ ...modal, isOpen: false })
          }
        },
        onCancel: () => setModal({ ...modal, isOpen: false })
      })
    }

    const currentPosts = selectedType === 'collabspace' ? collabspacePosts : activistaPosts
    const filteredPosts = currentPosts.filter(post =>
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Post Management</h3>
            <p className="text-gray-600 mt-1">Manage posts from CollabSpace and ActiVista</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedType('collabspace')}
              className={`px-4 py-2 rounded-lg transition-colors ${selectedType === 'collabspace'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              CollabSpace
            </button>
            <button
              onClick={() => setSelectedType('activista')}
              className={`px-4 py-2 rounded-lg transition-colors ${selectedType === 'activista'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              ActiVista
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div key={post.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-semibold text-gray-900">{post.author}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{post.date ? new Date(post.date).toLocaleDateString() : 'Unknown date'}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{post.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {post.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleDeletePost(selectedType, post.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredPosts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No posts found.
            </div>
          )}
        </div>
      </div>
    )
  }

  const CommentManagementTab = () => {
    const [comments, setComments] = useState({})
    const [selectedSource, setSelectedSource] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
      loadComments()
    }, [])

    useEffect(() => {
      const handleUpdate = () => {
        loadComments()
      }
      window.addEventListener('commentsUpdated', handleUpdate)
      return () => window.removeEventListener('commentsUpdated', handleUpdate)
    }, [])

    const loadComments = () => {
      setComments(getAllComments())
    }

    const handleDeleteComment = (commentKey, commentId) => {
      setModal({
        isOpen: true,
        title: 'Delete Comment',
        message: 'Are you sure you want to delete this comment? This action cannot be undone.',
        type: 'warning',
        showConfirm: true,
        onConfirm: async () => {
          // Close modal first
          setModal({ ...modal, isOpen: false })

          // Delete comment
          if (deleteCommentUtil(commentKey, commentId)) {
            // Reload comments immediately
            await loadComments()

            // Show success message
            setTimeout(() => {
              setModal({
                isOpen: true,
                title: 'Success',
                message: 'Comment deleted successfully',
                type: 'success'
              })
            }, 100)
          } else {
            setModal({
              isOpen: true,
              title: 'Error',
              message: 'Failed to delete comment',
              type: 'error'
            })
          }
        },
        onCancel: () => setModal({ ...modal, isOpen: false })
      })
    }

    const flattenComments = (commentsData, commentKey) => {
      const flattened = []
      const traverse = (commentList, parentKey) => {
        if (!Array.isArray(commentList)) return
        commentList.forEach(comment => {
          flattened.push({
            ...comment,
            commentKey: parentKey || commentKey,
            source: commentsData.source
          })
          if (comment.replies && comment.replies.length > 0) {
            traverse(comment.replies, parentKey || commentKey)
          }
        })
      }
      Object.keys(commentsData.comments || {}).forEach(postId => {
        traverse(commentsData.comments[postId], commentKey)
      })
      return flattened
    }

    let allFlattenedComments = []
    Object.keys(comments).forEach(key => {
      const flattened = flattenComments(comments[key], key)
      allFlattenedComments.push(...flattened)
    })

    const filteredComments = allFlattenedComments.filter(comment => {
      const matchesSource = selectedSource === 'all' || comment.source === selectedSource
      const matchesSearch = comment.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comment.author?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSource && matchesSearch
    })

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Comment Management</h3>
            <p className="text-gray-600 mt-1">Manage comments across all sections</p>
          </div>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Sources</option>
            <option value="collabspace">CollabSpace</option>
            <option value="activista">ActiVista</option>
            <option value="home">Home</option>
            <option value="ecolearn">EcoLearn</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {filteredComments.map((comment, idx) => (
            <div key={`${comment.commentKey}-${comment.id || idx}`} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                      {comment.source || 'Unknown'}
                    </span>
                    <span className="font-semibold text-gray-900">{comment.author}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{comment.date || 'Unknown date'}</span>
                  </div>
                  <p className="text-gray-700">{comment.comment}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleDeleteComment(comment.commentKey, comment.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredComments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No comments found.
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Back</span>
          </button>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage platform content and users</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('activities')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'activities'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Award className="w-5 h-5 inline mr-2" />
              EcoQuest Activities
            </button>
            <button
              onClick={() => setActiveTab('articles')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'articles'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <BookOpen className="w-5 h-5 inline mr-2" />
              EcoLearn Articles
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'users'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'posts'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <MessageSquare className="w-5 h-5 inline mr-2" />
              Posts
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'comments'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <FileText className="w-5 h-5 inline mr-2" />
              Comments
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'activities' && <EcoQuestActivitiesTab />}
          {activeTab === 'articles' && <EcoLearnArticlesTab />}
          {activeTab === 'users' && <UserManagementTab />}
          {activeTab === 'posts' && <PostManagementTab />}
          {activeTab === 'comments' && <CommentManagementTab />}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        showConfirm={modal.showConfirm}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  )
}

