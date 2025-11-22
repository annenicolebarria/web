# EcoSphere Platform - Environmental Action Platform

A modern web platform for students to share environmental ideas, learn, discuss, and take action for a sustainable future.

## Features

1. **Home Page (EcoQuest)**
   - User profile and statistics
   - Activity feed (articles read, trends joined, ideas posted)
   - Task bar with rewards system
   - Badges and points tracking

2. **EcoLearn: The Knowledge Hub**
   - Article browsing with real environmental articles
   - Reading progress tracking (Not Started, Reading, Finished)
   - Comment and reaction system
   - Search and filter functionality

3. **CollabSpace: The Interactive Forum**
   - Post ideas, proposals, opinions, and solutions
   - Voting system (upvote/downvote)
   - Sorting by trending, newest, or most votes
   - Tag-based organization

4. **ActiVista: The Advocacy Board**
   - Post advocacy campaigns
   - Create and join digital pledges
   - Track participant numbers
   - React and share advocacy posts

5. **Authentication System**
   - User signup and login
   - Forgot password functionality
   - Password reset with secure tokens
   - JWT-based authentication

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install frontend dependencies:
```bash
npm install
```

2. Install backend dependencies:
```bash
cd server
npm install
cd ..
```

### Running the Application

You need to run both the frontend and backend servers:

1. **Start the backend server:**
```bash
npm run server:dev
```
or
```bash
cd server
npm run dev
```

The backend server will run on `http://localhost:3001`

2. **Start the frontend server (in a new terminal):**
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### Build for Production

**Frontend:**
```bash
npm run build
```

**Backend:**
```bash
cd server
npm start
```

## Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend
- **Express.js** - Web server
- **SQLite** - Database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **CORS** - Cross-origin resource sharing

## Database

The application uses SQLite database (`server/ecoplatform.db`) with the following tables:

- **users** - Stores user accounts with hashed passwords
- **password_reset_tokens** - Stores password reset tokens with expiration

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify-token/:token` - Verify reset token
- `GET /api/auth/verify` - Verify JWT token

## Project Structure

```
Web-ideas/
├── src/
│   ├── components/      # Reusable components (Navbar, IdeaCard)
│   ├── pages/          # Page components (Home, EcoLearn, CollabSpace, ActiVista, Login, SignUp, etc.)
│   ├── context/        # React context (AuthContext)
│   ├── App.jsx         # Main app component with routing
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── server/
│   ├── database.js     # Database setup and functions
│   ├── server.js       # Express server and API routes
│   ├── package.json    # Backend dependencies
│   └── ecoplatform.db  # SQLite database (created automatically)
├── package.json        # Frontend dependencies
└── README.md           # This file
```

## Security Features

- Passwords are hashed using bcrypt
- JWT tokens for authentication (expires in 7 days)
- Password reset tokens expire after 1 hour
- Secure token-based password reset flow
- Input validation on both frontend and backend

## Environment Variables

For the backend server, you can create a `.env` file in the `server/` directory:

```env
PORT=3001
JWT_SECRET=your-secret-key-here

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:5173

# Gmail Configuration for Password Reset
# IMPORTANT: For Gmail, you need to use an App Password, not your regular password
# Follow these steps to get your Gmail App Password:
# 1. Go to your Google Account settings: https://myaccount.google.com/
# 2. Enable 2-Step Verification if you haven't already
# 3. Go to Security > 2-Step Verification > App passwords
# 4. Select "Mail" and "Other (Custom name)" - enter "EcoSphere Platform"
# 5. Copy the 16-character app password and paste it below

GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password-here
```

**Setting up Gmail App Password:**
1. Go to https://myaccount.google.com/
2. Enable **2-Step Verification** if you haven't already
3. Navigate to **Security** > **2-Step Verification** > **App passwords**
4. Select **"Mail"** as the app and **"Other (Custom name)"** as the device
5. Enter "EcoSphere Platform" as the custom name
6. Click **Generate**
7. Copy the 16-character password (remove spaces) and use it as `GMAIL_APP_PASSWORD`

## Notes

- The database is automatically created on first run
- Password reset tokens are cleaned up automatically (expired or used tokens)
- Password reset emails are sent via Gmail using nodemailer
- **Important**: You must configure Gmail credentials in `.env` file for password reset to work
- Always use environment variables for sensitive data in production
- Gmail App Password is required (not your regular Gmail password)