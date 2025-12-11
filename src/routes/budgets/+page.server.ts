// Budget Management - Server Load & Actions
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { BudgetWithUsage, BudgetWithRelations } from '$lib/types';

export const load: PageServerLoad = async ({ url }) => {
    const now = new Date();
    const selectedMonth = url.searchParams.get('month') ||
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // ดึง budgets พร้อม category/department
    const { data: budgets, error: budgetError } = await supabase
        .from('budgets')
        .select(`
            *,
            category:categories(*),
            department:departments(*)
        `)
        .eq('month', selectedMonth)
        .order('created_at', { ascending: false });

    if (budgetError) {
        console.error('Budget load error:', budgetError);
    }

    // คำนวณยอดใช้จ่ายจริงสำหรับแต่ละ budget
    const budgetsWithUsage: BudgetWithUsage[] = [];

    for (const budget of (budgets ?? []) as BudgetWithRelations[]) {
        let used = 0;

        if (budget.budget_type === 'category' && budget.category_id) {
            const { data: expenses } = await supabase
                .from('expenses')
                .select('amount')
                .eq('category_id', budget.category_id)
                .gte('date', `${selectedMonth}-01`)
                .lte('date', `${selectedMonth}-31`);

            used = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
        } else if (budget.budget_type === 'department' && budget.department_id) {
            const { data: expenses } = await supabase
                .from('expenses')
                .select('amount')
                .eq('department_id', budget.department_id)
                .gte('date', `${selectedMonth}-01`)
                .lte('date', `${selectedMonth}-31`);

            used = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
        }

        const percentage = budget.amount > 0 ? (used / budget.amount) * 100 : 0;
        const remaining = budget.amount - used;

        let status: 'safe' | 'warning' | 'danger' = 'safe';
        if (percentage >= 100) {
            status = 'danger';
        } else if (percentage >= budget.alert_threshold) {
            status = 'warning';
        }

        budgetsWithUsage.push({
            ...budget,
            used,
            remaining,
            percentage,
            status
        });
    }

    // ดึง categories และ departments สำหรับ form
    const [categoriesRes, departmentsRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('departments').select('*').order('name')
    ]);

    return {
        budgets: budgetsWithUsage,
        categories: categoriesRes.data ?? [],
        departments: departmentsRes.data ?? [],
        selectedMonth
    };
};

export const actions: Actions = {
    create: async ({ request }) => {
        const formData = await request.formData();

        const budgetType = formData.get('budget_type') as string;
        const categoryId = formData.get('category_id') as string || null;
        const departmentId = formData.get('department_id') as string || null;
        const month = formData.get('month') as string;
        const amountStr = formData.get('amount') as string;
        const thresholdStr = formData.get('alert_threshold') as string;

        // Validation
        if (!budgetType || !month || !amountStr) {
            return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบ' });
        }

        if (budgetType === 'category' && !categoryId) {
            return fail(400, { error: 'กรุณาเลือกหมวดหมู่' });
        }

        if (budgetType === 'department' && !departmentId) {
            return fail(400, { error: 'กรุณาเลือกแผนก' });
        }

        const amount = parseFloat(amountStr.replace(/,/g, ''));
        if (isNaN(amount) || amount <= 0) {
            return fail(400, { error: 'จำนวนเงินต้องมากกว่า 0' });
        }

        const alertThreshold = parseInt(thresholdStr) || 80;

        const { error } = await supabase
            .from('budgets')
            .insert({
                budget_type: budgetType,
                category_id: budgetType === 'category' ? categoryId : null,
                department_id: budgetType === 'department' ? departmentId : null,
                month,
                amount,
                alert_threshold: alertThreshold
            });

        if (error) {
            console.error('Budget create error:', error);
            if (error.code === '23505') {
                return fail(400, { error: 'มีงบประมาณสำหรับรายการนี้ในเดือนนี้แล้ว' });
            }
            return fail(500, { error: 'เกิดข้อผิดพลาดในการสร้างงบประมาณ' });
        }

        return { success: true };
    },

    update: async ({ request }) => {
        const formData = await request.formData();

        const id = formData.get('id') as string;
        const amountStr = formData.get('amount') as string;
        const thresholdStr = formData.get('alert_threshold') as string;

        if (!id || !amountStr) {
            return fail(400, { error: 'ข้อมูลไม่ครบ' });
        }

        const amount = parseFloat(amountStr.replace(/,/g, ''));
        if (isNaN(amount) || amount <= 0) {
            return fail(400, { error: 'จำนวนเงินต้องมากกว่า 0' });
        }

        const alertThreshold = parseInt(thresholdStr) || 80;

        const { error } = await supabase
            .from('budgets')
            .update({ amount, alert_threshold: alertThreshold })
            .eq('id', id);

        if (error) {
            console.error('Budget update error:', error);
            return fail(500, { error: 'เกิดข้อผิดพลาดในการแก้ไขงบประมาณ' });
        }

        return { success: true };
    },

    delete: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id') as string;

        if (!id) {
            return fail(400, { error: 'ไม่พบ ID' });
        }

        const { error } = await supabase
            .from('budgets')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Budget delete error:', error);
            return fail(500, { error: 'เกิดข้อผิดพลาดในการลบ' });
        }

        return { success: true };
    }
};
