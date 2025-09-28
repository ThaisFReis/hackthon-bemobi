-- CreateEnum
CREATE TYPE "public"."AccountStatus" AS ENUM ('ACTIVE', 'AT_RISK', 'CHURNED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."RiskCategory" AS ENUM ('PAYMENT_FAILED', 'MULTIPLE_FAILURES', 'HIGH_VALUE', 'LOW_ENGAGEMENT');

-- CreateEnum
CREATE TYPE "public"."RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "public"."PaymentStatusType" AS ENUM ('SUCCESS', 'FAILED', 'PENDING', 'BLOCKED');

-- CreateEnum
CREATE TYPE "public"."FailureReason" AS ENUM ('INSUFFICIENT_FUNDS', 'CARD_EXPIRED', 'CARD_DECLINED', 'INVALID_CARD', 'BANK_ERROR', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."ChatSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "public"."MessageSender" AS ENUM ('AI', 'CUSTOMER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'AUDIO', 'SYSTEM', 'PAYMENT_LINK', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "public"."InterventionOutcome" AS ENUM ('SUCCESS', 'FAILED', 'NO_ANSWER', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "public"."CardType" AS ENUM ('VISA', 'MASTERCARD', 'AMEX', 'ELO', 'HIPERCARD');

-- CreateTable
CREATE TABLE "public"."customers" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "serviceProvider" VARCHAR(100) NOT NULL,
    "serviceType" VARCHAR(255) NOT NULL,
    "accountValue" DECIMAL(10,2) NOT NULL,
    "riskCategory" "public"."RiskCategory" NOT NULL,
    "riskSeverity" "public"."RiskSeverity" NOT NULL,
    "accountStatus" "public"."AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingCycle" "public"."BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "lastPaymentDate" TIMESTAMP(3),
    "nextBillingDate" TIMESTAMP(3) NOT NULL,
    "customerSince" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_methods" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "paymentToken" VARCHAR(255) NOT NULL,
    "paymentMethodType" VARCHAR(50) NOT NULL,
    "displayName" VARCHAR(100),
    "status" "public"."PaymentStatusType" NOT NULL DEFAULT 'PENDING',
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastFailureDate" TIMESTAMP(3),
    "lastSuccessDate" TIMESTAMP(3),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "processorId" VARCHAR(100),
    "fingerprint" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_status" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "public"."PaymentStatusType" NOT NULL,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastFailureDate" TIMESTAMP(3),
    "lastSuccessDate" TIMESTAMP(3),
    "failureReason" "public"."FailureReason",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."risk_factors" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "factor" VARCHAR(100) NOT NULL,
    "weight" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_sessions" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" VARCHAR(255) NOT NULL,
    "status" "public"."ChatSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "paymentIssue" TEXT,
    "outcome" TEXT,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_messages" (
    "id" TEXT NOT NULL,
    "chatSessionId" TEXT NOT NULL,
    "sender" "public"."MessageSender" NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."interventions" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" "public"."InterventionOutcome" NOT NULL,
    "notes" TEXT,
    "revenueRecovered" DECIMAL(10,2),
    "agentId" VARCHAR(100),
    "duration" INTEGER,

    CONSTRAINT "interventions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "public"."customers"("email");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "public"."customers"("email");

-- CreateIndex
CREATE INDEX "customers_accountStatus_idx" ON "public"."customers"("accountStatus");

-- CreateIndex
CREATE INDEX "customers_riskCategory_riskSeverity_idx" ON "public"."customers"("riskCategory", "riskSeverity");

-- CreateIndex
CREATE INDEX "customers_nextBillingDate_idx" ON "public"."customers"("nextBillingDate");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_paymentToken_key" ON "public"."payment_methods"("paymentToken");

-- CreateIndex
CREATE INDEX "payment_methods_customerId_idx" ON "public"."payment_methods"("customerId");

-- CreateIndex
CREATE INDEX "payment_methods_status_idx" ON "public"."payment_methods"("status");

-- CreateIndex
CREATE INDEX "payment_methods_paymentToken_idx" ON "public"."payment_methods"("paymentToken");

-- CreateIndex
CREATE UNIQUE INDEX "payment_status_customerId_key" ON "public"."payment_status"("customerId");

-- CreateIndex
CREATE INDEX "payment_status_status_idx" ON "public"."payment_status"("status");

-- CreateIndex
CREATE INDEX "risk_factors_customerId_idx" ON "public"."risk_factors"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "risk_factors_customerId_factor_key" ON "public"."risk_factors"("customerId", "factor");

-- CreateIndex
CREATE INDEX "chat_sessions_customerId_idx" ON "public"."chat_sessions"("customerId");

-- CreateIndex
CREATE INDEX "chat_sessions_status_idx" ON "public"."chat_sessions"("status");

-- CreateIndex
CREATE INDEX "chat_sessions_startTime_idx" ON "public"."chat_sessions"("startTime");

-- CreateIndex
CREATE INDEX "chat_messages_chatSessionId_idx" ON "public"."chat_messages"("chatSessionId");

-- CreateIndex
CREATE INDEX "chat_messages_timestamp_idx" ON "public"."chat_messages"("timestamp");

-- CreateIndex
CREATE INDEX "interventions_customerId_idx" ON "public"."interventions"("customerId");

-- CreateIndex
CREATE INDEX "interventions_date_idx" ON "public"."interventions"("date");

-- CreateIndex
CREATE INDEX "interventions_outcome_idx" ON "public"."interventions"("outcome");

-- AddForeignKey
ALTER TABLE "public"."payment_methods" ADD CONSTRAINT "payment_methods_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_status" ADD CONSTRAINT "payment_status_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."risk_factors" ADD CONSTRAINT "risk_factors_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_sessions" ADD CONSTRAINT "chat_sessions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "public"."chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interventions" ADD CONSTRAINT "interventions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
