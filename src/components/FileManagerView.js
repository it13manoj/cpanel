import React, { useState, useEffect, useRef } from 'react';
import {
  FolderTree,
  Folder,
  File,
  FileCode,
  FileText,
  FileArchive,
  Upload,
  Plus,
  Trash2,
  Edit,
  Download,
  Key,
  Archive,
  ArrowUp,
  RefreshCw,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { api } from '../api';

export default function FileManagerView({ initialPath }) {
  const [currentPath, setCurrentPath] = useState(initialPath || '');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Editor Modal state
  const [editingFile, setEditingFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [editorSaving, setEditorSaving] = useState(false);

  // Create Modal state
  const [createModal, setCreateModal] = useState({ open: false, type: 'file' });
  const [newItemName, setNewItemName] = useState('');

  // Chmod Modal state
  const [chmodModal, setChmodModal] = useState({ open: false, path: '', mode: '0755' });

  // Upload file input ref
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath]);

  const loadFiles = async (targetPath) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.listFiles(targetPath);
      setItems(res.items || []);
      setCurrentPath(res.currentPath || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (folderName) => {
    const nextPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(nextPath);
  };

  const handleNavigateUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const handleOpenFile = async (item) => {
    try {
      setLoading(true);
      const targetFilePath = currentPath ? `${currentPath}/${item.name}` : item.name;
      const res = await api.readFile(targetFilePath);
      setEditingFile({ path: targetFilePath, name: item.name });
      setFileContent(res.content || '');
    } catch (err) {
      setError('Cannot open file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFile = async () => {
    if (!editingFile) return;
    try {
      setEditorSaving(true);
      await api.saveFile(editingFile.path, fileContent);
      setMessage(`Saved ${editingFile.name} successfully.`);
    } catch (err) {
      setError('Save error: ' + err.message);
    } finally {
      setEditorSaving(false);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newItemName) return;

    try {
      setLoading(true);
      await api.createItem(currentPath, newItemName, createModal.type);
      setMessage(`${createModal.type === 'folder' ? 'Folder' : 'File'} created.`);
      setCreateModal({ open: false, type: 'file' });
      setNewItemName('');
      loadFiles(currentPath);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const target = currentPath ? `${currentPath}/${item.name}` : item.name;
    if (window.confirm(`Permanently delete '${item.name}'?`)) {
      try {
        await api.deleteItem(target);
        setMessage(`Deleted ${item.name}`);
        loadFiles(currentPath);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleChmod = async (e) => {
    e.preventDefault();
    try {
      await api.chmodItem(chmodModal.path, chmodModal.mode);
      setMessage(`Permissions updated to ${chmodModal.mode}`);
      setChmodModal({ open: false, path: '', mode: '0755' });
      loadFiles(currentPath);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExtractZip = async (item) => {
    const zipPath = currentPath ? `${currentPath}/${item.name}` : item.name;
    try {
      setLoading(true);
      await api.extractZip(zipPath, currentPath);
      setMessage(`Extracted ${item.name} successfully.`);
      loadFiles(currentPath);
    } catch (err) {
      setError('Extraction error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    formData.append('destination', currentPath);
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      setLoading(true);
      await api.uploadFiles(formData);
      setMessage(`Uploaded ${files.length} file(s) successfully.`);
      loadFiles(currentPath);
    } catch (err) {
      setError('Upload failed: ' + err.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (item) => {
    if (item.isDirectory) return <Folder size={18} className="text-amber" />;
    const ext = item.extension;
    if (['.js', '.ts', '.jsx', '.tsx', '.py', '.php'].includes(ext)) {
      return <FileCode size={18} className="text-cyan" />;
    }
    if (['.html', '.css', '.json', '.md'].includes(ext)) {
      return <FileText size={18} className="text-primary" />;
    }
    if (['.zip', '.tar', '.gz'].includes(ext)) {
      return <FileArchive size={18} className="text-emerald" />;
    }
    return <File size={18} className="text-muted" />;
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Web File Manager & Code Editor</h1>
          <p className="view-subtitle">
            Manage your project directories, edit server scripts, upload archives and adjust file permissions.
          </p>
        </div>

        {/* Toolbar */}
        <div className="filemanager-toolbar">
          <button className="btn btn-secondary-sm" onClick={() => setCreateModal({ open: true, type: 'file' })}>
            <Plus size={14} />
            <span>New File</span>
          </button>
          <button className="btn btn-secondary-sm" onClick={() => setCreateModal({ open: true, type: 'folder' })}>
            <Folder size={14} />
            <span>New Folder</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} />
            <span>Upload File</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            style={{ display: 'none' }}
          />
          <button className="btn-icon" onClick={() => loadFiles(currentPath)} title="Refresh">
            <RefreshCw size={16} />
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

      {/* Path Breadcrumbs */}
      <div className="content-card mb-4 p-3">
        <div className="breadcrumbs-wrap">
          <button className="btn-icon-sm" onClick={handleNavigateUp} disabled={!currentPath} title="Go Up One Directory">
            <ArrowUp size={16} />
          </button>
          <div className="breadcrumb-path">
            <span className="crumb root-crumb" onClick={() => setCurrentPath('')}>root</span>
            {breadcrumbs.map((part, idx) => {
              const subPath = breadcrumbs.slice(0, idx + 1).join('/');
              return (
                <React.Fragment key={subPath}>
                  <span className="crumb-separator">/</span>
                  <span
                    className={`crumb ${idx === breadcrumbs.length - 1 ? 'crumb-active' : ''}`}
                    onClick={() => setCurrentPath(subPath)}
                  >
                    {part}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* File List Table */}
      <div className="content-card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="cpanel-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Permissions</th>
                  <th>Last Modified</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted">
                      Folder is empty. Upload or create files using the buttons above.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.name} className="hover:bg-slate-800">
                      <td>
                        <div
                          className="file-item-name"
                          onClick={() => (item.isDirectory ? handleNavigate(item.name) : handleOpenFile(item))}
                        >
                          {getFileIcon(item)}
                          <span className={item.isDirectory ? 'folder-link' : 'file-link'}>{item.name}</span>
                        </div>
                      </td>
                      <td>{formatSize(item.size)}</td>
                      <td>
                        <span
                          className="chmod-badge"
                          title="Click to edit permissions"
                          onClick={() => setChmodModal({
                            open: true,
                            path: currentPath ? `${currentPath}/${item.name}` : item.name,
                            mode: item.permissions || '0755'
                          })}
                        >
                          <Key size={12} />
                          {item.permissions || '0755'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-muted">
                          {new Date(item.mtime).toLocaleString()}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="action-buttons-inline">
                          {!item.isDirectory && (
                            <>
                              <button
                                className="btn-icon-sm"
                                title="Edit in Code Editor"
                                onClick={() => handleOpenFile(item)}
                              >
                                <Edit size={14} />
                              </button>
                              <a
                                href={`/api/files/download?path=${encodeURIComponent(currentPath ? `${currentPath}/${item.name}` : item.name)}`}
                                className="btn-icon-sm"
                                title="Download File"
                                download
                              >
                                <Download size={14} />
                              </a>
                            </>
                          )}
                          {item.extension === '.zip' && (
                            <button
                              className="btn-icon-sm text-emerald"
                              title="Extract Zip Archive"
                              onClick={() => handleExtractZip(item)}
                            >
                              <Archive size={14} />
                            </button>
                          )}
                          <button
                            className="btn-icon-danger"
                            title="Delete"
                            onClick={() => handleDelete(item)}
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

      {/* In-Browser Code Editor Modal */}
      {editingFile && (
        <div className="modal-backdrop">
          <div className="modal-card modal-editor">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <FileCode size={20} className="text-primary" />
                <span className="font-semibold text-white">{editingFile.name}</span>
                <span className="text-xs text-muted">({editingFile.path})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveFile}
                  disabled={editorSaving}
                >
                  <Save size={14} />
                  <span>{editorSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  className="btn-icon-sm"
                  onClick={() => setEditingFile(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="modal-body p-0">
              <textarea
                className="code-editor-textarea"
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create File / Folder Modal */}
      {createModal.open && (
        <div className="modal-backdrop">
          <div className="modal-card modal-sm">
            <div className="modal-header">
              <h3 className="font-semibold text-white">Create New {createModal.type === 'folder' ? 'Folder' : 'File'}</h3>
              <button className="btn-icon-sm" onClick={() => setCreateModal({ open: false, type: 'file' })}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateItem} className="p-4">
              <div className="form-group mb-4">
                <label className="form-label">{createModal.type === 'folder' ? 'Folder Name' : 'File Name (with extension)'}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={createModal.type === 'folder' ? 'e.g. assets' : 'e.g. server.js or style.css'}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-secondary-sm" onClick={() => setCreateModal({ open: false, type: 'file' })}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chmod Modal */}
      {chmodModal.open && (
        <div className="modal-backdrop">
          <div className="modal-card modal-sm">
            <div className="modal-header">
              <h3 className="font-semibold text-white">Change Permissions</h3>
              <button className="btn-icon-sm" onClick={() => setChmodModal({ open: false, path: '', mode: '0755' })}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleChmod} className="p-4">
              <div className="form-group mb-4">
                <label className="form-label">Octal Mode (e.g. 0755, 0644, 0777)</label>
                <input
                  type="text"
                  className="form-input"
                  value={chmodModal.mode}
                  onChange={(e) => setChmodModal({ ...chmodModal, mode: e.target.value })}
                  required
                />
                <span className="form-hint">Standard Web Directories: 0755 | Files: 0644</span>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-secondary-sm" onClick={() => setChmodModal({ open: false, path: '', mode: '0755' })}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Set Permissions</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

