import React, { useState } from 'react';
import {
  Search,
  User,
  LogOut,
  Bell,
  Wrench,
  ChevronDown,
  Minus,
  Plus,
  Globe,
  Database,
  FolderTree,
  Package,
  KeyRound,
  Terminal,
  Activity,
  Cpu,
  Clock,
  Rocket,
  HardDrive,
  ShieldCheck,
  Lock,
  ExternalLink,
  Layers,
  FileCode,
  Archive,
  RefreshCw,
  Server
} from 'lucide-react';

export default function CPanelClassicLayout({
  currentUser,
  onLogout,
  metrics,
  activeTool,
  setActiveTool,
  children
}) {
  const [filterText, setFilterText] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleSection = (secName) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [secName]: !prev[secName]
    }));
  };

  const cpuUsage = metrics?.cpu?.usage ?? 0;
  const memTotalGb = metrics?.memory?.total ? (metrics.memory.total / (1024 ** 3)).toFixed(2) : '16.00';
  const memUsedGb = metrics?.memory?.used ? (metrics.memory.used / (1024 ** 3)).toFixed(2) : '9.50';
  const memPercent = metrics?.memory?.usagePercent ?? 59;
  const disk = metrics?.disks?.[0];
  const diskTotalGb = disk?.size ? (disk.size / (1024 ** 3)).toFixed(2) : '250.00';
  const diskUsedGb = disk?.used ? (disk.used / (1024 ** 3)).toFixed(2) : '168.20';
  const diskPercent = disk?.usePercent ?? 66;

  // Sections configuration identical to cPanel Paper Lantern
  const sections = [
    {
      id: 'applications',
      title: 'APPLICATIONS',
      items: [
        { id: 'installer', name: '1-Click App Installer', desc: 'Deploy WordPress, APIs, React Apps', icon: Rocket, color: 'bg-blue' },
        { id: 'apps', name: 'Node.js App Manager', desc: 'Deploy & monitor background processes', icon: Cpu, color: 'bg-green' },
        { id: 'installer', name: 'WordPress / Node API', desc: '1-Click Fullstack scaffold', icon: FileCode, color: 'bg-indigo' },
        { id: 'installer', name: 'All Applications', desc: 'Catalog of 5 production templates', icon: Archive, color: 'bg-amber' }
      ]
    },
    {
      id: 'domains',
      title: 'DOMAINS',
      items: [
        { id: 'domains', name: 'Domains & VHosts', desc: 'Domain allocation & DocumentRoot', icon: Globe, color: 'bg-cyan' },
        { id: 'zone_editor', name: 'Zone Editor (DNS & Nameservers)', desc: 'Manage A, CNAME, MX, TXT & Nameservers', icon: Server, color: 'bg-blue' },
        { id: 'zone_editor', name: 'Nameserver Delegation', desc: 'Point GoDaddy / Namecheap to cPanel', icon: Globe, color: 'bg-indigo' },
        { id: 'storage', name: 'SSL / TLS Status', desc: 'Issue automated HTTPS certificates', icon: Lock, color: 'bg-purple' }
      ]
    },
    {
      id: 'files',
      title: 'FILES',
      items: [
        { id: 'files', name: 'File Manager', desc: 'Full directory tree & code editor', icon: FolderTree, color: 'bg-amber' },
        { id: 'storage', name: 'Disk Usage', desc: 'Project storage quotas & cleaner', icon: HardDrive, color: 'bg-orange' },
        { id: 'ftp', name: 'FTP Accounts', desc: 'Virtual FTP users & home paths', icon: KeyRound, color: 'bg-teal' },
        { id: 'ftp', name: 'Directory Permissions', desc: 'Fix 0755/0644 security permissions', icon: ShieldCheck, color: 'bg-emerald' }
      ]
    },
    {
      id: 'databases',
      title: 'DATABASES',
      items: [
        { id: 'mysql', name: 'phpMyAdmin / SQL Console', desc: 'Interactive SQL query editor & tables', icon: Database, color: 'bg-orange' },
        { id: 'mysql', name: 'MySQL® Databases', desc: 'Create schemas & configure users', icon: Database, color: 'bg-amber' },
        { id: 'mysql', name: 'MySQL Database Users', desc: 'Grant privileges and passwords', icon: KeyRound, color: 'bg-blue' },
        { id: 'mysql', name: 'Remote MySQL (Port 3306)', desc: 'Direct root access configured', icon: Server, color: 'bg-green' }
      ]
    },
    {
      id: 'software',
      title: 'SOFTWARE & DEPENDENCIES',
      items: [
        { id: 'packages', name: 'Dependency Manager', desc: 'NPM & Pip package installer', icon: Package, color: 'bg-emerald' },
        { id: 'packages', name: '1-Click Project Install', desc: 'Runs npm install with logging', icon: Layers, color: 'bg-indigo' },
        { id: 'cron', name: 'Cron Jobs', desc: 'Scheduled background maintenance tasks', icon: Clock, color: 'bg-cyan' },
        { id: 'storage', name: 'Storage Quota Isolation', desc: 'Hard limits per project domain', icon: HardDrive, color: 'bg-purple' }
      ]
    },
    {
      id: 'advanced',
      title: 'ADVANCED & SYSTEM',
      items: [
        { id: 'terminal', name: 'Terminal', desc: 'Full web server shell access', icon: Terminal, color: 'bg-dark', adminOnly: true },
        { id: 'panel_users', name: 'User & Admin Accounts', desc: 'Panel authentication & privileges', icon: User, color: 'bg-blue', adminOnly: true },
        { id: 'logs', name: 'Activity Logs', desc: 'Audit trail of all server operations', icon: Activity, color: 'bg-rose' },
        { id: 'storage', name: 'Server Space Optimizer', desc: '1-Click clean temp & cache files', icon: Wrench, color: 'bg-teal' }
      ]
    }
  ];

  return (
    <div className="cpanel-classic-root">
      {/* cPanel Top Dark Blue Navbar */}
      <header className="cpanel-classic-header">
        <div className="header-brand-wrap" onClick={() => setActiveTool(null)}>
          <span className="brand-org">cPanel</span>
          <span className="brand-pipe">|</span>
          <span className="brand-product">Server Control Panel</span>
        </div>

        {/* Search functions input */}
        <div className="header-search-box">
          <Search size={15} className="header-search-ico" />
          <input
            type="text"
            placeholder="Search ( / )"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="classic-search-input"
          />
        </div>

        {/* Right user menu & logout */}
        <div className="header-user-menu">
          <div className="user-pill-dropdown">
            <User size={15} />
            <span className="user-name-text">{currentUser?.username || 'admin'}</span>
            <ChevronDown size={13} />
          </div>

          <div className="header-bell-wrap" title="System Notifications">
            <Bell size={16} />
            <span className="bell-badge">3</span>
          </div>

          <button className="cpanel-logout-btn" onClick={onLogout} title="Log out of cPanel">
            <LogOut size={15} />
            <span>LOGOUT</span>
          </button>
        </div>
      </header>

      {/* Main cPanel Two-Column Layout */}
      <div className="cpanel-classic-body">
        {/* If a tool is active, render that tool view with a 'Back to Dashboard' header */}
        {activeTool ? (
          <div className="cpanel-tool-view-wrapper">
            <div className="cpanel-tool-topbar">
              <button className="btn-back-cpanel" onClick={() => setActiveTool(null)}>
                ← Back to cPanel Dashboard
              </button>
              <div className="tool-view-breadcrumb">
                <span>cPanel</span>
                <span>/</span>
                <span className="font-semibold text-white capitalize">{activeTool.replace('_', ' ')}</span>
              </div>
            </div>
            <div className="tool-view-content">
              {children}
            </div>
          </div>
        ) : (
          <div className="cpanel-dashboard-grid">
            {/* Left Main Icons Area */}
            <main className="cpanel-main-icons-area">
              {/* Quick function filter bar */}
              <div className="find-functions-bar">
                <input
                  type="text"
                  placeholder="Find functions quickly by typing here."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="find-functions-input"
                />
              </div>

              {/* Sections */}
              {sections.map((section) => {
                const isCollapsed = collapsedSections[section.id];
                const filteredItems = section.items.filter((item) => {
                  if (item.adminOnly && currentUser?.role !== 'admin') return false;
                  if (!filterText) return true;
                  return (
                    item.name.toLowerCase().includes(filterText.toLowerCase()) ||
                    item.desc.toLowerCase().includes(filterText.toLowerCase())
                  );
                });

                if (filteredItems.length === 0) return null;

                return (
                  <div key={section.id} className="cpanel-section-box">
                    <div className="cpanel-section-header" onClick={() => toggleSection(section.id)}>
                      <span className="section-header-title">{section.title}</span>
                      <button className="section-collapse-toggle">
                        {isCollapsed ? <Plus size={14} /> : <Minus size={14} />}
                      </button>
                    </div>

                    {!isCollapsed && (
                      <div className="cpanel-icons-grid">
                        {filteredItems.map((item, idx) => {
                          const Icon = item.icon;
                          return (
                            <div
                              key={`${item.name}-${idx}`}
                              className="cpanel-icon-cell"
                              onClick={() => setActiveTool(item.id)}
                            >
                              <div className={`cpanel-app-badge ${item.color}`}>
                                <Icon size={24} />
                              </div>
                              <span className="cpanel-app-name">{item.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </main>

            {/* Right Information & Statistics Sidebar (Matches Paper Lantern Screenshot exactly) */}
            <aside className="cpanel-stats-sidebar">
              {/* GENERAL INFORMATION Box */}
              <div className="sidebar-info-card">
                <div className="sidebar-card-header">
                  <span>GENERAL INFORMATION</span>
                </div>
                <div className="sidebar-card-body">
                  <div className="info-meta-row">
                    <span className="info-meta-label">Current User</span>
                    <span className="info-meta-val font-semibold text-white">{currentUser?.username || 'admin'}</span>
                  </div>
                  <div className="info-meta-row">
                    <span className="info-meta-label">Primary Domain <span className="text-xs text-muted">(DV Certificate)</span></span>
                    <span className="info-meta-val text-primary flex items-center gap-1">
                      <Lock size={12} className="text-emerald" />
                      <span>{currentUser?.allocated_domain || 'localhost'}</span>
                      <ExternalLink size={11} />
                    </span>
                  </div>
                  <div className="info-meta-row">
                    <span className="info-meta-label">Shared IP Address</span>
                    <span className="info-meta-val">127.0.0.1</span>
                  </div>
                  <div className="info-meta-row">
                    <span className="info-meta-label">Home Directory</span>
                    <span className="info-meta-val code-home-val">/hosting_data/www</span>
                  </div>
                  <div className="info-meta-row">
                    <span className="info-meta-label">Last Login IP Address</span>
                    <span className="info-meta-val">127.0.0.1</span>
                  </div>
                  <div className="info-meta-row">
                    <span className="info-meta-label">Theme</span>
                    <select className="theme-select" defaultValue="paper_lantern">
                      <option value="paper_lantern">paper_lantern</option>
                      <option value="jupiter">jupiter</option>
                    </select>
                  </div>
                  <div className="pt-2">
                    <span className="text-primary text-xs cursor-pointer hover:underline" onClick={() => setActiveTool('dashboard')}>
                      Server Information
                    </span>
                  </div>
                </div>
              </div>

              {/* STATISTICS Box */}
              <div className="sidebar-info-card mt-4">
                <div className="sidebar-card-header">
                  <span>STATISTICS</span>
                </div>
                <div className="sidebar-card-body">
                  {/* Disk Usage with wrench banner */}
                  <div className="stat-progress-block">
                    <div className="stat-badge-banner" onClick={() => setActiveTool('storage')}>
                      <div className="banner-left">
                        <span className="stat-banner-title">Disk Usage</span>
                        <span className="stat-banner-nums">{diskUsedGb} GB / {diskTotalGb} GB ({diskPercent}%)</span>
                      </div>
                      <div className="banner-wrench-box">
                        <Wrench size={16} />
                      </div>
                    </div>
                    <div className="stat-bar-track mt-1">
                      <div
                        className={`stat-bar-fill ${diskPercent > 90 ? 'bg-danger' : diskPercent > 70 ? 'bg-warning' : 'bg-primary'}`}
                        style={{ width: `${diskPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* MySQL Disk Usage */}
                  <div className="stat-progress-block mt-4">
                    <div className="stat-labels-row">
                      <span className="stat-block-name">MySQL® Disk Usage</span>
                      <span className="stat-block-val">0.19 MB / 1000 MB (0.02%)</span>
                    </div>
                    <div className="stat-bar-track">
                      <div className="stat-bar-fill bg-success" style={{ width: '4%' }}></div>
                    </div>
                  </div>

                  {/* Memory (RAM) Usage */}
                  <div className="stat-progress-block mt-4">
                    <div className="stat-labels-row">
                      <span className="stat-block-name">Physical Memory Usage</span>
                      <span className="stat-block-val">{memUsedGb} GB / {memTotalGb} GB ({memPercent}%)</span>
                    </div>
                    <div className="stat-bar-track">
                      <div
                        className={`stat-bar-fill ${memPercent > 85 ? 'bg-danger' : 'bg-indigo'}`}
                        style={{ width: `${memPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* CPU Usage */}
                  <div className="stat-progress-block mt-4">
                    <div className="stat-labels-row">
                      <span className="stat-block-name">CPU Utilization</span>
                      <span className="stat-block-val font-mono">{cpuUsage}%</span>
                    </div>
                    <div className="stat-bar-track">
                      <div
                        className={`stat-bar-fill ${cpuUsage > 85 ? 'bg-danger' : 'bg-cyan'}`}
                        style={{ width: `${Math.min(cpuUsage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* MySQL Service status */}
                  <div className="stat-progress-block mt-4 pt-2 border-t border-slate-700">
                    <div className="stat-labels-row">
                      <span className="stat-block-name">MySQL Server Engine</span>
                      <span className="badge-pill-micro badge-success">ONLINE :3306</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

