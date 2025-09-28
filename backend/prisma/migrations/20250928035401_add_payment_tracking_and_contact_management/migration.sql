-- CreateEnum
CREATE TYPE "public"."PaymentTransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."ContactMethod" AS ENUM ('AI_CHAT', 'SMS', 'EMAIL', 'PHONE', 'WHATSAPP', 'PUSH_NOTIFICATION');

-- CreateEnum
CREATE TYPE "public"."ContactOutcome" AS ENUM ('SUCCESSFUL', 'NO_ANSWER', 'DECLINED', 'PAYMENT_RESOLVED', 'RESCHEDULED', 'DO_NOT_CONTACT');

-- CreateEnum
CREATE TYPE "public"."ContactRestrictionType" AS ENUM ('TEMPORARY_COOLDOWN', 'DO_NOT_CONTACT', 'PREFERRED_HOURS_ONLY', 'PAYMENT_RESOLVED', 'CUSTOMER_REQUEST');

-- CreateTable
CREATE TABLE "public"."payment_transactions" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "status" "public"."PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "paymentMethodId" TEXT,
    "billingPeriodStart" TIMESTAMP(3),
    "billingPeriodEnd" TIMESTAMP(3),
    "description" TEXT,
    "externalId" VARCHAR(255),
    "failureReason" TEXT,
    "refundAmount" DECIMAL(10,2),
    "refundDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customer_contact_log" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "contactMethod" "public"."ContactMethod" NOT NULL,
    "contactDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" "public"."ContactOutcome",
    "notes" TEXT,
    "agentId" VARCHAR(100),
    "sessionId" VARCHAR(255),
    "contactDuration" INTEGER,
    "nextContactDate" TIMESTAMP(3),
    "successful" BOOLEAN NOT NULL DEFAULT false,
    "paymentResolved" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_contact_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_due" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidDate" TIMESTAMP(3),
    "paidAmount" DECIMAL(10,2),
    "paymentTransactionId" TEXT,
    "overdueRemindersSent" INTEGER NOT NULL DEFAULT 0,
    "lastReminderDate" TIMESTAMP(3),
    "gracePeriodEnd" TIMESTAMP(3),
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_due_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contact_restrictions" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "restrictionType" "public"."ContactRestrictionType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "reason" TEXT,
    "appliedBy" VARCHAR(100),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_transactions_customerId_idx" ON "public"."payment_transactions"("customerId");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "public"."payment_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_transactionDate_idx" ON "public"."payment_transactions"("transactionDate");

-- CreateIndex
CREATE INDEX "payment_transactions_dueDate_idx" ON "public"."payment_transactions"("dueDate");

-- CreateIndex
CREATE INDEX "payment_transactions_paidDate_idx" ON "public"."payment_transactions"("paidDate");

-- CreateIndex
CREATE INDEX "payment_transactions_externalId_idx" ON "public"."payment_transactions"("externalId");

-- CreateIndex
CREATE INDEX "customer_contact_log_customerId_idx" ON "public"."customer_contact_log"("customerId");

-- CreateIndex
CREATE INDEX "customer_contact_log_contactDate_idx" ON "public"."customer_contact_log"("contactDate");

-- CreateIndex
CREATE INDEX "customer_contact_log_contactMethod_idx" ON "public"."customer_contact_log"("contactMethod");

-- CreateIndex
CREATE INDEX "customer_contact_log_outcome_idx" ON "public"."customer_contact_log"("outcome");

-- CreateIndex
CREATE INDEX "customer_contact_log_nextContactDate_idx" ON "public"."customer_contact_log"("nextContactDate");

-- CreateIndex
CREATE UNIQUE INDEX "payment_due_paymentTransactionId_key" ON "public"."payment_due"("paymentTransactionId");

-- CreateIndex
CREATE INDEX "payment_due_customerId_idx" ON "public"."payment_due"("customerId");

-- CreateIndex
CREATE INDEX "payment_due_dueDate_idx" ON "public"."payment_due"("dueDate");

-- CreateIndex
CREATE INDEX "payment_due_isPaid_idx" ON "public"."payment_due"("isPaid");

-- CreateIndex
CREATE INDEX "payment_due_isOverdue_idx" ON "public"."payment_due"("isOverdue");

-- CreateIndex
CREATE INDEX "payment_due_gracePeriodEnd_idx" ON "public"."payment_due"("gracePeriodEnd");

-- CreateIndex
CREATE INDEX "contact_restrictions_customerId_idx" ON "public"."contact_restrictions"("customerId");

-- CreateIndex
CREATE INDEX "contact_restrictions_restrictionType_idx" ON "public"."contact_restrictions"("restrictionType");

-- CreateIndex
CREATE INDEX "contact_restrictions_startDate_idx" ON "public"."contact_restrictions"("startDate");

-- CreateIndex
CREATE INDEX "contact_restrictions_endDate_idx" ON "public"."contact_restrictions"("endDate");

-- CreateIndex
CREATE INDEX "contact_restrictions_isActive_idx" ON "public"."contact_restrictions"("isActive");

-- AddForeignKey
ALTER TABLE "public"."payment_transactions" ADD CONSTRAINT "payment_transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_transactions" ADD CONSTRAINT "payment_transactions_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_contact_log" ADD CONSTRAINT "customer_contact_log_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_due" ADD CONSTRAINT "payment_due_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_due" ADD CONSTRAINT "payment_due_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "public"."payment_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_restrictions" ADD CONSTRAINT "contact_restrictions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
