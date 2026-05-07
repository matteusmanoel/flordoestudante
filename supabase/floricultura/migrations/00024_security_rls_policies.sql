-- =============================================================================
-- 00024_security_rls_policies.sql
--
-- PROPOSED RLS policies for agent-related tables.
--
-- ⚠️  DO NOT APPLY DURING DEVELOPMENT ⚠️
--
-- Reason: RLS changes can break existing admin queries, CRM panel queries,
-- and any server-side access that doesn't use the service_role key.
-- Review ALL policies below against your access patterns before applying.
--
-- Apply strategy:
--   1. Deploy and test 00021-00023 first.
--   2. Review this file with the team.
--   3. Apply in a maintenance window.
--   4. Validate admin/CRM still works after applying.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (bypasses RLS)
-- CREATE POLICY "service_role_all_conversations"
--   ON conversations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated users to see their own conversations
-- CREATE POLICY "customer_sees_own_conversation"
--   ON conversations FOR SELECT TO authenticated
--   USING (customer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- conversation_messages
-- ---------------------------------------------------------------------------
-- ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- Service role full access
-- CREATE POLICY "service_role_all_messages"
--   ON conversation_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Customers see messages in their own conversations
-- CREATE POLICY "customer_sees_own_messages"
--   ON conversation_messages FOR SELECT TO authenticated
--   USING (
--     conversation_id IN (
--       SELECT id FROM conversations WHERE customer_id = auth.uid()
--     )
--   );

-- ---------------------------------------------------------------------------
-- agent_events
-- ---------------------------------------------------------------------------
-- ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

-- Service role full access
-- CREATE POLICY "service_role_all_agent_events"
--   ON agent_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admins can read all events (requires is_admin check on users/profiles)
-- CREATE POLICY "admin_reads_agent_events"
--   ON agent_events FOR SELECT TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
--     )
--   );

-- ---------------------------------------------------------------------------
-- orders (supplement existing policies from 00005_rls.sql)
-- ---------------------------------------------------------------------------
-- These are already partially covered by 00005_rls.sql.
-- Only add if needed after reviewing existing policies.
