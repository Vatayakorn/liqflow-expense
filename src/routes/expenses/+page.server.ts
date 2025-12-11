// Expenses List Server - โหลดรายการรายจ่ายพร้อม filter
import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabase';

export const load: PageServerLoad = async ({ url }) => {
    // อ่าน query params สำหรับ filter
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || '';
    const department = url.searchParams.get('department') || '';
    const status = url.searchParams.get('status') || '';
    const dateFrom = url.searchParams.get('from') || '';
    const dateTo = url.searchParams.get('to') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    // สร้าง query
    let query = supabase
        .from('expenses')
        .select(`
      *,
      category:categories(*),
      department:departments(*),
      payment_method:payment_methods(*),
      attachments(attachment_type)
    `, { count: 'exact' });

    // เพิ่ม filters
    if (search) {
        query = query.or(`description.ilike.%${search}%,vendor.ilike.%${search}%`);
    }
    if (category) {
        query = query.eq('category_id', category);
    }
    if (department) {
        query = query.eq('department_id', department);
    }
    if (status) {
        query = query.eq('status', status);
    }
    if (dateFrom) {
        query = query.gte('date', dateFrom);
    }
    if (dateTo) {
        query = query.lte('date', dateTo);
    }

    // Ordering และ Pagination
    const { data, count, error } = await query
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching expenses:', error);
    }

    return {
        expenses: data ?? [],
        totalCount: count ?? 0,
        currentPage: page,
        totalPages: Math.ceil((count ?? 0) / limit),
        filters: {
            search,
            category,
            department,
            status,
            dateFrom,
            dateTo
        }
    };
};
