// Supabase Client สำหรับเชื่อมต่อกับ Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// สร้าง Supabase client (ไม่ใช้ strict types เพื่อความง่าย)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket name สำหรับไฟล์แนบ
export const STORAGE_BUCKET = 'expense-attachments';

// ฟังก์ชันช่วยอัปโหลดไฟล์ไป Storage
export async function uploadFile(
    file: File,
    attachmentType: string,
    expenseId: string
): Promise<{ path: string; error: Error | null }> {
    // สร้าง path แบบ: slip/2024/12/expense-id/filename.jpg
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const path = `${attachmentType}/${year}/${month}/${expenseId}/${fileName}`;

    const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        return { path: '', error: error as Error };
    }

    return { path, error: null };
}

// ฟังก์ชันสร้าง public URL สำหรับไฟล์
export function getPublicUrl(path: string): string {
    const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(path);

    return data.publicUrl;
}

// ฟังก์ชันลบไฟล์
export async function deleteFile(path: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([path]);

    return { error: error as Error | null };
}

// ========== IMAGE PREVIEW FUNCTIONS ==========

/**
 * สร้าง URL สำหรับ Thumbnail (รูปเล็ก)
 * ใช้สำหรับแสดงใน grid หรือ list
 * @param path - path ของไฟล์ใน storage
 * @param size - ขนาด thumbnail (default 200px)
 */
export function getThumbnailUrl(path: string, size: number = 200): string {
    const baseUrl = getPublicUrl(path);
    // แปลงจาก /object/ เป็น /render/image/ สำหรับ transformations
    const renderUrl = baseUrl.replace('/object/', '/render/image/');
    return `${renderUrl}?width=${size}&height=${size}&resize=cover&quality=80`;
}

/**
 * สร้าง URL สำหรับ Preview (รูปขนาดกลาง)
 * ใช้สำหรับแสดงใน lightbox หรือ modal
 * @param path - path ของไฟล์ใน storage
 * @param maxWidth - ความกว้างสูงสุด (default 800px)
 */
export function getPreviewUrl(path: string, maxWidth: number = 800): string {
    const baseUrl = getPublicUrl(path);
    const renderUrl = baseUrl.replace('/object/', '/render/image/');
    return `${renderUrl}?width=${maxWidth}&quality=85`;
}

/**
 * สร้าง URL แบบ WebP (ประหยัด bandwidth)
 * @param path - path ของไฟล์ใน storage
 * @param width - ความกว้าง
 */
export function getWebpUrl(path: string, width: number = 400): string {
    const baseUrl = getPublicUrl(path);
    const renderUrl = baseUrl.replace('/object/', '/render/image/');
    return `${renderUrl}?width=${width}&format=webp&quality=80`;
}

/**
 * ตรวจสอบว่า path เป็นรูปภาพหรือไม่
 */
export function isImagePath(path: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const lowerPath = path.toLowerCase();
    return imageExtensions.some(ext => lowerPath.endsWith(ext));
}
