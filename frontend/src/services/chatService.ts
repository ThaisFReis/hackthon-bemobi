import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../types/chatMessage';

class ChatService {
  private socket: Socket | null = null;

  connect(sessionId: string) {
    this.socket = io('https://hackthon-bemobi-1.onrender.com');

    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
      this.socket?.emit('join-chat', sessionId);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  sendMessage(message: ChatMessage) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send-message', message);
    }
  }

  onMessage(callback: (message: ChatMessage) => void) {
    if (this.socket) {
      this.socket.on('receive-message', callback);
    }
  }
}

export default new ChatService();
