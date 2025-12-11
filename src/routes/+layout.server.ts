// Layout Server - โหลด lookup data สำหรับทั้งแอป
import type { LayoutServerLoad } from './$types';
import { supabase } from '$lib/supabase';

export const load: LayoutServerLoad = async () => {
    // โหลด lookup tables ทั้งหมดพร้อมกัน
    const [categoriesResult, departmentsResult, paymentMethodsResult] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('departments').select('*').order('name'),
        supabase.from('payment_methods').select('*').order('name')
    ]);

    return {
        categories: categoriesResult.data ?? [],
        departments: departmentsResult.data ?? [],
        paymentMethods: paymentMethodsResult.data ?? []
    };
};
