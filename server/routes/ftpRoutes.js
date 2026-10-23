const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

module.exports = (pool) => {
  // List FTP Users
  router.get('/users', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT id, username, root_path, permission_level, status, created_at FROM ftp_users ORDER BY created_at DESC');
      res.json({ success: true, users: rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create FTP User
  router.post('/users', async (req, res) => {
    try {
      const { username, password, root_path, permission_level = 'read_write' } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
      }

      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const userDir = root_path ? path.resolve(root_path) : path.resolve(__dirname, `../../hosting_data/ftp/${cleanUsername}`);

      // Auto create user directory if not present
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      // Check existing
      const [existing] = await pool.query('SELECT id FROM ftp_users WHERE username = ?', [cleanUsername]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, error: `FTP User '${cleanUsername}' already exists.` });
      }

      await pool.query(
        'INSERT INTO ftp_users (username, password, root_path, permission_level, status) VALUES (?, ?, ?, ?, "active")',
        [cleanUsername, password, userDir, permission_level]
      );

      await pool.query(
        'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
        ['FTP', `Created FTP User: ${cleanUsername}`, `Root: ${userDir}, Perm: ${permission_level}`]
      );

      res.json({
        success: true,
        message: `FTP Account '${cleanUsername}' created successfully!`,
        user: { username: cleanUsername, root_path: userDir, permission_level }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update FTP User Permissions or Password
  router.put('/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { permission_level, password, root_path } = req.body;

      const updates = [];
      const values = [];

      if (permission_level) {
        updates.push('permission_level = ?');
        values.push(permission_level);
      }
      if (password) {
        updates.push('password = ?');
        values.push(password);
      }
      if (root_path) {
        updates.push('root_path = ?');
        values.push(path.resolve(root_path));
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, error: 'Nothing to update' });
      }

      values.push(id);
      await pool.query(`UPDATE ftp_users SET ${updates.join(', ')} WHERE id = ?`, values);

      await pool.query(
        'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
        ['FTP', `Updated FTP User ID: ${id}`, `Changes: ${updates.join(', ')}`]
      );

      res.json({ success: true, message: 'FTP account updated successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete FTP User
  router.delete('/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const [user] = await pool.query('SELECT username FROM ftp_users WHERE id = ?', [id]);
      const username = user[0]?.username || id;

      await pool.query('DELETE FROM ftp_users WHERE id = ?', [id]);

      await pool.query(
        'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
        ['FTP', `Deleted FTP User: ${username}`, `ID: ${id}`]
      );

      res.json({ success: true, message: `FTP account '${username}' deleted` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Recursive Permission Fixer (Standard 0755 for Folders, 0644 for Files)
  router.post('/fix-permissions', async (req, res) => {
    try {
      const { targetDir } = req.body;
      const dirPath = targetDir ? path.resolve(targetDir) : path.resolve(__dirname, '../../hosting_data');

      if (!fs.existsSync(dirPath)) {
        return res.status(404).json({ success: false, error: 'Directory does not exist' });
      }

      let foldersFixed = 0;
      let filesFixed = 0;

      function fixRecursive(current) {
        const items = fs.readdirSync(current);
        for (const item of items) {
          const itemPath = path.join(current, item);
          const stat = fs.statSync(itemPath);
          try {
            if (stat.isDirectory()) {
              fs.chmodSync(itemPath, 0o755);
              foldersFixed++;
              fixRecursive(itemPath);
            } else {
              fs.chmodSync(itemPath, 0o644);
              filesFixed++;
            }
          } catch (e) {
            // Non-fatal on windows
          }
        }
      }

      fixRecursive(dirPath);

      await pool.query(
        'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
        ['PERMISSIONS', 'Fixed Web Permissions (0755 / 0644)', `Target: ${dirPath}, Folders: ${foldersFixed}, Files: ${filesFixed}`]
      );

      res.json({
        success: true,
        message: `Permissions verified and repaired! Set 0755 for ${foldersFixed} directories and 0644 for ${filesFixed} files.`,
        stats: { foldersFixed, filesFixed }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};

