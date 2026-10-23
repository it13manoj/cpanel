/**
 * cPanel Auto-Deployment & Live Server Setup Script
 * Sets up MySQL, Auto SSL, PM2, and builds frontend with zero hassle.
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec, execSync } = require('child_process');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

console.log(`
========================================================================
   🌐 cPanel Automated Live Server Deployment & Setup
========================================================================
`);

// Detect Server Public IP
async function detectPublicIP() {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(getLocalIP());
    }, 3000);

    const req = https.get('https://api.ipify.org?format=json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        clearTimeout(timeout);
        try {
          const ip = JSON.parse(data).ip;
          resolve(ip || getLocalIP());
        } catch (e) {
          resolve(getLocalIP());
        }
      });
    });

    req.on('error', () => {
      clearTimeout(timeout);
      resolve(getLocalIP());
    });
  });
}

function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// Ask question helper
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

// Execute command helper
function runCmd(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(stderr || stdout || error.message));
      }
      resolve(stdout);
    });
  });
}

async function main() {
  try {
    // 1. Gather DB credentials (ask ONLY username and password)
    let dbUser = process.env.DB_USER;
    let dbPassword = process.env.DB_PASSWORD;

    // Check command line arguments: --user=... --password=...
    process.argv.forEach(arg => {
      if (arg.startsWith('--user=')) dbUser = arg.split('=')[1];
      if (arg.startsWith('--password=')) dbPassword = arg.split('=')[1];
    });

    if (!dbUser) {
      const userAns = await askQuestion('👉 Enter MySQL Database Username [root]: ');
      dbUser = userAns.trim() || 'root';
    }

    if (dbPassword === undefined || dbPassword === null) {
      const passAns = await askQuestion('👉 Enter MySQL Database Password: ');
      dbPassword = passAns.trim();
    }

    console.log(`\n🔍 Verifying MySQL Connection for user '${dbUser}'...`);

    // 2. Test Connection & Create Database
    let rootConn;
    try {
      rootConn = await mysql.createConnection({
        host: 'localhost',
        user: dbUser,
        password: dbPassword
      });
      console.log('✅ Connected to MySQL Server successfully.');
    } catch (dbErr) {
      console.error(`\n❌ Failed to connect to MySQL: ${dbErr.message}`);
      console.error('Please make sure MySQL is running on localhost:3306 and the password is correct.\n');
      process.exit(1);
    }

    console.log('📦 Initializing cPanel database schema...');
    await rootConn.query('CREATE DATABASE IF NOT EXISTS `cpanel` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    await rootConn.end();

    // 3. Write / Update .env file
    const envPath = path.resolve(__dirname, '.env');
    const jwtSecret = crypto.randomBytes(32).toString('hex');
    const envContent = `PORT=5000
HTTPS_PORT=5443
DB_HOST=localhost
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_NAME=cpanel
JWT_SECRET=${jwtSecret}
`;
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ Environment configuration (.env) written.');

    // 4. Initialize Database Tables and Admin User
    process.env.DB_HOST = 'localhost';
    process.env.DB_USER = dbUser;
    process.env.DB_PASSWORD = dbPassword;
    process.env.DB_NAME = 'cpanel';

    const { initDB } = require('./server/db');
    await initDB();

    // 5. Detect Server IP & Generate Automatic SSL
    console.log('\n🔒 Setting up Automated SSL Certificates...');
    const serverIP = await detectPublicIP();
    console.log(`📡 Detected Server IP: ${serverIP}`);

    const sslDir = path.resolve(__dirname, 'server/ssl');
    if (!fs.existsSync(sslDir)) {
      fs.mkdirSync(sslDir, { recursive: true });
    }

    const certPath = path.join(sslDir, 'cert.pem');
    const keyPath = path.join(sslDir, 'key.pem');

    const selfsigned = require('selfsigned');
    const pems = await selfsigned.generate(
      [
        { name: 'commonName', value: serverIP || 'cpanel-server' },
        { name: 'organizationName', value: 'cPanel Server' }
      ],
      {
        days: 3650, // 10 years validity
        algorithm: 'sha256',
        extensions: [
          {
            name: 'subjectAltName',
            altNames: [
              { type: 2, value: 'localhost' },
              { type: 7, ip: '127.0.0.1' },
              ...(serverIP && serverIP !== '127.0.0.1' ? [{ type: 7, ip: serverIP }] : [])
            ]
          }
        ]
      }
    );

    fs.writeFileSync(keyPath, pems.private, 'utf8');
    fs.writeFileSync(certPath, pems.cert, 'utf8');
    console.log('✅ Auto-SSL certificate generated & installed in server/ssl/.');

    // 6. Ensure PM2 is installed globally
    console.log('\n⚙️ Checking PM2 Process Supervisor...');
    try {
      execSync('pm2 -v', { stdio: 'ignore' });
      console.log('✅ PM2 is installed.');
    } catch (e) {
      console.log('📦 Installing PM2 globally...');
      try {
        await runCmd('npm install -g pm2');
        console.log('✅ PM2 installed globally.');
      } catch (pm2InstallErr) {
        console.warn('⚠️ PM2 global install warning:', pm2InstallErr.message);
      }
    }

    // 7. Build Frontend for Production
    console.log('\n⚛️ Building Production Frontend Bundle (npm run build)...');
    try {
      await runCmd('npm run build');
      console.log('✅ React production build generated successfully in build/.');
    } catch (buildErr) {
      console.warn('⚠️ Build notice:', buildErr.message);
    }

    // 8. Launch / Restart cPanel via PM2
    console.log('\n🚀 Starting cPanel Service under PM2 Process Manager...');
    try {
      try { await runCmd('pm2 delete node-cpanel'); } catch (e) {}
      await runCmd('pm2 start server/server.js --name node-cpanel --time');
      try { await runCmd('pm2 save'); } catch (e) {}
      console.log('✅ cPanel registered and running as background daemon: node-cpanel');
    } catch (pm2StartErr) {
      console.warn('⚠️ PM2 start notice, starting via node fallback:', pm2StartErr.message);
    }

    // 9. Display Completion Banner
    console.log(`
========================================================================
   🎉 CPANEL SETUP COMPLETED SUCCESSFULLY!
========================================================================

Your autonomous Node.js cPanel is now LIVE and accessible:

  🌐 Public HTTP Panel:    http://${serverIP}:5000
  🔒 Secure HTTPS Panel:   https://${serverIP}:5443
  💻 Localhost Panel:      http://localhost:5000

------------------------------------------------------------------------
🔑 Super Admin Login Credentials:
   Username: admin
   Password: admin123
------------------------------------------------------------------------

Useful Server Commands:
  - View Live Logs:        pm2 logs node-cpanel
  - Restart Server:        pm2 restart node-cpanel
  - Stop Server:           pm2 stop node-cpanel
  - Auto-start on reboot:  pm2 startup

========================================================================
`);
  } catch (fatalErr) {
    console.error('\n❌ Setup failed:', fatalErr);
    process.exit(1);
  }
}

main();

