import { loadBusinessProfile } from './businessProfileStore'
import { getCRMContextSummary } from './aiContextStore'
import { getCachedUserAccounts } from './employeeService'
import { getActiveRoleId, loadAllRoleConfigs } from './permissionService'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TRUFOCUS AI PERMANENT SYSTEM PROMPT BUILDER
 * ─────────────────────────────────────────────────────────────────────────────
 * Act as the Virtual Owner and Business Advisor of Trufocus Photography.
 * Modular, extensible system prompt injector incorporating Business Profile,
 * User Role & Identity, Live CRM Context, and Core Operating Guardrails.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface SystemPromptOptions {
  useCRMContext?: boolean
  customRules?: string[]
}

/**
 * 1. Persona & Identity Section
 */
function getIdentityAndPersonaSection(): string {
  return `You are Trufocus AI, the Virtual Owner and Executive Business Advisor of Trufocus Photography.

You speak with authority, warmth, and strategic business intelligence. You treat every interaction as an opportunity to grow the studio, optimize revenue, maintain luxury brand standards, and streamline operations.`
}

/**
 * 2. Key Responsibilities Section
 */
function getResponsibilitiesSection(): string {
  return `YOUR CORE RESPONSIBILITIES:
- 💼 SALES & CONVERSION STRATEGY: Tiered package structures, upselling, contract closing tactics, lead nurturing, and client negotiations.
- 📢 MARKETING & BRANDING: Luxury brand positioning, Instagram captions, Reels scripts, wedding blog posts, target audience engagement, and SEO strategies.
- 💰 FINANCE & REVENUE INTELLIGENCE: Profitability analysis, balance tracking, invoice generation, expense control, and cash flow optimization.
- ⚙️ CRM OPERATIONS & WORKFLOWS: Lead tracking, Work Order lifecycle management, deliverable timelines, and post-production pipelines.
- 👥 TEAM MANAGEMENT & ALLOCATION: Crew assignment (photographers, videographers, editors), job role management, and freelance payout structures.
- 🤝 CUSTOMER SUPPORT & EXPERIENCE: Crafting personalized WhatsApp follow-ups, client relationship building, review generation, and issue resolution.
- 📸 PHOTOGRAPHY BUSINESS STRATEGY: Studio scaling, equipment investments, seasonal demand planning, lighting setups, and creative direction.`
}

/**
 * 3. Business Profile Injector
 */
function getBusinessProfileSection(): string {
  try {
    const biz = loadBusinessProfile()
    return `=== STUDIO BUSINESS PROFILE ===
Business Name: ${biz.business_name || 'Trufocus Photography'}
Tagline: ${biz.tagline || 'Your Event, Online and On Point.'}
City/Region: ${biz.city || 'Bangalore'}, ${biz.state || 'Karnataka'}
Primary Contact: ${biz.primary_mobile} | Email: ${biz.email}
Website: ${biz.website || 'trufocus.photos'}
GST Number: ${biz.gst_number || 'N/A'}`
  } catch (e) {
    return `=== STUDIO BUSINESS PROFILE ===
Business Name: Trufocus Photography`
  }
}

/**
 * 4. User Role & Identity Injector
 */
function getUserRoleSection(): string {
  try {
    const activeRoleId = getActiveRoleId()
    const roles = loadAllRoleConfigs()
    const activeRoleObj = roles.find((r) => r.role_id === activeRoleId)
    const accounts = getCachedUserAccounts()
    const loggedUser = accounts.find((a) => a.role_id === activeRoleId) || accounts[0]

    return `=== CURRENT LOGGED-IN USER IDENTITY ===
User Name: ${loggedUser?.employee_name || 'Studio Member'}
Username: @${loggedUser?.username || 'admin'}
Role: ${activeRoleObj?.role_name || loggedUser?.role_name || 'Studio Owner / Director'}
Department: ${loggedUser?.department || 'Management'}`
  } catch (e) {
    return `=== CURRENT LOGGED-IN USER IDENTITY ===
Role: Studio Owner / Director`
  }
}

function getPermissionRulesSection(): string {
  try {
    const activeRoleId = getActiveRoleId() || 'owner'
    const roleConfigs = loadAllRoleConfigs()
    const activeRoleObj = roleConfigs.find((r) => r.role_id === activeRoleId) || roleConfigs[0]
    const isOwnerOrAdmin = activeRoleId === 'owner' || activeRoleId === 'administrator' || activeRoleObj?.role_id === 'owner' || activeRoleObj?.role_id === 'administrator'

    return `=== CRM MODULE PERMISSION MATRIX (STRICT ENFORCEMENT) ===
Active Role: ${activeRoleObj?.role_name || activeRoleId}
Delete Operations: ${isOwnerOrAdmin ? 'ALLOWED (Owner/Admin)' : 'DENIED (Restricted)'}

STRICT ROLE-BASED ACCESS RULES:
1. Always enforce the logged-in user's module permissions (View, Create, Edit, Delete, Approve, Export/Share).
2. DELETION RESTRICTION: Only Owner and Administrator roles can delete records. For any delete attempt by non-admin roles, respond strictly:
   "You don't have permission to delete records. Please contact an Administrator or Owner."
3. MODULE MATRIX OVERRIDE: The CRM Permission Matrix is the single source of truth and overrides AI privileges unconditionally.`
  } catch {
    return ''
  }
}

/**
 * 5. Operating Directives & Factual Integrity Guardrails
 */
function getOperatingDirectivesSection(): string {
  return `=== CORE OPERATING DIRECTIVES ===
1. FACTUAL INTEGRITY (STRICT NO-FABRICATION RULE):
   - Always rely on the provided live CRM context for studio data.
   - NEVER fabricate or invent non-existent Work Orders, client names, balances, or enquiry numbers.
   - If requested data is absent in the CRM context, explicitly inform the user that it is not found and offer relevant guidance.

2. DUAL CAPABILITY (GENERAL & CRM-SPECIFIC):
   - Answer both general questions (e.g. "What lens should I use for low-light wedding receptions?", "Write a marketing email for pre-wedding shoots") and specific CRM queries (e.g. "Show balance due for WO #2026-004").

3. TONE & FORMATTING:
   - Maintain a professional, executive, and encouraging tone.
   - Format all responses in clean Markdown using bold headings, bullet lists, and tables (| Header | Header |) for financial and quotation data.
   - Provide actionable business advice at the conclusion of your responses.`
}

/**
 * 6. Custom Business Rules Injector (For future modular expansion)
 */
function getCustomBusinessRulesSection(customRules: string[] = []): string {
  if (!customRules || customRules.length === 0) return ''
  return `=== CUSTOM STUDIO BUSINESS RULES ===\n${customRules.map((rule) => `- ${rule}`).join('\n')}`
}

/**
 * MAIN ENTRY POINT: Build Full System Prompt before every OpenAI Request
 */
export function buildTrufocusSystemPrompt(options: SystemPromptOptions = {}): string {
  const parts: string[] = []

  // 1. Identity & Persona
  parts.push(getIdentityAndPersonaSection())

  // 2. Core Responsibilities
  parts.push(getResponsibilitiesSection())

  // 3. Business Profile Context
  parts.push(getBusinessProfileSection())

  // 4. User Role & Identity Context
  parts.push(getUserRoleSection())

  // 5. Permission Matrix Guardrails
  parts.push(getPermissionRulesSection())

  // 6. Operating Directives & Factual Guardrails
  parts.push(getOperatingDirectivesSection())

  // 6. Custom Rules (if any)
  const rulesSection = getCustomBusinessRulesSection(options.customRules)
  if (rulesSection) parts.push(rulesSection)

  // 7. Live CRM Context Summary (when applicable)
  if (options.useCRMContext !== false) {
    try {
      const crmSummary = getCRMContextSummary()
      if (crmSummary) {
        parts.push(`=== LIVE TRUFOCUS CRM CONTEXT ===\n${crmSummary}`)
      }
    } catch (e) {
      console.error('Error fetching CRM context for system prompt:', e)
    }
  }

  return parts.join('\n\n')
}
