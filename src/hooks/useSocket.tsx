"use client";

import { useEffect, useRef, useState, useCallback } from 'react'

type MessageHandler = (data: any) => void

export default function useSocket({ url, token }: { url?: string; token?: string }) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const handlersRef = useRef<MessageHandler[]>([])

  const connect = useCallback(() => {
    const wsUrl = url || `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:4000`
    const connector = token ? `${wsUrl}/?token=${encodeURIComponent(token)}` : `${wsUrl}`
    const ws = new WebSocket(connector)
    wsRef.current = ws
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (ev) => {
      try { const data = JSON.parse(ev.data); handlersRef.current.forEach(h => h(data)) } catch (e) { }
    }
  }, [url, token])

  useEffect(() => {
    connect()
    return () => {
      try { wsRef.current?.close() } catch (e) {}
      wsRef.current = null
    }
  }, [connect])

  const send = useCallback((obj: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(obj))
    }
  }, [])

  const onMessage = useCallback((fn: MessageHandler) => {
    handlersRef.current.push(fn)
    return () => { handlersRef.current = handlersRef.current.filter(h => h !== fn) }
  }, [])

  const join = useCallback((threadId: string) => send({ type: 'join', threadId }), [send])
  const leave = useCallback((threadId: string) => send({ type: 'leave', threadId }), [send])
  const sendMessage = useCallback((threadId: string, payload: any) => send({ type: 'message', threadId, payload }), [send])

  return { connected, sendMessage, join, leave, onMessage }
}
