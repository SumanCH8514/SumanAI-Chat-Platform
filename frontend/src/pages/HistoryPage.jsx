import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Pin, Trash2, Edit2, MessageSquare, Download,
  Copy, ExternalLink, Calendar, Filter, RefreshCw, Plus,
  FileText, Check, AlertCircle, ArrowUpDown
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { generateChatTranscript } from '../utils/formatters';
import RenameModal from '../components/RenameModal';
import './HistoryPage.css';

const HistoryPage = () => {
  const navigate = useNavigate();
  const { chats, createNewChat, renameChat, togglePinChat, deleteChat, clearAll, isSyncing, syncChats } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [pinFilter, setPinFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [renameTarget, setRenameTarget] = useState(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [copiedChatId, setCopiedChatId] = useState(null);
  const [referenceTime] = useState(() => Date.now());

  const stats = useMemo(() => {
    const totalConversations = chats.length;
    const totalMessages = chats.reduce((acc, c) => acc + (c.messages?.length || 0), 0);
    const pinnedCount = chats.filter((c) => c.isPinned).length;
    return { totalConversations, totalMessages, pinnedCount };
  }, [chats]);

  const filteredChats = useMemo(() => {
    const now = referenceTime;
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;

    return chats.filter((chat) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        chat.title.toLowerCase().includes(q) ||
        chat.messages?.some((m) => (m.content || '').toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (pinFilter === 'pinned' && !chat.isPinned) return false;
      if (pinFilter === 'unpinned' && chat.isPinned) return false;

      const created = chat.createdAt || now;
      const age = now - created;

      if (dateFilter === 'today' && age > oneDay) return false;
      if (dateFilter === 'week' && age > sevenDays) return false;
      if (dateFilter === 'older' && age <= sevenDays) return false;

      return true;
    }).sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return b.isPinned ? 1 : -1;
      }
      if (sortBy === 'newest') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      if (sortBy === 'oldest') {
        return (a.createdAt || 0) - (b.createdAt || 0);
      }
      if (sortBy === 'messages') {
        return (b.messages?.length || 0) - (a.messages?.length || 0);
      }
      return 0;
    });
  }, [chats, searchQuery, dateFilter, pinFilter, sortBy, referenceTime]);

  const handleStartNewChat = () => {
    const newId = createNewChat();
    navigate(`/${newId}`);
  };

  const handleOpenChat = (id) => {
    navigate(`/${id}`);
  };

  const handleCopyTranscript = (chat) => {
    const transcript = generateChatTranscript(chat.title, chat.messages);
    navigator.clipboard.writeText(transcript).then(() => {
      setCopiedChatId(chat.id);
      setTimeout(() => setCopiedChatId(null), 2000);
    });
  };

  const handleExportMarkdown = (chat) => {
    const transcript = generateChatTranscript(chat.title, chat.messages);
    const blob = new Blob([transcript], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const cleanTitle = (chat.title || 'conversation').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    anchor.download = `${cleanTitle}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAllJson = () => {
    const payload = JSON.stringify(chats, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `sumanai_conversations_export_${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Recent';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="history-page">
      <header className="history-header">
        <div className="history-header-left">
          <div className="history-title-group">
            <h1 className="history-title">Conversation Archive</h1>
            <p className="history-subtitle">
              Inspect, filter, export, and manage your stored prompt sessions and assistant telemetry.
            </p>
          </div>
        </div>

        <div className="history-header-actions">
          <button
            type="button"
            className="history-btn-secondary"
            onClick={syncChats}
            disabled={isSyncing}
            title="Synchronize with cloud"
          >
            <RefreshCw size={14} className={isSyncing ? 'history-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>

          <button
            type="button"
            className="history-btn-secondary"
            onClick={handleExportAllJson}
            disabled={chats.length === 0}
            title="Download all chats in JSON format"
          >
            <Download size={14} />
            <span>Export Archive</span>
          </button>

          <button
            type="button"
            className="history-btn-primary"
            onClick={handleStartNewChat}
          >
            <Plus size={15} />
            <span>New Chat</span>
          </button>
        </div>
      </header>

      <section className="history-metrics-row">
        <div className="history-metric-card">
          <span className="history-metric-label">Total Sessions</span>
          <span className="history-metric-val">{stats.totalConversations}</span>
          <span className="history-metric-meta">Active chat threads</span>
        </div>
        <div className="history-metric-card">
          <span className="history-metric-label">Total Messages</span>
          <span className="history-metric-val">{stats.totalMessages}</span>
          <span className="history-metric-meta">Prompts & AI responses</span>
        </div>
        <div className="history-metric-card">
          <span className="history-metric-label">Pinned Records</span>
          <span className="history-metric-val">{stats.pinnedCount}</span>
          <span className="history-metric-meta">Saved for quick access</span>
        </div>
      </section>

      <section className="history-filter-bar">
        <div className="history-search-box">
          <Search size={15} className="history-search-icon" />
          <input
            type="text"
            className="history-search-input"
            placeholder="Search titles and prompt transcripts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="history-filters-group">
          <div className="history-select-wrap">
            <Calendar size={14} className="history-select-icon" />
            <select
              className="history-filter-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">Any Date</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="older">Older</option>
            </select>
          </div>

          <div className="history-select-wrap">
            <Filter size={14} className="history-select-icon" />
            <select
              className="history-filter-select"
              value={pinFilter}
              onChange={(e) => setPinFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pinned">Pinned Only</option>
              <option value="unpinned">Unpinned Only</option>
            </select>
          </div>

          <div className="history-select-wrap">
            <ArrowUpDown size={14} className="history-select-icon" />
            <select
              className="history-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="messages">Most Messages</option>
            </select>
          </div>

          {chats.length > 0 && (
            <button
              type="button"
              className="history-btn-danger"
              onClick={() => setConfirmClearOpen(true)}
              title="Delete all chat history"
            >
              <Trash2 size={13} />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </section>

      <main className="history-content">
        {filteredChats.length === 0 ? (
          <div className="history-empty-state">
            <div className="history-empty-icon-wrap">
              <FileText size={26} />
            </div>
            <h3 className="history-empty-title">
              {chats.length === 0 ? 'No conversations yet' : 'No matching sessions found'}
            </h3>
            <p className="history-empty-desc">
              {chats.length === 0
                ? 'Your conversation records will appear here as soon as you start chatting.'
                : 'Try adjusting your search query or relaxing your active filters to locate past chats.'}
            </p>
            {chats.length === 0 ? (
              <button
                type="button"
                className="history-btn-primary"
                onClick={handleStartNewChat}
              >
                <Plus size={14} />
                <span>Start First Conversation</span>
              </button>
            ) : (
              <button
                type="button"
                className="history-btn-secondary"
                onClick={() => {
                  setSearchQuery('');
                  setDateFilter('all');
                  setPinFilter('all');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="history-cards-grid">
            {filteredChats.map((chat) => {
              const msgCount = chat.messages?.length || 0;
              const latestMessage = chat.messages?.[chat.messages.length - 1];
              const snippet = latestMessage?.content || 'No text recorded in this session';

              return (
                <article key={chat.id} className={`history-card ${chat.isPinned ? 'is-pinned' : ''}`}>
                  <div className="history-card-header">
                    <div className="history-card-title-row">
                      {chat.isPinned && (
                        <span className="history-pinned-badge" title="Pinned conversation">
                          <Pin size={11} />
                        </span>
                      )}
                      <h2
                        className="history-card-title"
                        onClick={() => handleOpenChat(chat.id)}
                        title={chat.title}
                      >
                        {chat.title}
                      </h2>
                    </div>

                    <div className="history-card-top-actions">
                      <button
                        type="button"
                        className={`history-icon-btn ${chat.isPinned ? 'active-pin' : ''}`}
                        onClick={() => togglePinChat(chat.id)}
                        title={chat.isPinned ? 'Unpin thread' : 'Pin thread'}
                      >
                        <Pin size={13} />
                      </button>
                      <button
                        type="button"
                        className="history-icon-btn"
                        onClick={() => setRenameTarget({ id: chat.id, title: chat.title })}
                        title="Rename conversation"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="history-icon-btn danger"
                        onClick={() => setDeleteTargetId(chat.id)}
                        title="Delete conversation"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="history-card-snippet" onClick={() => handleOpenChat(chat.id)}>
                    {snippet}
                  </p>

                  <div className="history-card-footer">
                    <div className="history-card-meta">
                      <span className="history-meta-item">
                        <Calendar size={12} />
                        <span>{formatTimestamp(chat.createdAt)}</span>
                      </span>
                      <span className="history-meta-item">
                        <MessageSquare size={12} />
                        <span>{msgCount} {msgCount === 1 ? 'msg' : 'msgs'}</span>
                      </span>
                    </div>

                    <div className="history-card-quick-actions">
                      <button
                        type="button"
                        className="history-text-action"
                        onClick={() => handleCopyTranscript(chat)}
                        title="Copy conversation transcript"
                      >
                        {copiedChatId === chat.id ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedChatId === chat.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        className="history-text-action"
                        onClick={() => handleExportMarkdown(chat)}
                        title="Export as Markdown"
                      >
                        <Download size={12} />
                        <span>MD</span>
                      </button>

                      <button
                        type="button"
                        className="history-open-btn"
                        onClick={() => handleOpenChat(chat.id)}
                      >
                        <span>Open</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
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
                className="history-btn-secondary"
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
                className="history-btn-secondary"
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
