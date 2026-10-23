const pm2 = require('pm2');
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');

let isConnected = false;

// Connect to PM2 daemon
function connectPM2() {
  return new Promise((resolve, reject) => {
    if (isConnected) return resolve();
    pm2.connect((err) => {
      if (err) {
        console.error('❌ Failed to connect to PM2:', err.message);
        return reject(err);
      }
      isConnected = true;
      console.log('✅ Connected to PM2 Process Engine');
      resolve();
    });
  });
}

// Get PM2 daemon status & version
async function getPM2Status() {
  try {
    await connectPM2();
    const list = await listApps();
    return {
      installed: true,
      connected: true,
      version: pm2.version || '7.1.0',
      totalProcesses: list.length,
      onlineProcesses: list.filter(p => p.status === 'online').length
    };
  } catch (err) {
    return {
      installed: false,
      connected: false,
      error: err.message
    };
  }
}

// List all applications registered in PM2
function listApps() {
  return new Promise(async (resolve, reject) => {
    try {
      await connectPM2();
      pm2.list((err, processList) => {
        if (err) return reject(err);
        const apps = (processList || []).map(p => {
          const pm2Env = p.pm2_env || {};
          const monit = p.monit || {};
          return {
            name: p.name,
            pm_id: p.pm_id,
            pid: p.pid || null,
            status: pm2Env.status || 'stopped',
            uptime: pm2Env.pm_uptime ? Math.floor((Date.now() - pm2Env.pm_uptime) / 1000) : 0,
            restarts: pm2Env.restart_time || 0,
            memory_mb: monit.memory ? (monit.memory / (1024 * 1024)).toFixed(1) : 0,
            cpu_percent: monit.cpu !== undefined ? monit.cpu : 0,
            script: pm2Env.pm_exec_path || '',
            cwd: pm2Env.pm_cwd || '',
            out_log: pm2Env.pm_out_log_path || '',
            err_log: pm2Env.pm_err_log_path || ''
          };
        });
        resolve(apps);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Start an application using PM2
function startApp({ name, script, cwd, port, env = {} }) {
  return new Promise(async (resolve, reject) => {
    try {
      await connectPM2();
      const fullCwd = path.resolve(cwd);
      const fullScript = path.isAbsolute(script) ? script : path.join(fullCwd, script);

      // Auto-create sample script if it does not exist
      if (!fs.existsSync(fullScript)) {
        const sampleCode = `const http = require('http');
const port = process.env.PORT || ${port || 4000};
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', app: '${name}', time: new Date().toISOString() }));
});
server.listen(port, () => console.log('[${name}] Server listening on port ' + port));
`;
        fs.writeFileSync(fullScript, sampleCode, 'utf8');
      }

      // Check if already in PM2
      pm2.describe(name, (err, desc) => {
        if (!err && desc && desc.length > 0) {
          // Restart existing process
          pm2.restart(name, (rErr, proc) => {
            if (rErr) return reject(rErr);
            resolve({ action: 'restarted', name, proc });
          });
        } else {
          // Start fresh process in PM2
          pm2.start({
            name: name,
            script: fullScript,
            cwd: fullCwd,
            env: {
              ...process.env,
              PORT: port || 4000,
              NODE_ENV: 'production',
              ...env
            },
            max_memory_restart: '500M',
            autorestart: true
          }, (sErr, proc) => {
            if (sErr) return reject(sErr);
            resolve({ action: 'started', name, proc });
          });
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Stop an application
function stopApp(name) {
  return new Promise(async (resolve, reject) => {
    try {
      await connectPM2();
      pm2.stop(name, (err, proc) => {
        if (err) return reject(err);
        resolve({ action: 'stopped', name });
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Restart an application
function restartApp(name) {
  return new Promise(async (resolve, reject) => {
    try {
      await connectPM2();
      pm2.restart(name, (err, proc) => {
        if (err) return reject(err);
        resolve({ action: 'restarted', name });
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Delete an application from PM2
function deleteApp(name) {
  return new Promise(async (resolve, reject) => {
    try {
      await connectPM2();
      pm2.delete(name, (err) => {
        // Ignore error if process wasn't registered in PM2
        resolve({ action: 'deleted', name });
      });
    } catch (err) {
      resolve({ action: 'deleted', name });
    }
  });
}

// Retrieve PM2 Logs (Stdout + Stderr)
function getLogs(name, maxLines = 100) {
  return new Promise(async (resolve) => {
    try {
      const pm2Home = process.env.PM2_HOME || path.join(process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\HP', '.pm2');
      const logsDir = path.join(pm2Home, 'logs');
      const outPath = path.join(logsDir, `${name}-out.log`);
      const errPath = path.join(logsDir, `${name}-error.log`);

      let outLogs = '';
      let errLogs = '';

      if (fs.existsSync(outPath)) {
        const fullContent = fs.readFileSync(outPath, 'utf8');
        const lines = fullContent.split('\n');
        outLogs = lines.slice(-maxLines).join('\n');
      }

      if (fs.existsSync(errPath)) {
        const fullContent = fs.readFileSync(errPath, 'utf8');
        const lines = fullContent.split('\n');
        errLogs = lines.slice(-maxLines).join('\n');
      }

      resolve({
        success: true,
        name,
        outLogs: outLogs || 'No standard output recorded yet.',
        errLogs: errLogs || '',
        outPath,
        errPath
      });
    } catch (err) {
      resolve({
        success: false,
        error: err.message,
        outLogs: '',
        errLogs: ''
      });
    }
  });
}

// Run npm install inside project directory
function installDependencies(projectDir) {
  return new Promise((resolve, reject) => {
    const fullDir = path.resolve(projectDir);
    if (!fs.existsSync(fullDir)) {
      return reject(new Error(`Project directory does not exist: ${fullDir}`));
    }

    const packageJsonPath = path.join(fullDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      // Auto-create a minimal package.json if missing
      const defaultPkg = {
        name: path.basename(fullDir),
        version: "1.0.0",
        description: "Node.js application managed by cPanel",
        main: "index.js",
        scripts: { "start": "node index.js" },
        dependencies: {}
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(defaultPkg, null, 2), 'utf8');
    }

    console.log(`📦 Running 'npm install' in ${fullDir}...`);

    exec('npm install --prefer-offline --no-audit', { cwd: fullDir, timeout: 180000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Dependency install failed in ${fullDir}:`, error.message);
        return reject(new Error(stderr || stdout || error.message));
      }
      console.log(`✅ Dependencies installed successfully in ${fullDir}`);
      resolve({
        success: true,
        stdout: stdout || 'Dependencies up to date.',
        stderr: stderr || ''
      });
    });
  });
}

module.exports = {
  getPM2Status,
  listApps,
  startApp,
  stopApp,
  restartApp,
  deleteApp,
  getLogs,
  installDependencies
};

