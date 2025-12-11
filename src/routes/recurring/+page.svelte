<script lang="ts">
    import { Plus, Calendar, Repeat, CheckCircle, XCircle } from "lucide-svelte";
    import { formatCurrency, formatDate } from "$lib/utils";

    let { data } = $props();
    let recurringExpenses = $derived(data.recurringExpenses);

    function getFrequencyLabel(freq: string) {
        switch (freq) {
            case 'weekly': return 'รายสัปดาห์';
            case 'monthly': return 'รายเดือน';
            case 'yearly': return 'รายปี';
            default: return freq;
        }
    }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">รายจ่ายประจำ (Recurring)</h1>
        <a
            href="/recurring/new"
            class="btn-primary"
        >
            <Plus class="w-5 h-5 mr-2" />
            สร้างรายการใหม่
        </a>
    </div>

    {#if recurringExpenses.length === 0}
        <div class="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <Repeat class="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 class="text-lg font-medium text-gray-900">ยังไม่มีรายการรายจ่ายประจำ</h3>
            <p class="text-gray-500 mt-2">สร้างรายการเพื่อช่วยบันทึกค่าใช้จ่ายที่เกิดขึ้นบ่อยๆ</p>
        </div>
    {:else}
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each recurringExpenses as expense}
                <div class="card p-4 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                                style="background-color: {expense.category?.color || '#eee'}20; color: {expense.category?.color || '#666'}"
                            >
                                {expense.category?.icon || '📦'}
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-900 line-clamp-1">
                                    {expense.description}
                                </h3>
                                <p class="text-sm text-gray-500">
                                    {expense.category?.name || 'ไม่ระบุหมวดหมู่'}
                                </p>
                            </div>
                        </div>
                        <span class={`px-2 py-1 rounded-full text-xs font-medium ${expense.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {expense.active ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    <div class="space-y-2 mb-4">
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-500">จำนวนเงิน</span>
                            <span class="font-bold text-gray-900">{formatCurrency(expense.amount)}</span>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-500">ความถี่</span>
                            <span class="flex items-center gap-1 text-gray-700">
                                <Repeat class="w-3 h-3" />
                                {getFrequencyLabel(expense.frequency)}
                            </span>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-500">ครบกำหนดถัดไป</span>
                            <span class="flex items-center gap-1 text-primary-600 font-medium">
                                <Calendar class="w-3 h-3" />
                                {formatDate(expense.next_due_date)}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Future: Add buttons to edit or generate expense manually -->
                </div>
            {/each}
        </div>
    {/if}
</div>
