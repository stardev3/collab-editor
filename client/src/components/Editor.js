/**
 * Editor.js
 * The main collaborative editor component. Handles the full editing UI,
 * real-time sync via Socket.io, and auto-save logic.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAutoSave } from '../hooks/useAutoSave';
import UserAvatar from './UserAvatar';
import Notification from './Notification';

const LANGUAGE_OPTIONS = [
  { value: 'text', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
];

export default function Editor({ docId, userName, onLeave }) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled Document');
  const [language, setLanguage] = useState('text');
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [typingUsers, setTypingUsers] = useState({});
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const textareaRef = useRef(null);
  const isRemoteChange = useRef(false);
  const typingTimerRef = useRef(null);
  const notifIdRef = useRef(0);

  // ── Notification Helper ───────────────────────────────────────────────────
  const pushNotification = useCallback((message, type = 'info') => {
    const id = ++notifIdRef.current;
    setNotifications((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  // ── Socket Callbacks ──────────────────────────────────────────────────────
  const handleLoadDocument = useCallback(({ content: c, title: t, language: l }) => {
    isRemoteChange.current = true;
    setContent(c || '');
    setTitle(t || 'Untitled Document');
    setLanguage(l || 'text');
    setTimeout(() => { isRemoteChange.current = false; }, 50);
  }, []);

  const handleReceiveChanges = useCallback(({ content: c }) => {
    isRemoteChange.current = true;
    setContent(c);
    setTimeout(() => { isRemoteChange.current = false; }, 50);
  }, []);

  const handleTitleUpdate = useCallback(({ title: t }) => {
    setTitle(t);
  }, []);

  const handleLanguageUpdate = useCallback(({ language: l }) => {
    setLanguage(l);
  }, []);

  const handleUsersUpdate = useCallback((updatedUsers) => {
    setUsers(updatedUsers);
  }, []);

  const handleUserJoined = useCallback(({ message }) => {
    pushNotification(message, 'join');
  }, [pushNotification]);

  const handleUserLeft = useCallback(({ message }) => {
    pushNotification(message, 'leave');
  }, [pushNotification]);

  const handleUserTyping = useCallback(({ userId, userName: uName, isTyping }) => {
    setTypingUsers((prev) => {
      const next = { ...prev };
      if (isTyping) next[userId] = uName;
      else delete next[userId];
      return next;
    });
  }, []);

  const handleSaved = useCallback(() => {
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, []);

  const {
    isConnected,
    sendChanges,
    sendTitleChange,
    sendLanguageChange,
    saveDocument,
    sendTyping,
  } = useSocket({
    docId,
    userName,
    onLoadDocument: handleLoadDocument,
    onReceiveChanges: handleReceiveChanges,
    onTitleUpdate: handleTitleUpdate,
    onLanguageUpdate: handleLanguageUpdate,
    onUsersUpdate: handleUsersUpdate,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
    onUserTyping: handleUserTyping,
    onSaved: handleSaved,
  });

  // ── Auto-Save ─────────────────────────────────────────────────────────────
  const handleAutoSave = useCallback((data) => {
    setSaveStatus('saving');
    saveDocument(data);
  }, [saveDocument]);

  useAutoSave({ content, title, language, onSave: handleAutoSave });

  // ── Word / Char Count ─────────────────────────────────────────────────────
  useEffect(() => {
    setCharCount(content.length);
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [content]);

  // ── Content Change ────────────────────────────────────────────────────────
  const handleContentChange = (e) => {
    if (isRemoteChange.current) return;
    const newContent = e.target.value;
    setContent(newContent);
    sendChanges(newContent);

    // Typing indicator
    sendTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => sendTyping(false), 1000);
  };

  // ── Title Change ──────────────────────────────────────────────────────────
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    sendTitleChange(e.target.value);
  };

  // ── Language Change ───────────────────────────────────────────────────────
  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    sendLanguageChange(lang);
    saveDocument({ content, title, language: lang });
  };

  // ── Copy Doc ID ───────────────────────────────────────────────────────────
  const copyDocId = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      pushNotification('Document link copied to clipboard!', 'success');
    });
  };

  // ── Typing users banner ───────────────────────────────────────────────────
  const typingList = Object.values(typingUsers);
  const typingLabel = typingList.length === 1
    ? `${typingList[0]} is typing…`
    : typingList.length > 1
      ? `${typingList.slice(0, -1).join(', ')} and ${typingList[typingList.length - 1]} are typing…`
      : null;

  // ── Tab key in textarea ───────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);
      sendChanges(newContent);
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="editor-root">
      {/* ── Notifications ── */}
      <div className="notifications-stack">
        {notifications.map((n) => (
          <Notification key={n.id} message={n.message} type={n.type} />
        ))}
      </div>

      {/* ── Header ── */}
      <header className="editor-header">
        <div className="header-left">
          <button className="logo-btn" onClick={onLeave} title="Back to home">
            <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="var(--accent)" />
              <path d="M10 12h16M10 18h10M10 24h13" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>

          {isEditingTitle ? (
            <input
              className="title-input"
              value={title}
              onChange={handleTitleChange}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              autoFocus
              maxLength={80}
            />
          ) : (
            <h1 className="doc-title" onClick={() => setIsEditingTitle(true)} title="Click to rename">
              {title}
              <span className="edit-hint">✎</span>
            </h1>
          )}
        </div>

        <div className="header-center">
          <div className={`connection-badge ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot" />
            {isConnected ? 'Live' : 'Offline'}
          </div>
        </div>

        <div className="header-right">
          {/* Active users */}
          <div className="users-row">
            {users.slice(0, 5).map((u) => (
              <UserAvatar key={u.id} name={u.name} color={u.color} />
            ))}
            {users.length > 5 && (
              <div className="avatar-overflow">+{users.length - 5}</div>
            )}
          </div>

          {/* Save status */}
          <span className={`save-status ${saveStatus}`}>
            {saveStatus === 'saving' && '⟳ Saving…'}
            {saveStatus === 'saved' && '✓ Saved'}
          </span>

          {/* Share button */}
          <button className="share-btn" onClick={copyDocId} title="Copy shareable link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            Share
          </button>
        </div>
      </header>

      {/* ── Toolbar ── */}
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <span className="doc-id-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
            <span className="doc-id-text">{docId?.slice(0, 8)}…</span>
          </span>

          <select
            className="language-select"
            value={language}
            onChange={handleLanguageChange}
            title="Select language mode"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="toolbar-right">
          <span className="stats-label">{wordCount} words · {charCount} chars</span>
        </div>
      </div>

      {/* ── Typing Indicator ── */}
      {typingLabel && (
        <div className="typing-indicator">
          <span className="typing-dots">
            <span /><span /><span />
          </span>
          {typingLabel}
        </div>
      )}

      {/* ── Editor Area ── */}
      <main className="editor-main">
        <div className="editor-paper">
          <textarea
            ref={textareaRef}
            className={`editor-textarea ${language !== 'text' ? 'code-mode' : ''}`}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={
              language === 'text'
                ? 'Start writing here… Your changes are synced in real time with all collaborators.'
                : `// Start coding in ${LANGUAGE_OPTIONS.find(o => o.value === language)?.label || language}…`
            }
            spellCheck={language === 'text'}
          />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="editor-footer">
        <span>You are editing as <strong>{userName}</strong></span>
        <span>{users.length} user{users.length !== 1 ? 's' : ''} online</span>
      </footer>
    </div>
  );
}
