import React, { useState, useEffect } from 'react';
import {
  Rocket,
  CheckCircle,
  AlertCircle,
  Database,
  ArrowRight,
  ExternalLink,
  FolderTree,
  Search,
  Copy,
  Check,
  X,
  RefreshCw,
  Star
} from 'lucide-react';
import { api } from '../api';
import AppBrandIcon from './AppBrandIcons';

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
        quotaMb: 1000
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

  const getBadgeStyle = (badge) => {
    switch (badge) {
      case 'Most Popular':
      case 'Top Store':
        return { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' };
      case 'Enterprise':
      case 'Web Host':
        return { backgroundColor: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe' };
      case 'Modern':
      case 'Modern UI':
      case 'Artisan':
        return { backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc' };
      default:
        return { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' };
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
            Deploy complete CMS platforms, E-Commerce stores, Developer Frameworks, Forums, Helpdesks and DevOps tools onto your server with automated MySQL database setup, Nginx routing and SSL.
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
        <div className="content-card mb-6" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="card-header bg-slate-50 flex justify-between items-center">
            <div className="card-title-wrap flex items-center gap-2">
              <CheckCircle size={20} className="text-primary" />
              <h3 className="card-title" style={{ margin: 0, fontSize: '15px' }}>
                {deployedProject.template} Installed Successfully!
              </h3>
            </div>
            <span className="badge-pill badge-success">Online & Routed</span>
          </div>

          <div className="card-body">
            <div className="form-grid mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
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

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
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

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-xs text-muted block mb-1">Admin Credentials:</span>
                <div className="flex items-center justify-between text-xs">
                  <span>User: <strong className="text-slate-800">{deployedProject.adminUser}</strong></span>
                  <button
                    className="btn-icon-sm"
                    onClick={() => handleCopy(deployedProject.adminUser, 'user')}
                    title="Copy Username"
                  >
                    {copiedKey === 'user' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span>Pass: <strong className="text-primary">{deployedProject.adminPassword}</strong></span>
                  <button
                    className="btn-icon-sm"
                    onClick={() => handleCopy(deployedProject.adminPassword, 'pass')}
                    title="Copy Password"
                  >
                    {copiedKey === 'pass' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-xs text-muted block mb-1">MySQL Database:</span>
                <code className="text-slate-800 font-mono text-xs">{deployedProject.databaseName}</code>
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

      {/* Search & Category Filter Navigation Bar */}
      <div className="content-card mb-6" style={{ padding: '1.25rem' }}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div
            style={{
              position: 'relative',
              flex: 1,
              maxWidth: '440px',
              minWidth: '260px'
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b'
              }}
            />
            <input
              type="text"
              placeholder="Search WordPress, WooCommerce, Laravel, Docker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
                color: '#1e293b'
              }}
            />
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
            Showing <strong>{filteredTemplates.length}</strong> of {templates.length} Applications
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {categories.map((cat) => {
            const count = cat === 'All Applications'
              ? templates.length
              : templates.filter((t) => t.category === cat).length;
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: active ? '1px solid #0284c7' : '1px solid #e2e8f0',
                  backgroundColor: active ? '#0284c7' : '#ffffff',
                  color: active ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow: active ? '0 2px 4px rgba(2, 132, 199, 0.25)' : 'none'
                }}
              >
                <span>{cat}</span>
                <span
                  style={{
                    backgroundColor: active ? '#0369a1' : '#f1f5f9',
                    color: active ? '#ffffff' : '#64748b',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 700
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
            className="app-card-item"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = '#0284c7';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
            }}
          >
            <div>
              {/* Top Row: Icon + Badge + Version */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #f1f5f9'
                  }}
                >
                  <AppBrandIcon id={tpl.id} size={32} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {tpl.badge && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        ...getBadgeStyle(tpl.badge)
                      }}
                    >
                      {tpl.badge}
                    </span>
                  )}
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                    v{tpl.version}
                  </span>
                </div>
              </div>

              {/* Title & Category */}
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                {tpl.name}
              </h3>
              <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                {tpl.category}
              </div>

              {/* Description */}
              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: 1.5, minHeight: '38px' }}>
                {tpl.description}
              </p>
            </div>

            {/* Bottom Row: Rating/Type + Install Button */}
            <div
              style={{
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>4.9</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>&bull; {tpl.portsRequired ? 'Service' : 'PHP'}</span>
              </div>

              <button
                className="btn btn-primary-sm"
                onClick={() => handleOpenInstall(tpl)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <span>Install</span>
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
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
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
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <AppBrandIcon id={selectedTemplate.id} size={28} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    Install {selectedTemplate.name}
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {selectedTemplate.category} &bull; v{selectedTemplate.version}
                  </span>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedTemplate(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleInstallApp}>
              <div className="modal-body" style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#64748b', lineHeight: 1.5 }}>
                  Configure installation settings for <strong>{selectedTemplate.name}</strong>. A dedicated MySQL database schema will be provisioned automatically.
                </p>

                {/* Domain Selector */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                    Installation Domain *
                  </label>
                  <select
                    className="form-select"
                    value={domainName}
                    onChange={(e) => {
                      setDomainName(e.target.value);
                      setAdminEmail(`admin@${e.target.value}`);
                    }}
                    style={{ width: '100%', boxSizing: 'border-box' }}
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
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                    Website / Store Title
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={siteTitle}
                    onChange={(e) => setSiteTitle(e.target.value)}
                    placeholder={`e.g. My ${selectedTemplate.name} Platform`}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                {/* Project Slug */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                    Directory Identifier
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. my_wordpress_blog"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                {/* Admin Credentials */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                      Admin Username
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={adminUser}
                      onChange={(e) => setAdminUser(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                      Admin Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                    Admin Email
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                {/* Service Port if required */}
                {selectedTemplate.portsRequired && (
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                      Service Port
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      style={{ cursor: 'pointer' }}
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
                  borderTop: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
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
