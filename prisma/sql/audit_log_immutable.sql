-- Blocks UPDATE/DELETE on audit_log (append-only).
-- Apply with: npx prisma db execute --file prisma/sql/audit_log_immutable.sql

CREATE OR REPLACE FUNCTION audit_log_immutable_guard()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_update ON "audit_log";
CREATE TRIGGER audit_log_no_update
BEFORE UPDATE ON "audit_log"
FOR EACH ROW
EXECUTE FUNCTION audit_log_immutable_guard();

DROP TRIGGER IF EXISTS audit_log_no_delete ON "audit_log";
CREATE TRIGGER audit_log_no_delete
BEFORE DELETE ON "audit_log"
FOR EACH ROW
EXECUTE FUNCTION audit_log_immutable_guard();

