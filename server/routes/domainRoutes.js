const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { exec, execSync } = require('child_process');

function syncNginxVHost(dom) {
  try {
    const domainName = dom.domain_name;
    const docRoot = path.resolve(dom.doc_root);
    const sslCert = `/etc/letsencrypt/live/${domainName}/fullchain.pem`;
    const sslKey = `/etc/letsencrypt/live/${domainName}/privkey.pem`;
    const hasSSL = fs.existsSync(sslCert) && fs.existsSync(sslKey);

    let config = '';
    if (dom.proxy_type === 'proxy' && dom.proxy_port) {
      config = `server {
    listen 80;
    server_name ${domainName} www.${domainName};
${hasSSL ? `    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domainName} www.${domainName};
    ssl_certificate ${sslCert};
    ssl_certificate_key ${sslKey};
` : ''}
    location / {
        proxy_pass http://127.0.0.1:${dom.proxy_port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;
    } else {
      config = `server {
    listen 80;
    server_name ${domainName} www.${domainName};
${hasSSL ? `    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domainName} www.${domainName};
    ssl_certificate ${sslCert};
    ssl_certificate_key ${sslKey};
    root ${docRoot};
    index index.html index.htm default.html;

    location / {
        try_files $uri $uri/ /index.html =404;
    }
` : `
    root ${docRoot};
    index index.html index.htm default.html;

    location / {
        try_files $uri $uri/ /index.html =404;
    }
`}
}
`;
    }

    // Write to sites-available / sites-enabled if directory exists
    const sitesAvail = '/etc/nginx/sites-available';
    const sitesEnabled = '/etc/nginx/sites-enabled';
    if (fs.existsSync(sitesAvail)) {
      fs.writeFileSync(path.join(sitesAvail, domainName), config, 'utf8');
      if (fs.existsSync(sitesEnabled)) {
        const symlink = path.join(sitesEnabled, domainName);
        if (!fs.existsSync(symlink)) {
          try { fs.symlinkSync(path.join(sitesAvail, domainName), symlink); } catch (e) {}
        }
      }
    } else if (fs.existsSync('/etc/nginx/conf.d')) {
      fs.writeFileSync(`/etc/nginx/conf.d/${domainName}.conf`, config, 'utf8');
    }

    // Reload Nginx safely
    try {
      execSync('nginx -t && (systemctl reload nginx || nginx -s reload 2>/dev/null)', { stdio: 'ignore' });
    } catch (e) {}

    // If certbot is available and domain doesn't have SSL yet, automatically request SSL
    if (!hasSSL) {
      exec(`which certbot && certbot --nginx -d ${domainName} -d www.${domainName} --non-interactive --agree-tos --register-unsafely-without-email --redirect`, (err) => {
        if (!err) {
          try { execSync('systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null', { stdio: 'ignore' }); } catch (e) {}
        }
      });
    }
  } catch (err) {
    console.warn(`[NginxSync] Notice for domain ${dom.domain_name}:`, err.message);
  }
}

function removeNginxVHost(domainName) {
  try {
    const sitesAvailFile = `/etc/nginx/sites-available/${domainName}`;
    const sitesEnabledFile = `/etc/nginx/sites-enabled/${domainName}`;
    const confFile = `/etc/nginx/conf.d/${domainName}.conf`;

    if (fs.existsSync(sitesEnabledFile)) fs.unlinkSync(sitesEnabledFile);
    if (fs.existsSync(sitesAvailFile)) fs.unlinkSync(sitesAvailFile);
    if (fs.existsSync(confFile)) fs.unlinkSync(confFile);

    try {
      execSync('nginx -t && (systemctl reload nginx || nginx -s reload 2>/dev/null)', { stdio: 'ignore' });
    } catch (e) {}
  } catch (err) {}
}

module.exports = (pool) => {
  const hostingRoot = path.resolve(__dirname, '../../hosting_data/www');

  // List all domains
  router.get('/', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM domains ORDER BY created_at DESC');

      // Auto-ensure domain.config.json and vhost config exist for every domain
      const vhostDir = path.resolve(__dirname, '../../hosting_data/vhosts');
      if (!fs.existsSync(vhostDir)) fs.mkdirSync(vhostDir, { recursive: true });

      for (const dom of rows) {
        try {
          if (!fs.existsSync(dom.doc_root)) {
            fs.mkdirSync(dom.doc_root, { recursive: true });
          }
          const vhostFile = path.join(vhostDir, `${dom.domain_name}.json`);
          const docConfigFile = path.join(dom.doc_root, 'domain.config.json');
          const domConfig = {
            domain_name: dom.domain_name,
            doc_root: dom.doc_root,
            proxy_type: dom.proxy_type || 'static',
            proxy_port: dom.proxy_port || null,
            created_at: dom.created_at,
            status: dom.status || 'active'
          };
          if (!fs.existsSync(vhostFile)) {
            fs.writeFileSync(vhostFile, JSON.stringify(domConfig, null, 2), 'utf8');
          }
          if (!fs.existsSync(docConfigFile)) {
            fs.writeFileSync(docConfigFile, JSON.stringify(domConfig, null, 2), 'utf8');
          }

          // Auto-sync domain with Nginx
          syncNginxVHost(dom);
        } catch (e) {}
      }

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
      }

      // Ensure domain.config.json is always created in doc_root and vhosts folder
      const vhostDir = path.resolve(__dirname, '../../hosting_data/vhosts');
      if (!fs.existsSync(vhostDir)) fs.mkdirSync(vhostDir, { recursive: true });

      const domainConfig = {
        domain_name,
        doc_root,
        proxy_type,
        proxy_port: proxy_port || null,
        created_at: new Date().toISOString(),
        status: 'active'
      };

      fs.writeFileSync(path.join(doc_root, 'domain.config.json'), JSON.stringify(domainConfig, null, 2), 'utf8');
      fs.writeFileSync(path.join(vhostDir, `${domain_name}.json`), JSON.stringify(domainConfig, null, 2), 'utf8');

      // Create a starter index.html if missing
      const indexPath = path.join(doc_root, 'index.html');
      if (!fs.existsSync(indexPath)) {
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
    <span class="badge">Allocated via Parakshtech cPanel</span>
    <h1>Domain Active: ${domain_name}</h1>
    <p>Your web directory has been successfully provisioned. Upload your site files or link your Node.js application using the cPanel File Manager.</p>
    <div class="footer">Document Root: <code>${doc_root}</code></div>
  </div>
</body>
</html>`;
        fs.writeFileSync(indexPath, starterHtml, 'utf8');
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

      // Automatically configure and reload Nginx for this domain
      syncNginxVHost({ domain_name, doc_root, proxy_type, proxy_port });

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

      // Remove Nginx configuration and reload
      removeNginxVHost(rows[0].domain_name);

      res.json({ success: true, message: `Domain ${rows[0].domain_name} deleted.` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};

