import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { supabase } from '$lib/supabase';
import { createNotification } from '$lib/notification';

export const actions: Actions = {
    default: async ({ request }) => {
        const formData = await request.formData();
        const description = formData.get('description') as string;
        const amount = parseFloat(formData.get('amount') as string);
        let category_id = formData.get('category_id') as string;
        let department_id = formData.get('department_id') as string;
        let payment_method_id = formData.get('payment_method_id') as string;
        const vendor = formData.get('vendor') as string;
        const frequency = formData.get('frequency') as string;
        const start_date = formData.get('start_date') as string;

        // Handle Custom Category
        if (category_id === 'custom') {
            const customName = formData.get('custom_category') as string;
            if (customName) {
                const { data, error } = await supabase.from('categories').insert({ name: customName }).select().single();
                if (!error && data) category_id = data.id;
            }
        }

        // Handle Custom Department
        if (department_id === 'custom') {
            const customName = formData.get('custom_department') as string;
            if (customName) {
                const { data, error } = await supabase.from('departments').insert({ name: customName }).select().single();
                if (!error && data) department_id = data.id;
            }
        }

        // Handle Custom Payment Method
        if (payment_method_id === 'custom') {
            const customName = formData.get('custom_payment_method') as string;
            if (customName) {
                const { data, error } = await supabase.from('payment_methods').insert({ name: customName }).select().single();
                if (!error && data) payment_method_id = data.id;
            }
        }

        // Calculate next_due_date (initially same as start_date)
        const next_due_date = start_date;

        // Get current user from session
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        const createdByName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Unknown User';

        const { error } = await supabase.from('recurring_expenses').insert({
            description,
            amount,
            category_id,
            department_id,
            payment_method_id,
            vendor,
            frequency,
            start_date,
            next_due_date,
            created_by_name: createdByName,
            active: true
        });

        if (error) {
            console.error('Error creating recurring expense:', error);
            return fail(500, {
                error: error.message,
                values: Object.fromEntries(formData)
            });
        }

        // Notification
        await createNotification({
            type: 'info',
            title: 'สร้างรายจ่ายประจำใหม่',
            message: `สร้างรายการรายจ่ายประจำ: ${description}`,
            link: '/recurring',
            targetRole: 'admin'
        });

        throw redirect(303, '/recurring');
    }
};
