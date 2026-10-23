const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

module.exports = (pool) => {
  const hostingRoot = path.resolve(__dirname, '../../hosting_data/www');

  // List all domains
  router.get('/', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM domains ORDER BY created_at DESC');
      res.json({ success: true, domains: rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create / Allocate Domain
  router.post('/', async (req, res) => {
    try {
      let { domain_name, doc_root, proxy_type = 'static', proxy_port = null } = req.body;
      if (!domain_name) {
        return res.status(400).json({ success: false, error: 'Domain name is required' });
      }

      domain_name = domain_name.trim().toLowerCase();

      // Default doc root if not specified
      if (!doc_root) {
        doc_root = path.join(hostingRoot, domain_name);
      } else {
        doc_root = path.resolve(doc_root);
      }

      // Check if domain exists
      const [existing] = await pool.query('SELECT id FROM domains WHERE domain_name = ?', [domain_name]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, error: `Domain '${domain_name}' is already allocated.` });
      }

      // Automatically create the doc_root folder if it doesn't exist
      if (!fs.existsSync(doc_root)) {
        fs.mkdirSync(doc_root, { recursive: true });
        
        // Create a starter index.html
        const starterHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${domain_name}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #1e293b; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; border: 1px solid #334155; max-width: 500px; }
    h1 { color: #38bdf8; margin-top: 0; font-size: 1.8rem; }
    p { color: #94a3b8; line-height: 1.6; }
    .badge { display: inline-block; background: #0284c7; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; }
    .footer { margin-top: 1.5rem; font-size: 0.8rem; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Allocated via Node cPanel</span>
    <h1>Domain Active: ${domain_name}</h1>
    <p>Your web directory has been successfully provisioned. Upload your site files or link your Node.js application using the cPanel File Manager.</p>
    <div class="footer">Document Root: <code>${doc_root}</code></div>
  </div>
</body>
</html>`;
        fs.writeFileSync(path.join(doc_root, 'index.html'), starterHtml, 'utf8');
      }

      // Insert into MySQL
      const [result] = await pool.query(
        'INSERT INTO domains (domain_name, doc_root, proxy_type, proxy_port, ssl_enabled, status) VALUES (?, ?, ?, ?, 0, "active")',
        [domain_name, doc_root, proxy_type, proxy_port || null]
      );

      // Log activity
      await pool.query(
        'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
        ['DOMAINS', `Allocated domain ${domain_name}`, `DocRoot: ${doc_root}, Type: ${proxy_type}`]
      );

      res.json({
        success: true,
        message: `Domain ${domain_name} allocated successfully!`,
        domain: {
          id: result.insertId,
          domain_name,
          doc_root,
          proxy_type,
          proxy_port,
          status: 'active'
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Toggle SSL for Domain
  router.patch('/:id/ssl', async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query('SELECT * FROM domains WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ success: false, error: 'Domain not found' });

      const newSSL = rows[0].ssl_enabled ? 0 : 1;
      await pool.query('UPDATE domains SET ssl_enabled = ? WHERE id = ?', [newSSL, id]);

      await pool.query(
        'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
        ['DOMAINS', `SSL ${newSSL ? 'Enabled' : 'Disabled'} for ${rows[0].domain_name}`, `Domain ID: ${id}`]
      );

      res.json({ success: true, ssl_enabled: newSSL });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete Domain
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query('SELECT * FROM domains WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ success: false, error: 'Domain not found' });

      await pool.query('DELETE FROM domains WHERE id = ?', [id]);

      await pool.query(
        'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
        ['DOMAINS', `Removed domain ${rows[0].domain_name}`, `DocRoot preserved at: ${rows[0].doc_root}`]
      );

      res.json({ success: true, message: `Domain ${rows[0].domain_name} deleted.` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};

