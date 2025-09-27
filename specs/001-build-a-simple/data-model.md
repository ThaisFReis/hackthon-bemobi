# Data Model: AI Churn Prevention POC

## Core Entities

### Customer
**Purpose**: Represents at-risk customers requiring churn prevention intervention

**Fields**:
- `id`: Unique identifier (string)
- `name`: Customer full name (string)
- `email`: Contact email address (string)
- `phone`: Contact phone number (string, optional)
- `accountStatus`: Current account standing (enum: "active", "at-risk", "resolved", "churned")
- `riskCategory`: Type of payment issue (enum: "expiring-card", "failed-payment")
- `riskSeverity`: Urgency level (enum: "low", "medium", "high")
- `lastPaymentDate`: Date of most recent successful payment (date)
- `accountValue`: Monthly subscription value (number)
- `customerSince`: Account creation date (date)

**Validation Rules**:
- `id` must be unique across all customers
- `email` must be valid email format
- `accountValue` must be positive number
- `riskCategory` limited to two supported scenarios per constitutional clarifications

**State Transitions**:
```
active → at-risk (when payment issue detected)
at-risk → resolved (when payment successfully updated)
at-risk → churned (when customer cancels or intervention fails)
resolved → at-risk (if new payment issues arise)
```

### PaymentMethod
**Purpose**: Stores customer payment information and status

**Fields**:
- `id`: Unique identifier (string)
- `customerId`: Reference to customer (string, foreign key)
- `cardType`: Credit card brand (enum: "visa", "mastercard", "amex", "discover")
- `lastFourDigits`: Last 4 digits of card number (string)
- `expiryMonth`: Card expiration month (number, 1-12)
- `expiryYear`: Card expiration year (number)
- `status`: Payment method status (enum: "active", "expired", "failed", "invalid")
- `failureCount`: Number of consecutive payment failures (number)
- `lastFailureDate`: Date of most recent failure (date, optional)
- `lastSuccessDate`: Date of most recent successful charge (date)

**Validation Rules**:
- `customerId` must reference existing customer
- `lastFourDigits` must be exactly 4 numeric characters
- `expiryMonth` must be 1-12
- `expiryYear` must be current year or future
- `failureCount` must be non-negative

**Relationships**:
- Belongs to one Customer (one-to-many relationship)

### ChatSession
**Purpose**: Tracks individual AI-customer conversation instances

**Fields**:
- `id`: Unique identifier (string)
- `customerId`: Reference to customer (string, foreign key)
- `adminUserId`: Admin who triggered the conversation (string)
- `status`: Current session state (enum: "initiated", "in-progress", "payment-requested", "payment-processing", "completed", "abandoned")
- `startTime`: When conversation began (timestamp)
- `endTime`: When conversation ended (timestamp, optional)
- `outcome`: Final result (enum: "payment-updated", "customer-declined", "technical-failure", "abandoned")
- `conversationHistory`: Array of message objects (array)
- `paymentAttempted`: Whether payment update was attempted (boolean)
- `resolutionTime`: Duration from start to completion (number, seconds)

**Validation Rules**:
- `customerId` must reference existing customer
- `startTime` required for all sessions
- `endTime` must be after `startTime` when present
- `resolutionTime` calculated from start/end times
- Constitutional requirement: must complete within 180 seconds (3 minutes)

**Relationships**:
- Belongs to one Customer (one-to-many relationship)
- Contains multiple ChatMessages (one-to-many relationship)

### ChatMessage
**Purpose**: Individual messages within a conversation

**Fields**:
- `id`: Unique identifier (string)
- `chatSessionId`: Reference to chat session (string, foreign key)
- `sender`: Message origin (enum: "ai", "customer")
- `content`: Message text content (string)
- `timestamp`: When message was sent (timestamp)
- `messageType`: Content classification (enum: "greeting", "question", "payment-request", "confirmation", "error")

**Validation Rules**:
- `chatSessionId` must reference existing chat session
- `content` cannot be empty
- `timestamp` must be within session timeframe
- Constitutional requirement: AI messages must feel natural, not robotic

**Relationships**:
- Belongs to one ChatSession (many-to-one relationship)

### AdminUser
**Purpose**: System operators who monitor and trigger interventions

**Fields**:
- `id`: Unique identifier (string)
- `name`: Admin name (string)
- `email`: Admin email (string)
- `role`: Access level (enum: "admin", "supervisor")
- `lastLoginTime`: Most recent session (timestamp)

**Validation Rules**:
- `email` must be unique and valid format
- POC scope: single admin user sufficient

### ChurnPreventionMetrics
**Purpose**: Success measurements and business impact data

**Fields**:
- `id`: Unique identifier (string)
- `periodStart`: Measurement period start (date)
- `periodEnd`: Measurement period end (date)
- `totalInterventions`: Number of conversations initiated (number)
- `successfulResolutions`: Number of payments updated (number)
- `averageResolutionTime`: Mean conversation duration (number, seconds)
- `customerRetentionRate`: Percentage prevented from churning (number, 0-100)
- `revenueRetained`: Dollar value of prevented churn (number)

**Validation Rules**:
- `periodEnd` must be after `periodStart`
- `successfulResolutions` cannot exceed `totalInterventions`
- `averageResolutionTime` must not exceed 180 seconds (constitutional requirement)
- Percentages must be 0-100 range

## Entity Relationships

```
Customer (1) → (many) PaymentMethod
Customer (1) → (many) ChatSession
ChatSession (1) → (many) ChatMessage
AdminUser (1) → (many) ChatSession (as trigger)
```

## Constitutional Compliance

- **Mock Data Realism**: All entities include fields for realistic demo data (customer names, amounts, dates)
- **3-Minute Constraint**: ChatSession model enforces resolution time limits
- **Two Risk Scenarios**: Customer.riskCategory limited to "expiring-card" and "failed-payment"
- **Demo Session Persistence**: ChatMessage history maintained during demo, cleared on restart
- **Payment Integration**: PaymentMethod model supports full Stripe API integration requirements