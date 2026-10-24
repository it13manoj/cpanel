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
  CheckSquare,
  Square
} from 'lucide-react';
import { api } from '../api';

export default function FileManagerView({ initialPath }) {
  const [currentPath, setCurrentPath] = useState(initialPath || '');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Multi-select state
  const [selectedItems, setSelectedItems] = useState([]);

  // Drag and Drop state
  const [isDragging, setIsDragging] = useState(false);

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
  const folderInputRef = useRef(null);

  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath]);

  const loadFiles = async (targetPath) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedItems([]);
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

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedItems.length === items.length && items.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((i) => i.name));
    }
  };

  const handleToggleSelect = (name) => {
    setSelectedItems((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  // Batch delete selected files & folders
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    const count = selectedItems.length;
    if (
      window.confirm(
        `Are you sure you want to permanently delete the ${count} selected item(s)?\n\nItems: ${selectedItems.join(
          ', '
        )}`
      )
    ) {
      try {
        setLoading(true);
        const paths = selectedItems.map((name) =>
          currentPath ? `${currentPath}/${name}` : name
        );
        const res = await api.deleteMultipleItems(paths);
        setMessage(`Successfully deleted ${res.deletedCount || count} item(s).`);
        setSelectedItems([]);
        loadFiles(currentPath);
      } catch (err) {
        setError('Batch delete failed: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
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

  // Upload handler (regular & drag-drop)
  const processUploadFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const formData = new FormData();
    formData.append('destination', currentPath);
    for (let i = 0; i < fileList.length; i++) {
      formData.append('files', fileList[i]);
    }

    try {
      setLoading(true);
      await api.uploadFiles(formData);
      setMessage(`Uploaded ${fileList.length} file(s) successfully.`);
      loadFiles(currentPath);
    } catch (err) {
      setError('Upload failed: ' + err.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e) => {
    processUploadFiles(e.target.files);
  };

  // Drag & Drop event handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadFiles(e.dataTransfer.files);
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
    <div
      className="view-container"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="view-header">
        <div>
          <h1 className="view-title">Web File Manager & Code Editor</h1>
          <p className="view-subtitle">
            Manage project files, drag & drop codebases to upload, batch select folders, and adjust permissions.
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
            <span>Upload Files</span>
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

      {/* Drag & Drop Upload Zone */}
      <div
        className={`drag-drop-zone ${isDragging ? 'active-drag' : ''}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={24} style={{ color: isDragging ? '#0284c7' : '#64748b' }} />
        <p>
          {isDragging
            ? 'Drop your files or zip archive here to upload immediately!'
            : 'Drag & Drop files or website archives (.zip, .html, .js) anywhere here to upload'}
        </p>
        <span className="subtext">
          Target folder: <code>/{currentPath || 'root'}</code> (Click to browse files)
        </span>
      </div>

      {/* Batch Selection Action Bar */}
      {selectedItems.length > 0 && (
        <div className="bulk-action-bar">
          <div className="flex items-center gap-2">
            <CheckSquare size={16} className="text-primary" />
            <span style={{ fontWeight: 600 }}>
              {selectedItems.length} of {items.length} item(s) selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-secondary-sm"
              onClick={() => setSelectedItems([])}
            >
              Deselect All
            </button>
            <button
              className="btn-icon-danger"
              style={{ width: 'auto', padding: '0.35rem 0.75rem', gap: '0.35rem', display: 'inline-flex' }}
              onClick={handleBatchDelete}
              title="Delete all selected files and folders"
            >
              <Trash2 size={14} />
              <span>Delete Selected ({selectedItems.length})</span>
            </button>
          </div>
        </div>
      )}

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

      {/* File List Table with Multi-Select Checkboxes */}
      <div className="content-card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="cpanel-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="cpanel-checkbox"
                      title="Select / Deselect All"
                      checked={items.length > 0 && selectedItems.length === items.length}
                      onChange={handleToggleSelectAll}
                    />
                  </th>
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
                    <td colSpan={6} className="text-center py-8 text-muted">
                      Folder is empty. Upload or drop files using the zone above.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const isChecked = selectedItems.includes(item.name);
                    return (
                      <tr
                        key={item.name}
                        className={isChecked ? 'bg-sky-50' : ''}
                        style={isChecked ? { backgroundColor: '#f0f9ff' } : {}}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            className="cpanel-checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelect(item.name)}
                          />
                        </td>
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
                            onClick={() =>
                              setChmodModal({
                                open: true,
                                path: currentPath ? `${currentPath}/${item.name}` : item.name,
                                mode: item.permissions || '0755'
                              })
                            }
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
                                  href={`/api/files/download?path=${encodeURIComponent(
                                    currentPath ? `${currentPath}/${item.name}` : item.name
                                  )}`}
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
                    );
                  })
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
