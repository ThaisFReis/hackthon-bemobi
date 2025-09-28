import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';

const ChatPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionId) return;

      try {
        const response = await fetch(`https://hackthon-bemobi-1.onrender.com/api/chat/sessions/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setSessionData(data);
        } else {
          console.error('Failed to fetch session data');
        }
      } catch (error) {
        console.error('Error fetching session data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading chat session...</div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">No session ID provided</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto h-screen max-h-full sm:max-h-[700px] rounded-lg p-2 bg-gray-950">
        <ChatInterface
          sessionId={sessionId}
          customerId={sessionData?.customerId}
          customerName={sessionData?.customerName}
        />
      </div>
    </div>
  );
};

export default ChatPage;
