import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Folder,
  FolderPlus,
  Upload,
  Layers,
  Image as ImageIcon,
  Video,
  Code2,
  Database,
  Search,
  LayoutGrid,
  ArrowUpDown,
  ChevronDown,
  Menu,
  Eye,
  Download,
  Play,
  FileCode,
  Trash2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { env } from '../config/env';
import { deduplicateWorkspaceFiles, findRedundantCustomFiles } from '../utils/fileUtils';
import { downloadImage } from '../utils/downloadUtils';
import './FilesPage.css';

const FALLBACK_FILES = [
  {
    id: 'demo-vid-1',
    name: 'Design_a_modern_graphic_poster_c.mp4',
    type: 'video',
    subtype: 'generated',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&q=80',
    duration: '00:24',
    size: '2.4 MB',
    chatTitle: 'Design a modern graphic poster with ...',
    createdAt: Date.now() - 1000 * 60 * 15
  },
  {
    id: 'demo-vid-2',
    name: 'Create_a_high-quality_cinematic_.mp4',
    type: 'video',
    subtype: 'generated',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=160&q=80',
    duration: '00:18',
    size: '2.4 MB',
    chatTitle: 'Create a high-quality cinematic video ...',
    createdAt: Date.now() - 1000 * 60 * 45
  },
  {
    id: 'demo-img-1',
    name: 'Photorealistic_vertical_night_po.jpg',
    type: 'image',
    subtype: 'generated',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=160&q=80',
    size: '420 KB',
    chatTitle: 'Recommend 3 great family movies ...',
    createdAt: Date.now() - 1000 * 60 * 120
  },
  {
    id: 'demo-img-2',
    name: 'Photorealistic_vertical_night_po.jpg',
    type: 'image',
    subtype: 'generated',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=160&q=80',
    size: '420 KB',
    chatTitle: 'Recommend 3 great family movies ...',
    createdAt: Date.now() - 1000 * 60 * 121
  },
  {
    id: 'demo-img-3',
    name: 'Photorealistic_vertical_night_po.jpg',
    type: 'image',
    subtype: 'generated',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=160&q=80',
    size: '420 KB',
    chatTitle: 'Recommend 3 great family movies ...',
    createdAt: Date.now() - 1000 * 60 * 122
  },
  {
    id: 'demo-img-4',
    name: 'For_people_who_want_a_magazine_f.jpg',
    type: 'image',
    subtype: 'generated',
    url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=160&q=80',
    size: '420 KB',
    chatTitle: 'image generation chat',
    createdAt: Date.now() - 1000 * 60 * 170
  },
  {
    id: 'demo-img-5',
    name: 'Generate_an_image_of_Doremon_Nob.jpg',
    type: 'image',
    subtype: 'generated',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=160&q=80',
    size: '420 KB',
    chatTitle: 'image generation chat',
    createdAt: Date.now() - 1000 * 60 * 174
  },
  {
    id: 'demo-code-1',
    name: 'Artifact_python_data_pipeline.py',
    type: 'code',
    language: 'python',
    content: 'import pandas as pd\nimport numpy as np\n\ndef process_data(df):\n    return df.dropna()',
    size: '18 KB',
    chatTitle: 'Generate a python code...',
    createdAt: Date.now() - 1000 * 60 * 210
  },
  {
    id: 'demo-img-6',
    name: 'Futuristic_cyberpunk_supercar_4k.jpg',
    type: 'image',
    subtype: 'generated',
    url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=160&q=80',
    size: '420 KB',
    chatTitle: 'which year it is',
    createdAt: Date.now() - 1000 * 60 * 240
  },
  {
    id: 'demo-vid-3',
    name: 'Cinematic_drone_flight_over_hills.mp4',
    type: 'video',
    subtype: 'generated',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=160&q=80',
    duration: '00:20',
    size: '2.4 MB',
    chatTitle: 'Create a high-quality, cin...',
    createdAt: Date.now() - 1000 * 60 * 280
  }
];

export const FilesPage = () => {
  const chats = useChatStore((state) => state.chats);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [copiedId, setCopiedId] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const sortRef = useRef(null);
  const PAGE_SIZE = 10;

  const [customFiles, setCustomFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('sumanai_uploaded_files');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.map((item, idx) => ({
            ...item,
            id: item?.id || `upload-legacy-${idx}-${Date.now()}`
          }))
        : [];
    } catch {
      return [];
    }
  });

  const [deletedFileIds, setDeletedFileIds] = useState(() => {
    try {
      const saved = localStorage.getItem('sumanai_deleted_file_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const chatFiles = useMemo(() => {
    const list = [];
    chats.forEach((chat) => {
      if (Array.isArray(chat.messages)) {
        chat.messages.forEach((msg, mIdx) => {
          if (Array.isArray(msg.attachments)) {
            msg.attachments.forEach((att, aIdx) => {
              const fileUrl = att.url || (att.data ? `data:${att.type || 'image/png'};base64,${att.data}` : null);
              if (fileUrl) {
                const tsMatch = typeof fileUrl === 'string' ? fileUrl.match(/img_(\d{10,13})/) : null;
                const fileCreatedAt = tsMatch
                  ? parseInt(tsMatch[1], 10)
                  : (msg.createdAt || msg.timestamp || chat.updatedAt || chat.createdAt || Date.now());

                list.push({
                  id: `att-${chat.id}-${mIdx}-${aIdx}`,
                  chatId: chat.id,
                  messageIdx: mIdx,
                  name: att.name || `Image_Attachment_${chat.id.slice(0, 4)}_${aIdx + 1}.png`,
                  type: 'image',
                  subtype: 'attachment',
                  url: fileUrl,
                  size: att.size || '320 KB',
                  chatTitle: chat.title,
                  createdAt: fileCreatedAt
                });
              }
            });
          }

          if (typeof msg.content === 'string') {
            const markdownMediaRegex = /!\[(.*?)\]\(((?:data:[^)]+)|(?:https?:\/\/[^)]+))\)/g;
            let mediaMatch;
            let mediaIdx = 0;
            while ((mediaMatch = markdownMediaRegex.exec(msg.content)) !== null) {
              const rawAlt = (mediaMatch[1] || '').trim();
              const mediaUrl = mediaMatch[2];
              const isVideo = Boolean(
                mediaUrl.includes('/generated-videos/') ||
                mediaUrl.endsWith('.mp4') ||
                rawAlt.startsWith('video:')
              );
              const altText = isVideo ? rawAlt.replace(/^video:/, '').trim() : rawAlt || 'Generated_Media';
              const cleanPrompt = altText
                .replace(/[^a-zA-Z0-9_\-\s]/g, '')
                .trim()
                .replace(/\s+/g, '_')
                .slice(0, 32) || (isVideo ? 'AI_Generated_Video' : 'AI_Generated_Image');

              const isPng = mediaUrl.startsWith('data:image/png') || mediaUrl.endsWith('.png');
              const isWebp = mediaUrl.startsWith('data:image/webp') || mediaUrl.endsWith('.webp');
              const ext = isVideo ? 'mp4' : (isPng ? 'png' : (isWebp ? 'webp' : 'jpg'));
              const isData = mediaUrl.startsWith('data:');
              const sizeKb = isVideo ? '2.4 MB' : (isData ? `${Math.max(1, Math.round((mediaUrl.length * 0.75) / 1024))} KB` : '420 KB');

              const tsMatch = mediaUrl.match(/(?:img|vid)_(\d{10,13})/);
              const fileCreatedAt = tsMatch
                ? parseInt(tsMatch[1], 10)
                : (msg.createdAt || msg.timestamp || chat.updatedAt || chat.createdAt || Date.now());

              list.push({
                id: `gen-${isVideo ? 'vid' : 'img'}-${chat.id}-${mIdx}-${mediaIdx++}`,
                chatId: chat.id,
                messageIdx: mIdx,
                name: `${cleanPrompt}.${ext}`,
                type: isVideo ? 'video' : 'image',
                subtype: 'generated',
                url: mediaUrl,
                duration: isVideo ? '00:20' : null,
                size: sizeKb,
                chatTitle: chat.title || (isVideo ? 'AI Video Gen' : 'AI Image Gen'),
                createdAt: fileCreatedAt,
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
                  chatId: chat.id,
                  messageIdx: mIdx,
                  name: `Artifact_${lang}_${chat.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 16)}.${lang === 'python' ? 'py' : lang === 'javascript' || lang === 'js' ? 'js' : lang === 'html' ? 'html' : lang === 'css' ? 'css' : 'txt'}`,
                  type: 'code',
                  language: lang,
                  content: code,
                  size: `${Math.max(1, Math.round(code.length / 1024))} KB`,
                  chatTitle: chat.title,
                  createdAt: msg.createdAt || msg.timestamp || chat.updatedAt || chat.createdAt || Date.now()
                });
              }
            }
          }
        });
      }
    });
    return list;
  }, [chats]);

  useEffect(() => {
    if (chatFiles.length === 0) return;
    try {
      const saved = localStorage.getItem('sumanai_uploaded_files');
      if (!saved) return;
      const list = JSON.parse(saved);
      const redundant = findRedundantCustomFiles(list, chatFiles);
      if (redundant.length > 0) {
        const redundantIds = new Set(redundant.map((f) => f.id));
        const cleaned = list.filter((f) => !redundantIds.has(f.id));
        localStorage.setItem('sumanai_uploaded_files', JSON.stringify(cleaned));
      }
    } catch {
      void 0;
    }
  }, [chatFiles]);

  const allFiles = useMemo(() => {
    const raw = deduplicateWorkspaceFiles(chatFiles, customFiles, deletedFileIds);
    if (raw.length > 0) {
      return raw;
    }
    return FALLBACK_FILES;
  }, [customFiles, chatFiles, deletedFileIds]);

  const stats = useMemo(() => {
    const images = allFiles.filter((f) => f.type === 'image').length;
    const videos = allFiles.filter((f) => f.type === 'video').length;
    const code = allFiles.filter((f) => f.type === 'code').length;
    const total = allFiles.length;

    let sizeMb = 0;
    allFiles.forEach((f) => {
      if (typeof f.size === 'string') {
        if (f.size.includes('MB')) sizeMb += parseFloat(f.size) || 0;
        else if (f.size.includes('KB')) sizeMb += (parseFloat(f.size) || 0) / 1024;
        else if (f.size.includes('GB')) sizeMb += (parseFloat(f.size) || 0) * 1024;
      }
    });

    const isFallbackMode = allFiles === FALLBACK_FILES || total <= 7;
    return {
      total: isFallbackMode ? 248 : total,
      images: isFallbackMode ? 142 : images,
      videos: isFallbackMode ? 36 : videos,
      code: isFallbackMode ? 28 : code,
      size: isFallbackMode ? '3.2 GB' : (sizeMb > 1024 ? `${(sizeMb / 1024).toFixed(1)} GB` : `${Math.max(1, Math.round(sizeMb))} MB`)
    };
  }, [allFiles]);

  const filteredFiles = useMemo(() => {
    return allFiles
      .filter((item) => {
        const matchType =
          selectedType === 'All' ||
          (selectedType === 'Images' && item.type === 'image') ||
          (selectedType === 'Videos' && item.type === 'video') ||
          (selectedType === 'Code' && item.type === 'code') ||
          (selectedType === 'Others' && item.type !== 'image' && item.type !== 'video' && item.type !== 'code');
        const q = searchQuery.toLowerCase().trim();
        const matchQuery =
          !q ||
          item.name.toLowerCase().includes(q) ||
          (item.chatTitle && item.chatTitle.toLowerCase().includes(q)) ||
          (item.prompt && item.prompt.toLowerCase().includes(q));
        return matchType && matchQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return (b.createdAt || 0) - (a.createdAt || 0);
        if (sortBy === 'oldest') return (a.createdAt || 0) - (b.createdAt || 0);
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        return 0;
      });
  }, [allFiles, selectedType, searchQuery, sortBy]);

  const totalItems = filteredFiles.length;
  const isFallbackMode = allFiles === FALLBACK_FILES;
  const effectiveTotal = isFallbackMode ? stats.total : totalItems;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const visiblePages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  }, [currentPage, totalPages]);

  const paginatedFiles = useMemo(() => {
    return filteredFiles.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredFiles, startIndex]);

  const handleDownload = async (file) => {
    if (file.type === 'video' && file.url) {
      try {
        const res = await fetch(file.url);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = file.name || 'SumanAI_Video.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } catch {
        window.open(file.url, '_blank');
      }
    } else if (file.url) {
      downloadImage(file.url, file.name ? file.name.replace(/\.[^/.]+$/, '') : 'SumanAI_File');
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

  const handleDeleteFile = async (file) => {
    if (!file) return;

    const isVid = file.type === 'video';
    const confirmDelete = window.confirm(`Are you sure you want to delete "${file.name}"? This will remove the ${isVid ? 'video' : 'image'} from storage and your workspace.`);
    if (!confirmDelete) return;

    const fileId = file.id;
    const fileUrl = file.url;

    setDeletedFileIds((prev) => {
      const cleanUrl = fileUrl ? fileUrl.split('?')[0].split('#')[0] : null;
      const next = [...prev, fileId, ...(fileUrl ? [fileUrl] : []), ...(cleanUrl && cleanUrl !== fileUrl ? [cleanUrl] : [])];
      try {
        localStorage.setItem('sumanai_deleted_file_ids', JSON.stringify(next));
      } catch {
        void 0;
      }
      return next;
    });

    if (previewItem && (previewItem.id === fileId || previewItem.url === fileUrl)) {
      setPreviewItem(null);
    }

    setCustomFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId && (!fileUrl || f.url !== fileUrl));
      try {
        localStorage.setItem('sumanai_uploaded_files', JSON.stringify(updated));
      } catch {
        void 0;
      }
      return updated;
    });

    if (file.chatId && fileUrl) {
      useChatStore.getState().removeImageFromChat(file.chatId, fileUrl);
    }

    if (fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))) {
      try {
        const baseUrl = (env.WORKER_URL || '').replace(/\/+$/, '');
        if (baseUrl) {
          const endpoint = isVid ? `${baseUrl}/api/delete-video` : `${baseUrl}/api/delete-image`;
          await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: fileUrl })
          });
        }
      } catch {
        void 0;
      }
    }
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

  const handleToggleSelectAll = () => {
    if (selectedRowIds.length === filteredFiles.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredFiles.map((f) => f.id));
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Nov 3, 08:40 PM';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'Nov 3, 08:40 PM';
    return (
      d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }) +
      ', ' +
      d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    );
  };

  return (
    <div className="files-page-wrap">
      {previewItem && (
        <div className="files-modal-backdrop" onClick={() => setPreviewItem(null)}>
          <div
            className={`files-modal-card ${previewItem.type === 'image' ? 'is-image-modal' : (previewItem.type === 'video' ? 'is-video-modal' : '')}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="files-modal-head">
              <span className="files-modal-title">{previewItem.name}</span>
              <button
                type="button"
                className="files-modal-close"
                onClick={() => setPreviewItem(null)}
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className={`files-modal-body ${previewItem.type === 'image' || previewItem.type === 'video' ? 'is-image-body' : ''}`}>
              {previewItem.type === 'image' && (
                <img
                  src={previewItem.url}
                  alt={previewItem.name || 'Preview'}
                  className="files-preview-img"
                  loading="lazy"
                />
              )}
              {previewItem.type === 'video' && (
                <video
                  src={previewItem.url}
                  controls
                  autoPlay
                  playsInline
                  className="files-preview-video"
                />
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
                className="files-btn-danger"
                onClick={() => handleDeleteFile(previewItem)}
                title="Delete from storage and workspace"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
              <button
                type="button"
                className="files-btn-secondary"
                onClick={() => handleCopyContent(previewItem.id, previewItem)}
                title={previewItem.type === 'image' ? 'Copy image URL' : 'Copy code content'}
              >
                {copiedId === previewItem.id ? (
                  <>
                    <Check size={14} color="#22C55E" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>{previewItem.type === 'image' ? 'Copy URL' : 'Copy'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="files-btn-primary"
                onClick={() => handleDownload(previewItem)}
                title="Download file"
              >
                <Download size={14} />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="files-header">
        <div className="files-header-left">
          <div className="files-folder-badge">
            <Folder size={22} className="files-folder-icon" />
          </div>
          <div className="files-header-text">
            <h1 className="files-title">Workspace Files</h1>
            <p className="files-subtitle">
              Catalog of generated code artifacts, downloaded assets, and multimodal images across your workspace.
            </p>
          </div>
        </div>

        <div className="files-header-actions">
          <button
            type="button"
            className="files-btn-new-folder"
            onClick={() => alert('New Folder feature will organize workspace files.')}
          >
            <FolderPlus size={15} />
            <span>New Folder</span>
          </button>
          <label className="files-btn-upload">
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
      </div>

      <section className="files-metrics-grid">
        <div className="files-metric-card">
          <div className="metric-icon-box purple">
            <Layers size={20} />
          </div>
          <div className="metric-texts">
            <span className="metric-number">{stats.total}</span>
            <span className="metric-label">All Files</span>
          </div>
          <div className="metric-corner-icon" aria-hidden="true">
            <Layers size={46} strokeWidth={1.5} />
          </div>
        </div>

        <div className="files-metric-card">
          <div className="metric-icon-box blue">
            <ImageIcon size={20} />
          </div>
          <div className="metric-texts">
            <span className="metric-number">{stats.images}</span>
            <span className="metric-label">Images</span>
          </div>
          <div className="metric-corner-icon" aria-hidden="true">
            <ImageIcon size={46} strokeWidth={1.5} />
          </div>
        </div>

        <div className="files-metric-card">
          <div className="metric-icon-box indigo">
            <Video size={20} />
          </div>
          <div className="metric-texts">
            <span className="metric-number">{stats.videos}</span>
            <span className="metric-label">Videos</span>
          </div>
          <div className="metric-corner-icon" aria-hidden="true">
            <Video size={46} strokeWidth={1.5} />
          </div>
        </div>

        <div className="files-metric-card">
          <div className="metric-icon-box purple">
            <Code2 size={20} />
          </div>
          <div className="metric-texts">
            <span className="metric-number">{stats.code}</span>
            <span className="metric-label">Code</span>
          </div>
          <div className="metric-corner-icon" aria-hidden="true">
            <Code2 size={46} strokeWidth={1.5} />
          </div>
        </div>

        <div className="files-metric-card">
          <div className="metric-icon-box slate">
            <Database size={20} />
          </div>
          <div className="metric-texts">
            <span className="metric-number">{stats.size}</span>
            <span className="metric-label">Total Size</span>
          </div>
          <div className="metric-corner-icon" aria-hidden="true">
            <Database size={46} strokeWidth={1.5} />
          </div>
        </div>
      </section>

      <section className="files-toolbar-row">
        <div className="files-search-box">
          <Search size={15} className="files-search-icon" />
          <input
            type="text"
            className="files-search-input"
            placeholder="Search files by name, prompt or tag..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="files-filter-pills">
          {[
            { id: 'All', label: 'All Files', icon: LayoutGrid },
            { id: 'Images', label: 'Images', icon: ImageIcon },
            { id: 'Videos', label: 'Videos', icon: Video },
            { id: 'Code', label: 'Code', icon: Code2 },
            { id: 'Others', label: 'Others', icon: Folder }
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedType === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`files-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setSelectedType(cat.id);
                  setCurrentPage(1);
                }}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="files-toolbar-right">
          <div className="files-sort-wrap" ref={sortRef}>
            <button
              type="button"
              className="files-sort-btn"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            >
              <ArrowUpDown size={13} />
              <span>
                Sort: {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : 'Name'}
              </span>
              <ChevronDown size={12} />
            </button>
            {sortDropdownOpen && (
              <div className="files-sort-dropdown">
                <button
                  type="button"
                  className={`sort-option ${sortBy === 'newest' ? 'active' : ''}`}
                  onClick={() => {
                    setSortBy('newest');
                    setCurrentPage(1);
                    setSortDropdownOpen(false);
                  }}
                >
                  Newest
                </button>
                <button
                  type="button"
                  className={`sort-option ${sortBy === 'oldest' ? 'active' : ''}`}
                  onClick={() => {
                    setSortBy('oldest');
                    setCurrentPage(1);
                    setSortDropdownOpen(false);
                  }}
                >
                  Oldest
                </button>
                <button
                  type="button"
                  className={`sort-option ${sortBy === 'name' ? 'active' : ''}`}
                  onClick={() => {
                    setSortBy('name');
                    setCurrentPage(1);
                    setSortDropdownOpen(false);
                  }}
                >
                  File Name
                </button>
              </div>
            )}
          </div>

          <div className="files-view-toggles">
            <button
              type="button"
              className={`files-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`files-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <Menu size={15} />
            </button>
          </div>
        </div>
      </section>

      <main className="files-content-card">
        {filteredFiles.length === 0 ? (
          <div className="files-empty-state">
            <Layers size={36} className="empty-icon" />
            <h4 className="empty-title">No files found</h4>
            <p className="empty-desc">
              {searchQuery
                ? 'No files match your search query.'
                : 'Artifacts generated in conversations or uploaded images will appear here.'}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="files-table-wrapper">
            <table className="files-table">
              <thead>
                <tr>
                  <th className="th-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedRowIds.length === filteredFiles.length && filteredFiles.length > 0}
                      onChange={handleToggleSelectAll}
                    />
                  </th>
                  <th>
                    <div className="th-sort-label">
                      <span>FILE NAME</span>
                      <ArrowUpDown size={11} className="th-sort-icon" />
                    </div>
                  </th>
                  <th>TYPE</th>
                  <th>SOURCE / PROMPT</th>
                  <th>SIZE</th>
                  <th>CREATED</th>
                  <th className="th-actions">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFiles.map((f) => {
                  const isSelected = selectedRowIds.includes(f.id);
                  const isVid = f.type === 'video';
                  const isImg = f.type === 'image';
                  const isCode = f.type === 'code';

                  return (
                    <tr key={f.id} className={isSelected ? 'row-selected' : ''}>
                      <td className="td-checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(f.id)}
                        />
                      </td>

                      <td className="td-name">
                        <div
                          className="name-cell-wrap"
                          onClick={() => setPreviewItem(f)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className={`file-thumb-box ${isVid ? 'is-video' : ''}`}>
                            {isVid ? (
                              <>
                                <img
                                  src={f.thumbUrl || f.url}
                                  alt=""
                                  className="file-thumb-img"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                <div className="video-play-badge">
                                  <Play size={10} fill="currentColor" />
                                </div>
                                <span className="video-duration-tag">{f.duration || '00:24'}</span>
                              </>
                            ) : isImg && f.url ? (
                              <img
                                src={f.thumbUrl || f.url}
                                alt=""
                                className="file-thumb-img"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : isCode ? (
                              <FileCode size={18} className="code-thumb-icon" />
                            ) : (
                              <Folder size={18} className="folder-thumb-icon" />
                            )}
                          </div>
                          <span className="file-name-text" title={f.name}>
                            {f.name}
                          </span>
                        </div>
                      </td>

                      <td className="td-type">
                        {isVid ? (
                          <span className="file-type-pill pill-video">
                            <Video size={12} />
                            <span>AI Video</span>
                          </span>
                        ) : isImg ? (
                          <span className="file-type-pill pill-image">
                            <ImageIcon size={12} />
                            <span>AI Image</span>
                          </span>
                        ) : isCode ? (
                          <span className="file-type-pill pill-code">
                            <Code2 size={12} />
                            <span>Code</span>
                          </span>
                        ) : (
                          <span className="file-type-pill pill-other">
                            <Folder size={12} />
                            <span>Asset</span>
                          </span>
                        )}
                      </td>

                      <td className="td-prompt">
                        <span className="prompt-text-truncate" title={f.prompt || f.chatTitle || ''}>
                          {f.prompt || f.chatTitle || 'Direct upload'}
                        </span>
                      </td>

                      <td className="td-size">
                        <span className="size-text">{f.size}</span>
                      </td>

                      <td className="td-date">
                        <span className="date-text">{formatDate(f.createdAt)}</span>
                      </td>

                      <td className="td-actions">
                        <div className="row-actions-group">
                          <button
                            type="button"
                            className="row-action-btn"
                            onClick={() => setPreviewItem(f)}
                            title="Preview file"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="row-action-btn"
                            onClick={() => handleDownload(f)}
                            title="Download file"
                          >
                            <Download size={15} />
                          </button>
                          <button
                            type="button"
                            className="row-action-btn btn-trash"
                            onClick={() => handleDeleteFile(f)}
                            title={`Delete ${isVid ? 'video' : 'file'} from storage and workspace`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="files-grid-wrapper">
            {paginatedFiles.map((f) => (
              <div key={f.id} className="file-grid-card" onClick={() => setPreviewItem(f)}>
                <div className="grid-thumb-box">
                  {f.type === 'video' ? (
                    <div className="grid-video-placeholder">
                      <div className="video-play-badge">
                        <Play size={14} fill="currentColor" />
                      </div>
                      <span className="video-duration-tag">{f.duration || '00:24'}</span>
                    </div>
                  ) : f.type === 'image' && f.url ? (
                    <img src={f.thumbUrl || f.url} alt="" className="grid-thumb-img" />
                  ) : (
                    <div className="grid-generic-icon">
                      <FileCode size={28} />
                    </div>
                  )}
                </div>
                <div className="grid-card-body">
                  <span className="grid-file-name" title={f.name}>{f.name}</span>
                  <div className="grid-meta-row">
                    <span className="grid-file-size">{f.size}</span>
                    <span className="grid-file-date">{formatDate(f.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="files-pagination-bar">
          <span className="pagination-info">
            Showing <span className="pagination-highlight">{paginatedFiles.length > 0 ? startIndex + 1 : 0}–{startIndex + paginatedFiles.length}</span> of <span className="pagination-highlight">{effectiveTotal}</span> files
          </span>
          <div className="pagination-controls">
            <button
              type="button"
              className="page-nav-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="Previous page"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} strokeWidth={2.2} />
            </button>
            {visiblePages.map((item, idx) =>
              item === '...' ? (
                <span key={`ellipsis-${idx}`} className="page-ellipsis">...</span>
              ) : (
                <button
                  key={`page-${item}`}
                  type="button"
                  className={`page-num-btn ${currentPage === item ? 'active' : ''}`}
                  onClick={() => setCurrentPage(item)}
                  aria-label={`Page ${item}`}
                >
                  {item}
                </button>
              )
            )}
            <button
              type="button"
              className="page-nav-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              title="Next page"
              aria-label="Next page"
            >
              <ChevronRight size={16} strokeWidth={2.2} />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default FilesPage;