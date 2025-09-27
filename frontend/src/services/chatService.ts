import { ChatMessage } from '../../../../backend/src/models/chatMessage';

class ChatService {
  private socket: WebSocket | null = null;

  connect(sessionId: string) {
    this.socket = new WebSocket(`ws://localhost:3001/chat/${sessionId}`); // Assuming WebSocket server is on port 3001

    this.socket.onopen = () => {
      console.log('WebSocket connected');
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }

  sendMessage(message: ChatMessage) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  onMessage(callback: (message: ChatMessage) => void) {
    if (this.socket) {
      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        callback(message);
      };
    }
  }
}

export default new ChatService();
