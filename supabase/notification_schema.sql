-- =====================================================
-- NOTIFICATION SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  target_role TEXT, -- e.g., 'admin' usually sees 'waiting_approval', 'user' sees 'approved'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Mock Data (Optional)
INSERT INTO notifications (type, title, message, link, is_read, created_at)
VALUES 
  ('info', 'ยินดีต้อนรับ', 'ยินดีต้อนรับสู่ระบบเบิกจ่าย Liqflow Expense', '/expenses', FALSE, NOW()),
  ('success', 'อนุมัติแล้ว', 'รายการเบิก #EXP-001 ของคุณได้รับการอนุมัติแล้ว', '/expenses', TRUE, NOW() - INTERVAL '1 day');
