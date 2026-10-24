import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Copy,
  CheckCircle,
  AlertCircle,
  Server,
  Search,
  ExternalLink,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { api } from '../api';

export default function ZoneEditorView({ domains, initialDomain }) {
  const [selectedDomain, setSelectedDomain] = useState(initialDomain || domains[0]?.domain_name || '');
  const [dnsData, setDnsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [copiedNS, setCopiedNS] = useState(false);

  // Add/Edit Record Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [recordType, setRecordType] = useState('A');
  const [recordName, setRecordName] = useState('');
  const [recordTtl, setRecordTtl] = useState(14400);
  const [recordValue, setRecordValue] = useState('');
  const [recordPriority, setRecordPriority] = useState(10);

  useEffect(() => {
    if (selectedDomain) {
      loadDnsRecords(selectedDomain);
    }
  }, [selectedDomain]);

  useEffect(() => {
    if (!selectedDomain && domains.length > 0) {
      setSelectedDomain(domains[0].domain_name);
    }
  }, [domains]);

  const loadDnsRecords = async (domain) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDnsRecords(domain);
      setDnsData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = (type = 'A') => {
    setEditingRecordId(null);
    setRecordType(type);
    setRecordName(selectedDomain);
    setRecordTtl(14400);
    setRecordValue(type === 'A' ? (dnsData?.serverIp || '173.212.235.87') : '');
    setRecordPriority(10);
    setModalOpen(true);
  };

  const handleOpenEditModal = (rec) => {
    setEditingRecordId(rec.id);
    setRecordType(rec.record_type);
    setRecordName(rec.name.replace(/\.$/, ''));
    setRecordTtl(rec.ttl);
    setRecordValue(rec.value.replace(/\.$/, ''));
    setRecordPriority(rec.priority || 10);
    setModalOpen(true);
  };

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    if (!recordName || !recordValue) return;

    try {
      setLoading(true);
      if (editingRecordId) {
        await api.updateDnsRecord(editingRecordId, {
          record_type: recordType,
          name: recordName,
          ttl: recordTtl,
          value: recordValue,
          priority: recordType === 'MX' ? recordPriority : null
        });
        setMessage('DNS Record updated successfully!');
      } else {
        await api.addDnsRecord({
          domain: selectedDomain,
          record_type: recordType,
          name: recordName,
          ttl: recordTtl,
          value: recordValue,
          priority: recordType === 'MX' ? recordPriority : null
        });
        setMessage(`${recordType} record added successfully!`);
      }
      setModalOpen(false);
      loadDnsRecords(selectedDomain);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (id, name, type) => {
    if (window.confirm(`Delete ${type} record '${name}'?`)) {
      try {
        setLoading(true);
        await api.deleteDnsRecord(id);
        setMessage(`Deleted ${type} record.`);
        loadDnsRecords(selectedDomain);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResetZone = async () => {
    if (window.confirm(`Reset all DNS records for '${selectedDomain}' to default standard hosting template?`)) {
      try {
        setLoading(true);
        const res = await api.resetDnsZone(selectedDomain);
        setMessage(res.message);
        loadDnsRecords(selectedDomain);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopyNameservers = () => {
    if (!dnsData?.nameservers) return;
    const text = dnsData.nameservers.map(n => `${n.ns} (${n.ip})`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedNS(true);
    setTimeout(() => setCopiedNS(false), 2500);
  };

  const filteredRecords = (dnsData?.records || []).filter((r) => {
    if (!searchTerm) return true;
    return (
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.record_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'A': return 'badge-primary';
      case 'CNAME': return 'badge-cyan';
      case 'MX': return 'badge-warning';
      case 'TXT': return 'badge-success';
      case 'NS': return 'badge-purple';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Zone Editor (DNS Records & Nameservers)</h1>
          <p className="view-subtitle">
            Manage domain nameservers (NS), A records, CNAME, MX mail routing and TXT records directly in cPanel.
          </p>
        </div>

        {/* Domain Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-muted">Domain:</label>
          <select
            className="form-select w-64"
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
          >
            {domains.map((d) => (
              <option key={d.id} value={d.domain_name}>{d.domain_name}</option>
            ))}
          </select>
          <button className="btn-icon" onClick={() => loadDnsRecords(selectedDomain)} title="Refresh DNS">
            <RefreshCw size={16} />
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

      {/* Nameservers (NS) Delegation Banner - Crucial for user */}
      <div className="content-card mb-6 border-cyan">
        <div className="card-header bg-cyan-dim">
          <div className="card-title-wrap">
            <Server size={18} className="text-cyan" />
            <h3 className="card-title text-cyan">Authoritative Nameservers for {selectedDomain}</h3>
          </div>
          <button className="btn btn-secondary-sm" onClick={handleCopyNameservers}>
            <Copy size={14} />
            <span>{copiedNS ? 'Copied to Clipboard!' : 'Copy Nameservers'}</span>
          </button>
        </div>
        <div className="card-body">
          <p className="text-sm text-muted mb-3">
            To manage this domain completely through this cPanel, point your domain registrar (GoDaddy, Namecheap, Hostinger, etc.) to these nameservers:
          </p>
          <div className="dashboard-cols mb-3">
            <div className="p-3 bg-slate-100 rounded border border-slate-200">
              <span className="text-xs text-muted block font-semibold">Primary Nameserver (NS1)</span>
              <code className="text-base text-primary font-bold block mt-1">ns1.{selectedDomain}</code>
              <span className="text-xs text-dim block mt-1">Resolves to IP: <strong>{dnsData?.serverIp || '173.212.235.87'}</strong></span>
            </div>
            <div className="p-3 bg-slate-100 rounded border border-slate-200">
              <span className="text-xs text-muted block font-semibold">Secondary Nameserver (NS2)</span>
              <code className="text-base text-primary font-bold block mt-1">ns2.{selectedDomain}</code>
              <span className="text-xs text-dim block mt-1">Resolves to IP: <strong>{dnsData?.serverIp || '173.212.235.87'}</strong></span>
            </div>
          </div>

          {/* GoDaddy / Registrar Setup Guidance */}
          <div className="p-3 rounded border border-amber-300 bg-amber-50 text-amber-900 text-xs mt-3">
            <div className="font-bold mb-1 flex items-center gap-1 text-sm text-amber-950">
              <span>⚠️ Important for GoDaddy / Namecheap:</span>
            </div>
            <p className="mb-2">
              If GoDaddy shows <em>"You have not set these up yet"</em>, choose either of these methods:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <div className="bg-white p-2.5 rounded border border-amber-200">
                <span className="font-bold text-slate-800 block mb-1">⚡ Method A: Instant Direct Pointing (Recommended)</span>
                <span className="text-slate-600 leading-relaxed block">
                  Keep GoDaddy default nameservers, and add an <strong>A Record</strong> in GoDaddy DNS:
                  <br />• <strong>Type</strong>: <code>A</code>
                  <br />• <strong>Name / Host</strong>: <code>@</code>
                  <br />• <strong>Value / Points to</strong>: <code>{dnsData?.serverIp || '173.212.235.87'}</code>
                  <br />• <strong>TTL</strong>: <code>1/2 Hour</code>
                </span>
              </div>
              <div className="bg-white p-2.5 rounded border border-amber-200">
                <span className="font-bold text-slate-800 block mb-1">🔧 Method B: Custom Nameservers with Host Names</span>
                <span className="text-slate-600 leading-relaxed block">
                  In GoDaddy &rarr; Domain Settings &rarr; <strong>Host Names</strong> (Glue Records):
                  <br />• Add Host: <code>ns1</code> &rarr; IP: <code>{dnsData?.serverIp || '173.212.235.87'}</code>
                  <br />• Add Host: <code>ns2</code> &rarr; IP: <code>{dnsData?.serverIp || '173.212.235.87'}</code>
                  <br />Then save the nameservers!
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DNS Records Toolbar */}
      <div className="content-card mb-4 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenAddModal('A')}>
              <Plus size={14} />
              <span>+ A Record</span>
            </button>
            <button className="btn btn-secondary-sm" onClick={() => handleOpenAddModal('CNAME')}>
              <Plus size={14} />
              <span>+ CNAME Record</span>
            </button>
            <button className="btn btn-secondary-sm" onClick={() => handleOpenAddModal('MX')}>
              <Plus size={14} />
              <span>+ MX Record</span>
            </button>
            <button className="btn btn-secondary-sm" onClick={() => handleOpenAddModal('TXT')}>
              <Plus size={14} />
              <span>+ TXT Record</span>
            </button>
            <button className="btn btn-secondary-sm" onClick={() => handleOpenAddModal('NS')}>
              <Plus size={14} />
              <span>+ NS Record</span>
            </button>
            <button className="btn-secondary-sm text-amber" onClick={handleResetZone} title="Reset Zone to Standard Defaults">
              <RotateCcw size={14} />
              <span>Reset Zone</span>
            </button>
          </div>

          <div className="header-search-wrap w-64">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="header-search-input"
            />
          </div>
        </div>
      </div>

      {/* DNS Records Table */}
      <div className="content-card">
        <div className="card-header">
          <div className="card-title-wrap">
            <Globe size={18} className="text-primary" />
            <h3 className="card-title">DNS Zone Records for {selectedDomain} ({filteredRecords.length})</h3>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="cpanel-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>TTL</th>
                  <th>Class</th>
                  <th>Type</th>
                  <th>Record Destination / Value</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-muted">
                      No DNS records found. Click "+ A Record" or "Reset Zone" to populate standard hosting records.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => (
                    <tr key={rec.id}>
                      <td>
                        <span className="font-semibold text-dark">{rec.name}</span>
                      </td>
                      <td>
                        <span className="font-mono text-xs">{rec.ttl}</span>
                      </td>
                      <td>
                        <span className="text-xs text-muted">IN</span>
                      </td>
                      <td>
                        <span className={`badge-pill ${getTypeBadgeClass(rec.record_type)}`}>
                          {rec.record_type}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <code className="code-path">{rec.value}</code>
                          {rec.priority !== null && (
                            <span className="badge-pill-micro badge-neutral">Priority: {rec.priority}</span>
                          )}
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="action-buttons-inline">
                          <button
                            className="btn-icon-sm"
                            title="Edit Record"
                            onClick={() => handleOpenEditModal(rec)}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn-icon-danger"
                            title="Delete Record"
                            onClick={() => handleDeleteRecord(rec.id, rec.name, rec.record_type)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Record Modal */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-sm">
            <div className="modal-header">
              <h3 className="font-semibold text-white">
                {editingRecordId ? `Edit ${recordType} Record` : `Add ${recordType} Record`}
              </h3>
              <button className="btn-icon-sm" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveRecord} className="p-4">
              <div className="form-group mb-3">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value)}
                  disabled={!!editingRecordId}
                >
                  <option value="A">A (Address)</option>
                  <option value="CNAME">CNAME (Alias)</option>
                  <option value="MX">MX (Mail Exchange)</option>
                  <option value="TXT">TXT (Text / SPF)</option>
                  <option value="NS">NS (Nameserver)</option>
                  <option value="AAAA">AAAA (IPv6)</option>
                </select>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Name (Host / Subdomain)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={`e.g. ${selectedDomain} or mail.${selectedDomain}`}
                  value={recordName}
                  onChange={(e) => setRecordName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">TTL (Time to Live in seconds)</label>
                <input
                  type="number"
                  className="form-input"
                  value={recordTtl}
                  onChange={(e) => setRecordTtl(e.target.value)}
                  required
                />
              </div>

              {recordType === 'MX' && (
                <div className="form-group mb-3">
                  <label className="form-label">Priority</label>
                  <input
                    type="number"
                    className="form-input"
                    value={recordPriority}
                    onChange={(e) => setRecordPriority(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group mb-4">
                <label className="form-label">
                  {recordType === 'A' ? 'IPv4 Address' : recordType === 'CNAME' ? 'Target Domain / Host' : recordType === 'MX' ? 'Mail Exchanger Host' : 'Record Content / Value'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={recordType === 'A' ? 'e.g. 159.89.149.97' : recordType === 'CNAME' ? `e.g. ${selectedDomain}` : 'Enter record value'}
                  value={recordValue}
                  onChange={(e) => setRecordValue(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-secondary-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

