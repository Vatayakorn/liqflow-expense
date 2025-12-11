// Layout Server - โหลด lookup data สำหรับทั้งแอป
import type { LayoutServerLoad } from './$types';
import { supabase } from '$lib/supabase';

export const load: LayoutServerLoad = async ({ depends }) => {
    depends('app:notifications');

    // โหลด lookup tables ทั้งหมดพร้อมกัน
    const [categoriesResult, departmentsResult, paymentMethodsResult, notificationsResult] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('departments').select('*').order('name'),
        supabase.from('payment_methods').select('*').order('name'),
        supabase.from('notifications').select('*').eq('is_read', false).order('created_at', { ascending: false }).limit(10)
    ]);

    return {
        categories: categoriesResult.data ?? [],
        departments: departmentsResult.data ?? [],
        paymentMethods: paymentMethodsResult.data ?? [],
        notifications: notificationsResult.data ?? []
    };
};
