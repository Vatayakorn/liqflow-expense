-- =====================================================
-- CLEAR ALL DATA (FACTORY RESET)
-- ล้างข้อมูลทั้งหมดรวมถึง Master Data (Categories, Departments, etc.)
-- =====================================================

-- 1. ลบข้อมูล Transaction และ Log
TRUNCATE TABLE expense_audit_logs CASCADE;
TRUNCATE TABLE attachments CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE recurring_expenses CASCADE;

-- 2. ลบข้อมูล Master Data
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE departments CASCADE;
TRUNCATE TABLE payment_methods CASCADE;

-- หมายเหตุ: ตาราง users ไม่ถูกลบ เพื่อรักษาข้อมูลผู้ใช้งาน
