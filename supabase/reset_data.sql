-- =====================================================
-- RESET DATA FOR PRODUCTION
-- ล้างข้อมูล Transaction ทั้งหมด แต่เก็บ Master Data ไว้
-- =====================================================

-- 1. ลบข้อมูลในตารางลูกก่อน (ตารางที่อ้างอิงตารางอื่น)
TRUNCATE TABLE expense_audit_logs CASCADE;
TRUNCATE TABLE attachments CASCADE;
TRUNCATE TABLE notifications CASCADE;

-- 2. ลบข้อมูลในตารางหลัก
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE recurring_expenses CASCADE;

-- (Optional) ถ้าต้องการลบ Master Data ด้วย ให้เอา comment ออก
-- TRUNCATE TABLE categories CASCADE;
-- TRUNCATE TABLE departments CASCADE;
-- TRUNCATE TABLE payment_methods CASCADE;

-- =====================================================
-- ตรวจสอบผลลัพธ์
-- =====================================================
SELECT 'expenses' as table_name, count(*) as row_count FROM expenses
UNION ALL
SELECT 'recurring_expenses', count(*) FROM recurring_expenses
UNION ALL
SELECT 'notifications', count(*) FROM notifications;
