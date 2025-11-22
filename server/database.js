import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create/connect to database
const db = new sqlite3.Database(path.join(__dirname, 'ecoplatform.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    createTables();
  }
});

// Promisify database methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Create tables
function createTables() {
  // Posts/Ideas table (basic, can be extended)
  db.run(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, (err) => {
    if (err) {
      console.error('Error creating posts table:', err.message);
    } else {
      console.log('Posts table ready');
    }
  });

  // Comments table
  db.run(`CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, (err) => {
    if (err) {
      console.error('Error creating comments table:', err.message);
    } else {
      console.log('Comments table ready');
    }
  });

  // Likes table
  db.run(`CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, (err) => {
    if (err) {
      console.error('Error creating likes table:', err.message);
    } else {
      console.log('Likes table ready');
    }
  });

  // Support table (if support is a separate action, similar to like)
  db.run(`CREATE TABLE IF NOT EXISTS support (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, (err) => {
    if (err) {
      console.error('Error creating support table:', err.message);
    } else {
      console.log('Support table ready');
    }
  });
  // ...existing code...
}

// --- Post Functions ---
export async function createPost(userId, content) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO posts (user_id, content) VALUES (?, ?)`,
      [userId, content],
      function (err) {
        if (err) reject(new Error(err.message));
        else resolve({ id: this.lastID, user_id: userId, content });
      }
    );
  });
}

export async function getPostById(postId) {
  return dbGet('SELECT * FROM posts WHERE id = ?', [postId]);
}

export async function getAllPosts() {
  return dbAll('SELECT * FROM posts ORDER BY created_at DESC');
}

// --- Comment Functions ---
export async function addComment(postId, userId, comment) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)`,
      [postId, userId, comment],
      function (err) {
        if (err) reject(new Error(err.message));
        else resolve({ id: this.lastID, post_id: postId, user_id: userId, comment });
      }
    );
  });
}

export async function getCommentsByPost(postId) {
  return dbAll('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC', [postId]);
}

// --- Like Functions ---
export async function addLike(postId, userId) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO likes (post_id, user_id) VALUES (?, ?)`,
      [postId, userId],
      function (err) {
        if (err) reject(new Error(err.message));
        else resolve(true);
      }
    );
  });
}

export async function removeLike(postId, userId) {
  return dbRun('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
}

export async function getLikesByPost(postId) {
  return dbAll('SELECT * FROM likes WHERE post_id = ?', [postId]);
}

// --- Support Functions ---
export async function addSupport(postId, userId) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO support (post_id, user_id) VALUES (?, ?)`,
      [postId, userId],
      function (err) {
        if (err) reject(new Error(err.message));
        else resolve(true);
      }
    );
  });
}

export async function removeSupport(postId, userId) {
  return dbRun('DELETE FROM support WHERE post_id = ? AND user_id = ?', [postId, userId]);
}

export async function getSupportByPost(postId) {
  return dbAll('SELECT * FROM support WHERE post_id = ?', [postId]);
}
// Users table
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    isAdmin INTEGER DEFAULT 0,
    profilePicture TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
  if (err) {
    console.error('Error creating users table:', err.message);
  } else {
    console.log('Users table ready');
    // Add columns if they don't exist (for existing databases)
    migrateUsersTable();
  }
});

// Password reset tokens table
db.run(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`, (err) => {
  if (err) {
    console.error('Error creating password_reset_tokens table:', err.message);
  } else {
    console.log('Password reset tokens table ready');
  }
});

// Clean up expired tokens periodically (every hour)
setInterval(() => {
  db.run(`DELETE FROM password_reset_tokens WHERE expires_at < datetime('now') OR used = 1`, (err) => {
    if (err) {
      console.error('Error cleaning up expired tokens:', err.message);
    }
  });
}, 3600000); // 1 hour

// Migration function to add new columns to existing users table
function migrateUsersTable() {
  db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding role column:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN isAdmin INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding isAdmin column:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN profilePicture TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding profilePicture column:', err.message);
    }
  });
}

// User functions
export async function createUser(name, username, email, hashedPassword, role = 'user', isAdmin = false) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users (name, username, email, password, role, isAdmin) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, username, email, hashedPassword, role, isAdmin ? 1 : 0],
      function (err) {
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve({ id: this.lastID, name, username, email, role, isAdmin: isAdmin ? 1 : 0 });
        }
      }
    );
  });
}

export async function getUserByEmail(email) {
  try {
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (user) {
      // Convert isAdmin from integer to boolean
      user.isAdmin = user.isAdmin === 1;
    }
    return user;
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function getUserByUsername(username) {
  try {
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
    if (user) {
      // Convert isAdmin from integer to boolean
      user.isAdmin = user.isAdmin === 1;
    }
    return user;
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function getUserById(id) {
  try {
    const user = await dbGet('SELECT id, name, username, email, role, isAdmin, profilePicture, created_at FROM users WHERE id = ?', [id]);
    if (user) {
      // Convert isAdmin from integer to boolean
      user.isAdmin = user.isAdmin === 1;
    }
    return user;
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function updateUserPassword(userId, hashedPassword) {
  try {
    await dbRun(
      `UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [hashedPassword, userId]
    );
    return true;
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function updateUserProfile(userId, name, username, email) {
  try {
    await dbRun(
      `UPDATE users SET name = ?, username = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, username, email, userId]
    );
    return true;
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function updateUserRole(userId, role, isAdmin) {
  try {
    await dbRun(
      `UPDATE users SET role = ?, isAdmin = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [role, isAdmin ? 1 : 0, userId]
    );
    return true;
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function updateUserProfilePicture(userId, profilePicturePath) {
  try {
    await dbRun(
      `UPDATE users SET profilePicture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [profilePicturePath, userId]
    );
    return true;
  } catch (err) {
    throw new Error(err.message);
  }
}

// Password reset token functions
export async function createPasswordResetToken(userId, email, token) {
  try {
    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 3600000).toISOString();

    // Delete any existing tokens for this user
    await dbRun(`DELETE FROM password_reset_tokens WHERE user_id = ?`, [userId]);

    // Create new token
    await dbRun(
      `INSERT INTO password_reset_tokens (user_id, email, token, expires_at) VALUES (?, ?, ?, ?)`,
      [userId, email, token, expiresAt]
    );
    return true;
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function getPasswordResetToken(token) {
  try {
    return await dbGet(
      `SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > datetime('now') AND used = 0`,
      [token]
    );
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function markTokenAsUsed(token) {
  try {
    await dbRun(`UPDATE password_reset_tokens SET used = 1 WHERE token = ?`, [token]);
    return true;
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function getAllUsers() {
  try {
    return await dbAll(`SELECT id, name, username, email, role, isAdmin, profilePicture, created_at, updated_at FROM users ORDER BY created_at DESC`);
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function deleteUser(userId) {
  try {
    // Delete password reset tokens first (foreign key constraint)
    await dbRun(`DELETE FROM password_reset_tokens WHERE user_id = ?`, [userId]);
    // Delete user
    await dbRun(`DELETE FROM users WHERE id = ?`, [userId]);
    return true;
  } catch (err) {
    throw new Error(err.message);
  }
}

export { db, dbGet };
