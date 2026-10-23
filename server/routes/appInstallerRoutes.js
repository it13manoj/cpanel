const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

module.exports = (pool) => {
  const hostingRoot = path.resolve(__dirname, '../../hosting_data/www');

  // Available 1-Click Application Templates
  const templates = [
    {
      id: 'express-mysql-api',
      name: 'Express + MySQL Fullstack API',
      category: 'Node.js Backend',
      description: 'Production-ready REST API with auto-configured MySQL pool, CRUD endpoints and JWT support.',
      icon: 'database',
      portsRequired: true,
      defaultPort: 4010
    },
    {
      id: 'react-spa-client',
      name: 'Modern Web Client (SPA)',
      category: 'Frontend Application',
      description: 'Fast, responsive web dashboard with dark mode, API connection hooks and dynamic routing.',
      icon: 'layout',
      portsRequired: false
    },
    {
      id: 'ecommerce-store',
      name: 'E-Commerce Store & Inventory',
      category: 'Fullstack Solution',
      description: 'E-commerce catalog with automated MySQL products table, shopping cart API and admin management.',
      icon: 'shopping-cart',
      portsRequired: true,
      defaultPort: 4020
    },
    {
      id: 'blog-cms',
      name: 'Blog & Content Publisher CMS',
      category: 'Publishing',
      description: 'Lightweight headless CMS with article publishing, tags and comment system backed by MySQL.',
      icon: 'book-open',
      portsRequired: true,
      defaultPort: 4030
    },
    {
      id: 'python-flask-service',
      name: 'Python Flask Microservice',
      category: 'Python',
      description: 'High-performance Python Flask microservice with JSON endpoints and background worker.',
      icon: 'terminal',
      portsRequired: true,
      defaultPort: 5050
    }
  ];

  // Get templates
  router.get('/templates', (req, res) => {
    res.json({ success: true, templates });
  });

  // 1-Click Install Application
  router.post('/install', async (req, res) => {
    try {
      const { templateId, projectName, domainName, port, quotaMb = 500 } = req.body;
      if (!projectName) {
        return res.status(400).json({ success: false, error: 'Project name is required' });
      }

      const cleanProjectName = projectName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const cleanDomain = (domainName || `${cleanProjectName}.local`).trim().toLowerCase();
      const projectDir = path.join(hostingRoot, cleanProjectName);
      const appPort = port ? parseInt(port, 10) : 4010;

      if (fs.existsSync(projectDir)) {
        return res.status(400).json({ success: false, error: `Directory '${cleanProjectName}' already exists!` });
      }

      fs.mkdirSync(projectDir, { recursive: true });

      // Create Domain entry in MySQL
      const [existingDom] = await pool.query('SELECT id FROM domains WHERE domain_name = ?', [cleanDomain]);
      let domainId;
      if (existingDom.length === 0) {
        const [domResult] = await pool.query(
          'INSERT INTO domains (domain_name, doc_root, proxy_type, proxy_port, ssl_enabled, disk_quota_mb, status) VALUES (?, ?, ?, ?, 1, ?, "active")',
          [cleanDomain, projectDir, 'proxy', appPort, quotaMb]
        );
        domainId = domResult.insertId;
      } else {
        domainId = existingDom[0].id;
      }

      // Generate Scaffold based on template
      if (templateId === 'express-mysql-api' || templateId === 'ecommerce-store' || templateId === 'blog-cms') {
        const isEcom = templateId === 'ecommerce-store';
        const isBlog = templateId === 'blog-cms';

        // 1. Write package.json
        const pkgJson = {
          name: cleanProjectName,
          version: '1.0.0',
          main: 'server.js',
          scripts: {
            start: 'node server.js'
          },
          dependencies: {
            express: '^5.0.0',
            cors: '^2.8.5',
            mysql2: '^3.16.0',
            dotenv: '^17.2.3'
          }
        };
        fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(pkgJson, null, 2), 'utf8');

        // 2. Write .env
        const envContent = `PORT=${appPort}
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=12345678
DB_NAME=cpanel
`;
        fs.writeFileSync(path.join(projectDir, '.env'), envContent, 'utf8');

        // 3. Auto-create database tables
        if (isEcom) {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS \`${cleanProjectName}_products\` (
              \`id\` INT AUTO_INCREMENT PRIMARY KEY,
              \`title\` VARCHAR(255) NOT NULL,
              \`price\` DECIMAL(10,2) NOT NULL,
              \`stock\` INT DEFAULT 100,
              \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            INSERT IGNORE INTO \`${cleanProjectName}_products\` (id, title, price, stock) VALUES
            (1, 'Professional Cloud VPS', 29.99, 50),
            (2, 'Dedicated MySQL Instance', 49.00, 20),
            (3, 'SSL Wildcard Certificate', 15.00, 100);
          `);
        } else if (isBlog) {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS \`${cleanProjectName}_articles\` (
              \`id\` INT AUTO_INCREMENT PRIMARY KEY,
              \`title\` VARCHAR(255) NOT NULL,
              \`body\` TEXT NOT NULL,
              \`author\` VARCHAR(100) DEFAULT 'Admin',
              \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            INSERT IGNORE INTO \`${cleanProjectName}_articles\` (id, title, body) VALUES
            (1, 'Welcome to My New cPanel Hosted Site', 'Everything is managed autonomously via the panel without direct server configuration.');
          `);
        }

        // 4. Write server.js
        const serverCode = `const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || ${appPort};

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME || 'cpanel'
});

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    project: '${cleanProjectName}',
    template: '${templateId}',
    message: 'Scaffolded and running via Node.js cPanel!'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ uptime: process.uptime(), status: 'healthy', timestamp: new Date() });
});

${isEcom ? `
app.get('/api/products', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM \`${cleanProjectName}_products\`');
  res.json({ success: true, products: rows });
});
` : isBlog ? `
app.get('/api/articles', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM \`${cleanProjectName}_articles\`');
  res.json({ success: true, articles: rows });
});
` : `
app.get('/api/data', async (req, res) => {
  const [rows] = await pool.query('SELECT 1 as connected, NOW() as current_time');
  res.json({ success: true, db: rows[0] });
});
`}

app.listen(PORT, () => {
  console.log('Project ${cleanProjectName} listening on port ' + PORT);
});
`;
        fs.writeFileSync(path.join(projectDir, 'server.js'), serverCode, 'utf8');

        // Register in managed_apps table
        await pool.query(
          'INSERT INTO managed_apps (app_name, app_dir, script, port, status) VALUES (?, ?, "server.js", ?, "stopped") ON DUPLICATE KEY UPDATE port = ?',
          [cleanProjectName, projectDir, appPort, appPort]
        );
      } else {
        // Static Web Project
        const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${cleanProjectName}</title>
  <style>body { font-family: sans-serif; background: #0b111e; color: #f8fafc; padding: 3rem; text-align: center; } h1 { color: #38bdf8; }</style>
</head>
<body>
  <h1>${cleanProjectName} Live</h1>
  <p>1-Click Application scaffolded and active.</p>
</body>
</html>`;
        fs.writeFileSync(path.join(projectDir, 'index.html'), indexHtml, 'utf8');
      }

      // Log install
      await pool.query(
        'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
        ['APP_INSTALLER', `1-Click Installed: ${cleanProjectName}`, `Template: ${templateId}, Domain: ${cleanDomain}, Port: ${appPort}`]
      );

      res.json({
        success: true,
        message: `Project '${cleanProjectName}' created successfully! Dependencies pre-configured and domain '${cleanDomain}' routed.`,
        project: {
          name: cleanProjectName,
          domain: cleanDomain,
          path: projectDir,
          port: appPort,
          template: templateId
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};

