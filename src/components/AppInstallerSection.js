import React, { useState, useEffect } from 'react';
import {
  Rocket,
  CheckCircle,
  AlertCircle,
  Database,
  Layout,
  ShoppingCart,
  BookOpen,
  Terminal,
  ArrowRight,
  ExternalLink,
  FolderTree,
  Server,
  Search,
  Filter,
  Sparkles,
  KeyRound,
  Mail,
  Globe,
  HardDrive,
  Copy,
  Check,
  X,
  RefreshCw,
  ShoppingBag,
  MessageSquare,
  Users,
  Code,
  Zap,
  Box,
  Layers,
  Cpu,
  Coffee,
  CreditCard,
  HelpCircle,
  Briefcase,
  Cloud,
  Activity,
  Send,
  GitPullRequest
} from 'lucide-react';
import { api } from '../api';

export default function AppInstallerSection({ setActiveTab, reloadDomains, domains = [] }) {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All Applications');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Install Form State
  const [projectName, setProjectName] = useState('');
  const [domainName, setDomainName] = useState('');
  const [siteTitle, setSiteTitle] = useState('');
  const [adminUser, setAdminUser] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('Admin@Pass2026!');
  const [adminEmail, setAdminEmail] = useState('admin@example.com');
  const [port, setPort] = useState(4100);
  const [quotaMb, setQuotaMb] = useState(1000);
  const [showPassword, setShowPassword] = useState(false);

  // Execution & Result State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [deployedProject, setDeployedProject] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await api.getTemplates();
      setTemplates(res.templates || []);
      setCategories(res.categories || [
        'All Applications',
        'CMS & Blogging',
        'E-Commerce & Online Stores',
        'Forums & Community Boards',
        'Frameworks & Developer Tools',
        'Customer Support, PM & LMS',
        'Email, Collaboration & DevOps'
      ]);
    } catch (e) {
      console.warn('Could not load templates:', e);
    }
  };

  const handleOpenInstall = (tpl) => {
    setSelectedTemplate(tpl);
    const slug = tpl.id.replace(/-/g, '_');
    setProjectName(slug);
    setSiteTitle(`My ${tpl.name}`);

    // Default to first active user domain or fallback
    const firstDomain = domains[0]?.domain_name || `${slug}.local`;
    setDomainName(firstDomain);
    setAdminEmail(`admin@${firstDomain}`);

    if (tpl.defaultPort) setPort(tpl.defaultPort);
    setMessage(null);
    setError(null);
    setDeployedProject(null);
  };

  const handleInstallApp = async (e) => {
    e.preventDefault();
    if (!projectName || !selectedTemplate) return;

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const res = await api.installApp({
        templateId: selectedTemplate.id,
        projectName,
        domainName,
        siteTitle,
        adminUser,
        adminPassword,
        adminEmail,
        port: selectedTemplate.portsRequired ? port : null,
        quotaMb: parseInt(quotaMb, 10)
      });

      setMessage(res.message);
      setDeployedProject(res.project);
      if (reloadDomains) reloadDomains();
    } catch (err) {
      setError(err.message || 'Installation encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredTemplates = templates.filter((tpl) => {
    const matchesCategory = activeCategory === 'All Applications' || tpl.category === activeCategory;
    const matchesSearch =
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tpl.badge && tpl.badge.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getTemplateIcon = (iconName) => {
    switch (iconName) {
      case 'wordpress': return <BookOpen size={24} className="text-cyan" />;
      case 'joomla': return <Layers size={24} className="text-blue" />;
      case 'drupal': return <Cloud size={24} className="text-sky" />;
      case 'ghost': return <Sparkles size={24} className="text-purple" />;
      case 'shopping-cart': return <ShoppingCart size={24} className="text-emerald" />;
      case 'shopping-bag': return <ShoppingBag size={24} className="text-teal" />;
      case 'package': return <Box size={24} className="text-amber" />;
      case 'credit-card': return <CreditCard size={24} className="text-indigo" />;
      case 'message-square':
      case 'messages-square':
      case 'message-circle': return <MessageSquare size={24} className="text-blue" />;
      case 'users': return <Users size={24} className="text-cyan" />;
      case 'code': return <Code size={24} className="text-rose" />;
      case 'zap': return <Zap size={24} className="text-orange" />;
      case 'cpu': return <Cpu size={24} className="text-emerald" />;
      case 'terminal': return <Terminal size={24} className="text-amber" />;
      case 'coffee': return <Coffee size={24} className="text-orange" />;
      case 'help-circle': return <HelpCircle size={24} className="text-cyan" />;
      case 'briefcase': return <Briefcase size={24} className="text-blue" />;
      case 'cloud': return <Cloud size={24} className="text-sky" />;
      case 'activity': return <Activity size={24} className="text-indigo" />;
      case 'mail': return <Mail size={24} className="text-emerald" />;
      case 'send': return <Send size={24} className="text-cyan" />;
      case 'git-pull-request': return <GitPullRequest size={24} className="text-purple" />;
      case 'box': return <Box size={24} className="text-blue" />;
      default: return <Rocket size={24} className="text-primary" />;
    }
  };

  return (
    <div className="view-container">
      {/* Header Banner */}
      <div className="view-header">
        <div>
          <h1 className="view-title flex items-center gap-2">
            <Rocket size={24} className="text-primary" />
            <span>1-Click Application Installer (App Catalog)</span>
          </h1>
          <p className="view-subtitle">
            Deploy fullstack CMS, E-Commerce stores, Developer Frameworks, Forums, Helpdesks and DevOps tools onto your server with automated MySQL database setup, Nginx routing and SSL.
          </p>
        </div>
      </div>

      {/* Global Alerts */}
      {message && (
        <div className="alert alert-success mb-4 flex items-center gap-2">
          <CheckCircle size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger mb-4 flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Deployed Project Success Card */}
      {deployedProject && (
        <div className="content-card mb-6 border-cyan" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="card-header bg-cyan-dim flex justify-between items-center">
            <div className="card-title-wrap flex items-center gap-2">
              <CheckCircle size={20} className="text-cyan" />
              <h3 className="card-title text-cyan" style={{ margin: 0, fontSize: '16px' }}>
                {deployedProject.template} Installed Successfully!
              </h3>
            </div>
            <span className="badge-pill badge-success">Online & Routed</span>
          </div>

          <div className="card-body">
            <div className="form-grid mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="p-3 bg-slate-900 rounded border border-slate-700">
                <span className="text-xs text-muted block mb-1">Live Website URL:</span>
                <a
                  href={deployedProject.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-bold hover:underline flex items-center gap-1"
                >
                  <span>{deployedProject.domain}</span>
                  <ExternalLink size={13} />
                </a>
              </div>

              <div className="p-3 bg-slate-900 rounded border border-slate-700">
                <span className="text-xs text-muted block mb-1">Admin Dashboard:</span>
                <a
                  href={deployedProject.adminUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald font-bold hover:underline flex items-center gap-1"
                >
                  <span>Admin Panel</span>
                  <ExternalLink size={13} />
                </a>
              </div>

              <div className="p-3 bg-slate-900 rounded border border-slate-700">
                <span className="text-xs text-muted block mb-1">Admin Credentials:</span>
                <div className="flex items-center justify-between text-xs">
                  <span>User: <strong className="text-white">{deployedProject.adminUser}</strong></span>
                  <button
                    className="btn-icon-sm"
                    onClick={() => handleCopy(deployedProject.adminUser, 'user')}
                    title="Copy Username"
                  >
                    {copiedKey === 'user' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span>Pass: <strong className="text-cyan">{deployedProject.adminPassword}</strong></span>
                  <button
                    className="btn-icon-sm"
                    onClick={() => handleCopy(deployedProject.adminPassword, 'pass')}
                    title="Copy Password"
                  >
                    {copiedKey === 'pass' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded border border-slate-700">
                <span className="text-xs text-muted block mb-1">MySQL Database:</span>
                <code className="text-amber font-mono text-xs">{deployedProject.databaseName}</code>
                <span className="text-xs text-muted block mt-1">Port: {deployedProject.port}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href={deployedProject.adminUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm flex items-center gap-1"
              >
                <ExternalLink size={14} />
                <span>Open Admin Dashboard</span>
              </a>
              <button className="btn btn-secondary-sm" onClick={() => setActiveTab('files')}>
                <FolderTree size={14} />
                <span>Open in File Manager</span>
              </button>
              <button className="btn btn-secondary-sm" onClick={() => setActiveTab('mysql')}>
                <Database size={14} />
                <span>Manage Database</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Category Filter Navigation */}
      <div className="content-card mb-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="header-search-box flex-1" style={{ maxWidth: '420px', minWidth: '240px' }}>
            <Search size={16} className="header-search-ico" />
            <input
              type="text"
              placeholder="Search WordPress, Laravel, WooCommerce, Docker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="classic-search-input"
            />
          </div>
          <div className="text-xs text-muted font-semibold">
            Showing {filteredTemplates.length} of {templates.length} Applications
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const count = cat === 'All Applications'
              ? templates.length
              : templates.filter((t) => t.category === cat).length;
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`btn-filter-pill ${active ? 'active' : ''}`}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: active ? '1px solid #0284c7' : '1px solid #334155',
                  backgroundColor: active ? '#0284c7' : '#1e293b',
                  color: active ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{cat}</span>
                <span
                  style={{
                    backgroundColor: active ? '#0369a1' : '#0f172a',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '11px'
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Application Cards Grid */}
      <div
        className="apps-catalog-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="app-catalog-card"
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s, border-color 0.2s',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)'
            }}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '10px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {getTemplateIcon(tpl.icon)}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {tpl.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: tpl.badge === 'Most Popular' || tpl.badge === 'Top Store' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(2, 132, 199, 0.2)',
                        color: tpl.badge === 'Most Popular' || tpl.badge === 'Top Store' ? '#f87171' : '#38bdf8',
                        border: tpl.badge === 'Most Popular' || tpl.badge === 'Top Store' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(2, 132, 199, 0.4)'
                      }}
                    >
                      {tpl.badge}
                    </span>
                  )}
                  <span style={{ fontSize: '11px', color: '#64748b' }}>v{tpl.version}</span>
                </div>
              </div>

              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                {tpl.name}
              </h3>
              <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600, marginBottom: '8px' }}>
                {tpl.category}
              </div>

              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                {tpl.description}
              </p>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {tpl.portsRequired ? `Service (${tpl.defaultPort})` : 'PHP / MySQL'}
              </span>
              <button
                className="btn btn-primary-sm"
                onClick={() => handleOpenInstall(tpl)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '6px'
                }}
              >
                <span>Install Now</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 1-Click Install Modal */}
      {selectedTemplate && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedTemplate(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            backdropFilter: 'blur(3px)'
          }}
        >
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '14px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
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
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {getTemplateIcon(selectedTemplate.icon)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                    Install {selectedTemplate.name}
                  </h3>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {selectedTemplate.category} &bull; v{selectedTemplate.version}
                  </span>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedTemplate(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleInstallApp}>
              <div className="modal-body" style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                  Configure domain routing and administrative credentials for <strong>{selectedTemplate.name}</strong>. A dedicated MySQL database schema will be provisioned automatically.
                </p>

                {/* Domain Selector */}
                <div className="form-group mb-3">
                  <label className="form-label font-semibold text-xs text-slate-300 block mb-1">
                    Select Installation Domain *
                  </label>
                  <select
                    className="form-select w-full"
                    value={domainName}
                    onChange={(e) => {
                      setDomainName(e.target.value);
                      setAdminEmail(`admin@${e.target.value}`);
                    }}
                    required
                  >
                    {domains.map((d) => (
                      <option key={d.id} value={d.domain_name}>
                        {d.domain_name} (Document Root: /hosting_data/www/{d.domain_name})
                      </option>
                    ))}
                    <option value={`${projectName}.local`}>
                      {projectName}.local (Local test domain)
                    </option>
                  </select>
                </div>

                {/* Site Title */}
                <div className="form-group mb-3">
                  <label className="form-label font-semibold text-xs text-slate-300 block mb-1">
                    Website / Store Title
                  </label>
                  <input
                    type="text"
                    className="form-input w-full"
                    value={siteTitle}
                    onChange={(e) => setSiteTitle(e.target.value)}
                    placeholder={`e.g. My ${selectedTemplate.name} Platform`}
                    required
                  />
                </div>

                {/* Project Slug */}
                <div className="form-group mb-3">
                  <label className="form-label font-semibold text-xs text-slate-300 block mb-1">
                    Project / Directory Identifier
                  </label>
                  <input
                    type="text"
                    className="form-input w-full"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. my_wordpress_blog"
                    required
                  />
                </div>

                {/* Admin Credentials */}
                <div className="grid grid-cols-2 gap-3 mb-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label font-semibold text-xs text-slate-300 block mb-1">
                      Admin Username
                    </label>
                    <input
                      type="text"
                      className="form-input w-full"
                      value={adminUser}
                      onChange={(e) => setAdminUser(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label font-semibold text-xs text-slate-300 block mb-1">
                      Admin Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input w-full"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label font-semibold text-xs text-slate-300 block mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    className="form-input w-full"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Service Port if required */}
                {selectedTemplate.portsRequired && (
                  <div className="form-group mb-3">
                    <label className="form-label font-semibold text-xs text-slate-300 block mb-1">
                      Background Process Port
                    </label>
                    <input
                      type="number"
                      className="form-input w-full"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted mt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                    />
                    <span>Show Password</span>
                  </label>
                  <span>Auto-creates MySQL Schema</span>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                className="modal-footer"
                style={{
                  padding: '14px 20px',
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
                  onClick={() => setSelectedTemplate(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Provisioning Application...</span>
                    </>
                  ) : (
                    <>
                      <Rocket size={14} />
                      <span>Install {selectedTemplate.name}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
