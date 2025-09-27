import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import ChatMessage from '../../../backend/src/models/chatMessage';

interface ChatInterfaceProps {
  sessionId: string;
  customerName?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId, customerName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:3001');

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      // Join the specific chat session room
      socketRef.current?.emit('join-chat', sessionId);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    // Listen for incoming messages
    socketRef.current.on('receive-message', (message: ChatMessage) => {
      console.log('Received message:', message);
      setMessages((prevMessages) => [...prevMessages, message]);
      setTyping(false);
    });

    // Listen for chat initiation (AI starts the conversation)
    socketRef.current.on('chat-initiated', (data: { sessionId: string; customerName: string; initialMessage: ChatMessage }) => {
      console.log('Chat initiated:', data);
      setMessages([data.initialMessage]);
    });

    // Fetch existing chat session data
    const fetchChatSession = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/chat/sessions/${sessionId}`);
        if (response.ok) {
          const sessionData = await response.json();
          if (sessionData.messages && sessionData.messages.length > 0) {
            setMessages(sessionData.messages);
          }
        }
      } catch (error) {
        console.error('Error fetching chat session:', error);
      }
    };

    fetchChatSession();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [sessionId]);

  const handleSendMessage = async () => {
    if (input.trim() === '' || !connected) return;

    setTyping(true);

    try {
      const response = await fetch('http://localhost:3001/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          content: input,
          sender: 'customer'
        }),
      });

      if (response.ok) {
        setInput('');
      } else {
        console.error('Failed to send message');
        setTyping(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setTyping(false);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border shadow-lg">
      {/* Header */}
      <div className="p-4 border-b bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">AI Support Agent</h3>
            {customerName && (
              <p className="text-sm opacity-90">Conversation with {customerName}</p>
            )}
          </div>
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow p-4 overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500">
            <p>Waiting for conversation to start...</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[70%] ${msg.sender === 'ai' ? 'order-1' : 'order-2'}`}>
              <div
                className={`p-3 rounded-lg ${
                  msg.sender === 'ai'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-blue-500 text-white'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              <p className={`text-xs text-gray-500 mt-1 ${msg.sender === 'ai' ? 'text-left' : 'text-right'}`}>
                {formatTimestamp(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-grow p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={connected ? "Type your response..." : "Connecting..."}
            disabled={!connected}
          />
          <button
            onClick={handleSendMessage}
            disabled={!connected || input.trim() === ''}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
