-- ==============================================================================
-- S.I.R.I.S — PostgreSQL / Supabase Core Database Schema Reference
-- ==============================================================================

-- 1. Police Stations Table
CREATE TABLE IF NOT EXISTS police_stations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'Odisha',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL,
    station_id VARCHAR(50) REFERENCES police_stations(id) ON DELETE SET NULL,
    rank_title VARCHAR(80),
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Cases Table
CREATE TABLE IF NOT EXISTS case_records (
    id VARCHAR(50) PRIMARY KEY,
    fir_number VARCHAR(60) NOT NULL UNIQUE,
    station_id VARCHAR(50) NOT NULL REFERENCES police_stations(id),
    investigator_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    crime_type VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    priority VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    incident_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Case Records
CREATE INDEX IF NOT EXISTS idx_case_fir_number ON case_records(fir_number);
CREATE INDEX IF NOT EXISTS idx_case_station_id ON case_records(station_id);
CREATE INDEX IF NOT EXISTS idx_case_investigator_id ON case_records(investigator_id);
CREATE INDEX IF NOT EXISTS idx_case_status ON case_records(status);
CREATE INDEX IF NOT EXISTS idx_case_priority ON case_records(priority);

-- 4. Case Element Collections
CREATE TABLE IF NOT EXISTS case_bns_sections (
    case_id VARCHAR(50) NOT NULL REFERENCES case_records(id) ON DELETE CASCADE,
    section VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS case_suspects (
    case_id VARCHAR(50) NOT NULL REFERENCES case_records(id) ON DELETE CASCADE,
    suspect VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS case_vehicles (
    case_id VARCHAR(50) NOT NULL REFERENCES case_records(id) ON DELETE CASCADE,
    vehicle VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS case_locations (
    case_id VARCHAR(50) NOT NULL REFERENCES case_records(id) ON DELETE CASCADE,
    location VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS case_evidence_refs (
    case_id VARCHAR(50) NOT NULL REFERENCES case_records(id) ON DELETE CASCADE,
    evidence_ref VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS case_cctv_refs (
    case_id VARCHAR(50) NOT NULL REFERENCES case_records(id) ON DELETE CASCADE,
    cctv_ref VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS case_linked_ids (
    case_id VARCHAR(50) NOT NULL REFERENCES case_records(id) ON DELETE CASCADE,
    linked_case_id VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS case_extracted_entities (
    case_id VARCHAR(50) NOT NULL REFERENCES case_records(id) ON DELETE CASCADE,
    entity_type VARCHAR(255) NOT NULL,
    entity_value VARCHAR(255) NOT NULL
);

-- 5. Evidence Table
CREATE TABLE IF NOT EXISTS evidence (
    id VARCHAR(50) PRIMARY KEY,
    case_id VARCHAR(50) NOT NULL REFERENCES case_records(id) ON DELETE CASCADE,
    uploader_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    source VARCHAR(200),
    file_metadata TEXT,
    description TEXT NOT NULL,
    evidence_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence_extracted_entities (
    evidence_id VARCHAR(50) NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    entity_type VARCHAR(255) NOT NULL,
    entity_value VARCHAR(255) NOT NULL
);

-- 6. Access Requests Table
CREATE TABLE IF NOT EXISTS access_requests (
    id VARCHAR(50) PRIMARY KEY,
    requesting_station_id VARCHAR(50) NOT NULL REFERENCES police_stations(id),
    requesting_officer_id VARCHAR(50) NOT NULL REFERENCES users(id),
    target_station_id VARCHAR(50) NOT NULL REFERENCES police_stations(id),
    target_case_id VARCHAR(50) NOT NULL REFERENCES case_records(id) ON DELETE CASCADE,
    approver_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_requesting_station ON access_requests(requesting_station_id);
CREATE INDEX IF NOT EXISTS idx_target_station ON access_requests(target_station_id);
CREATE INDEX IF NOT EXISTS idx_target_case ON access_requests(target_case_id);

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    user_relation_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(150),
    user_role VARCHAR(30),
    station_id VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    ip_address VARCHAR(50),
    details TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_station_id ON audit_logs(station_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

-- 8. Intelligence Alerts Table
CREATE TABLE IF NOT EXISTS intelligence_alerts (
    id VARCHAR(50) PRIMARY KEY,
    alert_type VARCHAR(40) NOT NULL,
    message TEXT NOT NULL,
    related_case_id VARCHAR(50) REFERENCES case_records(id) ON DELETE SET NULL,
    target_case_id VARCHAR(50) REFERENCES case_records(id) ON DELETE SET NULL,
    target_station_id VARCHAR(50) REFERENCES police_stations(id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alert_type ON intelligence_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alert_target_station ON intelligence_alerts(target_station_id);
CREATE INDEX IF NOT EXISTS idx_alert_created ON intelligence_alerts(created_at);
