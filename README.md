# 🚀 CollabEdit — Real-Time Collaborative Editor

<div align="center">

![CollabEdit Banner](https://img.shields.io/badge/CollabEdit-Real--Time%20Collaboration-e8a838?style=for-the-badge&logo=googledocs&logoColor=white)

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.6.1-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

**A production-quality, real-time collaborative text and code editor.**
Multiple users can edit the same document simultaneously with changes appearing instantly — no page refresh required.

[Features](#-features) • [Demo](#-demo) • [Setup](#-setup) • [Architecture](#-architecture) • [API](#-api-reference) • [FAQ](#-faq)

</div>

---

## ✨ Features

- ⚡ **Real-time sync** — Changes broadcast to all users in under 20ms
- 👥 **Multi-user collaboration** — See who's online via colored avatars
- 💾 **Auto-save** — Document saved to MongoDB 2 seconds after typing stops
- 🔗 **Shareable links** — Every document has a unique URL-based room
- ✏️ **Typing indicator** — See when others are typing in real time
- 📝 **Rename documents** — Click the title to rename, synced instantly
- 🖥️ **10 language modes** — JavaScript, Python, HTML, CSS, Java, C++, SQL, JSON, Markdown, Plain Text
- 📊 **Word & character count** — Live stats in the toolbar
- 🔔 **Join/leave notifications** — Toast alerts when collaborators enter or leave
- 📱 **Responsive design** — Works on desktop and mobile
- 🌙 **Dark theme** — Easy on the eyes for long sessions
- 🗄️ **MongoDB persistence** — Documents survive server restarts
- 🧠 **Memory fallback** — Works without MongoDB for quick demos

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React App)                        │
│   LandingPage → Editor → useSocket Hook                     │
│                               │                             │
│                    Socket.io Client (WebSocket)             │
└───────────────────────────────┼─────────────────────────────┘
                                │  ws://localhost:3001
┌───────────────────────────────┼─────────────────────────────┐
│                   SERVER (Node.js)                          │
│   Express REST API    Socket.io Server                      │
│                      ┌────────────────────┐                │
│                      │ join-document      │                │
│                      │ send-changes       │                │
│                      │ title-change       │                │
│                      │ save-document      │                │
│                      │ typing / cursor    │                │
│                      └────────┬───────────┘                │
│                      ┌────────▼───────────┐                │
│                      │  MongoDB / Memory  │                │
│                      └────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 | Component-based UI, efficient re-renders |
| Styling | Custom CSS | Full design control, no build complexity |
| Real-time | Socket.io 4 | WebSocket abstraction, rooms, auto-reconnect |
| Backend | Node.js + Express | Non-blocking I/O, perfect for WebSockets |
| Database | MongoDB + Mongoose | Flexible document storage for variable text |
| IDs | UUID v4 | Collision-free unique document identifiers |

---

## 📁 Folder Structure

```
collab-editor/
├── README.md
├── server/
│   ├── server.js          ← Express + Socket.io (all backend logic)
│   └── package.json
└── client/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js              ← Root component, URL-hash routing
        ├── App.css             ← Complete design system (dark theme)
        ├── index.js            ← React entry point
        ├── components/
        │   ├── Editor.js       ← Main editor UI + collaboration logic
        │   ├── LandingPage.js  ← Entry screen (create/join document)
        │   ├── UserAvatar.js   ← Colored initials avatar
        │   └── Notification.js ← Toast notification component
        └── hooks/
            ├── useSocket.js    ← All Socket.io logic (custom hook)
            └── useAutoSave.js  ← Debounced auto-save (custom hook)
```

---

## ⚙️ Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) *(optional but recommended)*

### Step 1 — Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/collab-editor.git
cd collab-editor
```

### Step 2 — Install backend dependencies
```powershell
cd server
npm install
```

### Step 3 — Install frontend dependencies
```powershell
cd ../client
npm install
```

### Step 4 — Start the backend server
```powershell
cd ../server
npm run dev
```

Expected output:
```
✅ MongoDB connected
🚀 Server running on http://localhost:3001
📡 Socket.io ready for connections
```

### Step 5 — Start the frontend (new terminal)
```powershell
cd client
npm start
```

Opens automatically at **http://localhost:3000**

---

## 🔧 Environment Variables

**server/.env**
```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/collab_editor
```

**client/.env**
```env
REACT_APP_SERVER_URL=http://localhost:3001
```

---

## 📡 API Reference

### REST Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents` | Create a new document |
| `GET` | `/api/documents/:docId` | Get document content |
| `GET` | `/api/health` | Server health check |

### Socket.io Events — Client to Server

| Event | Payload | Description |
|---|---|---|
| `join-document` | `{ docId, userName }` | Join a document room |
| `send-changes` | `{ docId, content }` | Broadcast content update |
| `title-change` | `{ docId, title }` | Update document title |
| `save-document` | `{ docId, content, title, language }` | Trigger save |
| `typing` | `{ docId, isTyping }` | Send typing indicator |

### Socket.io Events — Server to Client

| Event | Payload | Description |
|---|---|---|
| `load-document` | `{ content, title, language, users }` | Initial document load |
| `receive-changes` | `{ content, senderId }` | Live content update |
| `users-update` | `[{ id, name, color }]` | Active users list |
| `user-joined` | `{ user, message }` | Someone joined |
| `user-left` | `{ user, message }` | Someone left |
| `document-saved` | `{ timestamp }` | Save confirmation |

---

## 🗄️ Database Schema

```javascript
Document {
  _id:          String,   // UUID — document ID, room name, URL hash
  title:        String,   // Document title
  content:      String,   // Full text/code content
  language:     String,   // Editor language mode
  lastModified: Date,
  createdAt:    Date,
  updatedAt:    Date
}
```

---

## 🔮 Future Improvements

| Feature | Description |
|---|---|
| Operational Transformation | Google Docs-style conflict resolution |
| Rich Text | Bold, italic, headers via TipTap/Quill |
| User Authentication | JWT login, per-user document list |
| Syntax Highlighting | Monaco Editor / CodeMirror 6 |
| Version History | Snapshot and rollback support |
| Export | Download as .txt, .md, .pdf |

---

## 🙋 FAQ

**Q: Does it work without MongoDB?**
Yes — the server automatically falls back to in-memory storage. All real-time features work identically, documents just won't persist after server restart.

**Q: How do I share a document?**
Click the **Share** button in the editor header — it copies the full URL to clipboard. Anyone who opens that URL can join the document.

**Q: What is the document ID?**
A UUID that serves triple duty — URL hash for sharing, Socket.io room name for isolation, and MongoDB `_id` for storage.

---

## 📝 License

This project is licensed under the MIT License.

---

## 👤 Author

**Vaibhavi**
- GitHub: [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)

---

<div align="center">
Made with ❤️ as a Final Year Engineering Project

⭐ Star this repo if you found it helpful!
</div>
