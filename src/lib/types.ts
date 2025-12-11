// TypeScript Types สำหรับ Database Schema

// ประเภทไฟล์แนบ
export type AttachmentType =
    | 'approve_proof'  // หลักฐานอนุมัติ
    | 'slip'           // สลิปโอนเงิน
    | 'receipt'        // ใบเสร็จ
    | 'invoice'        // ใบแจ้งหนี้
    | 'product_photo'; // รูปสินค้า

// สถานะรายจ่าย
export type ExpenseStatus = 'draft' | 'approved' | 'rejected' | 'paid';

// ========== Lookup Tables ==========

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export interface Department {
    id: string;
    name: string;
}

export interface PaymentMethod {
    id: string;
    name: string;
    icon: string;
}

// ========== Main Tables ==========

export interface Expense {
    id: string;
    date: string;
    amount: number;
    category_id: string;
    payment_method_id: string;
    vendor: string | null;
    description: string;
    note_internal: string | null;
    status: ExpenseStatus;
    created_by_name: string;
    department_id: string;
    created_at: string;
    updated_at: string;
}

// Expense พร้อมข้อมูล join
export interface ExpenseWithRelations extends Expense {
    category: Category;
    department: Department;
    payment_method: PaymentMethod;
    attachments: Attachment[];
}

export interface Attachment {
    id: string;
    expense_id: string;
    attachment_type: AttachmentType;
    file_path: string;
    file_name: string;
    uploaded_at: string;
}

// ========== Form Types ==========

export interface ExpenseFormData {
    date: string;
    amount: number;
    category_id: string;
    payment_method_id: string;
    vendor: string;
    description: string;
    note_internal: string;
    created_by_name: string;
    department_id: string;
    status: ExpenseStatus;
}

// ========== Dashboard Types ==========

export interface MonthlyExpense {
    month: string; // YYYY-MM
    total: number;
    count: number;
}

export interface CategorySummary {
    category_id: string;
    category_name: string;
    category_color: string;
    total: number;
    count: number;
}

export interface DepartmentSummary {
    department_id: string;
    department_name: string;
    total: number;
    count: number;
}

export interface DashboardData {
    currentMonthTotal: number;
    currentMonthCount: number;
    previousMonthTotal: number;
    monthlyExpenses: MonthlyExpense[];
    categoryBreakdown: CategorySummary[];
    departmentBreakdown: DepartmentSummary[];
    recentExpenses: ExpenseWithRelations[];
}

// ========== Supabase Database Types ==========

export interface Database {
    public: {
        Tables: {
            expenses: {
                Row: Expense;
                Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Expense, 'id' | 'created_at'>>;
            };
            attachments: {
                Row: Attachment;
                Insert: Omit<Attachment, 'id' | 'uploaded_at'>;
                Update: Partial<Omit<Attachment, 'id'>>;
            };
            categories: {
                Row: Category;
                Insert: Omit<Category, 'id'>;
                Update: Partial<Omit<Category, 'id'>>;
            };
            departments: {
                Row: Department;
                Insert: Omit<Department, 'id'>;
                Update: Partial<Omit<Department, 'id'>>;
            };
            payment_methods: {
                Row: PaymentMethod;
                Insert: Omit<PaymentMethod, 'id'>;
                Update: Partial<Omit<PaymentMethod, 'id'>>;
            };
        };
    };
}

// ========== Budget Types ==========

export type BudgetType = 'category' | 'department';

export interface Budget {
    id: string;
    budget_type: BudgetType;
    category_id: string | null;
    department_id: string | null;
    month: string; // YYYY-MM
    amount: number;
    alert_threshold: number;
    created_at: string;
    updated_at: string;
}

export interface BudgetWithRelations extends Budget {
    category?: Category;
    department?: Department;
}

export interface BudgetWithUsage extends BudgetWithRelations {
    used: number; // ยอดใช้จ่ายจริง
    remaining: number; // เหลือ
    percentage: number; // % ที่ใช้ไป
    status: 'safe' | 'warning' | 'danger'; // สถานะ
}

export interface RecurringExpense {
    id: string;
    description: string;
    amount: number;
    category_id: string;
    payment_method_id: string;
    department_id: string;
    vendor: string | null;
    frequency: 'weekly' | 'monthly' | 'yearly';
    start_date: string;
    next_due_date: string;
    active: boolean;
    created_by_name: string;
    created_at: string;
    updated_at: string;
}

