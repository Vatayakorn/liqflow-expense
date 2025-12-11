-- =====================================================
-- Liqflow Expense App - Database Schema
-- =====================================================
-- รันไฟล์นี้ใน Supabase SQL Editor เพื่อสร้างตารางทั้งหมด
-- =====================================================

-- ========== LOOKUP TABLES ==========

-- ตารางหมวดหมู่
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT '📦',
  color TEXT NOT NULL DEFAULT 'gray'
);

-- ตารางแผนก
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

-- ตารางวิธีชำระเงิน
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT '💳'
);

-- ========== MAIN TABLES ==========

-- ตารางรายจ่าย (หลัก)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id) ON DELETE RESTRICT,
  vendor TEXT,
  description TEXT NOT NULL,
  note_internal TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected', 'paid')),
  created_by_name TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ตารางไฟล์แนบ
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('approve_proof', 'slip', 'receipt', 'invoice', 'product_photo')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========== INDEXES ==========

-- Index สำหรับค้นหารายจ่ายตามวันที่
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);

-- Index สำหรับ filter ตาม status
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);

-- Index สำหรับ filter ตาม category
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);

-- Index สำหรับ filter ตาม department
CREATE INDEX IF NOT EXISTS idx_expenses_department ON expenses(department_id);

-- Index สำหรับหา attachments ของ expense
CREATE INDEX IF NOT EXISTS idx_attachments_expense ON attachments(expense_id);

-- ========== TRIGGER: AUTO UPDATE updated_at ==========

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========== INSERT DEFAULT DATA ==========

-- หมวดหมู่เริ่มต้น
INSERT INTO categories (name, icon, color) VALUES
  ('สำนักงาน', '🏢', 'blue'),
  ('การตลาด', '📢', 'purple'),
  ('ของขวัญ', '🎁', 'pink'),
  ('เดินทาง', '✈️', 'green'),
  ('อาหาร', '🍽️', 'orange'),
  ('สาธารณูปโภค', '⚡', 'yellow'),
  ('อุปกรณ์', '💻', 'indigo'),
  ('อื่นๆ', '📦', 'gray')
ON CONFLICT (name) DO NOTHING;

-- แผนกเริ่มต้น
INSERT INTO departments (name) VALUES
  ('Trading'),
  ('Development'),
  ('Backoffice'),
  ('Marketing'),
  ('Executive')
ON CONFLICT (name) DO NOTHING;

-- วิธีชำระเงินเริ่มต้น
INSERT INTO payment_methods (name, icon) VALUES
  ('KBank', '🏦'),
  ('SCB', '🏦'),
  ('Bangkok Bank', '🏦'),
  ('Cash', '💵'),
  ('Credit Card', '💳'),
  ('Prompt Pay', '📱')
ON CONFLICT (name) DO NOTHING;

-- ========== ROW LEVEL SECURITY (RLS) ==========
-- หมายเหตุ: เวอร์ชันนี้ยังไม่มี Auth จึงปิด RLS ไว้ก่อน
-- เมื่อเพิ่ม Auth แล้ว ค่อยเปิด RLS และเพิ่ม policies

-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- ========== STORAGE BUCKET ==========
-- สร้าง bucket สำหรับเก็บรูปภาพแนบ

-- สร้าง bucket (ต้องรันใน SQL Editor)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expense-attachments',
  'expense-attachments',
  true,  -- public bucket
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

-- Policy: ให้ทุกคนอ่านไฟล์ได้ (public read)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'expense-attachments');

-- Policy: ให้ทุกคนอัปโหลดได้ (ไม่มี auth ในเวอร์ชันนี้)
CREATE POLICY "Allow uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'expense-attachments');

-- Policy: ให้ทุกคนลบได้
CREATE POLICY "Allow deletes"
ON storage.objects FOR DELETE
USING (bucket_id = 'expense-attachments');

-- =====================================================
-- IMAGE TRANSFORMATIONS (สำหรับ Preview)
-- =====================================================
-- Supabase Storage รองรับ Image Transformations ผ่าน URL parameters:
--
-- ตัวอย่างการใช้:
-- Original: /storage/v1/object/public/expense-attachments/slip/2024/12/xxx.jpg
-- Thumbnail: /storage/v1/render/image/public/expense-attachments/slip/2024/12/xxx.jpg?width=200&height=200&resize=cover
-- Preview:   /storage/v1/render/image/public/expense-attachments/slip/2024/12/xxx.jpg?width=800&quality=80
--
-- Parameters ที่ใช้ได้:
-- - width: ความกว้าง (px)
-- - height: ความสูง (px)
-- - resize: contain | cover | fill
-- - quality: 1-100 (สำหรับ JPEG)
-- - format: origin | webp
--
-- หมายเหตุ: ต้องเปิด Image Transformations ใน Supabase Dashboard > Settings > Storage

-- =====================================================
-- จบการติดตั้ง - สามารถใช้งานได้ทันที
-- =====================================================

