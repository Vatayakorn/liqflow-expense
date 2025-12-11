<script lang="ts">
    import {
        Search,
        Filter,
        Plus,
        ChevronLeft,
        ChevronRight,
        X,
        Download,
        FileSpreadsheet,
        FileText,
        ImageOff,
    } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import {
        formatCurrency,
        formatDate,
        getStatusColor,
        getStatusLabel,
    } from "$lib/utils";
    import { exportToExcel, exportToPDF } from "$lib/export";
    import type { ExpenseWithRelations, AttachmentType } from "$lib/types";

    let { data } = $props();

    // Export dropdown state
    let showExportMenu = $state(false);

    // Filter state (ใช้ค่าจาก server)
    let search = $state(data.filters.search);
    let categoryFilter = $state(data.filters.category);
    let departmentFilter = $state(data.filters.department);
    let statusFilter = $state(data.filters.status);
    let dateFrom = $state(data.filters.dateFrom);
    let dateTo = $state(data.filters.dateTo);
    let showFilters = $state(false);

    // ดึง lookup data จาก layout
    const categories = $page.data.categories ?? [];
    const departments = $page.data.departments ?? [];

    // Status options
    const statusOptions = [
        { value: "", label: "ทั้งหมด" },
        { value: "draft", label: "แบบร่าง" },
        { value: "approved", label: "อนุมัติแล้ว" },
        { value: "rejected", label: "ถูกปฏิเสธ" },
        { value: "paid", label: "จ่ายเงินแล้ว" },
    ];

    // รายการรูปภาพที่ต้อง upload (ทุกประเภทที่ต้องมี)
    const REQUIRED_ATTACHMENTS: AttachmentType[] = [
        "approve_proof",
        "slip",
        "receipt",
        "invoice",
        "product_photo",
    ];

    // Label mapping สำหรับแสดงผล
    const attachmentLabels: Record<AttachmentType, string> = {
        approve_proof: "หลักฐานอนุมัติ",
        slip: "สลิป",
        receipt: "ใบเสร็จ",
        invoice: "ใบแจ้งหนี้",
        product_photo: "รูปสินค้า",
    };

    // หา attachments ที่ยังไม่ได้ upload
    function getMissingAttachments(
        expense: ExpenseWithRelations,
    ): AttachmentType[] {
        const uploadedTypes = (expense.attachments || []).map(
            (a) => a.attachment_type,
        );
        return REQUIRED_ATTACHMENTS.filter(
            (type) => !uploadedTypes.includes(type),
        );
    }

    // ฟังก์ชันค้นหา/กรอง
    function applyFilters() {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (categoryFilter) params.set("category", categoryFilter);
        if (departmentFilter) params.set("department", departmentFilter);
        if (statusFilter) params.set("status", statusFilter);
        if (dateFrom) params.set("from", dateFrom);
        if (dateTo) params.set("to", dateTo);

        goto(`/expenses?${params.toString()}`);
    }

    // ล้าง filters
    function clearFilters() {
        search = "";
        categoryFilter = "";
        departmentFilter = "";
        statusFilter = "";
        dateFrom = "";
        dateTo = "";
        goto("/expenses");
    }

    // เปลี่ยนหน้า
    function goToPage(pageNum: number) {
        const params = new URLSearchParams($page.url.searchParams);
        params.set("page", String(pageNum));
        goto(`/expenses?${params.toString()}`);
    }

    // ตรวจสอบว่ามี active filter หรือไม่
    const hasActiveFilters = $derived(
        search ||
            categoryFilter ||
            departmentFilter ||
            statusFilter ||
            dateFrom ||
            dateTo,
    );
</script>

<svelte:head>
    <title>รายจ่าย | Liqflow Expense</title>
</svelte:head>

<div class="p-4 lg:p-8">
    <!-- Header -->
    <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
    >
        <div>
            <h1 class="text-2xl font-bold text-gray-900">รายจ่าย</h1>
            <p class="text-sm text-gray-500 mt-1">
                ทั้งหมด {data.totalCount} รายการ
            </p>
        </div>
        <div class="flex items-center gap-2">
            <!-- Export Dropdown -->
            <div class="relative">
                <button
                    class="btn-secondary"
                    onclick={() => (showExportMenu = !showExportMenu)}
                    disabled={data.expenses.length === 0}
                >
                    <Download class="w-5 h-5" />
                    <span class="hidden sm:inline">Export</span>
                </button>

                {#if showExportMenu}
                    <!-- Backdrop -->
                    <button
                        class="fixed inset-0 z-40"
                        onclick={() => (showExportMenu = false)}
                        aria-label="Close menu"
                    ></button>

                    <!-- Dropdown Menu -->
                    <div
                        class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1"
                    >
                        <button
                            class="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            onclick={() => {
                                exportToExcel(
                                    data.expenses as ExpenseWithRelations[],
                                );
                                showExportMenu = false;
                            }}
                        >
                            <FileSpreadsheet class="w-5 h-5 text-green-600" />
                            <div>
                                <p class="font-medium text-gray-900">
                                    Excel (.xlsx)
                                </p>
                                <p class="text-xs text-gray-500">
                                    สำหรับแก้ไขข้อมูล
                                </p>
                            </div>
                        </button>
                        <button
                            class="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            onclick={async () => {
                                await exportToPDF(
                                    data.expenses as ExpenseWithRelations[],
                                );
                                showExportMenu = false;
                            }}
                        >
                            <FileText class="w-5 h-5 text-red-600" />
                            <div>
                                <p class="font-medium text-gray-900">
                                    PDF (.pdf)
                                </p>
                                <p class="text-xs text-gray-500">
                                    สำหรับพิมพ์/แชร์
                                </p>
                            </div>
                        </button>
                    </div>
                {/if}
            </div>

            <!-- Add Expense Button -->
            <a href="/expenses/new" class="btn-primary">
                <Plus class="w-5 h-5" />
                <span>เพิ่มรายจ่าย</span>
            </a>
        </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="card p-4 mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
            <!-- Search -->
            <div class="flex-1">
                <input
                    type="text"
                    bind:value={search}
                    placeholder="ค้นหารายละเอียด, ร้านค้า..."
                    class="input"
                    onkeydown={(e) => e.key === "Enter" && applyFilters()}
                />
            </div>

            <!-- Filter Toggle -->
            <button
                class="btn-secondary {showFilters ? 'bg-gray-100' : ''}"
                onclick={() => (showFilters = !showFilters)}
            >
                <Filter class="w-5 h-5" />
                <span>ตัวกรอง</span>
                {#if hasActiveFilters}
                    <span class="w-2 h-2 bg-primary-500 rounded-full"></span>
                {/if}
            </button>

            <button class="btn-primary" onclick={applyFilters}> ค้นหา </button>
        </div>

        <!-- Expanded Filters -->
        {#if showFilters}
            <div class="mt-4 pt-4 border-t border-gray-200">
                <div
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    <!-- Category -->
                    <div>
                        <label class="label">หมวดหมู่</label>
                        <select bind:value={categoryFilter} class="select">
                            <option value="">ทั้งหมด</option>
                            {#each categories as cat}
                                <option value={cat.id}
                                    >{cat.icon} {cat.name}</option
                                >
                            {/each}
                        </select>
                    </div>

                    <!-- Department -->
                    <div>
                        <label class="label">แผนก</label>
                        <select bind:value={departmentFilter} class="select">
                            <option value="">ทั้งหมด</option>
                            {#each departments as dept}
                                <option value={dept.id}>{dept.name}</option>
                            {/each}
                        </select>
                    </div>

                    <!-- Status -->
                    <div>
                        <label class="label">สถานะ</label>
                        <select bind:value={statusFilter} class="select">
                            {#each statusOptions as opt}
                                <option value={opt.value}>{opt.label}</option>
                            {/each}
                        </select>
                    </div>

                    <!-- Date Range -->
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="label">จากวันที่</label>
                            <input
                                type="date"
                                bind:value={dateFrom}
                                class="input"
                            />
                        </div>
                        <div>
                            <label class="label">ถึงวันที่</label>
                            <input
                                type="date"
                                bind:value={dateTo}
                                class="input"
                            />
                        </div>
                    </div>
                </div>

                {#if hasActiveFilters}
                    <div class="mt-4 flex justify-end">
                        <button
                            class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                            onclick={clearFilters}
                        >
                            <X class="w-4 h-4" />
                            ล้างตัวกรอง
                        </button>
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Expenses Table -->
    <div class="card overflow-hidden">
        {#if data.expenses.length > 0}
            <!-- Desktop Table -->
            <div class="hidden md:block overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >วันที่</th
                            >
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >รายละเอียด</th
                            >
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >หมวด</th
                            >
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >แผนก</th
                            >
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >หมายเหตุ</th
                            >
                            <th
                                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >จำนวนเงิน</th
                            >
                            <th
                                class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >สถานะ</th
                            >
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        {#each data.expenses as expense}
                            {@const missingAttachments = getMissingAttachments(
                                expense as ExpenseWithRelations,
                            )}
                            <tr
                                class="hover:bg-gray-50 cursor-pointer transition-colors"
                                onclick={() => goto(`/expenses/${expense.id}`)}
                            >
                                <td
                                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                                >
                                    {formatDate(expense.date)}
                                </td>
                                <td class="px-6 py-4">
                                    <p
                                        class="text-sm font-medium text-gray-900 truncate max-w-xs"
                                    >
                                        {expense.description}
                                    </p>
                                    {#if expense.vendor}
                                        <p class="text-xs text-gray-500">
                                            {expense.vendor}
                                        </p>
                                    {/if}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="text-sm"
                                        >{expense.category?.icon}
                                        {expense.category?.name}</span
                                    >
                                </td>
                                <td
                                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                                >
                                    {expense.department?.name}
                                </td>
                                <td
                                    class="px-6 py-4 text-sm text-gray-600 max-w-xs"
                                >
                                    {#if expense.note_internal}
                                        <p
                                            class="truncate mb-1"
                                            title={expense.note_internal}
                                        >
                                            {expense.note_internal}
                                        </p>
                                    {/if}
                                    {#if missingAttachments.length > 0}
                                        <div class="flex flex-wrap gap-1 mt-1">
                                            <span
                                                class="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded"
                                            >
                                                <ImageOff class="w-3 h-3" />
                                                ยังไม่อัพโหลด:
                                            </span>
                                            {#each missingAttachments as type}
                                                <span
                                                    class="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded"
                                                >
                                                    {attachmentLabels[type]}
                                                </span>
                                            {/each}
                                        </div>
                                    {:else if !expense.note_internal}
                                        <span class="text-gray-400">-</span>
                                    {/if}
                                </td>
                                <td
                                    class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right text-currency"
                                >
                                    {formatCurrency(expense.amount)}
                                </td>
                                <td
                                    class="px-6 py-4 whitespace-nowrap text-center"
                                >
                                    <span
                                        class="badge {getStatusColor(
                                            expense.status,
                                        )}"
                                        >{getStatusLabel(expense.status)}</span
                                    >
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <!-- Mobile Cards -->
            <div class="md:hidden divide-y divide-gray-100">
                {#each data.expenses as expense}
                    {@const missingMobile = getMissingAttachments(
                        expense as ExpenseWithRelations,
                    )}
                    <a
                        href="/expenses/{expense.id}"
                        class="block p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex items-center gap-3">
                                <span class="text-2xl"
                                    >{expense.category?.icon ?? "📦"}</span
                                >
                                <div>
                                    <p
                                        class="text-sm font-medium text-gray-900"
                                    >
                                        {expense.description}
                                    </p>
                                    <p class="text-xs text-gray-500">
                                        {formatDate(expense.date)} • {expense
                                            .department?.name}
                                    </p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p
                                    class="text-sm font-semibold text-gray-900 text-currency"
                                >
                                    {formatCurrency(expense.amount)}
                                </p>
                                <span
                                    class="badge {getStatusColor(
                                        expense.status,
                                    )} mt-1"
                                    >{getStatusLabel(expense.status)}</span
                                >
                            </div>
                        </div>
                        <!-- Missing attachments indicator for mobile -->
                        {#if missingMobile.length > 0}
                            <div
                                class="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-100"
                            >
                                <span
                                    class="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded"
                                >
                                    <ImageOff class="w-3 h-3" />
                                    ยังไม่อัพโหลด:
                                </span>
                                {#each missingMobile as type}
                                    <span
                                        class="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded"
                                    >
                                        {attachmentLabels[type]}
                                    </span>
                                {/each}
                            </div>
                        {/if}
                    </a>
                {/each}
            </div>

            <!-- Pagination -->
            {#if data.totalPages > 1}
                <div
                    class="px-6 py-4 border-t border-gray-200 flex items-center justify-between"
                >
                    <p class="text-sm text-gray-500">
                        หน้า {data.currentPage} จาก {data.totalPages}
                    </p>
                    <div class="flex items-center gap-2">
                        <button
                            class="btn-secondary !px-2 !py-2"
                            disabled={data.currentPage <= 1}
                            onclick={() => goToPage(data.currentPage - 1)}
                        >
                            <ChevronLeft class="w-5 h-5" />
                        </button>
                        <button
                            class="btn-secondary !px-2 !py-2"
                            disabled={data.currentPage >= data.totalPages}
                            onclick={() => goToPage(data.currentPage + 1)}
                        >
                            <ChevronRight class="w-5 h-5" />
                        </button>
                    </div>
                </div>
            {/if}
        {:else}
            <div class="px-6 py-16 text-center">
                <div
                    class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                    <Search class="w-8 h-8 text-gray-400" />
                </div>
                <p class="text-gray-500 mb-4">
                    {#if hasActiveFilters}
                        ไม่พบรายการที่ตรงกับเงื่อนไข
                    {:else}
                        ยังไม่มีรายจ่าย
                    {/if}
                </p>
                {#if hasActiveFilters}
                    <button class="btn-secondary" onclick={clearFilters}>
                        ล้างตัวกรอง
                    </button>
                {:else}
                    <a href="/expenses/new" class="btn-primary">
                        <Plus class="w-5 h-5" />
                        <span>เพิ่มรายจ่ายแรก</span>
                    </a>
                {/if}
            </div>
        {/if}
    </div>
</div>
