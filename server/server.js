/**
 * Real-Time Collaborative Editor - Backend Server
 * Node.js + Express + Socket.io + MongoDB
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// ─── App Setup ───────────────────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',  // In production: set to your frontend URL
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// ─── MongoDB Connection ───────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/collab_editor';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.warn('⚠️  MongoDB not connected (running in memory mode):', err.message));

// ─── Document Schema ──────────────────────────────────────────────────────────
const documentSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    title: { type: String, default: 'Untitled Document' },
    content: { type: String, default: '' },
    language: { type: String, default: 'text' },
    lastModified: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Document = mongoose.model('Document', documentSchema);

// ─── In-Memory Fallback (when MongoDB is not available) ──────────────────────
const memoryStore = new Map(); // docId -> { title, content, language }

async function getDocument(docId) {
  try {
    if (mongoose.connection.readyState === 1) {
      let doc = await Document.findById(docId);
      if (!doc) {
        doc = await Document.create({ _id: docId });
      }
      return { title: doc.title, content: doc.content, language: doc.language };
    }
  } catch (e) { /* fall through to memory */ }

  if (!memoryStore.has(docId)) {
    memoryStore.set(docId, { title: 'Untitled Document', content: '', language: 'text' });
  }
  return memoryStore.get(docId);
}

async function saveDocument(docId, data) {
  try {
    if (mongoose.connection.readyState === 1) {
      await Document.findByIdAndUpdate(
        docId,
        { ...data, lastModified: Date.now() },
        { upsert: true, new: true }
      );
      return;
    }
  } catch (e) { /* fall through */ }

  memoryStore.set(docId, { ...(memoryStore.get(docId) || {}), ...data });
}

// ─── Active Users Tracker ─────────────────────────────────────────────────────
// Map: docId -> Map(socketId -> { name, color, cursor })
const activeUsers = new Map();

function getUsersInDoc(docId) {
  if (!activeUsers.has(docId)) return [];
  return Array.from(activeUsers.get(docId).values());
}

// Random color palette for user avatars
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#82E0AA', '#F0B27A',
];

function getRandomColor() {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

// ─── REST API Routes ──────────────────────────────────────────────────────────

// Create a new document (returns a fresh ID)
app.post('/api/documents', async (req, res) => {
  const docId = uuidv4();
  await saveDocument(docId, { title: 'Untitled Document', content: '', language: 'text' });
  res.json({ docId });
});

// Get document metadata
app.get('/api/documents/:docId', async (req, res) => {
  const doc = await getDocument(req.params.docId);
  res.json({ ...doc, docId: req.params.docId });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'memory',
    timestamp: new Date().toISOString(),
  });
});

// ─── Socket.io Event Handlers ─────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);

  let currentDocId = null;
  let currentUser = null;

  // ── Join Document Room ──────────────────────────────────────────────────────
  socket.on('join-document', async ({ docId, userName }) => {
    // Leave previous room if any
    if (currentDocId) {
      socket.leave(currentDocId);
      if (activeUsers.has(currentDocId)) {
        activeUsers.get(currentDocId).delete(socket.id);
        io.to(currentDocId).emit('users-update', getUsersInDoc(currentDocId));
      }
    }

    currentDocId = docId;
    socket.join(docId);

    // Register user
    currentUser = {
      id: socket.id,
      name: userName || `User ${Math.floor(Math.random() * 1000)}`,
      color: getRandomColor(),
      cursor: null,
    };

    if (!activeUsers.has(docId)) {
      activeUsers.set(docId, new Map());
    }
    activeUsers.get(docId).set(socket.id, currentUser);

    // Send current document state to the joining user
    const doc = await getDocument(docId);
    socket.emit('load-document', { ...doc, users: getUsersInDoc(docId) });

    // Notify others in room
    socket.to(docId).emit('user-joined', {
      user: currentUser,
      message: `${currentUser.name} joined the document`,
    });

    // Broadcast updated user list to everyone in room
    io.to(docId).emit('users-update', getUsersInDoc(docId));

    console.log(`📄 ${currentUser.name} joined document: ${docId}`);
  });

  // ── Content Change ──────────────────────────────────────────────────────────
  socket.on('send-changes', async ({ docId, content, delta }) => {
    // Broadcast to all OTHER clients in the same document room
    socket.to(docId).emit('receive-changes', { content, delta, senderId: socket.id });
  });

  // ── Title Change ────────────────────────────────────────────────────────────
  socket.on('title-change', ({ docId, title }) => {
    socket.to(docId).emit('title-update', { title, senderId: socket.id });
    saveDocument(docId, { title }); // persist immediately
  });

  // ── Language Change ─────────────────────────────────────────────────────────
  socket.on('language-change', ({ docId, language }) => {
    socket.to(docId).emit('language-update', { language });
    saveDocument(docId, { language });
  });

  // ── Auto-Save Trigger (from client) ─────────────────────────────────────────
  socket.on('save-document', async ({ docId, content, title, language }) => {
    await saveDocument(docId, { content, title, language });
    socket.emit('document-saved', { timestamp: new Date().toISOString() });
  });

  // ── Cursor Position ──────────────────────────────────────────────────────────
  socket.on('cursor-move', ({ docId, position }) => {
    if (activeUsers.has(docId) && activeUsers.get(docId).has(socket.id)) {
      activeUsers.get(docId).get(socket.id).cursor = position;
    }
    socket.to(docId).emit('cursor-update', {
      userId: socket.id,
      position,
      user: currentUser,
    });
  });

  // ── Typing Indicator ─────────────────────────────────────────────────────────
  socket.on('typing', ({ docId, isTyping }) => {
    socket.to(docId).emit('user-typing', {
      userId: socket.id,
      userName: currentUser?.name,
      isTyping,
    });
  });

  // ── Disconnect ───────────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    console.log(`❌ Disconnected: ${socket.id} (${currentUser?.name || 'unknown'})`);

    if (currentDocId && activeUsers.has(currentDocId)) {
      activeUsers.get(currentDocId).delete(socket.id);

      io.to(currentDocId).emit('user-left', {
        userId: socket.id,
        user: currentUser,
        message: currentUser ? `${currentUser.name} left the document` : 'A user left',
      });

      io.to(currentDocId).emit('users-update', getUsersInDoc(currentDocId));

      // Clean up empty rooms
      if (activeUsers.get(currentDocId).size === 0) {
        activeUsers.delete(currentDocId);
      }
    }
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready for connections\n`);
});
