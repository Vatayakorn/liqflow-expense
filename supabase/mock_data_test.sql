-- =====================================================
-- MOCK DATA GENERATOR (TEST VERSION)
-- Run this in Supabase SQL Editor to populate test data with Attachments
-- =====================================================

DO $$
DECLARE
  -- Variables for IDs
  cat_office UUID;
  cat_marketing UUID;
  cat_food UUID;
  cat_travel UUID;
  cat_util UUID;
  
  dept_trading UUID;
  dept_dev UUID;
  dept_marketing UUID;
  dept_admin UUID;
  
  pm_kbank UUID;
  pm_credit UUID;
  pm_cash UUID;
  
  exp_id_1 UUID;
  exp_id_2 UUID;
  exp_id_3 UUID;
  
  current_month TEXT;
  
BEGIN
  -- 1. Ensure Categories exist and Get IDs
  INSERT INTO categories (name, icon, color) VALUES ('สำนักงาน', '🏢', 'blue') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO cat_office FROM categories WHERE name = 'สำนักงาน';

  INSERT INTO categories (name, icon, color) VALUES ('การตลาด', '📢', 'purple') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO cat_marketing FROM categories WHERE name = 'การตลาด';

  INSERT INTO categories (name, icon, color) VALUES ('อาหาร', '🍽️', 'orange') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO cat_food FROM categories WHERE name = 'อาหาร';

  INSERT INTO categories (name, icon, color) VALUES ('เดินทาง', '✈️', 'green') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO cat_travel FROM categories WHERE name = 'เดินทาง';

  INSERT INTO categories (name, icon, color) VALUES ('สาธารณูปโภค', '⚡', 'yellow') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO cat_util FROM categories WHERE name = 'สาธารณูปโภค';
  
  -- 2. Ensure Departments exist and Get IDs
  INSERT INTO departments (name) VALUES ('Trading') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO dept_trading FROM departments WHERE name = 'Trading';

  INSERT INTO departments (name) VALUES ('Development') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO dept_dev FROM departments WHERE name = 'Development';

  INSERT INTO departments (name) VALUES ('Marketing') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO dept_marketing FROM departments WHERE name = 'Marketing';

  INSERT INTO departments (name) VALUES ('Backoffice') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO dept_admin FROM departments WHERE name = 'Backoffice';
  
  -- 3. Ensure Payment Methods exist and Get IDs
  INSERT INTO payment_methods (name, icon) VALUES ('KBank', '🏦') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO pm_kbank FROM payment_methods WHERE name = 'KBank';

  INSERT INTO payment_methods (name, icon) VALUES ('Credit Card', '💳') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO pm_credit FROM payment_methods WHERE name = 'Credit Card';

  INSERT INTO payment_methods (name, icon) VALUES ('Cash', '💵') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO pm_cash FROM payment_methods WHERE name = 'Cash';
  
  -- Current Month String (YYYY-MM)
  current_month := TO_CHAR(NOW(), 'YYYY-MM');

  -- 4. Insert Expenses with Attachments
  
  -- Expense 1: Approved with Slip
  INSERT INTO expenses (date, amount, category_id, department_id, payment_method_id, description, vendor, created_by_name, status)
  VALUES (NOW()::DATE, 1500.00, cat_office, dept_admin, pm_kbank, 'ซื้อกระดาษ A4 และหมึกพิมพ์ (Test Attachment)', 'OfficeMate', 'Admin', 'approved')
  RETURNING id INTO exp_id_1;

  INSERT INTO attachments (expense_id, attachment_type, file_path, file_name)
  VALUES (exp_id_1, 'slip', 'mock/slip_test.jpg', 'slip_officemate.jpg');

  -- Expense 2: Paid with Invoice and Receipt
  INSERT INTO expenses (date, amount, category_id, department_id, payment_method_id, description, vendor, created_by_name, status)
  VALUES (NOW()::DATE - INTERVAL '2 days', 25000.00, cat_marketing, dept_marketing, pm_credit, 'ค่าโฆษณา Facebook Ads (Test Multi Attach)', 'Meta', 'Marketing Mgr', 'paid')
  RETURNING id INTO exp_id_2;

  INSERT INTO attachments (expense_id, attachment_type, file_path, file_name)
  VALUES 
    (exp_id_2, 'invoice', 'mock/invoice_fb.pdf', 'invoice_fb_ads.pdf'),
    (exp_id_2, 'receipt', 'mock/receipt_fb.jpg', 'receipt_fb_ads.jpg');

  -- Expense 3: Draft with Product Photo
  INSERT INTO expenses (date, amount, category_id, department_id, payment_method_id, description, vendor, created_by_name, status)
  VALUES (NOW()::DATE - INTERVAL '1 day', 500.00, cat_food, dept_marketing, pm_cash, 'กาแฟรับแขก (Test Photo)', 'Starbucks', 'Reception', 'draft')
  RETURNING id INTO exp_id_3;

  INSERT INTO attachments (expense_id, attachment_type, file_path, file_name)
  VALUES (exp_id_3, 'product_photo', 'mock/coffee.jpg', 'starbucks_coffee.jpg');
  
  -- 5. Insert Budgets
  INSERT INTO budgets (budget_type, department_id, month, amount, alert_threshold)
  VALUES ('department', dept_marketing, current_month, 50000.00, 80)
  ON CONFLICT (department_id, month) DO NOTHING;
  
  INSERT INTO budgets (budget_type, category_id, month, amount, alert_threshold)
  VALUES ('category', cat_office, current_month, 10000.00, 90)
  ON CONFLICT (category_id, month) DO NOTHING;

  -- 6. Insert Recurring Expenses
  INSERT INTO recurring_expenses (description, amount, category_id, payment_method_id, department_id, vendor, frequency, start_date, next_due_date, created_by_name)
  VALUES 
    ('ค่าเช่า Office', 15000.00, cat_office, pm_kbank, dept_admin, 'Landlord', 'monthly', NOW()::DATE, NOW()::DATE + INTERVAL '1 month', 'Admin'),
    ('Adobe Creative Cloud', 2000.00, cat_office, pm_credit, dept_marketing, 'Adobe', 'monthly', NOW()::DATE, NOW()::DATE + INTERVAL '15 days', 'Marketing Mgr');

END $$;
