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

  // ลิงก์ในเมนู (ปุ่มเพิ่มอยู่ตรงกลาง index=2)
  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/expenses", label: "รายจ่าย", icon: Receipt },
    { href: "/expenses/new", label: "เพิ่ม", icon: PlusCircle },
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

  <!-- Mobile Bottom Navigation (iOS Style - Edge to Edge) -->
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
    style="padding-bottom: env(safe-area-inset-bottom, 0px); background: linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,1) calc(100% - env(safe-area-inset-bottom, 0px)), rgba(248,248,248,1) 100%);"
  >
    <div
      class="flex items-center justify-around h-16 bg-white/95 backdrop-blur-lg border-t border-gray-200/80"
    >
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
