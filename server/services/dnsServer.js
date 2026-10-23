const dns2 = require('dns2');
const { Packet } = dns2;
const os = require('os');
const https = require('https');

let cachedServerIp = null;

async function getPublicServerIP() {
  if (cachedServerIp) return cachedServerIp;
  if (process.env.SERVER_IP) {
    cachedServerIp = process.env.SERVER_IP;
    return cachedServerIp;
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
      cachedServerIp = ip;
      return cachedServerIp;
    }
  } catch (e) {}

  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (config.family === 'IPv4' && !config.internal) {
        cachedServerIp = config.address;
        return cachedServerIp;
      }
    }
  }
  return '127.0.0.1';
}

function startDnsServer(pool) {
  try {
    const server = dns2.createServer({
      udp: true,
      handle: async (request, send, rinfo) => {
        const response = Packet.createResponseFromRequest(request);
        const [question] = request.questions;
        if (!question) return send(response);

        const rawName = (question.name || '').toLowerCase();
        const cleanName = rawName.replace(/\.$/, '');
        const qType = question.type;

        const serverIp = await getPublicServerIP();

        // 1. Authoritative Answer for Nameservers (ns1.<domain>, ns2.<domain>)
        if (cleanName.startsWith('ns1.') || cleanName.startsWith('ns2.')) {
          if (qType === Packet.TYPE.A) {
            response.answers.push({
              name: rawName,
              type: Packet.TYPE.A,
              class: Packet.CLASS.IN,
              ttl: 300,
              address: serverIp
            });
            return send(response);
          }
        }

        // 2. Query dns_records database for matching records
        try {
          const [records] = await pool.query(
            'SELECT * FROM `cpanel`.`dns_records` WHERE LOWER(name) = ? OR LOWER(name) = ? OR LOWER(domain_name) = ?',
            [rawName, `${cleanName}.`, cleanName]
          );

          if (records.length > 0) {
            for (const rec of records) {
              const recType = (rec.record_type || '').toUpperCase();

              if (qType === Packet.TYPE.A && recType === 'A') {
                const targetIp = /^\d+\.\d+\.\d+\.\d+$/.test(rec.value.trim()) ? rec.value.trim() : serverIp;
                response.answers.push({
                  name: rawName,
                  type: Packet.TYPE.A,
                  class: Packet.CLASS.IN,
                  ttl: rec.ttl || 300,
                  address: targetIp
                });
              } else if (qType === Packet.TYPE.NS && recType === 'NS') {
                response.answers.push({
                  name: rawName,
                  type: Packet.TYPE.NS,
                  class: Packet.CLASS.IN,
                  ttl: rec.ttl || 300,
                  ns: rec.value.replace(/\.$/, '')
                });
              } else if (qType === Packet.TYPE.CNAME && recType === 'CNAME') {
                response.answers.push({
                  name: rawName,
                  type: Packet.TYPE.CNAME,
                  class: Packet.CLASS.IN,
                  ttl: rec.ttl || 300,
                  domain: rec.value.replace(/\.$/, '')
                });
              } else if (qType === Packet.TYPE.TXT && recType === 'TXT') {
                response.answers.push({
                  name: rawName,
                  type: Packet.TYPE.TXT,
                  class: Packet.CLASS.IN,
                  ttl: rec.ttl || 300,
                  data: [rec.value]
                });
              }
            }
          }
        } catch (dbErr) {
          console.warn('DNS DB lookup error:', dbErr.message);
        }

        // 3. Fallback: If domain is registered in cPanel domains table, resolve A record to server IP
        if (response.answers.length === 0 && (qType === Packet.TYPE.A || qType === Packet.TYPE.ANY)) {
          try {
            const baseDomain = cleanName.replace(/^(?:www|mail|ftp)\./, '');
            const [domRows] = await pool.query(
              'SELECT id FROM `cpanel`.`domains` WHERE LOWER(domain_name) = ?',
              [baseDomain]
            );
            if (domRows.length > 0) {
              response.answers.push({
                name: rawName,
                type: Packet.TYPE.A,
                class: Packet.CLASS.IN,
                ttl: 300,
                address: serverIp
              });
            }
          } catch (e) {}
        }

        send(response);
      }
    });

    server.listen({
      udp: { port: 53, address: '0.0.0.0' },
      tcp: { port: 53, address: '0.0.0.0' }
    }).then(() => {
      console.log('📡 Authoritative DNS Nameserver is LIVE on Port 53 (UDP/TCP)');
    }).catch(err => {
      console.warn(`ℹ️ Port 53 DNS listener notice: ${err.message}`);
    });

    return server;
  } catch (err) {
    console.warn(`⚠️ Could not initialize DNS server: ${err.message}`);
    return null;
  }
}

module.exports = { startDnsServer };

