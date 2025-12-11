<script lang="ts">
    import {
        TrendingUp,
        TrendingDown,
        Receipt,
        DollarSign,
        ArrowRight,
        Calendar,
        Wallet,
        AlertTriangle,
    } from "lucide-svelte";
    import {
        formatCurrency,
        formatCurrencyCompact,
        formatDate,
        getMonthName,
        getStatusColor,
        getStatusLabel,
        calculatePercentageChange,
        formatPercentageChange,
    } from "$lib/utils";
    import { onMount } from "svelte";
    import Chart from "chart.js/auto";

    let { data } = $props();

    // คำนวณ % การเปลี่ยนแปลงรายเดือน
    const monthPercentChange = calculatePercentageChange(
        data.currentMonthTotal,
        data.previousMonthTotal,
    );
    const isMonthPositive = monthPercentChange >= 0;

    // คำนวณ % การเปลี่ยนแปลงรายปี
    const yearPercentChange = calculatePercentageChange(
        data.currentYearTotal,
        data.previousYearTotal,
    );
    const isYearPositive = yearPercentChange >= 0;

    // Charts
    let monthlyChartCanvas: HTMLCanvasElement;
    let categoryChartCanvas: HTMLCanvasElement;
    let monthlyChart: Chart | null = null;
    let categoryChart: Chart | null = null;

    // Color map สำหรับ category
    const colorMap: Record<string, string> = {
        blue: "#3b82f6",
        purple: "#8b5cf6",
        pink: "#ec4899",
        green: "#22c55e",
        orange: "#f97316",
        yellow: "#eab308",
        indigo: "#6366f1",
        gray: "#6b7280",
    };

    onMount(() => {
        // สร้าง Monthly Line Chart
        if (monthlyChartCanvas && data.monthlyExpenses.length > 0) {
            const ctx = monthlyChartCanvas.getContext("2d");

            // สร้าง Gradient
            let gradient: CanvasGradient | undefined;
            if (ctx) {
                gradient = ctx.createLinearGradient(0, 0, 0, 250);
                gradient.addColorStop(0, "rgba(59, 130, 246, 0.3)");
                gradient.addColorStop(1, "rgba(59, 130, 246, 0.02)");
            }

            monthlyChart = new Chart(monthlyChartCanvas, {
                type: "line",
                data: {
                    labels: data.monthlyExpenses.map((m) =>
                        getMonthName(m.month),
                    ),
                    datasets: [
                        {
                            label: "รายจ่าย (บาท)",
                            data: data.monthlyExpenses.map((m) => m.total),
                            borderColor: "#3b82f6",
                            backgroundColor: gradient,
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: "#3b82f6",
                            pointBorderColor: "#fff",
                            pointBorderWidth: 2,
                            pointHoverRadius: 6,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            padding: 12,
                            titleFont: { size: 14 },
                            bodyFont: { size: 13 },
                            callbacks: {
                                label: (ctx) =>
                                    formatCurrency(ctx.raw as number),
                            },
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: "rgba(0, 0, 0, 0.05)" },
                            ticks: {
                                callback: (value) =>
                                    formatCurrencyCompact(value as number),
                            },
                        },
                        x: {
                            grid: { display: false },
                        },
                    },
                },
            });
        }

        // สร้าง Category Doughnut Chart
        if (categoryChartCanvas && data.categoryBreakdown.length > 0) {
            categoryChart = new Chart(categoryChartCanvas, {
                type: "doughnut",
                data: {
                    labels: data.categoryBreakdown.map((c) => c.category_name),
                    datasets: [
                        {
                            data: data.categoryBreakdown.map((c) => c.total),
                            backgroundColor: data.categoryBreakdown.map(
                                (c) => colorMap[c.category_color] || "#6b7280",
                            ),
                            borderWidth: 0,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "right",
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                            },
                        },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => {
                                    const value = ctx.raw as number;
                                    const total = (
                                        ctx.dataset.data as number[]
                                    ).reduce((a, b) => a + b, 0);
                                    const percent = (
                                        (value / total) *
                                        100
                                    ).toFixed(1);
                                    return `${formatCurrency(value)} (${percent}%)`;
                                },
                            },
                        },
                    },
                },
            });
        }

        return () => {
            monthlyChart?.destroy();
            categoryChart?.destroy();
        };
    });
</script>

<svelte:head>
    <title>Dashboard | Liqflow Expense</title>
</svelte:head>

<div class="p-4 lg:p-8">
    <!-- Header -->
    <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-sm text-gray-500 mt-1">ภาพรวมรายจ่ายบริษัท</p>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <!-- ยอดรวมเดือนนี้ -->
        <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
                <div
                    class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center"
                >
                    <DollarSign class="w-6 h-6 text-primary-600" />
                </div>
                <div
                    class="flex items-center gap-1 text-sm {isMonthPositive
                        ? 'text-red-600'
                        : 'text-green-600'}"
                >
                    {#if isMonthPositive}
                        <TrendingUp class="w-4 h-4" />
                    {:else}
                        <TrendingDown class="w-4 h-4" />
                    {/if}
                    <span>{formatPercentageChange(monthPercentChange)}</span>
                </div>
            </div>
            <p class="text-sm font-medium text-gray-500 mb-1">ยอดรวมเดือนนี้</p>
            <p class="text-2xl font-bold text-gray-900 text-currency">
                {formatCurrency(data.currentMonthTotal)}
            </p>
        </div>

        <!-- ยอดรวมปีนี้ -->
        <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
                <div
                    class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center"
                >
                    <Wallet class="w-6 h-6 text-purple-600" />
                </div>
                <div
                    class="flex items-center gap-1 text-sm {isYearPositive
                        ? 'text-red-600'
                        : 'text-green-600'}"
                >
                    {#if isYearPositive}
                        <TrendingUp class="w-4 h-4" />
                    {:else}
                        <TrendingDown class="w-4 h-4" />
                    {/if}
                    <span>{formatPercentageChange(yearPercentChange)}</span>
                </div>
            </div>
            <p class="text-sm font-medium text-gray-500 mb-1">
                ยอดรวมปี {data.currentYear}
            </p>
            <p class="text-2xl font-bold text-gray-900 text-currency">
                {formatCurrency(data.currentYearTotal)}
            </p>
        </div>

        <!-- จำนวนรายการ -->
        <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
                <div
                    class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"
                >
                    <Receipt class="w-6 h-6 text-green-600" />
                </div>
            </div>
            <p class="text-sm font-medium text-gray-500 mb-1">
                จำนวนรายการ (เดือนนี้)
            </p>
            <p class="text-2xl font-bold text-gray-900">
                {data.currentMonthCount} รายการ
            </p>
        </div>

        <!-- เฉลี่ยต่อรายการ -->
        <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
                <div
                    class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center"
                >
                    <Calendar class="w-6 h-6 text-orange-600" />
                </div>
            </div>
            <p class="text-sm font-medium text-gray-500 mb-1">
                เฉลี่ยต่อรายการ
            </p>
            <p class="text-2xl font-bold text-gray-900 text-currency">
                {formatCurrency(
                    data.currentMonthCount > 0
                        ? data.currentMonthTotal / data.currentMonthCount
                        : 0,
                )}
            </p>
        </div>
    </div>

    <!-- Budget Alerts -->
    {#if data.budgetAlerts && data.budgetAlerts.length > 0}
        <div class="card p-6 mb-8 border-l-4 border-amber-500">
            <div class="flex items-center gap-2 mb-4">
                <AlertTriangle class="w-5 h-5 text-amber-500" />
                <h2 class="text-lg font-semibold text-gray-900">
                    ⚠️ แจ้งเตือนงบประมาณ
                </h2>
            </div>
            <div class="space-y-3">
                {#each data.budgetAlerts as alert}
                    <a
                        href="/budgets"
                        class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div class="flex items-center gap-3">
                            <span class="text-xl">{alert.icon}</span>
                            <div>
                                <p class="font-medium text-gray-900">
                                    {alert.name}
                                </p>
                                <p class="text-xs text-gray-500">
                                    {alert.type === "category"
                                        ? "หมวดหมู่"
                                        : "แผนก"}
                                </p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p
                                class="text-sm font-semibold {alert.status ===
                                'danger'
                                    ? 'text-red-600'
                                    : 'text-amber-600'}"
                            >
                                {alert.percentage.toFixed(0)}%
                            </p>
                            <p class="text-xs text-gray-500">
                                {formatCurrencyCompact(alert.used)} / {formatCurrencyCompact(
                                    alert.amount,
                                )}
                            </p>
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Monthly Chart -->
        <div class="card p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
                รายจ่ายรายเดือน
            </h2>
            <div class="h-64">
                {#if data.monthlyExpenses.length > 0}
                    <canvas bind:this={monthlyChartCanvas}></canvas>
                {:else}
                    <div
                        class="h-full flex items-center justify-center text-gray-400"
                    >
                        ยังไม่มีข้อมูล
                    </div>
                {/if}
            </div>
        </div>

        <!-- Category Chart -->
        <div class="card p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
                แยกตามหมวดหมู่ (เดือนนี้)
            </h2>
            <div class="h-64">
                {#if data.categoryBreakdown.length > 0}
                    <canvas bind:this={categoryChartCanvas}></canvas>
                {:else}
                    <div
                        class="h-full flex items-center justify-center text-gray-400"
                    >
                        ยังไม่มีข้อมูล
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Top 5 หมวดหมู่ -->
    {#if data.top5Categories.length > 0}
        <div class="card p-6 mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
                🏆 Top 5 หมวดหมู่ที่ใช้จ่ายมากสุด (เดือนนี้)
            </h2>
            <div class="space-y-4">
                {#each data.top5Categories as cat, i}
                    {@const percentage =
                        data.totalCategorySum > 0
                            ? (cat.total / data.totalCategorySum) * 100
                            : 0}
                    <div class="flex items-center gap-4">
                        <!-- Rank -->
                        <div
                            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                            {i === 0
                                ? 'bg-yellow-100 text-yellow-700'
                                : i === 1
                                  ? 'bg-gray-100 text-gray-600'
                                  : i === 2
                                    ? 'bg-orange-100 text-orange-600'
                                    : 'bg-gray-50 text-gray-500'}"
                        >
                            {i + 1}
                        </div>

                        <!-- Icon & Name -->
                        <div class="flex items-center gap-2 w-32">
                            <span class="text-xl">{cat.category_icon}</span>
                            <span
                                class="text-sm font-medium text-gray-700 truncate"
                                >{cat.category_name}</span
                            >
                        </div>

                        <!-- Progress Bar -->
                        <div
                            class="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"
                        >
                            <div
                                class="h-full rounded-full transition-all duration-500"
                                style="width: {percentage}%; background-color: {colorMap[
                                    cat.category_color
                                ] || '#6b7280'};"
                            ></div>
                        </div>

                        <!-- Amount & Percentage -->
                        <div class="text-right min-w-[120px]">
                            <p
                                class="text-sm font-semibold text-gray-900 text-currency"
                            >
                                {formatCurrency(cat.total)}
                            </p>
                            <p class="text-xs text-gray-500">
                                {percentage.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Department Breakdown & Recent -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Department Table -->
        <div class="card">
            <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900">
                    แยกตามแผนก (เดือนนี้)
                </h2>
            </div>
            {#if data.departmentBreakdown.length > 0}
                <div class="divide-y divide-gray-100">
                    {#each data.departmentBreakdown as dept}
                        <div
                            class="flex items-center justify-between px-6 py-3"
                        >
                            <span class="text-sm font-medium text-gray-700"
                                >{dept.department_name}</span
                            >
                            <div class="text-right">
                                <p
                                    class="text-sm font-semibold text-gray-900 text-currency"
                                >
                                    {formatCurrency(dept.total)}
                                </p>
                                <p class="text-xs text-gray-500">
                                    {dept.count} รายการ
                                </p>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="px-6 py-8 text-center text-gray-400">
                    ยังไม่มีข้อมูล
                </div>
            {/if}
        </div>

        <!-- Recent Expenses -->
        <div class="card">
            <div
                class="px-6 py-4 border-b border-gray-200 flex items-center justify-between"
            >
                <h2 class="text-lg font-semibold text-gray-900">
                    รายการล่าสุด
                </h2>
                <a
                    href="/expenses"
                    class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                    ดูทั้งหมด
                    <ArrowRight class="w-4 h-4" />
                </a>
            </div>
            {#if data.recentExpenses.length > 0}
                <div class="divide-y divide-gray-100">
                    {#each data.recentExpenses as expense}
                        <a
                            href="/expenses/{expense.id}"
                            class="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <div class="flex items-center gap-3">
                                <span class="text-xl"
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
                                    )}">{getStatusLabel(expense.status)}</span
                                >
                            </div>
                        </a>
                    {/each}
                </div>
            {:else}
                <div class="px-6 py-8 text-center text-gray-400">
                    ยังไม่มีรายการ
                </div>
            {/if}
        </div>
    </div>
</div>
