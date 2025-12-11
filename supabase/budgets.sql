-- =====================================================
-- Budget Management Schema
-- รันไฟล์นี้ใน Supabase SQL Editor
-- =====================================================

-- ตารางงบประมาณ
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_type TEXT NOT NULL CHECK (budget_type IN ('category', 'department')),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- YYYY-MM format
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  alert_threshold INTEGER NOT NULL DEFAULT 80 CHECK (alert_threshold >= 0 AND alert_threshold <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- ต้องมี category_id หรือ department_id อย่างใดอย่างหนึ่ง
  CONSTRAINT budget_target_check CHECK (
    (budget_type = 'category' AND category_id IS NOT NULL AND department_id IS NULL) OR
    (budget_type = 'department' AND department_id IS NOT NULL AND category_id IS NULL)
  ),
  
  -- ไม่ซ้ำกันในแต่ละเดือน
  CONSTRAINT unique_category_month UNIQUE (category_id, month),
  CONSTRAINT unique_department_month UNIQUE (department_id, month)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_department ON budgets(department_id);

-- Trigger อัปเดต updated_at
CREATE OR REPLACE TRIGGER budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
