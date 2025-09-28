import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import ChatMessage from '../../../backend/src/models/chatMessage';
import InvoiceCard from './InvoiceCard';

interface ChatInterfaceProps {
  sessionId: string;
  customerId: string;
  customerName?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId, customerId, customerName }) => {
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
    socketRef.current = io('http://localhost:3001');
    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      socketRef.current?.emit('join-chat', sessionId);
    });
    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });
    socketRef.current.on('receive-message', (message: ChatMessage) => {
      // If this is an agent message, show typing indicator first, then show message after delay
      if (message.sender === 'ai') {
        setTyping(true);
        setTimeout(() => {
          setMessages((prevMessages) => [...prevMessages, message]);
          setTyping(false);
        }, 1500); // 1.5 second typing delay for agent messages
      } else {
        // For customer messages, show immediately
        setMessages((prevMessages) => [...prevMessages, message]);
        setTyping(false);
      }
    });
    socketRef.current.on('chat-initiated', (data: { sessionId: string; customerName: string; initialMessage: ChatMessage }) => {
      setMessages([data.initialMessage]);

      // Show typing indicator for the upcoming invoice card after a small delay
      setTimeout(() => {
        setTyping(true);
      }, 500);
    });
    socketRef.current.on('payment-processed', (data: { sessionId: string; success: boolean; message: string; timestamp: Date }) => {
      console.log('Payment processed:', data);
    });

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

    const messageContent = input;
    setInput('');

    try {
      const response = await fetch('http://localhost:3001/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, content: messageContent, sender: 'customer' }),
      });
      if (!response.ok) {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handlePaymentMethodSelection = async (method: 'credit' | 'pix' | 'boleto') => {
    const methodNames = { 'credit': 'Cartão de Crédito', 'pix': 'Pix', 'boleto': 'Boleto' };
    const paymentMethodMessage = new ChatMessage({
      id: `payment-method-${Date.now()}`,
      chatSessionId: sessionId,
      sender: 'customer',
      content: `Escolhi pagar com ${methodNames[method]}`,
      timestamp: new Date(),
      messageType: 'question'
    });
    setMessages(prev => [...prev, paymentMethodMessage]);
    setTyping(true);
    try {
      const processingTime = { 'pix': 2000, 'credit': 3000, 'boleto': 1500 };
      await new Promise(resolve => setTimeout(resolve, processingTime[method]));
      const response = await fetch('http://localhost:3001/api/payments/simulate-chat-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, customerId, paymentMethod: method }),
      });
      setTyping(false);
      if (!response.ok) {
        throw new Error('Payment failed');
      }
    } catch (error) {
      setTyping(false);
      const errorMessage = new ChatMessage({
        id: `payment-error-${Date.now()}`,
        chatSessionId: sessionId,
        sender: 'ai',
        content: `❌ Erro no pagamento via ${methodNames[method]}. Tente novamente.`,
        timestamp: new Date(),
        messageType: 'error'
      });
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const parseInvoiceData = (content: string) => {
    try {
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonStr = content.slice(jsonStart, jsonEnd);
        return JSON.parse(jsonStr);
      }
    } catch (error) {
      console.error('Error parsing invoice data:', error);
    }
    return null;
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const INVOICE_TRIGGER = '[INVOICE_CARD]';
  const PAYMENT_TRIGGER = '[PAYMENT_BUTTON]';

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border shadow-lg">
      {/* Cabeçalho no estilo WhatsApp */}
      <div className="p-3 border-b flex items-center" style={{ backgroundColor: 'var(--whatsapp-header)' }}>
        <div className="flex items-center space-x-3 text-white">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-xl font-bold" style={{ color: 'var(--whatsapp-header)' }}>B</span>
          </div>
          <div>
            <h3 className="font-semibold">Bemobi Atendimento</h3>
            <p className="text-sm opacity-90">
              {connected ? 'online' : 'conectando...'}
            </p>
          </div>
        </div>
      </div>

      {/* Área de Mensagens com fundo personalizado */}
      <div className="flex-grow p-4 overflow-y-auto space-y-2 chat-background">
        {messages.map((msg) => {
            // Determina as classes da bolha de mensagem com base no remetente
            const isAI = msg.sender === 'ai';
            const isSystem = msg.messageType === 'error';

            const bubbleClass = isSystem
              ? 'system-bubble'
              : isAI
              ? 'ai-bubble'
              : 'customer-bubble';
            
            const justifyContent = isAI || isSystem ? 'justify-start' : 'justify-end';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className={bubbleClass}>{msg.content}</div>
                </div>
              )
            }

            return (
              <div key={msg.id} className={`flex ${justifyContent}`}>
                <div className={`message-bubble ${bubbleClass}`}>
                  {msg.content.includes(INVOICE_TRIGGER) ? (
                    (() => {
                      const invoiceData = parseInvoiceData(msg.content);
                      return invoiceData ? (
                        <InvoiceCard
                          customerName={invoiceData.customerName || customerName || 'Cliente'}
                          accountNumber={invoiceData.accountNumber || '123423453'}
                          brandName={invoiceData.brandName || 'Sua Marca'}
                          dueDate={invoiceData.dueDate || '11/10/2025'}
                          amount={invoiceData.amount || 200.00}
                          billPeriod={invoiceData.billPeriod || 'dezembro'}
                          onPaymentMethod={handlePaymentMethodSelection}
                        />
                      ) : <p className="whitespace-pre-wrap">{msg.content.replace(INVOICE_TRIGGER, '').trim()}</p>;
                    })()
                  ) : msg.content.includes(PAYMENT_TRIGGER) ? (
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm mb-2">Como você gostaria de pagar?</p>
                      <button
                        onClick={() => handlePaymentMethodSelection('credit')}
                        className="w-full bg-blue-500 text-white py-3 rounded-md font-medium hover:bg-blue-600 transition-colors"
                      >
                        💳 Cartão de Crédito em até 24x
                      </button>
                      <button
                        onClick={() => handlePaymentMethodSelection('pix')}
                        className="w-full bg-teal-500 text-white py-3 rounded-md font-medium hover:bg-teal-600 transition-colors"
                      >
                        💰 Pix
                      </button>
                      <button
                        onClick={() => handlePaymentMethodSelection('boleto')}
                        className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
                      >
                        📄 Boleto
                      </button>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <div className="text-right text-xs mt-1" style={{ color: 'var(--whatsapp-text-meta)' }}>
                    {formatTimestamp(msg.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}

        {/* Indicador "Digitando..." */}
        {typing && (
          <div className="flex justify-start">
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Área de Input no estilo WhatsApp */}
      <div className="p-3 border-t" style={{ backgroundColor: 'var(--whatsapp-input-bg)' }}>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-grow p-3 border-none rounded-full focus:ring-2 focus:ring-green-500"
            placeholder={connected ? "Digite sua mensagem" : "Conectando..."}
            disabled={!connected}
            style={{ backgroundColor: 'var(--whatsapp-bubble-in)' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!connected || input.trim() === ''}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'var(--whatsapp-header)' }}
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;