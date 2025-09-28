import React, { useState } from 'react';
import { Customer } from '../../../../backend/src/models/customer';
import { MessageSquare, Zap, CheckCircle, AlertTriangle } from 'lucide-react';

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
          customerData: customer,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatActive(true);
        console.log(`Chat session created: ${data.sessionId}`);

        if (onChatTriggered) {
          onChatTriggered(data.sessionId);
        }

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

  const riskStyles = {
    'failed-payment': 'bg-red-500/20 text-red-300',
    'expiring-card': 'bg-yellow-500/20 text-yellow-300',
    'default': 'bg-gray-500/20 text-gray-300',
  };

  const statusStyles = {
    'at-risk': 'bg-red-500/20 text-red-300',
    'active': 'bg-green-500/20 text-green-300',
    'default': 'bg-gray-500/20 text-gray-300',
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out p-5 flex flex-col h-full text-gray-200">
      <div className="flex-grow">
        <h3 className="text-lg font-bold text-white truncate">{customer.name}</h3>
        <p className="text-sm text-gray-400 mb-4">{customer.email}</p>
        
        <div className="flex items-center mb-2">
          <AlertTriangle className="w-4 h-4 text-red-400 mr-2" />
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${riskStyles[customer.riskCategory] || riskStyles.default}`}>
            {customer.riskCategory.replace('-', ' ')}
          </span>
        </div>

        <div className="flex items-center">
          <CheckCircle className="w-4 h-4 text-gray-400 mr-2" />
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusStyles[customer.accountStatus] || statusStyles.default}`}>
            {customer.accountStatus}
          </span>
        </div>
      </div>

      {chatActive && (
        <div className="mt-4 p-2.5 bg-green-500/20 border border-green-400/30 rounded-md flex items-center">
          <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
          <p className="text-green-300 text-sm font-medium">Chat session active</p>
        </div>
      )}

      <div className="mt-5 pt-5 border-t border-white/10">
        <button
          onClick={handleTriggerIntervention}
          disabled={isTriggering || chatActive}
          className={`w-full flex items-center justify-center font-bold py-2.5 px-4 rounded-lg transition-all duration-200 ease-in-out ${
            chatActive
              ? 'bg-gray-500/30 text-gray-400 cursor-not-allowed'
              : isTriggering
              ? 'bg-yellow-500/50 text-white cursor-wait'
              : 'bg-blue-600/50 hover:bg-blue-600/80 text-white shadow-md hover:shadow-lg'
          }`}
        >
          {isTriggering ? (
            <>
              <Zap className="w-5 h-5 mr-2 animate-pulse" />
              Starting Chat...
            </>
          ) : chatActive ? (
            <>
              <MessageSquare className="w-5 h-5 mr-2" />
              Chat Active
            </>
          ) : (
            <>
              <MessageSquare className="w-5 h-5 mr-2" />
              Trigger Chat
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CustomerCard;
