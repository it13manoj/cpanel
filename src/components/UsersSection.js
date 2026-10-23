import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Trash2,
  CheckCircle,
  AlertCircle,
  Folder,
  HardDrive
} from 'lucide-react';
import { api } from '../api';

export default function UsersSection({ domains, currentUser, setCurrentUser }) {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [allocatedDomain, setAllocatedDomain] = useState('');
  const [quotaMb, setQuotaMb] = useState(500);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getPanelUsers();
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

      const res = await api.createPanelUser({
        username,
        password,
        role,
        allocated_domain: allocatedDomain || null,
        disk_quota_mb: parseInt(quotaMb, 10)
      });

      setMessage(res.message);
      setUsername('');
      setPassword('');
      setAllocatedDomain('');
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`Delete user '${name}'?`)) {
      try {
        await api.deletePanelUser(id);
        setMessage(`User '${name}' deleted.`);
        loadUsers();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleSwitchUser = (user) => {
    if (setCurrentUser) {
      setCurrentUser(user);
      setMessage(`Switched active session to: ${user.username} (${user.role.toUpperCase()})`);
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">User & Panel Admin Access Management</h1>
          <p className="view-subtitle">
            Configure Admin superusers and isolated Project Users with restricted domain access and storage quotas.
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

      {/* Create User Form */}
      <div className="content-card mb-6">
        <div className="card-header">
          <div className="card-title-wrap">
            <UserPlus size={18} className="text-primary" />
            <h3 className="card-title">Create Panel User</h3>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleCreateUser} className="form-grid">
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. client_admin or dev_team"
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
              <label className="form-label">Role Privilege</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">Project User (Restricted to their Domain & Quota)</option>
                <option value="admin">Panel Admin (Full Root Server Access)</option>
              </select>
            </div>

            {role === 'user' && (
              <>
                <div className="form-group">
                  <label className="form-label">Assigned Domain / Project</label>
                  <select
                    className="form-select"
                    value={allocatedDomain}
                    onChange={(e) => setAllocatedDomain(e.target.value)}
                  >
                    <option value="">-- All Projects --</option>
                    {domains.map((d) => (
                      <option key={d.id} value={d.domain_name}>{d.domain_name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Disk Quota (MB)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={quotaMb}
                    onChange={(e) => setQuotaMb(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="col-span-full">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <UserPlus size={16} />
                <span>Create User Account</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Users Table */}
      <div className="content-card">
        <div className="card-header">
          <div className="card-title-wrap">
            <Users size={18} className="text-info" />
            <h3 className="card-title">Registered Panel Users ({users.length})</h3>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="cpanel-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Allocated Domain</th>
                  <th>Storage Quota</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{u.username}</span>
                        {currentUser?.username === u.username && (
                          <span className="badge-pill badge-primary">Active Session</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge-pill ${u.role === 'admin' ? 'badge-primary' : 'badge-neutral'}`}>
                        {u.role === 'admin' ? 'Super Admin' : 'Project User'}
                      </span>
                    </td>
                    <td>
                      {u.allocated_domain ? (
                        <code className="text-xs text-primary">{u.allocated_domain}</code>
                      ) : (
                        <span className="text-xs text-muted">Global / All</span>
                      )}
                    </td>
                    <td>
                      <span className="font-mono text-xs">{u.disk_quota_mb} MB</span>
                    </td>
                    <td>
                      <span className="badge-pill badge-success">{u.status}</span>
                    </td>
                    <td className="text-right">
                      <div className="action-buttons-inline">
                        <button
                          className="btn-secondary-sm"
                          onClick={() => handleSwitchUser(u)}
                          title="Simulate / Switch Login as this user"
                        >
                          <span>Switch Session</span>
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            className="btn-icon-danger"
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

