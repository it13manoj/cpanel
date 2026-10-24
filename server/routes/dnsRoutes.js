const express = require('express');
const router = express.Router();
const os = require('os');
const https = require('https');

let cachedPublicIp = null;

// Query public IP with fallback to local interface
async function getPublicServerIP() {
  if (cachedPublicIp) return cachedPublicIp;
  if (process.env.SERVER_IP) {
    cachedPublicIp = process.env.SERVER_IP;
    return cachedPublicIp;
  }

  try {
    const ip = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 2500);
      const req = https.get('https://api.ipify.org?format=json', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          clearTimeout(timeout);
          try { resolve(JSON.parse(data).ip); } catch (e) { resolve(null); }
        });
      });
      req.on('error', () => {
        clearTimeout(timeout);
        resolve(null);
      });
    });

    if (ip) {
      cachedPublicIp = ip;
      return cachedPublicIp;
    }
  } catch (e) {}

  // Fallback to local network interface
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (config.family === 'IPv4' && !config.internal) {
        cachedPublicIp = config.address;
        return cachedPublicIp;
      }
    }
  }

  return '173.212.235.87';
}

// Ensure the dns_records table exists
async function ensureDnsTable(pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`cpanel\`.\`dns_records\` (
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
  } catch (err) {
    console.warn('⚠️ DNS table verification notice:', err.message);
  }
}

// Pre-populate standard DNS records for newly added domain
async function ensureDefaultDnsRecords(pool, domainId, domainName) {
  await ensureDnsTable(pool);

  const [existing] = await pool.query('SELECT id FROM `cpanel`.`dns_records` WHERE domain_name = ?', [domainName]);
  if (existing.length > 0) return;

  const serverIp = await getPublicServerIP();

  const defaultRecords = [
    { type: 'A', name: `${domainName}.`, ttl: 14400, value: serverIp, priority: null },
    { type: 'A', name: `mail.${domainName}.`, ttl: 14400, value: serverIp, priority: null },
    { type: 'CNAME', name: `www.${domainName}.`, ttl: 14400, value: `${domainName}.`, priority: null },
    { type: 'CNAME', name: `ftp.${domainName}.`, ttl: 14400, value: `${domainName}.`, priority: null },
    { type: 'NS', name: `${domainName}.`, ttl: 86400, value: `ns1.${domainName}.`, priority: null },
    { type: 'NS', name: `${domainName}.`, ttl: 86400, value: `ns2.${domainName}.`, priority: null },
    { type: 'A', name: `ns1.${domainName}.`, ttl: 14400, value: serverIp, priority: null },
    { type: 'A', name: `ns2.${domainName}.`, ttl: 14400, value: serverIp, priority: null },
    { type: 'MX', name: `${domainName}.`, ttl: 14400, value: `mail.${domainName}.`, priority: 10 },
    { type: 'TXT', name: `${domainName}.`, ttl: 14400, value: 'v=spf1 a mx ?all', priority: null }
  ];

  for (const rec of defaultRecords) {
    await pool.query(
      'INSERT INTO `cpanel`.`dns_records` (domain_id, domain_name, record_type, name, ttl, value, priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [domainId, domainName, rec.type, rec.name, rec.ttl, rec.value, rec.priority]
    );
  }
}

module.exports = (pool) => {
  // Eagerly ensure table on module load
  ensureDnsTable(pool);

  // Get DNS records for a domain
  router.get('/records', async (req, res) => {
    try {
      await ensureDnsTable(pool);

      const { domain } = req.query;
      if (!domain) {
        return res.status(400).json({ success: false, error: 'Domain name required' });
      }

      // Check if domain exists
      const [domRows] = await pool.query('SELECT id, domain_name FROM `cpanel`.`domains` WHERE domain_name = ?', [domain]);
      const domainId = domRows[0]?.id || null;

      // Auto-generate defaults if none exist
      await ensureDefaultDnsRecords(pool, domainId, domain);

      const [records] = await pool.query(
        'SELECT * FROM `cpanel`.`dns_records` WHERE domain_name = ? ORDER BY record_type ASC, name ASC',
        [domain]
      );

      const serverIp = await getPublicServerIP();

      res.json({
        success: true,
        domain,
        serverIp,
        nameservers: [
          { ns: `ns1.${domain}`, ip: serverIp },
          { ns: `ns2.${domain}`, ip: serverIp }
        ],
        records
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Add DNS Record
  router.post('/records', async (req, res) => {
    try {
      await ensureDnsTable(pool);

      let { domain, record_type, name, ttl = 14400, value, priority = null } = req.body;
      if (!domain || !record_type || !name || !value) {
        return res.status(400).json({ success: false, error: 'Missing required DNS record parameters' });
      }

      record_type = record_type.toUpperCase();
      let recordName = name.trim();
      if (!recordName.endsWith('.')) recordName += '.';

      let recordValue = value.trim();
      if (['CNAME', 'NS', 'MX'].includes(record_type) && !recordValue.endsWith('.') && !/^\d+\.\d+\.\d+\.\d+$/.test(recordValue)) {
        recordValue += '.';
      }

      const [domRows] = await pool.query('SELECT id FROM `cpanel`.`domains` WHERE domain_name = ?', [domain]);
      const domainId = domRows[0]?.id || null;

      const [result] = await pool.query(
        'INSERT INTO `cpanel`.`dns_records` (domain_id, domain_name, record_type, name, ttl, value, priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [domainId, domain, record_type, recordName, parseInt(ttl, 10), recordValue, priority ? parseInt(priority, 10) : null]
      );

      await pool.query(
        'INSERT INTO `cpanel`.`activity_logs` (module, action, details) VALUES (?, ?, ?)',
        ['DNS_ZONE', `Added ${record_type} Record for ${domain}`, `${recordName} -> ${recordValue} (TTL: ${ttl})`]
      );

      res.json({
        success: true,
        message: `${record_type} record added successfully!`,
        id: result.insertId
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Edit DNS Record
  router.put('/records/:id', async (req, res) => {
    try {
      await ensureDnsTable(pool);

      const { id } = req.params;
      let { record_type, name, ttl = 14400, value, priority = null } = req.body;

      let recordName = name ? name.trim() : '';
      if (recordName && !recordName.endsWith('.')) recordName += '.';

      let recordValue = value ? value.trim() : '';
      if (['CNAME', 'NS', 'MX'].includes(record_type) && recordValue && !recordValue.endsWith('.') && !/^\d+\.\d+\.\d+\.\d+$/.test(recordValue)) {
        recordValue += '.';
      }

      await pool.query(
        'UPDATE `cpanel`.`dns_records` SET record_type = ?, name = ?, ttl = ?, value = ?, priority = ? WHERE id = ?',
        [record_type, recordName, parseInt(ttl, 10), recordValue, priority ? parseInt(priority, 10) : null, id]
      );

      res.json({ success: true, message: 'DNS record updated successfully.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete DNS Record
  router.delete('/records/:id', async (req, res) => {
    try {
      await ensureDnsTable(pool);

      const { id } = req.params;
      await pool.query('DELETE FROM `cpanel`.`dns_records` WHERE id = ?', [id]);
      res.json({ success: true, message: 'DNS record deleted.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reset to default DNS Zone template
  router.post('/reset', async (req, res) => {
    try {
      await ensureDnsTable(pool);

      const { domain } = req.body;
      if (!domain) return res.status(400).json({ success: false, error: 'Domain is required' });

      await pool.query('DELETE FROM `cpanel`.`dns_records` WHERE domain_name = ?', [domain]);

      const [domRows] = await pool.query('SELECT id FROM `cpanel`.`domains` WHERE domain_name = ?', [domain]);
      const domainId = domRows[0]?.id || null;

      await ensureDefaultDnsRecords(pool, domainId, domain);

      res.json({ success: true, message: `DNS Zone for '${domain}' reset to default template.` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};
