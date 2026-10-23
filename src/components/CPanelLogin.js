import React, { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, AlertCircle, Database } from 'lucide-react';
import { api } from '../api';

export default function CPanelLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.login(username, password);
      if (res.success && res.user) {
        localStorage.setItem('cpanel_user', JSON.stringify(res.user));
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="cpanel-login-wrapper">
      <div className="login-card-container">
        {/* Parakshtech cPanel Branding Header */}
        <div className="login-brand-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
            <img
              src="/parakshtech-logo.jpg"
              alt="Parakshtech Logo"
              style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'contain', boxShadow: '0 4px 12px rgba(255, 26, 26, 0.25)' }}
            />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                <span style={{ color: '#ffffff' }}>Parakshtech </span>
                <span style={{ color: '#ff3333' }}>cPanel</span>
              </div>
              <span className="login-tagline" style={{ display: 'block', marginTop: '3px', fontSize: '0.85rem' }}>Autonomous Server & Cloud Control Panel</span>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <div className="login-card-title">
            <h2>Log in to your account</h2>
            <p>Access your domains, MySQL databases, and server configurations.</p>
          </div>

          {error && (
            <div className="login-alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field-group">
              <label className="login-label">Username</label>
              <div className="login-input-wrap">
                <User size={18} className="login-field-icon" />
                <input
                  type="text"
                  className="login-input"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="login-field-group">
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <Lock size={18} className="login-field-icon" />
                <input
                  type="password"
                  className="login-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              <span>{loading ? 'Authenticating...' : 'Log in'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Quick Login Presets for convenience */}
          <div className="quick-access-box">
            <span className="quick-access-title">Quick Access Credentials:</span>
            <div className="quick-btns-row">
              <button
                type="button"
                className="btn-quick-cred"
                onClick={() => handleQuickFill('admin', 'admin123')}
              >
                <ShieldCheck size={14} className="text-primary" />
                <span>Super Admin (admin / admin123)</span>
              </button>
              <button
                type="button"
                className="btn-quick-cred"
                onClick={() => handleQuickFill('developer', 'dev123')}
              >
                <User size={14} className="text-muted" />
                <span>User (developer / dev123)</span>
              </button>
            </div>
          </div>

          {/* Connected Database Info */}
          <div className="login-db-meta">
            <Database size={13} className="text-emerald" />
            <span>Connected Database: <strong>cpanel</strong> on localhost:3306</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="login-footer">
          <div className="login-languages">
            <span className="lang-active">English</span>
            <span>Español</span>
            <span>Français</span>
            <span>Deutsch</span>
            <span>Português</span>
          </div>
          <p className="login-copyright">
            Copyright © 2026 Parakshtech cPanel. All rights reserved. Autonomous Node.js Server Management.
          </p>
        </div>
      </div>
    </div>
  );
}

