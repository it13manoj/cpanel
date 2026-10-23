import React from 'react';
import {
  Globe,
  Database,
  FolderTree,
  Package,
  Terminal,
  KeyRound,
  Cpu,
  Layers,
  HardDrive,
  Activity,
  Server,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from 'lucide-react';

export default function DashboardView({ metrics, setActiveTab, logs }) {
  const cpuUsage = metrics?.cpu?.usage ?? 0;
  const memTotalGb = metrics?.memory?.total ? (metrics.memory.total / (1024 ** 3)).toFixed(1) : 0;
  const memUsedGb = metrics?.memory?.used ? (metrics.memory.used / (1024 ** 3)).toFixed(1) : 0;
  const memPercent = metrics?.memory?.usagePercent ?? 0;
  const disk = metrics?.disks?.[0];
  const diskTotalGb = disk?.size ? (disk.size / (1024 ** 3)).toFixed(1) : 0;
  const diskUsedGb = disk?.used ? (disk.used / (1024 ** 3)).toFixed(1) : 0;
  const diskPercent = disk?.usePercent ?? 0;

  const quickActions = [
    { id: 'domains', label: 'Allocate Domain', desc: 'Add new domain & document root', icon: Globe, color: 'icon-cyan' },
    { id: 'mysql', label: 'MySQL Manager', desc: 'Create databases, users & run SQL', icon: Database, color: 'icon-amber' },
    { id: 'files', label: 'File Manager', desc: 'Browse, edit files & set chmod', icon: FolderTree, color: 'icon-blue' },
    { id: 'packages', label: 'Package Installer', desc: 'Install npm / pip dependencies', icon: Package, color: 'icon-emerald' },
    { id: 'ftp', label: 'FTP & Permissions', desc: 'Virtual FTP users & permission sync', icon: KeyRound, color: 'icon-purple' },
    { id: 'terminal', label: 'Web Terminal', desc: 'Execute server shell commands', icon: Terminal, color: 'icon-rose' }
  ];

  const formatUptime = (seconds) => {
    if (!seconds) return '0m';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d > 0 ? d + 'd ' : ''}${h > 0 ? h + 'h ' : ''}${m}m`;
  };

  return (
    <div className="view-container">
      {/* Welcome Banner */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <ShieldCheck size={16} />
            <span>Autonomous Server Management Ready</span>
          </div>
          <h1 className="hero-title">cPanel Server Dashboard</h1>
          <p className="hero-subtitle">
            Manage domains, database operations, packages, files and server permissions directly from this panel without requiring direct SSH or server login.
          </p>
        </div>

        <div className="hero-quick-meta">
          <div className="hero-meta-item">
            <span className="hero-meta-label">Connected Database</span>
            <span className="hero-meta-val text-success">cpanel @ localhost</span>
          </div>
          <div className="hero-meta-item">
            <span className="hero-meta-label">DB User</span>
            <span className="hero-meta-val">root</span>
          </div>
          <div className="hero-meta-item">
            <span className="hero-meta-label">Node Runtime</span>
            <span className="hero-meta-val text-info">{metrics?.node?.version || 'v24.x'}</span>
          </div>
        </div>
      </div>

      {/* Resource Usage Gauges */}
      <div className="stats-grid">
        {/* CPU Card */}
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title-wrap">
              <span className="stat-title">CPU Utilization</span>
              <span className="stat-subtitle">{metrics?.cpu?.model || 'Processor'}</span>
            </div>
            <div className="stat-icon-wrap bg-cyan-dim">
              <Cpu size={22} className="text-cyan" />
            </div>
          </div>
          <div className="stat-body">
            <div className="stat-number-wrap">
              <span className="stat-big-val">{cpuUsage}%</span>
              <span className="stat-sub-val">{metrics?.cpu?.cores || 4} Cores Active</span>
            </div>
            <div className="progress-bar-bg">
              <div
                className={`progress-bar-fill ${cpuUsage > 85 ? 'fill-danger' : cpuUsage > 60 ? 'fill-warning' : 'fill-cyan'}`}
                style={{ width: `${Math.min(cpuUsage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* RAM Card */}
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title-wrap">
              <span className="stat-title">Physical Memory</span>
              <span className="stat-subtitle">RAM Usage</span>
            </div>
            <div className="stat-icon-wrap bg-indigo-dim">
              <Layers size={22} className="text-indigo" />
            </div>
          </div>
          <div className="stat-body">
            <div className="stat-number-wrap">
              <span className="stat-big-val">{memPercent}%</span>
              <span className="stat-sub-val">{memUsedGb} GB / {memTotalGb} GB</span>
            </div>
            <div className="progress-bar-bg">
              <div
                className={`progress-bar-fill ${memPercent > 85 ? 'fill-danger' : 'fill-indigo'}`}
                style={{ width: `${Math.min(memPercent, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Disk Card */}
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title-wrap">
              <span className="stat-title">Storage Drive</span>
              <span className="stat-subtitle">{disk?.mount || 'C:'} Volume</span>
            </div>
            <div className="stat-icon-wrap bg-amber-dim">
              <HardDrive size={22} className="text-amber" />
            </div>
          </div>
          <div className="stat-body">
            <div className="stat-number-wrap">
              <span className="stat-big-val">{diskPercent}%</span>
              <span className="stat-sub-val">{diskUsedGb} GB / {diskTotalGb} GB</span>
            </div>
            <div className="progress-bar-bg">
              <div
                className={`progress-bar-fill ${diskPercent > 90 ? 'fill-danger' : 'fill-amber'}`}
                style={{ width: `${Math.min(diskPercent, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* MySQL Status Card */}
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title-wrap">
              <span className="stat-title">MySQL Server</span>
              <span className="stat-subtitle">Port 3306</span>
            </div>
            <div className="stat-icon-wrap bg-emerald-dim">
              <Database size={22} className="text-emerald" />
            </div>
          </div>
          <div className="stat-body">
            <div className="stat-number-wrap">
              <span className="stat-big-val text-emerald">ONLINE</span>
              <span className="stat-sub-val">Version: {metrics?.mysql?.version || '8.0'}</span>
            </div>
            <div className="mysql-health-badge">
              <CheckCircle2 size={16} className="text-emerald" />
              <span>Full Read / Write Root Access Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts Grid */}
      <div className="dashboard-section">
        <h2 className="section-title">Quick Management Shortcuts</h2>
        <div className="shortcuts-grid">
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <div
                key={qa.id}
                className="shortcut-card"
                onClick={() => setActiveTab(qa.id)}
              >
                <div className={`shortcut-icon-wrap ${qa.color}`}>
                  <Icon size={24} />
                </div>
                <div className="shortcut-info">
                  <div className="shortcut-title-row">
                    <span className="shortcut-title">{qa.label}</span>
                    <ArrowUpRight size={16} className="shortcut-arrow" />
                  </div>
                  <p className="shortcut-desc">{qa.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Server Specifications & Recent Logs */}
      <div className="dashboard-cols">
        {/* Server Specs Card */}
        <div className="content-card">
          <div className="card-header">
            <div className="card-title-wrap">
              <Server size={18} className="text-primary" />
              <h3 className="card-title">Server Specifications</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="specs-table">
              <div className="spec-row">
                <span className="spec-key">Operating System</span>
                <span className="spec-val">{metrics?.os?.distro || 'Windows'} ({metrics?.os?.arch || 'x64'})</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">Server Hostname</span>
                <span className="spec-val">{metrics?.os?.hostname || 'localhost'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">MySQL Engine</span>
                <span className="spec-val">MySQL v{metrics?.mysql?.version || '8.0'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">Node.js Engine</span>
                <span className="spec-val">{metrics?.node?.version || 'v24.x'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">System Uptime</span>
                <span className="spec-val">{formatUptime(metrics?.os?.uptime)}</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">cPanel Process Uptime</span>
                <span className="spec-val">{formatUptime(metrics?.node?.uptime)} (PID {metrics?.node?.pid})</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">Hosting Base Path</span>
                <span className="spec-val"><code>cpanel/hosting_data/www</code></span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Server Activity Card */}
        <div className="content-card">
          <div className="card-header">
            <div className="card-title-wrap">
              <Activity size={18} className="text-warning" />
              <h3 className="card-title">Recent Activity Logs</h3>
            </div>
            <button className="btn-secondary-sm" onClick={() => setActiveTab('logs')}>View All Logs</button>
          </div>
          <div className="card-body">
            {(!logs || logs.length === 0) ? (
              <div className="empty-state-sm">No recent activity recorded yet.</div>
            ) : (
              <div className="activity-mini-list">
                {logs.slice(0, 6).map((log) => (
                  <div key={log.id} className="activity-mini-item">
                    <div className="activity-mini-left">
                      <span className={`badge-pill-micro ${log.status === 'success' ? 'badge-success' : 'badge-danger'}`}>
                        {log.module}
                      </span>
                      <span className="activity-mini-action">{log.action}</span>
                    </div>
                    <span className="activity-mini-time">
                      <Clock size={12} />
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

