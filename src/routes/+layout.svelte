<script lang="ts">
  import "../app.css";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import {
    LayoutDashboard,
    Receipt,
    PlusCircle,
    PiggyBank,
    Menu,
    X,
    Bell,
    Repeat,
  } from "lucide-svelte";

  let { data, children } = $props();

  // State
  let isMobile = $state(false);
  let showNotifications = $state(false);
  // สถานะเปิด/ปิด sidebar บน mobile
  let sidebarOpen = $state(false);

  // Derived state: มี notification ที่ยังไม่อ่านหรือไม่
  // ใช้ local state เพื่อให้ update ทันทีโดยไม่ต้องรอ server fetch ใหม่
  let hasUnread = $state(false);

  $effect(() => {
    // Sync initial state from data
    if (data.notifications && data.notifications.length > 0) {
      // ในที่นี้เรา assume ว่า data.notifications ที่ load มาคือที่ unread (ตาม query server)
      // หรือถ้าอยากแม่นยำกว่านี้ต้องดู field is_read
      hasUnread = true;
    }
  });

  async function handleBellClick() {
    showNotifications = !showNotifications;

    if (showNotifications && hasUnread) {
      // ถ้าเปิด dropdown และมี unread -> mark as read
      hasUnread = false; // Optimistic update: ลบจุดแดงทันที

      const unreadIds = data.notifications?.map((n: any) => n.id) || [];
      if (unreadIds.length > 0) {
        try {
          await fetch("/api/notifications/mark-read", {
            method: "POST",
            body: JSON.stringify({ ids: unreadIds }),
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Failed to mark notifications as read", error);
        }
      }
    }
  }

  onMount(() => {
    const checkMobile = () => {
      isMobile = window.innerWidth < 1024;
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  });

  // ลิงก์ในเมนู (ปุ่มเพิ่มอยู่ตรงกลาง index=2)
  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/expenses", label: "รายจ่าย", icon: Receipt },
    { href: "/expenses/new", label: "เพิ่ม", icon: PlusCircle },
    { href: "/recurring", label: "ประจำ", icon: Repeat },
    { href: "/budgets", label: "งบประมาณ", icon: PiggyBank },
  ];

  // ตรวจสอบว่า link active หรือไม่
  function isActive(href: string, currentPath: string): boolean {
    if (href === "/") return currentPath === "/";
    return currentPath.startsWith(href);
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Mobile Sidebar Backdrop -->
  {#if sidebarOpen}
    <button
      class="fixed inset-0 bg-black/50 z-40 lg:hidden cursor-default"
      onclick={() => (sidebarOpen = false)}
      aria-label="Close sidebar"
    ></button>
  {/if}

  <!-- Sidebar (Desktop Only) -->
  <aside
    class="fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 {sidebarOpen
      ? 'translate-x-0'
      : '-translate-x-full'}"
  >
    <!-- Logo -->
    <div class="flex items-center gap-3 px-4 py-5 border-b border-gray-200">
      <img
        src="/logo.png"
        alt="Liqflow Logo"
        class="w-10 h-10 rounded-xl object-cover"
      />
      <div>
        <h1 class="text-lg font-bold text-gray-900">Liqflow</h1>
        <p class="text-xs text-gray-500">Expense Tracker</p>
      </div>
      <!-- ปุ่มปิด sidebar บน mobile -->
      <button
        class="ml-auto lg:hidden p-1 text-gray-400 hover:text-gray-600"
        onclick={() => (sidebarOpen = false)}
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="p-4 space-y-1">
      {#each navLinks as link}
        {@const active = isActive(link.href, $page.url.pathname)}
        <a
          href={link.href}
          class="sidebar-link {active ? 'sidebar-link-active' : ''}"
          onclick={() => (sidebarOpen = false)}
        >
          <link.icon class="w-5 h-5" />
          <span>{link.label}</span>
        </a>
      {/each}
    </nav>

    <!-- Footer -->
    <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
      <p class="text-xs text-gray-400 text-center">© 2024 Liqflow v1.0</p>
    </div>
  </aside>

  <!-- Main Content -->
  <div
    class="lg:pl-64 pb-[calc(4rem_+_env(safe-area-inset-bottom,_20px))] lg:pb-0"
  >
    {#snippet notificationArea()}
      <div class="relative">
        <button
          class="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-full relative"
          onclick={handleBellClick}
        >
          <Bell class="w-6 h-6" />
          {#if hasUnread}
            <span
              class="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"
            ></span>
          {/if}
        </button>

        <!-- Dropdown -->
        {#if showNotifications}
          <div
            class="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
            transition:fly={{ y: -10, duration: 200 }}
          >
            <div
              class="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center"
            >
              <h3 class="font-semibold text-gray-900">การแจ้งเตือน</h3>
              <span class="text-xs text-gray-500"
                >{data.notifications?.length ?? 0} ใหม่</span
              >
            </div>
            <div class="max-h-[60vh] overflow-y-auto">
              {#if data.notifications?.length > 0}
                {#each data.notifications as notif}
                  <a
                    href={notif.link}
                    class="block p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    onclick={() => (showNotifications = false)}
                  >
                    <div class="flex gap-3">
                      {#if notif.type === "success"}
                        <div
                          class="w-2 h-2 mt-2 rounded-full bg-green-500 shrink-0"
                        ></div>
                      {:else if notif.type === "error"}
                        <div
                          class="w-2 h-2 mt-2 rounded-full bg-red-500 shrink-0"
                        ></div>
                      {:else}
                        <div
                          class="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0"
                        ></div>
                      {/if}
                      <div>
                        <p class="text-sm font-medium text-gray-900">
                          {notif.title}
                        </p>
                        <p class="text-xs text-gray-500 mt-0.5">
                          {notif.message}
                        </p>
                        <p class="text-[10px] text-gray-400 mt-2">
                          {new Date(notif.created_at).toLocaleString("th-TH")}
                        </p>
                      </div>
                    </div>
                  </a>
                {/each}
              {:else}
                <div class="p-8 text-center text-gray-400">
                  <Bell class="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p class="text-sm">ไม่มีการแจ้งเตือนใหม่</p>
                </div>
              {/if}
            </div>
          </div>

          <!-- Backdrop to close -->
          <div
            class="fixed inset-0 z-40"
            onclick={() => (showNotifications = false)}
          ></div>
        {/if}
      </div>
    {/snippet}

    <!-- Mobile Layout -->
    {#if isMobile}
      <div class="h-screen w-screen bg-gray-50 flex flex-col">
        <!-- Header -->
        <header
          class="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between shrink-0 safe-top"
        >
          <div class="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Liqflow Logo"
              class="w-8 h-8 rounded-lg object-cover"
            />
            <h1 class="font-bold text-gray-900 text-lg">Liqflow Expense</h1>
          </div>

          <!-- Notifications -->
          {@render notificationArea()}
        </header>

        <!-- Content -->
        <main class="flex-1 overflow-y-auto pb-safe-bottom">
          {@render children()}
        </main>
      </div>
    {:else}
      <!-- Desktop Header -->
      <header
        class="hidden lg:flex h-16 bg-white border-b border-gray-200 px-8 items-center justify-between sticky top-0 z-30"
      >
        <h2 class="text-xl font-bold text-gray-800">
          {#if $page.url.pathname === "/"}
            Dashboard
          {:else if $page.url.pathname === "/expenses"}
            รายการเบิกจ่าย
          {:else if $page.url.pathname === "/budgets"}
            งบประมาณ
          {:else}
            Liqflow Expense
          {/if}
        </h2>
        <div class="flex items-center gap-4">
          <!-- User Profile Placeholder -->
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-700"
              >Manager Somchai</span
            >
            <div class="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Somchai"
                alt="Profile"
                class="w-full h-full object-cover"
              />
            </div>
          </div>
          <!-- Notifications -->
          {@render notificationArea()}
        </div>
      </header>

      <!-- Mobile Header (hidden on lg) -->
      <header
        class="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 lg:hidden safe-area-top"
      >
        <div class="flex items-center justify-center px-4 py-3">
          <div class="flex items-center gap-2">
            <img
              src="/logo.png?v=2"
              alt="Liqflow Logo"
              class="w-8 h-8 rounded-lg object-cover"
            />
            <span class="font-bold text-gray-900">Liqflow</span>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="min-h-screen">
        {@render children()}
      </main>
    {/if}
  </div>

  <!-- Mobile Bottom Navigation (iOS Style) -->
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 w-full pb-[env(safe-area-inset-bottom)]"
  >
    <div class="flex items-center justify-around h-16 relative">
      {#each navLinks as link, i}
        {@const active = isActive(link.href, $page.url.pathname)}
        <a
          href={link.href}
          class="flex flex-col items-center justify-center flex-1 h-full transition-colors {active
            ? 'text-primary-600'
            : 'text-gray-400'}"
        >
          {#if i === 2}
            <!-- Special style for Add button -->
            <div
              class="w-14 h-14 -mt-7 bg-primary-600 rounded-full flex items-center justify-center shadow-lg shadow-primary-600/30"
            >
              <link.icon class="w-7 h-7 text-white" />
            </div>
          {:else}
            <link.icon class="w-7 h-7" />
            <span class="text-xs mt-1 font-medium">{link.label}</span>
          {/if}
        </a>
      {/each}
    </div>
  </nav>
</div>

<style>
  /* Safe area insets for iOS */
  .safe-area-top {
    padding-top: env(safe-area-inset-top);
  }
</style>
