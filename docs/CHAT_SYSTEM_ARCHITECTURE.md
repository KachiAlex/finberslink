# Chat System Architecture - Facebook Messenger Style

## Overview
A unified messaging platform supporting:
- **Direct Messages (1:1)** - Private conversations between users
- **Group Chats** - Multiple participants in a single conversation
- **Course Channels** - Team/course-based messaging (separate from DM/Groups)
- **Real-time Indicators** - Typing, online status, read receipts

---

## Route Structure

```
/chat
├── page.tsx                          # Main chat hub (redirect logic)
├── layout.tsx                        # Shared chat layout
├── conversations/
│   ├── page.tsx                      # Conversations list (DM + Groups)
│   ├── [conversationId]/
│   │   ├── page.tsx                  # Individual conversation view
│   │   └── layout.tsx                # Conversation-specific layout
├── direct/
│   ├── page.tsx                      # Start new DM
│   └── [userId]/page.tsx             # DM with specific user
├── groups/
│   ├── page.tsx                      # Create/browse groups
│   └── [groupId]/
│       ├── page.tsx                  # Group chat view
│       ├── settings/page.tsx         # Group settings
│       └── members/page.tsx          # Manage members
├── courses/
│   └── [courseId]/
│       ├── [channelId]/page.tsx      # Course channel chat
└── api/
    ├── conversations/route.ts        # List, create conversations
    ├── messages/route.ts             # Send, list messages
    ├── groups/route.ts               # Create, manage groups
    ├── direct/route.ts               # DM-specific endpoints
    ├── typing/route.ts               # Typing indicators
    └── read-receipts/route.ts        # Mark as read
```

---

## Data Models (Prisma Schema Additions)

### 1. **DirectMessage** (New - Separate from ChatThread)
```prisma
model DirectMessage {
  id           String   @id @default(cuid())
  conversationId String
  senderId     String
  content      String
  attachments  Json     @default("[]")
  mentions     Json     @default("[]")
  sentAt       DateTime @default(now())
  editedAt     DateTime?
  deletedAt    DateTime?
  
  conversation DirectConversation @relation(fields: [conversationId], references: [id])
  sender       User               @relation(fields: [senderId], references: [id])
  
  @@index([conversationId, sentAt])
}
```

### 2. **DirectConversation** (New - Replaces ChatThread DM type)
```prisma
model DirectConversation {
  id           String   @id @default(cuid())
  type         ConversationType @default(DIRECT) // DIRECT or GROUP
  name         String?          // For groups only
  groupIcon    String?          // For groups only
  createdById  String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  lastMessageAt DateTime?
  
  participants DirectConversationParticipant[]
  messages     DirectMessage[]
  
  @@index([createdAt])
  @@index([lastMessageAt])
}

enum ConversationType {
  DIRECT  // 1:1 DM
  GROUP   // 2+ participants
}
```

### 3. **DirectConversationParticipant** (New)
```prisma
model DirectConversationParticipant {
  id             String   @id @default(cuid())
  conversationId String
  userId         String
  joinedAt       DateTime @default(now())
  leftAt         DateTime?
  role           ParticipantRole @default(MEMBER) // ADMIN, MEMBER
  
  conversation   DirectConversation @relation(fields: [conversationId], references: [id])
  user           User               @relation(fields: [userId], references: [id])
  
  @@unique([conversationId, userId])
}

enum ParticipantRole {
  ADMIN
  MEMBER
}
```

### 4. **DirectMessageRead** (New - Read Receipts)
```prisma
model DirectMessageRead {
  id        String   @id @default(cuid())
  messageId String
  userId    String
  readAt    DateTime @default(now())
  
  message   DirectMessage @relation(fields: [messageId], references: [id])
  user      User          @relation(fields: [userId], references: [id])
  
  @@unique([messageId, userId])
}
```

### 5. **TypingIndicator** (New - Real-time Indicators)
```prisma
model TypingIndicator {
  id             String   @id @default(cuid())
  conversationId String
  userId         String
  expiresAt      DateTime // Auto-clear after 5 seconds
  
  user DirectConversation @relation(fields: [conversationId], references: [id])
  
  // Note: This should be cached in Redis, not persisted DB
}
```

---

## Component Structure

### **Main Layout Components**

```
src/features/chat/
├── components/
│   ├── chat-layout.tsx                    # Main 3-pane layout
│   ├── conversation-sidebar/
│   │   ├── index.tsx                      # Sidebar container
│   │   ├── search-input.tsx               # Search conversations
│   │   ├── conversation-list.tsx          # List of DM + Groups
│   │   ├── conversation-item.tsx          # Single conversation preview
│   │   └── new-conversation-button.tsx    # Start DM or group
│   ├── chat-area/
│   │   ├── index.tsx                      # Main chat view
│   │   ├── message-list.tsx               # Messages with pagination
│   │   ├── message-item.tsx               # Single message (with avatar alignment)
│   │   ├── message-input.tsx              # Input field + attachments
│   │   ├── typing-indicator.tsx           # "User is typing..."
│   │   └── read-receipt-indicator.tsx     # "Seen" status
│   ├── user-avatar-bubble.tsx             # Float at bottom-right
│   ├── group-info-panel.tsx               # Group details/members
│   └── direct-message-modal.tsx           # Start new DM modal
├── hooks/
│   ├── useDirectConversations.ts
│   ├── useMessages.ts
│   ├── useSendMessage.ts
│   ├── useTypingIndicator.ts
│   ├── useReadReceipts.ts
│   └── useDirectConversationCreate.ts
├── service.ts                              # API service layer
└── types.ts                                # TypeScript types
```

---

## Feature List

### Phase 1 (MVP)
- [x] List conversations (DM + Groups)
- [x] View conversation messages
- [x] Send messages
- [x] Create new DM
- [ ] Create group chat
- [ ] Message input with emoji support
- [ ] Read receipts (simple - "Seen")
- [ ] Unread message count
- [ ] User avatars in messages

### Phase 2 (Enhanced)
- [ ] Typing indicators ("User is typing...")
- [ ] Online/offline status
- [ ] Edit messages
- [ ] Delete messages
- [ ] Message reactions (👍 ❤️ 😆 etc)
- [ ] Image/file attachments
- [ ] Message search
- [ ] Conversation search

### Phase 3 (Advanced)
- [ ] Voice messages
- [ ] Video call integration (via Twilio/Agora)
- [ ] Conversation pinning
- [ ] Archive conversations
- [ ] Mute notifications
- [ ] Message pins
- [ ] Thread replies (conversations within conversations)

---

## User Flow (Facebook Messenger Style)

```
1. User clicks "/chat" or Chat in nav
   ↓
2. Main Chat Layout appears:
   ┌─────────────────────────────────┐
   │ Sidebar                          │ Main Chat Area
   │ ┌──────────────────────────────┐│ ┌──────────────────────┐
   │ │ 📋 Conversations             ││ │ User Name / Group #   │
   │ │ [Search...] [+]  (new DM)    ││ │ ══════════════════════│
   │ │                              ││ │ Today 2:30 PM         │
   │ │ ✓ Sarah Chen (2 unread)      ││ │ 😊 "Great work!"      │
   │ │ ✓ React Course Group (1)     ││ │                       │
   │ │ ▪️ Alex Johnson              ││ │ 2:31 PM               │
   │ │ ▪️ John Doe                  ││ │ "Thanks! How's yours?"│
   │ │ ▪️ Career Mentors Group      ││ │                       │
   │ │                              ││ │ 2:35 PM               │
   │ │ (Pinned: Sarah Chen icon)    ││ │ 🧑 "Still working..."│
   │ │                              ││ │ User is typing...      │
   │ └──────────────────────────────┘│ ├──────────────────────┤
   │                                  │ │ [emoji] [+] [      ] │
   │ 🧑 Your Avatar (floating)        │ └──────────────────────┘
   └─────────────────────────────────┘
         ↑ Bottom Right
         User's profile picture for identity
```

3. User can:
   - Select conversation
   - Send message
   - See read receipts
   - Start new DM via modal
   - Create group chat

---

## APIs Endpoints

### **Conversations**
```
GET    /api/chat/conversations
       → Lists all user's DM + Group conversations (paginated)

POST   /api/chat/conversations
       → Create new conversation (DM or Group)
       body: { type: 'DIRECT' | 'GROUP', participantIds: string[], name?: string }

GET    /api/chat/conversations/[id]
       → Get conversation details

PUT    /api/chat/conversations/[id]
       → Update conversation (name, icon for groups)

DELETE /api/chat/conversations/[id]
       → Leave/delete conversation
```

### **Messages**
```
GET    /api/chat/conversations/[id]/messages
       → List messages (cursor-based pagination, latest first)
       query: { limit?: 50, cursor?: string }

POST   /api/chat/conversations/[id]/messages
       → Send message
       body: { content: string, attachments?: File[], mentions?: string[] }

PUT    /api/chat/conversations/[id]/messages/[messageId]
       → Edit message

DELETE /api/chat/conversations/[id]/messages/[messageId]
       → Delete message
```

### **Real-time**
```
POST   /api/chat/conversations/[id]/typing
       → Broadcast typing indicator

POST   /api/chat/conversations/[id]/messages/[id]/read
       → Mark message as read
```

---

## My Recommendations

### **1. Use WebSocket for Real-time Updates**
- **Current**: Data gets stale without polling
- **Recommendation**: Implement Socket.IO for:
  - Instant message delivery
  - Typing indicators
  - Online status
  - Read receipts broadcasting
- **Implementation**: Upgrade to `next-socket.io` or use Vercel AI integration

### **2. Separate DM Model from ChatThread**
- **Current**: ChatThread handles both course chats AND DMs (type: 'DM')
- **Problem**: Course chat logic muddles DM-specific features
- **Recommendation**: 
  - Keep `ChatThread` for course channels only
  - Create new `DirectConversation` model for DMs/Groups
  - Cleaner service layer, easier to optimize queries
  - **Already outlined above** ✓

### **3. Add Message Threading (Replies)**
- **Current**: No nesting/threaded conversations
- **Recommendation**: Add `parentMessageId` field to allow:
  - Reply to specific message
  - Show mini-thread in UI
  - "X new replies" badges
  - Reduces clutter in group chats
  - **Like Slack threads or Discord**

### **4. Implement Presence Detection**
- **Current**: No online/offline status
- **Recommendation**:
  - Track user's last activity timestamp
  - Show green dot if active in last 5 min
  - Use WebSocket heartbeats
  - Show "User is typing..." for 5-second window

### **5. Add Search & Filtering**
- **Options**:
  - Search conversations by name/participant
  - Search messages within conversation
  - Filter unread, pinned, archived conversations
  - **Use Elasticsearch or PostgreSQL full-text search**

### **6. Implement Soft Deletes**
- **Current**: Delete is permanent
- **Recommendation**:
  - Add `deletedAt` field to messages
  - Show "Message was deleted" placeholder
  - Admins can restore/hard-delete after 30 days
  - Better data retention & compliance

### **7. Add Admin Capabilities for Groups**
- **Recommendation**:
  - Admin can remove members
  - Admin can change group name/icon
  - Admin can set messages to expire (ephemeral)
  - Admin can pin important messages
  - Audit log for admin actions

### **8. Notifications Strategy**
- **Current**: Basic unread count
- **Recommendation**: Three tiers:
  1. **All Messages**: Get notified for everything
  2. **Mentions Only**: Only when @mentioned
  3. **Muted**: No notifications, but show unread badge
  - Use user's notification preferences from Settings

### **9. Lazy Load Images & Attachments**
- **Current**: Attachment scaffolding exists
- **Recommendation**:
  - Use NextJS Image for avatars (optimization)
  - Lazy-load file previews (thumbnails)
  - Progressive rendering of long conversations
  - Intersect observer for infinite scroll

### **10. Data Migration Strategy**
- **Issue**: Existing `ChatThread` has DM-type messages
- **Recommendation**:
  - Create migration script to move DM threads to `DirectConversation`
  - Map `ChatThread.type='DM'` → `DirectConversation`
  - Keep course channels in `ChatThread` as-is
  - **Suggested approach**:
    ```bash
    # Create new models
    npx prisma migrate dev --create-only migrate_dm_to_direct_conversation
    # Run migration script
    npm run scripts/migrate-dm-to-direct-conversation.ts
    # Verify & commit
    ```

---

## Timeline & Phasing

| Phase | Duration | Scope |
|-------|----------|-------|
| **Phase 0** | 1-2 days | Schema updates + API scaffolding |
| **Phase 1** | 3-4 days | Basic DM UI + message sending |
| **Phase 2** | 2-3 days | Groups, typing indicators, read receipts |
| **Phase 3** | 5-7 days | WebSocket integration, real-time sync |
| **Phase 4** | 2-3 days | Search, filtering, notifications |

---

## File Structure After Implementation

```
src/
├── app/
│   ├── chat/
│   │   ├── page.tsx                   # Main hub
│   │   ├── layout.tsx                 # Shared layout
│   │   ├── conversations/
│   │   ├── direct/
│   │   ├── groups/
│   │   └── api/
│   │       ├── conversations/route.ts
│   │       ├── messages/route.ts
│   │       ├── groups/route.ts
│   │       ├── typing/route.ts
│   │       └── read-receipts/route.ts
├── features/
│   └── chat/
│       ├── components/
│       ├── hooks/
│       ├── service.ts
│       ├── types.ts
│       └── constants.ts
└── lib/
    ├── socket.io-client.ts            # WebSocket setup
    └── chat/
        ├── messages.ts                # Message utilities
        └── conversations.ts           # Conversation utilities
```

---

## Summary

Your Facebook Messenger-style chat should:
1. ✅ Separate DM/Groups from Course channels
2. ✅ Show avatars aligned to sides (left = other, right = me)
3. ✅ Display floating user avatar at bottom-right
4. ✅ Support 1:1 and group conversations
5. ✅ Implement real-time messaging (WebSocket)
6. ✅ Show typing indicators, read receipts, online status
7. ✅ Include search, muting, and notification control

**Key Improvement**: Moving to a dedicated `DirectConversation` model will unlock scalability and features that don't fit the course-channel use case.

