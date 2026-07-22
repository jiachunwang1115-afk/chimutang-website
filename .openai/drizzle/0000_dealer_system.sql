CREATE TABLE IF NOT EXISTS dealer_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'dealer')),
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_iterations INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  must_change_password INTEGER NOT NULL DEFAULT 1,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS dealer_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  user_agent TEXT,
  ip_hint TEXT,
  FOREIGN KEY (user_id) REFERENCES dealer_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dealer_quotes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  dealer_name TEXT NOT NULL,
  title TEXT NOT NULL,
  project_name TEXT NOT NULL,
  city TEXT NOT NULL,
  quote_date TEXT NOT NULL,
  line_count INTEGER NOT NULL,
  total_net_area REAL NOT NULL,
  total_billable_area REAL NOT NULL,
  total_cents INTEGER NOT NULL,
  draft_json TEXT NOT NULL,
  totals_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES dealer_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS dealer_sessions_user_idx ON dealer_sessions(user_id);
CREATE INDEX IF NOT EXISTS dealer_sessions_expiry_idx ON dealer_sessions(expires_at);
CREATE INDEX IF NOT EXISTS dealer_quotes_user_updated_idx ON dealer_quotes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS dealer_quotes_updated_idx ON dealer_quotes(updated_at DESC);
