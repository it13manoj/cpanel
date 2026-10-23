import React from 'react';
import {
  LayoutDashboard,
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
  Users,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Overview' },
  { id: 'installer', label: '1-Click App Installer', icon: Rocket, category: 'Applications' },
  { id: 'domains', label: 'Domains & VHosts', icon: Globe, category: 'Hosting' },
  { id: 'mysql', label: 'MySQL Databases', icon: Database, category: 'Hosting' },
  { id: 'storage', label: 'Storage & Quotas', icon: HardDrive, category: 'Hosting' },
  { id: 'files', label: 'File Manager', icon: FolderTree, category: 'Files' },
  { id: 'packages', label: 'Dependency Manager', icon: Package, category: 'Software' },
  { id: 'ftp', label: 'FTP & Permissions', icon: KeyRound, category: 'Files' },
  { id: 'apps', label: 'Node.js & App Manager', icon: Cpu, category: 'Software' },
  { id: 'terminal', label: 'Web Terminal', icon: Terminal, category: 'Advanced', adminOnly: true },
  { id: 'panel_users', label: 'User & Admin Accounts', icon: Users, category: 'System', adminOnly: true },
  { id: 'cron', label: 'Cron Jobs', icon: Clock, category: 'Advanced' },
  { id: 'logs', label: 'Activity Logs', icon: Activity, category: 'System' }
];

export default function Sidebar({ activeTab, setActiveTab, metrics, currentUser }) {
  const isAdmin = currentUser?.role === 'admin';
  const categories = ['Overview', 'Applications', 'Hosting', 'Files', 'Software', 'Advanced', 'System'];

  return (
    <aside className="cpanel-sidebar">
      <div className="sidebar-nav-container">
        {categories.map((cat) => {
          const items = navItems.filter((i) => {
            if (i.category !== cat) return false;
            if (i.adminOnly && !isAdmin) return false;
            return true;
          });
          if (items.length === 0) return null;

          return (
            <div key={cat} className="sidebar-group">
              <span className="sidebar-group-title">{cat}</span>
              <ul className="sidebar-menu">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        className={`sidebar-link ${isActive ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                      >
                        <Icon size={18} className="sidebar-item-icon" />
                        <span className="sidebar-item-label">{item.label}</span>
                        {item.id === 'installer' && (
                          <span className="badge-pill-micro badge-primary">NEW</span>
                        )}
                        {item.id === 'mysql' && metrics?.mysql?.status === 'online' && (
                          <span className="badge-pill-micro badge-success">3306</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer Session Profile */}
      <div className="sidebar-footer">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <UserCheck size={14} className={isAdmin ? 'text-primary' : 'text-emerald'} />
            <span className="text-xs font-semibold text-white">{currentUser?.username || 'admin'}</span>
          </div>
          <span className={`badge-pill-micro ${isAdmin ? 'badge-primary' : 'badge-success'}`}>
            {currentUser?.role?.toUpperCase() || 'ADMIN'}
          </span>
        </div>
        <div className="server-quick-meta">
          <div className="meta-row">
            <span className="meta-label">Node:</span>
            <span className="meta-val">{metrics?.node?.version || 'v24.x'}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">MySQL:</span>
            <span className="meta-val">8.0 (Online)</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
