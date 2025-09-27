import React, { useState } from 'react';
import { Customer } from '../../../../backend/src/models/customer';

interface CustomerCardProps {
  customer: Customer;
  onChatTriggered?: (sessionId: string) => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onChatTriggered }) => {
  const [isTriggering, setIsTriggering] = useState(false);
  const [chatActive, setChatActive] = useState(false);

  const handleTriggerIntervention = async () => {
    setIsTriggering(true);

    try {
      // Determine payment issue based on customer data
      let paymentIssue = 'payment-failure';
      if (customer.riskCategory === 'expiring-card') {
        paymentIssue = 'card-expiring-soon';
      } else if (customer.riskCategory === 'failed-payment') {
        paymentIssue = 'payment-failure';
      }

      const response = await fetch('http://localhost:3001/api/chat/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customer.id,
          customerName: customer.name,
          paymentIssue: paymentIssue,
          customerData: customer // Pass complete customer object
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatActive(true);
        console.log(`Chat session created: ${data.sessionId}`);

        // Notify parent component about the chat session
        if (onChatTriggered) {
          onChatTriggered(data.sessionId);
        }

        // Open chat window (this would open a new window or navigate to chat page)
        const chatUrl = `/chat/${data.sessionId}`;
        window.open(chatUrl, '_blank', 'width=600,height=800');
      } else {
        console.error('Failed to create chat session');
      }
    } catch (error) {
      console.error('Error triggering intervention:', error);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-md">
      <h2 className="text-xl font-bold">{customer.name}</h2>
      <p>Email: {customer.email}</p>
      <p>Status: <span className="font-semibold">{customer.accountStatus}</span></p>
      <p>Risk: <span className="text-red-500">{customer.riskCategory}</span></p>

      {chatActive && (
        <div className="mt-2 p-2 bg-green-100 border border-green-400 rounded">
          <p className="text-green-700 text-sm">✅ Chat session active</p>
        </div>
      )}

      <button
        onClick={handleTriggerIntervention}
        disabled={isTriggering || chatActive}
        className={`mt-4 font-bold py-2 px-4 rounded ${
          chatActive
            ? 'bg-gray-500 text-white cursor-not-allowed'
            : isTriggering
            ? 'bg-yellow-500 text-white cursor-wait'
            : 'bg-blue-500 hover:bg-blue-700 text-white'
        }`}
      >
        {isTriggering
          ? 'Starting Chat...'
          : chatActive
          ? 'Chat Active'
          : 'Trigger Chat'}
      </button>
    </div>
  );
};

export default CustomerCard;
