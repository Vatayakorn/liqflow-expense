<script lang="ts">
  import "../app.css";
  import { page } from "$app/stores";
  import {
    LayoutDashboard,
    Receipt,
    PlusCircle,
    PiggyBank,
    Menu,
    X,
  } from "lucide-svelte";

  let { children } = $props();

  // สถานะเปิด/ปิด sidebar บน mobile
  let sidebarOpen = $state(false);

  // ลิงก์ในเมนู
  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/expenses", label: "รายจ่าย", icon: Receipt },
    { href: "/budgets", label: "งบประมาณ", icon: PiggyBank },
    { href: "/expenses/new", label: "เพิ่ม", icon: PlusCircle },
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
  <div class="lg:pl-64 pb-20 lg:pb-0">
    <!-- Mobile Header -->
    <header
      class="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 lg:hidden safe-area-top"
    >
      <div class="flex items-center justify-center px-4 py-3">
        <div class="flex items-center gap-2">
          <img
            src="/logo.png"
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
  </div>

  <!-- Mobile Bottom Navigation (iOS Style) -->
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-gray-200/50 lg:hidden safe-area-bottom"
  >
    <div class="flex items-center justify-around h-16">
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
              class="w-12 h-12 -mt-6 bg-primary-600 rounded-full flex items-center justify-center shadow-lg shadow-primary-600/30"
            >
              <link.icon class="w-6 h-6 text-white" />
            </div>
          {:else}
            <link.icon class="w-6 h-6" />
            <span class="text-[10px] mt-1 font-medium">{link.label}</span>
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

  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
</style>
