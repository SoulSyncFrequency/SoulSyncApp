-- Feature Store schema
CREATE TABLE IF NOT EXISTS aiops_observations (
  id BIGSERIAL PRIMARY KEY,
  metric TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL,
  value DOUBLE PRECISION NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_aiops_obs_metric_ts ON aiops_observations(metric, ts);
CREATE TABLE IF NOT EXISTS aiops_anomalies (
  id BIGSERIAL PRIMARY KEY,
  metric TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  score DOUBLE PRECISION NOT NULL,
  method TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_aiops_anom_metric_ts ON aiops_anomalies(metric, ts);
CREATE TABLE IF NOT EXISTS aiops_models (
  id BIGSERIAL PRIMARY KEY,
  metric TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  model BYTEA NOT NULL,
  version TEXT DEFAULT 'v1'
);
CREATE INDEX IF NOT EXISTS idx_aiops_models_metric_created ON aiops_models(metric, created_at DESC);


-- Runbooks/Audit log
CREATE TABLE IF NOT EXISTS runbooks_audit (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL,                 -- detector | alertmanager | webhook | remediator
  app_label TEXT,
  namespace TEXT,
  metric TEXT,
  reasons JSONB,
  action TEXT NOT NULL,                 -- request|approval_pending|approved|rejected|executed|skipped_circuit|skipped_no_approval|collector_started
  details JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_runbooks_audit_ts ON runbooks_audit(ts DESC);
CREATE INDEX IF NOT EXISTS idx_runbooks_audit_app_ns ON runbooks_audit(app_label, namespace);
