// Expense Detail - Server Load & Actions
import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { supabase, deleteFile } from '$lib/supabase';
import { logAudit } from '$lib/audit';

export const load: PageServerLoad = async ({ params }) => {
    // โหลด expense พร้อม relations
    const { data: expense, error: fetchError } = await supabase
        .from('expenses')
        .select(`
      *,
      category:categories(*),
      department:departments(*),
      payment_method:payment_methods(*),
      attachments(*)
    `)
        .eq('id', params.id)
        .single();

    if (fetchError || !expense) {
        throw error(404, 'ไม่พบรายการนี้');
    }

    // โหลด Audit Logs
    const { data: auditLogs } = await supabase
        .from('expense_audit_logs')
        .select('*')
        .eq('expense_id', params.id)
        .order('created_at', { ascending: false });

    return { expense, auditLogs: auditLogs ?? [] };
};

export const actions: Actions = {
    // เปลี่ยนสถานะ
    updateStatus: async ({ request, params }) => {
        const formData = await request.formData();
        const newStatus = formData.get('status') as string;

        if (!['draft', 'approved', 'rejected', 'paid'].includes(newStatus)) {
            return fail(400, { error: 'สถานะไม่ถูกต้อง' });
        }

        // ดึงสถานะเดิมก่อนอัปเดต
        const { data: currentExpense } = await supabase
            .from('expenses')
            .select('status')
            .eq('id', params.id)
            .single();

        const oldStatus = currentExpense?.status;

        const { error: updateError } = await supabase
            .from('expenses')
            .update({ status: newStatus })
            .eq('id', params.id);

        if (updateError) {
            return fail(500, { error: 'เกิดข้อผิดพลาดในการอัปเดต' });
        }

        // บันทึก Audit Log
        let action: 'approve' | 'reject' | 'pay' | 'update' = 'update';
        let comment = '';

        if (newStatus === 'approved') {
            action = 'approve';
            comment = 'อนุมัติรายการ';
        } else if (newStatus === 'rejected') {
            action = 'reject';
            comment = 'ปฏิเสธรายการ';
        } else if (newStatus === 'paid') {
            action = 'pay';
            comment = 'ดำเนินการจ่ายเงินแล้ว';
        } else if (newStatus === 'draft') {
            action = 'update';
            comment = 'แก้ไขสถานะกลับเป็นแบบร่าง';
        }

        await logAudit({
            expenseId: params.id!,
            action,
            actorName: 'Admin (Demo)', // TODO: ใช้ชื่อจริงจาก Auth
            actorRole: 'Admin',
            oldStatus: oldStatus ?? undefined,
            newStatus,
            comment
        });

        return { success: true };
    },

    // ลบรายการ
    delete: async ({ params }) => {
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

        throw redirect(303, '/expenses');
    }
};
