import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Play,
  Trash2,
  Terminal,
  CheckCircle,
  AlertCircle,
  Folder,
  Layers,
  RefreshCw,
  Clock
} from 'lucide-react';
import { api } from '../api';

export default function PackagesView() {
  const [targetDir, setTargetDir] = useState('');
  const [projectData, setProjectData] = useState(null);
  const [packageName, setPackageName] = useState('');
  const [manager, setManager] = useState('npm');
  const [isGlobal, setIsGlobal] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [loading, setLoading] = useState(false);
  const [outputLog, setOutputLog] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadProjectDeps();
    loadHistory();
  }, [targetDir]);

  const loadProjectDeps = async () => {
    try {
      setLoading(true);
      const res = await api.getProjectDeps(targetDir);
      setProjectData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.getPackageHistory();
      setHistory(res.history || []);
    } catch (e) {}
  };

  const handleInstall = async (e) => {
    e.preventDefault();
    if (!packageName) return;

    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      setOutputLog(`$ ${manager} install ${isGlobal ? '-g ' : ''}${isDev ? '--save-dev ' : ''}${packageName}...\nRunning installation...`);

      const res = await api.installPackage({
        packageName,
        manager,
        isGlobal,
        isDev,
        targetDir
      });

      setMessage(res.message);
      setOutputLog(res.stdout || res.stderr || 'Installation complete.');
      setPackageName('');
      loadProjectDeps();
      loadHistory();
    } catch (err) {
      setError(err.message);
      setOutputLog(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallAll = async () => {
    try {
      setLoading(true);
      setOutputLog(`$ npm install in ${targetDir || 'project root'}...\nResolving dependencies...`);
      const res = await api.installPackage({
        manager: 'npm_all',
        targetDir
      });
      setMessage('Project dependencies installed successfully!');
      setOutputLog(res.stdout || 'Finished npm install.');
      loadProjectDeps();
    } catch (err) {
      setError(err.message);
      setOutputLog(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUninstall = async (name) => {
    if (window.confirm(`Uninstall dependency '${name}'?`)) {
      try {
        setLoading(true);
        setOutputLog(`$ npm uninstall ${name}...`);
        const res = await api.uninstallPackage({ packageName: name, targetDir, isGlobal: false });
        setMessage(res.message);
        setOutputLog(res.stdout || `Uninstalled ${name}`);
        loadProjectDeps();
        loadHistory();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRunScript = async (scriptName) => {
    try {
      setLoading(true);
      setOutputLog(`$ npm run ${scriptName}...\nExecuting script...`);
      const res = await api.runScript(scriptName, targetDir);
      setMessage(`Script '${scriptName}' finished.`);
      setOutputLog(res.stdout || res.stderr || 'Done');
    } catch (err) {
      setError(err.message);
      setOutputLog(err.message);
    } finally {
      setLoading(false);
    }
  };

  const dependencies = Object.entries(projectData?.dependencies || {});
  const devDependencies = Object.entries(projectData?.devDependencies || {});
  const scripts = Object.entries(projectData?.scripts || {});

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Package & Dependency Manager</h1>
          <p className="view-subtitle">
            Install and manage Node.js (NPM) and Python dependencies directly from your browser without opening the terminal.
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

      {/* Target Directory & Install Bar */}
      <div className="content-card mb-6">
        <div className="card-header">
          <div className="card-title-wrap">
            <Plus size={18} className="text-primary" />
            <h3 className="card-title">Install New Package</h3>
          </div>
          <div className="flex items-center gap-2">
            <Folder size={16} className="text-muted" />
            <input
              type="text"
              className="form-input-sm w-72"
              placeholder="Target Project Directory (blank = root)"
              value={targetDir}
              onChange={(e) => setTargetDir(e.target.value)}
            />
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleInstall} className="form-grid">
            <div className="form-group">
              <label className="form-label">Package Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. express, axios, lodash@4, dotenv"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Package Manager</label>
              <select
                className="form-select"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
              >
                <option value="npm">NPM (Node.js)</option>
                <option value="pip">Pip (Python)</option>
              </select>
            </div>

            <div className="form-group flex items-center gap-6 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={isGlobal}
                  onChange={(e) => setIsGlobal(e.target.checked)}
                />
                <span>Install Globally (-g)</span>
              </label>

              {manager === 'npm' && (
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={isDev}
                    onChange={(e) => setIsDev(e.target.checked)}
                  />
                  <span>Dev Dependency (--save-dev)</span>
                </label>
              )}
            </div>

            <div className="col-span-full flex gap-3">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Plus size={16} />
                <span>{loading ? 'Installing...' : 'Install Dependency'}</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleInstallAll}
                disabled={loading}
              >
                <Layers size={16} />
                <span>1-Click `npm install` Project</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Real-time Output Log Card */}
      {outputLog && (
        <div className="content-card mb-6">
          <div className="card-header">
            <div className="card-title-wrap">
              <Terminal size={18} className="text-cyan" />
              <h3 className="card-title">Installation Console Output</h3>
            </div>
            <button className="btn-secondary-sm" onClick={() => setOutputLog('')}>Clear</button>
          </div>
          <div className="card-body p-0">
            <pre className="terminal-stdout-box">{outputLog}</pre>
          </div>
        </div>
      )}

      {/* Project package.json inspection */}
      <div className="dashboard-cols">
        {/* Installed Dependencies */}
        <div className="content-card">
          <div className="card-header">
            <div className="card-title-wrap">
              <Package size={18} className="text-emerald" />
              <h3 className="card-title">
                {projectData?.name || 'Project'} Dependencies ({dependencies.length})
              </h3>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="cpanel-table">
                <thead>
                  <tr>
                    <th>Package</th>
                    <th>Version Rule</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dependencies.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-4 text-muted">No dependencies found in package.json</td>
                    </tr>
                  ) : (
                    dependencies.map(([pkg, ver]) => (
                      <tr key={pkg}>
                        <td><span className="font-semibold text-white">{pkg}</span></td>
                        <td><code className="text-xs text-primary">{ver}</code></td>
                        <td className="text-right">
                          <button
                            className="btn-icon-danger"
                            title="Uninstall"
                            onClick={() => handleUninstall(pkg)}
                          >
                            <Trash2 size={14} />
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

        {/* NPM Scripts runner */}
        <div className="content-card">
          <div className="card-header">
            <div className="card-title-wrap">
              <Play size={18} className="text-warning" />
              <h3 className="card-title">NPM Project Scripts</h3>
            </div>
          </div>
          <div className="card-body">
            {scripts.length === 0 ? (
              <div className="empty-state-sm">No scripts defined in package.json.</div>
            ) : (
              <div className="scripts-list">
                {scripts.map(([name, cmd]) => (
                  <div key={name} className="script-row">
                    <div className="script-info">
                      <span className="script-name">{name}</span>
                      <code className="script-cmd">{cmd}</code>
                    </div>
                    <button
                      className="btn btn-secondary-sm"
                      onClick={() => handleRunScript(name)}
                      disabled={loading}
                    >
                      <Play size={12} />
                      <span>Run</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

