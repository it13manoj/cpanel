const express = require('express');
const router = express.Router();
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = (pool) => {
  // Get package.json info for a given project directory (default: current project root)
  router.get('/project-dependencies', (req, res) => {
    try {
      const projectPath = req.query.path ? path.resolve(req.query.path) : path.resolve(__dirname, '../../');
      const pkgJsonPath = path.join(projectPath, 'package.json');

      if (!fs.existsSync(pkgJsonPath)) {
        return res.json({
          success: true,
          hasPackageJson: false,
          path: projectPath,
          dependencies: {},
          devDependencies: {},
          scripts: {}
        });
      }

      const pkgData = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

      res.json({
        success: true,
        hasPackageJson: true,
        name: pkgData.name || 'Unnamed Project',
        version: pkgData.version || '1.0.0',
        path: projectPath,
        dependencies: pkgData.dependencies || {},
        devDependencies: pkgData.devDependencies || {},
        scripts: pkgData.scripts || {}
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get list of installed packages recorded in database or npm global list
  router.get('/history', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM installed_packages ORDER BY installed_at DESC LIMIT 50');
      res.json({ success: true, history: rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Install package (NPM, Pip, etc.)
  router.post('/install', async (req, res) => {
    const {
      packageName,
      manager = 'npm', // 'npm' or 'pip'
      isGlobal = false,
      isDev = false,
      targetDir
    } = req.body;

    if (!packageName && manager !== 'npm_all') {
      return res.status(400).json({ success: false, error: 'Package name is required' });
    }

    const workingDir = targetDir ? path.resolve(targetDir) : path.resolve(__dirname, '../../');
    let command = '';

    if (manager === 'npm') {
      const globalFlag = isGlobal ? '-g ' : '';
      const devFlag = isDev ? '--save-dev ' : '';
      command = `npm install ${globalFlag}${devFlag}${packageName}`;
    } else if (manager === 'npm_all') {
      command = 'npm install';
    } else if (manager === 'pip') {
      command = `pip install ${packageName}`;
    } else {
      command = `npm install ${packageName}`;
    }

    const startTime = Date.now();

    exec(command, { cwd: workingDir, maxBuffer: 10 * 1024 * 1024 }, async (error, stdout, stderr) => {
      const executionTime = ((Date.now() - startTime) / 1000).toFixed(1);
      const isSuccess = !error;

      // Log into database
      if (pool) {
        try {
          if (isSuccess && packageName) {
            await pool.query(
              'INSERT INTO installed_packages (package_name, package_type, scope) VALUES (?, ?, ?)',
              [packageName, manager, isGlobal ? 'global' : 'local']
            );
          }

          await pool.query(
            'INSERT INTO activity_logs (module, action, status, details) VALUES (?, ?, ?, ?)',
            [
              'PACKAGES',
              `Command: ${command}`,
              isSuccess ? 'success' : 'failed',
              `Dir: ${workingDir} (${executionTime}s)\n${(stdout || stderr || '').substring(0, 400)}`
            ]
          );
        } catch (dbErr) {
          console.error('Error logging package install:', dbErr);
        }
      }

      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message,
          stdout: stdout || '',
          stderr: stderr || '',
          command,
          time: executionTime
        });
      }

      res.json({
        success: true,
        message: `Package installed successfully! (${executionTime}s)`,
        stdout,
        stderr,
        command,
        time: executionTime
      });
    });
  });

  // Uninstall package
  router.post('/uninstall', async (req, res) => {
    const { packageName, targetDir, isGlobal = false } = req.body;
    if (!packageName) return res.status(400).json({ success: false, error: 'Package name required' });

    const workingDir = targetDir ? path.resolve(targetDir) : path.resolve(__dirname, '../../');
    const command = `npm uninstall ${isGlobal ? '-g ' : ''}${packageName}`;

    exec(command, { cwd: workingDir }, async (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ success: false, error: error.message, stdout, stderr });
      }

      if (pool) {
        await pool.query('DELETE FROM installed_packages WHERE package_name = ?', [packageName]);
        await pool.query(
          'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
          ['PACKAGES', `Uninstalled ${packageName}`, `Dir: ${workingDir}`]
        );
      }

      res.json({ success: true, message: `Package ${packageName} uninstalled`, stdout });
    });
  });

  // Run NPM Script (e.g., "build", "start", "test")
  router.post('/run-script', (req, res) => {
    const { scriptName, targetDir } = req.body;
    if (!scriptName) return res.status(400).json({ success: false, error: 'Script name required' });

    const workingDir = targetDir ? path.resolve(targetDir) : path.resolve(__dirname, '../../');
    const command = `npm run ${scriptName}`;

    exec(command, { cwd: workingDir, maxBuffer: 10 * 1024 * 1024 }, async (error, stdout, stderr) => {
      if (pool) {
        await pool.query(
          'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
          ['PACKAGES', `Executed script: npm run ${scriptName}`, `Dir: ${workingDir}`]
        );
      }

      if (error) {
        return res.status(500).json({ success: false, error: error.message, stdout, stderr });
      }

      res.json({ success: true, message: `Script '${scriptName}' executed successfully`, stdout, stderr });
    });
  });

  return router;
};

