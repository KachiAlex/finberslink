#!/usr/bin/env node
const http = require('http')
const WebSocket = require('ws')
const url = require('url')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || null

const PORT = process.env.REALTIME_PORT || process.env.PORT || 4000
const NEXT_PORT = process.env.NEXT_PORT || 3001

// In-memory maps for rooms and socket metadata
const rooms = new Map() // threadId -> Set(ws)
const sockets = new Map() // ws -> { userId, threads: Set }

function broadcastToRoom(threadId, data, except) {
  const set = rooms.get(threadId)
  if (!set) return
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN && ws !== except) {
      try { ws.send(JSON.stringify(data)) } catch (e) { /* ignore */ }
    }
  }
}

function handleMessage(ws, raw) {
  let msg
  try { msg = JSON.parse(raw) } catch (e) { return }
  const meta = sockets.get(ws) || { userId: null, threads: new Set() }
  switch (msg.type) {
    case 'join': {
      const { threadId } = msg
      if (!threadId) return
      meta.threads.add(threadId)
      sockets.set(ws, meta)
      if (!rooms.has(threadId)) rooms.set(threadId, new Set())
      rooms.get(threadId).add(ws)
      broadcastToRoom(threadId, { type: 'presence', threadId, userId: meta.userId })
      break
    }
    case 'leave': {
      const { threadId } = msg
      if (!threadId) return
      meta.threads.delete(threadId)
      const set = rooms.get(threadId)
      if (set) set.delete(ws)
      break
    }
    case 'message': {
      const { threadId, payload } = msg
      if (!threadId || !payload) return
      // If SKIP_PERSIST is set, bypass Next.js persistence and broadcast a synthetic message
      if (process.env.SKIP_PERSIST === '1') {
        const synthetic = {
          id: `synthetic-${Date.now()}`,
          threadId,
          content: payload.content,
          attachments: payload.attachments || [],
          mentions: payload.mentionUserIds || [],
          authorId: meta.userId || 'unknown',
          sentAt: new Date().toISOString(),
        }
        const out = { type: 'message', threadId, payload: synthetic, from: synthetic.authorId, createdAt: synthetic.sentAt }
        broadcastToRoom(threadId, out)
        return
      }

      // Persist message via Next.js API so we reuse existing auth & persistence
      (async () => {
        try {
          const url = `http://localhost:${NEXT_PORT}/api/chat/messages`
          const body = { threadId, content: payload.content, attachments: payload.attachments || [], parentId: payload.parentId || null, mentionUserIds: payload.mentionUserIds || [] }
          const headers = { 'Content-Type': 'application/json' }
          // If client provided token on connect, forward as cookie for Next auth
          if (meta.token) headers['Cookie'] = `access_token=${meta.token}`
          const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
          if (!res.ok) {
            // log details for debugging
            try {
              const text = await res.text()
              console.error('Realtime: failed to persist message', { status: res.status, statusText: res.statusText, body: text, url })
              ws.send(JSON.stringify({ type: 'error', error: text }))
            } catch (e) {
              console.error('Realtime: failed to persist message and failed reading body', e)
              ws.send(JSON.stringify({ type: 'error', error: 'PERSIST_ERROR' }))
            }
            return
          }
          const data = await res.json()
          const message = data?.message ?? null
          if (message) {
            const out = { type: 'message', threadId, payload: message, from: message.authorId || meta.userId, createdAt: message.createdAt }
            broadcastToRoom(threadId, out)
          }
        } catch (e) {
          console.error('Realtime: exception while persisting message', e)
          try { ws.send(JSON.stringify({ type: 'error', error: 'PERSIST_EXCEPTION' })) } catch (_) {}
        }
      })()
      break
    }
    case 'typing': {
      const { threadId, isTyping } = msg
      if (!threadId) return
      broadcastToRoom(threadId, { type: 'typing', threadId, userId: meta.userId, isTyping: !!isTyping }, ws)
      break
    }
    default:
      // noop
  }
}

const server = http.createServer((req, res) => {
  res.writeHead(200)
  res.end('Realtime server')
})

const wss = new WebSocket.Server({ noServer: true })

wss.on('connection', (ws, request, client) => {
  // extract token/userId as simple query param for now
  const q = url.parse(request.url, true).query
  let userId = q.userId || null
  let token = q.token || null
  // also check Cookie header for access_token
  const cookieHeader = request.headers && request.headers.cookie
  if (!token && cookieHeader) {
    const m = cookieHeader.match(/access_token=([^;\s]+)/)
    if (m) token = m[1]
  }
  sockets.set(ws, { userId, token, threads: new Set() })

  ws.on('message', (msg) => handleMessage(ws, msg))
  ws.on('close', () => {
    const meta = sockets.get(ws)
    if (meta) {
      for (const threadId of meta.threads) {
        const set = rooms.get(threadId)
        if (set) set.delete(ws)
      }
      sockets.delete(ws)
    }
  })
})

server.on('upgrade', (request, socket, head) => {
  // Validate token on upgrade (query param 'token' or cookie 'access_token')
  try {
    const q = url.parse(request.url || '', true).query
    let token = q.token || null
    const cookieHeader = request.headers && request.headers.cookie
    if (!token && cookieHeader) {
      const m = cookieHeader.match(/access_token=([^;\s]+)/)
      if (m) token = m[1]
    }

    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    if (!JWT_SECRET) {
      // If no secret available, reject to avoid insecure behavior
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n')
      socket.destroy()
      return
    }

    let payload
    try {
      payload = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    // attach verified token and user id to the request headers for connection handler
    try {
      request.headers = request.headers || {}
      if (payload && payload.sub) request.headers['x-user-id'] = String(payload.sub)
      request.headers['x-access-token'] = token
    } catch (e) {
      // ignore
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request)
    })
  } catch (e) {
    try { socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n') } catch (ignored) {}
    try { socket.destroy() } catch (ignored) {}
  }
})

server.listen(PORT, () => {
  console.log(`Realtime WS server listening on port ${PORT}`)
})
