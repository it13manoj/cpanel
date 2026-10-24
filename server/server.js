const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
require('dotenv').config();

const { initDB, getPool, dbConfig } = require('./db');
const { getSystemMetrics } = require('./services/systemStats');

const domainRoutes = require('./routes/domainRoutes');
const mysqlRoutes = require('./routes/mysqlRoutes');
const fileManagerRoutes = require('./routes/fileManagerRoutes');
const packagesRoutes = require('./routes/packagesRoutes');
const ftpRoutes = require('./routes/ftpRoutes');
const terminalRoutes = require('./routes/terminalRoutes');
const appsRoutes = require('./routes/appsRoutes');
const cronRoutes = require('./routes/cronRoutes');
const appInstallerRoutes = require('./routes/appInstallerRoutes');
const storageRoutes = require('./routes/storageRoutes');
const authRoutes = require('./routes/authRoutes');
const dnsRoutes = require('./routes/dnsRoutes');
const { startDnsServer } = require('./services/dnsServer');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 5200;
const HTTPS_PORT = process.env.HTTPS_PORT || 5443;

// Optional HTTPS Server with auto-loaded SSL certificates
let httpsServer = null;
let httpsWss = null;

// Support custom SSL paths or auto-detect Let's Encrypt
let sslCertPath = process.env.SSL_CERT_PATH || path.resolve(__dirname, 'ssl/cert.pem');
let sslKeyPath = process.env.SSL_KEY_PATH || path.resolve(__dirname, 'ssl/key.pem');

// Auto-detect Let's Encrypt certificates on Linux if available
try {
  const letsEncryptBase = '/etc/letsencrypt/live';
  if (fs.existsSync(letsEncryptBase)) {
    const domains = fs.readdirSync(letsEncryptBase);
    for (const d of domains) {
      const candidateCert = path.join(letsEncryptBase, d, 'fullchain.pem');
      const candidateKey = path.join(letsEncryptBase, d, 'privkey.pem');
      if (fs.existsSync(candidateCert) && fs.existsSync(candidateKey)) {
        sslCertPath = candidateCert;
        sslKeyPath = candidateKey;
        console.log(`🔒 Auto-detected Let's Encrypt SSL certificate for domain: ${d}`);
        break;
      }
    }
  }
} catch (e) {}

if (fs.existsSync(sslCertPath) && fs.existsSync(sslKeyPath)) {
  try {
    const sslOptions = {
      cert: fs.readFileSync(sslCertPath),
      key: fs.readFileSync(sslKeyPath)
    };
    httpsServer = https.createServer(sslOptions, app);
    httpsWss = new WebSocket.Server({ server: httpsServer });
    console.log(`🔒 SSL Certificates loaded from ${sslCertPath}`);
  } catch (sslErr) {
    console.warn('⚠️ Could not load SSL certificates:', sslErr.message);
  }
}

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Domain Virtual Host Router / Static Host Handler
app.use(async (req, res, next) => {
  // Never intercept cPanel API routes or static build assets
  if (req.path.startsWith('/api') || req.path.startsWith('/static')) {
    return next();
  }

  const rawHost = (req.headers.host || '').split(':')[0].toLowerCase();

  // If accessed directly via Server IP address (e.g. 173.212.235.87) or localhost, serve cPanel Control Panel
  if (!rawHost || rawHost === 'localhost' || rawHost === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(rawHost)) {
    return next();
  }

  // If user visits domain.com/cpanel, pass through to cPanel Control Panel
  if (req.path.startsWith('/cpanel')) {
    return next();
  }

  const cleanHost = rawHost.replace(/^www\./, '');

  const pool = getPool();
  let domain = null;

  if (pool) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM `cpanel`.`domains` WHERE (domain_name = ? OR domain_name = ? OR domain_name = ?) AND status = "active"',
        [rawHost, cleanHost, `www.${cleanHost}`]
      );
      if (rows && rows.length > 0) {
        domain = rows[0];
      }
    } catch (e) {
      console.error('VHost lookup error:', e);
    }
  }

  // Fallback to on-disk vhost config
  if (!domain) {
    try {
      const configPath = path.resolve(__dirname, `../hosting_data/vhosts/${cleanHost}.json`);
      if (fs.existsSync(configPath)) {
        domain = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    } catch (e) {}
  }

  // Direct document root lookup under hosting_data/www
  if (!domain) {
    const directDocRoot = path.resolve(__dirname, `../hosting_data/www/${cleanHost}`);
    if (fs.existsSync(directDocRoot)) {
      domain = { domain_name: cleanHost, doc_root: directDocRoot, proxy_type: 'static' };
    }
  }

  if (domain && domain.doc_root) {
    try {
      if (!fs.existsSync(domain.doc_root)) {
        fs.mkdirSync(domain.doc_root, { recursive: true });
      }

      // Check if requested file exists in domain doc_root
      const requestedRel = req.path === '/' ? 'index.html' : req.path.replace(/^\//, '');
      const filePath = path.join(domain.doc_root, requestedRel);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return res.sendFile(filePath);
      }

      // Default index.html
      const defaultIndex = path.join(domain.doc_root, 'index.html');
      if (fs.existsSync(defaultIndex)) {
        return res.sendFile(defaultIndex);
      }

      // If no file exists yet, serve a starter page
      const starterHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${domain.domain_name}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #1e293b; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; border: 1px solid #334155; max-width: 500px; }
    h1 { color: #38bdf8; margin: 0 0 1rem; font-size: 1.8rem; }
    p { color: #94a3b8; line-height: 1.6; }
    .badge { display: inline-block; background: #0284c7; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Parakshtech cPanel</span>
    <h1>Website Active: ${domain.domain_name}</h1>
    <p>Your domain is active. Upload your website files into this domain's directory via cPanel File Manager to replace this page.</p>
  </div>
</body>
</html>`;
      fs.writeFileSync(defaultIndex, starterHtml, 'utf8');
      return res.sendFile(defaultIndex);

    } catch (err) {
      console.error(`Error serving domain ${domain.domain_name}:`, err);
    }
  }

  // If not a hosted domain, proceed to next middleware (cPanel React app or API)
  next();
});

// WebSocket Metrics Broadcaster
function setupMetricsWs(serverWss) {
  if (!serverWss) return;
  serverWss.on('connection', (ws) => {
    const interval = setInterval(async () => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          const metrics = await getSystemMetrics(getPool());
          ws.send(JSON.stringify({ type: 'METRICS_UPDATE', data: metrics }));
        } catch (err) {}
      }
    }, 2000);

    ws.on('close', () => {
      clearInterval(interval);
    });
  });
}

setupMetricsWs(wss);
if (httpsWss) {
  setupMetricsWs(httpsWss);
}

async function startServer() {
  try {
    const pool = await initDB();

    // Start Authoritative DNS Nameserver on Port 53
    startDnsServer(pool);

    // Register API endpoints
    app.use('/api/system', async (req, res) => {
      const metrics = await getSystemMetrics(pool);
      res.json({ success: true, ...metrics });
    });

    app.use('/api/domains', domainRoutes(pool));
    app.use('/api/mysql', mysqlRoutes(pool, dbConfig));
    app.use('/api/files', fileManagerRoutes(pool));
    app.use('/api/packages', packagesRoutes(pool));
    app.use('/api/ftp', ftpRoutes(pool));
    app.use('/api/terminal', terminalRoutes(pool));
    app.use('/api/apps', appsRoutes(pool));
    app.use('/api/cron', cronRoutes(pool));
    app.use('/api/installer', appInstallerRoutes(pool));
    app.use('/api/storage', storageRoutes(pool));
    app.use('/api/auth', authRoutes(pool));
    app.use('/api/dns', dnsRoutes(pool));

    // Serve React production build if available
    const buildPath = path.resolve(__dirname, '../build');
    app.use(express.static(buildPath));

    // Fallback handler
    app.use((req, res) => {
      const indexPath = path.join(buildPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.json({
          status: 'cPanel API Running',
          message: 'Frontend is running on port 3000 (development) or build directory. Access API endpoints at /api/*',
          endpoints: [
            '/api/system',
            '/api/domains',
            '/api/mysql/databases',
            '/api/files/list',
            '/api/packages/project-dependencies',
            '/api/installer/templates',
            '/api/storage/quotas',
            '/api/auth/users'
          ]
        });
      }
    });

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`🚀 Node.js cPanel Server is LIVE on http://0.0.0.0:${PORT}`);
      console.log(`📡 WebSocket Metrics live on ws://0.0.0.0:${PORT}`);
      console.log(`🗄️ Connected to MySQL database: ${dbConfig.database} as ${dbConfig.user}`);
      console.log(`====================================================`);
    });

    if (httpsServer) {
      httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
        console.log(`🔒 Secure HTTPS cPanel is LIVE on https://0.0.0.0:${HTTPS_PORT}`);
        console.log(`📡 Secure WSS Metrics live on wss://0.0.0.0:${HTTPS_PORT}`);
      });
    }
  } catch (error) {
    console.error('Fatal startup error:', error);
    process.exit(1);
  }
}

startServer();
