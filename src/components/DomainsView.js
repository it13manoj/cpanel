import React, { useState } from 'react';
import {
  Globe,
  Plus,
  Shield,
  ShieldCheck,
  Folder,
  Trash2,
  ExternalLink,
  Layers,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';

export default function DomainsView({ domains, reloadDomains, setActiveTab, onSelectPathForFileManager }) {
  const [domainName, setDomainName] = useState('');
  const [docRoot, setDocRoot] = useState('');
  const [proxyType, setProxyType] = useState('static');
  const [proxyPort, setProxyPort] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleDomainNameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, '');
    setDomainName(val);
    if (!docRoot || docRoot.includes('hosting_data\\www') || docRoot.includes('hosting_data/www')) {
      setDocRoot(`hosting_data/www/${val}`);
    }
  };

  const handleCreateDomain = async (e) => {
    e.preventDefault();
    if (!domainName) {
      setError('Please enter a domain name.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const res = await api.createDomain({
        domain_name: domainName,
        doc_root: docRoot,
        proxy_type: proxyType,
        proxy_port: proxyPort ? parseInt(proxyPort, 10) : null
      });

      setMessage(res.message);
      setDomainName('');
      setDocRoot('');
      setProxyPort('');
      reloadDomains();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSSL = async (id) => {
    try {
      await api.toggleSSL(id);
      reloadDomains();
    } catch (err) {
      alert('Error updating SSL: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete domain '${name}'?`)) {
      try {
        await api.deleteDomain(id);
        reloadDomains();
      } catch (err) {
        alert('Error deleting domain: ' + err.message);
      }
    }
  };

  const handleOpenFolder = (rootPath) => {
    if (onSelectPathForFileManager) {
      onSelectPathForFileManager(rootPath);
    }
    setActiveTab('files');
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Domain & VHost Allocation</h1>
          <p className="view-subtitle">
            Configure domains, assign Document Roots, set up Node.js reverse proxies and activate SSL.
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

      {/* Domain Allocation Form */}
      <div className="content-card mb-6">
        <div className="card-header">
          <div className="card-title-wrap">
            <Plus size={18} className="text-primary" />
            <h3 className="card-title">Allocate New Domain</h3>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleCreateDomain} className="domain-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Domain Name *</label>
                <div className="input-with-icon">
                  <Globe size={16} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. mysite.com or api.domain.com"
                    value={domainName}
                    onChange={handleDomainNameChange}
                    required
                  />
                </div>
                <span className="form-hint">Enter your domain or subdomain.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Document Root Directory</label>
                <div className="input-with-icon">
                  <Folder size={16} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Default: hosting_data/www/{domain}"
                    value={docRoot}
                    onChange={(e) => setDocRoot(e.target.value)}
                  />
                </div>
                <span className="form-hint">Directory will be provisioned with a starter page automatically.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Routing & Hosting Mode</label>
                <select
                  className="form-select"
                  value={proxyType}
                  onChange={(e) => setProxyType(e.target.value)}
                >
                  <option value="static">Static Web Directory (HTML, CSS, JS, Assets)</option>
                  <option value="proxy">Node.js Reverse Proxy (Map to Port)</option>
                </select>
                <span className="form-hint">Select how the server serves incoming domain requests.</span>
              </div>

              {proxyType === 'proxy' && (
                <div className="form-group">
                  <label className="form-label">Target Port (Node.js App) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 3000, 8080"
                    value={proxyPort}
                    onChange={(e) => setProxyPort(e.target.value)}
                    required
                  />
                  <span className="form-hint">The local port where your Node app is listening.</span>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Plus size={16} />
                <span>{loading ? 'Allocating Directory...' : 'Provision & Allocate Domain'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Allocated Domains List */}
      <div className="content-card">
        <div className="card-header">
          <div className="card-title-wrap">
            <Globe size={18} className="text-info" />
            <h3 className="card-title">Allocated Domains ({domains.length})</h3>
          </div>
        </div>
        <div className="card-body p-0">
          {domains.length === 0 ? (
            <div className="empty-state">
              <Globe size={40} className="empty-state-icon" />
              <h3>No Domains Allocated Yet</h3>
              <p>Add your first domain above to automatically create its web root directory.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="cpanel-table">
                <thead>
                  <tr>
                    <th>Domain Name</th>
                    <th>Document Root</th>
                    <th>Hosting Type</th>
                    <th>SSL / HTTPS</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map((dom) => (
                    <tr key={dom.id}>
                      <td>
                        <div className="domain-cell">
                          <span className="domain-title">{dom.domain_name}</span>
                          <span className="domain-id">ID: #{dom.id}</span>
                        </div>
                      </td>
                      <td>
                        <div className="doc-root-cell">
                          <code className="code-path">{dom.doc_root}</code>
                          <button
                            className="btn-icon-sm"
                            title="Open in File Manager"
                            onClick={() => handleOpenFolder(dom.doc_root)}
                          >
                            <Folder size={14} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-pill ${dom.proxy_type === 'proxy' ? 'badge-primary' : 'badge-neutral'}`}>
                          {dom.proxy_type === 'proxy' ? `Reverse Proxy :${dom.proxy_port}` : 'Static Web'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn-ssl-toggle ${dom.ssl_enabled ? 'ssl-active' : 'ssl-inactive'}`}
                          onClick={() => handleToggleSSL(dom.id)}
                          title="Toggle SSL Certificate status"
                        >
                          {dom.ssl_enabled ? (
                            <>
                              <ShieldCheck size={14} />
                              <span>HTTPS Active</span>
                            </>
                          ) : (
                            <>
                              <Shield size={14} />
                              <span>Enable SSL</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td>
                        <span className="badge-pill badge-success">{dom.status || 'Active'}</span>
                      </td>
                      <td className="text-right">
                        <div className="action-buttons-inline">
                          <button
                            className="btn-secondary-sm"
                            title="Manage DNS Records & Nameservers"
                            onClick={() => {
                              if (onSelectPathForFileManager) onSelectPathForFileManager(dom.domain_name);
                              setActiveTab('zone_editor');
                            }}
                          >
                            <Globe size={13} />
                            <span>DNS Zone</span>
                          </button>
                          <button
                            className="btn-icon-danger"
                            title="Delete Domain"
                            onClick={() => handleDelete(dom.id, dom.domain_name)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

