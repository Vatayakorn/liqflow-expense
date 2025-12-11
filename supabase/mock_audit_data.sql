-- =====================================================
-- MOCK AUDIT DATA GENERATOR
-- Run this in Supabase SQL Editor AFTER running mock_data.sql
-- =====================================================

DO $$
DECLARE
  exp_record RECORD;
BEGIN
  -- Iterate all expenses to add logs
  FOR exp_record IN SELECT * FROM expenses LOOP
    
    -- 1. Create Log (Every expense has this)
    INSERT INTO expense_audit_logs (expense_id, action, actor_name, actor_role, old_status, new_status, comment, created_at)
    VALUES (
      exp_record.id, 
      'create', 
      exp_record.created_by_name, 
      'Requester', 
      NULL, 
      'draft', 
      'สร้างรายการขอเบิกใหม่', 
      exp_record.created_at
    );
    
    -- 2. If status is 'approved' or 'paid', add approve log
    IF exp_record.status IN ('approved', 'paid') THEN
      INSERT INTO expense_audit_logs (expense_id, action, actor_name, actor_role, old_status, new_status, comment, created_at)
      VALUES (
        exp_record.id, 
        'approve', 
        'Manager Somchai', 
        'Manager', 
        'draft', 
        'approved', 
        'อนุมัติครับ ดำเนินการต่อได้', 
        exp_record.created_at + INTERVAL '2 hours'
      );
    END IF;

    -- 3. If status is 'paid', add payment log
    IF exp_record.status = 'paid' THEN
      INSERT INTO expense_audit_logs (expense_id, action, actor_name, actor_role, old_status, new_status, comment, created_at)
      VALUES (
        exp_record.id, 
        'pay', 
        'Finance Dept', 
        'Finance', 
        'approved', 
        'paid', 
        'โอนเงินเรียบร้อยแล้ว Ref: KBANK-123456', 
        exp_record.created_at + INTERVAL '1 day'
      );
    END IF;
    
    -- 4. Randomly add some comments/updates
    IF (RANDOM() > 0.7) THEN
       INSERT INTO expense_audit_logs (expense_id, action, actor_name, actor_role, old_status, new_status, comment, created_at)
      VALUES (
        exp_record.id, 
        'update', 
        exp_record.created_by_name, 
        'Requester', 
        'draft', 
        'draft', 
        'แก้ไขแนบไฟล์ใบเสร็จเพิ่มเติม', 
        exp_record.created_at + INTERVAL '10 minutes'
      );
    END IF;

  END LOOP;
END $$;
