-- Least-privilege runtime role for the web application.
-- Run once as the database owner, after migrations:
--
--   psql "$ADMIN_DATABASE_URL" -f db/roles.sql
--   psql "$ADMIN_DATABASE_URL" -c '\password reshape_web'     -- set the password interactively
--
-- The web app can INSERT leads and consent rows and read only the columns needed
-- for idempotent retries and duplicate flagging. It cannot read names, mobiles or
-- comments back, and cannot UPDATE or DELETE leads. Staff tooling (scripts/leads.ts)
-- must use a separate, more privileged role.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'reshape_web') THEN
    CREATE ROLE reshape_web LOGIN;
  END IF;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM reshape_web;
GRANT USAGE ON SCHEMA public TO reshape_web;
GRANT INSERT ON lead_submissions, consent_events TO reshape_web;
GRANT SELECT (id, idempotency_key, payload_hash, group_key) ON lead_submissions TO reshape_web;
GRANT SELECT, INSERT, UPDATE, DELETE ON rate_limits TO reshape_web;
