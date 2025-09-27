import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import ChatPage from './pages/ChatPage';

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <nav className="bg-gray-800 p-4 text-white">
          <ul className="flex space-x-4">
            <li>
              <Link to="/admin">Admin Dashboard</Link>
            </li>
            <li>
              <Link to="/chat">Chat</Link>
            </li>
          </ul>
        </nav>

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
