import React, { useState, useMemo } from 'react';
import {
  FolderHeart,
  Search,
  Download,
  Copy,
  Check,
  Eye,
  Trash2,
  FileCode,
  Image as ImageIcon,
  FileText,
  Upload,
  X
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import './FilesPage.css';

export const FilesPage = () => {
  const chats = useChatStore((state) => state.chats);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [copiedId, setCopiedId] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [customFiles, setCustomFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('sumanai_uploaded_files');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const chatFiles = useMemo(() => {
    const list = [];
    chats.forEach((chat) => {
      if (Array.isArray(chat.messages)) {
        chat.messages.forEach((msg, mIdx) => {
          if (Array.isArray(msg.attachments)) {
            msg.attachments.forEach((att, aIdx) => {
              const fileUrl = att.url || (att.data ? `data:${att.type || 'image/png'};base64,${att.data}` : null);
              if (fileUrl) {
                list.push({
                  id: `att-${chat.id}-${mIdx}-${aIdx}`,
                  name: att.name || `Image_Attachment_${chat.id.slice(0, 4)}_${aIdx + 1}.png`,
                  type: 'image',
                  subtype: 'attachment',
                  url: fileUrl,
                  size: att.size || '320 KB',
                  chatTitle: chat.title,
                  createdAt: chat.createdAt || Date.now()
                });
              }
            });
          }

          if (typeof msg.content === 'string') {
            const markdownImageRegex = /!\[(.*?)\]\(((?:data:image\/[^)]+)|(?:https?:\/\/[^)]+))\)/g;
            let imgMatch;
            let imgIdx = 0;
            while ((imgMatch = markdownImageRegex.exec(msg.content)) !== null) {
              const altText = (imgMatch[1] || 'Generated_Image').trim();
              const imgUrl = imgMatch[2];
              const cleanPrompt = altText
                .replace(/[^a-zA-Z0-9_\-\s]/g, '')
                .trim()
                .replace(/\s+/g, '_')
                .slice(0, 32) || 'AI_Generated_Image';
              const isPng = imgUrl.startsWith('data:image/png') || imgUrl.endsWith('.png');
              const isWebp = imgUrl.startsWith('data:image/webp') || imgUrl.endsWith('.webp');
              const ext = isPng ? 'png' : (isWebp ? 'webp' : 'jpg');
              const isData = imgUrl.startsWith('data:');
              const sizeKb = isData ? Math.max(1, Math.round((imgUrl.length * 0.75) / 1024)) : 420;

              list.push({
                id: `gen-img-${chat.id}-${mIdx}-${imgIdx++}`,
                name: `${cleanPrompt}.${ext}`,
                type: 'image',
                subtype: 'generated',
                url: imgUrl,
                size: `${sizeKb} KB`,
                chatTitle: chat.title || 'AI Image Gen',
                createdAt: chat.createdAt || Date.now(),
                prompt: altText
              });
            }

            const codeBlockRegex = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;
            let match;
            let blockIdx = 0;
            while ((match = codeBlockRegex.exec(msg.content)) !== null) {
              const lang = (match[1] || 'text').toLowerCase();
              const code = match[2];
              if (code.length > 40) {
                list.push({
                  id: `code-${chat.id}-${mIdx}-${blockIdx++}`,
                  name: `Artifact_${lang}_${chat.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 16)}.${lang === 'python' ? 'py' : lang === 'javascript' || lang === 'js' ? 'js' : lang === 'html' ? 'html' : lang === 'css' ? 'css' : 'txt'}`,
                  type: 'code',
                  language: lang,
                  content: code,
                  size: `${Math.max(1, Math.round(code.length / 1024))} KB`,
                  chatTitle: chat.title,
                  createdAt: chat.createdAt || Date.now()
                });
              }
            }
          }
        });
      }
    });
    return list;
  }, [chats]);

  const allFiles = useMemo(() => {
    return [...customFiles, ...chatFiles];
  }, [customFiles, chatFiles]);

  const filteredFiles = useMemo(() => {
    return allFiles.filter((item) => {
      const matchType =
        selectedType === 'All' ||
        (selectedType === 'Images' && item.type === 'image') ||
        (selectedType === 'Code' && item.type === 'code');
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.chatTitle && item.chatTitle.toLowerCase().includes(q));
      return matchType && matchQuery;
    });
  }, [allFiles, selectedType, searchQuery]);

  const handleDownload = (file) => {
    if (file.url) {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name || 'SumanAI_Generated_Image.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (file.content) {
      const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleCopyContent = (id, file) => {
    if (file.content) {
      navigator.clipboard.writeText(file.content);
    } else if (file.url) {
      navigator.clipboard.writeText(file.url);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteCustomFile = (id) => {
    setCustomFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      try {
        localStorage.setItem('sumanai_uploaded_files', JSON.stringify(updated));
      } catch {
        void 0;
      }
      return updated;
    });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((f) => {
      const reader = new FileReader();
      const isImg = f.type.startsWith('image/');
      reader.onload = () => {
        const newFile = {
          id: `upload-${Date.now()}-${Math.random()}`,
          name: f.name,
          type: isImg ? 'image' : 'code',
          url: isImg ? reader.result : null,
          content: !isImg ? reader.result : null,
          size: `${Math.round(f.size / 1024)} KB`,
          chatTitle: 'Direct Upload',
          createdAt: Date.now()
        };
        setCustomFiles((prev) => {
          const updated = [newFile, ...prev];
          try {
            localStorage.setItem('sumanai_uploaded_files', JSON.stringify(updated));
          } catch {
            void 0;
          }
          return updated;
        });
      };
      if (isImg) {
        reader.readAsDataURL(f);
      } else {
        reader.readAsText(f);
      }
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recent';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="files-page-wrap">
      {previewItem && (
        <div className="files-modal-backdrop" onClick={() => setPreviewItem(null)}>
          <div className="files-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="files-modal-head">
              <span className="files-modal-title">{previewItem.name}</span>
              <button
                type="button"
                className="files-modal-close"
                onClick={() => setPreviewItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="files-modal-body">
              {previewItem.type === 'image' && (
                <img src={previewItem.url} alt="" className="files-preview-img" />
              )}
              {previewItem.type === 'code' && (
                <pre className="files-preview-code">
                  <code>{previewItem.content}</code>
                </pre>
              )}
            </div>

            <div className="files-modal-footer">
              <button
                type="button"
                className="files-btn-secondary"
                onClick={() => handleCopyContent(previewItem.id, previewItem)}
              >
                Copy Content
              </button>
              <button
                type="button"
                className="files-btn-primary"
                onClick={() => handleDownload(previewItem)}
              >
                <Download size={14} />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="files-header">
        <div className="files-header-text">
          <h1 className="files-title">Workspace Files</h1>
          <p className="files-subtitle">
            Catalog of generated code artifacts, downloaded assets, and multimodal images across your workspace.
          </p>
        </div>

        <label className="files-upload-btn">
          <Upload size={15} />
          <span>Upload File</span>
          <input
            type="file"
            multiple
            className="files-hidden-input"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      <div className="files-filter-row">
        <div className="files-search-wrap">
          <Search size={16} className="files-search-icon" />
          <input
            type="text"
            className="files-search-input"
            placeholder="Search files by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="files-type-pills">
          {['All', 'Code', 'Images'].map((type) => (
            <button
              key={type}
              type="button"
              className={`files-type-pill ${selectedType === type ? 'active' : ''}`}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="files-table-card">
        {filteredFiles.length === 0 ? (
          <div className="files-empty">
            <FolderHeart size={36} color="var(--text-muted)" />
            <h4 className="files-empty-title">No files found</h4>
            <p className="files-empty-desc">
              {searchQuery
                ? 'No files match your search query.'
                : 'Artifacts generated in conversations or uploaded images will appear here.'}
            </p>
          </div>
        ) : (
          <div className="files-table-responsive">
            <table className="files-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Source Context</th>
                  <th>Size</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((f) => {
                  const isCopied = copiedId === f.id;
                  const isCustom = f.id.startsWith('upload-');

                  return (
                    <tr key={f.id}>
                      <td>
                        <div className="files-name-cell">
                          <div className="files-icon-box">
                            {f.type === 'image' && f.url ? (
                              <img src={f.url} alt="" className="files-thumb-img" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            ) : f.type === 'image' ? (
                              <ImageIcon size={15} color={f.subtype === 'generated' ? '#A78BFA' : '#3B82F6'} />
                            ) : (
                              <FileCode size={15} color="#10B981" />
                            )}
                          </div>
                          <span className="files-name-text">{f.name}</span>
                        </div>
                      </td>

                      <td>
                        <span className={`files-type-tag ${f.subtype === 'generated' ? 'type-generated' : `type-${f.type}`}`}>
                          {f.subtype === 'generated' ? 'AI IMAGE' : f.type === 'code' ? (f.language || 'Code').toUpperCase() : 'IMAGE'}
                        </span>
                      </td>

                      <td>
                        <span className="files-source-text">{f.chatTitle || 'Direct'}</span>
                      </td>

                      <td>
                        <span className="files-size-text">{f.size}</span>
                      </td>

                      <td>
                        <span className="files-date-text">{formatDate(f.createdAt)}</span>
                      </td>

                      <td>
                        <div className="files-action-row">
                          <button
                            type="button"
                            className="files-action-btn"
                            onClick={() => setPreviewItem(f)}
                            title="Preview file"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            className="files-action-btn"
                            onClick={() => handleCopyContent(f.id, f)}
                            title="Copy file content or URL"
                          >
                            {isCopied ? <Check size={14} color="#22C55E" /> : <Copy size={14} />}
                          </button>
                          <button
                            type="button"
                            className="files-action-btn"
                            onClick={() => handleDownload(f)}
                            title="Download file"
                          >
                            <Download size={14} />
                          </button>
                          {isCustom && (
                            <button
                              type="button"
                              className="files-action-btn btn-trash"
                              onClick={() => handleDeleteCustomFile(f.id)}
                              title="Delete file"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilesPage;

