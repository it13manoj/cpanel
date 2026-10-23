import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cpu,
  Plus,
  Play,
  Square,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Package,
  FileText,
  Clock,
  Terminal,
  X,
  HardDrive
} from 'lucide-react';
import { api } from '../api';

export default function AppsView() {
  const [apps, setApps] = useState([]);
  const [pm2Status, setPm2Status] = useState(null);
  const [appName, setAppName] = useState('');
  const [appDir, setAppDir] = useState('hosting_data/www/');
  const [script, setScript] = useState('index.js');
  const [port, setPort] = useState('');
  const [autoInstallDeps, setAutoInstallDeps] = useState(true);
  const [autoStart, setAutoStart] = useState(true);

  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Logs modal state
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [activeAppLogs, setActiveAppLogs] = useState(null);
  const [logsAutoRefresh, setLogsAutoRefresh] = useState(true);
  const logsIntervalRef = useRef(null);

  // Dependency output modal state
  const [depsModalOpen, setDepsModalOpen] = useState(false);
  const [depsOutput, setDepsOutput] = useState('');
  const [depsAppName, setDepsAppName] = useState('');

  const loadApps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getApps();
      setApps(res.apps || []);
      
      const pm2Res = await api.getPM2Status();
      setPm2Status(pm2Res.pm2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApps();
    const interval = setInterval(loadApps, 10000);
    return () => clearInterval(interval);
  }, [loadApps]);

  const handleCreateApp = async (e) => {
    e.preventDefault();
    if (!appName || !appDir) return;

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const res = await api.createApp({
        app_name: appName,
        app_dir: appDir,
        script: script || 'index.js',
        port: port ? parseInt(port, 10) : null,
        auto_install_deps: autoInstallDeps,
        auto_start: autoStart
      });

      setMessage(res.message);
      if (res.installLog) {
        setDepsAppName(appName);
        setDepsOutput(res.installLog);
        setDepsModalOpen(true);
      }

      setAppName('');
      setAppDir('hosting_data/www/');
      setPort('');
      loadApps();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Start (Play)
  const handleStart = async (app) => {
    try {
      setActionLoadingId(app.id);
      setError(null);
      const res = await api.startApp(app.id);
      setMessage(res.message);
      await loadApps();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 1-Click Stop (Square)
  const handleStop = async (app) => {
    try {
      setActionLoadingId(app.id);
      setError(null);
      const res = await api.stopApp(app.id);
      setMessage(res.message);
      await loadApps();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 1-Click Restart (RefreshCw)
  const handleRestart = async (app) => {
    try {
      setActionLoadingId(app.id);
      setError(null);
      const res = await api.restartApp(app.id);
      setMessage(res.message);
      await loadApps();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 1-Click Install Dependencies (Package)
  const handleInstallDeps = async (app) => {
    try {
      setActionLoadingId(app.id);
      setError(null);
      setMessage(`Installing dependencies for '${app.app_name}' via npm...`);
      const res = await api.installAppDeps(app.id);
      setMessage(res.message);
      setDepsAppName(app.app_name);
      setDepsOutput(res.output || 'Dependencies installed successfully.');
      setDepsModalOpen(true);
      await loadApps();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 1-Click View PM2 Logs
  const handleOpenLogs = async (app) => {
    try {
      setError(null);
      const res = await api.getAppLogs(app.id, 150);
      setActiveAppLogs({ ...res, id: app.id });
      setLogsModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // Auto-refresh active logs
  const fetchActiveLogs = useCallback(async () => {
    if (!activeAppLogs || !activeAppLogs.id) return;
    try {
      const res = await api.getAppLogs(activeAppLogs.id, 150);
      setActiveAppLogs(prev => ({ ...prev, ...res }));
    } catch (e) {}
  }, [activeAppLogs]);

  useEffect(() => {
    if (logsModalOpen && logsAutoRefresh) {
      logsIntervalRef.current = setInterval(fetchActiveLogs, 3000);
    } else {
      if (logsIntervalRef.current) clearInterval(logsIntervalRef.current);
    }
    return () => {
      if (logsIntervalRef.current) clearInterval(logsIntervalRef.current);
    };
  }, [logsModalOpen, logsAutoRefresh, fetchActiveLogs]);

  // Delete App
  const handleDelete = async (id, name) => {
    if (window.confirm(`⚠️ Are you sure you want to completely remove app '${name}' from PM2 and process manager?`)) {
      try {
        setLoading(true);
        await api.deleteApp(id);
        setMessage(`App '${name}' removed.`);
        loadApps();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="view-container">
      {/* Top Header */}
      <div className="view-header">
        <div>
          <h1 className="view-title">Node.js PM2 Process & Deployment Manager</h1>
          <p className="view-subtitle">
            Deploy Node.js projects with automated dependency installation, PM2 process clustering, 1-click execution, and real-time logs.
          </p>
        </div>
        <button className="btn-icon" onClick={loadApps} title="Refresh Processes">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* PM2 Engine Status Card */}
      <div className="pm2-status-card">
        <div className="flex items-center gap-3">
          <div className={`pm2-engine-badge ${pm2Status?.connected ? '' : 'offline'}`}>
            <span className={`pm2-dot ${pm2Status?.connected ? '' : 'offline'}`}></span>
            <span>PM2 Engine: {pm2Status?.connected ? 'Online' : 'Offline'} ({pm2Status?.version || 'v7.1.0'})</span>
          </div>
          <span className="text-xs text-muted">Daemonized system supervisor</span>
        </div>

        <div className="pm2-metrics-row">
          <div className="pm2-metric-item">
            <span className="pm2-metric-label">Online Processes</span>
            <span className="pm2-metric-val">{apps.filter(a => a.status === 'running').length} / {apps.length}</span>
          </div>
          <div className="pm2-metric-item">
            <span className="pm2-metric-label">Total Memory</span>
            <span className="pm2-metric-val">
              {apps.reduce((sum, a) => sum + (parseFloat(a.memory_mb) || 0), 0).toFixed(1)} MB
            </span>
          </div>
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

      {/* Deploy New Node.js Project Form */}
      <div className="content-card mb-6">
        <div className="card-header">
          <div className="card-title-wrap">
            <Plus size={18} className="text-primary" />
            <h3 className="card-title">Deploy & Register Node.js Project</h3>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleCreateApp} className="form-grid">
            <div className="form-group">
              <label className="form-label">Application Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. ecommerce-backend or auth-service"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Application Directory Path *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. hosting_data/www/myproject"
                value={appDir}
                onChange={(e) => setAppDir(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Entry Script File</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. server.js or index.js or app.js"
                value={script}
                onChange={(e) => setScript(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Port Allocation (Optional)</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 4000, 4100, 5050"
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </div>

            <div className="col-span-full flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={autoInstallDeps}
                  onChange={(e) => setAutoInstallDeps(e.target.checked)}
                />
                <span className="font-semibold text-white">Auto-Install Project Dependencies (npm install)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={autoStart}
                  onChange={(e) => setAutoStart(e.target.checked)}
                />
                <span className="font-semibold text-white">Auto-Launch Process in PM2 immediately</span>
              </label>
            </div>

            <div className="col-span-full">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Plus size={16} />
                <span>Deploy & Configure Application</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Managed Applications Table with 1-Click Controls */}
      <div className="content-card">
        <div className="card-header">
          <div className="card-title-wrap">
            <Cpu size={18} className="text-info" />
            <h3 className="card-title">Deployed Applications & PM2 Instances ({apps.length})</h3>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="cpanel-table">
              <thead>
                <tr>
                  <th>Application Name</th>
                  <th>Directory & Entry</th>
                  <th>Status</th>
                  <th>Resources</th>
                  <th>Process Info</th>
                  <th className="text-right">1-Click Controls</th>
                </tr>
              </thead>
              <tbody>
                {apps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted">
                      No applications deployed yet. Fill the deployment form above to launch your first Node.js app!
                    </td>
                  </tr>
                ) : (
                  apps.map((app) => {
                    const isRunning = app.status === 'running' || app.status === 'online';
                    const isBusy = actionLoadingId === app.id;

                    return (
                      <tr key={app.id}>
                        <td>
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{app.app_name}</span>
                            {app.port && (
                              <span className="text-xs text-primary font-mono">Port :{app.port}</span>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="flex flex-col">
                            <code className="text-xs font-mono">{app.app_dir}</code>
                            <span className="text-xs text-muted">Script: <strong>{app.script}</strong></span>
                          </div>
                        </td>

                        <td>
                          <span className={`badge-pill ${isRunning ? 'badge-success' : 'badge-neutral'}`}>
                            {isRunning ? 'ONLINE' : 'STOPPED'}
                          </span>
                          {isRunning && app.uptime > 0 && (
                            <span className="text-xs text-muted block mt-1">
                              <Clock size={11} className="inline mr-1" />
                              {app.uptime < 60 ? `${app.uptime}s` : `${Math.floor(app.uptime / 60)}m`}
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="flex flex-col text-xs">
                            <span className="font-mono text-cyan">
                              <HardDrive size={11} className="inline mr-1" />
                              {app.memory_mb || 0} MB
                            </span>
                            <span className="font-mono text-muted">
                              <Cpu size={11} className="inline mr-1" />
                              {app.cpu_percent || 0}% CPU
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="flex flex-col text-xs font-mono">
                            {app.pid ? (
                              <span className="text-emerald">PID: {app.pid}</span>
                            ) : (
                              <span className="text-muted">No PID</span>
                            )}
                            {app.pm_id !== null && app.pm_id !== undefined && (
                              <span className="text-muted">PM2 ID: #{app.pm_id}</span>
                            )}
                          </div>
                        </td>

                        <td className="text-right">
                          <div className="action-buttons-group">
                            {/* 1-Click Run / Start */}
                            {!isRunning ? (
                              <button
                                className="btn-ctrl btn-ctrl-start"
                                onClick={() => handleStart(app)}
                                disabled={isBusy || loading}
                                title="1-Click Start Application with PM2"
                              >
                                <Play size={13} />
                                <span>Start</span>
                              </button>
                            ) : (
                              /* 1-Click Stop */
                              <button
                                className="btn-ctrl btn-ctrl-stop"
                                onClick={() => handleStop(app)}
                                disabled={isBusy || loading}
                                title="1-Click Stop Application"
                              >
                                <Square size={13} />
                                <span>Stop</span>
                              </button>
                            )}

                            {/* 1-Click Restart */}
                            <button
                              className="btn-ctrl btn-ctrl-restart"
                              onClick={() => handleRestart(app)}
                              disabled={isBusy || loading}
                              title="1-Click Restart Process"
                            >
                              <RefreshCw size={13} />
                              <span>Restart</span>
                            </button>

                            {/* 1-Click Install Dependencies */}
                            <button
                              className="btn-ctrl btn-ctrl-deps"
                              onClick={() => handleInstallDeps(app)}
                              disabled={isBusy || loading}
                              title="1-Click Install Project Dependencies (npm install)"
                            >
                              <Package size={13} />
                              <span>Deps</span>
                            </button>

                            {/* 1-Click View Logs */}
                            <button
                              className="btn-ctrl btn-ctrl-logs"
                              onClick={() => handleOpenLogs(app)}
                              title="View Real-Time PM2 Logs"
                            >
                              <FileText size={13} />
                              <span>Logs</span>
                            </button>

                            {/* Browser Preview Link */}
                            {app.port && isRunning && (
                              <a
                                href={`http://localhost:${app.port}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-icon-sm text-primary"
                                title="Open Live App in Browser"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}

                            {/* Delete */}
                            <button
                              className="btn-icon-danger"
                              onClick={() => handleDelete(app.id, app.app_name)}
                              title="Delete from Process Manager"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Real-Time PM2 Logs Modal */}
      {logsModalOpen && activeAppLogs && (
        <div className="modal-backdrop">
          <div className="modal-card pm2-logs-modal">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Terminal size={18} className="text-primary" />
                <h3 className="modal-title font-mono">PM2 Logs: {activeAppLogs.app_name}</h3>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-xs text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={logsAutoRefresh}
                    onChange={(e) => setLogsAutoRefresh(e.target.checked)}
                  />
                  <span>Live Auto-Refresh (3s)</span>
                </label>
                <button className="btn-icon-sm" onClick={fetchActiveLogs} title="Refresh Logs Now">
                  <RefreshCw size={14} />
                </button>
                <button className="btn-icon-sm" onClick={() => setLogsModalOpen(false)}>
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="pm2-logs-body">
              <div className="log-section-header log-sec-out">Standard Output (stdout)</div>
              <pre className="pm2-log-pre out">{activeAppLogs.outLogs || 'No output recorded.'}</pre>

              {activeAppLogs.errLogs && (
                <>
                  <div className="log-section-header log-sec-err">Error Output (stderr)</div>
                  <pre className="pm2-log-pre err">{activeAppLogs.errLogs}</pre>
                </>
              )}
            </div>

            <div className="modal-footer">
              <div className="text-xs text-muted">
                Showing last 150 log entries from PM2 daemon
              </div>
              <button className="btn btn-secondary" onClick={() => setLogsModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dependency Install Result Modal */}
      {depsModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-editor">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-primary" />
                <h3 className="modal-title">Dependency Installation Output: {depsAppName}</h3>
              </div>
              <button className="btn-icon-sm" onClick={() => setDepsModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="pm2-logs-body">
              <pre className="pm2-log-pre out">{depsOutput || 'Running npm install...'}</pre>
            </div>

            <div className="modal-footer">
              <span className="text-xs text-muted font-mono">npm install execution completed</span>
              <button className="btn btn-primary" onClick={() => setDepsModalOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
