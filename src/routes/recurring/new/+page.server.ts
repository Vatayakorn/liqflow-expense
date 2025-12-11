import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { supabase } from '$lib/supabase';

export const actions: Actions = {
    default: async ({ request }) => {
        const formData = await request.formData();
        const description = formData.get('description') as string;
        const amount = parseFloat(formData.get('amount') as string);
        const category_id = formData.get('category_id') as string;
        const department_id = formData.get('department_id') as string;
        const payment_method_id = formData.get('payment_method_id') as string;
        const vendor = formData.get('vendor') as string;
        const frequency = formData.get('frequency') as string;
        const start_date = formData.get('start_date') as string;
        
        // Calculate next_due_date (initially same as start_date)
        const next_due_date = start_date;

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
            created_by_name: 'Manager Somchai', // Hardcoded for now as per layout
            active: true
        });

        if (error) {
            console.error('Error creating recurring expense:', error);
            return fail(500, {
                error: error.message,
                values: Object.fromEntries(formData)
            });
        }

        throw redirect(303, '/recurring');
    }
};
