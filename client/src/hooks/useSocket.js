/**
 * useSocket.js
 * Custom React hook that manages the Socket.io connection and
 * all real-time communication with the server.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

export function useSocket({
  docId,
  userName,
  onLoadDocument,
  onReceiveChanges,
  onTitleUpdate,
  onLanguageUpdate,
  onUsersUpdate,
  onUserJoined,
  onUserLeft,
  onUserTyping,
  onCursorUpdate,
  onSaved,
}) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // ── Initialize Socket Connection ─────────────────────────────────────────
  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log('✅ Socket connected:', socket.id);

      // Join the document room once connected
      if (docId) {
        socket.emit('join-document', { docId, userName });
      }
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      setConnectionError(err.message);
      console.error('Socket connection error:', err);
    });

    // ── Document Events ────────────────────────────────────────────────────
    socket.on('load-document', (data) => onLoadDocument?.(data));
    socket.on('receive-changes', (data) => onReceiveChanges?.(data));
    socket.on('title-update', (data) => onTitleUpdate?.(data));
    socket.on('language-update', (data) => onLanguageUpdate?.(data));
    socket.on('document-saved', (data) => onSaved?.(data));

    // ── User Events ────────────────────────────────────────────────────────
    socket.on('users-update', (users) => onUsersUpdate?.(users));
    socket.on('user-joined', (data) => onUserJoined?.(data));
    socket.on('user-left', (data) => onUserLeft?.(data));
    socket.on('user-typing', (data) => onUserTyping?.(data));
    socket.on('cursor-update', (data) => onCursorUpdate?.(data));

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [docId, userName]);

  // ── Emit Helpers ─────────────────────────────────────────────────────────
  const sendChanges = useCallback((content) => {
    socketRef.current?.emit('send-changes', { docId, content });
  }, [docId]);

  const sendTitleChange = useCallback((title) => {
    socketRef.current?.emit('title-change', { docId, title });
  }, [docId]);

  const sendLanguageChange = useCallback((language) => {
    socketRef.current?.emit('language-change', { docId, language });
  }, [docId]);

  const saveDocument = useCallback((data) => {
    socketRef.current?.emit('save-document', { docId, ...data });
  }, [docId]);

  const sendCursorMove = useCallback((position) => {
    socketRef.current?.emit('cursor-move', { docId, position });
  }, [docId]);

  const sendTyping = useCallback((isTyping) => {
    socketRef.current?.emit('typing', { docId, isTyping });
  }, [docId]);

  return {
    isConnected,
    connectionError,
    socketId: socketRef.current?.id,
    sendChanges,
    sendTitleChange,
    sendLanguageChange,
    saveDocument,
    sendCursorMove,
    sendTyping,
  };
}
