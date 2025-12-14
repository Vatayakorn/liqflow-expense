-- =====================================================
-- MOCK DATA GENERATOR FOR LIQFLOW EXPENSE
-- Run this in Supabase SQL Editor to populate test data
-- =====================================================

-- 1. Clean up existing data (Reset)
TRUNCATE TABLE expense_audit_logs CASCADE;
TRUNCATE TABLE attachments CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE recurring_expenses CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE departments CASCADE;
TRUNCATE TABLE payment_methods CASCADE;

-- 2. Master Data

-- Categories
INSERT INTO categories (name, icon, color) VALUES
  ('อาหาร & เครื่องดื่ม', '🍔', 'orange'),
  ('การเดินทาง', '🚕', 'blue'),
  ('อุปกรณ์สำนักงาน', '📎', 'gray'),
  ('การตลาด & โฆษณา', '📢', 'purple'),
  ('ซอฟต์แวร์ & บริการ', '💻', 'indigo'),
  ('สวัสดิการพนักงาน', '🎁', 'pink'),
  ('ค่าเช่า & สถานที่', '🏢', 'red'),
  ('อื่นๆ', '📦', 'gray');

-- Departments
INSERT INTO departments (name) VALUES
  ('ฝ่ายขาย'),
  ('ฝ่ายการตลาด'),
  ('ฝ่ายไอที'),
  ('ฝ่ายบุคคล'),
  ('ฝ่ายบัญชี'),
  ('ผู้บริหาร');

-- Payment Methods
INSERT INTO payment_methods (name, icon) VALUES
  ('เงินสด', '💵'),
  ('บัตรเครดิตบริษัท', '💳'),
  ('โอนเงิน', '🏦'),
  ('สำรองจ่าย (เบิกคืน)', '👤');

-- 3. Transaction Data (Using DO block for complex relationships)
DO $$
DECLARE
  -- IDs for Master Data
  cat_food UUID;
  cat_travel UUID;
  cat_office UUID;
  cat_marketing UUID;
  cat_software UUID;
  
  dept_sales UUID;
  dept_marketing UUID;
  dept_it UUID;
  dept_hr UUID;
  
  pay_cash UUID;
  pay_credit UUID;
  pay_transfer UUID;
  pay_advance UUID;

  -- Expense IDs
  exp_1 UUID;
  exp_2 UUID;
  exp_3 UUID;
  exp_4 UUID;
  exp_5 UUID;

BEGIN
  -- Get IDs
  SELECT id INTO cat_food FROM categories WHERE name = 'อาหาร & เครื่องดื่ม';
  SELECT id INTO cat_travel FROM categories WHERE name = 'การเดินทาง';
  SELECT id INTO cat_office FROM categories WHERE name = 'อุปกรณ์สำนักงาน';
  SELECT id INTO cat_marketing FROM categories WHERE name = 'การตลาด & โฆษณา';
  SELECT id INTO cat_software FROM categories WHERE name = 'ซอฟต์แวร์ & บริการ';

  SELECT id INTO dept_sales FROM departments WHERE name = 'ฝ่ายขาย';
  SELECT id INTO dept_marketing FROM departments WHERE name = 'ฝ่ายการตลาด';
  SELECT id INTO dept_it FROM departments WHERE name = 'ฝ่ายไอที';
  SELECT id INTO dept_hr FROM departments WHERE name = 'ฝ่ายบุคคล';

  SELECT id INTO pay_cash FROM payment_methods WHERE name = 'เงินสด';
  SELECT id INTO pay_credit FROM payment_methods WHERE name = 'บัตรเครดิตบริษัท';
  SELECT id INTO pay_transfer FROM payment_methods WHERE name = 'โอนเงิน';
  SELECT id INTO pay_advance FROM payment_methods WHERE name = 'สำรองจ่าย (เบิกคืน)';

  -- Expense 1: Draft (Sales Lunch)
  INSERT INTO expenses (date, amount, category_id, payment_method_id, vendor, description, note_internal, status, created_by_name, department_id, created_at)
  VALUES (CURRENT_DATE, 1500.00, cat_food, pay_advance, 'MK Restaurant', 'เลี้ยงรับรองลูกค้า บริษัท ABC', 'ลูกค้า VIP', 'draft', 'สมชาย ขายเก่ง', dept_sales, NOW() - INTERVAL '2 days')
  RETURNING id INTO exp_1;

  -- Audit Log for Exp 1
  INSERT INTO expense_audit_logs (expense_id, action, actor_name, actor_role, new_status, comment, created_at)
  VALUES (exp_1, 'create', 'สมชาย ขายเก่ง', 'Requester', 'draft', 'สร้างรายการขอเบิกใหม่', NOW() - INTERVAL '2 days');

  -- Expense 2: Approved (Marketing Ads)
  INSERT INTO expenses (date, amount, category_id, payment_method_id, vendor, description, status, created_by_name, department_id, created_at)
  VALUES (CURRENT_DATE - INTERVAL '5 days', 15000.00, cat_marketing, pay_credit, 'Facebook Ads', 'ค่าโฆษณาแคมเปญเดือนธันวาคม', 'approved', 'สมหญิง การตลาด', dept_marketing, NOW() - INTERVAL '5 days')
  RETURNING id INTO exp_2;

  -- Audit Logs for Exp 2
  INSERT INTO expense_audit_logs (expense_id, action, actor_name, actor_role, new_status, comment, created_at)
  VALUES 
    (exp_2, 'create', 'สมหญิง การตลาด', 'Requester', 'draft', 'สร้างรายการขอเบิกใหม่', NOW() - INTERVAL '5 days'),
    (exp_2, 'approve', 'Manager Somchai', 'Approver', 'approved', 'อนุมัติครับ', NOW() - INTERVAL '3 days');

  -- Expense 3: Paid (Office Supplies)
  INSERT INTO expenses (date, amount, category_id, payment_method_id, vendor, description, status, created_by_name, department_id, created_at)
  VALUES (CURRENT_DATE - INTERVAL '10 days', 3500.00, cat_office, pay_cash, 'OfficeMate', 'ซื้อกระดาษและหมึกพิมพ์', 'paid', 'สมศักดิ์ ธุรการ', dept_hr, NOW() - INTERVAL '10 days')
  RETURNING id INTO exp_3;

  -- Audit Logs for Exp 3
  INSERT INTO expense_audit_logs (expense_id, action, actor_name, actor_role, new_status, comment, created_at)
  VALUES 
    (exp_3, 'create', 'สมศักดิ์ ธุรการ', 'Requester', 'draft', 'สร้างรายการขอเบิกใหม่', NOW() - INTERVAL '10 days'),
    (exp_3, 'approve', 'Manager Somchai', 'Approver', 'approved', 'อนุมัติ', NOW() - INTERVAL '8 days'),
    (exp_3, 'pay', 'Finance Department', 'Admin', 'paid', 'โอนเงินเรียบร้อย', NOW() - INTERVAL '1 day');

  -- Expense 4: Rejected (Software)
  INSERT INTO expenses (date, amount, category_id, payment_method_id, vendor, description, status, created_by_name, department_id, created_at)
  VALUES (CURRENT_DATE - INTERVAL '1 day', 50000.00, cat_software, pay_credit, 'Unknown Software', 'ซื้อโปรแกรมไม่ระบุชื่อ', 'rejected', 'สมชาย ไอที', dept_it, NOW() - INTERVAL '1 day')
  RETURNING id INTO exp_4;

  -- Audit Logs for Exp 4
  INSERT INTO expense_audit_logs (expense_id, action, actor_name, actor_role, new_status, comment, created_at)
  VALUES 
    (exp_4, 'create', 'สมชาย ไอที', 'Requester', 'draft', 'สร้างรายการขอเบิกใหม่', NOW() - INTERVAL '1 day'),
    (exp_4, 'reject', 'Manager Somchai', 'Approver', 'rejected', 'ไม่อนุมัติ เนื่องจากไม่มีรายละเอียดซอฟต์แวร์', NOW());

  -- Recurring Expense
  INSERT INTO recurring_expenses (description, amount, category_id, payment_method_id, department_id, vendor, frequency, start_date, next_due_date, active, created_by_name)
  VALUES 
    ('ค่าเช่า Adobe Creative Cloud', 2500.00, cat_software, pay_credit, dept_marketing, 'Adobe', 'monthly', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', true, 'สมหญิง การตลาด'),
    ('ค่าแม่บ้านทำความสะอาด', 12000.00, cat_office, pay_transfer, dept_hr, 'Cleaning Service Co.', 'monthly', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', true, 'สมศักดิ์ ธุรการ');

  -- Notifications
  INSERT INTO notifications (type, title, message, link, is_read, created_at)
  VALUES
    ('info', 'มีรายการเบิกใหม่', 'สมชาย ขายเก่ง ได้สร้างรายการเบิกใหม่ 1,500.00 บาท', '/expenses/' || exp_1, false, NOW()),
    ('success', 'รายการอนุมัติแล้ว', 'รายการค่าโฆษณาได้รับการอนุมัติแล้ว', '/expenses/' || exp_2, true, NOW() - INTERVAL '3 days'),
    ('error', 'รายการถูกปฏิเสธ', 'รายการซื้อโปรแกรมถูกปฏิเสธ: ไม่อนุมัติ เนื่องจากไม่มีรายละเอียด', '/expenses/' || exp_4, false, NOW());

END $$;
