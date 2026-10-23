import React, { useState, useEffect, useRef } from 'react';
import CPanelLogin from './components/CPanelLogin';
import CPanelClassicLayout from './components/CPanelClassicLayout';
import DashboardView from './components/DashboardView';
import DomainsView from './components/DomainsView';
import MySQLView from './components/MySQLView';
import FileManagerView from './components/FileManagerView';
import PackagesView from './components/PackagesView';
import FTPView from './components/FTPView';
import AppsView from './components/AppsView';
import TerminalView from './components/TerminalView';
import CronView from './components/CronView';
import LogsView from './components/LogsView';
import AppInstallerSection from './components/AppInstallerSection';
import StorageSection from './components/StorageSection';
import UsersSection from './components/UsersSection';
import ZoneEditorView from './components/ZoneEditorView';
import { api } from './api';
import './App.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cpanel_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeTool, setActiveTool] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [domains, setDomains] = useState([]);
  const [logs, setLogs] = useState([]);
  const [fileManagerInitialPath, setFileManagerInitialPath] = useState('');
  const wsRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      loadInitialData();
      setupWebSocket();

      const fallbackInterval = setInterval(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          api.getSystemMetrics().then(setMetrics).catch(() => {});
        }
      }, 5000);

      return () => {
        clearInterval(fallbackInterval);
        if (wsRef.current) wsRef.current.close();
      };
    }
  }, [currentUser]);

  const setupWebSocket = () => {
    try {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const host = window.location.hostname || 'localhost';
      const port = window.location.port ? `:${window.location.port}` : (isHttps ? ':5443' : ':5000');
      const wsUrl = `${wsProtocol}//${host}${port}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'METRICS_UPDATE' && parsed.data) {
            setMetrics(parsed.data);
          }
        } catch (e) {}
      };
    } catch (e) {}
  };

  const loadInitialData = async () => {
    try {
      const [sysRes, domRes, logRes] = await Promise.all([
        api.getSystemMetrics().catch(() => null),
        api.getDomains().catch(() => ({ domains: [] })),
        api.getLogs().catch(() => ({ logs: [] }))
      ]);

      if (sysRes) setMetrics(sysRes);
      if (domRes?.domains) setDomains(domRes.domains);
      if (logRes?.logs) setLogs(logRes.logs);
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const reloadDomains = async () => {
    try {
      const res = await api.getDomains();
      setDomains(res.domains || []);
    } catch (e) {}
  };

  const reloadLogs = async () => {
    try {
      const res = await api.getLogs();
      setLogs(res.logs || []);
    } catch (e) {}
  };

  const handleLogout = () => {
    localStorage.removeItem('cpanel_user');
    setCurrentUser(null);
    setActiveTool(null);
  };

  // If user is not authenticated, strictly render the Login Panel!
  if (!currentUser) {
    return <CPanelLogin onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // Active Tool Renderer
  const renderActiveToolContent = () => {
    switch (activeTool) {
      case 'dashboard':
        return <DashboardView metrics={metrics} setActiveTab={setActiveTool} logs={logs} />;
      case 'installer':
        return <AppInstallerSection setActiveTab={setActiveTool} reloadDomains={reloadDomains} />;
      case 'domains':
        return (
          <DomainsView
            domains={domains}
            reloadDomains={reloadDomains}
            setActiveTab={setActiveTool}
            onSelectPathForFileManager={(path) => setFileManagerInitialPath(path)}
          />
        );
      case 'zone_editor':
        return <ZoneEditorView domains={domains} initialDomain={fileManagerInitialPath} />;
      case 'mysql':
        return <MySQLView />;
      case 'storage':
        return <StorageSection domains={domains} reloadDomains={reloadDomains} />;
      case 'files':
        return <FileManagerView initialPath={fileManagerInitialPath} />;
      case 'packages':
        return <PackagesView />;
      case 'ftp':
        return <FTPView />;
      case 'apps':
        return <AppsView />;
      case 'terminal':
        return <TerminalView />;
      case 'panel_users':
        return (
          <UsersSection
            domains={domains}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
          />
        );
      case 'cron':
        return <CronView />;
      case 'logs':
        return <LogsView logs={logs} reloadLogs={reloadLogs} />;
      default:
        return null;
    }
  };

  return (
    <CPanelClassicLayout
      currentUser={currentUser}
      onLogout={handleLogout}
      metrics={metrics}
      activeTool={activeTool}
      setActiveTool={setActiveTool}
    >
      {renderActiveToolContent()}
    </CPanelClassicLayout>
  );
}
