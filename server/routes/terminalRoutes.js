const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');

module.exports = (pool) => {
  // Dangerous system destructive command blocklist
  const BLOCKED_COMMANDS = [
    /\brm\s+-rf\s+\/\s*$/i,
    /\brm\s+-rf\s+\/\*/i,
    /\bmkfs\b/i,
    /\bdd\s+if=.*of=\/dev\/[s|v]da/i,
    /:(){ :|:& };:/, // fork bomb
    /\bchmod\s+-R\s+777\s+\/\s*$/i
  ];

  // Execute a server command
  router.post('/exec', (req, res) => {
    const { command, cwd } = req.body;
    if (!command || !command.trim()) {
      return res.status(400).json({ success: false, error: 'Command is required' });
    }

    const trimmedCmd = command.trim();
    for (const pattern of BLOCKED_COMMANDS) {
      if (pattern.test(trimmedCmd)) {
        return res.status(403).json({
          success: false,
          error: 'Security Alert: This destructive command pattern has been blocked by cPanel Security Shield.'
        });
      }
    }

    const workingDir = cwd ? path.resolve(cwd) : path.resolve(__dirname, '../../');
    const startTime = Date.now();

    exec(command, { cwd: workingDir, maxBuffer: 10 * 1024 * 1024, timeout: 60000 }, async (error, stdout, stderr) => {
      const durationMs = Date.now() - startTime;
      const isSuccess = !error;

      if (pool) {
        try {
          await pool.query(
            'INSERT INTO activity_logs (module, action, status, details) VALUES (?, ?, ?, ?)',
            [
              'TERMINAL',
              command.substring(0, 150),
              isSuccess ? 'success' : 'failed',
              `CWD: ${workingDir} (${durationMs}ms)`
            ]
          );
        } catch (e) {
          console.error(e);
        }
      }

      res.json({
        success: isSuccess,
        stdout: stdout || '',
        stderr: stderr || (error ? error.message : ''),
        exitCode: error ? error.code || 1 : 0,
        durationMs,
        cwd: workingDir
      });
    });
  });

  // Get activity & system logs
  router.get('/logs', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100');
      res.json({ success: true, logs: rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Clear logs
  router.delete('/logs', async (req, res) => {
    try {
      await pool.query('DELETE FROM activity_logs');
      res.json({ success: true, message: 'Logs cleared' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};

