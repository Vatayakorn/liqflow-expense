// Expense Detail - Server Load & Actions
import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { supabase, deleteFile } from '$lib/supabase';
import { logAudit } from '$lib/audit';
import { createNotification } from '$lib/notification';
import type { ExpenseStatus } from '$lib/types';

export const load: PageServerLoad = async ({ params }) => {
    // โหลด expense พร้อม relations
    const { data: expense, error: err } = await supabase
        .from('expenses')
        .select(`
            *,
            category: categories(*),
            department: departments(*),
            payment_method: payment_methods(*),
            attachments(*)
        `)
        .eq('id', params.id)
        .single();

    if (err || !expense) {
        throw error(404, 'ไม่พบรายการเบิกจ่ายนี้');
    }

    // โหลด Audit Logs
    const { data: auditLogs } = await supabase
        .from('expense_audit_logs')
        .select('*')
        .eq('expense_id', params.id)
        .order('created_at', { ascending: false });

    return {
        expense,
        auditLogs: auditLogs ?? []
    };
};

// Helper function to map status to audit action
function getAuditAction(status: ExpenseStatus): 'approve' | 'reject' | 'pay' | 'update' {
    switch (status) {
        case 'approved': return 'approve';
        case 'rejected': return 'reject';
        case 'paid': return 'pay';
        default: return 'update';
    }
}

export const actions: Actions = {
    // เปลี่ยนสถานะ
    updateStatus: async ({ request, params, locals }) => {
        const formData = await request.formData();
        const status = formData.get('status') as string;
        const comment = formData.get('comment') as string;

        // Get current user from session
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        const actorName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || (formData.get('actor_name') as string) || 'Unknown User';

        // Validation
        if (!status) {
            return fail(400, { error: 'Status is required' });
        }

        // ดึงสถานะเดิมก่อนอัปเดต
        const { data: currentExpense } = await supabase
            .from('expenses')
            .select('status')
            .eq('id', params.id)
            .single();

        const oldStatus = currentExpense?.status;
        let auditComment = comment || ''; // Initialize audit comment variable

        // Update status
        const { error: updateError } = await supabase
            .from('expenses')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', params.id);

        if (updateError) {
            return fail(500, { error: 'Failed to update status' });
        }

        // บันทึก Audit Log
        let action: 'approve' | 'reject' | 'pay' | 'update' = 'update';

        if (status === 'approved') {
            action = 'approve';
            auditComment = auditComment || 'อนุมัติรายการ';
        } else if (status === 'rejected') {
            action = 'reject';
            auditComment = auditComment || 'ปฏิเสธรายการ';
        } else if (status === 'paid') {
            action = 'pay';
            auditComment = auditComment || 'ดำเนินการจ่ายเงินแล้ว';
        } else if (status === 'draft') {
            action = 'update';
            auditComment = auditComment || 'แก้ไขสถานะกลับเป็นแบบร่าง';
        }

        await logAudit({
            expenseId: params.id!,
            action,
            actorName: actorName,
            actorRole: 'Approver',
            oldStatus: oldStatus ?? undefined,
            newStatus: status as ExpenseStatus,
            comment: auditComment || undefined
        });

        // 3. Notification
        let notifType: 'success' | 'warning' | 'error' | 'info' = 'info';
        let notifTitle = '';
        let notifMessage = '';

        if (status === 'approved') {
            notifType = 'success';
            notifTitle = 'รายการได้รับการอนุมัติ';
            notifMessage = `รายการเบิกของคุณได้รับการอนุมัติแล้ว โดย ${actorName}`;
        } else if (status === 'rejected') {
            notifType = 'error';
            notifTitle = 'รายการถูกปฏิเสธ';
            notifMessage = `รายการเบิกของคุณถูกปฏิเสธ: ${auditComment || '-'}`;
        } else if (status === 'paid') {
            notifType = 'success';
            notifTitle = 'โอนเงินแล้ว';
            notifMessage = `รายการเบิกของคุณได้รับการโอนเงินเรียบร้อยแล้ว`;
        }

        if (notifTitle) {
            await createNotification({
                type: notifType,
                title: notifTitle,
                message: notifMessage,
                link: `/expenses/${params.id}`,
                targetRole: 'user' // แจ้งกลับไปที่ User
            });
        }

        return { success: true };
    },

    // ลบรายการ
    delete: async ({ params }) => {
        // Get current user from session
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        const actorName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Unknown User';

        // ดึงไฟล์แนบเพื่อลบ
        const { data: attachments } = await supabase
            .from('attachments')
            .select('file_path')
            .eq('expense_id', params.id);

        // ลบไฟล์จาก storage
        if (attachments && attachments.length > 0) {
            for (const att of attachments) {
                await deleteFile(att.file_path);
            }
        }

        // ลบ expense (attachments จะถูกลบตาม cascade)
        const { error: deleteError } = await supabase
            .from('expenses')
            .delete()
            .eq('id', params.id);

        if (deleteError) {
            return fail(500, { error: 'เกิดข้อผิดพลาดในการลบ' });
        }

        // Audit Log
        await logAudit({
            expenseId: params.id!,
            action: 'update',
            actorName,
            actorRole: 'Admin',
            comment: 'ลบรายการเบิก'
        });

        // Notification
        await createNotification({
            type: 'warning',
            title: 'รายการถูกลบ',
            message: `มีการลบรายการเบิกโดย ${actorName}`,
            targetRole: 'admin'
        });

        throw redirect(303, '/expenses');
    }
};
