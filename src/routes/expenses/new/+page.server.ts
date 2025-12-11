// New Expense Form - Server Actions
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { supabase, uploadFile } from '$lib/supabase';
import type { AttachmentType } from '$lib/types';
import { logAudit } from '$lib/audit';
import { createNotification } from '$lib/notification';
import { formatCurrency } from '$lib/utils';

export const load: PageServerLoad = async () => {
    // หน้านี้ใช้ lookup data จาก layout แล้ว
    return {};
};

export const actions: Actions = {
    default: async ({ request }) => {
        const formData = await request.formData();

        // ดึงข้อมูลจากฟอร์ม
        const date = formData.get('date') as string;
        const amountStr = formData.get('amount') as string;
        let categoryId = formData.get('category_id') as string;
        let paymentMethodId = formData.get('payment_method_id') as string;
        const customCategory = formData.get('custom_category') as string;
        const customPaymentMethod = formData.get('custom_payment_method') as string;
        const vendor = formData.get('vendor') as string || null;
        const description = formData.get('description') as string;
        const noteInternal = formData.get('note_internal') as string || null;
        const createdByName = formData.get('created_by_name') as string;
        const departmentId = formData.get('department_id') as string;
        const status = (formData.get('status') as string) || 'draft';

        // Validation
        const errors: Record<string, string> = {};

        if (!date) errors.date = 'กรุณาระบุวันที่';
        if (!amountStr) errors.amount = 'กรุณาระบุจำนวนเงิน';

        // Category: ต้องเลือกหรือกรอก custom
        if (!categoryId && !customCategory) {
            errors.category_id = 'กรุณาเลือกหมวดหมู่หรือพิมพ์ชื่อหมวดหมู่';
        }

        // Payment method: ต้องเลือกหรือกรอก custom
        if (!paymentMethodId && !customPaymentMethod) {
            errors.payment_method_id = 'กรุณาเลือกวิธีชำระเงินหรือพิมพ์ชื่อวิธีชำระเงิน';
        }

        if (!description) errors.description = 'กรุณาระบุรายละเอียด';
        if (!createdByName) errors.created_by_name = 'กรุณาระบุชื่อผู้ทำรายการ';
        if (!departmentId) errors.department_id = 'กรุณาเลือกแผนก';

        // แปลง amount
        const amount = parseFloat(amountStr.replace(/,/g, ''));
        if (isNaN(amount) || amount <= 0) {
            errors.amount = 'จำนวนเงินต้องเป็นตัวเลขมากกว่า 0';
        }

        if (Object.keys(errors).length > 0) {
            return fail(400, { errors, values: Object.fromEntries(formData) });
        }

        // ถ้ามี custom category ให้สร้างใหม่
        if (customCategory && !categoryId) {
            const { data: newCategory, error: catError } = await supabase
                .from('categories')
                .insert({ name: customCategory, icon: '📦', color: 'gray' })
                .select('id')
                .single();

            if (catError) {
                // อาจมีอยู่แล้ว ลองหาจากชื่อ
                const { data: existing } = await supabase
                    .from('categories')
                    .select('id')
                    .eq('name', customCategory)
                    .single();

                if (existing) {
                    categoryId = existing.id;
                } else {
                    return fail(500, {
                        error: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่ใหม่',
                        values: Object.fromEntries(formData)
                    });
                }
            } else if (newCategory) {
                categoryId = newCategory.id;
            }
        }

        // ถ้ามี custom payment method ให้สร้างใหม่
        if (customPaymentMethod && !paymentMethodId) {
            const { data: newPayment, error: payError } = await supabase
                .from('payment_methods')
                .insert({ name: customPaymentMethod, icon: '💰' })
                .select('id')
                .single();

            if (payError) {
                // อาจมีอยู่แล้ว ลองหาจากชื่อ
                const { data: existing } = await supabase
                    .from('payment_methods')
                    .select('id')
                    .eq('name', customPaymentMethod)
                    .single();

                if (existing) {
                    paymentMethodId = existing.id;
                } else {
                    return fail(500, {
                        error: 'เกิดข้อผิดพลาดในการสร้างวิธีชำระเงินใหม่',
                        values: Object.fromEntries(formData)
                    });
                }
            } else if (newPayment) {
                paymentMethodId = newPayment.id;
            }
        }

        // Insert expense
        const { data: expense, error: insertError } = await supabase
            .from('expenses')
            .insert({
                date,
                amount,
                category_id: categoryId,
                payment_method_id: paymentMethodId,
                vendor,
                description,
                note_internal: noteInternal,
                created_by_name: createdByName,
                department_id: departmentId,
                status
            })
            .select('id')
            .single();

        if (insertError || !expense) {
            console.error('Insert error:', insertError);
            return fail(500, {
                error: 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่',
                values: Object.fromEntries(formData)
            });
        }

        // Post-insert actions
        if (expense) {
            // 1. Audit Log
            await logAudit({
                expenseId: expense.id,
                action: 'create',
                actorName: createdByName,
                actorRole: 'Requester',
                newStatus: status,
                comment: 'สร้างรายการขอเบิกใหม่'
            });

            // 2. Notification (To Manager/Admin)
            await createNotification({
                type: 'info',
                title: 'มีรายการเบิกใหม่',
                message: `${createdByName} ได้สร้างรายการเบิกใหม่ ${formatCurrency(amount)}`,
                link: `/expenses/${expense.id}`,
                targetRole: 'admin'
            });
        }

        // อัปโหลดไฟล์แนบ
        const attachmentTypes: AttachmentType[] = [
            'approve_proof',
            'slip',
            'receipt',
            'invoice',
            'product_photo'
        ];

        const attachmentRecords: Array<{
            expense_id: string;
            attachment_type: string;
            file_path: string;
            file_name: string;
        }> = [];

        for (const type of attachmentTypes) {
            const files = formData.getAll(`files_${type}`) as File[];
            console.log(`[Upload Debug] Type: ${type}, Files count: ${files.length}`);

            for (const file of files) {
                // ข้ามไฟล์เปล่า
                if (!file || file.size === 0) {
                    console.log(`[Upload Debug] Skipping empty file`);
                    continue;
                }

                console.log(`[Upload Debug] Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);

                // ตรวจสอบว่าเป็นรูปภาพหรือ PDF
                if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
                    continue;
                }

                // ตรวจสอบขนาด (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                    continue;
                }

                // อัปโหลดไฟล์
                const { path, error: uploadError } = await uploadFile(file, type, expense.id);

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    continue;
                }

                attachmentRecords.push({
                    expense_id: expense.id,
                    attachment_type: type,
                    file_path: path,
                    file_name: file.name
                });
            }
        }

        // บันทึก attachments
        if (attachmentRecords.length > 0) {
            const { error: attachError } = await supabase
                .from('attachments')
                .insert(attachmentRecords);

            if (attachError) {
                console.error('Attachment insert error:', attachError);
            }
        }

        // Redirect ไปหน้ารายละเอียด
        throw redirect(303, `/expenses/${expense.id}`);
    }
};
