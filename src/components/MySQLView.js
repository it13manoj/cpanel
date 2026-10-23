import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Play,
  UserPlus,
  KeyRound,
  Table,
  CheckCircle,
  AlertCircle,
  Clock,
  ShieldAlert,
  Search
} from 'lucide-react';
import { api } from '../api';

export default function MySQLView() {
  const [activeSubTab, setActiveSubTab] = useState('databases'); // 'databases', 'users', 'console'
  const [databases, setDatabases] = useState([]);
  const [dbUsers, setDbUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // New Database form state
  const [newDbName, setNewDbName] = useState('');
  const [newDbCharset, setNewDbCharset] = useState('utf8mb4');

  // New User form state
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserHost, setNewUserHost] = useState('%');
  const [newUserDb, setNewUserDb] = useState('');

  // SQL Query console state
  const [selectedDb, setSelectedDb] = useState('cpanel');
  const [sqlQuery, setSqlQuery] = useState('SHOW TABLES;');
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dbRes, userRes] = await Promise.all([
        api.getDatabases(),
        api.getDbUsers()
      ]);
      setDatabases(dbRes.databases || []);
      setDbUsers(userRes.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDatabase = async (e) => {
    e.preventDefault();
    if (!newDbName) return;

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const res = await api.createDatabase({
        db_name: newDbName,
        charset: newDbCharset
      });

      setMessage(res.message);
      setNewDbName('');
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDatabase = async (name) => {
    if (window.confirm(`⚠️ CAUTION: Are you sure you want to permanently DROP database '${name}'? All tables and data will be destroyed.`)) {
      try {
        await api.deleteDatabase(name);
        setMessage(`Database '${name}' deleted successfully.`);
        loadData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newUserPassword) return;

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const res = await api.createDbUser({
        username: newUsername,
        password: newUserPassword,
        host: newUserHost,
        database: newUserDb || null
      });

      setMessage(res.message);
      setNewUsername('');
      setNewUserPassword('');
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (username, host) => {
    if (window.confirm(`Delete MySQL user '${username}'@'${host}'?`)) {
      try {
        await api.deleteDbUser(username, host);
        setMessage(`User '${username}' removed.`);
        loadData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleExecuteQuery = async (e) => {
    if (e) e.preventDefault();
    if (!sqlQuery.trim()) return;

    try {
      setQueryLoading(true);
      setError(null);
      const res = await api.executeSQL(sqlQuery, selectedDb);
      setQueryResult(res);
    } catch (err) {
      setError(err.message);
      setQueryResult(null);
    } finally {
      setQueryLoading(false);
    }
  };

  const openConsoleWithDb = (name) => {
    setSelectedDb(name);
    setSqlQuery(`SHOW TABLES;`);
    setActiveSubTab('console');
    setTimeout(() => {
      api.executeSQL('SHOW TABLES;', name).then(res => setQueryResult(res)).catch(() => {});
    }, 100);
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">MySQL Database Management</h1>
          <p className="view-subtitle">
            Manage schemas, configure privileges, and execute SQL queries directly from your panel.
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="subtab-pills">
          <button
            className={`subtab-pill ${activeSubTab === 'databases' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('databases')}
          >
            <Database size={16} />
            <span>Databases ({databases.length})</span>
          </button>
          <button
            className={`subtab-pill ${activeSubTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('users')}
          >
            <KeyRound size={16} />
            <span>DB Users ({dbUsers.length})</span>
          </button>
          <button
            className={`subtab-pill ${activeSubTab === 'console' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('console')}
          >
            <Play size={16} />
            <span>SQL Query Console</span>
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

      {/* Subtab 1: Databases */}
      {activeSubTab === 'databases' && (
        <>
          {/* Create DB Form */}
          <div className="content-card mb-6">
            <div className="card-header">
              <div className="card-title-wrap">
                <Plus size={18} className="text-primary" />
                <h3 className="card-title">Create New Database</h3>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateDatabase} className="form-inline-wrap">
                <div className="form-group flex-1">
                  <label className="form-label">Database Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ecommerce_store or blog_db"
                    value={newDbName}
                    onChange={(e) => setNewDbName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group w-48">
                  <label className="form-label">Character Set</label>
                  <select
                    className="form-select"
                    value={newDbCharset}
                    onChange={(e) => setNewDbCharset(e.target.value)}
                  >
                    <option value="utf8mb4">utf8mb4 (Recommended)</option>
                    <option value="utf8">utf8</option>
                    <option value="latin1">latin1</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary btn-align-bottom" disabled={loading}>
                  <Plus size={16} />
                  <span>Create Database</span>
                </button>
              </form>
            </div>
          </div>

          {/* Database List */}
          <div className="content-card">
            <div className="card-header">
              <div className="card-title-wrap">
                <Database size={18} className="text-warning" />
                <h3 className="card-title">Databases on Localhost:3306</h3>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="cpanel-table">
                  <thead>
                    <tr>
                      <th>Database Name</th>
                      <th>Tables</th>
                      <th>Size (MB)</th>
                      <th>Type</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {databases.map((db) => (
                      <tr key={db.name}>
                        <td>
                          <div className="db-name-cell">
                            <Database size={16} className={db.is_system ? 'text-muted' : 'text-primary'} />
                            <span className="font-semibold">{db.name}</span>
                            {db.name === 'cpanel' && (
                              <span className="badge-pill badge-primary">System Core</span>
                            )}
                          </div>
                        </td>
                        <td>{db.tables_count} tables</td>
                        <td>{db.size_mb} MB</td>
                        <td>
                          {db.is_system ? (
                            <span className="badge-pill badge-neutral">MySQL System</span>
                          ) : (
                            <span className="badge-pill badge-success">User Database</span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="action-buttons-inline">
                            <button
                              className="btn-secondary-sm"
                              title="Open in SQL Query Console"
                              onClick={() => openConsoleWithDb(db.name)}
                            >
                              <Table size={14} />
                              <span>Query / Tables</span>
                            </button>
                            {!db.is_system && db.name !== 'cpanel' && (
                              <button
                                className="btn-icon-danger"
                                title="Drop Database"
                                onClick={() => handleDeleteDatabase(db.name)}
                              >
                                <Trash2 size={16} />
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
        </>
      )}

      {/* Subtab 2: Database Users & Privileges */}
      {activeSubTab === 'users' && (
        <>
          <div className="content-card mb-6">
            <div className="card-header">
              <div className="card-title-wrap">
                <UserPlus size={18} className="text-primary" />
                <h3 className="card-title">Create Database User & Grant Privileges</h3>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateUser} className="form-grid">
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. app_user"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter secure password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Host Match</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Default: % (Any Host) or localhost"
                    value={newUserHost}
                    onChange={(e) => setNewUserHost(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Grant Full Access to Database</label>
                  <select
                    className="form-select"
                    value={newUserDb}
                    onChange={(e) => setNewUserDb(e.target.value)}
                  >
                    <option value="">-- No DB Grant (Global User) --</option>
                    {databases.map((d) => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-full">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    <UserPlus size={16} />
                    <span>Create User & Grant Privileges</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="content-card">
            <div className="card-header">
              <div className="card-title-wrap">
                <KeyRound size={18} className="text-info" />
                <h3 className="card-title">MySQL Database Users</h3>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="cpanel-table">
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>Host Rule</th>
                      <th>Privilege Scope</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbUsers.map((u, idx) => (
                      <tr key={`${u.User}-${u.Host}-${idx}`}>
                        <td>
                          <span className="font-semibold">{u.User}</span>
                          {u.User === 'root' && (
                            <span className="badge-pill badge-primary ml-2">Root Superuser</span>
                          )}
                        </td>
                        <td><code>{u.Host}</code></td>
                        <td>
                          {u.User === 'root' ? (
                            <span className="badge-pill badge-success">ALL PRIVILEGES</span>
                          ) : (
                            <span className="badge-pill badge-neutral">Assigned Privileges</span>
                          )}
                        </td>
                        <td className="text-right">
                          {u.User !== 'root' && (
                            <button
                              className="btn-icon-danger"
                              title="Delete User"
                              onClick={() => handleDeleteUser(u.User, u.Host)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Subtab 3: SQL Query Console & Table Browser */}
      {activeSubTab === 'console' && (
        <div className="sql-console-wrap">
          <div className="content-card mb-4">
            <div className="card-header">
              <div className="card-title-wrap">
                <Play size={18} className="text-primary" />
                <h3 className="card-title">SQL Query Runner & Table Inspector</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted">Active Database:</span>
                <select
                  className="form-select-sm"
                  value={selectedDb}
                  onChange={(e) => setSelectedDb(e.target.value)}
                >
                  {databases.map((d) => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="card-body">
              <div className="sql-editor-wrap">
                <textarea
                  className="sql-textarea"
                  rows={4}
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="Enter standard SQL query (SELECT, INSERT, UPDATE, SHOW TABLES, etc.)..."
                />
              </div>

              <div className="sql-actions-bar">
                <div className="sql-templates">
                  <span className="text-xs text-muted font-semibold">Snippets:</span>
                  <button className="btn-chip" onClick={() => setSqlQuery('SHOW TABLES;')}>SHOW TABLES</button>
                  <button className="btn-chip" onClick={() => setSqlQuery('SELECT * FROM domains;')}>SELECT domains</button>
                  <button className="btn-chip" onClick={() => setSqlQuery('SHOW STATUS LIKE "%threads%";')}>Threads Status</button>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleExecuteQuery}
                  disabled={queryLoading}
                >
                  <Play size={16} />
                  <span>{queryLoading ? 'Executing...' : 'Execute Query (Ctrl+Enter)'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Results Display */}
          {queryResult && (
            <div className="content-card">
              <div className="card-header">
                <div className="card-title-wrap">
                  <Table size={18} className="text-success" />
                  <h3 className="card-title">Query Results</h3>
                  <span className="badge-pill badge-neutral">
                    <Clock size={12} />
                    {queryResult.executionTimeMs} ms
                  </span>
                  <span className="badge-pill badge-neutral">
                    {queryResult.isSelect ? `${queryResult.rows?.length || 0} rows returned` : `${queryResult.affectedRows} affected`}
                  </span>
                </div>
              </div>
              <div className="card-body p-0">
                {queryResult.isSelect && queryResult.rows?.length > 0 ? (
                  <div className="table-responsive sql-result-scroll">
                    <table className="cpanel-table">
                      <thead>
                        <tr>
                          {queryResult.columns.map((col) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {queryResult.columns.map((col) => (
                              <td key={col}>
                                {row[col] === null ? (
                                  <span className="text-muted italic">NULL</span>
                                ) : typeof row[col] === 'object' ? (
                                  JSON.stringify(row[col])
                                ) : (
                                  String(row[col])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state-sm">
                    {queryResult.isSelect ? 'Query returned 0 rows.' : `Query executed successfully. (${queryResult.affectedRows} affected rows)`}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

