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

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 5200;
const HTTPS_PORT = process.env.HTTPS_PORT || 5443;

// Optional HTTPS Server with auto-loaded SSL certificates
let httpsServer = null;
let httpsWss = null;
const sslCertPath = path.resolve(__dirname, 'ssl/cert.pem');
const sslKeyPath = path.resolve(__dirname, 'ssl/key.pem');

if (fs.existsSync(sslCertPath) && fs.existsSync(sslKeyPath)) {
  try {
    const sslOptions = {
      cert: fs.readFileSync(sslCertPath),
      key: fs.readFileSync(sslKeyPath)
    };
    httpsServer = https.createServer(sslOptions, app);
    httpsWss = new WebSocket.Server({ server: httpsServer });
    console.log('🔒 SSL Certificates loaded for HTTPS listener.');
  } catch (sslErr) {
    console.warn('⚠️ Could not load SSL certificates:', sslErr.message);
  }
}

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Domain Virtual Host Router / Static Host Handler
app.use(async (req, res, next) => {
  const host = (req.headers.host || '').split(':')[0].toLowerCase();
  if (req.path.startsWith('/api') || host === 'localhost' || host === '127.0.0.1') {
    return next();
  }

  const pool = getPool();
  if (pool) {
    try {
      const [rows] = await pool.query('SELECT * FROM domains WHERE domain_name = ? AND status = "active"', [host]);
      if (rows.length > 0) {
        const domain = rows[0];
        if (domain.proxy_type === 'proxy' && domain.proxy_port) {
          return res.redirect(`http://localhost:${domain.proxy_port}${req.url}`);
        } else {
          return express.static(domain.doc_root)(req, res, next);
        }
      }
    } catch (e) {
      console.error('VHost lookup error:', e);
    }
  }
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
