# Quickstart Guide: AI Churn Prevention POC

## Demo Scenario Walkthrough

### Prerequisites
- Node.js 18+ installed
- Stripe test account with API keys
- Modern web browser (Chrome/Firefox/Safari)

### Quick Setup
```bash
# Clone and setup
git clone <repository>
cd poc-bemobi

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Configure Stripe test keys
cp backend/.env.example backend/.env
# Edit .env with your Stripe test keys

# Start services
npm run dev  # Starts both backend and frontend
```

### Demo Flow (5 minutes total)

#### Scenario 1: Expired Card Customer (2 minutes)
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
   - Real Stripe API call processes test payment
   - Success confirmation: *"All set! Your new card is active and your subscription will continue without interruption."*
   - Customer status updates to "Resolved" in admin panel

#### Scenario 2: Failed Payment Customer (2 minutes)
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

#### Results Dashboard (1 minute)
1. **View Success Metrics**
   - Admin dashboard updates in real-time
   - Shows 2/2 successful interventions (100% success rate)
   - Average resolution time: under 2 minutes each
   - Revenue retained: $99.98 (2 customers × ~$50 monthly value)

2. **Demo Key Points**
   - Real Stripe API integration (not mocked)
   - Natural AI conversation (not robotic forms)
   - Complete payment resolution cycle
   - Measurable business impact

### Test Data Details

#### Mock Customers (Realistic Data)
```json
{
  "sarah_johnson": {
    "name": "Sarah Johnson",
    "email": "sarah.johnson@email.com",
    "riskCategory": "expiring-card",
    "accountValue": 49.99,
    "cardEnding": "4242",
    "expiryDate": "10/2025"
  },
  "mike_chen": {
    "name": "Mike Chen",
    "email": "mike.chen@techstartup.com",
    "riskCategory": "failed-payment",
    "accountValue": 99.99,
    "failureCount": 3,
    "lastFailure": "2025-09-25"
  }
}
```

#### Stripe Test Cards
- **Working Card**: `4242424242424242` (Visa)
- **Working Card**: `5555555555554444` (Mastercard)
- **Declined Card**: `4000000000000002` (Visa - declined)
- **Expired Card**: `4000000000000069` (Visa - expired)

### Validation Checklist

#### Constitutional Requirements Met
- ✅ Working payment integration (real Stripe API calls)
- ✅ Natural conversation flow (dynamic AI responses)
- ✅ Demonstrable churn prevention (measurable results)
- ✅ Functional core over polish (working features prioritized)
- ✅ 5-minute demo constraint (complete demo under 5 minutes)

#### Technical Requirements Met
- ✅ Standalone admin dashboard page
- ✅ Two risk scenarios (expiring card + failed payment)
- ✅ Full Stripe API integration with test transactions
- ✅ Conversation history during demo session only
- ✅ Dynamic AI conversation generation

#### Demo Success Criteria
- ✅ End-to-end customer journey (admin trigger → chat → payment → resolution)
- ✅ Real-time payment processing with actual API responses
- ✅ Natural AI conversation that feels human-like
- ✅ Measurable business outcomes displayed
- ✅ Robust error handling for demo reliability

### Troubleshooting

#### Common Issues
1. **Stripe API Errors**
   - Verify test API keys in `.env`
   - Check internet connectivity
   - Confirm test mode is enabled

2. **Chat Not Responsive**
   - Verify WebSocket connection
   - Check browser console for errors
   - Restart development servers

3. **Payment Processing Fails**
   - Use only provided test card numbers
   - Ensure amounts are in cents (100 = $1.00)
   - Check Stripe dashboard for transaction logs

#### Fallback Strategies
- Pre-recorded conversation demos if AI service unavailable
- Cached Stripe responses for offline demonstration
- Static success metrics if real-time updates fail

### Performance Expectations
- **Page Load**: < 2 seconds
- **AI Response Time**: < 3 seconds
- **Payment Processing**: < 5 seconds
- **Complete Resolution**: < 180 seconds (constitutional requirement)

This quickstart guide ensures reliable demonstration of all constitutional requirements within the 5-minute constraint while providing fallback options for technical difficulties.