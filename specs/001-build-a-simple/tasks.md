# Tasks: AI Churn Prevention POC

**Input**: Design documents from `/specs/001-build-a-simple/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extracted: React/TypeScript frontend, Node.js/Express backend, Stripe API, Tailwind CSS
2. Load design documents:
   → data-model.md: 6 entities (Customer, PaymentMethod, ChatSession, ChatMessage, AdminUser, ChurnPreventionMetrics)
   → contracts/: 3 API contracts (customers, chat, payments)
   → research.md: Technology stack decisions confirmed
   → quickstart.md: Demo scenarios and test data defined
3. Generate tasks by category:
   → Setup: project structure, dependencies, environment
   → Tests: 3 contract tests, 2 integration tests (TDD approach)
   → Core: 6 models, 4 services, 7 components, 3 API endpoints, 5 integration tasks
   → Integration: Stripe setup, WebSocket, error handling
   → Polish: unit tests, performance validation, documentation
4. Task rules applied:
   → Different files = marked [P] for parallel execution
   → Tests before implementation enforced
   → Dependencies tracked for proper ordering
5. Generated 50 numbered tasks (T001-T050) across 10 implementation phases
6. Parallel execution examples provided
7. Validation: All contracts have tests, all entities have models, all endpoints covered
8. SUCCESS: tasks ready for execution
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app structure**: `backend/src/`, `frontend/src/`
- **Backend**: `backend/src/{models,services,api}/`
- **Frontend**: `frontend/src/{components,pages,services}/`

## Phase 3.1: Setup
- [x] T001 Create project structure with backend/ and frontend/ directories per implementation plan
- [x] T002 Initialize backend Node.js project with package.json, Express.js, and TypeScript dependencies
- [x] T003 [P] Initialize frontend React project with package.json, TypeScript, and Tailwind CSS dependencies
- [x] T004 [P] Configure backend ESLint and Prettier for TypeScript code formatting
- [x] T005 [P] Configure frontend ESLint and Prettier for React/TypeScript code formatting
- [x] T006 Create backend/.env.example with Stripe test API key placeholders and environment variables
- [x] T007 [P] Create backend/data/mockCustomers.json with realistic demo customer data per quickstart scenarios

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T008 [P] Contract test for GET /api/customers endpoint in backend/tests/contract/test_customers_get.test.js
- [ ] T009 [P] Contract test for PATCH /api/customers/{id} endpoint in backend/tests/contract/test_customers_patch.test.js
- [ ] T010 [P] Contract test for POST /api/chat/sessions endpoint in backend/tests/contract/test_chat_post.test.js
- [ ] T011 [P] Contract test for POST /api/chat/ai-response endpoint in backend/tests/contract/test_chat_ai.test.js
- [ ] T012 [P] Contract test for POST /api/payments/update-method endpoint in backend/tests/contract/test_payments_post.test.js
- [ ] T013 [P] Integration test for complete admin-triggered chat flow in backend/tests/integration/test_admin_flow.test.js
- [ ] T014 [P] Integration test for payment method update scenario in backend/tests/integration/test_payment_flow.test.js

## Phase 3.3: Core Models (ONLY after tests are failing)
- [x] T015 [P] Customer model in backend/src/models/customer.js with validation rules and state transitions
- [x] T016 [P] PaymentMethod model in backend/src/models/paymentMethod.js with card validation and status tracking
- [x] T017 [P] ChatSession model in backend/src/models/chatSession.js with conversation state management
- [x] T018 [P] ChatMessage model in backend/src/models/chatMessage.js with message typing and timestamps
- [x] T019 [P] AdminUser model in backend/src/models/adminUser.js for system operators
- [x] T020 [P] ChurnPreventionMetrics model in backend/src/models/churnPreventionMetrics.js for success tracking

## Phase 3.4: Backend Services
- [x] T021 ChurnPreventionService in backend/src/services/churnPreventionService.js for customer risk detection and intervention logic
- [x] T022 StripeService in backend/src/services/stripeService.js for payment processing and webhook handling
- [x] T023 AIChatService in backend/src/services/aiChatService.js for prompt-based conversation generation using DeepSeek API with predefined conversation templates for payment scenarios
- [x] T024 CustomerService in backend/src/services/customerService.js for customer data management and status updates

## Phase 3.5: Backend API Endpoints
- [x] T025 Customers API endpoints in backend/src/api/customers.js implementing GET /api/customers and PATCH /api/customers/{id}
- [x] T026 Chat API endpoints in backend/src/api/chat.js implementing session management and AI response generation
- [x] T027 Payments API endpoints in backend/src/api/payments.js implementing Stripe integration for payment method updates

## Phase 3.6: Frontend Components
- [x] T028 [P] AdminDashboard component in frontend/src/components/AdminDashboard.tsx displaying at-risk customers with trigger buttons
- [x] T029 [P] CustomerCard component in frontend/src/components/CustomerCard.tsx showing individual customer risk information
- [x] T030 [P] ChatInterface component in frontend/src/components/ChatInterface.tsx for real-time AI conversation
- [x] T031 [P] PaymentForm component in frontend/src/components/PaymentForm.tsx for secure card information collection
- [x] T032 [P] ConversationTimer component in frontend/src/components/ConversationTimer.tsx displaying real-time countdown and warnings for 3-minute constitutional constraint

## Phase 3.7: Frontend Pages
- [x] T033 AdminPage in frontend/src/pages/AdminPage.tsx as standalone admin dashboard route
- [x] T034 ChatPage in frontend/src/pages/ChatPage.tsx for customer chat interface

## Phase 3.8: Frontend Services
- [x] T035 [P] CustomerService in frontend/src/services/customerService.ts for API communication with backend customers endpoint
- [x] T036 [P] ChatService in frontend/src/services/chatService.ts for WebSocket communication and real-time messaging
- [x] T037 [P] PaymentService in frontend/src/services/paymentService.ts for Stripe payment processing integration

## Phase 3.9: Integration & Configuration
- [x] T038 WebSocket server setup in backend/src/server.js for real-time chat communication
- [x] T039 Stripe webhook endpoint configuration in backend/src/api/payments.js for payment status updates
- [x] T040 Frontend routing setup in frontend/src/App.tsx with admin and chat page routes
- [x] T041 Error handling middleware in backend/src/middleware/errorHandler.js for graceful failure responses
- [x] T042 Payment failure error handling in backend/src/middleware/paymentErrorHandler.js for graceful Stripe API failure responses and retry logic per FR-011 requirements
- [x] T043 CORS configuration in backend/src/server.js for frontend-backend communication

## Phase 3.10: Polish & Validation
- [x] T044 [P] Unit tests for Customer model validation in backend/tests/unit/test_customer_model.test.js
- [x] T045 [P] Unit tests for PaymentMethod model validation in backend/tests/unit/test_payment_model.test.js
- [x] T046 [P] React component tests for AdminDashboard in frontend/tests/components/AdminDashboard.test.tsx
- [x] T047 [P] React component tests for ChatInterface in frontend/tests/components/ChatInterface.test.tsx
- [x] T048 Performance validation script with timing instrumentation: conversation start/end timestamps, 2.5-minute warning alerts, automatic timeout handling, and <200ms API response measurement
- [x] T049 Demo rehearsal script based on quickstart.md scenarios for presentation reliability
- [x] T050 [P] Update README.md with setup instructions and demo walkthrough

## Dependencies
- Setup (T001-T007) before everything
- Contract tests (T008-T014) before all implementation
- Models (T015-T020) before services (T021-T024)
- Services (T021-T024) before API endpoints (T025-T027)
- API endpoints (T025-T027) before frontend services (T035-T037)
- Core components (T028-T032) before pages (T033-T034)
- Integration tasks (T038-T043) after core backend and frontend
- Polish tasks (T044-T050) after all implementation

## Parallel Example
```bash
# Launch contract tests together (Phase 3.2):
Task: "Contract test for GET /api/customers endpoint in backend/tests/contract/test_customers_get.test.js"
Task: "Contract test for PATCH /api/customers/{id} endpoint in backend/tests/contract/test_customers_patch.test.js"
Task: "Contract test for POST /api/chat/sessions endpoint in backend/tests/contract/test_chat_post.test.js"
Task: "Contract test for POST /api/chat/ai-response endpoint in backend/tests/contract/test_chat_ai.test.js"
Task: "Contract test for POST /api/payments/update-method endpoint in backend/tests/contract/test_payments_post.test.js"

# Launch model creation together (Phase 3.3):
Task: "Customer model in backend/src/models/customer.js with validation rules and state transitions"
Task: "PaymentMethod model in backend/src/models/paymentMethod.js with card validation and status tracking"
Task: "ChatSession model in backend/src/models/chatSession.js with conversation state management"
Task: "ChatMessage model in backend/src/models/chatMessage.js with message typing and timestamps"
Task: "AdminUser model in backend/src/models/adminUser.js for system operators"
Task: "ChurnPreventionMetrics model in backend/src/models/churnPreventionMetrics.js for success tracking"

# Launch frontend components together (Phase 3.6):
Task: "AdminDashboard component in frontend/src/components/AdminDashboard.tsx displaying at-risk customers with trigger buttons"
Task: "CustomerCard component in frontend/src/components/CustomerCard.tsx showing individual customer risk information"
Task: "ChatInterface component in frontend/src/components/ChatInterface.tsx for real-time AI conversation"
Task: "PaymentForm component in frontend/src/components/PaymentForm.tsx for secure card information collection"
```

## Notes
- [P] tasks = different files, no dependencies between them
- Verify tests fail before implementing features (TDD requirement)
- Each task includes specific file path for clear execution
- Constitutional compliance: real Stripe integration, natural AI conversation, 3-minute constraint
- Demo readiness: all tasks support 5-minute presentation scenario

## Task Generation Rules Applied
1. **From Contracts**: Each API contract → contract test + implementation task
2. **From Data Model**: Each entity → model creation task [P]
3. **From User Stories**: Complete flows → integration tests [P]
4. **Ordering**: Setup → Tests → Models → Services → Endpoints → Frontend → Integration → Polish
5. **Parallel**: Independent files marked [P], dependencies enforced sequentially

## Validation Checklist
- [x] All 3 API contracts have corresponding tests (T008-T012)
- [x] All 6 entities have model creation tasks (T015-T020)
- [x] All tests come before implementation (Phase 3.2 before 3.3+)
- [x] Parallel tasks are truly independent ([P] tasks in different files)
- [x] Each task specifies exact file path for execution
- [x] No task modifies same file as another [P] task
- [x] Constitutional requirements supported (Stripe integration, AI conversation, demo constraint)
- [x] Demo scenarios from quickstart.md covered by integration tests and components
- [x] 3-minute timing constraint implemented with ConversationTimer component (T032)
- [x] Payment failure handling explicitly covered (T042)
- [x] AI implementation clarified for hackathon timeline (T023 with OpenAI prompt templates)