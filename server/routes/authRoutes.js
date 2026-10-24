const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// SHA-256 password hash generator with salt
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt || 'cpanel_salt_secure_2026', 1000, 64, 'sha512').toString('hex');
}

module.exports = (pool) => {
  // Login with dual compatibility (supports plain & hashed)
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
      }

      const cleanUser = username.trim();
      const cleanPass = password.trim();
      const hashedPass = hashPassword(cleanPass);

      const [rows] = await pool.query(
        'SELECT id, username, password, role, allocated_domain, disk_quota_mb, status FROM panel_users WHERE username = ?',
        [cleanUser]
      );

      if (rows.length === 0) {
        return res.status(401).json({ success: false, error: 'Invalid username or password' });
      }

      const user = rows[0];
      const match = (user.password === cleanPass || user.password === hashedPass);
      if (!match) {
        return res.status(401).json({ success: false, error: 'Invalid username or password' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ success: false, error: 'Account is deactivated' });
      }

      // Upgrade plain password to hash automatically on successful login
      if (user.password === cleanPass) {
        try {
          await pool.query('UPDATE panel_users SET password = ? WHERE id = ?', [hashedPass, user.id]);
        } catch (e) {}
      }

      // Generate secure session token
      const sessionToken = crypto.randomBytes(32).toString('hex');

      // Log login
      await pool.query(
        'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
        ['AUTH', `User logged in: ${user.username}`, `Role: ${user.role}`]
      );

      const { password: _, ...safeUser } = user;
      res.json({
        success: true,
        message: 'Login successful',
        user: safeUser,
        token: sessionToken
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // List all users
  router.get('/users', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT id, username, role, allocated_domain, disk_quota_mb, status, created_at FROM panel_users ORDER BY created_at DESC');
      res.json({ success: true, users: rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create new panel user
  router.post('/users', async (req, res) => {
    try {
      const { username, password, role = 'user', allocated_domain, disk_quota_mb = 500 } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password required' });
      }

      const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

      const [existing] = await pool.query('SELECT id FROM panel_users WHERE username = ?', [cleanUser]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, error: `User '${cleanUser}' already exists` });
      }

      const hashedPassword = hashPassword(password.trim());
      const [result] = await pool.query(
        'INSERT INTO panel_users (username, password, role, allocated_domain, disk_quota_mb, status) VALUES (?, ?, ?, ?, ?, "active")',
        [cleanUser, hashedPassword, role, allocated_domain || null, disk_quota_mb]
      );

      await pool.query(
        'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
        ['AUTH', `Created Panel User: ${cleanUser}`, `Role: ${role}, Domain: ${allocated_domain || 'All'}`]
      );

      res.json({
        success: true,
        message: `User '${cleanUser}' created successfully!`,
        id: result.insertId
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete user
  router.delete('/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const [user] = await pool.query('SELECT username, role FROM panel_users WHERE id = ?', [id]);
      if (user.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

      if (user[0].username === 'admin') {
        return res.status(403).json({ success: false, error: 'Cannot delete default admin account!' });
      }

      await pool.query('DELETE FROM panel_users WHERE id = ?', [id]);

      await pool.query(
        'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
        ['AUTH', `Deleted User: ${user[0].username}`, `ID: ${id}`]
      );

      res.json({ success: true, message: `User '${user[0].username}' deleted.` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Change password for a user
  router.post('/change-password', async (req, res) => {
    try {
      const { username, current_password, new_password } = req.body;
      if (!username || !new_password) {
        return res.status(400).json({ success: false, error: 'Username and new password are required' });
      }

      if (new_password.length < 5) {
        return res.status(400).json({ success: false, error: 'New password must be at least 5 characters long' });
      }

      const [user] = await pool.query('SELECT id, username, password FROM panel_users WHERE username = ?', [username.trim()]);
      if (user.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const isCurrentCorrect = (user[0].password === current_password.trim() || user[0].password === hashPassword(current_password.trim()));
      if (current_password && !isCurrentCorrect) {
        return res.status(401).json({ success: false, error: 'Current password is incorrect' });
      }

      const hashedNew = hashPassword(new_password.trim());
      await pool.query('UPDATE panel_users SET password = ? WHERE id = ?', [hashedNew, user[0].id]);

      await pool.query(
        'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
        ['AUTH', `Password changed for user: ${user[0].username}`, `User ID: ${user[0].id}`]
      );

      res.json({ success: true, message: 'Password updated successfully!' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};

