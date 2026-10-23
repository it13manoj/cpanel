import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Play,
  Trash2,
  CheckCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { api } from '../api';

export default function CronView() {
  const [jobs, setJobs] = useState([]);
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('0 0 * * *');
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await api.getCronJobs();
      setJobs(res.cron_jobs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !schedule || !command) return;

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const res = await api.createCronJob({ name, schedule, command });
      setMessage(res.message);
      setName('');
      setCommand('');
      loadJobs();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.toggleCronJob(id);
      loadJobs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRunNow = async (id, jobName) => {
    try {
      await api.runCronJobNow(id);
      setMessage(`Triggered run for '${jobName}'.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id, jobName) => {
    if (window.confirm(`Delete cron job '${jobName}'?`)) {
      try {
        await api.deleteCronJob(id);
        setMessage(`Deleted '${jobName}'.`);
        loadJobs();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Cron Jobs & Automated Tasks</h1>
          <p className="view-subtitle">
            Configure automated background commands, database backups, and scheduled maintenance scripts.
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

      {/* Create Cron Form */}
      <div className="content-card mb-6">
        <div className="card-header">
          <div className="card-title-wrap">
            <Plus size={18} className="text-primary" />
            <h3 className="card-title">Add New Scheduled Task</h3>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleCreate} className="form-grid">
            <div className="form-group">
              <label className="form-label">Task Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Daily DB Backup"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cron Schedule Pattern</label>
              <select
                className="form-select"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
              >
                <option value="* * * * *">Every Minute (* * * * *)</option>
                <option value="0 * * * *">Every Hour (0 * * * *)</option>
                <option value="0 0 * * *">Daily at Midnight (0 0 * * *)</option>
                <option value="0 0 * * 0">Weekly on Sunday (0 0 * * 0)</option>
                <option value="0 0 1 * *">Monthly 1st (0 0 1 * *)</option>
              </select>
            </div>

            <div className="form-group col-span-full">
              <label className="form-label">Command to Execute *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. node scripts/backup.js or npm run clean"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                required
              />
            </div>

            <div className="col-span-full">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Plus size={16} />
                <span>Save Cron Schedule</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Cron List */}
      <div className="content-card">
        <div className="card-header">
          <div className="card-title-wrap">
            <Clock size={18} className="text-info" />
            <h3 className="card-title">Configured Tasks ({jobs.length})</h3>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="cpanel-table">
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Schedule</th>
                  <th>Command</th>
                  <th>Status</th>
                  <th>Last Run</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-muted">No scheduled cron jobs configured.</td>
                  </tr>
                ) : (
                  jobs.map((j) => (
                    <tr key={j.id}>
                      <td><span className="font-semibold text-white">{j.name}</span></td>
                      <td><code>{j.schedule}</code></td>
                      <td><code className="code-path">{j.command}</code></td>
                      <td>
                        <button
                          className="btn-icon-sm"
                          onClick={() => handleToggle(j.id)}
                          title="Toggle Active"
                        >
                          {j.active ? (
                            <ToggleRight size={22} className="text-emerald" />
                          ) : (
                            <ToggleLeft size={22} className="text-muted" />
                          )}
                        </button>
                      </td>
                      <td>
                        <span className="text-xs text-muted">
                          {j.last_run ? new Date(j.last_run).toLocaleString() : 'Never'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="action-buttons-inline">
                          <button
                            className="btn btn-secondary-sm"
                            onClick={() => handleRunNow(j.id, j.name)}
                            title="Execute Immediately"
                          >
                            <Play size={12} />
                            <span>Run Now</span>
                          </button>
                          <button
                            className="btn-icon-danger"
                            onClick={() => handleDelete(j.id, j.name)}
                            title="Delete"
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
    </div>
  );
}

