-- =====================================================
-- Mock Data for Recurring Expenses
-- =====================================================

-- Insert sample recurring expenses
INSERT INTO recurring_expenses (
  description,
  amount,
  category_id,
  payment_method_id,
  department_id,
  vendor,
  frequency,
  start_date,
  next_due_date,
  active,
  created_by_name
) VALUES
-- 1. ค่าเช่าออฟฟิศ (รายเดือน)
(
  'ค่าเช่าออฟฟิศประจำเดือน',
  25000.00,
  (SELECT id FROM categories LIMIT 1), -- ใช้รายการแรกถ้าหาไม่เจอ
  (SELECT id FROM payment_methods LIMIT 1), -- ใช้รายการแรกถ้าหาไม่เจอ
  (SELECT id FROM departments LIMIT 1), -- ใช้รายการแรกถ้าหาไม่เจอ
  'WeWork Thailand',
  'monthly',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 month',
  true,
  'Manager Somchai'
),
-- 2. ค่าอินเทอร์เน็ต (รายเดือน)
(
  'ค่าอินเทอร์เน็ต Fiber Optic',
  1200.00,
  (SELECT id FROM categories LIMIT 1),
  (SELECT id FROM payment_methods LIMIT 1),
  (SELECT id FROM departments LIMIT 1),
  'AIS Fibre',
  'monthly',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 month',
  true,
  'Manager Somchai'
),
-- 3. ค่าแม่บ้าน (รายสัปดาห์)
(
  'ค่าจ้างแม่บ้านทำความสะอาด',
  3500.00,
  (SELECT id FROM categories LIMIT 1),
  (SELECT id FROM payment_methods LIMIT 1),
  (SELECT id FROM departments LIMIT 1),
  'ป้าแจ๋ว บริการความสะอาด',
  'weekly',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 week',
  true,
  'Manager Somchai'
),
-- 4. ค่าเช่า Server (รายปี)
(
  'ค่าเช่า Cloud Server AWS',
  150000.00,
  (SELECT id FROM categories LIMIT 1),
  (SELECT id FROM payment_methods LIMIT 1),
  (SELECT id FROM departments LIMIT 1),
  'Amazon Web Services',
  'yearly',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year',
  true,
  'Manager Somchai'
),
-- 5. ค่าเช่าเครื่องถ่ายเอกสาร (รายเดือน) - Inactive
(
  'ค่าเช่าเครื่องถ่ายเอกสาร (ยกเลิกแล้ว)',
  4500.00,
  (SELECT id FROM categories LIMIT 1),
  (SELECT id FROM payment_methods LIMIT 1),
  (SELECT id FROM departments LIMIT 1),
  'Fuji Xerox',
  'monthly',
  CURRENT_DATE - INTERVAL '3 months',
  CURRENT_DATE - INTERVAL '2 months',
  false,
  'Manager Somchai'
);
