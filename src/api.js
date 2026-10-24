const API_BASE = process.env.REACT_APP_API_URL || (
  typeof window !== 'undefined' && window.location.origin
    ? `${window.location.origin}/api`
    : 'http://localhost:5200/api'
);

async function fetchJSON(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json'
  };

  const res = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return data;
}

export const api = {
  // System
  getSystemMetrics: () => fetchJSON('/system'),

  // Auth & Panel Users
  login: (username, password) => fetchJSON('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getPanelUsers: () => fetchJSON('/auth/users'),
  createPanelUser: (data) => fetchJSON('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  deletePanelUser: (id) => fetchJSON(`/auth/users/${id}`, { method: 'DELETE' }),
  changePassword: (data) => fetchJSON('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

  // 1-Click App Installer
  getTemplates: () => fetchJSON('/installer/templates'),
  installApp: (data) => fetchJSON('/installer/install', { method: 'POST', body: JSON.stringify(data) }),

  // Storage & Space Isolation & Cleaner
  getQuotas: () => fetchJSON('/storage/quotas'),
  updateQuota: (id, quotaMb) => fetchJSON(`/storage/quotas/${id}`, { method: 'PATCH', body: JSON.stringify({ quotaMb }) }),
  cleanServerSpace: () => fetchJSON('/storage/clean-space', { method: 'POST' }),
  generateSSL: (domainId, domainName) => fetchJSON('/storage/generate-ssl', { method: 'POST', body: JSON.stringify({ domainId, domainName }) }),

  // DNS Zone Editor & Nameservers
  getDnsRecords: (domain) => fetchJSON(`/dns/records?domain=${encodeURIComponent(domain)}`),
  addDnsRecord: (data) => fetchJSON('/dns/records', { method: 'POST', body: JSON.stringify(data) }),
  updateDnsRecord: (id, data) => fetchJSON(`/dns/records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDnsRecord: (id) => fetchJSON(`/dns/records/${id}`, { method: 'DELETE' }),
  resetDnsZone: (domain) => fetchJSON('/dns/reset', { method: 'POST', body: JSON.stringify({ domain }) }),

  // Domains
  getDomains: () => fetchJSON('/domains'),
  createDomain: (data) => fetchJSON('/domains', { method: 'POST', body: JSON.stringify(data) }),
  toggleSSL: (id) => fetchJSON(`/domains/${id}/ssl`, { method: 'PATCH' }),
  deleteDomain: (id) => fetchJSON(`/domains/${id}`, { method: 'DELETE' }),

  // MySQL
  getDatabases: () => fetchJSON('/mysql/databases'),
  createDatabase: (data) => fetchJSON('/mysql/databases', { method: 'POST', body: JSON.stringify(data) }),
  deleteDatabase: (name) => fetchJSON(`/mysql/databases/${name}`, { method: 'DELETE' }),
  getDbUsers: () => fetchJSON('/mysql/users'),
  createDbUser: (data) => fetchJSON('/mysql/users', { method: 'POST', body: JSON.stringify(data) }),
  deleteDbUser: (username, host) => fetchJSON(`/mysql/users/${username}?host=${encodeURIComponent(host || '%')}`, { method: 'DELETE' }),
  getDbTables: (dbName) => fetchJSON(`/mysql/databases/${dbName}/tables`),
  getTableData: (dbName, tableName) => fetchJSON(`/mysql/databases/${dbName}/tables/${tableName}/data`),
  executeSQL: (query, database) => fetchJSON('/mysql/query', { method: 'POST', body: JSON.stringify({ query, database }) }),

  // File Manager
  listFiles: (path = '') => fetchJSON(`/files/list?path=${encodeURIComponent(path)}`),
  readFile: (path) => fetchJSON(`/files/read?path=${encodeURIComponent(path)}`),
  saveFile: (filePath, content) => fetchJSON('/files/save', { method: 'POST', body: JSON.stringify({ filePath, content }) }),
  createItem: (parentPath, name, type) => fetchJSON('/files/create', { method: 'POST', body: JSON.stringify({ parentPath, name, type }) }),
  renameItem: (oldPath, newName) => fetchJSON('/files/rename', { method: 'POST', body: JSON.stringify({ oldPath, newName }) }),
  deleteItem: (targetPath) => fetchJSON('/files/delete', { method: 'POST', body: JSON.stringify({ targetPath }) }),
  chmodItem: (targetPath, mode) => fetchJSON('/files/chmod', { method: 'POST', body: JSON.stringify({ targetPath, mode }) }),
  extractZip: (zipPath, extractTo) => fetchJSON('/files/extract', { method: 'POST', body: JSON.stringify({ zipPath, extractTo }) }),
  uploadFiles: async (formData) => {
    const res = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  // Dependencies & Packages
  getProjectDeps: (targetPath = '') => fetchJSON(`/packages/project-dependencies?path=${encodeURIComponent(targetPath)}`),
  installPackage: (data) => fetchJSON('/packages/install', { method: 'POST', body: JSON.stringify(data) }),
  uninstallPackage: (data) => fetchJSON('/packages/uninstall', { method: 'POST', body: JSON.stringify(data) }),
  runScript: (scriptName, targetDir) => fetchJSON('/packages/run-script', { method: 'POST', body: JSON.stringify({ scriptName, targetDir }) }),
  getPackageHistory: () => fetchJSON('/packages/history'),

  // FTP & Permissions
  getFTPUsers: () => fetchJSON('/ftp/users'),
  createFTPUser: (data) => fetchJSON('/ftp/users', { method: 'POST', body: JSON.stringify(data) }),
  deleteFTPUser: (id) => fetchJSON(`/ftp/users/${id}`, { method: 'DELETE' }),
  fixPermissions: (targetDir) => fetchJSON('/ftp/fix-permissions', { method: 'POST', body: JSON.stringify({ targetDir }) }),

  // Terminal & Logs
  execTerminal: (command, cwd) => fetchJSON('/terminal/exec', { method: 'POST', body: JSON.stringify({ command, cwd }) }),
  getLogs: () => fetchJSON('/terminal/logs'),
  clearLogs: () => fetchJSON('/terminal/logs', { method: 'DELETE' }),

  // Apps & PM2 Process Manager
  getApps: () => fetchJSON('/apps'),
  createApp: (data) => fetchJSON('/apps', { method: 'POST', body: JSON.stringify(data) }),
  startApp: (id) => fetchJSON(`/apps/${id}/start`, { method: 'POST' }),
  stopApp: (id) => fetchJSON(`/apps/${id}/stop`, { method: 'POST' }),
  restartApp: (id) => fetchJSON(`/apps/${id}/restart`, { method: 'POST' }),
  installAppDeps: (id) => fetchJSON(`/apps/${id}/install-deps`, { method: 'POST' }),
  getAppLogs: (id, lines = 100) => fetchJSON(`/apps/${id}/logs?lines=${lines}`),
  getPM2Status: () => fetchJSON('/apps/pm2/status'),
  deleteApp: (id) => fetchJSON(`/apps/${id}`, { method: 'DELETE' }),

  // Cron
  getCronJobs: () => fetchJSON('/cron'),
  createCronJob: (data) => fetchJSON('/cron', { method: 'POST', body: JSON.stringify(data) }),
  toggleCronJob: (id) => fetchJSON(`/cron/${id}/toggle`, { method: 'PATCH' }),
  runCronJobNow: (id) => fetchJSON(`/cron/${id}/run`, { method: 'POST' }),
  deleteCronJob: (id) => fetchJSON(`/cron/${id}`, { method: 'DELETE' })
};
