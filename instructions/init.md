# Multi-Agent System Initialization Prompt

You are the system architect for this repository.

The project already contains:

- instructions/design-plan.md
- instructions/dev-plan.md
- instructions/dev-price-management.md
- instructions/plan.md

Your task is to:

1. Analyze all existing documents.
2. Extract architectural constraints, cost principles, and system goals.
3. Design and generate a structured multi-agent system for Claude Code.
4. Ensure the "Zero-Cost Convergence Principle" is enforced across all agents.

---

# Core Constitutional Rule (Non-Negotiable)

Infrastructure cost must converge toward 0.
All agents must:
- Prefer free-tier infrastructure.
- Prefer static generation over runtime computation.
- Prefer caching over repeated computation.
- Avoid paid external SaaS unless explicitly approved.

This rule overrides optimization, elegance, or scalability concerns.

---

# Required Artifacts

## 1. Create CLAUDE.md

This file must:
- Define system purpose.
- Define architectural boundaries.
- Define cost constraints.
- Define agent orchestration rules.
- Define how agents collaborate.
- Define escalation and conflict resolution between agents.

---

# 2. Create the Following Sub Agents

Each agent must have:
- Clear scope
- Inputs
- Outputs
- Non-responsibilities
- Cost awareness rules

---

## A. Design Agent (System Architecture Design)

### Scope
- Define system architecture and module boundaries
- Design data flow including RAG pipeline stages
- Define state transition model (server, cache, static/dynamic)
- Define API schema and data contracts
- Establish static-first architectural decisions

### Constraint
- Must enforce zero-cost convergence principle
- Must prefer static generation over runtime execution
- Must require caching strategy for any LLM or DB call
- Must not introduce paid infrastructure or SaaS
- Must minimize Supabase and OpenAI call frequency

---

## B. Design Agent (UI/UX & Visual Design) - Future Expansion

**I will give you a picture for design pages which i want to mimic. So just make empty agent file**

### Scope
- Define page structure and screen composition
- Design interaction model and primary user flows
- Define UI state transitions
- Establish information hierarchy and content priority
- Integrate RAG experience (query → response → source display)

### Constraint
- Must align with static-first rendering strategy
- Must minimize unnecessary server round-trips
- Must design LLM UX assuming response caching
- Must avoid real-time features unless cost-justified
- Must keep bundle size and dynamic behavior minimal

---

## C. Test Agent
Scope:
- Unit tests
- Integration tests
- RAG behavior validation
- Regression tests

Constraint:
- Avoid external paid testing services
- Prefer local test frameworks

---

## D. Code Quality Agent
Scope:
- Linting
- Formatting
- Type safety
- Naming conventions
- Architecture consistency

Constraint:
- Use open-source tools only
- Enforce consistency without introducing paid tooling

---

## E. Cost Optimization Agent
Scope:
- Caching strategies (Edge, ISR, DB-level)
- Image optimization
- Token minimization strategies
- LLM call deduplication
- Build optimization
- Static vs dynamic trade-off analysis

This agent has veto power if a feature violates cost principles.

---

## F. Documentation Agent
Scope:
- Keep docs synchronized with architecture
- Update markdown specs
- Maintain change logs
- Generate developer onboarding docs

---

## G. Security Agent
Scope:
- Supabase policy validation
- RLS policy checks
- API exposure audit
- Prompt injection mitigation
- Rate limiting strategy

Constraint:
- No paid security SaaS
- Must operate within existing stack

---

## H. Deployment Automation Agent
Scope:
- Vercel configuration
- Environment variable management
- CI/CD strategy (free-tier only)
- Build optimization

Constraint:
- Must avoid paid CI services

---

## I. VCS & History Management Agent
Scope:
- Commit structure strategy
- Conventional commit enforcement
- Branching model
- Release tagging

Constraint:
- Git-native, no paid tooling

---

## J. Refactoring Agent
Scope:
- Detect code duplication
- Improve modularity
- Reduce runtime cost
- Simplify architecture

Constraint:
- Must not introduce architectural complexity
- Must validate cost impact before refactor

---

# Deliverables

1. CLAUDE.md
2. agents/ directory structure
3. Each agent specification in markdown
4. Clear orchestration model:
   - When each agent activates
   - Which agent reviews which output
   - Conflict resolution rules

---

# Evaluation Criteria

The multi-agent system must:

- Minimize cognitive overload.
- Avoid over-engineering.
- Maintain strict cost discipline.
- Be compatible with:
  - Next.js
  - Supabase
  - OpenAI API
  - Serverless deployment

---

Produce structured output only.
No marketing language.
No vague descriptions.
Be operationally precise.

---

make all documents in Korean