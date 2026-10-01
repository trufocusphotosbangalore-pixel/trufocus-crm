# DATABASE STATE REPORT

Date: 2026-08-06
Project Ref: zdbhtojtxqxeqttqjomf
Mode: Read-only inspection of linked Supabase database

## 1) Existing Tables (with row count)

Row counts below are `pg_stat_user_tables.n_live_tup` (approximate) and reflect current live state.

| Schema | Table | Row Count |
|---|---:|---:|
| auth | audit_log_entries | 0 |
| auth | custom_oauth_providers | 0 |
| auth | flow_state | 0 |
| auth | identities | 5 |
| auth | instances | 0 |
| auth | mfa_amr_claims | 2 |
| auth | mfa_challenges | 0 |
| auth | mfa_factors | 0 |
| auth | oauth_authorizations | 0 |
| auth | oauth_client_states | 0 |
| auth | oauth_clients | 0 |
| auth | oauth_consents | 0 |
| auth | one_time_tokens | 4 |
| auth | refresh_tokens | 2 |
| auth | saml_providers | 0 |
| auth | saml_relay_states | 0 |
| auth | schema_migrations | 77 |
| auth | sessions | 2 |
| auth | sso_domains | 0 |
| auth | sso_providers | 0 |
| auth | users | 5 |
| auth | webauthn_challenges | 0 |
| auth | webauthn_credentials | 0 |
| public | business_profile | 1 |
| public | client_requests | 0 |
| public | customer_portals | 1 |
| public | data_storage | 0 |
| public | enquiries | 0 |
| public | finance_payments | 1 |
| public | post_production | 0 |
| public | settings | 0 |
| public | team_members | 4 |
| public | work_orders | 1 |
| realtime | messages | 0 |
| realtime | messages_2026_08_03 | 0 |
| realtime | messages_2026_08_04 | 0 |
| realtime | messages_2026_08_05 | 0 |
| realtime | messages_2026_08_06 | 0 |
| realtime | messages_2026_08_07 | 0 |
| realtime | messages_2026_08_08 | 0 |
| realtime | messages_2026_08_09 | 0 |
| realtime | schema_migrations | 81 |
| realtime | subscription | 100 |
| storage | buckets | 0 |
| storage | buckets_analytics | 0 |
| storage | buckets_vectors | 0 |
| storage | migrations | 61 |
| storage | objects | 0 |
| storage | s3_multipart_uploads | 0 |
| storage | s3_multipart_uploads_parts | 0 |
| storage | vector_indexes | 0 |
| vault | secrets | 0 |

## 2) Existing Foreign Keys

### public schema
- None

### all non-system schemas (existing)
- auth.identities.identities_user_id_fkey -> auth.users(id)
- auth.mfa_amr_claims.mfa_amr_claims_session_id_fkey -> auth.sessions(id)
- auth.mfa_challenges.mfa_challenges_auth_factor_id_fkey -> auth.mfa_factors(id)
- auth.mfa_factors.mfa_factors_user_id_fkey -> auth.users(id)
- auth.oauth_authorizations.oauth_authorizations_client_id_fkey -> auth.oauth_clients(id)
- auth.oauth_authorizations.oauth_authorizations_user_id_fkey -> auth.users(id)
- auth.oauth_consents.oauth_consents_client_id_fkey -> auth.oauth_clients(id)
- auth.oauth_consents.oauth_consents_user_id_fkey -> auth.users(id)
- auth.one_time_tokens.one_time_tokens_user_id_fkey -> auth.users(id)
- auth.refresh_tokens.refresh_tokens_session_id_fkey -> auth.sessions(id)
- auth.saml_providers.saml_providers_sso_provider_id_fkey -> auth.sso_providers(id)
- auth.saml_relay_states.saml_relay_states_flow_state_id_fkey -> auth.flow_state(id)
- auth.saml_relay_states.saml_relay_states_sso_provider_id_fkey -> auth.sso_providers(id)
- auth.sessions.sessions_oauth_client_id_fkey -> auth.oauth_clients(id)
- auth.sessions.sessions_user_id_fkey -> auth.users(id)
- auth.sso_domains.sso_domains_sso_provider_id_fkey -> auth.sso_providers(id)
- auth.webauthn_challenges.webauthn_challenges_user_id_fkey -> auth.users(id)
- auth.webauthn_credentials.webauthn_credentials_user_id_fkey -> auth.users(id)
- storage.objects.objects_bucketId_fkey -> storage.buckets(id)
- storage.s3_multipart_uploads.s3_multipart_uploads_bucket_id_fkey -> storage.buckets(id)
- storage.s3_multipart_uploads_parts.s3_multipart_uploads_parts_bucket_id_fkey -> storage.buckets(id)
- storage.s3_multipart_uploads_parts.s3_multipart_uploads_parts_upload_id_fkey -> storage.s3_multipart_uploads(id)
- storage.vector_indexes.vector_indexes_bucket_id_fkey -> storage.buckets_vectors(id)

## 3) Existing RLS Policies

Query result from `pg_policies` for schema `public`:
- None

## 4) Existing Indexes

Complete existing index names grouped by schema:

- auth:
amr_id_pk, audit_log_entries_pkey, audit_logs_instance_id_idx, confirmation_token_idx, custom_oauth_providers_created_at_idx, custom_oauth_providers_enabled_idx, custom_oauth_providers_identifier_idx, custom_oauth_providers_identifier_key, custom_oauth_providers_pkey, custom_oauth_providers_provider_type_idx, email_change_token_current_idx, email_change_token_new_idx, factor_id_created_at_idx, flow_state_created_at_idx, flow_state_pkey, identities_email_idx, identities_pkey, identities_provider_id_provider_unique, identities_user_id_idx, idx_auth_code, idx_oauth_client_states_created_at, idx_user_id_auth_method, idx_users_created_at_desc, idx_users_email, idx_users_last_sign_in_at_desc, idx_users_name, instances_pkey, mfa_amr_claims_session_id_authentication_method_pkey, mfa_challenge_created_at_idx, mfa_challenges_pkey, mfa_factors_last_challenged_at_key, mfa_factors_pkey, mfa_factors_user_friendly_name_unique, mfa_factors_user_id_idx, oauth_auth_pending_exp_idx, oauth_authorizations_authorization_code_key, oauth_authorizations_authorization_id_key, oauth_authorizations_pkey, oauth_client_states_pkey, oauth_clients_deleted_at_idx, oauth_clients_pkey, oauth_consents_active_client_idx, oauth_consents_active_user_client_idx, oauth_consents_pkey, oauth_consents_user_client_unique, oauth_consents_user_order_idx, one_time_tokens_pkey, one_time_tokens_relates_to_hash_idx, one_time_tokens_token_hash_hash_idx, one_time_tokens_user_id_token_type_key, reauthentication_token_idx, recovery_token_idx, refresh_tokens_instance_id_idx, refresh_tokens_instance_id_user_id_idx, refresh_tokens_parent_idx, refresh_tokens_pkey, refresh_tokens_session_id_revoked_idx, refresh_tokens_token_unique, refresh_tokens_updated_at_idx, saml_providers_entity_id_key, saml_providers_pkey, saml_providers_sso_provider_id_idx, saml_relay_states_created_at_idx, saml_relay_states_for_email_idx, saml_relay_states_pkey, saml_relay_states_sso_provider_id_idx, schema_migrations_pkey, sessions_not_after_idx, sessions_oauth_client_id_idx, sessions_pkey, sessions_user_id_idx, sso_domains_domain_idx, sso_domains_pkey, sso_domains_sso_provider_id_idx, sso_providers_pkey, sso_providers_resource_id_idx, sso_providers_resource_id_pattern_idx, unique_phone_factor_per_user, user_id_created_at_idx, users_email_partial_key, users_instance_id_email_idx, users_instance_id_idx, users_is_anonymous_idx, users_phone_key, users_pkey, webauthn_challenges_expires_at_idx, webauthn_challenges_pkey, webauthn_challenges_user_id_idx, webauthn_credentials_credential_id_key, webauthn_credentials_pkey, webauthn_credentials_user_id_idx

- public:
business_profile_pkey, client_requests_pkey, customer_portals_pkey, data_storage_pkey, enquiries_pkey, finance_payments_pkey, post_production_pkey, settings_pkey, team_members_pkey, work_orders_pkey

- realtime:
ix_realtime_subscription_entity, messages_2026_08_03_inserted_at_topic_idx, messages_2026_08_03_pkey, messages_2026_08_04_inserted_at_topic_idx, messages_2026_08_04_pkey, messages_2026_08_05_inserted_at_topic_idx, messages_2026_08_05_pkey, messages_2026_08_06_inserted_at_topic_idx, messages_2026_08_06_pkey, messages_2026_08_07_inserted_at_topic_idx, messages_2026_08_07_pkey, messages_2026_08_08_inserted_at_topic_idx, messages_2026_08_08_pkey, messages_2026_08_09_inserted_at_topic_idx, messages_2026_08_09_pkey, messages_inserted_at_topic_index, messages_pkey, pk_subscription, schema_migrations_pkey, subscription_subscription_id_entity_filters_action_filter_selec

- storage:
bname, bucketid_objname, buckets_analytics_pkey, buckets_analytics_unique_name_idx, buckets_pkey, buckets_vectors_pkey, idx_multipart_uploads_list, idx_objects_bucket_id_name, idx_objects_bucket_id_name_lower, migrations_name_key, migrations_pkey, name_prefix_search, objects_pkey, s3_multipart_uploads_parts_pkey, s3_multipart_uploads_pkey, vector_indexes_name_bucket_id_idx, vector_indexes_pkey

- vault:
secrets_name_idx, secrets_pkey

## 5) Existing Triggers

- realtime.subscription: tr_check_filters (BEFORE INSERT)
- realtime.subscription: tr_check_filters (BEFORE UPDATE)
- storage.buckets: enforce_bucket_name_length_trigger (BEFORE UPDATE)
- storage.buckets: enforce_bucket_name_length_trigger (BEFORE INSERT)
- storage.buckets: protect_buckets_delete (BEFORE DELETE)
- storage.objects: protect_objects_delete (BEFORE DELETE)
- storage.objects: update_objects_updated_at (BEFORE UPDATE)

Public schema trigger count: 0

## 6) Existing auth.users Count

- auth.users count: 5 (exact)

## 7) Existing profiles Count

- public.profiles exists: false
- count: 0

## 8) Existing employees Count

- public.employees exists: false
- count: 0

## 9) Realtime Publication State

Current `supabase_realtime` publication includes:
- public.business_profile
- public.client_requests
- public.customer_portals
- public.data_storage
- public.enquiries
- public.finance_payments
- public.post_production
- public.settings
- public.team_members
- public.work_orders

## 10) Migration History vs Local Files (00001–00006)

### Supabase migration history
- `supabase migration list` output:
  - local: 00001, 00002, 00003, 00004, 00005, 00006
  - remote: empty for all versions

### Schema comparison against migrations

Observed public schema is legacy JSONB-table model:
- each app table has columns: `id text`, `data jsonb`, `created_at`, `updated_at`
- this shape matches the legacy bootstrap model and not the normalized migration model

Expected by migrations but missing in DB:
- From 00001: public.profiles, public.notifications
- From 00003: work_order_events, work_order_team, work_order_deliverables, work_order_payments, work_order_documents, work_order_timeline, work_order_notes, work_order_gallery
- From 00004: settings_event_types, settings_services, settings_deliverables, settings_payment_modes, settings_contract_templates, work_order_services, work_order_team_assignments, work_order_payment_ledger, work_order_contracts
- From 00005: portal_settings, portal_access_logs, portal_moodboard
- From 00006: team_assignments

Important conflict:
- `public.work_orders`, `public.enquiries`, and `public.customer_portals` already exist but with incompatible legacy shape (`id text`, `data jsonb`) versus normalized table definitions in migrations.

## 11) Determination (A vs B)

Result: A

The database schema already exists, but migration history for local migrations `00001–00006` is missing.

Nuance:
- It is not an empty/uninitialized database.
- It is a pre-existing legacy schema that does not match the normalized migration set.
- Therefore, local migration history is missing and local migrations have not been applied as recorded versions.

## 12) Safest Migration Strategy (Do Not Apply Yet)

### Recommendation
Do NOT run `supabase db push` with `00001–00006` in current form.

### Why
- Existing table-name collisions with incompatible structures can cause partial failures and/or invalid assumptions (especially around `work_orders`, `enquiries`, `customer_portals`).
- Current app data is live and should be preserved.

### Safe strategy
1. Take a full remote backup first:
- schema + data dump of `public` (and relevant auth metadata if required).

2. Baseline the current live schema into version control:
- create a baseline migration from current remote state (`supabase db pull` into a new baseline file),
- commit baseline as authoritative starting point for this project.

3. Repair migration history to match baseline only:
- use `supabase migration repair` to mark baseline version appropriately,
- do not mark `00001–00006` as applied unless their effects are truly present and validated.

4. Create forward-only compatibility migrations:
- add new migrations that evolve legacy JSONB model safely toward Sprint 3 requirements,
- for normalized tables (e.g., `team_assignments`), create with non-conflicting names/types and explicit data backfill plan.

5. Add preflight checks and dry-run on staging:
- validate table existence, column types, FK creation feasibility, RLS, indexes, triggers, and realtime publication.

6. Apply to production only after staging verification passes.

---

No migrations were applied.
No database modifications were performed.
