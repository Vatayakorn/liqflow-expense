import { supabase } from '$lib/supabase';

export type AuditAction = 'create' | 'update' | 'approve' | 'reject' | 'pay' | 'comment';

interface LogAuditParams {
    expenseId: string;
    action: AuditAction;
    actorName: string;
    actorRole?: string;
    oldStatus?: string;
    newStatus?: string;
    comment?: string;
}

/**
 * บันทึก Audit Log ลงฐานข้อมูล
 */
export async function logAudit({
    expenseId,
    action,
    actorName,
    actorRole = 'User',
    oldStatus,
    newStatus,
    comment
}: LogAuditParams) {
    try {
        const { error } = await supabase.from('expense_audit_logs').insert({
            expense_id: expenseId,
            action,
            actor_name: actorName,
            actor_role: actorRole,
            old_status: oldStatus,
            new_status: newStatus,
            comment
        });

        if (error) {
            console.error('Failed to log audit:', error);
        }
    } catch (err) {
        console.error('Error logging audit:', err);
    }
}
