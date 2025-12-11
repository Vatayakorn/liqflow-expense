import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const { amount, date, categoryId, departmentId } = await request.json();

    if (!amount || !date) {
        return json({ status: 'ok', message: 'Incomplete data' });
    }

    const month = date.slice(0, 7); // YYYY-MM
    const reqAmount = Number(amount);

    const warnings: string[] = [];
    const errors: string[] = [];

    // Helper function to check budget
    async function check(type: 'category' | 'department', id: string, name: string) {
        // 1. Get Budget
        const { data: budget } = await supabase
            .from('budgets')
            .select('*')
            .eq('budget_type', type)
            .eq(type === 'category' ? 'category_id' : 'department_id', id)
            .eq('month', month)
            .single();

        if (!budget) return; // No budget set, skip

        // 2. Sum Used Amount
        const { data: expenses } = await supabase
            .from('expenses')
            .select('amount')
            .eq(type === 'category' ? 'category_id' : 'department_id', id)
            .neq('status', 'rejected')
            //.like('date', `${month}%`) // Supabase doesn't support like on date easily, use range
            .gte('date', `${month}-01`)
            .lte('date', `${month}-31`); // Simple range approximation

        const usedAmount = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
        const totalUsed = usedAmount + reqAmount;
        const percentage = (totalUsed / budget.amount) * 100;

        if (totalUsed > budget.amount) {
            errors.push(`ยอดรวม (${totalUsed.toLocaleString()}) เกินงบประมาณของ ${name} (${budget.amount.toLocaleString()})`);
        } else if (percentage >= budget.alert_threshold) {
            warnings.push(`ยอดรวม (${totalUsed.toLocaleString()}) ใกล้เต็มงบประมาณของ ${name} (${percentage.toFixed(1)}%)`);
        }
    }

    // Check Category Budget
    if (categoryId) {
        // Get name to show in error
        const { data: cat } = await supabase.from('categories').select('name').eq('id', categoryId).single();
        if (cat) await check('category', categoryId, `หมวดหมู่ ${cat.name}`);
    }

    // Check Department Budget
    if (departmentId) {
        const { data: dept } = await supabase.from('departments').select('name').eq('id', departmentId).single();
        if (dept) await check('department', departmentId, `แผนก ${dept.name}`);
    }

    if (errors.length > 0) {
        return json({ status: 'error', message: errors.join(', ') });
    }
    if (warnings.length > 0) {
        return json({ status: 'warning', message: warnings.join(', ') });
    }

    return json({ status: 'ok' });
};
