# 💰 Liqflow Expense

ระบบบริหารจัดการรายจ่าย (Expense Management System) สำหรับบริษัท พัฒนาด้วย SvelteKit + Supabase

![SvelteKit](https://img.shields.io/badge/SvelteKit-5-FF3E00?logo=svelte)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)

---

## ✨ Features

### 📊 Dashboard
- สรุปยอดรายจ่ายรายเดือน/รายปี
- Line Chart แนวโน้มรายจ่าย 12 เดือน
- Doughnut Chart แยกตามหมวดหมู่
- Top 5 หมวดหมู่ที่ใช้จ่ายมากสุด
- Budget Alerts แจ้งเตือนงบใกล้หมด

### 📝 Expense Management
- เพิ่ม/แก้ไข/ลบรายจ่าย
- อัปโหลดไฟล์แนบหลายไฟล์ (รูปภาพ, PDF)
- สถานะ: Draft → Approved → Paid
- ค้นหาและกรองข้อมูล
- Export เป็น Excel (XLSX) และ PDF

### 💰 Budget Management
- ตั้งงบประมาณรายหมวดหมู่/รายแผนก
- Progress bars แสดงสถานะการใช้งบ
- แจ้งเตือนเมื่อใกล้ถึง threshold (80%)
- สีระบุสถานะ: 🟢 ปกติ, 🟡 ใกล้ถึงงบ, 🔴 เกินงบ

### 📱 PWA Ready
- ติดตั้งเป็น App บน iOS/Android
- Offline-ready icons

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm หรือ pnpm
- Supabase Account

### Installation

```bash
# Clone repository
git clone https://github.com/your-repo/liqflow-expense.git
cd liqflow-expense

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Environment Variables

แก้ไขไฟล์ `.env`:

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Database Setup

1. เปิด Supabase Dashboard → SQL Editor
2. รันไฟล์ `supabase/schema.sql` (สร้างตารางหลัก)
3. รันไฟล์ `supabase/budgets.sql` (สร้างตาราง budgets)

### Run Development Server

```bash
npm run dev

# หรือรันพร้อม host สำหรับ mobile testing
npm run dev -- --host
```

เปิด `http://localhost:5173` บน browser

---

## 📂 Project Structure

```
liqflow-expense/
├── src/
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client & helpers
│   │   ├── types.ts          # TypeScript types
│   │   ├── utils.ts          # Utility functions
│   │   └── export.ts         # Export functions (Excel, PDF)
│   ├── routes/
│   │   ├── +page.svelte      # Dashboard
│   │   ├── +layout.svelte    # Navigation layout
│   │   ├── expenses/         # Expense CRUD
│   │   │   ├── +page.svelte  # List expenses
│   │   │   ├── new/          # Create expense
│   │   │   └── [id]/         # View/Edit expense
│   │   └── budgets/          # Budget management
│   └── app.css               # Global styles
├── static/
│   ├── logo.png              # App logo
│   └── icons/                # PWA icons
├── supabase/
│   ├── schema.sql            # Main database schema
│   └── budgets.sql           # Budget table schema
└── package.json
```

---

## 🗄️ Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `expenses` | รายการรายจ่าย |
| `categories` | หมวดหมู่ |
| `departments` | แผนก |
| `payment_methods` | วิธีชำระเงิน |
| `attachments` | ไฟล์แนบ |
| `budgets` | งบประมาณ |

---

## 🎨 Tech Stack

| Technology | Purpose |
|------------|---------|
| **SvelteKit 5** | Frontend Framework |
| **TypeScript** | Type Safety |
| **TailwindCSS 4** | Styling |
| **Supabase** | Database & Storage |
| **Chart.js** | Data Visualization |
| **Lucide Icons** | Icons |
| **jsPDF** | PDF Export |
| **xlsx** | Excel Export |

---

## 📱 Attachment Types

| Type | Description |
|------|-------------|
| `approve_proof` | หลักฐานอนุมัติ |
| `slip` | สลิปโอนเงิน |
| `receipt` | ใบเสร็จ |
| `invoice` | ใบแจ้งหนี้ |
| `product_photo` | รูปสินค้า |

**รองรับ:** JPG, PNG, WebP, GIF, PDF (สูงสุด 10MB/ไฟล์)

---

## 🔧 Commands

```bash
# Development
npm run dev

# Build production
npm run build

# Preview production build
npm run preview

# Type check
npm run check
```

---

## 📄 License

MIT License

---

## 👨‍💻 Author

Developed by **Liqflow Team**
