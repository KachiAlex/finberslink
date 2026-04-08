// Basic WebSocket server for chat (to be expanded)
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: any) => {
  ws.on('message', (data: any) => {
    // Broadcast received message to all clients
    wss.clients.forEach((client: any) => {
      if (client !== ws && client.readyState === 1) {
        client.send(data);
      }
    });
  });

  ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to chat server' }));
});

const PORT = process.env.CHAT_WS_PORT || 4001;
server.listen(PORT, () => {
  console.log(`Chat WebSocket server running on port ${PORT}`);
});
