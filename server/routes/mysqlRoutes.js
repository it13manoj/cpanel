const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

module.exports = (pool, dbConfig) => {
  // Get all databases on the MySQL server
  router.get('/databases', async (req, res) => {
    try {
      const [rows] = await pool.query('SHOW DATABASES');
      const databases = rows.map(r => Object.values(r)[0]);
      
      let dbDetails = [];
      try {
        const [sizeRows] = await pool.query(`
          SELECT table_schema AS "db_name", 
                 ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS "size_mb",
                 COUNT(table_name) AS "tables_count"
          FROM information_schema.tables 
          GROUP BY table_schema
        `);
        const sizeMap = {};
        sizeRows.forEach(s => {
          sizeMap[s.db_name] = { size_mb: s.size_mb || 0, tables_count: s.tables_count || 0 };
        });

        dbDetails = databases.map(name => ({
          name,
          size_mb: sizeMap[name]?.size_mb || 0,
          tables_count: sizeMap[name]?.tables_count || 0,
          is_system: ['information_schema', 'mysql', 'performance_schema', 'sys'].includes(name)
        }));
      } catch (e) {
        dbDetails = databases.map(name => ({
          name,
          size_mb: 0,
          tables_count: 0,
          is_system: ['information_schema', 'mysql', 'performance_schema', 'sys'].includes(name)
        }));
      }

      res.json({ success: true, databases: dbDetails });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create a new database
  router.post('/databases', async (req, res) => {
    try {
      const { db_name, charset = 'utf8mb4', collation = 'utf8mb4_unicode_ci' } = req.body;
      if (!db_name) {
        return res.status(400).json({ success: false, error: 'Database name is required' });
      }

      const cleanDbName = db_name.trim().replace(/[^a-zA-Z0-9_]/g, '_');

      await pool.query(`CREATE DATABASE \`${cleanDbName}\` CHARACTER SET ${mysql.escapeId(charset).replace(/'/g, '')} COLLATE ${mysql.escapeId(collation).replace(/'/g, '')}`);

      try {
        await pool.query(
          'INSERT INTO `cpanel`.`managed_databases` (db_name, charset) VALUES (?, ?) ON DUPLICATE KEY UPDATE charset = ?',
          [cleanDbName, charset, charset]
        );

        await pool.query(
          'INSERT INTO `cpanel`.`activity_logs` (module, action, details) VALUES (?, ?, ?)',
          ['MYSQL', `Created Database: ${cleanDbName}`, `Charset: ${charset}, Collation: ${collation}`]
        );
      } catch (e) {}

      res.json({ success: true, message: `Database '${cleanDbName}' created successfully!`, db_name: cleanDbName });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Drop a database
  router.delete('/databases/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const cleanDbName = name.trim().replace(/[^a-zA-Z0-9_]/g, '');

      const protectedDbs = ['information_schema', 'mysql', 'performance_schema', 'sys', 'cpanel'];
      if (protectedDbs.includes(cleanDbName.toLowerCase())) {
        return res.status(403).json({ success: false, error: `Database '${cleanDbName}' is a critical system database and cannot be deleted.` });
      }

      await pool.query(`DROP DATABASE \`${cleanDbName}\``);
      try {
        await pool.query('DELETE FROM `cpanel`.`managed_databases` WHERE db_name = ?', [cleanDbName]);
        await pool.query(
          'INSERT INTO `cpanel`.`activity_logs` (module, action, details) VALUES (?, ?, ?)',
          ['MYSQL', `Dropped Database: ${cleanDbName}`, 'Database removed']
        );
      } catch (e) {}

      res.json({ success: true, message: `Database '${cleanDbName}' deleted.` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get all MySQL users
  router.get('/users', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT User, Host FROM mysql.user ORDER BY User ASC');
      res.json({ success: true, users: rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create MySQL user and grant privileges
  router.post('/users', async (req, res) => {
    try {
      const { username, password, host = '%', database = null } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
      }

      const cleanUser = username.trim().replace(/[^a-zA-Z0-9_]/g, '');
      const cleanHost = host.trim();

      await pool.query(`CREATE USER IF NOT EXISTS '${cleanUser}'@'${cleanHost}' IDENTIFIED BY ?`, [password]);

      if (database) {
        const cleanDb = database.trim().replace(/[^a-zA-Z0-9_]/g, '');
        await pool.query(`GRANT ALL PRIVILEGES ON \`${cleanDb}\`.* TO '${cleanUser}'@'${cleanHost}'`);
        await pool.query('FLUSH PRIVILEGES');
      }

      try {
        await pool.query(
          'INSERT INTO `cpanel`.`activity_logs` (module, action, details) VALUES (?, ?, ?)',
          ['MYSQL', `Created DB User: ${cleanUser}@${cleanHost}`, `Granted to DB: ${database || 'None'}`]
        );
      } catch (e) {}

      res.json({ success: true, message: `User '${cleanUser}'@'${cleanHost}' created successfully!` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete MySQL user
  router.delete('/users/:username', async (req, res) => {
    try {
      const { username } = req.params;
      const host = req.query.host || '%';
      const cleanUser = username.trim().replace(/[^a-zA-Z0-9_]/g, '');

      if (cleanUser.toLowerCase() === 'root') {
        return res.status(403).json({ success: false, error: 'Cannot delete root user!' });
      }

      await pool.query(`DROP USER '${cleanUser}'@'${host}'`);

      try {
        await pool.query(
          'INSERT INTO `cpanel`.`activity_logs` (module, action, details) VALUES (?, ?, ?)',
          ['MYSQL', `Dropped DB User: ${cleanUser}@${host}`, 'User removed']
        );
      } catch (e) {}

      res.json({ success: true, message: `User '${cleanUser}'@'${host}' removed.` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get Tables in a Database
  router.get('/databases/:name/tables', async (req, res) => {
    try {
      const { name } = req.params;
      const cleanDbName = name.trim().replace(/[^a-zA-Z0-9_]/g, '');
      const [rows] = await pool.query(`SHOW TABLES FROM \`${cleanDbName}\``);
      const tables = rows.map(r => Object.values(r)[0]);
      res.json({ success: true, tables });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // View Table Data (Browse)
  router.get('/databases/:db/tables/:table/data', async (req, res) => {
    try {
      const { db, table } = req.params;
      const cleanDb = db.trim().replace(/[^a-zA-Z0-9_]/g, '');
      const cleanTable = table.trim().replace(/[^a-zA-Z0-9_]/g, '');

      const [schema] = await pool.query(`DESCRIBE \`${cleanDb}\`.\`${cleanTable}\``);
      const [rows] = await pool.query(`SELECT * FROM \`${cleanDb}\`.\`${cleanTable}\` LIMIT 100`);

      res.json({
        success: true,
        schema,
        rows,
        total: rows.length
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Run Custom SQL Query
  router.post('/query', async (req, res) => {
    let conn;
    try {
      const { query, database } = req.body;
      if (!query || !query.trim()) {
        return res.status(400).json({ success: false, error: 'Query is required' });
      }

      const startTime = Date.now();
      
      // Get a dedicated connection from pool
      conn = await pool.getConnection();

      // Switch to the target database if specified
      if (database) {
        const cleanDb = database.trim().replace(/[^a-zA-Z0-9_]/g, '');
        await conn.query(`USE \`${cleanDb}\``);
      }

      const [result, fields] = await conn.query(query);
      const executionTimeMs = Date.now() - startTime;

      let columns = [];
      let rows = [];
      let affectedRows = 0;

      if (Array.isArray(result)) {
        rows = result;
        if (fields && fields.length > 0) {
          columns = fields.map(f => f.name);
        } else if (rows.length > 0) {
          columns = Object.keys(rows[0]);
        }
      } else if (result && typeof result === 'object') {
        affectedRows = result.affectedRows || 0;
      }

      // Safely log activity to cpanel.activity_logs
      try {
        await pool.query(
          'INSERT INTO `cpanel`.`activity_logs` (module, action, details) VALUES (?, ?, ?)',
          ['SQL_QUERY', `Executed query on ${database || 'default'}`, query.substring(0, 150)]
        );
      } catch (logErr) {}

      res.json({
        success: true,
        executionTimeMs,
        columns,
        rows,
        affectedRows,
        isSelect: Array.isArray(result)
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    } finally {
      if (conn) {
        // Reset connection back to cpanel database before returning to pool
        try {
          await conn.query('USE `cpanel`');
        } catch (e) {}
        conn.release();
      }
    }
  });

  return router;
};
