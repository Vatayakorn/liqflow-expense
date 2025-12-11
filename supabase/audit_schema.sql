-- =====================================================
-- AUDIT TRAIL SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- ตารางแจงรายการเปลี่ยนแปลง (Audit Logs)
CREATE TABLE IF NOT EXISTS expense_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'approve', 'reject', 'pay', 'comment')),
  actor_name TEXT NOT NULL, -- ชื่อคนทำรายการ (อนาคตจะเป็น user_id)
  actor_role TEXT, -- ตำแหน่ง เช่น Admin, Manager
  old_status TEXT, -- สถานะเดิม (ถ้ามี)
  new_status TEXT, -- สถานะใหม่ (ถ้ามี)
  comment TEXT, -- รายละเอียดเพิ่มเติม หรือเหตุผลการ reject
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index สำหรับดึงประวัติของ expense
CREATE INDEX IF NOT EXISTS idx_audit_logs_expense ON expense_audit_logs(expense_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON expense_audit_logs(created_at DESC);

-- RLS (ปิดไว้ก่อนจนกว่าจะมี Auth)
-- ALTER TABLE expense_audit_logs ENABLE ROW LEVEL SECURITY;
