<script lang="ts">
    import {
        ArrowLeft,
        Save,
        Upload,
        X,
        Image as ImageIcon,
        FileText,
    } from "lucide-svelte";
    import { page } from "$app/stores";
    import { enhance } from "$app/forms";
    import { toInputDate, ATTACHMENT_TYPES } from "$lib/utils";
    import type { AttachmentType } from "$lib/types";

    let { form } = $props();

    // Lookup data จาก layout
    const categories = $page.data.categories ?? [];
    const departments = $page.data.departments ?? [];
    const paymentMethods = $page.data.paymentMethods ?? [];

    // Form state
    let isSubmitting = $state(false);

    // State สำหรับ "อื่นๆ" custom input
    let showCustomCategory = $state(false);
    let showCustomPaymentMethod = $state(false);
    let customCategoryName = $state("");
    let customPaymentMethodName = $state("");

    // ไฟล์แนบแต่ละประเภท (preview)
    let files: Record<AttachmentType, File[]> = $state({
        approve_proof: [],
        slip: [],
        receipt: [],
        invoice: [],
        product_photo: [],
    });

    // จัดการเลือกไฟล์
    function handleFileSelect(event: Event, type: AttachmentType) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            files[type] = [...files[type], ...Array.from(input.files)];
        }
        // Reset input เพื่อให้เลือกไฟล์เดิมได้
        input.value = "";
    }

    // ลบไฟล์ออกจาก preview
    function removeFile(type: AttachmentType, index: number) {
        files[type] = files[type].filter((_, i) => i !== index);
    }

    // สร้าง preview URL
    function getPreviewUrl(file: File): string {
        return URL.createObjectURL(file);
    }
</script>

<svelte:head>
    <title>เพิ่มรายจ่าย | Liqflow Expense</title>
</svelte:head>

<div class="p-4 lg:p-8 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
        <a
            href="/expenses"
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
            <ArrowLeft class="w-5 h-5" />
        </a>
        <div>
            <h1 class="text-2xl font-bold text-gray-900">เพิ่มรายจ่าย</h1>
            <p class="text-sm text-gray-500 mt-0.5">กรอกข้อมูลรายจ่ายใหม่</p>
        </div>
    </div>

    <!-- Error Message -->
    {#if form?.error}
        <div
            class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
        >
            {form.error}
        </div>
    {/if}

    <!-- Form -->
    <form
        method="POST"
        enctype="multipart/form-data"
        class="space-y-6"
        use:enhance={({ formData, cancel }) => {
            // ตรวจสอบไฟล์ที่ยังไม่ได้อัปโหลด
            const missingTypes = ATTACHMENT_TYPES.filter(
                (type) => files[type.value].length === 0,
            ).map((type) => type.label);

            if (missingTypes.length > 0) {
                const message = `คุณยังไม่ได้อัปโหลดรูปภาพดังต่อไปนี้:\n- ${missingTypes.join("\n- ")}\n\nต้องการบันทึกข้อมูลหรือไม่?`;
                if (!confirm(message)) {
                    cancel();
                    return;
                }
            }

            isSubmitting = true;

            // เพิ่มไฟล์จาก state เข้าไปใน formData
            for (const [type, fileList] of Object.entries(files)) {
                for (const file of fileList) {
                    formData.append(`files_${type}`, file);
                }
            }

            return async ({ update }) => {
                isSubmitting = false;
                await update();
            };
        }}
    >
        <!-- ข้อมูลหลัก -->
        <div class="card p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
                ข้อมูลรายจ่าย
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- วันที่ -->
                <div>
                    <label for="date" class="label">
                        วันที่ <span class="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        id="date"
                        name="date"
                        value={form?.values?.date ?? toInputDate()}
                        class="input {form?.errors?.date
                            ? 'border-red-500'
                            : ''}"
                        required
                    />
                    {#if form?.errors?.date}
                        <p class="text-red-500 text-xs mt-1">
                            {form.errors.date}
                        </p>
                    {/if}
                </div>

                <!-- จำนวนเงิน -->
                <div>
                    <label for="amount" class="label">
                        จำนวนเงิน (บาท) <span class="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="amount"
                        name="amount"
                        value={form?.values?.amount ?? ""}
                        placeholder="0.00"
                        class="input text-right text-currency {form?.errors
                            ?.amount
                            ? 'border-red-500'
                            : ''}"
                        required
                    />
                    {#if form?.errors?.amount}
                        <p class="text-red-500 text-xs mt-1">
                            {form.errors.amount}
                        </p>
                    {/if}
                </div>

                <!-- หมวดหมู่ -->
                <div>
                    <label for="category_id" class="label">
                        หมวดหมู่ <span class="text-red-500">*</span>
                    </label>
                    <select
                        id="category_id"
                        name="category_id"
                        class="select {form?.errors?.category_id
                            ? 'border-red-500'
                            : ''}"
                        required={!showCustomCategory}
                        onchange={(e) => {
                            const target = e.target as HTMLSelectElement;
                            showCustomCategory = target.value === "__other__";
                            if (showCustomCategory) {
                                target.value = "";
                            }
                        }}
                    >
                        <option value="">-- เลือกหมวดหมู่ --</option>
                        {#each categories as cat}
                            <option
                                value={cat.id}
                                selected={form?.values?.category_id === cat.id}
                            >
                                {cat.icon}
                                {cat.name}
                            </option>
                        {/each}
                        <option value="__other__">📝 อื่นๆ (กรอกเอง)</option>
                    </select>

                    <!-- Custom Category Input -->
                    {#if showCustomCategory}
                        <div class="mt-2 flex gap-2">
                            <input
                                type="text"
                                name="custom_category"
                                bind:value={customCategoryName}
                                placeholder="พิมพ์ชื่อหมวดหมู่..."
                                class="input flex-1"
                                required
                            />
                            <button
                                type="button"
                                class="btn-secondary px-3"
                                onclick={() => {
                                    showCustomCategory = false;
                                    customCategoryName = "";
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    {/if}

                    {#if form?.errors?.category_id}
                        <p class="text-red-500 text-xs mt-1">
                            {form.errors.category_id}
                        </p>
                    {/if}
                </div>
                <!-- วิธีชำระเงิน -->
                <div>
                    <label for="payment_method_id" class="label">
                        วิธีชำระเงิน <span class="text-red-500">*</span>
                    </label>
                    <select
                        id="payment_method_id"
                        name="payment_method_id"
                        class="select {form?.errors?.payment_method_id
                            ? 'border-red-500'
                            : ''}"
                        required={!showCustomPaymentMethod}
                        onchange={(e) => {
                            const target = e.target as HTMLSelectElement;
                            showCustomPaymentMethod =
                                target.value === "__other__";
                            if (showCustomPaymentMethod) {
                                target.value = "";
                            }
                        }}
                    >
                        <option value="">-- เลือกวิธีชำระเงิน --</option>
                        {#each paymentMethods as pm}
                            <option
                                value={pm.id}
                                selected={form?.values?.payment_method_id ===
                                    pm.id}
                            >
                                {pm.icon}
                                {pm.name}
                            </option>
                        {/each}
                        <option value="__other__">📝 อื่นๆ (กรอกเอง)</option>
                    </select>

                    <!-- Custom Payment Method Input -->
                    {#if showCustomPaymentMethod}
                        <div class="mt-2 flex gap-2">
                            <input
                                type="text"
                                name="custom_payment_method"
                                bind:value={customPaymentMethodName}
                                placeholder="พิมพ์วิธีชำระเงิน..."
                                class="input flex-1"
                                required
                            />
                            <button
                                type="button"
                                class="btn-secondary px-3"
                                onclick={() => {
                                    showCustomPaymentMethod = false;
                                    customPaymentMethodName = "";
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    {/if}

                    {#if form?.errors?.payment_method_id}
                        <p class="text-red-500 text-xs mt-1">
                            {form.errors.payment_method_id}
                        </p>
                    {/if}
                </div>

                <!-- ร้านค้า/Vendor -->
                <div class="md:col-span-2">
                    <label for="vendor" class="label">ร้านค้า/Vendor</label>
                    <input
                        type="text"
                        id="vendor"
                        name="vendor"
                        value={form?.values?.vendor ?? ""}
                        placeholder="ชื่อร้านค้าหรือผู้รับเงิน"
                        class="input"
                    />
                </div>

                <!-- รายละเอียด -->
                <div class="md:col-span-2">
                    <label for="description" class="label">
                        รายละเอียด <span class="text-red-500">*</span>
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows="3"
                        placeholder="อธิบายรายจ่าย..."
                        class="input resize-none {form?.errors?.description
                            ? 'border-red-500'
                            : ''}"
                        required>{form?.values?.description ?? ""}</textarea
                    >
                    {#if form?.errors?.description}
                        <p class="text-red-500 text-xs mt-1">
                            {form.errors.description}
                        </p>
                    {/if}
                </div>

                <!-- หมายเหตุภายใน -->
                <div class="md:col-span-2">
                    <label for="note_internal" class="label"
                        >หมายเหตุภายใน (ไม่แสดงใน report)</label
                    >
                    <textarea
                        id="note_internal"
                        name="note_internal"
                        rows="2"
                        placeholder="หมายเหตุเพิ่มเติม..."
                        class="input resize-none"
                        >{form?.values?.note_internal ?? ""}</textarea
                    >
                </div>
            </div>
        </div>

        <!-- ผู้ทำรายการ & แผนก -->
        <div class="card p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
                ผู้รับผิดชอบ
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- ชื่อผู้ทำรายการ -->
                <div>
                    <label for="created_by_name" class="label">
                        ชื่อผู้ทำรายการ <span class="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="created_by_name"
                        name="created_by_name"
                        value={form?.values?.created_by_name ?? ""}
                        placeholder="ชื่อ-นามสกุล"
                        class="input {form?.errors?.created_by_name
                            ? 'border-red-500'
                            : ''}"
                        required
                    />
                    {#if form?.errors?.created_by_name}
                        <p class="text-red-500 text-xs mt-1">
                            {form.errors.created_by_name}
                        </p>
                    {/if}
                </div>

                <!-- แผนก -->
                <div>
                    <label for="department_id" class="label">
                        แผนก <span class="text-red-500">*</span>
                    </label>
                    <select
                        id="department_id"
                        name="department_id"
                        class="select {form?.errors?.department_id
                            ? 'border-red-500'
                            : ''}"
                        required
                    >
                        <option value="">-- เลือกแผนก --</option>
                        {#each departments as dept}
                            <option
                                value={dept.id}
                                selected={form?.values?.department_id ===
                                    dept.id}
                            >
                                {dept.name}
                            </option>
                        {/each}
                    </select>
                    {#if form?.errors?.department_id}
                        <p class="text-red-500 text-xs mt-1">
                            {form.errors.department_id}
                        </p>
                    {/if}
                </div>
            </div>
        </div>

        <!-- ไฟล์แนบ -->
        <div class="card p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">ไฟล์แนบ</h2>
            <p class="text-sm text-gray-500 mb-4">
                รองรับไฟล์รูปภาพ (JPG, PNG, WebP) และ PDF ขนาดไม่เกิน 10MB
            </p>

            <div class="space-y-6">
                {#each ATTACHMENT_TYPES as attachType}
                    <div>
                        <label class="label">{attachType.label}</label>

                        <!-- File Input -->
                        <div class="flex items-center gap-2 mb-2">
                            <label class="btn-secondary cursor-pointer">
                                <Upload class="w-4 h-4" />
                                <span>เลือกไฟล์</span>
                                <input
                                    type="file"
                                    name="files_{attachType.value}"
                                    accept="image/*,application/pdf"
                                    multiple
                                    class="hidden"
                                    onchange={(e) =>
                                        handleFileSelect(e, attachType.value)}
                                />
                            </label>
                            <span class="text-sm text-gray-500">
                                {files[attachType.value].length} ไฟล์
                            </span>
                        </div>

                        <!-- Preview -->
                        {#if files[attachType.value].length > 0}
                            <div class="flex flex-wrap gap-2">
                                {#each files[attachType.value] as file, i}
                                    <div class="relative group">
                                        {#if file.type.startsWith("image/")}
                                            <img
                                                src={getPreviewUrl(file)}
                                                alt={file.name}
                                                class="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                            />
                                        {:else}
                                            <div
                                                class="w-20 h-24 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center p-1"
                                            >
                                                <FileText
                                                    class="w-6 h-6 text-red-500"
                                                />
                                                <span
                                                    class="text-[8px] text-gray-600 mt-1 text-center leading-tight line-clamp-2 break-all"
                                                >
                                                    {file.name}
                                                </span>
                                            </div>
                                        {/if}
                                        <button
                                            type="button"
                                            class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            onclick={() =>
                                                removeFile(attachType.value, i)}
                                        >
                                            <X class="w-3 h-3" />
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>

        <!-- Submit Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 justify-end">
            <a href="/expenses" class="btn-secondary order-2 sm:order-1">
                ยกเลิก
            </a>
            <button
                type="submit"
                name="status"
                value="draft"
                class="btn-secondary order-3 sm:order-2"
                disabled={isSubmitting}
            >
                <Save class="w-5 h-5" />
                บันทึกแบบร่าง
            </button>
            <button
                type="submit"
                name="status"
                value="approved"
                class="btn-primary order-1 sm:order-3"
                disabled={isSubmitting}
            >
                {#if isSubmitting}
                    <span
                        class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                    ></span>
                {:else}
                    <Save class="w-5 h-5" />
                {/if}
                บันทึกและอนุมัติ
            </button>
        </div>
    </form>
</div>
