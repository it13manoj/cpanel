import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  UserPlus,
  ShieldCheck,
  FolderCheck,
  Trash2,
  Folder,
  CheckCircle,
  AlertCircle,
  Wrench,
  Shield
} from 'lucide-react';
import { api } from '../api';

export default function FTPView() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rootPath, setRootPath] = useState('');
  const [permissionLevel, setPermissionLevel] = useState('read_write');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Permission fix tool state
  const [targetFixDir, setTargetFixDir] = useState('hosting_data');
  const [fixing, setFixing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getFTPUsers();
      setUsers(res.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const res = await api.createFTPUser({
        username,
        password,
        root_path: rootPath,
        permission_level: permissionLevel
      });

      setMessage(res.message);
      setUsername('');
      setPassword('');
      setRootPath('');
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`Delete FTP user '${name}'?`)) {
      try {
        await api.deleteFTPUser(id);
        setMessage(`FTP user '${name}' deleted.`);
        loadUsers();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleFixPermissions = async () => {
    try {
      setFixing(true);
      setError(null);
      setMessage(null);

      const res = await api.fixPermissions(targetFixDir);
      setMessage(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">FTP Accounts & Directory Permissions</h1>
          <p className="view-subtitle">
            Manage virtual FTP access credentials, restrict root folder paths and enforce standard security permissions.
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

      {/* Permissions Audit & Fix Utility Banner */}
      <div className="content-card mb-6 border-cyan">
        <div className="card-header">
          <div className="card-title-wrap">
            <Wrench size={18} className="text-cyan" />
            <h3 className="card-title">Server Permission Repair Utility</h3>
          </div>
        </div>
        <div className="card-body">
          <p className="text-sm text-muted mb-4">
            Reset and enforce secure web hosting permissions across all directories (0755 for folders and 0644 for files). Resolves "Permission Denied" errors without SSH access.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="text"
              className="form-input flex-1"
              value={targetFixDir}
              onChange={(e) => setTargetFixDir(e.target.value)}
              placeholder="Target folder path (e.g. hosting_data or hosting_data/www/domain)"
            />
            <button
              className="btn btn-primary"
              onClick={handleFixPermissions}
              disabled={fixing}
            >
              <ShieldCheck size={16} />
              <span>{fixing ? 'Verifying & Repairing...' : 'Enforce 0755/0644 Permissions'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Create FTP User Form */}
      <div className="content-card mb-6">
        <div className="card-header">
          <div className="card-title-wrap">
            <UserPlus size={18} className="text-primary" />
            <h3 className="card-title">Add New FTP Account</h3>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleCreateUser} className="form-grid">
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. webmaster or client1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Home Directory</label>
              <input
                type="text"
                className="form-input"
                placeholder="Default: hosting_data/ftp/{username}"
                value={rootPath}
                onChange={(e) => setRootPath(e.target.value)}
              />
              <span className="form-hint">User will be jailed to this directory path.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Permission Access Level</label>
              <select
                className="form-select"
                value={permissionLevel}
                onChange={(e) => setPermissionLevel(e.target.value)}
              >
                <option value="read_write">Read & Write (Upload, Edit, Delete)</option>
                <option value="read_only">Read Only (Download & View Only)</option>
                <option value="full">Full Admin Rights</option>
              </select>
            </div>

            <div className="col-span-full">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <UserPlus size={16} />
                <span>Create FTP Account</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* FTP Accounts List */}
      <div className="content-card">
        <div className="card-header">
          <div className="card-title-wrap">
            <KeyRound size={18} className="text-purple" />
            <h3 className="card-title">Configured FTP Accounts ({users.length})</h3>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="cpanel-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Restricted Home Directory</th>
                  <th>Permission Level</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-muted">No FTP accounts configured yet.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <span className="font-semibold text-white">{u.username}</span>
                      </td>
                      <td>
                        <code className="code-path">{u.root_path}</code>
                      </td>
                      <td>
                        <span className={`badge-pill ${u.permission_level === 'read_write' ? 'badge-primary' : 'badge-neutral'}`}>
                          {u.permission_level === 'read_write' ? 'Read & Write' : u.permission_level}
                        </span>
                      </td>
                      <td>
                        <span className="badge-pill badge-success">{u.status || 'Active'}</span>
                      </td>
                      <td>
                        <span className="text-xs text-muted">
                          {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          className="btn-icon-danger"
                          title="Delete FTP Account"
                          onClick={() => handleDeleteUser(u.id, u.username)}
                        >
                          <Trash2 size={16} />
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
    </div>
  );
}

