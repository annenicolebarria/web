# EcoSphere Platform Backend Server

Backend API server for EcoSphere Platform authentication system.

## Features

- User registration (signup)
- User login with JWT authentication
- Forgot password functionality
- Password reset with secure tokens
- SQLite database for data storage
- Password hashing with bcrypt

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will run on `http://72.61.125.98:3001` by default.

## API Endpoints

### POST /api/auth/signup
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### POST /api/auth/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

### POST /api/auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset-token",
  "email": "john@example.com",
  "password": "newpassword123"
}
```

### GET /api/auth/verify-token/:token
Verify if a reset token is valid.

### GET /api/auth/verify
Verify JWT token (requires Authorization header).

## Database

Uses SQLite database (`ecoplatform.db`) with two tables:
- `users` - Stores user accounts
- `password_reset_tokens` - Stores password reset tokens

## Environment Variables

Create a `.env` file in the server directory:

```
PORT=3001
JWT_SECRET=your-secret-key-here
```

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- Password reset tokens expire after 1 hour
- Reset tokens are marked as used after password reset
