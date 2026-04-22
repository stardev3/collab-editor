/**
 * App.js
 * Root component — handles routing between the landing page and editor.
 * Uses URL hash (#docId) for shareable document links.
 */

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import LandingPage from './components/LandingPage';
import Editor from './components/Editor';
import './App.css';

function App() {
  const [docId, setDocId] = useState(null);
  const [userName, setUserName] = useState('');
  const [isEntered, setIsEntered] = useState(false);

  // Check URL for existing document ID on load
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash.length > 10) {
      setDocId(hash);
    }
  }, []);

  const handleJoin = ({ name, existingDocId }) => {
    const resolvedDocId = existingDocId || docId || uuidv4();
    setUserName(name);
    setDocId(resolvedDocId);
    setIsEntered(true);
    // Update URL so the document can be shared
    window.location.hash = resolvedDocId;
  };

  const handleNewDocument = ({ name }) => {
    const newDocId = uuidv4();
    setUserName(name);
    setDocId(newDocId);
    setIsEntered(true);
    window.location.hash = newDocId;
  };

  const handleLeave = () => {
    setIsEntered(false);
    setDocId(null);
    window.location.hash = '';
  };

  if (!isEntered) {
    return (
      <LandingPage
        prefilledDocId={docId}
        onJoin={handleJoin}
        onNewDocument={handleNewDocument}
      />
    );
  }

  return (
    <Editor
      docId={docId}
      userName={userName}
      onLeave={handleLeave}
    />
  );
}

export default App;
