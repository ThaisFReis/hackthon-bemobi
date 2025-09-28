# Frontend - AI Churn Prevention POC

React + TypeScript frontend application with Tailwind CSS, real-time chat functionality, and payment processing interface.

## 🏗️ Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Hooks
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios
- **Forms**: React Hook Form
- **UI Components**: Lucide React (icons)
- **Notifications**: React Hot Toast
- **Testing**: Jest + React Testing Library

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm 8+ installed

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

The application will start on `https://hackthon-bemobi-1.onrender.com0`

## 🧪 Testing

```bash
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## 🔧 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run test suite
- `npm run lint` - Check code style
- `npm run format` - Format code with Prettier

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── chat/        # Chat-related components
│   ├── customer/    # Customer management components
│   ├── payment/     # Payment processing components
│   └── ui/          # Generic UI components
├── pages/           # Application pages/routes
├── hooks/           # Custom React hooks
├── services/        # API service functions
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── styles/          # Global styles and Tailwind config
└── App.tsx          # Main application component
```

## 🎨 UI Components

### Admin Dashboard
- **Customer List**: Display at-risk customers with status indicators
- **Real-time Updates**: Live status changes and metrics
- **Action Controls**: Trigger AI interventions and view details

### Chat Interface
- **Real-time Messaging**: WebSocket-powered live chat
- **AI Responses**: Contextual AI-generated responses
- **Payment Forms**: Inline payment method collection
- **Status Indicators**: Visual feedback for message states

### Payment Processing
- **Card Input Forms**: Secure payment method collection
- **Validation**: Real-time form validation
- **Error Handling**: User-friendly error messages
- **Success Feedback**: Clear confirmation states

## 🔌 API Integration

### REST Endpoints
```typescript
// Customer operations
GET /api/customers           // List customers
GET /api/customers/:id       // Get customer details
PUT /api/customers/:id       // Update customer

// Chat operations
POST /api/chat/trigger       // Start AI conversation
POST /api/chat/message       // Send message
GET /api/chat/:id/history    // Get chat history

// Payment operations
POST /api/payments/process   // Process payment
POST /api/payments/update    // Update payment method
```

### WebSocket Events
```typescript
// Outgoing events
socket.emit('join_chat', sessionId)
socket.emit('send_message', message)

// Incoming events
socket.on('ai_response', handleAIResponse)
socket.on('payment_update', handlePaymentUpdate)
socket.on('customer_status_change', handleStatusChange)
```

## 🎯 Key Features

### Real-time Chat
- **Instant messaging** with WebSocket connections
- **AI-powered responses** with natural conversation flow
- **Message history** persistence and retrieval
- **Typing indicators** and message states

### Customer Management
- **Dashboard view** of at-risk customers
- **Status tracking** with real-time updates
- **Intervention triggers** for proactive outreach
- **Success metrics** and analytics

### Payment Processing
- **Secure card collection** with validation
- **Error handling** for declined payments
- **Alternative payment methods** support
- **Success confirmation** and feedback

### Responsive Design
- **Mobile-first** approach with Tailwind CSS
- **Adaptive layouts** for different screen sizes
- **Touch-friendly** interface elements
- **Accessible** components with proper ARIA labels

## 🎨 Styling

Using Tailwind CSS for utility-first styling:

```typescript
// Example component styling
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <h2 className="text-xl font-semibold text-gray-800 mb-4">
    Customer Details
  </h2>
</div>
```

### Color Scheme
- **Primary**: Blue tones for main actions
- **Success**: Green for successful operations
- **Warning**: Yellow for at-risk states
- **Error**: Red for failures and alerts
- **Neutral**: Gray scale for text and backgrounds

## 🔒 Security Considerations

- **Input sanitization** for all user inputs
- **XSS protection** with proper escaping
- **CSRF protection** via HTTP-only cookies
- **Secure payment handling** without storing sensitive data
- **Environment variables** for API endpoints

## 📱 Responsive Breakpoints

```css
/* Tailwind breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
```

## 🔧 Configuration

### Environment Variables
Create `.env.local` for local development:
```bash
VITE_API_URL=https://hackthon-bemobi-1.onrender.com1
VITE_SOCKET_URL=https://hackthon-bemobi-1.onrender.com1
```

### Vite Configuration
The project uses Vite for fast development and building:
- **Hot Module Replacement** for instant updates
- **TypeScript support** out of the box
- **Optimized builds** with tree shaking
- **Modern JavaScript** target compilation

## 🐛 Debugging

### Development Tools
- **React Developer Tools** browser extension
- **Redux DevTools** for state inspection (if using Redux)
- **Network tab** for API call monitoring
- **Console logging** with proper error handling

### Common Issues
- **CORS errors**: Check backend CORS configuration
- **WebSocket connection**: Verify Socket.IO server status
- **Build errors**: Check TypeScript type definitions
- **Styling issues**: Verify Tailwind CSS compilation

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deployment Options
- **Vercel**: Zero-config deployment for Vite apps
- **Netlify**: Static site hosting with build automation
- **AWS S3**: Static website hosting
- **Docker**: Containerized deployment

## 🤝 Contributing

1. Run tests: `npm test`
2. Check linting: `npm run lint`
3. Format code: `npm run format`
4. Follow React best practices
5. Add tests for new components
6. Use TypeScript strict mode
7. Follow Tailwind CSS conventions

## 📄 License

MIT