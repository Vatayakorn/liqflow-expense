import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return json({ success: true }); // No IDs to update
    }

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', ids);

    if (error) {
        console.error('Error marking notifications as read:', error);
        return json({ status: 'error', message: error.message }, { status: 500 });
    }

    return json({ success: true });
};
