import { supabase } from './supabase';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface CreateNotificationParams {
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    targetRole?: string;
}

/**
 * สร้าง Notification ใหม่
 */
export async function createNotification(params: CreateNotificationParams) {
    try {
        const { error } = await supabase.from('notifications').insert({
            type: params.type,
            title: params.title,
            message: params.message,
            link: params.link || null,
            target_role: params.targetRole || null,
            is_read: false
        });

        if (error) {
            console.error('Error creating notification:', error);
        }
    } catch (e) {
        console.error('Exception creating notification:', e);
    }
}
