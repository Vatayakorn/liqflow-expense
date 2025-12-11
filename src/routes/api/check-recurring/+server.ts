import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
    try {
        const todayDate = new Date();
        const today = todayDate.toISOString().split('T')[0];
        
        // Calculate date for 1 week ahead
        const nextWeekDate = new Date(todayDate);
        nextWeekDate.setDate(todayDate.getDate() + 7);
        const nextWeek = nextWeekDate.toISOString().split('T')[0];

        let processedCount = 0;

        // 0. Check for expenses due in exactly 7 days (Warning/Orange Notification)
        const { data: upcomingExpenses } = await supabase
            .from('recurring_expenses')
            .select('*')
            .eq('active', true)
            .eq('next_due_date', nextWeek);

        if (upcomingExpenses && upcomingExpenses.length > 0) {
            for (const expense of upcomingExpenses) {
                await supabase.from('notifications').insert({
                    type: 'warning', // Orange color for upcoming
                    title: 'แจ้งเตือนล่วงหน้า 7 วัน',
                    message: `รายการ "${expense.description}" จะครบกำหนดในวันที่ ${expense.next_due_date}`,
                    link: `/recurring`,
                    is_read: false
                });
                processedCount++;
            }
        }

        // 1. Find due recurring expenses (Due Today or Past Due - Error/Red Notification)
        const { data: dueExpenses, error: fetchError } = await supabase
            .from('recurring_expenses')
            .select('*')
            .eq('active', true)
            .lte('next_due_date', today);

        if (fetchError) throw fetchError;

        if (dueExpenses && dueExpenses.length > 0) {
            for (const expense of dueExpenses) {
                // 2. Create Notification for Due Item
                await supabase.from('notifications').insert({
                    type: 'error', // Red color for due/overdue
                    title: 'รายจ่ายประจำครบกำหนด',
                    message: `รายการ "${expense.description}" ครบกำหนดชำระวันนี้ (${expense.next_due_date})`,
                    link: `/recurring`, // Link to recurring page
                    is_read: false
                });

                // 3. Calculate next due date
                const currentDueDate = new Date(expense.next_due_date);
                let nextDate = new Date(currentDueDate);

                if (expense.frequency === 'weekly') {
                    nextDate.setDate(currentDueDate.getDate() + 7);
                } else if (expense.frequency === 'monthly') {
                    nextDate.setMonth(currentDueDate.getMonth() + 1);
                } else if (expense.frequency === 'yearly') {
                    nextDate.setFullYear(currentDueDate.getFullYear() + 1);
                }

                // 4. Update next_due_date
                await supabase
                    .from('recurring_expenses')
                    .update({ next_due_date: nextDate.toISOString().split('T')[0] })
                    .eq('id', expense.id);
                
                processedCount++;
            }
        }

        return json({ success: true, processed: processedCount });

    } catch (error) {
        console.error('Error checking recurring expenses:', error);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};
