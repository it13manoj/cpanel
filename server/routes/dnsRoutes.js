const express = require('express');
const router = express.Router();
const os = require('os');

function getServerIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (config.family === 'IPv4' && !config.internal) {
        return config.address;
      }
    }
  }
  return '127.0.0.1';
}

async function ensureDefaultDnsRecords(pool, domainId, domainName) {
  const [existing] = await pool.query('SELECT id FROM dns_records WHERE domain_name = ?', [domainName]);
  if (existing.length > 0) return;

  const serverIp = getServerIP();

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
      'INSERT INTO dns_records (domain_id, domain_name, record_type, name, ttl, value, priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [domainId, domainName, rec.type, rec.name, rec.ttl, rec.value, rec.priority]
    );
  }
}

module.exports = (pool) => {
  // Get DNS records for a domain
  router.get('/records', async (req, res) => {
    try {
      const { domain } = req.query;
      if (!domain) {
        return res.status(400).json({ success: false, error: 'Domain name required' });
      }

      // Check if domain exists
      const [domRows] = await pool.query('SELECT id, domain_name FROM domains WHERE domain_name = ?', [domain]);
      const domainId = domRows[0]?.id || null;

      // Auto-generate defaults if none exist
      await ensureDefaultDnsRecords(pool, domainId, domain);

      const [records] = await pool.query(
        'SELECT * FROM dns_records WHERE domain_name = ? ORDER BY record_type ASC, name ASC',
        [domain]
      );

      const serverIp = getServerIP();

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

      const [domRows] = await pool.query('SELECT id FROM domains WHERE domain_name = ?', [domain]);
      const domainId = domRows[0]?.id || null;

      const [result] = await pool.query(
        'INSERT INTO dns_records (domain_id, domain_name, record_type, name, ttl, value, priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [domainId, domain, record_type, recordName, parseInt(ttl, 10), recordValue, priority ? parseInt(priority, 10) : null]
      );

      await pool.query(
        'INSERT INTO activity_logs (module, action, details) VALUES (?, ?, ?)',
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
      const { id } = req.params;
      let { record_type, name, ttl = 14400, value, priority = null } = req.body;

      let recordName = name ? name.trim() : '';
      if (recordName && !recordName.endsWith('.')) recordName += '.';

      let recordValue = value ? value.trim() : '';
      if (['CNAME', 'NS', 'MX'].includes(record_type) && recordValue && !recordValue.endsWith('.') && !/^\d+\.\d+\.\d+\.\d+$/.test(recordValue)) {
        recordValue += '.';
      }

      await pool.query(
        'UPDATE dns_records SET record_type = ?, name = ?, ttl = ?, value = ?, priority = ? WHERE id = ?',
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
      const { id } = req.params;
      await pool.query('DELETE FROM dns_records WHERE id = ?', [id]);
      res.json({ success: true, message: 'DNS record deleted.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reset to default DNS Zone template
  router.post('/reset', async (req, res) => {
    try {
      const { domain } = req.body;
      if (!domain) return res.status(400).json({ success: false, error: 'Domain is required' });

      await pool.query('DELETE FROM dns_records WHERE domain_name = ?', [domain]);

      const [domRows] = await pool.query('SELECT id FROM domains WHERE domain_name = ?', [domain]);
      const domainId = domRows[0]?.id || null;

      await ensureDefaultDnsRecords(pool, domainId, domain);

      res.json({ success: true, message: `DNS Zone for '${domain}' reset to default template.` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};

