export type MessageSender = 'ai' | 'customer';
export type MessageType =
  | 'greeting'
  | 'question'
  | 'response'
  | 'payment-request'
  | 'confirmation'
  | 'error';

export interface ChatMessage {
  id: string;
  chatSessionId: string;
  sender: MessageSender;
  content: string;
  timestamp: Date;
  messageType: MessageType;
}
