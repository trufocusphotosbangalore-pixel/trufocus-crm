# Trufocus CRM Database Architecture

## 1. Database Principles

This database architecture is the authoritative foundation for Trufocus CRM v2. The schema must support a multi-tenant SaaS platform for photography businesses, deliver strong data integrity, and scale to enterprise usage.

Principles:
- Single Source of Truth: Supabase is the only source of truth for all business and operational data. No browser-specific or local persistence of business entities.
- Normalization: Use normalized tables to eliminate duplication, maintain consistency, and make updates safe. Shared entities and reference tables are used instead of repeated data blobs.
- Referential Integrity: Every foreign key relationship must enforce referential integrity. Cascading behavior is explicit and controlled.
- Soft Delete: Use soft delete flags and deletion metadata for recoverability, auditability, and safe archiving.
- Audit Logs: Every business-changing event and AI action is captured in immutable audit tables with actor, timestamp, and context.
- Realtime Ready: Schema should support Supabase realtime subscriptions on domain tables with appropriately scoped keys and status fields.
- Multi-Tenant Ready: Every business feature is tenant-scoped via company_id. Tenant isolation is enforced at the schema and service layer.
- No duplicated ownership: Each table is owned by a single module and single domain service.
- No browser-specific data: Schema stores only business data and operational metadata. UI state and browser preferences remain out-of-scope.

## 2. Core Tables

### companies
- Owns tenant identity for photography businesses.
- Includes company metadata, brand name, contact information, plan level, storage quota, and status.
- Acts as the root tenant key for all business entities.

### company_settings
- Owns tenant-specific configuration and preferences.
- Stores branding options, gallery defaults, notification defaults, portal configuration, and feature flags.
- Includes company_id, settings namespace, and JSON payloads for extensibility.

### employees
- Owns internal users and team members for a company.
- Includes employee identity, email, display name, role assignment, active status, and auth metadata.
- Linked to workspace_roles and employee_permissions via company_id.

### workspace_roles
- Owns reusable role definitions per company.
- Defines role name, description, default status, and whether the role is system-managed.
- Role records are referenced by employees.

### module_permissions
- Owns permission templates for each module feature.
- Includes module name, permission key, description, and CRUD/AI capability flags.
- Serves as the permission catalog for the company.

### employee_permissions
- Owns explicit permission overrides for employees.
- Contains employee_id, permission_id, grant/revoke flag, and timestamp.
- Used to customize access beyond workspace_roles.

### customers
- Owns customer contacts and client relationships.
- Includes company_id, contact details, billing address, portal access flags, and lifecycle data.
- Used across enquiries, quotations, work orders, galleries, and invoices.

### enquiries
- Owns lead and inquiry records.
- Includes company_id, customer_id, source, status, assigned employee, estimated value, and conversion metadata.
- Bridges customer intake and sales workflows.

### quotations
- Owns quote records for prospective jobs.
- Includes company_id, customer_id, enquiry_id, status, total amount, validity dates, and approval metadata.

### quotation_items
- Owns line-item details for quotations.
- Includes quotation_id, service or product reference, quantity, unit price, tax, and subtotal.
- Keeps pricing normalized and auditable.

### work_orders
- Owns work order records for executed jobs.
- Includes company_id, customer_id, quotation_id, status, scheduled dates, location, and delivery expectations.
- Acts as the operational anchor for events, assignments, and deliverables.

### work_order_services
- Owns service line items and job packages associated with a work order.
- Includes work_order_id, service_type, quantity, rate, due date, and fulfillment status.
- Supports detailed service tracking and costing.

### events
- Owns scheduled events and shoots tied to a work order.
- Includes company_id, work_order_id, event_type, status, location, and client-facing schedule summary.

### event_schedule
- Owns the schedule details for an event.
- Includes event_id, start_timestamp, end_timestamp, timezone, venue, and repeat metadata.
- Separates timing details from event metadata.

### team_assignments
- Owns crew assignments for events and work orders.
- Includes event_id, work_order_id, employee_id, role, assignment_status, and time estimates.
- Supports multiple employees per event or work order.

### post_production_tasks
- Owns post-production task records.
- Includes work_order_id, event_id, task_type, status, assigned_editor_id, priority, and due_date.
- Supports photo correction, editing, album design, printing, and delivery steps.

### gallery_projects
- Owns gallery jobs and deliverable groupings.
- Includes company_id, work_order_id, customer_id, project_name, status, visibility, and sharing metadata.

### gallery_images
- Owns gallery asset metadata.
- Includes project_id, work_order_id, customer_id, storage_path, file_type, resolution, capture_date, status, and AI review flags.
- Tracks image ownership and processing state.

### gallery_selection
- Owns client or internal culling picks.
- Includes gallery_image_id, selected_by, selected_at, reason, selection_category, and score.
- Supports AI-assisted culling and curated selection.

### albums
- Owns album compositions for clients.
- Includes company_id, customer_id, project_id, album_name, status, layout_type, and delivery options.

### album_designs
- Owns design metadata for albums.
- Includes album_id, page_count, theme_id, layout_details, review_status, and designer_comments.
- Supports album design, revision, and approval workflows.

### payments
- Owns payments and transaction receipts.
- Includes company_id, customer_id, invoice_id, amount, payment_method, status, processed_at, and gateway_reference.

### expenses
- Owns expense records for company operations.
- Includes company_id, category, amount, vendor_id, incurred_date, status, and approval metadata.

### vendors
- Owns vendor and supplier records.
- Includes company_id, vendor_name, contact_info, service_type, and contract metadata.

### notifications
- Owns in-app and external notification records.
- Includes company_id, recipient_employee_id, recipient_customer_id, channel, message, status, and delivery metadata.

### activity_logs
- Owns user-facing activity history for timeline and audit review.
- Includes company_id, entity_type, entity_id, actor_id, action, summary, and created_at.

### audit_logs
- Owns immutable logs for system and data changes.
- Includes company_id, actor_id, entity_type, entity_id, action_type, changes, source, and occurred_at.
- Captures business rules changes, permission updates, AI actions, and security events.

### ai_conversations
- Owns AI session metadata and conversation threads.
- Includes company_id, initiated_by, conversation_context, status, and last_activity_at.
- Allows traceability of AI interaction lifecycle.

### ai_logs
- Owns individual AI requests and responses.
- Includes conversation_id, company_id, employee_id, prompt, response, model, tool_invocations, decision_state, and created_at.
- Ensures AI actions are auditable and grounded in database data.

## 3. Relationships

The schema connects every table through explicit foreign keys and tenant scoping.

- Company is the root tenant entity. Every business table includes company_id.
- Employees belong to companies and reference workspace_roles.
- Customers belong to companies and are the source for enquiries, quotations, work orders, gallery projects, and invoices.
- An enquiry may convert into a quotation. `enquiries` references `customers` and `employees`.
- A quotation belongs to a customer and may reference an enquiry. `quotation_items` belongs to `quotations`.
- A work order may derive from a quotation and ties back to a customer and company.
- Events belong to work orders and may include schedule records in `event_schedule`.
- Team assignments connect employees to events or work orders.
- Post-production tasks connect to work orders and events, and may assign editors.
- Gallery projects link to work orders and customers. `gallery_images` belong to gallery projects.
- Gallery selections connect images to selectors and culling decisions.
- Albums belong to gallery projects and customers. `album_designs` belong to albums.
- Payments reference invoices and customers, and are scoped to companies.
- Expenses and vendors are scoped to companies for financial management.
- Notifications can target employees or customers and reference company entities.
- Activity logs provide a human timeline for entity state changes.
- Audit logs capture full system changes across all tenant entities.
- AI conversations and logs are scoped to companies and reference employees, entity context, and business actions.

Example flow:

- Customer -> Quotation -> Work Order -> Event -> Assignments -> Gallery -> Album -> Delivery

This flow maintains company_id across every step and keeps ownership explicit.

## 4. Permission Model

The permission model is hierarchical and flexible.

- Workspace Roles
  - Defined in `workspace_roles` per company.
  - Provide default permission sets for common job functions.

- Module Permissions
  - Defined in `module_permissions` as granular capabilities.
  - Each permission maps to module actions, CRUD scope, and AI feature access.

- Employee Overrides
  - Stored in `employee_permissions` for explicit grants or revokes.
  - Override workspace_roles when a role requires customization.

- CRUD
  - Permissions evaluate against entity ownership and module action.
  - CRUD operations are enforced by the service layer based on role and override data.

- AI Permissions
  - AI capabilities are controlled by module permission entries and employee overrides.
  - AI tables record when AI queries were executed and whether the employee was authorized.

This model ensures every action is traceable, configurable per company, and extensible for future modules.

## 5. Assignment Model

The assignment schema supports complex production work.

- Work Orders
  - Each work order is the operational job record.
  - It can link to multiple events and multiple service line items.

- Multiple Events
  - `events` supports multiple shoot sessions per work order.
  - `event_schedule` separates time details from event metadata.

- Multiple Team Members
  - `team_assignments` allows multiple employees per event or work order.
  - Assignments capture role, status, and estimated workload.

- Multiple Deliverables
  - Work orders may produce multiple gallery projects, albums, invoices, and post-production tasks.

- Multiple Editors
  - `post_production_tasks` can assign multiple editors or specialists by task type.
  - This supports parallel editing, design review, and handoff workflows.

The assignment model enables detailed planning, execution, and accountability for every shoot.

## 6. Post Production Model

The post-production schema reflects the studio workflow.

- Photo Correction
  - Represented as `post_production_tasks` with task_type = photo_correction.
  - Tracks status, assigned editor, due dates, and quality review.

- Photo Editing
  - Represented as tasks with task_type = photo_editing.
  - Includes asset references or batch processing metadata.

- Video Editing
  - Represented as tasks with task_type = video_editing.
  - Supports separate delivery format metadata and review cycles.

- Album Design
  - Albums and `album_designs` capture layout information, page structure, and design approvals.

- Printing
  - Printing is represented as a task type with production status and fulfillment details.

- Delivery
  - Delivery is tracked in work orders, gallery projects, or album records as completion state and client delivery metadata.

This model accommodates both digital and physical delivery processes.

## 7. AI Model

AI is constrained by data access, auditability, and system integrity.

- AI must never invent data.
- AI reads only from database-backed entities and permitted context.
- AI actions create audit logs in `ai_logs` and link to `audit_logs` when they cause business changes.
- AI conversations are captured in `ai_conversations` for traceability.
- AI responses are suggestions until converted to explicit business actions.
- All AI queries are scoped by `company_id` and employee authorization.

The schema supports a safe, auditable AI layer without compromising database truth.

## 8. SaaS Model

The SaaS tenant model is baked into every table.

- Every table includes `company_id`.
- No company can access another company's data.
- Multi-tenancy is enforced by tenant-aware service layer logic and Supabase row-level security.
- Shared reference tables may be company-agnostic only when they are global system catalogs; all business data is company-scoped.

This provides strong tenant isolation and consistent cross-company behavior.

## 9. Scalability

The design supports large production workloads.

- 1000 companies: tenant scoping and indexing on company_id ensure efficient multi-tenant queries.
- 100,000 customers: normalized customer records and paginated query patterns.
- Millions of gallery images: asset metadata is separated from binary storage, enabling scalable image catalogs and selective indexing.
- Large AI usage: AI tables are optimized for append-only logging and tied to conversations, preventing blocking of operational data.

Scalability considerations:
- Use proper indexes on company_id, foreign keys, status, and date fields.
- Keep large JSON payloads limited to settings and extensible metadata tables.
- Use soft delete rather than physical delete for recoverability and archive workflows.
- Design for partitioning and archiving of audit/AI logs if needed.

## 10. Migration Plan

A safe migration preserves business continuity and prevents data loss.

- Inventory existing tables and map current entities to the new schema.
- Create the new data model in a staging environment first.
- Migrate companies and employee records into the new `companies` and `employees` tables.
- Migrate customers, enquiries, quotations, and work order records into normalized target tables.
- Migrate gallery assets into `gallery_projects`, `gallery_images`, and supporting selection tables.
- Migrate post-production records into `post_production_tasks`, `albums`, and `album_designs`.
- Migrate financial records into `payments`, `expenses`, `vendors`, and any invoice-related tables.
- Migrate permissions and roles into `workspace_roles`, `module_permissions`, and `employee_permissions`.
- Migrate activity and audit history into `activity_logs` and `audit_logs` with proper entity mapping.
- Migrate AI history into `ai_conversations` and `ai_logs` preserving source context.
- Validate each migration stage with consistency checks, row counts, and referential integrity.
- Roll out tenant-by-tenant or feature-by-feature to minimize impact.
- Retain archived legacy tables for rollback until the new model is fully validated.

This plan ensures a safe transition from the existing database to the new architecture.

---

This database architecture document defines the foundational schema and data ownership rules for Trufocus CRM v2. It is intended as the canonical reference for all engineering, data, and platform decisions.