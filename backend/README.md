# Backend - AI Churn Prevention POC

Node.js + Express backend API server with TypeScript, Socket.IO for real-time communication, and mock payment processing.

## 🏗️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Real-time**: Socket.IO
- **Payment**: Mock Stripe integration
- **AI**: OpenAI API integration
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint + Prettier

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm 8+ installed

### Installation
```bash
cd backend
npm install
```

### Environment Setup
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your API keys
nano .env
```

Required environment variables:
```bash
PORT=3001
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
FRONTEND_URL=https://hackthon-bemobi-1.onrender.com0
```

### Development
```bash
npm run dev          # Start with hot reload
npm run build        # Build TypeScript
npm start            # Start production server
```

The server will start on `https://hackthon-bemobi-1.onrender.com`

## 🧪 Testing

```bash
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## 🔧 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run lint` - Check code style
- `npm run format` - Format code with Prettier

## 📁 Project Structure

```
src/
├── controllers/      # Request handlers
├── middleware/       # Express middleware
├── models/          # Data models and types
├── routes/          # API routes
├── services/        # Business logic
├── sockets/         # Socket.IO handlers
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── server.ts        # Express app entry point
```

## 🔌 API Endpoints

### Customer Management
- `GET /api/customers` - List at-risk customers
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer status

### Chat System
- `POST /api/chat/trigger` - Trigger AI chat intervention
- `POST /api/chat/message` - Send chat message
- `GET /api/chat/:sessionId/history` - Get chat history

### Payment Processing
- `POST /api/payments/process` - Process payment
- `POST /api/payments/update-card` - Update payment method
- `GET /api/payments/:customerId` - Get payment history

### WebSocket Events
- `connection` - Client connects
- `join_chat` - Join chat session
- `send_message` - Send chat message
- `ai_response` - Receive AI response
- `payment_update` - Payment status update

## 🧠 AI Integration

The backend integrates with OpenAI's API to power conversational AI:

- **Natural conversations** about payment issues
- **Context-aware responses** based on customer data
- **Payment flow guidance** through natural language
- **Empathetic tone** for customer retention

## 💳 Payment Processing

Mock payment service that simulates Stripe behavior:

- **Card validation** with realistic responses
- **Failure simulation** for testing edge cases
- **Success tracking** for demo scenarios
- **Payment method updates** in real-time

## 🔒 Security Features

- **Helmet.js** for HTTP security headers
- **CORS** properly configured
- **Input validation** using Joi
- **Environment variables** for sensitive data
- **Error handling** with proper status codes

## 📊 Monitoring & Logging

- **Structured logging** for debugging
- **Error tracking** with stack traces
- **Performance metrics** for API endpoints
- **Real-time connection monitoring**

## 🐛 Debugging

Enable debug logging:
```bash
DEBUG=app:* npm run dev
```

Common issues:
- **Port conflicts**: Change PORT in .env
- **CORS errors**: Verify FRONTEND_URL setting
- **API key issues**: Check OpenAI/Stripe key validity

## 🤝 Contributing

1. Run tests: `npm test`
2. Check linting: `npm run lint`
3. Format code: `npm run format`
4. Follow TypeScript best practices
5. Add tests for new features

## 📄 License

MIT