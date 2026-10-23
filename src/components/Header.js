import React from 'react';
import {
  Server,
  Cpu,
  HardDrive,
  Database,
  Radio,
  Search,
  RefreshCw,
  Layers,
  Terminal,
  FolderGit2
} from 'lucide-react';

export default function Header({ metrics, onRefresh, searchQuery, setSearchQuery, activeTab, setActiveTab }) {
  const cpuUsage = metrics?.cpu?.usage ?? 0;
  const memUsage = metrics?.memory?.usagePercent ?? 0;
  const disk = metrics?.disks?.[0];
  const diskUsage = disk?.usePercent ?? 0;
  const isMysqlOnline = metrics?.mysql?.status === 'online';

  return (
    <header className="cpanel-header">
      <div className="header-left">
        <div className="brand-logo" onClick={() => setActiveTab('dashboard')}>
          <div className="logo-icon-wrap">
            <Server className="icon-cpanel" size={24} />
          </div>
          <div className="brand-text">
            <span className="brand-title">cPanel Server</span>
            <span className="brand-subtitle">Node.js Management Hub</span>
          </div>
        </div>

        {/* Search Quick-Finder */}
        <div className="header-search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search domains, MySQL, files, packages, terminal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="header-search-input"
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
      </div>

      <div className="header-right">
        {/* Real-time Health Badges */}
        <div className="metrics-bar">
          {/* CPU Gauge */}
          <div className="metric-pill" title={`CPU Load: ${cpuUsage}%\n${metrics?.cpu?.model || ''}`}>
            <Cpu size={16} className={cpuUsage > 85 ? 'text-danger' : 'text-primary'} />
            <span className="metric-label">CPU</span>
            <span className={`metric-value ${cpuUsage > 85 ? 'val-danger' : ''}`}>{cpuUsage}%</span>
          </div>

          {/* RAM Gauge */}
          <div className="metric-pill" title={`RAM Usage: ${memUsage}%`}>
            <Layers size={16} className={memUsage > 85 ? 'text-danger' : 'text-info'} />
            <span className="metric-label">RAM</span>
            <span className={`metric-value ${memUsage > 85 ? 'val-danger' : ''}`}>{memUsage}%</span>
          </div>

          {/* Disk Gauge */}
          <div className="metric-pill" title={`Disk Usage: ${diskUsage}% (${disk?.mount || 'C:'})`}>
            <HardDrive size={16} className={diskUsage > 90 ? 'text-danger' : 'text-warning'} />
            <span className="metric-label">Disk</span>
            <span className="metric-value">{diskUsage}%</span>
          </div>

          {/* MySQL Status */}
          <div className="metric-pill" title={`MySQL ${metrics?.mysql?.version || '8.0'} on port 3306`}>
            <Database size={16} className={isMysqlOnline ? 'text-success' : 'text-danger'} />
            <span className="metric-label">MySQL</span>
            <span className={`status-dot ${isMysqlOnline ? 'dot-online' : 'dot-offline'}`}></span>
            <span className="metric-value">{isMysqlOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        {/* Live WS indicator & Refresh */}
        <div className="header-actions">
          <div className="live-indicator" title="Live WebSocket connection active">
            <Radio size={14} className="pulse-icon text-success" />
            <span className="live-text">LIVE</span>
          </div>

          <button className="btn-icon" onClick={onRefresh} title="Refresh System Data">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

