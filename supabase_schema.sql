-- ==============================================================================
-- SISTEM INFORMASI SHIFT JAGA INSTALASI LABORATORIUM
-- RSUD SULTAN MUHAMMAD JAMALUDIN I KAYONG UTARA
-- Supabase PostgreSQL Database Schema
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Staff (Data Petugas ATLM & Pengelola)
CREATE TABLE IF NOT EXISTS staff (
    staff_id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    employee_number TEXT, -- NIP / NIK / No. STR ATLM
    position TEXT NOT NULL, -- contoh: Penanggung Jawab Lab, Koordinator Shift, ATLM Hematologi, ATLM Kimia Klinik
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users (Akun & Peran Otentikasi)
CREATE TABLE IF NOT EXISTS app_users (
    uid TEXT PRIMARY KEY,
    staff_id TEXT REFERENCES staff(staff_id) ON DELETE SET NULL,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'coordinator', 'staff')),
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Shift Master Configuration
CREATE TABLE IF NOT EXISTS shifts (
    shift_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    minimum_staff INTEGER DEFAULT 2,
    color TEXT DEFAULT '#0d9488',
    is_overnight BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Schedules (Jadwal Shift Kerja)
CREATE TABLE IF NOT EXISTS schedules (
    schedule_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    staff_id TEXT NOT NULL REFERENCES staff(staff_id) ON DELETE CASCADE,
    shift_id TEXT NOT NULL REFERENCES shifts(shift_id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'changed', 'cancelled')) DEFAULT 'draft',
    notes TEXT,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Shift Swap Requests (Permohonan Tukar Shift)
CREATE TABLE IF NOT EXISTS shift_swap_requests (
    request_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    requester_staff_id TEXT NOT NULL REFERENCES staff(staff_id),
    target_staff_id TEXT NOT NULL REFERENCES staff(staff_id),
    source_schedule_id TEXT NOT NULL REFERENCES schedules(schedule_id),
    target_schedule_id TEXT NOT NULL REFERENCES schedules(schedule_id),
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Leave & Permission Requests (Cuti & Izin)
CREATE TABLE IF NOT EXISTS leave_requests (
    request_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    staff_id TEXT NOT NULL REFERENCES staff(staff_id),
    leave_type TEXT NOT NULL CHECK (leave_type IN ('cuti_tahunan', 'izin_sakit', 'izin_penting', 'tugas_luar')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Attendance (Presensi Check-in & Check-out)
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    staff_id TEXT NOT NULL REFERENCES staff(staff_id),
    schedule_id TEXT REFERENCES schedules(schedule_id),
    date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('present', 'late', 'excused', 'absent')) DEFAULT 'present',
    notes TEXT,
    is_corrected BOOLEAN DEFAULT false,
    corrected_by TEXT,
    correction_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Shift Handovers (Serah Terima Jaga Laboratorium)
CREATE TABLE IF NOT EXISTS handovers (
    handover_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    shift_id TEXT NOT NULL REFERENCES shifts(shift_id),
    handover_date DATE NOT NULL,
    outgoing_staff_id TEXT NOT NULL REFERENCES staff(staff_id),
    incoming_staff_id TEXT NOT NULL REFERENCES staff(staff_id),
    pending_samples TEXT, -- Catatan sampel CITO / rujukan / belum selesai
    equipment_status TEXT, -- Status alat hematology, chemistry analyzer, inkubator
    reagent_notes TEXT,   -- Kondisi persediaan reagen & kontrol kualitas
    follow_up_notes TEXT, -- Tindak lanjut penting untuk jaga berikutnya
    status TEXT NOT NULL CHECK (status IN ('submitted', 'confirmed')) DEFAULT 'submitted',
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. In-App Notifications
CREATE TABLE IF NOT EXISTS notifications (
    notification_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    recipient_id TEXT NOT NULL, -- staff_id or user uid
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'schedule_publish', 'swap_request', 'swap_decision', 'leave_decision', 'conflict_warning'
    is_read BOOLEAN DEFAULT false,
    ref_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Audit Logs (Catatan Audit Aktivitas Sistem)
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'LOGIN', 'SCHEDULE_CREATE', 'SCHEDULE_PUBLISH', 'SWAP_APPROVE', etc.
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    before_data JSONB,
    after_data JSONB,
    reason TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_staff ON schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON attendance(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
