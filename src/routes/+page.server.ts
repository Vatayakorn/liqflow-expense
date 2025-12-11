// Dashboard Server - โหลดข้อมูลสรุปสำหรับ Dashboard
import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabase';

export const load: PageServerLoad = async () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // คำนวณเดือนก่อนหน้า
    const prevDate = new Date(currentYear, now.getMonth() - 1, 1);
    const previousMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    // คำนวณ 12 เดือนที่แล้ว สำหรับ Line Chart
    const twelveMonthsAgo = new Date(currentYear, now.getMonth() - 11, 1);
    const startDate = twelveMonthsAgo.toISOString().split('T')[0];

    // ปีปัจจุบันและปีก่อน
    const previousYear = currentYear - 1;

    // ดึงข้อมูลทั้งหมดพร้อมกัน
    const [
        currentMonthResult,
        previousMonthResult,
        currentYearResult,
        previousYearResult,
        monthlyResult,
        categoryResult,
        departmentResult,
        recentResult
    ] = await Promise.all([
        // ยอดรวมเดือนนี้
        supabase
            .from('expenses')
            .select('amount')
            .gte('date', `${currentMonth}-01`)
            .lte('date', `${currentMonth}-31`),

        // ยอดรวมเดือนก่อน
        supabase
            .from('expenses')
            .select('amount')
            .gte('date', `${previousMonth}-01`)
            .lte('date', `${previousMonth}-31`),

        // ยอดรวมปีนี้
        supabase
            .from('expenses')
            .select('amount')
            .gte('date', `${currentYear}-01-01`)
            .lte('date', `${currentYear}-12-31`),

        // ยอดรวมปีก่อน
        supabase
            .from('expenses')
            .select('amount')
            .gte('date', `${previousYear}-01-01`)
            .lte('date', `${previousYear}-12-31`),

        // รายจ่ายรายเดือน 12 เดือน
        supabase
            .from('expenses')
            .select('date, amount')
            .gte('date', startDate)
            .order('date'),

        // รายจ่ายตาม category เดือนนี้
        supabase
            .from('expenses')
            .select('amount, category:categories(id, name, icon, color)')
            .gte('date', `${currentMonth}-01`)
            .lte('date', `${currentMonth}-31`),

        // รายจ่ายตาม department เดือนนี้
        supabase
            .from('expenses')
            .select('amount, department:departments(id, name)')
            .gte('date', `${currentMonth}-01`)
            .lte('date', `${currentMonth}-31`),

        // 5 รายการล่าสุด
        supabase
            .from('expenses')
            .select(`
        *,
        category:categories(*),
        department:departments(*),
        payment_method:payment_methods(*)
      `)
            .order('created_at', { ascending: false })
            .limit(5)
    ]);

    // คำนวณยอดรวมเดือนนี้
    const currentMonthTotal = (currentMonthResult.data ?? []).reduce(
        (sum, e) => sum + Number(e.amount),
        0
    );
    const currentMonthCount = currentMonthResult.data?.length ?? 0;

    // คำนวณยอดรวมเดือนก่อน
    const previousMonthTotal = (previousMonthResult.data ?? []).reduce(
        (sum, e) => sum + Number(e.amount),
        0
    );

    // คำนวณยอดรวมปีนี้
    const currentYearTotal = (currentYearResult.data ?? []).reduce(
        (sum, e) => sum + Number(e.amount),
        0
    );
    const currentYearCount = currentYearResult.data?.length ?? 0;

    // คำนวณยอดรวมปีก่อน
    const previousYearTotal = (previousYearResult.data ?? []).reduce(
        (sum, e) => sum + Number(e.amount),
        0
    );

    // จัดกลุ่มรายเดือน
    const monthlyMap = new Map<string, { total: number; count: number }>();
    for (const expense of monthlyResult.data ?? []) {
        const month = expense.date.substring(0, 7); // YYYY-MM
        const existing = monthlyMap.get(month) ?? { total: 0, count: 0 };
        monthlyMap.set(month, {
            total: existing.total + Number(expense.amount),
            count: existing.count + 1
        });
    }
    const monthlyExpenses = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));

    // จัดกลุ่มตาม category
    const categoryMap = new Map<string, { name: string; icon: string; color: string; total: number; count: number }>();
    for (const expense of categoryResult.data ?? []) {
        const expenseData = expense as unknown as { category: Array<{ id: string; name: string; icon: string; color: string }> | null; amount: number };
        const cat = expenseData.category?.[0];
        if (!cat) continue;
        const existing = categoryMap.get(cat.id) ?? { name: cat.name, icon: cat.icon || '📦', color: cat.color, total: 0, count: 0 };
        categoryMap.set(cat.id, {
            ...existing,
            total: existing.total + Number(expenseData.amount),
            count: existing.count + 1
        });
    }
    const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([id, data]) => ({ category_id: id, category_name: data.name, category_icon: data.icon, category_color: data.color, ...data }))
        .sort((a, b) => b.total - a.total);

    // Top 5 หมวดหมู่
    const top5Categories = categoryBreakdown.slice(0, 5);
    const totalCategorySum = categoryBreakdown.reduce((sum, c) => sum + c.total, 0);

    // จัดกลุ่มตาม department
    const deptMap = new Map<string, { name: string; total: number; count: number }>();
    for (const expense of departmentResult.data ?? []) {
        const expenseData = expense as unknown as { department: Array<{ id: string; name: string }> | null; amount: number };
        const dept = expenseData.department?.[0];
        if (!dept) continue;
        const existing = deptMap.get(dept.id) ?? { name: dept.name, total: 0, count: 0 };
        deptMap.set(dept.id, {
            ...existing,
            total: existing.total + Number(expenseData.amount),
            count: existing.count + 1
        });
    }
    const departmentBreakdown = Array.from(deptMap.entries())
        .map(([id, data]) => ({ department_id: id, department_name: data.name, ...data }))
        .sort((a, b) => b.total - a.total);

    // ดึง Budget Alerts - budgets ที่เกินหรือใกล้ถึง threshold
    const { data: budgets } = await supabase
        .from('budgets')
        .select(`
            *,
            category:categories(*),
            department:departments(*)
        `)
        .eq('month', currentMonth);

    interface BudgetAlert {
        id: string;
        name: string;
        icon: string;
        type: 'category' | 'department';
        amount: number;
        used: number;
        percentage: number;
        status: 'warning' | 'danger';
    }

    const budgetAlerts: BudgetAlert[] = [];

    for (const budget of budgets ?? []) {
        let used = 0;
        let name = '';
        let icon = '';

        if (budget.budget_type === 'category' && budget.category_id) {
            const catData = categoryBreakdown.find(c => c.category_id === budget.category_id);
            used = catData?.total ?? 0;
            const cat = budget.category as { name: string; icon: string } | null;
            name = cat?.name ?? 'Unknown';
            icon = cat?.icon ?? '📦';
        } else if (budget.budget_type === 'department' && budget.department_id) {
            const deptData = departmentBreakdown.find(d => d.department_id === budget.department_id);
            used = deptData?.total ?? 0;
            const dept = budget.department as { name: string } | null;
            name = dept?.name ?? 'Unknown';
            icon = '🏢';
        }

        const percentage = budget.amount > 0 ? (used / budget.amount) * 100 : 0;

        if (percentage >= budget.alert_threshold) {
            budgetAlerts.push({
                id: budget.id,
                name,
                icon,
                type: budget.budget_type,
                amount: budget.amount,
                used,
                percentage,
                status: percentage >= 100 ? 'danger' : 'warning'
            });
        }
    }

    // Sort by percentage descending
    budgetAlerts.sort((a, b) => b.percentage - a.percentage);

    return {
        currentMonth,
        currentYear,
        currentMonthTotal,
        currentMonthCount,
        previousMonthTotal,
        currentYearTotal,
        currentYearCount,
        previousYearTotal,
        monthlyExpenses,
        categoryBreakdown,
        top5Categories,
        totalCategorySum,
        departmentBreakdown,
        recentExpenses: recentResult.data ?? [],
        budgetAlerts
    };
};
