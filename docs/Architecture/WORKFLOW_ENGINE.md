# Trufocus CRM Workflow Engine

This document defines the comprehensive business workflow architecture for Trufocus CRM. The workflow engine governs CRM, production, finance, gallery, customer portal, AI, notifications, and staff workspaces.

## 1. Customer Journey

The customer journey is the primary business process flow for photography clients.

- Lead
  - A prospective customer is identified through marketing, referral, or inbound contact.
  - The lead is captured in the CRM and assigned to a sales executive.

- Enquiry
  - The lead becomes an enquiry with service requirements, event details, and customer preferences.
  - The enquiry is logged, qualified, and scoped.

- Quotation
  - A quote is created based on the enquiry scope, package, pricing, and terms.
  - The sales executive prepares a proposal and sends it to the customer.

- Approval
  - The customer reviews the quotation.
  - The quote is accepted, rejected, or sent back for revision.

- Work Order
  - An approved quotation generates a work order for production.
  - Operational details, schedule, location, and deliverables are finalized.

- Payment
  - The customer pays advance or deposit according to the agreement.
  - Payment records are captured and linked to the work order.

- Assignment
  - The manager assigns qualified staff, including photographers, videographers, and crew.
  - Roles and schedule details are confirmed.

- Shoot
  - The shoot is executed according to the planned event.
  - Status updates are recorded in real time.

- RAW Upload
  - RAW assets are uploaded to gallery storage.
  - Upload completion triggers the next production stage.

- AI Culling
  - AI assists with initial asset selection and quality scoring.
  - Candidate images are marked for correction and editing.

- Photo Correction
  - Selected RAW files are processed for color correction, exposure, and basic retouch.
  - Correction tasks are assigned and tracked.

- Photo Editing
  - Detailed editing is performed on selected assets.
  - Advanced retouch, compositing, and enhancement tasks are completed.

- Video Editing
  - Video assets are edited, assembled, and refined for final delivery.
  - Processes include timeline editing, effects, color grading, and audio mixing.

- Gallery
  - Final assets are published to a client-facing gallery.
  - Gallery configuration and access controls are applied.

- Customer Selection
  - The customer reviews gallery content and selects final images.
  - Selection decisions are recorded in the workflow.

- Album Design
  - The selected assets are organized into album layouts.
  - Design work is created, reviewed, and revised.

- Approval
  - The customer approves the album design and final deliverables.
  - Any required revisions are managed.

- Printing
  - Approved album and print orders are sent to production.
  - Printing tasks and fulfillment metadata are tracked.

- Delivery
  - Physical or digital delivery of final products is executed.
  - Delivery confirmation is recorded.

- Closed
  - The project is completed and closed.
  - Final accounting, feedback, and archive actions occur.

## 2. Status Engine

The status engine standardizes state transitions across core entities.

### Quotation statuses
- Draft
- Sent
- Viewed
- Accepted
- Rejected
- Expired

### Work Order statuses
- Created
- Approved
- Scheduled
- Assigned
- Shoot Completed
- RAW Uploaded
- Post Production
- Gallery Ready
- Album Pending
- Delivered
- Closed

### Event statuses
- Pending
- Confirmed
- In Progress
- Completed
- Cancelled

### Post-production task statuses
- Assigned
- Accepted
- In Progress
- QC
- Approved
- Completed

### Gallery project statuses
- Draft
- In Review
- Published
- Shared
- Closed

### Album statuses
- Selection
- Design
- Review
- Revision
- Approved
- Print Ready
- Delivered

### Payment statuses
- Pending
- Authorized
- Paid
- Partially Paid
- Refunded
- Failed

## 3. Assignment Workflow

The assignment workflow controls shoot staffing and operational execution.

- Manager
  - Reviews work order scope and assigns team members.

- Assign Photographer
  - Photographer is assigned and notified.

- Photographer Accepts
  - Photographer confirms availability and acceptance.

- Shoot Started
  - The shoot begins and status transitions to active.

- Shoot Completed
  - Shoot is completed and event status is updated.

- RAW Submitted
  - RAW assets are uploaded and verified.

- Manager Approval
  - Manager reviews the upload and confirms readiness for post-production.

## 4. Photo Editing Workflow

This workflow defines the post-production path for photo work.

- Assign
  - Photo editing tasks are assigned to an editor.

- Accepted
  - Editor accepts the assignment.

- Editing
  - Editor performs the photo editing work.

- QC
  - Quality control review is performed.

- Approved
  - Edited deliverables are approved for gallery or delivery.

- Completed
  - The task is marked complete and released.

## 5. Video Editing Workflow

The video workflow follows the same structured process.

- Assign
- Accepted
- Editing
- QC
- Approved
- Completed

## 6. Album Workflow

The album workflow covers design and customer review.

- Selection
  - Assets are selected for inclusion.

- Design
  - Album layout and design work is created.

- Customer Review
  - The customer reviews the design.

- Revision
  - Design revisions are applied.

- Approved
  - The album is approved for production.

- Print
  - Print files are generated and sent to production.

- Delivered
  - The finished album is delivered to the customer.

## 7. Finance Workflow

The finance workflow ensures clear payment progression.

- Quotation
  - The quote establishes pricing and payment milestones.

- Advance
  - Initial deposit or advance payment is collected.

- Second Payment
  - Additional payment is collected when the project reaches the next milestone.

- Balance
  - Remaining balance is invoiced and paid.

- Closed
  - Financial account is reconciled and the revenue is recognized.

## 8. Notification Engine

The notification engine ensures stakeholders are informed at every stage.

- Assignment
  - Notify assigned staff of new assignments and status changes.

- Payment
  - Notify customers and finance when payments are requested, received, or failed.

- Gallery
  - Notify customers when gallery content is published or shared.

- Approval
  - Notify approvers and stakeholders when review or signoff is required.

- Reminder
  - Send reminders for upcoming shoots, deadlines, and pending actions.

- Delivery
  - Notify customers and team members when delivery is scheduled and completed.

## 9. Dashboard Rules

Each workspace dashboard surfaces role-specific insights and widgets.

- Owner
  - Company performance summary
  - Revenue and subscription health
  - Active pipeline and delivery status
  - Compliance and audit alerts

- Manager
  - Work order load
  - Team availability
  - Assignment status
  - Upcoming shoots and deadlines

- Photographer
  - Assigned shoots
  - Event schedule
  - Asset upload progress
  - Shoot preparation checklist

- Editor
  - Pending editing tasks
  - QC queue
  - Album review status
  - Delivery deadlines

- Finance
  - Outstanding payments
  - Invoice aging
  - Cashflow forecast
  - Expense approvals

- Customer
  - Active project summary
  - Gallery access
  - Payment status
  - Approval requests

## 10. AI Workflow

AI participates as a decision support and automation layer.

- Recommendations
  - AI suggests asset selections, workflow optimizations, and task prioritization.

- Automation
  - AI can automate repetitive decisions, such as culling, tagging, and basic task assignments.

- Approvals
  - AI may suggest approvals, but final action requires human confirmation.

- Business Insights
  - AI generates operational insights, risk indicators, and performance analysis based on workflow data.

AI is always constrained by the workflow state and permission model. AI recommendations are advisory until explicitly accepted and recorded by a user.

---

This Workflow Engine specification defines every business process stage, status model, role workflow, notification flow, and AI participation path for Trufocus CRM.