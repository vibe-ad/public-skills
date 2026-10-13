-- Excerpt of our production database, with a few real rows for context.

CREATE TABLE campaigns (
  id              UUID PRIMARY KEY,
  advertiser_id   UUID NOT NULL REFERENCES advertisers(id),
  vibe_advertiser UUID,
  name            TEXT NOT NULL,
  objective       TEXT NOT NULL CHECK (objective IN ('awareness', 'installs', 'traffic', 'sales', 'leads')),
  target_cpa_usd  NUMERIC(10, 2),
  budget_usd      NUMERIC(12, 2) NOT NULL,
  starts_on       DATE NOT NULL,
  ends_on         DATE,
  is_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  contact_email   TEXT NOT NULL,
  contact_phone   TEXT
);

INSERT INTO campaigns VALUES
  ('3f1c2a7e-8b4d-4c1e-9a55-0d2f6b8e1a01', 'a9d1e3f5-2b4c-4d6e-8f10-1a2b3c4d5e6f', '7c9e6679-7425-40de-944b-e07fc1f90ae7',
   'Spring Sale 2026 CTV', 'sales', 42.50, 25000.00, '2026-04-01', '2026-04-30', TRUE,
   'maria.gonzalez@brightpeak.example', '+1 415 555 0132'),
  ('b2e4d6f8-1a3c-4e5f-9b7d-2c4e6f8a0b1d', 'a9d1e3f5-2b4c-4d6e-8f10-1a2b3c4d5e6f', NULL,
   'App launch', 'installs', NULL, 8000.00, '2026-05-15', NULL, FALSE,
   'devon.okafor@brightpeak.example', NULL);
