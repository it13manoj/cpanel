import React, { useState, useEffect } from 'react';
import {
  Activity,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';

export default function LogsView({ logs, reloadLogs }) {
  const [filterModule, setFilterModule] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleClear = async () => {
    if (window.confirm('Clear all server activity logs?')) {
      try {
        setLoading(true);
        await api.clearLogs();
        setMessage('Logs cleared successfully.');
        reloadLogs();
      } catch (e) {
        alert(e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredLogs = (logs || []).filter((log) => {
    if (filterModule !== 'ALL' && log.module !== filterModule) return false;
    if (searchTerm) {
      const match =
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.module?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  const modules = ['ALL', 'DOMAINS', 'MYSQL', 'FILE_MANAGER', 'PACKAGES', 'FTP', 'PERMISSIONS', 'APPS', 'TERMINAL', 'CRON'];

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">System & Security Audit Logs</h1>
          <p className="view-subtitle">
            Immutable database records of all actions executed through this cPanel dashboard.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary-sm" onClick={reloadLogs} title="Refresh">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-danger-sm" onClick={handleClear} title="Clear Logs">
            <Trash2 size={14} />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{message}</span>
        </div>
      )}

      {/* Filters */}
      <div className="content-card mb-4 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1">
            {modules.map((m) => (
              <button
                key={m}
                className={`subtab-pill ${filterModule === m ? 'active' : ''}`}
                onClick={() => setFilterModule(m)}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="header-search-wrap w-64">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search in logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="header-search-input"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="content-card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="cpanel-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-muted">No logs matching filter.</td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap text-xs text-muted">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td>
                        <span className="badge-pill badge-primary">{log.module}</span>
                      </td>
                      <td>
                        <span className="font-medium text-white">{log.action}</span>
                      </td>
                      <td>
                        <span className={`badge-pill ${log.status === 'success' ? 'badge-success' : 'badge-danger'}`}>
                          {log.status || 'success'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-muted block max-w-md truncate" title={log.details}>
                          {log.details || '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

