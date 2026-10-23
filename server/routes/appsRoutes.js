const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pm2Service = require('../services/pm2Service');

module.exports = (pool) => {
  // Get PM2 Engine Status
  router.get('/pm2/status', async (req, res) => {
    try {
      const status = await pm2Service.getPM2Status();
      res.json({ success: true, pm2: status });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // List all managed apps with live PM2 process metrics
  router.get('/', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM `cpanel`.`managed_apps` ORDER BY created_at DESC');
      
      let pm2Apps = [];
      try {
        pm2Apps = await pm2Service.listApps();
      } catch (pm2Err) {
        console.warn('PM2 list warning:', pm2Err.message);
      }

      const pm2Map = new Map();
      pm2Apps.forEach(p => {
        pm2Map.set(p.name, p);
      });

      const apps = rows.map(app => {
        const pm2Proc = pm2Map.get(app.app_name);
        const isOnline = pm2Proc && pm2Proc.status === 'online';

        return {
          ...app,
          status: isOnline ? 'running' : (pm2Proc ? pm2Proc.status : app.status),
          pid: pm2Proc ? pm2Proc.pid : app.pid,
          pm_id: pm2Proc ? pm2Proc.pm_id : null,
          memory_mb: pm2Proc ? pm2Proc.memory_mb : 0,
          cpu_percent: pm2Proc ? pm2Proc.cpu_percent : 0,
          uptime: pm2Proc ? pm2Proc.uptime : 0,
          restarts: pm2Proc ? pm2Proc.restarts : 0,
          is_pm2: !!pm2Proc
        };
      });

      res.json({
        success: true,
        apps,
        pm2Total: pm2Apps.length,
        pm2Online: pm2Apps.filter(p => p.status === 'online').length
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Register & Deploy a new Node.js App
  router.post('/', async (req, res) => {
    try {
      const {
        app_name,
        app_dir,
        script = 'index.js',
        port,
        auto_install_deps = true,
        auto_start = true
      } = req.body;

      if (!app_name || !app_dir) {
        return res.status(400).json({ success: false, error: 'App name and directory are required' });
      }

      const cleanName = app_name.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      const fullDir = path.resolve(app_dir);

      if (!fs.existsSync(fullDir)) {
        fs.mkdirSync(fullDir, { recursive: true });
      }

      // Check if entry script exists, create sample if missing
      const cleanScript = script.trim() || 'index.js';
      const scriptPath = path.join(fullDir, cleanScript);
      if (!fs.existsSync(scriptPath)) {
        const sampleCode = `const http = require('http');
const port = process.env.PORT || ${port || 4000};

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Hello from ${cleanName} managed by cPanel PM2!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }));
});

server.listen(port, () => {
  console.log('[${cleanName}] Server running on port ' + port);
});
`;
        fs.writeFileSync(scriptPath, sampleCode, 'utf8');
      }

      // 1-Click Dependency Installation if requested or if package.json exists
      let installLog = null;
      if (auto_install_deps) {
        try {
          const installRes = await pm2Service.installDependencies(fullDir);
          installLog = installRes.stdout;
        } catch (depErr) {
          console.warn('Auto dependency install notice:', depErr.message);
          installLog = depErr.message;
        }
      }

      // Insert record into managed_apps
      const [result] = await pool.query(
        'INSERT INTO `cpanel`.`managed_apps` (app_name, app_dir, script, port, status) VALUES (?, ?, ?, ?, "stopped") ON DUPLICATE KEY UPDATE app_dir = VALUES(app_dir), script = VALUES(script), port = VALUES(port)',
        [cleanName, fullDir, cleanScript, port || null]
      );

      // Auto start via PM2 if requested
      let startResult = null;
      if (auto_start) {
        try {
          startResult = await pm2Service.startApp({
            name: cleanName,
            script: cleanScript,
            cwd: fullDir,
            port: port ? parseInt(port, 10) : 4000
          });
          await pool.query('UPDATE `cpanel`.`managed_apps` SET status = "running" WHERE app_name = ?', [cleanName]);
        } catch (startErr) {
          console.warn('Auto-start notice:', startErr.message);
        }
      }

      await pool.query(
        'INSERT INTO `cpanel`.`activity_logs` (module, action, details) VALUES (?, ?, ?)',
        ['APPS', `Deployed Node.js App: ${cleanName}`, `Dir: ${fullDir}, PM2: ${auto_start ? 'Started' : 'Registered'}`]
      );

      res.json({
        success: true,
        message: `Application '${cleanName}' deployed successfully! ${auto_start ? 'PM2 process started.' : ''}`,
        appId: result.insertId,
        installLog,
        startResult
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 1-Click Run / Start an App via PM2
  router.post('/:id/start', async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query('SELECT * FROM `cpanel`.`managed_apps` WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ success: false, error: 'App not found' });

      const app = rows[0];

      const startResult = await pm2Service.startApp({
        name: app.app_name,
        script: app.script,
        cwd: app.app_dir,
        port: app.port
      });

      await pool.query('UPDATE `cpanel`.`managed_apps` SET status = "running" WHERE id = ?', [app.id]);

      await pool.query(
        'INSERT INTO `cpanel`.`activity_logs` (module, action, details) VALUES (?, ?, ?)',
        ['APPS', `Started PM2 App: ${app.app_name}`, `Action: ${startResult.action}`]
      );

      res.json({
        success: true,
        message: `Application '${app.app_name}' is now running with PM2!`,
        action: startResult.action
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 1-Click Stop an App via PM2
  router.post('/:id/stop', async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query('SELECT * FROM `cpanel`.`managed_apps` WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ success: false, error: 'App not found' });

      const app = rows[0];

      await pm2Service.stopApp(app.app_name);

      await pool.query('UPDATE `cpanel`.`managed_apps` SET status = "stopped", pid = NULL WHERE id = ?', [app.id]);

      await pool.query(
        'INSERT INTO `cpanel`.`activity_logs` (module, action, details) VALUES (?, ?, ?)',
        ['APPS', `Stopped PM2 App: ${app.app_name}`, 'Process stopped']
      );

      res.json({ success: true, message: `Application '${app.app_name}' stopped.` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 1-Click Restart an App via PM2
  router.post('/:id/restart', async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query('SELECT * FROM `cpanel`.`managed_apps` WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ success: false, error: 'App not found' });

      const app = rows[0];

      await pm2Service.restartApp(app.app_name);

      await pool.query('UPDATE `cpanel`.`managed_apps` SET status = "running" WHERE id = ?', [app.id]);

      await pool.query(
        'INSERT INTO `cpanel`.`activity_logs` (module, action, details) VALUES (?, ?, ?)',
        ['APPS', `Restarted PM2 App: ${app.app_name}`, 'Restart completed']
      );

      res.json({ success: true, message: `Application '${app.app_name}' restarted successfully.` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 1-Click Install Dependencies (npm install inside project directory)
  router.post('/:id/install-deps', async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query('SELECT * FROM `cpanel`.`managed_apps` WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ success: false, error: 'App not found' });

      const app = rows[0];

      const installRes = await pm2Service.installDependencies(app.app_dir);

      await pool.query(
        'INSERT INTO `cpanel`.`activity_logs` (module, action, details) VALUES (?, ?, ?)',
        ['APPS', `Installed dependencies for: ${app.app_name}`, `Path: ${app.app_dir}`]
      );

      res.json({
        success: true,
        message: `All dependencies installed successfully for '${app.app_name}'!`,
        output: installRes.stdout
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 1-Click View Real-time PM2 Logs
  router.get('/:id/logs', async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query('SELECT * FROM `cpanel`.`managed_apps` WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ success: false, error: 'App not found' });

      const app = rows[0];
      const maxLines = parseInt(req.query.lines, 10) || 100;

      const logs = await pm2Service.getLogs(app.app_name, maxLines);

      res.json({
        success: true,
        app_name: app.app_name,
        outLogs: logs.outLogs,
        errLogs: logs.errLogs,
        outPath: logs.outPath,
        errPath: logs.errPath
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete an App (stops PM2 process & removes registration)
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query('SELECT * FROM `cpanel`.`managed_apps` WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ success: false, error: 'App not found' });

      const app = rows[0];

      await pm2Service.deleteApp(app.app_name);

      await pool.query('DELETE FROM `cpanel`.`managed_apps` WHERE id = ?', [app.id]);

      await pool.query(
        'INSERT INTO `cpanel`.`activity_logs` (module, action, details) VALUES (?, ?, ?)',
        ['APPS', `Removed PM2 App: ${app.app_name}`, 'Deleted from process manager']
      );

      res.json({ success: true, message: `Application '${app.app_name}' removed from manager.` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};
