-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants (organizations / teams)
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Users (linked to Supabase Auth)
CREATE TABLE users (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id),
  tenant_id           UUID REFERENCES tenants(id),
  email               VARCHAR(255) NOT NULL,
  full_name           VARCHAR(255),
  role                VARCHAR(50) DEFAULT 'read-only',  -- admin|analyst|read-only
  permitted_doc_types TEXT[] DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID REFERENCES tenants(id),
  uploaded_by     UUID REFERENCES users(id),
  filename        VARCHAR(500) NOT NULL,
  document_type   VARCHAR(100) NOT NULL,
  file_path       TEXT,          -- Supabase Storage path
  file_size_bytes BIGINT,
  page_count      INT,
  chunk_count     INT DEFAULT 0,
  status          VARCHAR(50) DEFAULT 'processing',  -- processing|ready|failed
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Query Sessions
CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  tenant_id   UUID REFERENCES tenants(id),
  title       VARCHAR(255),     -- auto-generated from first query
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log (every query logged for compliance)
CREATE TABLE audit_log (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id           UUID REFERENCES sessions(id),
  user_id              UUID REFERENCES users(id),
  tenant_id            UUID REFERENCES tenants(id),
  query_text           TEXT NOT NULL,
  response_text        TEXT,
  retrieved_chunk_ids  TEXT[],
  valid_citations      TEXT[],
  unverified_citations TEXT[],
  cache_hit            BOOLEAN DEFAULT FALSE,
  latency_ms           INT,
  hallucination_flagged BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks (audit trail, mirrors ChromaDB)
CREATE TABLE document_chunks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_id       UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_uuid   VARCHAR(64) UNIQUE NOT NULL,
  chunk_index  INT NOT NULL,
  page_number  INT,
  token_count  INT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (multi-tenant isolation at DB level)
ALTER TABLE documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Policies: users only see their own tenant's data
CREATE POLICY "tenant_isolation_documents" ON documents
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "tenant_isolation_sessions" ON sessions
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "tenant_isolation_audit" ON audit_log
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );
