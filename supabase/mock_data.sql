-- =====================================================
-- MOCK DATA GENERATOR (ROBUST VERSION)
-- Run this in Supabase SQL Editor to populate test data
-- =====================================================

DO $$
DECLARE
  -- Variables for IDs
  cat_office UUID;
  cat_marketing UUID;
  cat_food UUID;
  cat_travel UUID;
  cat_util UUID;
  cat_gift UUID;
  
  dept_trading UUID;
  dept_dev UUID;
  dept_marketing UUID;
  dept_admin UUID;
  
  pm_kbank UUID;
  pm_credit UUID;
  pm_cash UUID;
  
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

  INSERT INTO categories (name, icon, color) VALUES ('ของขวัญ', '🎁', 'pink') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO cat_gift FROM categories WHERE name = 'ของขวัญ';
  
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

  -- 4. Insert Expenses (Current Month)
  INSERT INTO expenses (date, amount, category_id, department_id, payment_method_id, description, vendor, created_by_name, status)
  VALUES 
    (NOW()::DATE, 1500.00, cat_office, dept_admin, pm_kbank, 'ซื้อกระดาษ A4 และหมึกพิมพ์', 'OfficeMate', 'Admin', 'approved'),
    (NOW()::DATE - INTERVAL '2 days', 25000.00, cat_marketing, dept_marketing, pm_credit, 'ค่าโฆษณา Facebook Ads', 'Meta', 'Marketing Mgr', 'paid'),
    (NOW()::DATE - INTERVAL '5 days', 1200.00, cat_food, dept_dev, pm_cash, 'เลี้ยง Pizza ทีม Dev', 'Pizza Company', 'CTO', 'approved'),
    (NOW()::DATE - INTERVAL '10 days', 4500.00, cat_travel, dept_trading, pm_kbank, 'ค่าเดินทางไปพบลูกค้า', 'Grab', 'Sales 1', 'approved'),
    (NOW()::DATE - INTERVAL '12 days', 8000.00, cat_util, dept_admin, pm_kbank, 'ค่าไฟเดือนนี้', 'MEA', 'Admin', 'paid'),
    (NOW()::DATE - INTERVAL '15 days', 15000.00, cat_office, dept_dev, pm_credit, 'ซื้อเก้าอี้ทำงานใหม่ 3 ตัว', 'IKEA', 'Admin', 'approved'),
    (NOW()::DATE - INTERVAL '1 day', 500.00, cat_food, dept_marketing, pm_cash, 'กาแฟรับแขก', 'Starbucks', 'Reception', 'draft');

  -- 5. Insert Expenses (Previous Month for Comparison)
  INSERT INTO expenses (date, amount, category_id, department_id, payment_method_id, description, vendor, created_by_name, status)
  VALUES 
    (NOW()::DATE - INTERVAL '1 month', 20000.00, cat_marketing, dept_marketing, pm_credit, 'ค่าโฆษณาเดือนที่แล้ว', 'Google Ads', 'Marketing Mgr', 'paid'),
    (NOW()::DATE - INTERVAL '1 month' - INTERVAL '5 days', 5000.00, cat_office, dept_admin, pm_kbank, 'ค่าแม่บ้าน', 'Cleaning Co', 'Admin', 'paid');
    
  -- 6. Insert Expenses (Previous Year comparison)
  INSERT INTO expenses (date, amount, category_id, department_id, payment_method_id, description, vendor, created_by_name, status)
  VALUES 
    (NOW()::DATE - INTERVAL '1 year', 10000.00, cat_marketing, dept_marketing, pm_credit, 'ค่าโฆษณาปีก่อน', 'Facebook', 'Marketing Mgr', 'paid');

  -- 7. Insert Budgets (Current Month)
  -- Marketing Budget
  INSERT INTO budgets (budget_type, department_id, month, amount, alert_threshold)
  VALUES ('department', dept_marketing, current_month, 50000.00, 80)
  ON CONFLICT (department_id, month) DO NOTHING;
  
  -- Office Supplies Budget
  INSERT INTO budgets (budget_type, category_id, month, amount, alert_threshold)
  VALUES ('category', cat_office, current_month, 10000.00, 90)
  ON CONFLICT (category_id, month) DO NOTHING;
  
  -- Food Budget
  INSERT INTO budgets (budget_type, category_id, month, amount, alert_threshold)
  VALUES ('category', cat_food, current_month, 5000.00, 70)
  ON CONFLICT (category_id, month) DO NOTHING;

END $$;
