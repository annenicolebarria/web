import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import pkg from 'nodemailer';
const { createTransport } = pkg;
import {
  createUser,
  getUserByEmail,
  getUserByUsername,
  getUserById,
  updateUserPassword,
  updateUserProfile,
  updateUserRole,
  updateUserProfilePicture,
  createPasswordResetToken,
  getPasswordResetToken,
  markTokenAsUsed,
  getAllUsers,
  deleteUser,
  dbGet
} from './database.js';
import { sendPasswordResetEmail } from './email.js';
import * as cheerio from 'cheerio';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret - In production, use environment variables
const JWT_TOKEN_SECRET = JWT_SECRET;

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Sign up endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, username, email, password, role, isAdmin } = req.body;

    // Validation
    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Determine admin status
    // Auto-set admin for specific emails
    const adminEmails = ['admin@ecosphere.com', 'admin@ecosphereplatform.com'];
    const shouldBeAdmin = adminEmails.includes(email.toLowerCase()) || isAdmin === true || role === 'admin';
    const userRole = role || (shouldBeAdmin ? 'admin' : 'user');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await createUser(name, username, email, hashedPassword, userRole, shouldBeAdmin);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: userRole,
        isAdmin: shouldBeAdmin
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // Determine admin status
    const adminEmails = ['admin@ecosphere.com', 'admin@ecosphereplatform.com'];
    const isUserAdmin = user.isAdmin === true || user.isAdmin === 1 ||
      user.role === 'admin' ||
      (user.email && adminEmails.includes(user.email.toLowerCase()));

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        isAdmin: isUserAdmin,
        profilePicture: user.profilePicture || null
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get user
    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        message: 'If the email exists, password reset instructions have been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Save token to database
    await createPasswordResetToken(user.id, email, resetToken);

    // Send password reset email via Gmail
    try {
      await sendPasswordResetEmail(email, resetToken);
      res.json({
        message: 'Password reset instructions have been sent to your email'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Still return success for security (don't reveal if email exists)
      // But log the error for debugging
      res.json({
        message: 'If the email exists, password reset instructions have been sent'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({ error: 'Token, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Verify token
    const resetToken = await getPasswordResetToken(token);
    if (!resetToken || resetToken.email !== email) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Get user
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await updateUserPassword(user.id, hashedPassword);

    // Mark token as used
    await markTokenAsUsed(token);

    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint
app.get('/api/auth/verify-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const resetToken = await getPasswordResetToken(token);
    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired token', valid: false });
    }

    res.json({
      valid: true,
      email: resetToken.email
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify JWT token (for protected routes)
app.get('/api/auth/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_TOKEN_SECRET);
    const user = await getUserById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine admin status
    const adminEmails = ['admin@ecosphere.com', 'admin@ecosphereplatform.com'];
    const isUserAdmin = user.isAdmin === true || user.isAdmin === 1 ||
      user.role === 'admin' ||
      (user.email && adminEmails.includes(user.email.toLowerCase()));

    res.json({
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        isAdmin: isUserAdmin,
        profilePicture: user.profilePicture || null
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update profile endpoint
app.put('/api/auth/update-profile', authenticateToken, async (req, res) => {
  try {
    const { name, username, email } = req.body;
    const userId = req.user.id;

    // Validation
    if (!name || !username || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if username/email already exists for another user
    const existingEmailUser = await getUserByEmail(email);
    if (existingEmailUser && existingEmailUser.id !== userId) {
      return res.status(400).json({ error: 'Email already exists for another user' });
    }
    const existingUsernameUser = await getUserByUsername(username);
    if (existingUsernameUser && existingUsernameUser.id !== userId) {
      return res.status(400).json({ error: 'Username already exists for another user' });
    }

    await updateUserProfile(userId, name, username, email);
    const updatedUser = await getUserById(userId);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role || 'user',
        isAdmin: updatedUser.isAdmin,
        profilePicture: updatedUser.profilePicture || null
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password endpoint (for users)
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get full user with password
    const fullUser = await dbGet('SELECT * FROM users WHERE id = ?', [userId]);
    const isValidPassword = await bcrypt.compare(currentPassword, fullUser.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(userId, hashedPassword);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Change user password (no current password required)
app.post('/api/auth/admin/change-user-password', authenticateToken, async (req, res) => {
  try {
    const { userId: targetUserId, newPassword } = req.body;
    const adminId = req.user.id;

    // Check if admin
    const admin = await getUserById(adminId);
    const adminEmails = ['admin@ecosphere.com', 'admin@ecosphereplatform.com'];
    const isAdmin = admin.isAdmin === true || admin.isAdmin === 1 ||
      admin.role === 'admin' ||
      (admin.email && adminEmails.includes(admin.email.toLowerCase()));

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!targetUserId || !newPassword) {
      return res.status(400).json({ error: 'User ID and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(targetUserId, hashedPassword);

    res.json({ message: 'User password changed successfully' });
  } catch (error) {
    console.error('Admin change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Update user profile
app.put('/api/auth/admin/update-user', authenticateToken, async (req, res) => {
  try {
    const { userId: targetUserId, name, username, email, role, isAdmin } = req.body;
    const adminId = req.user.id;

    // Check if admin
    const admin = await getUserById(adminId);
    const adminEmails = ['admin@ecosphere.com', 'admin@ecosphereplatform.com'];
    const isAdminUser = admin.isAdmin === true || admin.isAdmin === 1 ||
      admin.role === 'admin' ||
      (admin.email && adminEmails.includes(admin.email.toLowerCase()));

    if (!isAdminUser) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!targetUserId || !name || !username || !email) {
      return res.status(400).json({ error: 'User ID, name, username, and email are required' });
    }

    // Check if username/email already exists for another user
    const existingEmailUser = await getUserByEmail(email);
    if (existingEmailUser && existingEmailUser.id !== targetUserId) {
      return res.status(400).json({ error: 'Email already exists for another user' });
    }
    const existingUsernameUser = await getUserByUsername(username);
    if (existingUsernameUser && existingUsernameUser.id !== targetUserId) {
      return res.status(400).json({ error: 'Username already exists for another user' });
    }

    await updateUserProfile(targetUserId, name, username, email);
    if (role !== undefined || isAdmin !== undefined) {
      await updateUserRole(targetUserId, role || 'user', isAdmin || false);
    }

    const updatedUser = await getUserById(targetUserId);

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role || 'user',
        isAdmin: updatedUser.isAdmin,
        profilePicture: updatedUser.profilePicture || null
      }
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all users
app.get('/api/auth/admin/users', authenticateToken, async (req, res) => {
  try {
    const adminId = req.user.id;

    // Check if admin
    const admin = await getUserById(adminId);
    const adminEmails = ['admin@ecosphere.com', 'admin@ecosphereplatform.com'];
    const isAdminUser = admin.isAdmin === true || admin.isAdmin === 1 ||
      admin.role === 'admin' ||
      (admin.email && adminEmails.includes(admin.email.toLowerCase()));

    if (!isAdminUser) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await getAllUsers();

    res.json({
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        isAdmin: user.isAdmin,
        profilePicture: user.profilePicture || null,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }))
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Delete user
app.delete('/api/auth/admin/delete-user', authenticateToken, async (req, res) => {
  try {
    const { userId: targetUserId } = req.body;
    const adminId = req.user.id;

    // Check if admin
    const admin = await getUserById(adminId);
    const adminEmails = ['admin@ecosphere.com', 'admin@ecosphereplatform.com'];
    const isAdminUser = admin.isAdmin === true || admin.isAdmin === 1 ||
      admin.role === 'admin' ||
      (admin.email && adminEmails.includes(admin.email.toLowerCase()));

    if (!isAdminUser) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Prevent admin from deleting themselves
    if (String(targetUserId) === String(adminId)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await deleteUser(targetUserId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch article content from URL (proxy endpoint)
app.get('/api/article/fetch', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    let articleUrl;
    try {
      articleUrl = new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Check if it's a YouTube URL
    const isYouTube = articleUrl.hostname.includes('youtube.com') ||
      articleUrl.hostname.includes('youtu.be');

    // Check if it's a PDF
    const isPDF = articleUrl.pathname.toLowerCase().endsWith('.pdf') ||
      url.toLowerCase().includes('.pdf');

    // Check if it's a Google Share link
    const isGoogleShare = articleUrl.hostname.includes('share.google');

    // For YouTube videos, return embed info
    if (isYouTube) {
      // Extract video ID
      let videoId = '';
      if (articleUrl.hostname.includes('youtu.be')) {
        videoId = articleUrl.pathname.substring(1);
      } else if (articleUrl.hostname.includes('youtube.com')) {
        videoId = articleUrl.searchParams.get('v') || articleUrl.pathname.split('/').pop();
      }

      // Remove query params from video ID
      videoId = videoId.split('?')[0].split('&')[0];

      return res.json({
        success: true,
        isVideo: true,
        videoId: videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        url: articleUrl.toString(),
        title: 'YouTube Video',
        content: 'This is a video content. The video player will be displayed below.',
      });
    }

    // For PDFs, return PDF viewer info
    if (isPDF) {
      return res.json({
        success: true,
        isPDF: true,
        pdfUrl: articleUrl.toString(),
        url: articleUrl.toString(),
        title: 'PDF Document',
        content: 'This is a PDF document. You can view it using the embedded PDF viewer below.',
      });
    }

    // For Google Share, try to fetch but handle carefully
    if (isGoogleShare) {
      return res.json({
        success: true,
        isGoogleShare: true,
        url: articleUrl.toString(),
        title: 'Google Shared Content',
        content: 'This is shared content from Google. Please view the content by accessing the original link.',
      });
    }

    // Fetch the article with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(articleUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.status(response.status).json({ error: `Failed to fetch article: ${response.statusText}` });
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Use cheerio to extract structured article content
      let articleContent = '';

      // Remove unwanted elements globally first
      const unwantedSelectors = [
        'script', 'style', 'nav', 'footer', 'header',
        '.ad', '.advertisement', '.ads', '.adsbygoogle',
        '.sidebar', '.side-nav', '.navigation',
        '.social-share', '.share', '.sharing', '.share-buttons',
        '.comments', '.comment-section', '.disqus',
        '.related-articles', '.related', '.recommended',
        '.newsletter', '.subscribe', '.signup',
        '.image-credit', '.caption', 'figcaption',
        '.breadcrumb', '.breadcrumbs',
        'button', '.button', 'a[href*="share"]',
        '.newsletter-signup', '.email-signup',
        '.cookie-consent', '.gdpr', '.privacy-notice'
      ];

      // Try article, main, or content selectors with site-specific ones first
      const contentSelectors = [
        // Site-specific selectors
        '.afd-article-body', // ArchDaily
        '.article-body-content', // General article body
        '[data-component="ArticleBody"]', // Component-based
        '.entry-content', '.post-content', // WordPress
        '.article-content', '.content-body', // Generic
        'article .afd-article-bodytext', // ArchDaily nested
        'article main', 'main article',
        'article', '[role="article"]',
        'main', '.main-content',
        '.content', '#content',
        '.article-body', '.story-body',
        '.post-body', '.entry-body',
        // FFTC specific - try multiple selectors
        '#article-content', '.article-detail', '.article-text',
        '.article-view', '.article-body-wrapper',
        // Repsol specific
        '.article-main-content', '.article-wrapper', '.main-article',
        // Arowana specific
        '.post-content', '.entry-content', '.article-post',
        // Inquirer specific
        '.article-content-wrapper', '.article-main', '.story-content'
      ];

      // Use cheerio to find and extract content with better structure preservation
      let bestContent = '';
      let bestLength = 0;

      for (const selector of contentSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          // Clone to avoid modifying original
          const clone = element.clone();

          // Remove all unwanted elements using cheerio
          unwantedSelectors.forEach(sel => {
            clone.find(sel).remove();
          });

          // Remove elements with social/share keywords in class/id using cheerio
          clone.find('[class*="share"], [class*="social"], [id*="share"], [id*="social"]').remove();
          clone.find('[class*="ad"], [id*="ad"], [class*="advert"]').remove();

          // Use cheerio to extract text while preserving structure
          let extractedContent = '';

          // Extract structured content: headings, paragraphs, lists
          clone.find('h1, h2, h3, h4, h5, h6').each((i, elem) => {
            const headingText = $(elem).text().trim();
            if (headingText) {
              extractedContent += '\n\n' + headingText + '\n\n';
            }
          });

          // Extract paragraphs
          clone.find('p').each((i, elem) => {
            const paraText = $(elem).text().trim();
            if (paraText && paraText.length > 20) {
              extractedContent += paraText + '\n\n';
            }
          });

          // Extract list items
          clone.find('li').each((i, elem) => {
            const liText = $(elem).text().trim();
            if (liText && liText.length > 10) {
              extractedContent += '• ' + liText + '\n';
            }
          });

          // If structured extraction didn't work well, fall back to text
          if (extractedContent.length < 500) {
            extractedContent = clone.text().trim();
          }

          // Keep the best content found
          if (extractedContent.length > bestLength) {
            bestContent = extractedContent;
            bestLength = extractedContent.length;
          }

          if (extractedContent.length > 1000) {
            articleContent = extractedContent;
            break;
          }
        }
      }

      // Use best content found
      if (bestContent && bestContent.length > 500) {
        articleContent = bestContent;
      }

      // If no content found, try to get body text using cheerio
      if (!articleContent || articleContent.length < 500) {
        const body = $('body').clone();

        // Remove all unwanted elements using cheerio
        unwantedSelectors.forEach(sel => {
          body.find(sel).remove();
        });

        // Remove elements with social/share keywords using cheerio
        body.find('[class*="share"], [class*="social"], [id*="share"], [id*="social"]').remove();
        body.find('[class*="ad"], [id*="ad"], [class*="advert"]').remove();

        // Remove header, nav, footer
        body.find('header, nav, footer').remove();

        // Extract main content areas
        const mainContent = body.find('main, article, .main, .content, #content').first();
        if (mainContent.length > 0) {
          articleContent = mainContent.text().trim();
        } else {
          articleContent = body.text().trim();
        }
      }

      // Extract title
      let title = $('meta[property="og:title"]').attr('content') ||
        $('title').text() ||
        $('h1').first().text() ||
        'Article';

      // Extract description
      const description = $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        '';

      // Use cheerio to extract author - try multiple methods
      let author = $('meta[property="article:author"]').attr('content') ||
        $('meta[name="author"]').attr('content') ||
        '';

      // Use cheerio to find author elements
      const authorSelectors = [
        '.author', '[class*="author"]', '.article-author',
        '.byline', '[rel="author"]', '.writer', '.contributor',
        // FFTC specific
        '.article-authors', '.author-name', '[itemprop="author"]'
      ];

      const authors = [];

      // Try meta tags first
      if (!author) {
        $('meta[property="article:author"], meta[name="author"]').each((i, elem) => {
          const metaAuthor = $(elem).attr('content');
          if (metaAuthor && metaAuthor.trim()) {
            authors.push(metaAuthor.trim());
          }
        });
      }

      // Extract authors from HTML elements using cheerio
      authorSelectors.forEach(selector => {
        $(selector).each((i, elem) => {
          const authorText = $(elem).text().trim();
          // Clean up author text - remove common prefixes
          const cleanAuthor = authorText
            .replace(/^(By|Author|Written by|By:)\s*/i, '')
            .replace(/\s+/g, ' ')
            .trim();

          if (cleanAuthor && cleanAuthor.length > 3 && !authors.includes(cleanAuthor)) {
            authors.push(cleanAuthor);
          }
        });
      });

      // If multiple authors found, combine them
      if (authors.length > 1) {
        author = authors.join(', ');
      } else if (authors.length === 1) {
        author = authors[0];
      } else if (!author) {
        author = '';
      }

      // Clean author text
      if (author) {
        author = author.trim().replace(/\s+/g, ' ');
      }

      // Use cheerio to extract publication date
      let pubDate = $('meta[property="article:published_time"]').attr('content') ||
        $('meta[name="date"]').attr('content') ||
        $('meta[property="article:published"]').attr('content') ||
        '';

      // Try time elements
      if (!pubDate) {
        $('time[datetime]').each((i, elem) => {
          const timeDate = $(elem).attr('datetime');
          if (timeDate) {
            pubDate = timeDate;
            return false; // break
          }
        });
      }

      // Try date classes
      if (!pubDate) {
        const dateSelectors = [
          '.published-date', '.article-date', '.post-date',
          '.date', '[class*="date"]', '.pub-date',
          // FFTC specific
          '.article-meta-date', '.publication-date'
        ];

        dateSelectors.forEach(selector => {
          const dateText = $(selector).first().text().trim();
          if (dateText && dateText.length > 5) {
            pubDate = dateText;
            return false; // break
          }
        });
      }

      // Clean up content - remove webpage chrome and unwanted text
      articleContent = articleContent
        // Remove social sharing patterns (but keep article content)
        .replace(/Share\s*(?:Share|Facebook|Twitter|Mail|Pinterest|Whatsapp|Or)?\s*/gi, '')
        .replace(/\b(Facebook|Twitter|Mail|Pinterest|Whatsapp|LinkedIn|Reddit|Share)\b/gi, '')
        // Remove image credit patterns
        .replace(/Save this picture!/gi, '')
        .replace(/Created by\s*@[\w]+/gi, '')
        .replace(/source imagery:\s*@[\w]+/gi, '')
        // Remove clipboard/copy text
        .replace(/Clipboard\s*["']COPY["']?\s*Copy/gi, '')
        .replace(/Copy\s*link|Copy URL/gi, '')
        // Remove breadcrumb patterns
        .replace(/Home\s*>\s*[\w\s>]+/gi, '')
        // Normalize whitespace but preserve paragraph breaks
        .replace(/[ \t]+/g, ' ') // Multiple spaces to single space
        .replace(/\n{3,}/g, '\n\n') // Multiple newlines to double newline
        // Remove leading/trailing special characters from lines
        .replace(/^[\s•\-\*]+\s*/gm, '')
        .replace(/\s*[\s•\-\*]+$/gm, '')
        // Remove completely empty lines
        .replace(/^\s*$/gm, '')
        // Final cleanup
        .trim();

      res.json({
        success: true,
        title,
        content: articleContent,
        description,
        author,
        publicationDate: pubDate,
        url: articleUrl.toString(),
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return res.status(408).json({ error: 'Request timeout' });
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Fetch article error:', error);
    res.status(500).json({ error: 'Failed to fetch article content' });
  }
});

// Test endpoint to verify proxy route is accessible
app.get('/api/proxy/test', (req, res) => {
  res.json({ message: 'Proxy endpoint is working!' });
});

// Proxy server endpoint - serves HTML content from external URLs
app.get('/api/proxy', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    let targetUrl;
    try {
      targetUrl = new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Check if URL is a PDF by extension
    const urlLower = url.toLowerCase();
    const isPDFByExtension = urlLower.endsWith('.pdf') || urlLower.includes('.pdf?');

    // Fetch the content
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      // Try different headers for better compatibility
      let response = await fetch(targetUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': targetUrl.origin,
          'Origin': targetUrl.origin,
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      // If 403 Forbidden, try with different headers
      if (response.status === 403) {
        // Try again with simpler headers
        response = await fetch(targetUrl.toString(), {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: controller.signal,
          redirect: 'follow',
        });
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Return a user-friendly error page instead of JSON
        const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Content Unavailable</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      height: 100vh; 
      margin: 0; 
      background: #f5f5f5;
      text-align: center;
      padding: 20px;
    }
    .error-container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 500px;
    }
    h1 { color: #dc2626; margin-bottom: 16px; }
    p { color: #6b7280; margin-bottom: 24px; line-height: 1.6; }
    a { 
      color: #059669; 
      text-decoration: none; 
      font-weight: 600;
      border-bottom: 2px solid #059669;
    }
    a:hover { color: #047857; }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>Content Unavailable</h1>
    <p>We're unable to load this content. The website may be blocking our access or the content may have been removed.</p>
    <p><strong>Error:</strong> ${response.status} ${response.statusText}</p>
    <p><a href="${url}" target="_blank">Open in new tab</a> to view the content directly.</p>
  </div>
</body>
</html>`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).send(errorHtml);
      }

      // Get content type
      const contentType = response.headers.get('content-type') || '';
      const isPDF = isPDFByExtension || contentType.includes('application/pdf');

      // Handle PDF files
      if (isPDF) {
        const pdfHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDF Viewer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      background: #525252;
      overflow: hidden;
    }
    iframe {
      width: 100vw;
      height: 100vh;
      border: none;
    }
  </style>
</head>
<body>
  <iframe src="${url}" type="application/pdf"></iframe>
</body>
</html>`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.send(pdfHtml);
      }

      // Handle non-HTML content types
      if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/xhtml')) {
        const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Unsupported Content Type</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      height: 100vh; 
      margin: 0; 
      background: #f5f5f5;
      text-align: center;
      padding: 20px;
    }
    .error-container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 500px;
    }
    h1 { color: #dc2626; margin-bottom: 16px; }
    p { color: #6b7280; margin-bottom: 24px; line-height: 1.6; }
    a { 
      color: #059669; 
      text-decoration: none; 
      font-weight: 600;
      border-bottom: 2px solid #059669;
    }
    a:hover { color: #047857; }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>Unsupported Content Type</h1>
    <p>This content type cannot be displayed in our viewer: <strong>${contentType}</strong></p>
    <p><a href="${url}" target="_blank">Open in new tab</a> to view the content directly.</p>
  </div>
</body>
</html>`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.send(errorHtml);
      }

      const html = await response.text();

      // Check if response is actually HTML (not JSON error)
      if (html.trim().startsWith('{') || html.trim().startsWith('[')) {
        // Likely JSON error response
        try {
          const jsonData = JSON.parse(html);
          if (jsonData.error) {
            const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Content Error</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      height: 100vh; 
      margin: 0; 
      background: #f5f5f5;
      text-align: center;
      padding: 20px;
    }
    .error-container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 500px;
    }
    h1 { color: #dc2626; margin-bottom: 16px; }
    p { color: #6b7280; margin-bottom: 24px; line-height: 1.6; }
    a { 
      color: #059669; 
      text-decoration: none; 
      font-weight: 600;
      border-bottom: 2px solid #059669;
    }
    a:hover { color: #047857; }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>Content Error</h1>
    <p>${jsonData.error || 'Unable to load content'}</p>
    <p><a href="${url}" target="_blank">Open in new tab</a> to view the content directly.</p>
  </div>
</body>
</html>`;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.send(errorHtml);
          }
        } catch (e) {
          // Not JSON, continue processing as HTML
        }
      }

      // Modify HTML to fix relative URLs and remove X-Frame-Options
      const $ = cheerio.load(html);

      // Remove X-Frame-Options meta tags and headers that block embedding
      $('meta[http-equiv="X-Frame-Options"]').remove();
      $('meta[http-equiv="x-frame-options"]').remove();
      $('meta[http-equiv="Content-Security-Policy"]').each((i, elem) => {
        const content = $(elem).attr('content') || '';
        if (content.includes('frame-ancestors')) {
          $(elem).remove();
        }
      });

      // Convert relative URLs to absolute URLs
      const baseUrl = `${targetUrl.protocol}//${targetUrl.host}`;

      $('a[href]').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('#')) {
          try {
            const absoluteUrl = new URL(href, baseUrl).toString();
            $(elem).attr('href', absoluteUrl);
          } catch (e) {
            // Keep original if URL construction fails
          }
        }
      });

      $('img[src]').each((i, elem) => {
        const src = $(elem).attr('src');
        if (src && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
          try {
            const absoluteUrl = new URL(src, baseUrl).toString();
            $(elem).attr('src', absoluteUrl);
          } catch (e) {
            // Keep original if URL construction fails
          }
        }
      });

      $('link[href]').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href && !href.startsWith('http') && !href.startsWith('//')) {
          try {
            const absoluteUrl = new URL(href, baseUrl).toString();
            $(elem).attr('href', absoluteUrl);
          } catch (e) {
            // Keep original if URL construction fails
          }
        }
      });

      $('script[src]').each((i, elem) => {
        const src = $(elem).attr('src');
        if (src && !src.startsWith('http') && !src.startsWith('//')) {
          try {
            const absoluteUrl = new URL(src, baseUrl).toString();
            $(elem).attr('src', absoluteUrl);
          } catch (e) {
            // Keep original if URL construction fails
          }
        }
      });

      // Remove any CSP meta tags that might block embedding
      $('meta').each((i, elem) => {
        const httpEquiv = $(elem).attr('http-equiv');
        if (httpEquiv && httpEquiv.toLowerCase().includes('frame')) {
          $(elem).remove();
        }
      });

      const modifiedHtml = $.html();

      // Set headers to allow iframe embedding
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');

      res.send(modifiedHtml);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        const timeoutHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Request Timeout</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      height: 100vh; 
      margin: 0; 
      background: #f5f5f5;
      text-align: center;
      padding: 20px;
    }
    .error-container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 500px;
    }
    h1 { color: #dc2626; margin-bottom: 16px; }
    p { color: #6b7280; margin-bottom: 24px; line-height: 1.6; }
    a { 
      color: #059669; 
      text-decoration: none; 
      font-weight: 600;
      border-bottom: 2px solid #059669;
    }
    a:hover { color: #047857; }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>Request Timeout</h1>
    <p>The content is taking too long to load. Please try again later.</p>
    <p><a href="${url}" target="_blank">Open in new tab</a> to view the content directly.</p>
  </div>
</body>
</html>`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).send(timeoutHtml);
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Proxy error:', error);
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Proxy Error</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      height: 100vh; 
      margin: 0; 
      background: #f5f5f5;
      text-align: center;
      padding: 20px;
    }
    .error-container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 500px;
    }
    h1 { color: #dc2626; margin-bottom: 16px; }
    p { color: #6b7280; margin-bottom: 24px; line-height: 1.6; }
    a { 
      color: #059669; 
      text-decoration: none; 
      font-weight: 600;
      border-bottom: 2px solid #059669;
    }
    a:hover { color: #047857; }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>Failed to Load Content</h1>
    <p>We encountered an error while trying to load this content. Please try again later.</p>
    ${req.query.url ? `<p><a href="${req.query.url}" target="_blank">Open in new tab</a> to view the content directly.</p>` : ''}
  </div>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(errorHtml);
  }
});

// Redeem Points Endpoint - Send email to admin
app.post('/api/redeem-points', async (req, res) => {
  try {
    const {
      userId,
      userName,
      userEmail,
      fullName,
      contactNumber,
      pointsToRedeem,
      redemptionMethod,
      accountDetails,
      gcashName,
      bankName,
      bankAccountName,
      currentPoints
    } = req.body;

    // Validation
    if (!userId || !fullName || !contactNumber || !pointsToRedeem || !redemptionMethod) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    // Method-specific validation
    if (redemptionMethod === 'gcash' && (!gcashName || !accountDetails)) {
      return res.status(400).json({ error: 'GCash name and number are required' });
    }
    if (redemptionMethod === 'bank' && (!bankName || !bankAccountName || !accountDetails)) {
      return res.status(400).json({ error: 'Bank details are required' });
    }
    if (redemptionMethod === 'cash' && !accountDetails) {
      return res.status(400).json({ error: 'Pickup location is required' });
    }

    if (pointsToRedeem < 100) {
      return res.status(400).json({ error: 'Minimum redemption is 100 points' });
    }

    // Send email to admin
    const transporter = createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const adminEmail = 'canicolebarria@gmail.com';
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: adminEmail,
      subject: `EcoSphere - Points Redemption Request from ${userName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">EcoSphere Points Redemption</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <h2 style="color: #111827; margin-top: 0;">New Redemption Request</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #059669; margin-top: 0;">User Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">User ID:</td>
                  <td style="padding: 8px 0;">${userId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Username:</td>
                  <td style="padding: 8px 0;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Email:</td>
                  <td style="padding: 8px 0;">${userEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Full Name:</td>
                  <td style="padding: 8px 0;">${fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Contact Number:</td>
                  <td style="padding: 8px 0;">${contactNumber}</td>
                </tr>
              </table>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #059669; margin-top: 0;">Redemption Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Points to Redeem:</td>
                  <td style="padding: 8px 0; font-size: 18px; color: #059669; font-weight: bold;">${pointsToRedeem} pts (₱${pointsToRedeem})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Current Balance:</td>
                  <td style="padding: 8px 0;">${currentPoints} pts</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Redemption Method:</td>
                  <td style="padding: 8px 0; text-transform: capitalize;">${redemptionMethod}</td>
                </tr>
                ${redemptionMethod === 'gcash' ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">GCash Account Name:</td>
                  <td style="padding: 8px 0;">${gcashName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">GCash Number:</td>
                  <td style="padding: 8px 0;">${accountDetails}</td>
                </tr>
                ` : ''}
                ${redemptionMethod === 'bank' ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Bank Name:</td>
                  <td style="padding: 8px 0;">${bankName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Account Name:</td>
                  <td style="padding: 8px 0;">${bankAccountName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Account Number:</td>
                  <td style="padding: 8px 0;">${accountDetails}</td>
                </tr>
                ` : ''}
                ${redemptionMethod === 'cash' ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold; vertical-align: top;">Pickup Location:</td>
                  <td style="padding: 8px 0;">${accountDetails}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
              <p style="margin: 0; color: #065f46;">
                <strong>Next Steps:</strong> Please review this request and contact the user at ${contactNumber} to process the redemption.
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} EcoSphere. Redemption request received on ${new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        EcoSphere Points Redemption Request
        
        User Information:
        - User ID: ${userId}
        - Username: ${userName}
        - Email: ${userEmail}
        - Full Name: ${fullName}
        - Contact Number: ${contactNumber}
        
        Redemption Details:
        - Points to Redeem: ${pointsToRedeem} pts (₱${pointsToRedeem})
        - Current Balance: ${currentPoints} pts
        - Redemption Method: ${redemptionMethod}
        ${redemptionMethod === 'gcash' ? `- GCash Account Name: ${gcashName}\n        - GCash Number: ${accountDetails}` : ''}
        ${redemptionMethod === 'bank' ? `- Bank Name: ${bankName}\n        - Account Name: ${bankAccountName}\n        - Account Number: ${accountDetails}` : ''}
        ${redemptionMethod === 'cash' ? `- Pickup Location: ${accountDetails}` : ''}
        
        Next Steps: Please review this request and contact the user at ${contactNumber} to process the redemption.
        
        Request received on ${new Date().toLocaleString()}
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Redemption request submitted successfully. Admin will contact you soon.'
    });

  } catch (error) {
    console.error('Redemption email error:', error);
    res.status(500).json({ error: 'Failed to send redemption request' });
  }
});

// Start server
// --- POSTS, COMMENTS, LIKES, SUPPORT API ---
import {
  createPost, getPostById, getAllPosts,
  addComment, getCommentsByPost,
  addLike, removeLike, getLikesByPost,
  addSupport, removeSupport, getSupportByPost
} from './database.js';

// Create a new post
app.post('/api/posts', authenticateToken, async (req, res) => {
  console.log('DEBUG POST /api/posts', { body: req.body, user: req.user });
  try {
    const { content } = req.body;
    const userId = req.user.id;
    if (!content) return res.status(400).json({ error: 'Content required' });
    const post = await createPost(userId, content);
    res.status(201).json(post);
  } catch (err) {
    console.error('Error in POST /api/posts:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await getAllPosts();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a comment to a post
app.post('/api/posts/:postId/comments', authenticateToken, async (req, res) => {
  console.log(`DEBUG POST /api/posts/${req.params.postId}/comments`, { body: req.body, user: req.user });
  try {
    const { comment } = req.body;
    const userId = req.user.id;
    const { postId } = req.params;
    if (!comment) return res.status(400).json({ error: 'Comment required' });
    const newComment = await addComment(postId, userId, comment);
    res.status(201).json(newComment);
  } catch (err) {
    console.error(`Error in POST /api/posts/${req.params.postId}/comments:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Get all comments for a post
app.get('/api/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await getCommentsByPost(postId);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like a post
app.post('/api/posts/:postId/like', authenticateToken, async (req, res) => {
  console.log(`DEBUG POST /api/posts/${req.params.postId}/like`, { user: req.user });
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    await addLike(postId, userId);
    res.json({ success: true });
  } catch (err) {
    console.error(`Error in POST /api/posts/${req.params.postId}/like:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Remove like from a post
app.delete('/api/posts/:postId/like', authenticateToken, async (req, res) => {
  console.log(`DEBUG DELETE /api/posts/${req.params.postId}/like`, { user: req.user });
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    await removeLike(postId, userId);
    res.json({ success: true });
  } catch (err) {
    console.error(`Error in DELETE /api/posts/${req.params.postId}/like:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Get all likes for a post
app.get('/api/posts/:postId/likes', async (req, res) => {
  try {
    const { postId } = req.params;
    const likes = await getLikesByPost(postId);
    res.json(likes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Support a post
app.post('/api/posts/:postId/support', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    await addSupport(postId, userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove support from a post
app.delete('/api/posts/:postId/support', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    await removeSupport(postId, userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all support for a post
app.get('/api/posts/:postId/support', async (req, res) => {
  try {
    const { postId } = req.params;
    const support = await getSupportByPost(postId);
    res.json(support);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on http://72.61.125.98:${PORT}`);
  console.log(`Database: SQLite (ecoplatform.db)`);
  console.log(`Proxy endpoint: http://72.61.125.98:${PORT}/api/proxy?url=<target-url>`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});
