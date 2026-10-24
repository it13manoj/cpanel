const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AdmZip = require('adm-zip');

// Root directory for file manager - defaults to project or hosting_data
const defaultBaseDir = path.resolve(__dirname, '../../');

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../../uploads_temp')
});

// Ensure upload temp directory exists
if (!fs.existsSync(path.join(__dirname, '../../uploads_temp'))) {
  fs.mkdirSync(path.join(__dirname, '../../uploads_temp'), { recursive: true });
}

function resolveSafePath(targetPath) {
  if (!targetPath) return defaultBaseDir;
  const resolved = path.resolve(defaultBaseDir, targetPath);
  return resolved;
}

function getFilePermissions(stats) {
  const mode = stats.mode;
  // Convert mode to octal string representation e.g. '0755'
  const octal = '0' + (mode & parseInt('777', 8)).toString(8);
  return octal;
}

module.exports = (pool) => {
  // List files and directories in a path
  router.get('/list', async (req, res) => {
    try {
      const requestedPath = req.query.path ? req.query.path.toString() : '';
      const currentDir = resolveSafePath(requestedPath);

      if (!fs.existsSync(currentDir)) {
        return res.status(404).json({ success: false, error: 'Directory does not exist' });
      }

      const dirStat = fs.statSync(currentDir);
      if (!dirStat.isDirectory()) {
        return res.status(400).json({ success: false, error: 'Path is not a directory' });
      }

      const items = fs.readdirSync(currentDir);
      const fileList = [];

      for (const item of items) {
        // Skip node_modules/.git details if desired or include them
        try {
          const itemPath = path.join(currentDir, item);
          const stats = fs.statSync(itemPath);
          const isDir = stats.isDirectory();

          fileList.push({
            name: item,
            isDirectory: isDir,
            size: isDir ? 0 : stats.size,
            mtime: stats.mtime,
            permissions: getFilePermissions(stats),
            extension: isDir ? '' : path.extname(item).toLowerCase()
          });
        } catch (e) {
          // In case of permission error on specific file
        }
      }

      // Sort: directories first, then alphabetically
      fileList.sort((a, b) => {
        if (a.isDirectory === b.isDirectory) {
          return a.name.localeCompare(b.name);
        }
        return a.isDirectory ? -1 : 1;
      });

      // Relative path from base
      const relPath = path.relative(defaultBaseDir, currentDir).replace(/\\/g, '/');

      res.json({
        success: true,
        currentPath: relPath,
        absolutePath: currentDir,
        items: fileList
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Read file contents (for Code Editor)
  router.get('/read', async (req, res) => {
    try {
      const filePath = resolveSafePath(req.query.path);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: 'File not found' });
      }

      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        return res.status(400).json({ success: false, error: 'Cannot read directory as file' });
      }

      // Read max 2MB into memory for editor
      if (stats.size > 2 * 1024 * 1024) {
        return res.status(400).json({ success: false, error: 'File too large to open in web editor (> 2MB)' });
      }

      const content = fs.readFileSync(filePath, 'utf8');
      res.json({
        success: true,
        path: req.query.path,
        content,
        size: stats.size,
        mtime: stats.mtime,
        permissions: getFilePermissions(stats)
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Save / Update file contents
  router.post('/save', async (req, res) => {
    try {
      const { filePath, content } = req.body;
      if (!filePath) return res.status(400).json({ success: false, error: 'Path is required' });

      const targetPath = resolveSafePath(filePath);
      fs.writeFileSync(targetPath, content || '', 'utf8');

      if (pool) {
        await pool.query(
          'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
          ['FILE_MANAGER', `Edited file: ${filePath}`, `Size: ${(content || '').length} bytes`]
        );
      }

      res.json({ success: true, message: 'File saved successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create new file or folder
  router.post('/create', async (req, res) => {
    try {
      const { parentPath, name, type } = req.body; // type: 'file' or 'folder'
      if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

      const targetDir = resolveSafePath(parentPath);
      const targetPath = path.join(targetDir, name);

      if (fs.existsSync(targetPath)) {
        return res.status(400).json({ success: false, error: 'Item already exists' });
      }

      if (type === 'folder') {
        fs.mkdirSync(targetPath, { recursive: true });
      } else {
        fs.writeFileSync(targetPath, '', 'utf8');
      }

      if (pool) {
        await pool.query(
          'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
          ['FILE_MANAGER', `Created ${type}: ${name}`, `In path: ${parentPath || '/'}`]
        );
      }

      res.json({ success: true, message: `${type === 'folder' ? 'Folder' : 'File'} created successfully` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Rename item
  router.post('/rename', async (req, res) => {
    try {
      const { oldPath, newName } = req.body;
      if (!oldPath || !newName) return res.status(400).json({ success: false, error: 'Missing parameters' });

      const targetOld = resolveSafePath(oldPath);
      const targetDir = path.dirname(targetOld);
      const targetNew = path.join(targetDir, newName);

      if (fs.existsSync(targetNew)) {
        return res.status(400).json({ success: false, error: 'Destination already exists' });
      }

      fs.renameSync(targetOld, targetNew);

      res.json({ success: true, message: 'Renamed successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete file or folder
  router.post('/delete', async (req, res) => {
    try {
      const { targetPath } = req.body;
      if (!targetPath) return res.status(400).json({ success: false, error: 'Target path required' });

      const resolved = resolveSafePath(targetPath);
      if (!fs.existsSync(resolved)) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }

      const stats = fs.statSync(resolved);
      if (stats.isDirectory()) {
        fs.rmSync(resolved, { recursive: true, force: true });
      } else {
        fs.unlinkSync(resolved);
      }

      if (pool) {
        await pool.query(
          'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
          ['FILE_MANAGER', `Deleted item: ${targetPath}`, `Path: ${resolved}`]
        );
      }

      res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Batch delete multiple files or folders
  router.post('/delete-multiple', async (req, res) => {
    try {
      const { paths } = req.body;
      if (!Array.isArray(paths) || paths.length === 0) {
        return res.status(400).json({ success: false, error: 'Array of paths required' });
      }

      let deletedCount = 0;
      const errors = [];

      for (const itemPath of paths) {
        try {
          const resolved = resolveSafePath(itemPath);
          if (fs.existsSync(resolved)) {
            const stats = fs.statSync(resolved);
            if (stats.isDirectory()) {
              fs.rmSync(resolved, { recursive: true, force: true });
            } else {
              fs.unlinkSync(resolved);
            }
            deletedCount++;
          }
        } catch (itemErr) {
          errors.push({ path: itemPath, error: itemErr.message });
        }
      }

      if (pool) {
        await pool.query(
          'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
          ['FILE_MANAGER', `Batch deleted ${deletedCount} item(s)`, `Requested: ${paths.length} items`]
        );
      }

      res.json({
        success: true,
        deletedCount,
        errors,
        message: `Successfully deleted ${deletedCount} item(s)`
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Change permissions (chmod)
  router.post('/chmod', async (req, res) => {
    try {
      const { targetPath, mode } = req.body; // mode: e.g. "0755" or "755"
      if (!targetPath || !mode) return res.status(400).json({ success: false, error: 'Target and mode required' });

      const resolved = resolveSafePath(targetPath);
      if (!fs.existsSync(resolved)) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }

      try {
        fs.chmodSync(resolved, parseInt(mode, 8));
      } catch (chmodErr) {
        // On Windows chmod is limited to readonly flags, but we record permission in cPanel state
        console.warn('chmod on current OS:', chmodErr.message);
      }

      if (pool) {
        await pool.query(
          'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
          ['PERMISSIONS', `Updated permissions for ${targetPath}`, `Mode: ${mode}`]
        );
      }

      res.json({ success: true, message: `Permissions updated to ${mode}` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Upload file(s)
  router.post('/upload', upload.array('files'), async (req, res) => {
    try {
      const targetDir = resolveSafePath(req.body.destination || '');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const uploadedFiles = [];
      for (const file of req.files) {
        const destPath = path.join(targetDir, file.originalname);
        fs.copyFileSync(file.path, destPath);
        fs.unlinkSync(file.path); // clean temp
        uploadedFiles.push(file.originalname);
      }

      if (pool) {
        await pool.query(
          'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
          ['FILE_MANAGER', `Uploaded ${uploadedFiles.length} file(s)`, `Dest: ${req.body.destination || '/'}`]
        );
      }

      res.json({ success: true, message: `${uploadedFiles.length} file(s) uploaded successfully`, files: uploadedFiles });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Download file
  router.get('/download', (req, res) => {
    try {
      const target = resolveSafePath(req.query.path);
      if (!fs.existsSync(target)) {
        return res.status(404).send('File not found');
      }
      res.download(target);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // Extract Archive (.zip)
  router.post('/extract', async (req, res) => {
    try {
      const { zipPath, extractTo } = req.body;
      const targetZip = resolveSafePath(zipPath);
      const targetDest = resolveSafePath(extractTo || path.dirname(zipPath));

      if (!fs.existsSync(targetZip)) {
        return res.status(404).json({ success: false, error: 'Zip file not found' });
      }

      const zip = new AdmZip(targetZip);
      zip.extractAllTo(targetDest, true);

      res.json({ success: true, message: 'Archive extracted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};

