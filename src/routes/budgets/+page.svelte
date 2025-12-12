<script lang="ts">
    import {
        Plus,
        Edit,
        Trash2,
        PiggyBank,
        Building,
        Tag,
        AlertTriangle,
        CheckCircle,
        XCircle,
        ChevronLeft,
        ChevronRight,
    } from "lucide-svelte";
    import { enhance } from "$app/forms";
    import { goto } from "$app/navigation";
    import {
        formatCurrency,
        formatCurrencyCompact,
        getMonthName,
    } from "$lib/utils";
    import type { BudgetWithUsage, Category, Department } from "$lib/types";

    let { data, form } = $props();

    const budgets: BudgetWithUsage[] = data.budgets;
    const categories: Category[] = data.categories;
    const departments: Department[] = data.departments;
    const selectedMonth: string = data.selectedMonth;

    // Modal state
    let showCreateModal = $state(false);
    let showEditModal = $state(false);
    let showDeleteModal = $state(false);
    let editingBudget: BudgetWithUsage | null = $state(null);

    // Form state
    let budgetType = $state<"category" | "department">("category");
    let selectedCategoryId = $state("");
    let selectedDepartmentId = $state("");
    let amount = $state("");
    let alertThreshold = $state(80);

    // Month navigation
    function changeMonth(delta: number) {
        const [year, month] = selectedMonth.split("-").map(Number);
        const newDate = new Date(year, month - 1 + delta, 1);
        const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`;
        goto(`/budgets?month=${newMonth}`);
    }

    // Reset form
    function resetForm() {
        budgetType = "category";
        selectedCategoryId = "";
        selectedDepartmentId = "";
        amount = "";
        alertThreshold = 80;
    }

    // Open edit modal
    function openEditModal(budget: BudgetWithUsage) {
        editingBudget = budget;
        amount = budget.amount.toString();
        alertThreshold = budget.alert_threshold;
        showEditModal = true;
    }

    // Status helpers
    function getStatusColor(status: string): string {
        switch (status) {
            case "danger":
                return "text-red-600";
            case "warning":
                return "text-amber-600";
            default:
                return "text-green-600";
        }
    }

    function getProgressColor(status: string): string {
        switch (status) {
            case "danger":
                return "bg-red-500";
            case "warning":
                return "bg-amber-500";
            default:
                return "bg-green-500";
        }
    }

    function getStatusIcon(status: string) {
        switch (status) {
            case "danger":
                return XCircle;
            case "warning":
                return AlertTriangle;
            default:
                return CheckCircle;
        }
    }
</script>

<svelte:head>
    <title>จัดการงบประมาณ | Liqflow Expense</title>
</svelte:head>

<div class="p-4 lg:p-8 max-w-6xl mx-auto">
    <!-- Header -->
    <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
    >
        <div>
            <h1 class="text-2xl font-bold text-gray-900">💰 จัดการงบประมาณ</h1>
            <p class="text-sm text-gray-500 mt-1">
                ตั้งงบประมาณรายหมวดหมู่และรายแผนก
            </p>
        </div>

        <button
            class="btn-primary"
            onclick={() => {
                resetForm();
                showCreateModal = true;
            }}
        >
            <Plus class="w-5 h-5" />
            <span>ตั้งงบประมาณ</span>
        </button>
    </div>

    <!-- Month Selector -->
    <div class="card p-4 mb-6">
        <div class="flex items-center justify-between">
            <button
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onclick={() => changeMonth(-1)}
            >
                <ChevronLeft class="w-5 h-5" />
            </button>
            <div class="text-center">
                <p class="text-lg font-semibold text-gray-900">
                    {getMonthName(selectedMonth)}
                </p>
                <p class="text-sm text-gray-500">{selectedMonth}</p>
            </div>
            <button
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onclick={() => changeMonth(1)}
            >
                <ChevronRight class="w-5 h-5" />
            </button>
        </div>
    </div>

    <!-- Error/Success Messages -->
    {#if form?.error}
        <div
            class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
        >
            {form.error}
        </div>
    {/if}
    {#if form?.success}
        <div
            class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"
        >
            บันทึกสำเร็จ!
        </div>
    {/if}

    <!-- Budget List -->
    {#if budgets.length > 0}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each budgets as budget}
                {@const StatusIcon = getStatusIcon(budget.status)}
                <div class="card p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center gap-3">
                            {#if budget.budget_type === "category"}
                                <div
                                    class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-xl"
                                >
                                    {budget.category?.icon ?? "📦"}
                                </div>
                                <div>
                                    <p class="font-semibold text-gray-900">
                                        {budget.category?.name}
                                    </p>
                                    <p class="text-xs text-gray-500">
                                        หมวดหมู่
                                    </p>
                                </div>
                            {:else}
                                <div
                                    class="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"
                                >
                                    <Building class="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p class="font-semibold text-gray-900">
                                        {budget.department?.name}
                                    </p>
                                    <p class="text-xs text-gray-500">แผนก</p>
                                </div>
                            {/if}
                        </div>

                        <div class="flex items-center gap-1">
                            <button
                                class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                onclick={() => openEditModal(budget)}
                            >
                                <Edit class="w-4 h-4" />
                            </button>
                            <button
                                class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                onclick={() => {
                                    editingBudget = budget;
                                    showDeleteModal = true;
                                }}
                            >
                                <Trash2 class="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <!-- Progress -->
                    <div class="mb-3">
                        <div
                            class="flex items-center justify-between text-sm mb-1"
                        >
                            <span class="text-gray-600">ใช้ไป</span>
                            <span
                                class="{getStatusColor(
                                    budget.status,
                                )} font-medium"
                            >
                                {budget.percentage.toFixed(1)}%
                            </span>
                        </div>
                        <div
                            class="h-3 bg-gray-100 rounded-full overflow-hidden progress-bar-track"
                        >
                            <div
                                class="h-full rounded-full transition-all duration-500 {getProgressColor(
                                    budget.status,
                                )}"
                                style="width: {Math.min(
                                    budget.percentage,
                                    100,
                                )}%"
                            ></div>
                        </div>
                    </div>

                    <!-- Stats -->
                    <div class="grid grid-cols-3 gap-2 text-center">
                        <div class="bg-gray-50 rounded-lg p-2">
                            <p class="text-xs text-gray-500">งบประมาณ</p>
                            <p
                                class="text-sm font-semibold text-gray-900 text-currency"
                            >
                                {formatCurrencyCompact(budget.amount)}
                            </p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-2">
                            <p class="text-xs text-gray-500">ใช้ไป</p>
                            <p
                                class="text-sm font-semibold {getStatusColor(
                                    budget.status,
                                )} text-currency"
                            >
                                {formatCurrencyCompact(budget.used)}
                            </p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-2">
                            <p class="text-xs text-gray-500">เหลือ</p>
                            <p
                                class="text-sm font-semibold text-gray-900 text-currency"
                            >
                                {formatCurrencyCompact(
                                    Math.max(budget.remaining, 0),
                                )}
                            </p>
                        </div>
                    </div>

                    <!-- Status Badge -->
                    <div
                        class="mt-3 flex items-center gap-2 {getStatusColor(
                            budget.status,
                        )}"
                    >
                        <StatusIcon class="w-4 h-4" />
                        <span class="text-sm font-medium">
                            {#if budget.status === "danger"}
                                เกินงบประมาณ!
                            {:else if budget.status === "warning"}
                                ใกล้ถึงงบ ({budget.alert_threshold}%)
                            {:else}
                                ปกติ
                            {/if}
                        </span>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div class="card p-12 text-center">
            <PiggyBank class="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p class="text-gray-500 mb-4">ยังไม่มีงบประมาณสำหรับเดือนนี้</p>
            <button
                class="btn-primary"
                onclick={() => {
                    resetForm();
                    showCreateModal = true;
                }}
            >
                <Plus class="w-5 h-5" />
                <span>ตั้งงบประมาณแรก</span>
            </button>
        </div>
    {/if}
</div>

<!-- Create Modal -->
{#if showCreateModal}
    <div
        class="fixed inset-0 z-40"
        style="background-color: rgba(0, 0, 0, 0.6);"
    ></div>
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background-color: transparent;"
    >
        <div class="card max-w-md w-full p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
                ตั้งงบประมาณใหม่
            </h3>

            <form
                method="POST"
                action="?/create"
                use:enhance={() => {
                    return async ({ update }) => {
                        await update();
                        showCreateModal = false;
                    };
                }}
            >
                <input type="hidden" name="month" value={selectedMonth} />

                <!-- Budget Type -->
                <div class="mb-4">
                    <label class="label">ประเภท</label>
                    <div class="flex gap-2">
                        <button
                            type="button"
                            class="flex-1 py-2 px-4 rounded-lg border-2 transition-colors {budgetType ===
                            'category'
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 hover:border-gray-300'}"
                            onclick={() => (budgetType = "category")}
                        >
                            <Tag class="w-4 h-4 inline mr-1" />
                            หมวดหมู่
                        </button>
                        <button
                            type="button"
                            class="flex-1 py-2 px-4 rounded-lg border-2 transition-colors {budgetType ===
                            'department'
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 hover:border-gray-300'}"
                            onclick={() => (budgetType = "department")}
                        >
                            <Building class="w-4 h-4 inline mr-1" />
                            แผนก
                        </button>
                    </div>
                    <input
                        type="hidden"
                        name="budget_type"
                        value={budgetType}
                    />
                </div>

                <!-- Category / Department Select -->
                {#if budgetType === "category"}
                    <div class="mb-4">
                        <label for="category_id" class="label">หมวดหมู่</label>
                        <select
                            id="category_id"
                            name="category_id"
                            class="select"
                            bind:value={selectedCategoryId}
                            required
                        >
                            <option value="">-- เลือกหมวดหมู่ --</option>
                            {#each categories as cat}
                                <option value={cat.id}
                                    >{cat.icon} {cat.name}</option
                                >
                            {/each}
                        </select>
                    </div>
                {:else}
                    <div class="mb-4">
                        <label for="department_id" class="label">แผนก</label>
                        <select
                            id="department_id"
                            name="department_id"
                            class="select"
                            bind:value={selectedDepartmentId}
                            required
                        >
                            <option value="">-- เลือกแผนก --</option>
                            {#each departments as dept}
                                <option value={dept.id}>{dept.name}</option>
                            {/each}
                        </select>
                    </div>
                {/if}

                <!-- Amount -->
                <div class="mb-4">
                    <label for="amount" class="label">งบประมาณ (บาท)</label>
                    <input
                        type="text"
                        id="amount"
                        name="amount"
                        bind:value={amount}
                        placeholder="0"
                        class="input text-right text-currency"
                        required
                    />
                </div>

                <!-- Alert Threshold -->
                <div class="mb-6">
                    <label for="alert_threshold" class="label"
                        >แจ้งเตือนเมื่อใช้ถึง (%)</label
                    >
                    <input
                        type="range"
                        id="alert_threshold"
                        name="alert_threshold"
                        bind:value={alertThreshold}
                        min="50"
                        max="100"
                        step="5"
                        class="w-full"
                    />
                    <p class="text-sm text-gray-500 text-center mt-1">
                        {alertThreshold}%
                    </p>
                </div>

                <div class="flex gap-3">
                    <button
                        type="button"
                        class="btn-secondary flex-1"
                        onclick={() => (showCreateModal = false)}
                    >
                        ยกเลิก
                    </button>
                    <button type="submit" class="btn-primary flex-1">
                        บันทึก
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- Edit Modal -->
{#if showEditModal && editingBudget}
    <div
        class="fixed inset-0 z-40"
        style="background-color: rgba(0, 0, 0, 0.6);"
    ></div>
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background-color: transparent;"
    >
        <div class="card max-w-md w-full p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
                แก้ไขงบประมาณ
            </h3>

            <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-600">
                    {editingBudget.budget_type === "category"
                        ? "หมวดหมู่"
                        : "แผนก"}:
                    <span class="font-medium text-gray-900">
                        {editingBudget.budget_type === "category"
                            ? `${editingBudget.category?.icon} ${editingBudget.category?.name}`
                            : editingBudget.department?.name}
                    </span>
                </p>
            </div>

            <form
                method="POST"
                action="?/update"
                use:enhance={() => {
                    return async ({ update }) => {
                        await update();
                        showEditModal = false;
                    };
                }}
            >
                <input type="hidden" name="id" value={editingBudget.id} />

                <div class="mb-4">
                    <label for="edit_amount" class="label">งบประมาณ (บาท)</label
                    >
                    <input
                        type="text"
                        id="edit_amount"
                        name="amount"
                        bind:value={amount}
                        class="input text-right text-currency"
                        required
                    />
                </div>

                <div class="mb-6">
                    <label for="edit_threshold" class="label"
                        >แจ้งเตือนเมื่อใช้ถึง (%)</label
                    >
                    <input
                        type="range"
                        id="edit_threshold"
                        name="alert_threshold"
                        bind:value={alertThreshold}
                        min="50"
                        max="100"
                        step="5"
                        class="w-full"
                    />
                    <p class="text-sm text-gray-500 text-center mt-1">
                        {alertThreshold}%
                    </p>
                </div>

                <div class="flex gap-3">
                    <button
                        type="button"
                        class="btn-secondary flex-1"
                        onclick={() => (showEditModal = false)}
                    >
                        ยกเลิก
                    </button>
                    <button type="submit" class="btn-primary flex-1">
                        บันทึก
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && editingBudget}
    <div
        class="fixed inset-0 z-40"
        style="background-color: rgba(0, 0, 0, 0.6);"
    ></div>
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background-color: transparent;"
    >
        <div class="card max-w-md w-full p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
                ยืนยันการลบ
            </h3>
            <p class="text-gray-600 mb-6">
                คุณต้องการลบงบประมาณ "{editingBudget.budget_type === "category"
                    ? editingBudget.category?.name
                    : editingBudget.department?.name}" หรือไม่?
            </p>
            <div class="flex gap-3">
                <button
                    class="btn-secondary flex-1"
                    onclick={() => (showDeleteModal = false)}
                >
                    ยกเลิก
                </button>
                <form
                    method="POST"
                    action="?/delete"
                    class="flex-1"
                    use:enhance={() => {
                        return async ({ update }) => {
                            await update();
                            showDeleteModal = false;
                        };
                    }}
                >
                    <input type="hidden" name="id" value={editingBudget.id} />
                    <button type="submit" class="btn-danger w-full">
                        ลบ
                    </button>
                </form>
            </div>
        </div>
    </div>
{/if}
