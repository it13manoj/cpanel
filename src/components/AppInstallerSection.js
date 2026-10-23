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
  Server
} from 'lucide-react';
import { api } from '../api';

export default function AppInstallerSection({ setActiveTab, reloadDomains }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [domainName, setDomainName] = useState('');
  const [port, setPort] = useState(4010);
  const [quotaMb, setQuotaMb] = useState(500);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [deployedProject, setDeployedProject] = useState(null);

  useEffect(() => {
    api.getTemplates().then((res) => setTemplates(res.templates || [])).catch(() => {});
  }, []);

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    const slug = tpl.id.replace(/-/g, '_');
    setProjectName(slug);
    setDomainName(`${slug}.local`);
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
        port: selectedTemplate.portsRequired ? port : null,
        quotaMb: parseInt(quotaMb, 10)
      });

      setMessage(res.message);
      setDeployedProject(res.project);
      if (reloadDomains) reloadDomains();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTemplateIcon = (id) => {
    switch (id) {
      case 'express-mysql-api': return <Database size={28} className="text-cyan" />;
      case 'react-spa-client': return <Layout size={28} className="text-primary" />;
      case 'ecommerce-store': return <ShoppingCart size={28} className="text-emerald" />;
      case 'blog-cms': return <BookOpen size={28} className="text-amber" />;
      case 'python-flask-service': return <Terminal size={28} className="text-purple" />;
      default: return <Rocket size={28} className="text-primary" />;
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">1-Click Application Installer</h1>
          <p className="view-subtitle">
            Deploy complete projects with pre-configured MySQL databases, automated dependencies and domain routes in 1-click.
          </p>
        </div>
      </div>

      {message && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Deployed Project Success Card */}
      {deployedProject && (
        <div className="content-card mb-6 border-cyan">
          <div className="card-header bg-cyan-dim">
            <div className="card-title-wrap">
              <CheckCircle size={18} className="text-cyan" />
              <h3 className="card-title text-cyan">Application Successfully Deployed!</h3>
            </div>
            <span className="badge-pill badge-success">Live & Routed</span>
          </div>
          <div className="card-body">
            <div className="form-grid mb-4">
              <div>
                <span className="text-xs text-muted block">Project Name:</span>
                <span className="font-semibold text-white">{deployedProject.name}</span>
              </div>
              <div>
                <span className="text-xs text-muted block">Domain & VHost:</span>
                <code className="text-primary">{deployedProject.domain}</code>
              </div>
              <div>
                <span className="text-xs text-muted block">Allocated Port:</span>
                <span className="badge-pill badge-primary">Port :{deployedProject.port}</span>
              </div>
              <div>
                <span className="text-xs text-muted block">Local Directory:</span>
                <code className="code-path">{deployedProject.path}</code>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('apps')}>
                <Server size={14} />
                <span>Manage in Process Manager</span>
              </button>
              <button className="btn btn-secondary-sm" onClick={() => setActiveTab('files')}>
                <FolderTree size={14} />
                <span>Open in File Manager</span>
              </button>
              {deployedProject.port && (
                <a
                  href={`http://localhost:${deployedProject.port}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary-sm"
                >
                  <ExternalLink size={14} />
                  <span>Preview Live Endpoint</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div className="dashboard-section">
        <h2 className="section-title">Select an Application Template to Install</h2>
        <div className="shortcuts-grid">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className={`shortcut-card ${selectedTemplate?.id === tpl.id ? 'border-cyan bg-card-hover' : ''}`}
              onClick={() => handleSelectTemplate(tpl)}
            >
              <div className="shortcut-icon-wrap bg-slate-900">
                {getTemplateIcon(tpl.id)}
              </div>
              <div className="shortcut-info">
                <div className="shortcut-title-row">
                  <span className="shortcut-title">{tpl.name}</span>
                  <span className="badge-pill-micro badge-neutral">{tpl.category}</span>
                </div>
                <p className="shortcut-desc">{tpl.description}</p>
                <div className="mt-3">
                  <button
                    className={`btn-sm ${selectedTemplate?.id === tpl.id ? 'btn-primary' : 'btn-secondary-sm'}`}
                    onClick={(e) => { e.stopPropagation(); handleSelectTemplate(tpl); }}
                  >
                    <span>{selectedTemplate?.id === tpl.id ? 'Selected' : '1-Click Install'}</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deployment Form */}
      {selectedTemplate && (
        <div className="content-card">
          <div className="card-header">
            <div className="card-title-wrap">
              <Rocket size={18} className="text-primary" />
              <h3 className="card-title">Deploy: {selectedTemplate.name}</h3>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleInstallApp} className="form-grid">
              <div className="form-group">
                <label className="form-label">Project Folder Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={projectName}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                    setProjectName(val);
                    setDomainName(`${val}.local`);
                  }}
                  required
                />
                <span className="form-hint">Directory will be created under hosting_data/www/{projectName}</span>
              </div>

              <div className="form-group">
                <label className="form-label">Domain Allocation *</label>
                <input
                  type="text"
                  className="form-input"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  required
                />
                <span className="form-hint">Reverse proxy will automatically bind this host header.</span>
              </div>

              {selectedTemplate.portsRequired && (
                <div className="form-group">
                  <label className="form-label">Dedicated Application Port *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    required
                  />
                  <span className="form-hint">Local port for background server listener.</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Disk Storage Quota (MB)</label>
                <input
                  type="number"
                  className="form-input"
                  value={quotaMb}
                  onChange={(e) => setQuotaMb(e.target.value)}
                  required
                />
                <span className="form-hint">Limits storage consumption to avoid filling server disk.</span>
              </div>

              <div className="col-span-full">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Rocket size={16} />
                  <span>{loading ? 'Scaffolding & Deploying...' : `Install & Launch ${selectedTemplate.name}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

