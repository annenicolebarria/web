import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, 'ecoplatform.db'));

// Admin account details
const adminEmail = 'admin@ecosphere.com';
const adminName = 'Admin User';
const adminUsername = 'admin';
const adminPassword = 'admin123'; // Default password - user should change this

async function setupAdmin() {
  try {
    console.log('Setting up admin account...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [adminEmail], async (err, existingUser) => {
      if (err) {
        console.error('Error checking existing user:', err);
        db.close();
        return;
      }
      
      if (existingUser) {
        // Update existing user to admin
        db.run(
          `UPDATE users SET 
            name = ?, 
            username = ?, 
            password = ?, 
            role = 'admin', 
            isAdmin = 1,
            updated_at = CURRENT_TIMESTAMP 
           WHERE email = ?`,
          [adminName, adminUsername, hashedPassword, adminEmail],
          function(updateErr) {
            if (updateErr) {
              console.error('Error updating user to admin:', updateErr);
            } else {
              console.log('✅ Admin account updated successfully!');
              console.log('Email:', adminEmail);
              console.log('Password:', adminPassword);
              console.log('\n⚠️  Please change the password after first login!');
            }
            db.close();
          }
        );
      } else {
        // Create new admin user
        db.run(
          `INSERT INTO users (name, username, email, password, role, isAdmin) 
           VALUES (?, ?, ?, ?, 'admin', 1)`,
          [adminName, adminUsername, adminEmail, hashedPassword],
          function(insertErr) {
            if (insertErr) {
              console.error('Error creating admin user:', insertErr);
            } else {
              console.log('✅ Admin account created successfully!');
              console.log('Email:', adminEmail);
              console.log('Password:', adminPassword);
              console.log('\n⚠️  Please change the password after first login!');
            }
            db.close();
          }
        );
      }
    });
    
    // Ensure columns exist
    db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN isAdmin INTEGER DEFAULT 0`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN profilePicture TEXT`, () => {});
    
  } catch (error) {
    console.error('Error setting up admin:', error);
    db.close();
  }
}

setupAdmin();

