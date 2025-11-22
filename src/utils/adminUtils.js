// Admin utility functions for managing platform data

// EcoQuest Activities Management
export const getEcoQuestActivities = () => {
  try {
    const saved = localStorage.getItem('ecoquest_activities')
    if (saved) {
      return JSON.parse(saved)
    }
    // Return default activities structure
    return {
      collabspace: [
        {
          id: 'eco-pitch',
          number: '1',
          title: 'Eco-Pitch: 60-Second Solution Challenge',
          category: 'collabspace',
          objective: 'To encourage students to quickly identify an environmental or urban problem and propose a concise, feasible solution.',
          instructions: [
            'Choose one local issue (flooding, waste buildup, lack of green space, etc.).',
            'Record a 60-second video or write a 120-150 word pitch explaining: The problem, Your proposed solution, The expected impact.',
            'Upload your pitch to the platform.',
            'Classmates may react and leave constructive comments.'
          ]
        },
        // Add more default activities as needed
      ],
      activista: []
    }
  } catch (error) {
    console.error('Error loading EcoQuest activities:', error)
    return { collabspace: [], activista: [] }
  }
}

export const saveEcoQuestActivities = (activities) => {
  try {
    localStorage.setItem('ecoquest_activities', JSON.stringify(activities))
    window.dispatchEvent(new CustomEvent('ecoquestActivitiesUpdated'))
    return true
  } catch (error) {
    console.error('Error saving EcoQuest activities:', error)
    return false
  }
}

// EcoLearn Articles Management
export const getEcoLearnArticles = () => {
  try {
    const saved = localStorage.getItem('ecolearn_articles')
    if (saved) {
      const savedArticles = JSON.parse(saved)
      // If we have saved articles, use them
      if (savedArticles.length > 0) {
        return savedArticles
      }
    }
    // Return default articles if none saved
    // These should match the defaultArticles from EcoLearn.jsx
    const defaultArticles = [
      {
        id: 1,
        title: 'What Is Urban Planning?',
        source: 'ArchDaily',
        author: 'Camilla Ghisleni',
        url: 'https://www.archdaily.com/984049/what-is-urban-planning',
        content: 'Urban planning is a process of elaborating solutions that aim both to improve or requalify an existing urban area, as well as to create a new urbanization in a given region. As a discipline and as a method of action, urban planning deals with the processes of production, structuring and appropriation of urban space. In this sense, its main objective is to point out what measures should be taken to improve the quality of life of the inhabitants, including matters such as transport, security, access opportunities and even interaction with the natural environment. In the urban planning process, problems arising from urbanization are dealt with, such as pollution, traffic jam, urban voids, ecological impacts, making it essential in the current context in which much is discussed about the future of cities and the aspirations of sustainability and mobility as a way of fighting climate change.',
        readTime: '6 min read',
        category: 'Urban Planning',
        date: '2022-07-05',
        likes: 0,
        hearts: 0,
        comments: 0,
      },
      {
        id: 2,
        title: 'Types of Waste and Waste Management',
        source: 'Repsol Energy',
        author: 'Repsol Editorial Team',
        url: 'https://www.repsol.com/en/energy-move-forward/energy/types-of-waste/index.cshtml',
        content: 'There are different types of waste that can be classified according to their origin, composition, or the risk they pose to health and the environment. Understanding these types helps in proper waste management. At Repsol, we adopt the circular economy in all countries and businesses in which we operate: from the production of energy and raw materials to ecodesign in the marketing of our products. In this way, we optimize resources, reduce consumption of raw materials, and reduce the carbon footprint. An example of this waste management based on the circular economy is the start-up in Cartagena of the first plant on the Iberian Peninsula dedicated exclusively to the production of fuels of 100% renewable origin from organic waste, which will prevent the emission of 900,000 annual tonnes of CO2.',
        readTime: '8 min read',
        category: 'Waste Management',
        date: '2024-01-10',
        likes: 0,
        hearts: 0,
        comments: 0,
      },
      {
        id: 3,
        title: 'Plastic Waste Pollution Crisis in the Philippines',
        source: 'Arowana Impact Capital',
        author: 'Environmental Research Team',
        url: 'https://arowanaimpactcapital.com/plastic-waste-pollution-crisis-philippines/',
        content: 'The Philippines faces a significant plastic waste pollution crisis that threatens marine ecosystems and public health. This article explores the extent of the problem, its impacts on the environment, and potential solutions. Understanding the root causes and implementing effective waste management strategies is crucial for protecting our oceans and marine life. The crisis requires urgent action from individuals, communities, businesses, and government to address this pressing environmental issue.',
        readTime: '10 min read',
        category: 'Pollution',
        date: '2024-01-08',
        likes: 0,
        hearts: 0,
        comments: 0,
      },
      {
        id: 4,
        title: 'Climate News from the Philippines',
        source: 'Philippine Atmospheric, Geophysical and Astronomical Services Administration (PAGASA)',
        author: 'PAGASA Climate Division',
        url: 'https://climate.gov.ph/news/923',
        content: 'Latest climate updates and information from the Philippines. This article provides insights into current climate conditions, weather patterns, and climate change impacts affecting the country. Understanding climate trends is essential for preparing communities and developing adaptation strategies for a more resilient future.',
        readTime: '5 min read',
        category: 'Climate',
        date: '2024-01-15',
        likes: 0,
        hearts: 0,
        comments: 0,
      },
      {
        id: 5,
        title: 'The Runaway Crisis of Flooding in the Philippines',
        source: 'Inquirer Business',
        author: 'Business Inquirer Editorial',
        url: 'https://business.inquirer.net/488009/the-runaway-crisis-of-flooding-in-the-philippines',
        content: 'Flooding has become a critical crisis in the Philippines, affecting millions of people and causing significant economic and social impacts. This article examines the causes of increased flooding, including climate change, urbanization, deforestation, and inadequate infrastructure. It also explores the economic costs and potential solutions to mitigate this growing problem. Understanding the crisis is the first step toward developing comprehensive flood management strategies.',
        readTime: '12 min read',
        category: 'Disaster Management',
        date: '2024-01-12',
        likes: 0,
        hearts: 0,
        comments: 0,
      },
      {
        id: 6,
        title: 'Children\'s Rights to a Healthy Environment',
        source: 'Child Rights Coalition Asia',
        author: 'UNEP, UNICEF, UN Human Rights',
        url: 'https://www.crcasia.org/wp-content/uploads/2022/07/Childrens-Rights-to-Healthy-Environment_Child-friendly-Brief.pdf',
        content: 'All children have the right to live and grow up in a healthy environment. This includes safe climate for everyone and every living thing, clean air to breathe and clean water to drink, wholesome food to eat and unpolluted places to live, study, and play, and sustainable actions that make the most of today\'s resources without harming those in the future. Children all over the world are telling adults and governments that they want to live and grow up in a healthy environment. The Principles are the basic rules that everyone needs to follow to make sure that children can enjoy their rights to a healthy environment. There are a total of 37 Principles covering environmental education, protection from harmful business activities, child participation, play, access to information, and protection from climate change and environmental damage.',
        readTime: '15 min read',
        category: 'Rights & Education',
        date: '2022-07-01',
        likes: 0,
        hearts: 0,
        comments: 0,
      },
      {
        id: 7,
        title: 'Sustainable Agriculture in Asia-Pacific',
        source: 'Food and Fertilizer Technology Center (FFTC)',
        author: 'FFTC Research Team',
        url: 'https://ap.fftc.org.tw/article/588',
        content: 'Sustainable agriculture practices in the Asia-Pacific region are crucial for food security and environmental protection. This article explores innovative farming techniques, resource management strategies, and policy approaches that can help feed growing populations while preserving natural resources. Modern agriculture faces numerous challenges, but sustainable practices offer hope for feeding the world while protecting the environment.',
        readTime: '7 min read',
        category: 'Agriculture',
        date: '2024-01-09',
        likes: 0,
        hearts: 0,
        comments: 0,
      },
      {
        id: 8,
        title: 'Stop Disasters Game - Interactive Learning',
        source: 'UN Office for Disaster Risk Reduction',
        author: 'UNISDR',
        url: 'https://www.stopdisastersgame.org/game/',
        content: 'An interactive educational game that teaches players how to build safer communities and prepare for natural disasters. The game helps students understand disaster risk reduction strategies through hands-on simulation. Players learn about different types of disasters including floods, earthquakes, tsunamis, wildfires, and hurricanes. This gamified approach makes learning about disaster preparedness engaging and memorable.',
        readTime: '5 min read',
        category: 'Interactive Learning',
        date: '2024-01-14',
        likes: 0,
        hearts: 0,
        comments: 0,
      },
    ]
    return defaultArticles
  } catch (error) {
    console.error('Error loading EcoLearn articles:', error)
    return []
  }
}

export const saveEcoLearnArticles = (articles) => {
  try {
    localStorage.setItem('ecolearn_articles', JSON.stringify(articles))
    window.dispatchEvent(new CustomEvent('ecolearnArticlesUpdated'))
    return true
  } catch (error) {
    console.error('Error saving EcoLearn articles:', error)
    return false
  }
}

// User Management
let usersCacheTimestamp = 0
let usersCache = []
const CACHE_DURATION = 5000 // 5 seconds cache

export const getAllUsers = async () => {
  try {
    // Return cached data if still valid
    const now = Date.now()
    if (usersCache.length > 0 && (now - usersCacheTimestamp) < CACHE_DURATION) {
      return usersCache
    }

    // Get users from localStorage FIRST (always available, immediate)
    const localUsers = []
    const keys = Object.keys(localStorage)

    keys.forEach(key => {
      if (key.startsWith('user_profile_')) {
        try {
          const userData = JSON.parse(localStorage.getItem(key))
          const userId = key.replace('user_profile_', '')
          localUsers.push({
            id: userId,
            ...userData
          })
        } catch (error) {
          // Skip invalid entries
        }
      }
    })

    // Start with localStorage users in the map
    const userMap = new Map()
    localUsers.forEach(user => {
      const key = user.email || user.id
      userMap.set(key, user)
    })

    // Try to get backend users (with short timeout), but don't block
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 1000) // Reduced to 1 second

        const response = await fetch('http://72.61.125.98:3001/api/auth/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          // Merge backend users (override localStorage if exists)
          data.users.forEach(user => {
            const key = user.email || user.id
            userMap.set(key, user)
          })
        }
      }
    } catch (error) {
      // Silently fail, we already have localStorage data
      console.log('Backend not available, using localStorage users')
    }

    const result = Array.from(userMap.values())

    // Update cache
    usersCache = result
    usersCacheTimestamp = now

    return result
  } catch (error) {
    console.error('Error loading users:', error)

    // Even on error, return localStorage users if available
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
    return localUsers
  }
}

export const clearUsersCache = () => {
  usersCache = []
  usersCacheTimestamp = 0
}

export const updateUserInfo = (userId, userData) => {
  try {
    const profileKey = `user_profile_${userId}`
    const currentProfile = localStorage.getItem(profileKey)
    const profile = currentProfile ? JSON.parse(currentProfile) : {}

    const updatedProfile = {
      ...profile,
      ...userData
    }

    localStorage.setItem(profileKey, JSON.stringify(updatedProfile))

    // Update user in main user storage if exists
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      const user = JSON.parse(savedUser)
      if (user.id === userId || user.email === userId) {
        const updatedUser = {
          ...user,
          ...userData
        }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
    }

    // Clear users cache
    usersCache = []
    usersCacheTimestamp = 0

    window.dispatchEvent(new CustomEvent('userUpdated', { detail: { userId, userData } }))
    return true
  } catch (error) {
    console.error('Error updating user:', error)
    return false
  }
}// Post Management
export const getAllPosts = (type) => {
  try {
    if (type === 'collabspace') {
      const saved = localStorage.getItem('collabspace_posts')
      return saved ? JSON.parse(saved) : []
    } else if (type === 'activista') {
      const saved = localStorage.getItem('activista_posts')
      return saved ? JSON.parse(saved) : []
    }
    return []
  } catch (error) {
    console.error('Error loading posts:', error)
    return []
  }
}

export const deletePost = (type, postId) => {
  try {
    if (type === 'collabspace') {
      const saved = localStorage.getItem('collabspace_posts')
      if (saved) {
        const posts = JSON.parse(saved)
        const filtered = posts.filter(p => p.id !== postId)
        localStorage.setItem('collabspace_posts', JSON.stringify(filtered))
        window.dispatchEvent(new CustomEvent('postsUpdated', { detail: { type: 'collabspace' } }))
        return true
      }
    } else if (type === 'activista') {
      const saved = localStorage.getItem('activista_posts')
      if (saved) {
        const posts = JSON.parse(saved)
        const filtered = posts.filter(p => p.id !== postId)
        localStorage.setItem('activista_posts', JSON.stringify(filtered))
        window.dispatchEvent(new CustomEvent('postsUpdated', { detail: { type: 'activista' } }))
        return true
      }
    }
    return false
  } catch (error) {
    console.error('Error deleting post:', error)
    return false
  }
}

// Comment Management
export const getAllComments = () => {
  try {
    const allComments = {}
    const keys = Object.keys(localStorage)

    keys.forEach(key => {
      if (key.startsWith('collabspace_user_comments_') ||
        key.startsWith('activista_user_comments_') ||
        key.startsWith('home_ideas_user_comments_') ||
        key.startsWith('ecolearn_user_comments_')) {
        try {
          const comments = JSON.parse(localStorage.getItem(key))
          const userId = key.replace('collabspace_user_comments_', '')
            .replace('activista_user_comments_', '')
            .replace('home_ideas_user_comments_', '')
            .replace('ecolearn_user_comments_', '')
          allComments[key] = {
            userId,
            comments,
            source: key.includes('collabspace') ? 'collabspace' :
              key.includes('activista') ? 'activista' :
                key.includes('home') ? 'home' : 'ecolearn'
          }
        } catch (error) {
          // Skip invalid entries
        }
      }
    })

    return allComments
  } catch (error) {
    console.error('Error loading comments:', error)
    return {}
  }
}

export const deleteComment = (commentKey, commentId) => {
  try {
    const saved = localStorage.getItem(commentKey)
    if (!saved) return false

    const commentsData = JSON.parse(saved)

    // Recursive function to find and delete comment from an array
    const deleteCommentFromArray = (commentList) => {
      if (!Array.isArray(commentList)) return commentList

      return commentList.filter(comment => {
        // If this is the comment to delete, filter it out
        if (String(comment.id) === String(commentId)) {
          return false
        }
        // Check replies recursively
        if (comment.replies && comment.replies.length > 0) {
          comment.replies = deleteCommentFromArray(comment.replies)
        }
        return true
      })
    }

    // Handle both flat array and object with postId keys
    let updated
    if (Array.isArray(commentsData)) {
      // Flat array structure
      updated = deleteCommentFromArray(commentsData)
    } else if (typeof commentsData === 'object') {
      // Object with postId keys: { postId: [comments], postId2: [comments] }
      updated = {}
      Object.keys(commentsData).forEach(postId => {
        if (Array.isArray(commentsData[postId])) {
          updated[postId] = deleteCommentFromArray(commentsData[postId])
        } else {
          updated[postId] = commentsData[postId]
        }
      })
    } else {
      return false
    }

    localStorage.setItem(commentKey, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('commentsUpdated'))
    return true
  } catch (error) {
    console.error('Error deleting comment:', error)
    return false
  }
}

