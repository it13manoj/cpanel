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
  Server,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { api } from '../api';

export default function CPanelClassicLayout({
  currentUser,
  onLogout,
  metrics,
  domains = [],
  activeTool,
  setActiveTool,
  children
}) {
  const [filterText, setFilterText] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({});

  // Admin Profile Dropdown & Password Modal
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword || newPassword.length < 5) {
      setPasswordError('New password must be at least 5 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setPasswordLoading(true);
      await api.changePassword({
        username: currentUser?.username || 'admin',
        current_password: currentPassword,
        new_password: newPassword
      });
      setPasswordSuccess('Password successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordModalOpen(false);
        setPasswordSuccess(null);
      }, 1500);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const serverIp = metrics?.serverIp || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? window.location.hostname : '173.212.235.87');
  const primaryDomain = domains?.[0]?.domain_name || currentUser?.allocated_domain || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? window.location.hostname : 'gaurishankartemple.com');

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
        { id: 'installer', name: '1-Click App Installer', desc: 'WordPress, WooCommerce, Laravel & 36+ Apps', icon: Rocket, color: 'bg-blue' },
        { id: 'apps', name: 'Node.js App Manager', desc: 'Deploy & monitor background processes', icon: Cpu, color: 'bg-green' },
        { id: 'installer', name: 'WordPress & CMS', desc: 'WordPress, Joomla, Drupal, Ghost, PrestaShop', icon: FileCode, color: 'bg-indigo' },
        { id: 'installer', name: 'App Catalog (36 Apps)', desc: 'CMS, E-Commerce, Forums, Frameworks & DevOps', icon: Archive, color: 'bg-amber' }
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
        <div className="header-brand-wrap" onClick={() => setActiveTool(null)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="/parakshtech-logo.jpg"
            alt="Parakshtech Logo"
            style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'contain' }}
          />
          <span className="brand-org" style={{ fontWeight: 800, letterSpacing: '-0.01em', color: '#ffffff' }}>Parakshtech</span>
          <span className="brand-product" style={{ color: '#ff3333', fontWeight: 800 }}>cPanel</span>
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
        <div className="header-user-menu" style={{ position: 'relative' }}>
          <div
            className="user-pill-dropdown"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            style={{ userSelect: 'none', position: 'relative' }}
          >
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <User size={15} />
            </div>
            <span className="user-name-text">{currentUser?.username || 'admin'}</span>
            <ChevronDown size={13} style={{ transform: userDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>

          {/* User Profile Dropdown Menu */}
          {userDropdownOpen && (
            <div
              className="cpanel-user-dropdown-menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: '75px',
                width: '240px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                zIndex: 9999,
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #334155', backgroundColor: '#0f172a' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Signed in as</div>
                <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px', marginTop: '2px' }}>{currentUser?.username || 'admin'}</div>
                <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>Role: {currentUser?.role || 'Super Administrator'}</div>
              </div>

              <div style={{ padding: '6px 0' }}>
                <div
                  onClick={() => {
                    setUserDropdownOpen(false);
                    setPasswordError(null);
                    setPasswordSuccess(null);
                    setPasswordModalOpen(true);
                  }}
                  style={{
                    padding: '10px 16px',
                    fontSize: '13px',
                    color: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <KeyRound size={15} style={{ color: '#38bdf8' }} />
                  <span>Change Password</span>
                </div>

                <div
                  onClick={() => {
                    setUserDropdownOpen(false);
                    setActiveTool('panel_users');
                  }}
                  style={{
                    padding: '10px 16px',
                    fontSize: '13px',
                    color: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <User size={15} style={{ color: '#a855f7' }} />
                  <span>User Accounts</span>
                </div>

                <div style={{ height: '1px', backgroundColor: '#334155', margin: '4px 0' }} />

                <div
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onLogout();
                  }}
                  style={{
                    padding: '10px 16px',
                    fontSize: '13px',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={15} style={{ color: '#f87171' }} />
                  <span>Log Out</span>
                </div>
              </div>
            </div>
          )}

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
                ← Back to Dashboard
              </button>
              <div className="tool-view-breadcrumb">
                <span>Parakshtech cPanel</span>
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
                      <span>{primaryDomain}</span>
                      <a href={`http://${primaryDomain}`} target="_blank" rel="noreferrer" className="text-primary hover:text-white inline-flex items-center">
                        <ExternalLink size={11} />
                      </a>
                    </span>
                  </div>
                  <div className="info-meta-row">
                    <span className="info-meta-label">Shared IP Address</span>
                    <span className="info-meta-val font-semibold">{serverIp}</span>
                  </div>
                  <div className="info-meta-row">
                    <span className="info-meta-label">Home Directory</span>
                    <span className="info-meta-val code-home-val">/hosting_data/www</span>
                  </div>
                  <div className="info-meta-row">
                    <span className="info-meta-label">Last Login IP Address</span>
                    <span className="info-meta-val">{serverIp}</span>
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

      {/* Change Password Modal */}
      {passwordModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setPasswordModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(2px)'
          }}
        >
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.6)',
              overflow: 'hidden'
            }}
          >
            <div
              className="modal-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #334155',
                backgroundColor: '#0f172a'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={18} style={{ color: '#38bdf8' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>Change Account Password</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setPasswordModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="modal-body" style={{ padding: '20px' }}>
                <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#94a3b8' }}>
                  Update password for account <strong style={{ color: '#f8fafc' }}>{currentUser?.username || 'admin'}</strong>.
                </p>

                {passwordSuccess && (
                  <div
                    className="alert alert-success"
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid #10b981',
                      borderRadius: '6px',
                      color: '#34d399',
                      fontSize: '13px',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <CheckCircle size={16} />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div
                    className="alert alert-danger"
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      color: '#f87171',
                      fontSize: '13px',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Current Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 5 characters"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Show Passwords</span>
                  </label>
                  <span>Min 5 characters</span>
                </div>
              </div>

              <div
                className="modal-footer"
                style={{
                  padding: '12px 20px',
                  borderTop: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px'
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPasswordModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

