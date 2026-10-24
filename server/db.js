const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME || 'cpanel',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
};

let pool;

async function initDB() {
  try {
    // Connect to MySQL server without database first to ensure database exists
    const rootConn = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConn.end();

    // Now connect to cpanel pool
    pool = mysql.createPool(dbConfig);

    // Create required tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`domains\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`domain_name\` VARCHAR(255) NOT NULL UNIQUE,
        \`doc_root\` VARCHAR(500) NOT NULL,
        \`proxy_type\` VARCHAR(50) DEFAULT 'static',
        \`proxy_port\` INT NULL,
        \`ssl_enabled\` TINYINT(1) DEFAULT 0,
        \`ssl_cert_path\` VARCHAR(500) NULL,
        \`ssl_key_path\` VARCHAR(500) NULL,
        \`disk_quota_mb\` INT DEFAULT 1000,
        \`status\` VARCHAR(50) DEFAULT 'active',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS \`managed_databases\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`db_name\` VARCHAR(100) NOT NULL UNIQUE,
        \`db_user\` VARCHAR(100) NULL,
        \`charset\` VARCHAR(50) DEFAULT 'utf8mb4',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS \`ftp_users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`username\` VARCHAR(100) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`root_path\` VARCHAR(500) NOT NULL,
        \`permission_level\` VARCHAR(50) DEFAULT 'read_write',
        \`disk_quota_mb\` INT DEFAULT 500,
        \`status\` VARCHAR(50) DEFAULT 'active',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS \`panel_users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`username\` VARCHAR(100) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`role\` VARCHAR(50) DEFAULT 'user',
        \`allocated_domain\` VARCHAR(255) NULL,
        \`disk_quota_mb\` INT DEFAULT 500,
        \`status\` VARCHAR(50) DEFAULT 'active',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS \`installed_packages\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`package_name\` VARCHAR(255) NOT NULL,
        \`package_type\` VARCHAR(50) DEFAULT 'npm',
        \`version\` VARCHAR(100) NULL,
        \`scope\` VARCHAR(50) DEFAULT 'global',
        \`installed_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS \`managed_apps\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`app_name\` VARCHAR(100) NOT NULL UNIQUE,
        \`app_dir\` VARCHAR(500) NOT NULL,
        \`script\` VARCHAR(100) DEFAULT 'index.js',
        \`port\` INT NULL,
        \`status\` VARCHAR(50) DEFAULT 'stopped',
        \`pid\` INT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS \`cron_jobs\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(150) NOT NULL,
        \`schedule\` VARCHAR(100) NOT NULL,
        \`command\` TEXT NOT NULL,
        \`active\` TINYINT(1) DEFAULT 1,
        \`last_run\` TIMESTAMP NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS \`activity_logs\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`module\` VARCHAR(100) NOT NULL,
        \`action\` VARCHAR(255) NOT NULL,
        \`status\` VARCHAR(50) DEFAULT 'success',
        \`details\` TEXT NULL,
        \`ip_address\` VARCHAR(50) DEFAULT '173.212.235.87',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS \`dns_records\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`domain_id\` INT NULL,
        \`domain_name\` VARCHAR(255) NOT NULL,
        \`record_type\` VARCHAR(10) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`ttl\` INT DEFAULT 14400,
        \`value\` TEXT NOT NULL,
        \`priority\` INT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (\`domain_name\`),
        INDEX (\`record_type\`)
      ) ENGINE=InnoDB;
    `);

    // Ensure default panel users exist (Admin & Developer User)
    await pool.query(`
      INSERT INTO \`panel_users\` (\`username\`, \`password\`, \`role\`, \`disk_quota_mb\`)
      VALUES ('admin', 'admin123', 'admin', 50000)
      ON DUPLICATE KEY UPDATE \`role\` = 'admin';

      INSERT INTO \`panel_users\` (\`username\`, \`password\`, \`role\`, \`allocated_domain\`, \`disk_quota_mb\`)
      VALUES ('developer', 'dev123', 'user', 'example.local', 500)
      ON DUPLICATE KEY UPDATE \`role\` = 'user';
    `);

    console.log('✅ cPanel MySQL Database, Auth Users & Schema initialized successfully.');
    return pool;
  } catch (err) {
    console.error('❌ Error initializing MySQL Database:', err.message);
    throw err;
  }
}

module.exports = {
  getPool: () => pool,
  initDB,
  dbConfig
};
