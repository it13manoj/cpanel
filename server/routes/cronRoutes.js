const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

module.exports = (pool) => {
  // Get all cron jobs
  router.get('/', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM cron_jobs ORDER BY created_at DESC');
      res.json({ success: true, cron_jobs: rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create cron job
  router.post('/', async (req, res) => {
    try {
      const { name, schedule, command } = req.body;
      if (!name || !schedule || !command) {
        return res.status(400).json({ success: false, error: 'Name, schedule, and command are required' });
      }

      const [result] = await pool.query(
        'INSERT INTO cron_jobs (name, schedule, command, active) VALUES (?, ?, ?, 1)',
        [name.trim(), schedule.trim(), command.trim()]
      );

      await pool.query(
        'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
        ['CRON', `Created Cron Job: ${name}`, `Schedule: ${schedule}, Cmd: ${command}`]
      );

      res.json({ success: true, message: 'Cron job created', id: result.insertId });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Toggle active status
  router.patch('/:id/toggle', async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query('SELECT active FROM cron_jobs WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ success: false, error: 'Job not found' });

      const newActive = rows[0].active ? 0 : 1;
      await pool.query('UPDATE cron_jobs SET active = ? WHERE id = ?', [newActive, id]);

      res.json({ success: true, active: newActive });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Run Now
  router.post('/:id/run', async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query('SELECT * FROM cron_jobs WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ success: false, error: 'Job not found' });

      const job = rows[0];
      exec(job.command, async (error, stdout, stderr) => {
        await pool.query('UPDATE cron_jobs SET last_run = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        await pool.query(
          'INSERT INTO activity_logs (module, action, status, details) VALUES (?, ?, ?, ?)',
          ['CRON', `Manual Run: ${job.name}`, !error ? 'success' : 'failed', stdout || stderr || '']
        );
      });

      res.json({ success: true, message: `Task '${job.name}' initiated.` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM cron_jobs WHERE id = ?', [id]);
      res.json({ success: true, message: 'Cron job deleted' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};

