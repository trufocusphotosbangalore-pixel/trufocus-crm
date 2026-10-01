# Trufocus CRM Master Architecture

## 1. Architecture Principles

Trufocus CRM is built for enterprise-grade SaaS delivery, extensibility, and operational resilience. The architecture must align with strategic product goals: a modular platform, domain-driven ownership, secure data flow, adaptable AI services, and consistent multi-tenant behavior.

Principles:
- Single Source of Truth: Business data must be persisted in Supabase and surfaced through controlled service APIs. UI state is transient and derived from canonical backend data.
- Domain Driven Design: Organize around business domains (Customer, Work Order, Gallery, AI, Finance, Portal). Each domain owns its entities, behavior, and contracts.
- Service Layer: Expose domain operations through explicit services. Components must call services, not query data stores directly.
- Repository Pattern: Services interact with repositories to isolate persistence details, enabling testability and future backend changes.
- SOLID Principles: Maintain single responsibility, open-closed extensity, interface abstraction, dependency inversion, and composable units.
- Clean Architecture: Separate layers for UI, application services, domain logic, and infrastructure. No domain logic in React components.
- Modular Design: Each feature module is self-contained and reusable. Modules should be bounded contexts with minimal coupling.
- SaaS Ready: Support tenancy, subscriptions, branding, storage isolation, and extensible workspace configuration from day one.
- AI First: Design AI as a secure, permission-aware platform service. AI features must obey the same domain and security rules as core CRM operations.

## 2. Folder Structure

The canonical frontend structure for Trufocus CRM should be:

```
src/
  app/
    App.tsx
    routes.tsx
    providers/
      AuthProvider.tsx
      PermissionProvider.tsx
      RealtimeProvider.tsx
      ToastProvider.tsx
  components/
    common/
    layout/
    ui/
  features/
    auth/
    customers/
    enquiries/
    quotations/
    workorders/
    assignments/
    finance/
    gallery/
    postproduction/
    album/
    notifications/
    reports/
    portal/
    settings/
    team/
    ai/
  services/
    authService.ts
    customerService.ts
    enquiryService.ts
    quotationService.ts
    workOrderService.ts
    assignmentService.ts
    financeService.ts
    galleryService.ts
    postProductionService.ts
    aiService.ts
    permissionService.ts
    notificationService.ts
    calendarService.ts
    tenantService.ts
    auditLogService.ts
  repositories/
    authRepository.ts
    customerRepository.ts
    enquiryRepository.ts
    workOrderRepository.ts
    financeRepository.ts
    galleryRepository.ts
    aiRepository.ts
    tenantRepository.ts
  hooks/
    useAuth.ts
    usePermission.ts
    useRealtime.ts
    useQueryState.ts
  contexts/
    AuthContext.tsx
    PermissionContext.tsx
    RealtimeContext.tsx
  types/
    auth.ts
    business.ts
    customer.ts
    enquiry.ts
    finance.ts
    gallery.ts
    ai.ts
    tenant.ts
    ui.ts
  utils/
    cn.ts
    date.ts
    validation.ts
    api.ts

  lib/
    constants.ts
    schema.ts
    factory.ts
  supabase/
    client.ts
    schema/
    migrations/
    helpers.ts
```

## 3. Module Boundaries

Each module is a bounded context with defined ownership and strict access rules.

- auth
  - Owns: login flow, session lifecycle, identity management, employee profiles, tenant identity.
  - Cannot access: business domain logic directly, UI rendering concerns, other module state without service interfaces.

- customers
  - Owns: customer records, contacts, sales accounts, customer portal relationships.
  - Cannot access: work order processing, gallery culling, finance calculations except through service contracts.

- enquiries
  - Owns: inquiry intake, status tracking, campaign source, lead lifecycle.
  - Cannot access: final invoices, gallery assets, AI processing unless mediated by EnquiryService APIs.

- quotations
  - Owns: quote creation, pricing line items, approval status, versioning.
  - Cannot access: work order execution details, financial reporting, storage credentials.

- workorders
  - Owns: job scheduling, crew assignment, tasks, scopes, delivery milestones.
  - Cannot access: tenant billing, portal authentication, AI model orchestration directly.

- assignments
  - Owns: team member roles, crew distribution, shift planning, task handoff.
  - Cannot access: sensitive finance aggregates, gallery asset ingestion logic.

- finance
  - Owns: invoices, payments, subscriptions, refunds, tax rules, financial reports.
  - Cannot access: gallery asset metadata, AI prompt processing except through event-driven service interactions.

- gallery
  - Owns: asset metadata, albums, storage references, gallery sharing, image lifecycle.
  - Cannot access: customer billing, AI decisioning rules, tenant billing metadata except through services.

- postproduction
  - Owns: editing pipelines, deliverable status, job cards, revision cycles.
  - Cannot access: prospect pipeline, accounting ledgers, auth infrastructure.

- portal
  - Owns: customer portal session, portal-specific workflows, secure portal sharing, portal preferences.
  - Cannot access: internal admin routes, audit configuration, gallery admin tools.

- settings
  - Owns: global application settings, tenant branding, notification preferences.
  - Cannot access: business data beyond configuration scope.

- team
  - Owns: employee directory, team permissions, access roles.
  - Cannot access: tenant subscription enforcement, audit logs outside permission evaluation.

- ai
  - Owns: AI tasks, model orchestration, prompt templates, AI audit logs, AI permission gating.
  - Cannot access: raw employee credentials, direct Supabase secrets, or unmanaged third-party services.

## 4. Service Layer

Each service owns one domain and exposes a stable API for the UI and integration layers.

- AuthService
  - Responsibilities: login, logout, session refresh, passwordless auth, employee identity, tenant context.
  - Use: all auth interactions and identity validation.

- EmployeeService
  - Responsibilities: employee profiles, team assignments, status, role metadata.
  - Use: team member operations and permission mapping.

- CustomerService
  - Responsibilities: customer records, contact management, account lifecycle, customer-portal links.
  - Use: customer-facing and internal customer data handling.

- EnquiryService
  - Responsibilities: enquiry intake, lead routing, status updates, conversion events.
  - Use: sales and intake workflows.

- QuotationService
  - Responsibilities: quote generation, price line management, approvals, version history.
  - Use: sales quoting and proposal workflows.

- WorkOrderService
  - Responsibilities: work order creation, scheduling, task breakdown, delivery, completion.
  - Use: field operations and execution.

- AssignmentService
  - Responsibilities: crew assignment, role routing, availability checks, notifications.
  - Use: team planning and resource distribution.

- FinanceService
  - Responsibilities: invoices, payments, subscriptions, tax, financial reporting, reconciliation.
  - Use: accounting operations and subscription billing.

- GalleryService
  - Responsibilities: image/asset metadata, album organization, sharing, gallery settings.
  - Use: visual asset workflows and online galleries.

- PostProductionService
  - Responsibilities: retouch workflows, deliverables, revision tracking, client approvals.
  - Use: post-production task and delivery management.

- AIService
  - Responsibilities: AI task orchestration, prompt handling, model selection, tool calling, audit capture.
  - Use: AI-assisted workflows, recommendations, and automation.

- PermissionService
  - Responsibilities: permission evaluation, route control, UI affordances, enforcement scope.
  - Use: all permission decisions.

- NotificationService
  - Responsibilities: event notifications, emails, in-app alerts, delivery scheduling.
  - Use: system communications and user notifications.

- CalendarService
  - Responsibilities: scheduling sync, calendar events, reminders, availability windows.
  - Use: operational scheduling and sync with external calendars.

- TenantService
  - Responsibilities: tenant lifecycle, branding, subscription status, storage quotas.
  - Use: tenant-level SaaS orchestration.

- AuditLogService
  - Responsibilities: immutable audit records, action provenance, AI request logs.
  - Use: compliance, security, and operational traceability.

## 5. Authentication Architecture

Trufocus CRM uses a single authentication path with Supabase Auth as the canonical identity provider.

- One login system.
- Supabase Auth is the source of truth for credentials and sessions.
- One employee identity per user session; no duplicate auth stores.
- No browser-only auth patterns. The browser consumes authenticated tokens from Supabase and validates through services.
- AuthService abstracts Supabase interactions. UI components never call Supabase directly.
- Session state is ephemeral in memory and derived from the authenticated Supabase session.
- Tenant context is tied to employee identity and resolved immediately after login.

## 6. Permission Engine

Permission enforcement is centralized and consistent across the platform.

- PermissionService is the only source of truth for role checks.
- Permissions control:
  - Sidebar visibility
  - Route access
  - Button rendering and enabled/disabled state
  - CRUD operations
  - API access
  - AI feature availability
- No component checks roles directly.
- Components query PermissionService or use declarative permission hooks.
- Permission evaluation occurs before render and before business operations execute.
- Permissions are expressed as domain actions and resource scopes, not hardcoded role strings.
- PermissionService also supports dynamic feature gating for AI, gallery, portal, and automation modules.

## 7. State Management

State is intentionally partitioned by scope and persistence.

- Zustand
  - Use for ephemeral UI state and app-level state that does not require persistence.
  - Examples: active sidebar section, modal open state, client-side filters, UI preferences.
  - Do not store business entities in Zustand except when temporarily caching a UI form draft.

- React Query
  - Use for server-derived data and async domain queries.
  - Examples: customer lists, work order details, gallery assets, subscriptions.
  - React Query is the cache for backend-sourced data and handles invalidation, polling, retries.

- Supabase
  - Use as the canonical persistence layer for business data.
  - All domain data changes are persisted through service/repository layers, never through direct localStorage writes.
  - Browser memory and React Query caches are derived from Supabase data.

- No duplicated state.
  - Business data must not be stored in both Supabase and localStorage.
  - LocalStorage may be used only for non-business user preferences and UI settings with explicit expiration rules.
  - State sync is one-way from backend -> client cache, with writes flowing through services.

## 8. Synchronization

Realtime sync is mandatory for collaborative SaaS behavior.

- Every browser.
- Every computer.
- Same shared data across sessions.
- No localStorage for business data.

Design:
- RealtimeProvider subscribes to Supabase realtime events for owned tables.
- Services submit changes to Supabase and then update local query cache.
- Realtime events refresh affected queries across open sessions.
- Conflicts are resolved by domain logic and last-write rules with audit logging.
- Service layer owns sync decisions, not components.

## 9. Database Ownership

Every table belongs to one module and one owner.

- auth tables: users, tenant_users, sessions, roles, role_permissions
- customer tables: customers, customer_contacts, customer_portal_links
- enquiry tables: enquiries, enquiry_sources, enquiry_status_history
- quotation tables: quotations, quotation_items, quotation_versions
- work order tables: work_orders, work_order_tasks, work_order_timeline
- assignment tables: assignments, team_availability, assignment_history
- finance tables: invoices, payments, subscriptions, taxes
- gallery tables: gallery_assets, albums, gallery_shares
- postproduction tables: post_production_jobs, revisions, delivery_status
- ai tables: ai_requests, ai_responses, ai_audit_logs, ai_templates
- tenant tables: tenants, tenant_branding, tenant_settings, tenant_storage
- notification tables: notifications, notification_preferences
- audit tables: audit_logs, security_events

No duplicate ownership. If a feature needs data from another module, it does so through the owning service API.

## 10. AI Architecture

AI is a first-class platform service.

- Trufocus AI is implemented through AIService.
- Tool calling is explicit: AI operations may invoke domain tools such as GalleryTool, WorkOrderTool, FinanceTool under controlled contracts.
- Permission enforcement is required for all AI actions.
- AI requests and responses are recorded in AI audit logs.
- AI outputs are treated as suggestions unless explicitly accepted.
- Business intelligence is derived from AI activity, workflow data, and audit reports.
- AIService includes:
  - request validation
  - permission checks
  - prompt template resolution
  - tool invocation orchestration
  - response sanitization
  - audit logging

## 11. SaaS Architecture

The SaaS foundation must support multiple tenants, flexible branding, and subscription controls.

- Tenant is the top-level logical container.
- Company represents the customer organization within a tenant.
- Branding is tenant-scoped and includes logos, color palettes, domain names, custom portal URLs.
- Subscription manages plan level, feature entitlements, quotas, and billing status.
- Storage is tenant-scoped with quotas for gallery assets and AI usage.
- Domains support custom portal domains and white-labeling.
- White Label: enable customer-facing portal branding and optional domain isolation.
- TenantService manages onboarding, plan changes, trial status, and tenant-specific feature flags.

## 12. Security

Security is foundational and non-negotiable.

- Authentication: Supabase Auth with secure token handling and session management.
- Authorization: PermissionService enforces resource-level access for UI and API.
- Audit Logs: Immutable records for identity, data changes, AI requests, and security events.
- Encryption: Protect stored secrets and sensitive fields in transit and at rest. Use encrypted storage for API keys and service secrets.
- Secrets: Keep secrets out of source control. Use environment variables and vault integration for deployment.
- API Security: Validate all inbound requests, enforce auth tokens, and apply rate-limits for sensitive endpoints.
- UI must never assume authorization; all critical operations require PermissionService validation.

## 13. Development Rules

A consistent engineering culture ensures quality.

- Coding standards: TypeScript 6, React 19, strict typing, no `any` without justification.
- Folder standards: follow the defined module structure and keep feature logic encapsulated.
- Naming conventions: domain-first names, `Service` suffix for services, `Repository` suffix for persistence adapters, `useX` for hooks, `XContext` for contexts.
- Git workflow: use short-lived feature branches, descriptive commit messages, PRs with clear summaries and acceptance criteria.
- Commit standards: one logical change per commit, reference issue or ticket when applicable.
- Testing: unit tests for services and hooks, integration tests for critical flows, regression tests for permission and auth.
- Documentation: update architecture docs whenever adding or changing modules, services, APIs, or tenant behavior.

## 14. Future Expansion

Plan for product growth by design.

- Gallery: advanced asset lifecycle, album automation, client galleries, storage tiering.
- AI Culling: smart image selection, auto-tagging, quality scoring, workflow integration.
- WhatsApp: notifications, approvals, portal links, and business messaging.
- Payroll: team payroll, contractor payments, labor costing, payroll reporting.
- Inventory: equipment, consumables, order tracking, stock reconciliation.
- Equipment: gear management, asset allocation, maintenance scheduling.
- API: public and partner APIs for integrations, webhook subscriptions, headless access.
- Mobile App: progressive mobile-first workflows, offline support, field worker check-in, camera upload.

---

This Master Architecture document is the standard for Trufocus CRM development and will guide the engineering team through SaaS evolution, AI integration, and enterprise-scale product delivery.
