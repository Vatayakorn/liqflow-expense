// Utility Functions

import type { ExpenseStatus, AttachmentType } from './types';

// ========== Currency Formatting ==========

/**
 * แปลงตัวเลขเป็นรูปแบบเงินบาท
 * @example formatCurrency(1234567.89) => "฿1,234,567.89"
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * แปลงตัวเลขเป็นรูปแบบย่อ
 * @example formatCurrencyCompact(1234567) => "฿1.23M"
 */
export function formatCurrencyCompact(amount: number): string {
    if (amount >= 1000000) {
        return `฿${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
        return `฿${(amount / 1000).toFixed(1)}K`;
    }
    return formatCurrency(amount);
}

// ========== Date Formatting ==========

/**
 * แปลงวันที่เป็นรูปแบบไทย
 * @example formatDate('2024-12-11') => "11 ธ.ค. 2567"
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * แปลงวันที่เป็นรูปแบบเต็ม
 * @example formatDateLong('2024-12-11') => "11 ธันวาคม 2567"
 */
export function formatDateLong(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * แปลงเป็น ISO date สำหรับ input
 * @example toInputDate(new Date()) => "2024-12-11"
 */
export function toInputDate(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * หาเดือน/ปี ปัจจุบัน
 * @example getCurrentMonth() => "2024-12"
 */
export function getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * หาชื่อเดือนจาก YYYY-MM
 * @example getMonthName('2024-12') => "ธ.ค. 67"
 */
export function getMonthName(monthString: string): string {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
}

// ========== Status ==========

/**
 * สีของ status badge
 */
export function getStatusColor(status: ExpenseStatus): string {
    const colors: Record<ExpenseStatus, string> = {
        draft: 'badge-draft',
        approved: 'badge-approved',
        rejected: 'badge-rejected',
        paid: 'badge-paid'
    };
    return colors[status] || 'badge-draft';
}

/**
 * ชื่อภาษาไทยของ status
 */
export function getStatusLabel(status: ExpenseStatus): string {
    const labels: Record<ExpenseStatus, string> = {
        draft: 'แบบร่าง',
        approved: 'อนุมัติแล้ว',
        rejected: 'ถูกปฏิเสธ',
        paid: 'จ่ายเงินแล้ว'
    };
    return labels[status] || status;
}

// ========== Attachment Types ==========

/**
 * ชื่อภาษาไทยของประเภทไฟล์แนบ
 */
export function getAttachmentTypeLabel(type: AttachmentType): string {
    const labels: Record<AttachmentType, string> = {
        approve_proof: 'หลักฐานอนุมัติ',
        slip: 'สลิปโอนเงิน',
        receipt: 'ใบเสร็จ',
        invoice: 'ใบแจ้งหนี้',
        product_photo: 'รูปสินค้า'
    };
    return labels[type] || type;
}

/**
 * รายการประเภทไฟล์แนบทั้งหมด
 */
export const ATTACHMENT_TYPES: { value: AttachmentType; label: string }[] = [
    { value: 'approve_proof', label: 'หลักฐานอนุมัติ' },
    { value: 'slip', label: 'สลิปโอนเงิน' },
    { value: 'receipt', label: 'ใบเสร็จ' },
    { value: 'invoice', label: 'ใบแจ้งหนี้' },
    { value: 'product_photo', label: 'รูปสินค้า' }
];

// ========== Validation ==========

/**
 * ตรวจสอบว่าเป็นไฟล์รูปภาพหรือไม่
 */
export function isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
}

/**
 * ตรวจสอบขนาดไฟล์ (default 10MB)
 */
export function isFileSizeValid(file: File, maxSizeMB: number = 10): boolean {
    return file.size <= maxSizeMB * 1024 * 1024;
}

// ========== Percentage ==========

/**
 * คำนวณเปอร์เซ็นต์การเปลี่ยนแปลง
 */
export function calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

/**
 * แสดงเปอร์เซ็นต์พร้อม + หรือ -
 */
export function formatPercentageChange(percentage: number): string {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
}
