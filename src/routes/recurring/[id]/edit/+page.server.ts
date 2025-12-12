import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { supabase } from '$lib/supabase';
import { createNotification } from '$lib/notification';

export const load: PageServerLoad = async ({ params }) => {
    const { id } = params;

    const { data: expense, error: fetchError } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError || !expense) {
        throw error(404, 'Recurring expense not found');
    }

    return { expense };
};

export const actions: Actions = {
    update: async ({ request, params }) => {
        const { id } = params;
        const formData = await request.formData();

        const description = formData.get('description') as string;
        const amount = parseFloat(formData.get('amount') as string);
        const category_id = formData.get('category_id') as string;
        const department_id = formData.get('department_id') as string;
        const payment_method_id = formData.get('payment_method_id') as string;
        const vendor = formData.get('vendor') as string;
        const frequency = formData.get('frequency') as string;
        const start_date = formData.get('start_date') as string;
        const active = formData.get('active') === 'on';

        // Note: We don't update next_due_date automatically here to avoid messing up the schedule
        // unless the user explicitly changes the start_date logic (which is complex).
        // For simplicity, we keep next_due_date as is, or user can manually edit it if we add a field.
        // But usually, editing description/amount shouldn't change the schedule.

        const { error: updateError } = await supabase
            .from('recurring_expenses')
            .update({
                description,
                amount,
                category_id,
                department_id,
                payment_method_id,
                vendor,
                frequency,
                start_date,
                active,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            return fail(500, {
                error: updateError.message,
                values: Object.fromEntries(formData)
            });
        }

        // Notification
        await createNotification({
            type: 'info',
            title: 'แก้ไขรายจ่ายประจำ',
            message: `แก้ไขรายการรายจ่ายประจำ: ${description}`,
            link: '/recurring',
            targetRole: 'admin'
        });

        throw redirect(303, '/recurring');
    },

    delete: async ({ params }) => {
        const { id } = params;

        const { error: deleteError } = await supabase
            .from('recurring_expenses')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return fail(500, { error: deleteError.message });
        }

        // Notification
        await createNotification({
            type: 'warning',
            title: 'ลบรายจ่ายประจำ',
            message: 'มีการลบรายการรายจ่ายประจำ',
            link: '/recurring',
            targetRole: 'admin'
        });

        throw redirect(303, '/recurring');
    }
};
