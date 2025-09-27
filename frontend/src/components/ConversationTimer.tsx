import React, { useState, useEffect } from 'react';

interface ConversationTimerProps {
  startTime: Date;
}

const ConversationTimer: React.FC<ConversationTimerProps> = ({ startTime }) => {
  const [remainingTime, setRemainingTime] = useState(180); // 3 minutes in seconds

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      const newRemainingTime = 180 - elapsedTime;
      setRemainingTime(newRemainingTime > 0 ? newRemainingTime : 0);

      if (newRemainingTime <= 0) {
        clearInterval(interval);
        // Handle conversation timeout
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  const isWarning = remainingTime <= 30; // 30-second warning

  return (
    <div className={`p-2 rounded-lg ${isWarning ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>
      <p className="font-bold text-lg">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </p>
      {isWarning && <p>Conversation will end soon!</p>}
    </div>
  );
};

export default ConversationTimer;
