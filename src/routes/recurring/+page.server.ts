import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabase';

export const load: PageServerLoad = async () => {
    // Fetch recurring expenses
    const { data: recurringExpenses, error } = await supabase
        .from('recurring_expenses')
        .select(`
            *,
            category:categories(*),
            department:departments(*),
            payment_method:payment_methods(*)
        `)
        .order('next_due_date', { ascending: true });

    if (error) {
        console.error('Error fetching recurring expenses:', error);
        return { recurringExpenses: [] };
    }

    return { recurringExpenses };
};
