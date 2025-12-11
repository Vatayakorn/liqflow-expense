// Export Utilities - สร้างไฟล์ Excel และ PDF
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate, getStatusLabel } from './utils';
import type { ExpenseWithRelations } from './types';

// ========== Excel Export ==========

/**
 * Export รายจ่ายเป็นไฟล์ Excel
 */
export function exportToExcel(
    expenses: ExpenseWithRelations[],
    filename: string = 'expenses-report'
): void {
    // เตรียมข้อมูลสำหรับ Excel
    const data = expenses.map((exp, index) => ({
        'ลำดับ': index + 1,
        'วันที่': formatDate(exp.date),
        'รายละเอียด': exp.description,
        'หมวดหมู่': exp.category?.name || '-',
        'แผนก': exp.department?.name || '-',
        'จำนวนเงิน': exp.amount,
        'วิธีชำระเงิน': exp.payment_method?.name || '-',
        'ร้านค้า': exp.vendor || '-',
        'สถานะ': getStatusLabel(exp.status),
        'ผู้ทำรายการ': exp.created_by_name,
        'หมายเหตุ': exp.note_internal || '-'
    }));

    // สร้าง worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // ปรับความกว้าง columns
    const columnWidths = [
        { wch: 6 },   // ลำดับ
        { wch: 12 },  // วันที่
        { wch: 35 },  // รายละเอียด
        { wch: 15 },  // หมวดหมู่
        { wch: 15 },  // แผนก
        { wch: 15 },  // จำนวนเงิน
        { wch: 15 },  // วิธีชำระเงิน
        { wch: 20 },  // ร้านค้า
        { wch: 12 },  // สถานะ
        { wch: 20 },  // ผู้ทำรายการ
        { wch: 25 },  // หมายเหตุ
    ];
    worksheet['!cols'] = columnWidths;

    // เพิ่ม summary row
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const summaryRowIndex = data.length + 2;

    XLSX.utils.sheet_add_aoa(worksheet, [
        ['', '', '', '', 'รวมทั้งหมด:', totalAmount, '', '', '', '', '']
    ], { origin: `A${summaryRowIndex}` });

    // สร้าง workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายจ่าย');

    // ดาวน์โหลด
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `${filename}-${today}.xlsx`);
}

// ========== PDF Export ==========

// Cache สำหรับ Thai font
let thaiFontLoaded = false;
let thaiFontBase64: string | null = null;
const THAI_FONT_FILENAME = 'Sarabun-Regular.ttf';
const THAI_FONT_URL = `/fonts/${THAI_FONT_FILENAME}`;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
}

/**
 * โหลดฟอนต์ไทย Sarabun จาก CDN
 */
async function loadThaiFont(): Promise<string | null> {
    if (thaiFontBase64) return thaiFontBase64;

    try {
        // โหลดฟอนต์ Sarabun จาก local static folder
        const response = await fetch(THAI_FONT_URL);

        if (!response.ok) {
            console.warn('Failed to load Thai font, using fallback');
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);

        thaiFontBase64 = base64;
        return base64;
    } catch (error) {
        console.warn('Error loading Thai font:', error);
        return null;
    }
}

/**
 * Export รายจ่ายเป็นไฟล์ PDF (async เพื่อโหลดฟอนต์ไทย)
 */
export async function exportToPDF(
    expenses: ExpenseWithRelations[],
    filename: string = 'expenses-report',
    title: string = 'รายงานรายจ่าย'
): Promise<void> {
    // โหลดฟอนต์ไทยก่อน
    const thaiFont = await loadThaiFont();

    // สร้าง PDF document (A4 landscape)
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    // เพิ่มฟอนต์ไทย Sarabun ถ้าโหลดสำเร็จ
    if (thaiFont) {
        try {
            doc.addFileToVFS(THAI_FONT_FILENAME, thaiFont);
            doc.addFont(THAI_FONT_FILENAME, 'Sarabun', 'normal');
            doc.setFont('Sarabun');
            thaiFontLoaded = true;
        } catch (e) {
            console.warn('Failed to add Thai font to jsPDF:', e);
        }
    }

    // Header
    doc.setFontSize(18);
    doc.text(title, 14, 20);

    // Sub-header
    doc.setFontSize(10);
    const today = new Date().toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    doc.text(`วันที่สร้าง: ${today}`, 14, 28);
    doc.text(`จำนวนรายการ: ${expenses.length} รายการ`, 14, 34);

    // เตรียมข้อมูลสำหรับตาราง - ใช้ภาษาไทย
    const tableData = expenses.map((exp, index) => [
        (index + 1).toString(),
        formatDate(exp.date),
        exp.description.length > 40 ? exp.description.substring(0, 40) + '...' : exp.description,
        exp.category?.name || '-',
        exp.department?.name || '-',
        formatCurrency(exp.amount),
        getStatusLabel(exp.status)
    ]);

    // สร้างตาราง
    autoTable(doc, {
        startY: 40,
        head: [['ลำดับ', 'วันที่', 'รายละเอียด', 'หมวดหมู่', 'แผนก', 'จำนวนเงิน', 'สถานะ']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [79, 70, 229], // primary-600
            textColor: 255,
            fontStyle: thaiFontLoaded ? 'normal' : 'bold',
            font: thaiFontLoaded ? 'Sarabun' : 'helvetica'
        },
        bodyStyles: {
            font: thaiFontLoaded ? 'Sarabun' : 'helvetica'
        },
        alternateRowStyles: {
            fillColor: [249, 250, 251] // gray-50
        },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 25 },
            2: { cellWidth: 75 },
            3: { cellWidth: 30 },
            4: { cellWidth: 30 },
            5: { cellWidth: 30, halign: 'right' },
            6: { cellWidth: 25, halign: 'center' }
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
            // Footer with page number
            const pageCount = (doc.internal as unknown as { pages: unknown[] }).pages.length - 1;
            doc.setFontSize(8);
            doc.text(
                `หน้า ${data.pageNumber} จาก ${pageCount}`,
                doc.internal.pageSize.width - 35,
                doc.internal.pageSize.height - 10
            );
        }
    });

    // เพิ่ม Summary
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 40;
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    doc.setFontSize(12);
    if (thaiFontLoaded) {
        doc.setFont('Sarabun', 'normal');
    } else {
        doc.setFont('helvetica', 'bold');
    }
    doc.text(`รวมทั้งหมด: ${formatCurrency(totalAmount)}`, 14, finalY + 15);

    // ดาวน์โหลด
    const todayISO = new Date().toISOString().split('T')[0];
    doc.save(`${filename}-${todayISO}.pdf`);
}

// ========== Quick Export Functions ==========

/**
 * Export รายจ่ายเดือนปัจจุบัน
 */
export async function exportCurrentMonth(
    expenses: ExpenseWithRelations[],
    format: 'excel' | 'pdf' = 'excel'
): Promise<void> {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const filtered = expenses.filter(exp => exp.date.startsWith(currentMonth));

    const monthName = now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    const filename = `expenses-${currentMonth}`;
    const title = `รายงานรายจ่าย - ${monthName}`;

    if (format === 'excel') {
        exportToExcel(filtered, filename);
    } else {
        await exportToPDF(filtered, filename, title);
    }
}

/**
 * Export รายจ่ายตามช่วงวันที่
 */
export async function exportByDateRange(
    expenses: ExpenseWithRelations[],
    startDate: string,
    endDate: string,
    format: 'excel' | 'pdf' = 'excel'
): Promise<void> {
    const filtered = expenses.filter(exp =>
        exp.date >= startDate && exp.date <= endDate
    );

    const filename = `expenses-${startDate}-to-${endDate}`;
    const title = `รายงานรายจ่าย ${formatDate(startDate)} - ${formatDate(endDate)}`;

    if (format === 'excel') {
        exportToExcel(filtered, filename);
    } else {
        await exportToPDF(filtered, filename, title);
    }
}
