# AI Churn Prevention POC

A full-stack proof-of-concept demonstrating AI-powered customer churn prevention through proactive chat conversations and real-time payment resolution. Built with React + TypeScript frontend and Node.js + Express backend.

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript + Socket.IO
- **Real-time Communication**: WebSocket connections for live chat
- **Payment Processing**: Mock payment service with Stripe-like API
- **Testing**: Jest + React Testing Library

## Project Status: Implementation Complete ✅

All tasks from T001-T050 are complete. The application is ready for demonstration.

## Quick Start

### Prerequisites
- Node.js 18+ installed

### Installation
```bash
# Install all dependencies
npm run install:all

# Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys
```

### Development
```bash
# Start both backend and frontend in development mode
npm run dev
```
The backend will be running on `http://localhost:3001` and the frontend on `http://localhost:3000`.

### Testing
```bash
npm run test        # Run all tests
npm run lint        # Run all linting
npm run format      # Format all code
```

## Demo Walkthrough (5 minutes total)

### Scenario 1: Expired Card Customer (2 minutes)
1. **Open Admin Dashboard**
   - Navigate to `http://localhost:3000/admin`
   - View list of at-risk customers
   - Locate "Sarah Johnson" with expired card (expires 10/2025)

2. **Trigger AI Intervention**
   - Click "Trigger Chat" button for Sarah
   - Chat window opens automatically
   - AI initiates: *"Hi Sarah! I noticed your card ending in 4242 expires next month. I'm here to help you update it quickly."*

3. **Customer Interaction**
   - Simulate customer response: *"Oh, I didn't realize! Yes, I need to update it."*
   - AI guides naturally: *"Great! I can help you with that. What's your new card number?"*
   - Enter test card: `4242424242424242`
   - AI confirms: *"Perfect! Expiry date?"*
   - Enter: `12/2027`
   - AI requests: *"And the 3-digit security code?"*
   - Enter: `123`

4. **Payment Processing**
   - AI confirms: *"Let me process that for you..."*
   - The mock payment service processes the test payment.
   - Success confirmation: *"All set! Your new card is active and your subscription will continue without interruption."*
   - Customer status updates to "Resolved" in admin panel

### Scenario 2: Failed Payment Customer (2 minutes)
1. **Select Different Customer**
   - Admin dashboard shows "Mike Chen" with failed payment
   - Multiple failure indicators (3 failures)
   - Click "Trigger Chat"

2. **AI Addresses Payment Failure**
   - AI opens: *"Hi Mike! I'm reaching out because we've had trouble processing your recent payments. I'd love to help resolve this quickly."*
   - Customer responds: *"Oh no! I think my bank flagged it as fraud."*
   - AI empathizes: *"That happens sometimes! Let's get you set up with a new payment method."*

3. **Alternative Card Processing**
   - Customer provides different test card: `4000000000000002` (declined card)
   - AI handles gracefully: *"It looks like that card was declined. Do you have another card we could try?"*
   - Customer provides working card: `5555555555554444`
   - Successful processing and confirmation

### Results Dashboard (1 minute)
1. **View Success Metrics**
   - Admin dashboard updates in real-time
   - Shows 2/2 successful interventions (100% success rate)
   - Average resolution time: under 2 minutes each
   - Revenue retained: $99.98 (2 customers × ~$50 monthly value)

## 📁 Project Structure

```
├── README.md           # This file
├── package.json        # Root package.json with workspace scripts
├── backend/           # Node.js + Express API server
│   ├── src/           # TypeScript source code
│   ├── tests/         # Backend tests
│   └── README.md      # Backend-specific documentation
├── frontend/          # React + TypeScript client
│   ├── src/           # React source code
│   ├── tests/         # Frontend tests
│   └── README.md      # Frontend-specific documentation
└── specs/             # Project specifications
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start both backend and frontend
npm run dev:backend      # Start only backend server
npm run dev:frontend     # Start only frontend

# Building
npm run build           # Build both projects
npm run build:backend   # Build backend only
npm run build:frontend  # Build frontend only

# Testing & Quality
npm run test            # Run all tests
npm run lint            # Run all linting
npm run format          # Format all code

# Production
npm start               # Start production servers
```

## Constitutional Compliance ✅

This POC adheres to the established constitutional principles:
- **Working Payment Integration**: A mock payment integration is implemented.
- **Natural Conversation Flow**: AI-driven conversations.
- **Demonstrable Churn Prevention**: Mock data supports realistic demo scenarios.
- **Functional Core Over Polish**: Focus on working features.
- **5-Minute Demo Constraint**: All features designed for quick demonstration.

## 🤝 Contributing

1. Make sure all tests pass: `npm run test`
2. Ensure code is properly formatted: `npm run format`
3. Run linting: `npm run lint`
4. Follow the existing code conventions

## 📄 License

MIT - See individual component READMEs for more details.