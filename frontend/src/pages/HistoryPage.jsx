import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Search,
  Calendar,
  Filter,
  ArrowUpDown,
  ChevronDown,
  RefreshCw,
  Download,
  Plus,
  MessageSquare,
  MessagesSquare,
  Bookmark,
  Menu,
  LayoutGrid,
  Image as ImageIcon,
  Video,
  Code2,
  CheckCircle2,
  XCircle,
  Pin,
  ExternalLink,
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { generateChatTranscript } from '../utils/formatters';
import RenameModal from '../components/RenameModal';
import './HistoryPage.css';

const DATE_OPTIONS = [
  { value: 'all', label: 'Any Date' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Past 7 Days' },
  { value: 'older', label: 'Older' }
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'error', label: 'Error' }
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'messages', label: 'Most Messages' }
];

const FALLBACK_CHATS = [
  {
    id: 'chat-demo-1',
    title: 'Design a modern graphic poster',
    snippet: 'Image: video:Create a high-quality, cinematic 3D animated...',
    type: 'Image',
    msgCount: 3,
    updatedAt: Date.now() - 1000 * 60 * 30,
    status: 'Completed',
    isPinned: false
  },
  {
    id: 'chat-demo-2',
    title: 'Create a high-quality cinematic video',
    snippet: 'Image: video:Create a high-quality, cinematic 3D animated...',
    type: 'Video',
    msgCount: 2,
    updatedAt: Date.now() - 1000 * 60 * 65,
    status: 'Completed',
    isPinned: false
  },
  {
    id: 'chat-demo-3',
    title: 'Recommend 3 great family movies',
    snippet: 'Image: Photorealistic vertical night portrait of a young...',
    type: 'Image',
    msgCount: 14,
    updatedAt: Date.now() - 1000 * 60 * 200,
    status: 'Completed',
    isPinned: false
  },
  {
    id: 'chat-demo-4',
    title: 'which year it is',
    snippet: "Breaking Down the Response Let's analyze the response line...",
    type: 'Chat',
    msgCount: 8,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
    status: 'Completed',
    isPinned: false
  },
  {
    id: 'chat-demo-5',
    title: 'hello who are you and which model',
    snippet: "Introduction Greetings! I'm SumanAI, a high-performance...",
    type: 'Chat',
    msgCount: 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 48,
    status: 'Completed',
    isPinned: false
  },
  {
    id: 'chat-demo-6',
    title: 'image generation chat',
    snippet: 'Image: For people who want a magazine feel instead of a...',
    type: 'Image',
    msgCount: 38,
    updatedAt: Date.now() - 1000 * 60 * 60 * 72,
    status: 'Completed',
    isPinned: false
  },
  {
    id: 'chat-demo-7',
    title: 'who is Narendra Modi',
    snippet: "The Ocean's Majesty The ocean's waves crash on the shore...",
    type: 'Chat',
    msgCount: 4,
    updatedAt: Date.now() - 1000 * 60 * 60 * 72,
    status: 'Completed',
    isPinned: false
  },
  {
    id: 'chat-demo-8',
    title: 'Generate a python code to reorder',
    snippet: "Introduction Hello, I'm SumanAI, a highly advanced languag...",
    type: 'Code',
    msgCount: 12,
    updatedAt: Date.now() - 1000 * 60 * 60 * 72,
    status: 'Error',
    isPinned: false
  },
  {
    id: 'chat-demo-9',
    title: 'Provide a comprehensive briefing',
    snippet: "Error: 5006: Error: Length of '/prompt' must be <= 2048. Please...",
    type: 'Code',
    msgCount: 34,
    updatedAt: Date.now() - 1000 * 60 * 60 * 96,
    status: 'Error',
    isPinned: false
  },
  {
    id: 'chat-demo-10',
    title: 'write me a stylish Python code',
    snippet: 'SumanAI - Model: Gpt Oss 120b Below is a self-contained...',
    type: 'Code',
    msgCount: 8,
    updatedAt: Date.now() - 1000 * 60 * 60 * 550,
    status: 'Completed',
    isPinned: false
  },
  {
    id: 'chat-demo-11',
    title: 'Analyze revenue growth trajectory',
    snippet: 'Financial projections model with compounding annualized margins...',
    type: 'Chat',
    msgCount: 6,
    updatedAt: Date.now() - 1000 * 60 * 60 * 600,
    status: 'Completed',
    isPinned: false
  }
];

export const HistoryPage = () => {
  const navigate = useNavigate();
  const { chats, createNewChat, renameChat, togglePinChat, deleteChat, clearAll, isSyncing, syncChats } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const menuRef = useRef(null);
  const toolbarFiltersRef = useRef(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
      if (toolbarFiltersRef.current && !toolbarFiltersRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const detectChatType = (chat) => {
    const text = (chat.title + ' ' + (chat.messages || []).map((m) => m.content || '').join(' ')).toLowerCase();
    if (text.includes('/generated-videos/') || text.includes('video:') || text.includes('.mp4')) return 'Video';
    if (text.includes('/generated-images/') || text.includes('image:') || text.includes('![')) return 'Image';
    if (text.includes('```') || text.includes('def ') || text.includes('function ') || text.includes('python')) return 'Code';
    return 'Chat';
  };

  const detectChatStatus = (chat) => {
    const hasError = (chat.messages || []).some((m) =>
      m.isError || (typeof m.content === 'string' && m.content.toLowerCase().includes('error:'))
    );
    return hasError ? 'Error' : 'Completed';
  };

  const getChatSnippet = (chat) => {
    const lastMsg = (chat.messages || [])[chat.messages?.length - 1];
    if (!lastMsg || !lastMsg.content) return 'Conversation thread recorded in workspace.';
    let clean = String(lastMsg.content)
      .replace(/!\[(.*?)\]\([^)]+\)/g, 'Image: $1')
      .replace(/```[\s\S]*?```/g, '[Code snippet]')
      .replace(/\s+/g, ' ')
      .trim();
    return clean.slice(0, 75) + (clean.length > 75 ? '...' : '');
  };

  const allRecords = useMemo(() => {
    if (chats.length > 0) {
      return chats.map((c) => ({
        id: c.id,
        title: c.title || 'Untitled Session',
        snippet: getChatSnippet(c),
        type: detectChatType(c),
        msgCount: c.messages?.length || 0,
        updatedAt: c.updatedAt || c.createdAt || 0,
        status: detectChatStatus(c),
        isPinned: Boolean(c.isPinned),
        messages: c.messages || []
      }));
    }
    return FALLBACK_CHATS;
  }, [chats]);

  const stats = useMemo(() => {
    const totalSessions = allRecords === FALLBACK_CHATS ? 11 : allRecords.length;
    const totalMessages = allRecords === FALLBACK_CHATS
      ? 282
      : allRecords.reduce((acc, c) => acc + (c.msgCount || 0), 0);
    const pinnedCount = allRecords.filter((c) => c.isPinned).length;
    return { totalSessions, totalMessages, pinnedCount };
  }, [allRecords]);

  const filteredRecords = useMemo(() => {
    const baseTime = allRecords[0]?.updatedAt || 1793700000000;
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;

    return allRecords
      .filter((item) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          item.title.toLowerCase().includes(q) ||
          item.snippet.toLowerCase().includes(q);
        if (!matchesQuery) return false;

        const age = baseTime - (item.updatedAt || baseTime);
        if (dateFilter === 'today' && age > oneDay) return false;
        if (dateFilter === 'week' && age > sevenDays) return false;
        if (dateFilter === 'older' && age <= sevenDays) return false;

        if (statusFilter === 'completed' && item.status !== 'Completed') return false;
        if (statusFilter === 'error' && item.status !== 'Error') return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return (b.updatedAt || 0) - (a.updatedAt || 0);
        if (sortBy === 'oldest') return (a.updatedAt || 0) - (b.updatedAt || 0);
        if (sortBy === 'messages') return (b.msgCount || 0) - (a.msgCount || 0);
        return 0;
      });
  }, [allRecords, searchQuery, dateFilter, statusFilter, sortBy]);

  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
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

  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRecords, startIndex]);

  const handleStartNewChat = () => {
    const newId = createNewChat();
    navigate(`/${newId}`);
  };

  const handleOpenChat = (id) => {
    navigate(`/${id}`);
  };

  const handleExportAllJson = () => {
    const payload = JSON.stringify(chats.length > 0 ? chats : FALLBACK_CHATS, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `sumanai_conversations_export_${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = (item) => {
    const transcript = generateChatTranscript(item.title, item.messages || []);
    const blob = new Blob([transcript], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const cleanTitle = (item.title || 'conversation').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    anchor.download = `${cleanTitle}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    setActiveMenuId(null);
  };

  const handleCopyTranscript = (item) => {
    const transcript = generateChatTranscript(item.title, item.messages || []);
    navigator.clipboard.writeText(transcript);
    setActiveMenuId(null);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === paginatedRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedRecords.map((r) => r.id));
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const formatUpdated = (timestamp) => {
    if (!timestamp) return 'Nov 3, 03:48 PM';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'Nov 3, 03:48 PM';
    const now = new Date();
    const isSameDay = d.toDateString() === now.toDateString();
    if (isSameDay) {
      return (
        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
        ', ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="history-page-wrap">
      <header className="history-top-header">
        <div className="history-header-left">
          <div className="history-clock-badge">
            <Clock size={22} className="history-clock-icon" />
          </div>
          <div className="history-header-text">
            <h1 className="history-title">Conversation Archive</h1>
            <p className="history-subtitle">
              Inspect, filter, export, and manage your stored prompt sessions and assistant telemetry.
            </p>
          </div>
        </div>

        <div className="history-header-actions">
          <button
            type="button"
            className="history-action-btn-outline"
            onClick={syncChats}
            disabled={isSyncing}
            title="Synchronize conversations"
          >
            <RefreshCw size={14} className={isSyncing ? 'history-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>

          <button
            type="button"
            className="history-action-btn-outline"
            onClick={handleExportAllJson}
            title="Export all conversations"
          >
            <Download size={14} />
            <span>Export Archive</span>
          </button>

          <button
            type="button"
            className="history-btn-new-chat"
            onClick={handleStartNewChat}
          >
            <Plus size={15} />
            <span>New Chat</span>
          </button>
        </div>
      </header>

      <section className="history-metrics-grid">
        <div className="history-metric-card">
          <div className="metric-icon-box purple">
            <MessageSquare size={20} />
          </div>
          <div className="metric-texts">
            <span className="metric-number">{stats.totalSessions}</span>
            <span className="metric-label">Total Sessions</span>
          </div>
          <div className="metric-corner-icon" aria-hidden="true">
            <MessageSquare size={46} strokeWidth={1.5} />
          </div>
        </div>

        <div className="history-metric-card">
          <div className="metric-icon-box blue">
            <MessagesSquare size={20} />
          </div>
          <div className="metric-texts">
            <span className="metric-number">{stats.totalMessages}</span>
            <span className="metric-label">Total Messages</span>
          </div>
          <div className="metric-corner-icon" aria-hidden="true">
            <MessagesSquare size={46} strokeWidth={1.5} />
          </div>
        </div>

        <div className="history-metric-card">
          <div className="metric-icon-box purple">
            <Bookmark size={20} />
          </div>
          <div className="metric-texts">
            <span className="metric-number">{stats.pinnedCount}</span>
            <span className="metric-label">Pinned Records</span>
          </div>
          <div className="metric-corner-icon" aria-hidden="true">
            <Bookmark size={46} strokeWidth={1.5} />
          </div>
        </div>
      </section>

      <section className="history-toolbar-row">
        <div className="history-search-box">
          <Search size={15} className="history-search-icon" />
          <input
            type="text"
            className="history-search-input"
            placeholder="Search conversations, prompts, or responses..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="history-toolbar-filters" ref={toolbarFiltersRef}>
          <div className="history-filter-dropdown-wrap">
            <button
              type="button"
              className={`history-filter-btn ${activeDropdown === 'date' ? 'is-open' : ''}`}
              onClick={() => setActiveDropdown(activeDropdown === 'date' ? null : 'date')}
            >
              <Calendar size={13} className="select-lead-icon" />
              <span className="history-filter-label">
                {DATE_OPTIONS.find((o) => o.value === dateFilter)?.label || 'Any Date'}
              </span>
              <ChevronDown size={12} className={`select-arrow-icon ${activeDropdown === 'date' ? 'rotate' : ''}`} />
            </button>
            {activeDropdown === 'date' && (
              <div className="history-custom-dropdown-menu">
                {DATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`history-dropdown-opt ${dateFilter === opt.value ? 'selected' : ''}`}
                    onClick={() => {
                      setDateFilter(opt.value);
                      setCurrentPage(1);
                      setActiveDropdown(null);
                    }}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="history-filter-dropdown-wrap">
            <button
              type="button"
              className={`history-filter-btn ${activeDropdown === 'status' ? 'is-open' : ''}`}
              onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
            >
              <Filter size={13} className="select-lead-icon" />
              <span className="history-filter-label">
                {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label || 'All Status'}
              </span>
              <ChevronDown size={12} className={`select-arrow-icon ${activeDropdown === 'status' ? 'rotate' : ''}`} />
            </button>
            {activeDropdown === 'status' && (
              <div className="history-custom-dropdown-menu">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`history-dropdown-opt ${statusFilter === opt.value ? 'selected' : ''}`}
                    onClick={() => {
                      setStatusFilter(opt.value);
                      setCurrentPage(1);
                      setActiveDropdown(null);
                    }}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="history-filter-dropdown-wrap">
            <button
              type="button"
              className={`history-filter-btn ${activeDropdown === 'sort' ? 'is-open' : ''}`}
              onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
            >
              <ArrowUpDown size={13} className="select-lead-icon" />
              <span className="history-filter-label">
                {SORT_OPTIONS.find((o) => o.value === sortBy)?.label || 'Newest First'}
              </span>
              <ChevronDown size={12} className={`select-arrow-icon ${activeDropdown === 'sort' ? 'rotate' : ''}`} />
            </button>
            {activeDropdown === 'sort' && (
              <div className="history-custom-dropdown-menu">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`history-dropdown-opt ${sortBy === opt.value ? 'selected' : ''}`}
                    onClick={() => {
                      setSortBy(opt.value);
                      setCurrentPage(1);
                      setActiveDropdown(null);
                    }}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="history-view-toggles">
            <button
              type="button"
              className={`history-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <Menu size={15} />
            </button>
            <button
              type="button"
              className={`history-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </section>

      <main className="history-table-card">
        {filteredRecords.length === 0 ? (
          <div className="history-empty-view">
            <MessageSquare size={36} className="empty-icon" />
            <h4>No conversations found</h4>
            <p>Try adjusting your search keywords or relaxing active filters.</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th className="th-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginatedRecords.length && paginatedRecords.length > 0}
                      onChange={handleToggleSelectAll}
                    />
                  </th>
                  <th>
                    <div className="th-sort-label">
                      <span>CONVERSATION</span>
                      <ArrowUpDown size={11} className="th-sort-icon" />
                    </div>
                  </th>
                  <th>TYPE</th>
                  <th>MESSAGES</th>
                  <th>
                    <div className="th-sort-label">
                      <span>UPDATED</span>
                      <ArrowUpDown size={11} className="th-sort-icon" />
                    </div>
                  </th>
                  <th>STATUS</th>
                  <th className="th-actions">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isImage = item.type === 'Image';
                  const isVideo = item.type === 'Video';
                  const isCode = item.type === 'Code';
                  const isCompleted = item.status === 'Completed';

                  return (
                    <tr key={item.id} className={isSelected ? 'row-selected' : ''}>
                      <td className="td-checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(item.id)}
                        />
                      </td>

                      <td className="td-conversation">
                        <div
                          className="conversation-cell"
                          onClick={() => handleOpenChat(item.id)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className={`conv-icon-box ${item.type.toLowerCase()}`}>
                            {isImage ? (
                              <ImageIcon size={16} />
                            ) : isVideo ? (
                              <Video size={16} />
                            ) : isCode ? (
                              <Code2 size={16} />
                            ) : (
                              <MessageSquare size={16} />
                            )}
                          </div>
                          <div className="conv-texts">
                            <span className="conv-title" title={item.title}>
                              {item.title}
                            </span>
                            <span className="conv-snippet" title={item.snippet}>
                              {item.snippet}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="td-type">
                        <span className={`conv-type-badge ${item.type.toLowerCase()}`}>
                          {item.type}
                        </span>
                      </td>

                      <td className="td-messages">
                        <div className="messages-cell">
                          <MessageSquare size={13} className="cell-msg-icon" />
                          <span>{item.msgCount}</span>
                        </div>
                      </td>

                      <td className="td-updated">
                        <span className="updated-text">{formatUpdated(item.updatedAt)}</span>
                      </td>

                      <td className="td-status">
                        {isCompleted ? (
                          <span className="status-badge completed">
                            <CheckCircle2 size={11} />
                            <span>Completed</span>
                          </span>
                        ) : (
                          <span className="status-badge error">
                            <XCircle size={11} />
                            <span>Error</span>
                          </span>
                        )}
                      </td>

                      <td className="td-actions">
                        <div className="row-actions-group">
                          <button
                            type="button"
                            className={`row-action-btn ${item.isPinned ? 'is-pinned' : ''}`}
                            onClick={() => togglePinChat(item.id)}
                            title={item.isPinned ? 'Unpin' : 'Pin'}
                          >
                            <Pin size={14} />
                          </button>
                          <button
                            type="button"
                            className="row-action-btn"
                            onClick={() => handleOpenChat(item.id)}
                            title="Open conversation"
                          >
                            <ExternalLink size={14} />
                          </button>
                          <div className="more-menu-container" ref={activeMenuId === item.id ? menuRef : null}>
                            <button
                              type="button"
                              className="row-action-btn"
                              onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                              title="More options"
                            >
                              <MoreHorizontal size={14} />
                            </button>
                            {activeMenuId === item.id && (
                              <div className="history-more-dropdown">
                                <button
                                  type="button"
                                  className="dropdown-item"
                                  onClick={() => {
                                    setRenameTarget({ id: item.id, title: item.title });
                                    setActiveMenuId(null);
                                  }}
                                >
                                  <Edit2 size={13} />
                                  <span>Rename</span>
                                </button>
                                <button
                                  type="button"
                                  className="dropdown-item"
                                  onClick={() => handleCopyTranscript(item)}
                                >
                                  <Copy size={13} />
                                  <span>Copy Transcript</span>
                                </button>
                                <button
                                  type="button"
                                  className="dropdown-item"
                                  onClick={() => handleExportMarkdown(item)}
                                >
                                  <Download size={13} />
                                  <span>Export Markdown</span>
                                </button>
                                <button
                                  type="button"
                                  className="dropdown-item item-danger"
                                  onClick={() => {
                                    setDeleteTargetId(item.id);
                                    setActiveMenuId(null);
                                  }}
                                >
                                  <Trash2 size={13} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="history-grid-wrapper">
            {paginatedRecords.map((item) => (
              <div key={item.id} className="history-grid-card" onClick={() => handleOpenChat(item.id)}>
                <div className="grid-card-head">
                  <span className={`conv-type-badge ${item.type.toLowerCase()}`}>{item.type}</span>
                  <span className={`status-badge ${item.status.toLowerCase()}`}>{item.status}</span>
                </div>
                <h3 className="grid-card-title">{item.title}</h3>
                <p className="grid-card-snippet">{item.snippet}</p>
                <div className="grid-card-footer">
                  <span className="grid-card-meta">{formatUpdated(item.updatedAt)}</span>
                  <span className="grid-card-count">{item.msgCount} msgs</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="history-pagination-bar">
          <span className="pagination-info">
            Showing <span className="pagination-highlight">{paginatedRecords.length > 0 ? startIndex + 1 : 0}–{startIndex + paginatedRecords.length}</span> of <span className="pagination-highlight">{totalItems}</span> conversations
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

      {renameTarget && (
        <RenameModal
          isOpen={Boolean(renameTarget)}
          currentTitle={renameTarget.title}
          onClose={() => setRenameTarget(null)}
          onSave={(newTitle) => {
            renameChat(renameTarget.id, newTitle);
            setRenameTarget(null);
          }}
        />
      )}

      {deleteTargetId && (
        <div className="history-modal-overlay" onClick={() => setDeleteTargetId(null)}>
          <div className="history-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="history-confirm-icon">
              <AlertCircle size={22} />
            </div>
            <h3 className="history-confirm-title">Delete Conversation</h3>
            <p className="history-confirm-text">
              This action permanently deletes this conversation thread and its associated message history from local and cloud storage.
            </p>
            <div className="history-confirm-actions">
              <button
                type="button"
                className="history-action-btn-outline"
                onClick={() => setDeleteTargetId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="history-btn-danger"
                onClick={() => {
                  deleteChat(deleteTargetId);
                  setDeleteTargetId(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmClearOpen && (
        <div className="history-modal-overlay" onClick={() => setConfirmClearOpen(false)}>
          <div className="history-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="history-confirm-icon">
              <AlertCircle size={22} />
            </div>
            <h3 className="history-confirm-title">Clear Complete Archive</h3>
            <p className="history-confirm-text">
              Are you sure you want to delete all {chats.length} conversations? This cannot be undone once executed.
            </p>
            <div className="history-confirm-actions">
              <button
                type="button"
                className="history-action-btn-outline"
                onClick={() => setConfirmClearOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="history-btn-danger"
                onClick={() => {
                  clearAll();
                  setConfirmClearOpen(false);
                }}
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;