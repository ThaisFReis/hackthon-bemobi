export type MessageSender = 'ai' | 'customer';
export type MessageType =
  | 'greeting'
  | 'question'
  | 'response'
  | 'payment-request'
  | 'confirmation'
  | 'error';

interface ChatMessageData {
  id?: string;
  chatSessionId: string;
  sender: MessageSender;
  content: string;
  timestamp: Date;
  messageType?: MessageType;
}

class ChatMessage {
  id: string;
  chatSessionId: string;
  sender: MessageSender;
  content: string;
  timestamp: Date;
  messageType: MessageType;

  constructor({
    id = `msg_${Date.now()}`,
    chatSessionId,
    sender,
    content,
    timestamp,
    messageType = 'question',
  }: ChatMessageData) {
    if (!chatSessionId || !sender || !content || !timestamp) {
      throw new Error(
        'chatSessionId, sender, content, and timestamp are required for a chat message.'
      );
    }

    this.id = id;
    this.chatSessionId = chatSessionId;
    this.sender = sender;
    this.content = content;
    this.timestamp = timestamp;
    this.messageType = messageType;

    this.validate();
  }

  validate() {
    // Ensure content is a string
    if (typeof this.content !== 'string') {
      this.content = String(this.content || '');
    }

    if (this.content.trim().length === 0) {
      throw new Error('content cannot be empty.');
    }
  }
}

export default ChatMessage;
