<!--
Sync Impact Report:
Version change: N/A → 1.0.0
Modified principles: All principles are new (initial constitution)
Added sections: Core Principles (5 principles), POC Development Guidelines, Demo Requirements, Governance
Removed sections: None (new constitution)
Templates requiring updates:
  ✅ .specify/templates/plan-template.md - constitution check aligned
  ✅ .specify/templates/spec-template.md - requirement types compatible
  ✅ .specify/templates/tasks-template.md - task categorization compatible
Follow-up TODOs: None
-->

# Bemobi POC Constitution

## Core Principles

### I. Working Payment Integration (NON-NEGOTIABLE)
Payment processing MUST be functional in test mode before any other features. All payment flows MUST be demonstrable with real API calls using test credentials. Mock payments are forbidden - integration with actual payment providers (Stripe test mode, PayPal sandbox) is mandatory. Payment failure scenarios MUST be handled gracefully with clear user feedback.

**Rationale**: Payment functionality is the core value proposition and cannot be simulated for credible demonstration.

### II. Natural Conversation Flow
User interactions MUST feel conversational, not form-based or robotic. Chat interfaces MUST support context awareness, natural language processing, and human-like responses. Avoid rigid command structures, multi-step wizards, or technical jargon in user-facing interactions. Conversations MUST flow naturally with appropriate follow-up questions and confirmations.

**Rationale**: Natural conversation distinguishes this POC from traditional interfaces and demonstrates AI-powered engagement value.

### III. Demonstrable Churn Prevention
The demo MUST show measurable value in reducing customer churn within 5 minutes. Include mock but realistic customer data showing before/after metrics, retention rates, or engagement improvements. All claims MUST be backed by visible data or simulated scenarios that would be convincing to stakeholders.

**Rationale**: Business value must be immediately apparent to justify further investment in the concept.

### IV. Functional Core Over Polish
Prioritize working features over visual design, animations, or advanced UI. Core functionality MUST work end-to-end even if the interface is basic. Focus on MVP features that demonstrate the concept rather than production-ready polish. Technical debt is acceptable if it doesn't impact core demonstration flows.

**Rationale**: POC success is measured by concept validation, not production readiness.

### V. 5-Minute Demo Constraint
Every feature MUST contribute to a cohesive 5-minute demonstration. If a feature cannot be shown and explained within the demo timeframe, it should be removed. Demo flow MUST be rehearsable, predictable, and robust under presentation conditions.

**Rationale**: POC effectiveness is constrained by presentation time and attention spans.

## POC Development Guidelines

**Mock Data Requirements**: All demo data MUST appear realistic and relevant to the target market. Use representative customer names, realistic transaction amounts, and believable scenarios. Avoid obviously fake data (e.g., "John Doe", $999999 amounts) that undermines credibility.

**Security in Test Mode**: Payment integrations MUST use official test/sandbox environments only. Never use production credentials or real payment processing. All API keys and credentials MUST be properly configured for development environments with appropriate access restrictions.

**Architecture Simplicity**: Choose simple, well-documented technologies that can be implemented quickly. Prefer monolithic architecture over microservices. Use established frameworks and libraries rather than custom solutions. Database schema should be minimal and focused on demo requirements only.

## Demo Requirements

**Technical Performance**: Demo MUST run reliably on presenter's machine without internet dependencies where possible. Payment API calls should have fallback responses for connectivity issues. All demo paths MUST be tested multiple times before presentation.

**Narrative Flow**: Demo MUST tell a coherent story from problem identification through solution demonstration to measurable outcomes. Each feature shown MUST connect to the overall value proposition. Prepare smooth transitions between demo segments.

**Stakeholder Focus**: Demo content MUST be tailored for business stakeholders, not technical audiences. Emphasize business metrics, user experience improvements, and ROI potential rather than technical implementation details.

## Governance

This constitution supersedes all other development practices during POC development. All code reviews and feature decisions MUST verify compliance with these principles. Complexity MUST be justified against the 5-minute demo constraint.

Any team member MAY propose amendments through documentation and team approval. All amendments require migration plan for existing features to maintain constitutional compliance.

**Version**: 1.0.0 | **Ratified**: 2025-09-27 | **Last Amended**: 2025-09-27