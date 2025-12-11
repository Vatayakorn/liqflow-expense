// Edit Expense - Server Load & Actions
import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { supabase, uploadFile, deleteFile } from '$lib/supabase';
import type { AttachmentType } from '$lib/types';

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

    return { expense };
};

export const actions: Actions = {
    default: async ({ request, params }) => {
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

        // Update expense
        const { error: updateError } = await supabase
            .from('expenses')
            .update({
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
            .eq('id', params.id);

        if (updateError) {
            console.error('Update error:', updateError);
            return fail(500, {
                error: 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่',
                values: Object.fromEntries(formData)
            });
        }

        // ลบ attachments ที่ถูกเลือก
        const deleteAttachmentIds = formData.getAll('delete_attachment') as string[];
        if (deleteAttachmentIds.length > 0) {
            // ดึง file paths ก่อนลบ
            const { data: attachmentsToDelete } = await supabase
                .from('attachments')
                .select('file_path')
                .in('id', deleteAttachmentIds);

            // ลบไฟล์จาก storage
            if (attachmentsToDelete) {
                for (const att of attachmentsToDelete) {
                    await deleteFile(att.file_path);
                }
            }

            // ลบ records
            await supabase
                .from('attachments')
                .delete()
                .in('id', deleteAttachmentIds);
        }

        // อัปโหลดไฟล์แนบใหม่
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

            for (const file of files) {
                // ข้ามไฟล์เปล่า
                if (!file || file.size === 0) {
                    continue;
                }

                // ตรวจสอบว่าเป็นรูปภาพหรือ PDF
                if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
                    continue;
                }

                // ตรวจสอบขนาด (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                    continue;
                }

                // อัปโหลดไฟล์
                const { path, error: uploadError } = await uploadFile(file, type, params.id);

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    continue;
                }

                attachmentRecords.push({
                    expense_id: params.id,
                    attachment_type: type,
                    file_path: path,
                    file_name: file.name
                });
            }
        }

        // บันทึก attachments ใหม่
        if (attachmentRecords.length > 0) {
            const { error: attachError } = await supabase
                .from('attachments')
                .insert(attachmentRecords);

            if (attachError) {
                console.error('Attachment insert error:', attachError);
            }
        }

        // Redirect ไปหน้ารายละเอียด
        throw redirect(303, `/expenses/${params.id}`);
    }
};
