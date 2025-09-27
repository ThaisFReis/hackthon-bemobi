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
        const response = await fetch(`http://localhost:3001/api/chat/sessions/${sessionId}`);
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4" style={{height: 'calc(100vh - 4rem)'}}>
      <div className="md:col-span-2 h-full">
        <ChatInterface
          sessionId={sessionId}
          customerName={sessionData?.customerName}
        />
      </div>
      <div className="h-full">
        <div className="bg-white rounded-lg border p-4 h-full">
          <h3 className="font-semibold mb-4">Session Info</h3>
          {sessionData && (
            <div className="space-y-2 text-sm">
              <div><strong>Customer:</strong> {sessionData.customerName}</div>
              <div><strong>Session ID:</strong> {sessionId}</div>
              <div><strong>Status:</strong> {sessionData.status}</div>
              <div><strong>Started:</strong> {new Date(sessionData.startTime).toLocaleString()}</div>
              {sessionData.paymentIssue && (
                <div><strong>Issue:</strong> {sessionData.paymentIssue}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
