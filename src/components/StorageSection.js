import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  ShieldCheck,
  Trash2,
  RefreshCw,
  Edit,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Lock,
  PieChart
} from 'lucide-react';
import { api } from '../api';

export default function StorageSection({ domains, reloadDomains }) {
  const [quotas, setQuotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Edit Quota modal state
  const [editingDomain, setEditingDomain] = useState(null);
  const [newQuotaMb, setNewQuotaMb] = useState(500);

  // SSL Generation state
  const [selectedDomainForSSL, setSelectedDomainForSSL] = useState('');
  const [sslLoading, setSslLoading] = useState(false);

  useEffect(() => {
    loadQuotas();
  }, []);

  const loadQuotas = async () => {
    try {
      setLoading(true);
      const res = await api.getQuotas();
      setQuotas(res.projectsStorage || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanStorage = async () => {
    try {
      setCleaning(true);
      setError(null);
      setMessage(null);
      const res = await api.cleanServerSpace();
      setMessage(res.message);
      loadQuotas();
    } catch (err) {
      setError(err.message);
    } finally {
      setCleaning(false);
    }
  };

  const handleUpdateQuota = async (e) => {
    e.preventDefault();
    if (!editingDomain) return;

    try {
      setLoading(true);
      const res = await api.updateQuota(editingDomain.id, parseInt(newQuotaMb, 10));
      setMessage(res.message);
      setEditingDomain(null);
      loadQuotas();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSSL = async (e) => {
    e.preventDefault();
    if (!selectedDomainForSSL) return;

    const dom = domains.find(d => d.domain_name === selectedDomainForSSL);
    if (!dom) return;

    try {
      setSslLoading(true);
      setError(null);
      setMessage(null);

      const res = await api.generateSSL(dom.id, dom.domain_name);
      setMessage(res.message);
      if (reloadDomains) reloadDomains();
    } catch (err) {
      setError(err.message);
    } finally {
      setSslLoading(false);
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Storage Quotas & Space Isolation</h1>
          <p className="view-subtitle">
            Enforce disk limits per project, recover wasted server storage, and issue automated SSL certificates.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary-sm" onClick={loadQuotas} title="Refresh">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleCleanStorage}
            disabled={cleaning}
            title="Clean server cache & temporary files"
          >
            <Sparkles size={14} />
            <span>{cleaning ? 'Cleaning...' : '1-Click Clean Server Space'}</span>
          </button>
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

      {/* Two Columns: Automated SSL Config & Storage Cleaner Overview */}
      <div className="dashboard-cols mb-6">
        {/* Automated SSL Certificate Issuer */}
        <div className="content-card">
          <div className="card-header">
            <div className="card-title-wrap">
              <Lock size={18} className="text-emerald" />
              <h3 className="card-title">Automated SSL Certificate Issuer</h3>
            </div>
          </div>
          <div className="card-body">
            <p className="text-sm text-muted mb-4">
              Generate self-signed or Let's Encrypt certificates and auto-bind HTTPS to your domain without manual OpenSSL or certbot commands.
            </p>
            <form onSubmit={handleGenerateSSL} className="form-inline-wrap">
              <div className="form-group flex-1">
                <label className="form-label">Select Domain</label>
                <select
                  className="form-select"
                  value={selectedDomainForSSL}
                  onChange={(e) => setSelectedDomainForSSL(e.target.value)}
                  required
                >
                  <option value="">-- Choose Domain --</option>
                  {domains.map((d) => (
                    <option key={d.id} value={d.domain_name}>
                      {d.domain_name} {d.ssl_enabled ? '(HTTPS Active)' : '(Needs SSL)'}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-align-bottom"
                disabled={sslLoading || !selectedDomainForSSL}
              >
                <ShieldCheck size={16} />
                <span>{sslLoading ? 'Issuing Certificate...' : 'Issue & Install SSL'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Space Isolation Explanation Card */}
        <div className="content-card">
          <div className="card-header">
            <div className="card-title-wrap">
              <HardDrive size={18} className="text-warning" />
              <h3 className="card-title">Server Space Isolation Policy</h3>
            </div>
          </div>
          <div className="card-body">
            <p className="text-sm text-muted mb-2">
              <strong className="text-white">Strict Isolation:</strong> Non-admin users are strictly restricted to their designated project directories and assigned disk quotas.
            </p>
            <ul className="text-xs text-muted space-y-1 list-disc pl-4">
              <li>Users cannot view or access root server space or other projects.</li>
              <li>When a project reaches 100% quota, further file uploads are blocked.</li>
              <li>1-Click Space Cleaner immediately clears npm cache and temp files.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Storage Quotas Table */}
      <div className="content-card">
        <div className="card-header">
          <div className="card-title-wrap">
            <PieChart size={18} className="text-cyan" />
            <h3 className="card-title">Domain & Project Storage Consumption</h3>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="cpanel-table">
              <thead>
                <tr>
                  <th>Domain Name</th>
                  <th>Directory</th>
                  <th>Storage Used</th>
                  <th>Assigned Quota</th>
                  <th>Quota Utilization</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-muted">No domains configured.</td>
                  </tr>
                ) : (
                  quotas.map((q) => (
                    <tr key={q.id}>
                      <td>
                        <span className="font-semibold text-white">{q.domain_name}</span>
                      </td>
                      <td>
                        <code className="code-path">{q.doc_root}</code>
                      </td>
                      <td>
                        <span className="font-mono text-white">{q.usedMb} MB</span>
                      </td>
                      <td>
                        <span className="font-mono text-muted">{q.quotaMb} MB</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="progress-bar-bg flex-1" style={{ minWidth: 100 }}>
                            <div
                              className={`progress-bar-fill ${q.percentUsed > 90 ? 'fill-danger' : q.percentUsed > 70 ? 'fill-warning' : 'fill-cyan'}`}
                              style={{ width: `${q.percentUsed}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-mono">{q.percentUsed}%</span>
                        </div>
                      </td>
                      <td className="text-right">
                        <button
                          className="btn-secondary-sm"
                          onClick={() => {
                            setEditingDomain(q);
                            setNewQuotaMb(q.quotaMb);
                          }}
                          title="Change Quota"
                        >
                          <Edit size={12} />
                          <span>Change Quota</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Quota Modal */}
      {editingDomain && (
        <div className="modal-backdrop">
          <div className="modal-card modal-sm">
            <div className="modal-header">
              <h3 className="font-semibold text-white">Adjust Storage Quota</h3>
              <button className="btn-icon-sm" onClick={() => setEditingDomain(null)}>×</button>
            </div>
            <form onSubmit={handleUpdateQuota} className="p-4">
              <div className="form-group mb-4">
                <label className="form-label">Domain: {editingDomain.domain_name}</label>
                <div className="input-with-icon">
                  <HardDrive size={16} className="input-icon" />
                  <input
                    type="number"
                    className="form-input"
                    value={newQuotaMb}
                    onChange={(e) => setNewQuotaMb(e.target.value)}
                    required
                  />
                </div>
                <span className="form-hint">Max disk capacity allowed in Megabytes (MB).</span>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-secondary-sm" onClick={() => setEditingDomain(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Quota</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

