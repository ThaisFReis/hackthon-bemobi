import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import ChatPage from './pages/ChatPage';

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/chat/:sessionId" element={<ChatPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/" element={<AdminPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
