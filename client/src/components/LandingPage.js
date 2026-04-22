/**
 * LandingPage.js
 * Entry screen. Users set their name and either create a new doc
 * or join an existing one by pasting a Doc ID.
 */

import React, { useState } from 'react';

export default function LandingPage({ prefilledDocId, onJoin, onNewDocument }) {
  const [name, setName] = useState('');
  const [docIdInput, setDocIdInput] = useState(prefilledDocId || '');
  const [tab, setTab] = useState(prefilledDocId ? 'join' : 'new'); // 'new' | 'join'
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name to continue.');
      return;
    }
    setError('');

    if (tab === 'new') {
      onNewDocument({ name: name.trim() });
    } else {
      if (!docIdInput.trim()) {
        setError('Please enter a valid Document ID.');
        return;
      }
      onJoin({ name: name.trim(), existingDocId: docIdInput.trim() });
    }
  };

  return (
    <div className="landing-root">
      <div className="landing-bg-grid" />
      <div className="landing-glow" />

      <div className="landing-card">
        {/* Logo / Title */}
        <div className="landing-logo">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="var(--accent)" />
            <path d="M10 12h16M10 18h10M10 24h13" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="28" cy="24" r="5" fill="var(--accent-2)" />
            <path d="M26 24l1.5 1.5L30 22" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="landing-logo-text">Collab<span>Edit</span></span>
        </div>

        <h1 className="landing-title">Real-time collaborative editing</h1>
        <p className="landing-subtitle">Write together, instantly. No refresh. No lag.</p>

        {/* Tab Switcher */}
        <div className="tab-switcher">
          <button
            className={`tab-btn ${tab === 'new' ? 'active' : ''}`}
            onClick={() => setTab('new')}
            type="button"
          >
            New Document
          </button>
          <button
            className={`tab-btn ${tab === 'join' ? 'active' : ''}`}
            onClick={() => setTab('join')}
            type="button"
          >
            Join Existing
          </button>
        </div>

        <form onSubmit={handleSubmit} className="landing-form">
          <div className="form-group">
            <label htmlFor="name">Your Display Name</label>
            <input
              id="name"
              type="text"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              maxLength={30}
            />
          </div>

          {tab === 'join' && (
            <div className="form-group">
              <label htmlFor="docId">Document ID</label>
              <input
                id="docId"
                type="text"
                placeholder="Paste the document ID here"
                value={docIdInput}
                onChange={(e) => setDocIdInput(e.target.value)}
              />
              <span className="form-hint">Ask your collaborator to share their Document ID</span>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="cta-btn">
            {tab === 'new' ? '✦ Create New Document' : '→ Join Document'}
          </button>
        </form>

        <div className="landing-features">
          <div className="feature-pill">⚡ Real-time sync</div>
          <div className="feature-pill">👥 Multi-user</div>
          <div className="feature-pill">💾 Auto-save</div>
          <div className="feature-pill">🔗 Shareable links</div>
        </div>
      </div>
    </div>
  );
}
