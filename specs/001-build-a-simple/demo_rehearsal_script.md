# Demo Rehearsal Script

## 1. Introduction (30 seconds)

- "Good morning/afternoon, everyone. Today, we're demonstrating our AI-powered solution to proactively combat customer churn due to payment issues."
- "Our system identifies at-risk customers and initiates a natural, AI-driven conversation to resolve payment problems in real-time."

## 2. Scenario 1: Expiring Card (2 minutes)

- **Action**: Open the Admin Dashboard at `http://localhost:3000/admin`.
- **Narration**: "This is our admin dashboard. It provides a real-time view of customers at risk of churning. Let's take a look at Sarah Johnson, whose card is about to expire."
- **Action**: Click the "Trigger Chat" button for Sarah Johnson.
- **Narration**: "With a single click, we can initiate an AI-powered conversation to help Sarah update her payment method."
- **Action**: A chat window opens. The AI starts the conversation.
- **Narration**: "As you can see, our AI initiates a natural, friendly conversation, making the customer feel valued and supported."
- **Action**: Simulate Sarah's responses in the chat interface.
  - *"Oh, I didn't realize! Yes, I need to update it."*
  - Enter test card: `4242424242424242`
  - Enter expiry: `12/27`
  - Enter CVC: `123`
- **Narration**: "The AI guides the customer through the process, collecting the necessary information in a conversational manner."
- **Action**: The AI processes the payment.
- **Narration**: "Now, the system is securely processing the payment through Stripe. And... success! Sarah's payment method is updated, and her subscription will continue without interruption."
- **Action**: Show the updated customer status in the admin dashboard.

## 3. Scenario 2: Failed Payment (1.5 minutes)

- **Action**: Point to Mike Chen on the admin dashboard.
- **Narration**: "Now, let's look at a different scenario. Mike Chen has had multiple failed payments. Let's see how our AI handles this."
- **Action**: Click "Trigger Chat" for Mike Chen.
- **Narration**: "Again, we initiate the chat with a single click."
- **Action**: The AI starts the conversation.
- **Narration**: "The AI is empathetic and helpful, immediately addressing the payment failure and offering a solution."
- **Action**: Simulate Mike's responses.
  - *"Oh no! I think my bank flagged it as fraud."*
  - Enter a declined card number: `4000000000000002`
- **Narration**: "Our system can even handle declined cards gracefully, prompting the user for a different payment method."
- **Action**: Enter a working card number: `5555555555554444`
- **Narration**: "And just like that, the payment is processed successfully."

## 4. Results and Conclusion (1 minute)

- **Action**: Show the updated metrics on the admin dashboard.
- **Narration**: "As you can see on our dashboard, we've successfully resolved two churn risks in just a few minutes. We have a 100% success rate, an average resolution time of under two minutes, and we've retained nearly $100 in monthly revenue."
- **Narration**: "This demonstrates the power of our solution to proactively reduce churn, improve the customer experience, and deliver a measurable business impact."
- **Narration**: "Thank you."
