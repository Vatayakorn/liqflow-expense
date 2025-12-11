<script lang="ts">
    import { ArrowLeft, Save, Repeat } from "lucide-svelte";
    import { page } from "$app/stores";
    import { enhance } from "$app/forms";
    import { toInputDate } from "$lib/utils";

    let { form } = $props();

    // Lookup data from layout
    const categories = $page.data.categories ?? [];
    const departments = $page.data.departments ?? [];
    const paymentMethods = $page.data.paymentMethods ?? [];

    let isSubmitting = $state(false);
</script>

<div class="max-w-3xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
        <a
            href="/recurring"
            class="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        >
            <ArrowLeft class="w-6 h-6" />
        </a>
        <h1 class="text-2xl font-bold text-gray-900">สร้างรายการรายจ่ายประจำ</h1>
    </div>

    <form
        method="POST"
        use:enhance={() => {
            isSubmitting = true;
            return async ({ update }) => {
                await update();
                isSubmitting = false;
            };
        }}
        class="space-y-6"
    >
        <!-- Card 1: ข้อมูลทั่วไป -->
        <div class="card p-6 space-y-6">
            <div class="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b pb-2">
                <Repeat class="w-5 h-5 text-primary-600" />
                ข้อมูลรายการ
            </div>

            <!-- Description -->
            <div>
                <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
                    รายการ <span class="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="description"
                    name="description"
                    required
                    class="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                    placeholder="เช่น ค่าเช่าออฟฟิศ, ค่าอินเทอร์เน็ต"
                    value={form?.values?.description ?? ''}
                />
            </div>

            <!-- Amount -->
            <div>
                <label for="amount" class="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนเงิน <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span class="text-gray-500">฿</span>
                    </div>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        step="0.01"
                        required
                        class="w-full pl-8 rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 font-mono text-lg"
                        placeholder="0.00"
                        value={form?.values?.amount ?? ''}
                    />
                </div>
            </div>

            <!-- Vendor -->
            <div>
                <label for="vendor" class="block text-sm font-medium text-gray-700 mb-1">
                    ร้านค้า / ผู้รับเงิน
                </label>
                <input
                    type="text"
                    id="vendor"
                    name="vendor"
                    class="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                    placeholder="ระบุชื่อร้านค้า"
                    value={form?.values?.vendor ?? ''}
                />
            </div>
        </div>

        <!-- Card 2: การจัดหมวดหมู่ -->
        <div class="card p-6 space-y-6">
            <div class="text-lg font-semibold text-gray-800 border-b pb-2">
                การจัดหมวดหมู่
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Category -->
                <div>
                    <label for="category_id" class="block text-sm font-medium text-gray-700 mb-1">
                        หมวดหมู่ <span class="text-red-500">*</span>
                    </label>
                    <select
                        id="category_id"
                        name="category_id"
                        required
                        class="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                        value={form?.values?.category_id ?? ''}
                    >
                        <option value="">-- เลือกหมวดหมู่ --</option>
                        {#each categories as cat}
                            <option value={cat.id}>{cat.icon} {cat.name}</option>
                        {/each}
                    </select>
                </div>

                <!-- Department -->
                <div>
                    <label for="department_id" class="block text-sm font-medium text-gray-700 mb-1">
                        แผนก <span class="text-red-500">*</span>
                    </label>
                    <select
                        id="department_id"
                        name="department_id"
                        required
                        class="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                        value={form?.values?.department_id ?? ''}
                    >
                        <option value="">-- เลือกแผนก --</option>
                        {#each departments as dept}
                            <option value={dept.id}>{dept.name}</option>
                        {/each}
                    </select>
                </div>

                <!-- Payment Method -->
                <div class="md:col-span-2">
                    <label for="payment_method_id" class="block text-sm font-medium text-gray-700 mb-1">
                        วิธีการชำระเงิน <span class="text-red-500">*</span>
                    </label>
                    <select
                        id="payment_method_id"
                        name="payment_method_id"
                        required
                        class="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                        value={form?.values?.payment_method_id ?? ''}
                    >
                        <option value="">-- เลือกวิธีการชำระเงิน --</option>
                        {#each paymentMethods as pm}
                            <option value={pm.id}>{pm.icon} {pm.name}</option>
                        {/each}
                    </select>
                </div>
            </div>
        </div>

        <!-- Card 3: ความถี่ -->
        <div class="card p-6 space-y-6">
            <div class="text-lg font-semibold text-gray-800 border-b pb-2">
                ความถี่และกำหนดการ
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Frequency -->
                <div>
                    <label for="frequency" class="block text-sm font-medium text-gray-700 mb-1">
                        ความถี่ <span class="text-red-500">*</span>
                    </label>
                    <select
                        id="frequency"
                        name="frequency"
                        required
                        class="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                        value={form?.values?.frequency ?? 'monthly'}
                    >
                        <option value="weekly">รายสัปดาห์ (Weekly)</option>
                        <option value="monthly">รายเดือน (Monthly)</option>
                        <option value="yearly">รายปี (Yearly)</option>
                    </select>
                </div>

                <!-- Start Date -->
                <div>
                    <label for="start_date" class="block text-sm font-medium text-gray-700 mb-1">
                        วันที่เริ่ม / ครบกำหนดครั้งถัดไป <span class="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        id="start_date"
                        name="start_date"
                        required
                        class="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                        value={form?.values?.start_date ?? toInputDate(new Date())}
                    />
                </div>
            </div>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end pt-4">
            <button
                type="submit"
                disabled={isSubmitting}
                class="btn-primary w-full md:w-auto text-lg px-8 py-3 shadow-lg shadow-primary-600/20"
            >
                {#if isSubmitting}
                    <span class="loading loading-spinner loading-sm mr-2"></span>
                    กำลังบันทึก...
                {:else}
                    <Save class="w-5 h-5 mr-2" />
                    บันทึกรายการ
                {/if}
            </button>
        </div>
    </form>
</div>
