import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';
import { api } from '../api';

export default function TerminalView() {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([
    {
      command: 'system-init',
      stdout: `cPanel Autonomous Terminal v2.0 (x86_64-node-powershell)\nType any shell command (git, npm, node, mysql, dir, curl) and press Enter.\nFull server root privileges active. SSH or physical server login is not required.\n`,
      stderr: '',
      time: new Date().toLocaleTimeString()
    }
  ]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const handleExecute = async (cmdToRun) => {
    const finalCmd = (cmdToRun !== undefined ? cmdToRun : command).trim();
    if (!finalCmd) return;

    // Add to up/down command history
    setCommandHistory((prev) => [...prev, finalCmd]);
    setHistoryIndex(-1);

    try {
      setLoading(true);
      const res = await api.execTerminal(finalCmd);

      setHistory((prev) => [
        ...prev,
        {
          command: finalCmd,
          stdout: res.stdout,
          stderr: res.stderr,
          exitCode: res.exitCode,
          durationMs: res.durationMs,
          time: new Date().toLocaleTimeString()
        }
      ]);

      setCommand('');
    } catch (err) {
      setHistory((prev) => [
        ...prev,
        {
          command: finalCmd,
          stdout: '',
          stderr: err.message,
          exitCode: 1,
          time: new Date().toLocaleTimeString()
        }
      ]);
      setCommand('');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIndex);
        setCommand(commandHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex !== -1) {
        const nextIndex = historyIndex + 1;
        if (nextIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCommand('');
        } else {
          setHistoryIndex(nextIndex);
          setCommand(commandHistory[nextIndex]);
        }
      }
    }
  };

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  const quickCommands = [
    { label: 'node -v', cmd: 'node -v' },
    { label: 'npm -v', cmd: 'npm -v' },
    { label: 'dir', cmd: 'dir' },
    { label: 'git status', cmd: 'git status' },
    { label: 'netstat', cmd: 'netstat -ano | findstr LISTENING' },
    { label: 'mysql version', cmd: 'mysql --version' }
  ];

  return (
    <div className="terminal-full-wrapper" onClick={handleTerminalClick}>
      {/* Sleek Terminal Window */}
      <div className="cpanel-terminal-screen">
        {/* Authentic Terminal Top Bar */}
        <div className="terminal-screen-header">
          <div className="terminal-window-buttons">
            <span className="term-dot dot-close"></span>
            <span className="term-dot dot-min"></span>
            <span className="term-dot dot-max"></span>
          </div>

          <div className="terminal-screen-title">
            <TerminalIcon size={14} className="text-primary mr-1" />
            <span>root@cpanel:~ (powershell / bash)</span>
          </div>

          {/* Quick inline shortcut chips */}
          <div className="terminal-header-shortcuts">
            {quickCommands.map((qc) => (
              <button
                key={qc.label}
                type="button"
                className="term-chip-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExecute(qc.cmd);
                }}
                disabled={loading}
              >
                {qc.label}
              </button>
            ))}
            <button
              type="button"
              className="term-chip-btn text-rose"
              onClick={(e) => {
                e.stopPropagation();
                setHistory([]);
              }}
              title="Clear terminal screen"
            >
              clear
            </button>
          </div>
        </div>

        {/* Scrollable Terminal Output Body */}
        <div className="terminal-screen-body">
          {history.map((item, idx) => (
            <div key={idx} className="terminal-entry-block">
              {item.command !== 'system-init' && (
                <div className="terminal-line-prompt">
                  <span className="prompt-user">root@cpanel</span>
                  <span className="prompt-colon">:</span>
                  <span className="prompt-path">~</span>
                  <span className="prompt-dollar">#</span>
                  <span className="prompt-cmd">{item.command}</span>
                  {item.durationMs !== undefined && (
                    <span className="prompt-timestamp">{item.durationMs}ms</span>
                  )}
                </div>
              )}

              {item.stdout && (
                <div className="terminal-stdout-text">{item.stdout}</div>
              )}

              {item.stderr && (
                <div className="terminal-stderr-text">{item.stderr}</div>
              )}
            </div>
          ))}

          {/* Active Interactive Input Line */}
          <div className="terminal-active-line">
            <span className="prompt-user">root@cpanel</span>
            <span className="prompt-colon">:</span>
            <span className="prompt-path">~</span>
            <span className="prompt-dollar">#</span>
            <input
              ref={inputRef}
              type="text"
              className="terminal-active-input"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
            {loading && <span className="term-loading-spinner">executing...</span>}
          </div>

          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
