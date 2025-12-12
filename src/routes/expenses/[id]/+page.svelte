<script lang="ts">
    import {
        ArrowLeft,
        Edit,
        Trash2,
        Check,
        X as XIcon,
        Ban,
        CreditCard,
        Calendar,
        User,
        Building,
        Tag,
        FileText,
        Image as ImageIcon,
        ExternalLink,
        Clock,
    } from "lucide-svelte";
    import { enhance } from "$app/forms";
    import {
        getPublicUrl,
        getThumbnailUrl,
        getPreviewUrl,
        isImagePath,
    } from "$lib/supabase";
    import {
        formatCurrency,
        formatDateLong,
        getStatusColor,
        getStatusLabel,
        getAttachmentTypeLabel,
    } from "$lib/utils";
    import type { AttachmentType, ExpenseWithRelations } from "$lib/types";
    import type { PageData, ActionData } from "./$types";
    import { onMount } from "svelte";
    import { supabase } from "$lib/supabase";

    let { data, form }: { data: PageData; form: ActionData } = $props();
    const expense = data.expense as ExpenseWithRelations;

    // Current User Name for Audit Log
    let currentUserName = $state("");

    onMount(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            currentUserName = 
                session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                session.user.email?.split("@")[0] ||
                "User";
        }
    });

    // จัดกลุ่ม attachments ตาม type
    const attachmentsByType = $derived(() => {
        const grouped: Record<string, typeof expense.attachments> = {};
        for (const att of expense.attachments ?? []) {
            if (!grouped[att.attachment_type]) {
                grouped[att.attachment_type] = [];
            }
            grouped[att.attachment_type].push(att);
        }
        return grouped;
    });

    // Modal state
    let showDeleteModal = $state(false);
    let selectedImage = $state<string | null>(null);
    let isDeleting = $state(false);

    // ปุ่มเปลี่ยนสถานะตามสถานะปัจจุบัน
    const statusActions = $derived(() => {
        switch (expense.status) {
            case "draft":
                return [
                    {
                        value: "approved",
                        label: "อนุมัติ",
                        icon: Check,
                        color: "text-green-600",
                    },
                    {
                        value: "rejected",
                        label: "ปฏิเสธ",
                        icon: Ban,
                        color: "text-red-600",
                    },
                ];
            case "approved":
                return [
                    {
                        value: "paid",
                        label: "จ่ายเงินแล้ว",
                        icon: CreditCard,
                        color: "text-blue-600",
                    },
                    {
                        value: "rejected",
                        label: "ปฏิเสธ",
                        icon: Ban,
                        color: "text-red-600",
                    },
                ];
            case "rejected":
                return [
                    {
                        value: "draft",
                        label: "กลับเป็นแบบร่าง",
                        icon: FileText,
                        color: "text-gray-600",
                    },
                ];
            case "paid":
                return [];
            default:
                return [];
        }
    });
</script>

<svelte:head>
    <title>{expense.description} | Liqflow Expense</title>
</svelte:head>

<div class="p-4 lg:p-8 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4 mb-6">
        <div class="flex items-center gap-4">
            <a
                href="/expenses"
                class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <ArrowLeft class="w-5 h-5" />
            </a>
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <h1 class="text-xl font-bold text-gray-900">
                        {expense.description}
                    </h1>
                    <span class="badge {getStatusColor(expense.status)}"
                        >{getStatusLabel(expense.status)}</span
                    >
                </div>
                <p class="text-sm text-gray-500">
                    สร้างเมื่อ {formatDateLong(expense.created_at)}
                </p>
            </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
            <a href="/expenses/{expense.id}/edit" class="btn-secondary">
                <Edit class="w-4 h-4" />
                <span class="hidden sm:inline">แก้ไข</span>
            </a>
            <button class="btn-danger" onclick={() => (showDeleteModal = true)}>
                <Trash2 class="w-4 h-4" />
                <span class="hidden sm:inline">ลบ</span>
            </button>
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

    <!-- Status Actions -->
    {#if statusActions().length > 0}
        <div class="card p-4 mb-6">
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700"
                    >เปลี่ยนสถานะ:</span
                >
                <div class="flex items-center gap-2">
                    {#each statusActions() as action}
                        <form method="POST" action="?/updateStatus" use:enhance>
                            <input
                                type="hidden"
                                name="status"
                                value={action.value}
                            />
                            {#if currentUserName}
                                <input
                                    type="hidden"
                                    name="actor_name"
                                    value={currentUserName}
                                />
                            {/if}
                            <button
                                type="submit"
                                class="btn-secondary {action.color}"
                            >
                                <action.icon class="w-4 h-4" />
                                <span>{action.label}</span>
                            </button>
                        </form>
                    {/each}
                </div>
            </div>
        </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Info -->
        <div class="lg:col-span-2 space-y-6">
            <!-- ข้อมูลหลัก -->
            <div class="card">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h2 class="text-lg font-semibold text-gray-900">
                        ข้อมูลรายจ่าย
                    </h2>
                </div>
                <div class="p-6 space-y-4">
                    <!-- จำนวนเงิน -->
                    <div
                        class="flex items-center justify-between py-3 border-b border-gray-100"
                    >
                        <span class="text-gray-600">จำนวนเงิน</span>
                        <span
                            class="text-2xl font-bold text-gray-900 text-currency"
                        >
                            {formatCurrency(expense.amount)}
                        </span>
                    </div>

                    <!-- วันที่ -->
                    <div class="flex items-center gap-3 py-2">
                        <Calendar class="w-5 h-5 text-gray-400" />
                        <div>
                            <p class="text-sm text-gray-500">วันที่รายการ</p>
                            <p class="font-medium text-gray-900">
                                {formatDateLong(expense.date)}
                            </p>
                        </div>
                    </div>

                    <!-- หมวดหมู่ -->
                    <div class="flex items-center gap-3 py-2">
                        <Tag class="w-5 h-5 text-gray-400" />
                        <div>
                            <p class="text-sm text-gray-500">หมวดหมู่</p>
                            <p class="font-medium text-gray-900">
                                {expense.category?.icon}
                                {expense.category?.name}
                            </p>
                        </div>
                    </div>

                    <!-- วิธีชำระ -->
                    <div class="flex items-center gap-3 py-2">
                        <CreditCard class="w-5 h-5 text-gray-400" />
                        <div>
                            <p class="text-sm text-gray-500">วิธีชำระเงิน</p>
                            <p class="font-medium text-gray-900">
                                {expense.payment_method?.icon}
                                {expense.payment_method?.name}
                            </p>
                        </div>
                    </div>

                    <!-- Vendor -->
                    {#if expense.vendor}
                        <div class="flex items-center gap-3 py-2">
                            <Building class="w-5 h-5 text-gray-400" />
                            <div>
                                <p class="text-sm text-gray-500">
                                    ร้านค้า/Vendor
                                </p>
                                <p class="font-medium text-gray-900">
                                    {expense.vendor}
                                </p>
                            </div>
                        </div>
                    {/if}

                    <!-- หมายเหตุภายใน -->
                    {#if expense.note_internal}
                        <div class="pt-4 border-t border-gray-100">
                            <p class="text-sm text-gray-500 mb-1">
                                หมายเหตุภายใน
                            </p>
                            <p
                                class="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm"
                            >
                                {expense.note_internal}
                            </p>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- ไฟล์แนบ -->
            <div class="card">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h2 class="text-lg font-semibold text-gray-900">ไฟล์แนบ</h2>
                </div>
                <div class="p-6">
                    {#if expense.attachments && expense.attachments.length > 0}
                        <div class="space-y-6">
                            {#each Object.entries(attachmentsByType()) as [type, files]}
                                <div>
                                    <h3
                                        class="text-sm font-medium text-gray-700 mb-3"
                                    >
                                        {getAttachmentTypeLabel(
                                            type as AttachmentType,
                                        )} ({files.length})
                                    </h3>
                                    <div
                                        class="grid grid-cols-2 sm:grid-cols-3 gap-3"
                                    >
                                        {#each files as file}
                                            {@const thumbnailUrl = isImagePath(
                                                file.file_path,
                                            )
                                                ? getThumbnailUrl(
                                                      file.file_path,
                                                      200,
                                                  )
                                                : getPublicUrl(file.file_path)}
                                            {@const previewUrl = isImagePath(
                                                file.file_path,
                                            )
                                                ? getPreviewUrl(
                                                      file.file_path,
                                                      1200,
                                                  )
                                                : getPublicUrl(file.file_path)}
                                            <button
                                                class="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-primary-500 transition-all hover:shadow-lg active:scale-95"
                                                onclick={() =>
                                                    (selectedImage =
                                                        previewUrl)}
                                            >
                                                <img
                                                    src={thumbnailUrl}
                                                    alt={file.file_name}
                                                    class="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                                <div
                                                    class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                >
                                                    <ExternalLink
                                                        class="w-6 h-6 text-white"
                                                    />
                                                </div>
                                            </button>
                                        {/each}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="text-center py-8 text-gray-400">
                            <ImageIcon class="w-12 h-12 mx-auto mb-2" />
                            <p>ไม่มีไฟล์แนบ</p>
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
            <!-- ผู้รับผิดชอบ -->
            <div class="card p-6">
                <h3 class="text-sm font-medium text-gray-500 mb-4">
                    ผู้รับผิดชอบ
                </h3>

                <div class="flex items-center gap-3 mb-4">
                    <div
                        class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center"
                    >
                        <User class="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                        <p class="font-medium text-gray-900">
                            {expense.created_by_name}
                        </p>
                        <p class="text-sm text-gray-500">
                            {expense.department?.name}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Timeline -->
            <div class="card p-6">
                <h3
                    class="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2"
                >
                    <Clock class="w-4 h-4" />
                    ประวัติการทำรายการ
                </h3>

                {#if data.auditLogs && data.auditLogs.length > 0}
                    <div
                        class="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-[7px] before:w-[2px] before:bg-gray-100"
                    >
                        {#each data.auditLogs as log}
                            <div class="relative">
                                <!-- Dot -->
                                <div
                                    class="absolute -left-[21px] top-1 w-4 h-4 rounded-full border-2 border-white
                                    {log.action === 'create'
                                        ? 'bg-blue-500'
                                        : log.action === 'approve'
                                          ? 'bg-green-500'
                                          : log.action === 'reject'
                                            ? 'bg-red-500'
                                            : log.action === 'pay'
                                              ? 'bg-purple-500'
                                              : 'bg-gray-400'}"
                                ></div>

                                <div>
                                    <p
                                        class="text-sm font-medium text-gray-900"
                                    >
                                        {#if log.action === "create"}
                                            สร้างรายการใหม่
                                        {:else if log.action === "approve"}
                                            อนุมัติรายการ
                                        {:else if log.action === "reject"}
                                            ปฏิเสธรายการ
                                        {:else if log.action === "pay"}
                                            ดำเนินการจ่ายเงิน
                                        {:else if log.action === "update"}
                                            แก้ไขข้อมูล
                                        {:else}
                                            {log.action}
                                        {/if}
                                    </p>
                                    <p class="text-xs text-gray-500 mt-0.5">
                                        โดย <span
                                            class="font-medium text-gray-700"
                                            >{log.actor_name}</span
                                        >
                                        {#if log.actor_role}({log.actor_role}){/if}
                                    </p>
                                    <p class="text-xs text-gray-400 mt-1">
                                        {formatDateLong(log.created_at)}
                                    </p>
                                    {#if log.comment}
                                        <div
                                            class="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100"
                                        >
                                            "{log.comment}"
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="text-center py-4 text-gray-400 text-sm">
                        ไม่มีประวัติการทำรายการ
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
    <!-- Backdrop -->
    <div
        class="fixed inset-0 z-40"
        style="background-color: rgba(0, 0, 0, 0.6);"
    ></div>

    <!-- Modal -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background-color: transparent;"
    >
        <div class="card max-w-md w-full p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
                ยืนยันการลบ
            </h3>
            <p class="text-gray-600 mb-6">
                คุณต้องการลบรายการ "{expense.description}" หรือไม่?
                การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div class="flex justify-end gap-3">
                <button
                    class="btn-secondary"
                    onclick={() => (showDeleteModal = false)}
                >
                    ยกเลิก
                </button>
                <form
                    method="POST"
                    action="?/delete"
                    use:enhance={() => {
                        isDeleting = true;
                        return async ({ update }) => {
                            await update();
                            isDeleting = false;
                        };
                    }}
                >
                    <button
                        type="submit"
                        class="btn-danger"
                        disabled={isDeleting}
                    >
                        {#if isDeleting}
                            <span
                                class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                            ></span>
                        {/if}
                        ลบรายการ
                    </button>
                </form>
            </div>
        </div>
    </div>
{/if}

<!-- Image Lightbox -->
{#if selectedImage}
    <div
        class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        onclick={() => (selectedImage = null)}
        role="button"
        tabindex="-1"
    >
        <button
            class="absolute top-4 right-4 text-white hover:text-gray-300"
            onclick={() => (selectedImage = null)}
        >
            <XIcon class="w-8 h-8" />
        </button>
        <img
            src={selectedImage}
            alt="Preview"
            class="max-w-full max-h-full object-contain"
            onclick={(e) => e.stopPropagation()}
        />
    </div>
{/if}
