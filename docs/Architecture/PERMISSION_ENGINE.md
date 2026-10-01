# Trufocus CRM Permission Engine

This document defines the enterprise Role-Based Access Control (RBAC) architecture for Trufocus CRM. It is the security blueprint for the entire platform.

## 1. Workspace Roles

Workspace roles define the broad set of responsibilities and default permission scopes for each employee type.

- Owner
  - Full system control.
  - Can manage company settings, billing, roles, subscriptions, and system-wide configuration.
  - Can override any permission and access all modules.

- Administrator
  - Company-wide administration and user management.
  - Can configure modules, workspace roles, notifications, and integrations.
  - Can manage employees, permissions, and company settings.

- Manager
  - Operational oversight across jobs and teams.
  - Can view, create, edit, assign, approve, and report on work orders, enquiries, and customer interactions.
  - Can manage workflows and resource allocation.

- Photographer
  - Primary shoot execution role.
  - Can access assignments, events, gallery uploads, shoot notes, and deliverable handoff tasks.
  - Can create and update event status, image metadata, and shoot-related work orders.

- Videographer
  - Video shoot execution role.
  - Can access assignments, events, gallery uploads, video assets, and production notes.
  - Can create and update video-related work orders and timeline information.

- Photo Editor
  - Post-production image editing specialist.
  - Can access post-production tasks, gallery projects, editing checklists, and album design boards.
  - Can update asset status, review edits, and mark tasks complete.

- Video Editor
  - Post-production video specialist.
  - Can access video editing tasks, project timelines, review states, and delivery metadata.
  - Can update video task progress and approval state.

- Album Designer
  - Album layout and design specialist.
  - Can access album projects, design templates, page layouts, client review feedback, and design delivery.
  - Can update album design state and share proofs.

- Sales Executive
  - Client acquisition and quoting specialist.
  - Can manage enquiries, quotations, customer records, and sales opportunities.
  - Can create and update quotes, convert enquiries, and move leads through pipeline stages.

- Finance
  - Accounting and payment operations.
  - Can access invoices, payments, expense records, subscriptions, and financial reports.
  - Can approve transactions and manage vendor/payment workflows.

- Customer
  - External portal user.
  - Can access customer-facing gallery content, album previews, invoices, and portal messages.
  - Permissions are limited to owned customer data and portal interactions only.

## 2. Module Permission Matrix

Every module supports a consistent set of capability permissions.

- View
  - Read access for module data and entity details.
  - Includes list views, dashboards, and detail pages.

- Create
  - Ability to create new records or project entities in a module.
  - Includes new customers, quotations, work orders, galleries, tasks, and events.

- Edit
  - Ability to modify existing records and task details.
  - Includes updates to status, assignments, metadata, and configuration.

- Delete
  - Ability to remove or soft-delete entities.
  - Must be gated and audited. Deletion may require additional approval.

- Approve
  - Ability to move items through approval workflows.
  - Includes quotation approvals, work order signoffs, task completions, and publish actions.

- Export
  - Ability to extract data from the module.
  - Includes reports, invoices, gallery downloads, and exportable documents.

- Share
  - Ability to share module content externally or with other users.
  - Includes gallery sharing, portal links, quote sharing, and notifications.

- Configure
  - Ability to configure module settings and defaults.
  - Includes module-level preferences, templates, and workflow behavior.

- Assign
  - Ability to assign employees, resources, or tasks within a module.
  - Includes crew assignments, editor task assignment, event staffing, and delivery routing.

Every module permission is expressed as a named capability. Components and services evaluate these capabilities through PermissionService rather than checking roles.

## 3. Permission Resolution

Permission resolution follows a clearly defined hierarchy.

1. Employee Override
  - Explicit grants or denies on `employee_permissions`.
  - Overrides workspace role defaults for individual employees.

2. Workspace Role
  - Role-based permissions inherited from `workspace_roles`.
  - Defines the employee's baseline access model.

3. Default Module Permission
  - Company-level module permission defaults from `module_permissions` and company configuration.
  - Applies when the employee has no explicit workspace role or override.

4. System Default
  - Global platform defaults where no other permission configuration exists.
  - Safest fallback behavior is deny-by-default.

This hierarchy ensures precise, predictable permission behavior with employee-level customization.

## 4. Sidebar Generation

The sidebar is generated only from module permissions.

- Sidebar items are derived from PermissionService capabilities.
- PermissionService evaluates whether the current user has `View` permission for each module.
- No component may read the user's workspace role directly to decide sidebar visibility.
- This ensures navigation reflects actual allowed actions, not role labels.

## 5. Route Protection

Every route must be protected by PermissionService.

- Route guards must verify module-level access before rendering.
- No page can open without explicit permission checks.
- Route protection is centralized in the routing layer, using permission metadata and route definitions.
- Pages may still perform finer-grained checks for actions, but initial access must be blocked at the route level.

## 6. Button Protection

Buttons are permission-driven.

- Delete
  - Rendered and enabled only when user has delete permission on the entity/module.

- Edit
  - Requires edit permission for the target entity.

- Assign
  - Requires assign permission and a matching role specialization.

- Approve
  - Requires approve permission for workflow transitions.

UI controls may use descriptive permission hooks or directives, but the underlying evaluation always goes through PermissionService.

## 7. AI Permission

AI follows the same engine as the rest of the platform.

- AI actions are subject to module permissions and employee override rules.
- AI may not bypass permissions or access unauthorized tenant data.
- PermissionService determines whether an employee can invoke AI features, view AI-generated recommendations, or apply AI actions.
- AI logs capture authorization decisions and the context of each request.

## 8. Workspace Routing

After login, workspace routing matches the employee's role and available permissions.

- Owner -> Owner Workspace
- Administrator -> Admin Workspace
- Manager -> Manager Workspace
- Photographer -> Photographer Workspace
- Videographer -> Videographer Workspace
- Photo Editor -> Photo Editor Workspace
- Video Editor -> Video Editor Workspace
- Album Designer -> Album Designer Workspace
- Sales Executive -> Sales Workspace
- Finance -> Finance Workspace

This routing is role-informed but permission-driven. Workspace landing pages are selected from the modules the employee can access, not from roles alone.

## 9. Assignment Rules

Assignment rules ensure only qualified employees receive tasks.

- Only employees with matching workspace roles and specialization may be assigned to tasks.
- Assignments are evaluated through PermissionService and department/specialty metadata.
- Example: only employees with Photographer role and active shoot permissions may be assigned to a shooting event.
- Example: only Photo Editors may be assigned to post-production image tasks.

This prevents improper resource allocation and enforces operational consistency.

## 10. Future SaaS

The permission architecture is designed for future SaaS expansion.

- Tenant support
  - Permissions are scoped per tenant/company.
  - Tenant admins can manage company-specific roles and defaults.

- Company support
  - Company-level role and permission definitions are configurable.
  - Different companies may enable different modules and workflows.

- Department support
  - Permissions may be extended to department-specific scopes.
  - Departments can have their own role mappings and specialized access rules.

- Custom Roles
  - Companies may define custom roles with unique permission sets.
  - Custom roles are managed through workspace role configuration.

- Custom Modules
  - The engine supports adding new modules with the same View/Create/Edit/Delete/Approve/Export/Share/Configure/Assign permission set.
  - New modules are integrated through PermissionService and cataloged in module permissions.

This specification provides a robust, extensible RBAC foundation for Trufocus CRM SaaS.
