<script lang="ts">
    import { supabase } from "$lib/supabase";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    let isLoading = $state(false);
    let errorMessage = $state("");

    async function handleGoogleLogin() {
        try {
            isLoading = true;
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/`,
                    queryParams: {
                        access_type: "offline",
                        prompt: "consent",
                    },
                },
            });

            if (error) throw error;
        } catch (e: any) {
            errorMessage = e.message;
            isLoading = false;
        }
    }

    onMount(async () => {
        // Check for error in URL
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get("error");
        if (error === "invalid_domain") {
            errorMessage =
                "Access Restricted: Only @liqflow.com emails are allowed.";
        }

        // If already logged in, redirect to home
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (session) {
            goto("/");
        }
    });
</script>

<svelte:head>
    <title>เข้าสู่ระบบ | Liqflow Expense</title>
</svelte:head>

<div class="login-page">
    <!-- Background with animated gradient -->
    <div class="login-background">
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
        <div class="gradient-orb orb-3"></div>
    </div>

    <!-- Main content -->
    <div class="login-container">
        <!-- Left side - Branding -->
        <div class="login-branding">
            <div class="branding-content">
                <!-- Logo -->
                <div class="logo-container">
                    <img src="/logo.png" alt="Liqflow" class="company-logo" />
                    <div class="logo-glow"></div>
                </div>

                <!-- Tagline -->
                <h1 class="brand-title">Liqflow Expense</h1>
                <p class="brand-subtitle">ระบบเบิกจ่ายค่าใช้จ่ายออนไลน์</p>

                <!-- Features -->
                <div class="features-list">
                    <div class="feature-item">
                        <div class="feature-icon">📊</div>
                        <div class="feature-text">
                            <h3>ติดตามค่าใช้จ่าย</h3>
                            <p>รายงานและวิเคราะห์ค่าใช้จ่ายแบบเรียลไทม์</p>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">✅</div>
                        <div class="feature-text">
                            <h3>อนุมัติออนไลน์</h3>
                            <p>ระบบอนุมัติที่รวดเร็วและโปร่งใส</p>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">🔒</div>
                        <div class="feature-text">
                            <h3>ปลอดภัย</h3>
                            <p>รองรับเฉพาะบัญชี @liqflow.com</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right side - Login Form -->
        <div class="login-form-section">
            <div class="login-card">
                <div class="card-header">
                    <div class="mobile-logo">
                        <img src="/logo.png" alt="Liqflow" />
                    </div>
                    <h2>ยินดีต้อนรับ</h2>
                    <p>เข้าสู่ระบบเพื่อใช้งาน Liqflow Expense</p>
                </div>

                {#if errorMessage}
                    <div class="error-box">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span>{errorMessage}</span>
                    </div>
                {/if}

                <button
                    class="google-login-btn"
                    onclick={handleGoogleLogin}
                    disabled={isLoading}
                >
                    {#if isLoading}
                        <svg
                            class="spinner"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                class="spinner-track"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            ></circle>
                            <path
                                class="spinner-head"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        <span>กำลังเชื่อมต่อ...</span>
                    {:else}
                        <svg class="google-icon" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        <span>เข้าสู่ระบบด้วย Google</span>
                    {/if}
                </button>

                <div class="card-footer">
                    <p>
                        เข้าสู่ระบบได้เฉพาะบัญชี Google ขององค์กร @liqflow.com
                    </p>
                </div>
            </div>

            <div class="copyright">
                &copy; {new Date().getFullYear()} Liqflow. All rights reserved.
            </div>
        </div>
    </div>
</div>

<style>
    /* Base styles */
    .login-page {
        min-height: 100vh;
        min-height: 100dvh;
        position: relative;
        overflow: hidden;
        background: linear-gradient(
            135deg,
            #0a0f1a 0%,
            #0f172a 50%,
            #020617 100%
        );
    }

    /* Animated background */
    .login-background {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
    }

    .gradient-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.5;
        animation: float 20s ease-in-out infinite;
    }

    .orb-1 {
        width: 600px;
        height: 600px;
        background: radial-gradient(circle, #00aeff 0%, transparent 70%);
        top: -200px;
        left: -200px;
        animation-delay: 0s;
    }

    .orb-2 {
        width: 500px;
        height: 500px;
        background: radial-gradient(circle, #00dfd8 0%, transparent 70%);
        bottom: -150px;
        right: -150px;
        animation-delay: -7s;
    }

    .orb-3 {
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, #a855f7 0%, transparent 70%);
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation-delay: -14s;
        opacity: 0.3;
    }

    @keyframes float {
        0%,
        100% {
            transform: translate(0, 0) scale(1);
        }
        25% {
            transform: translate(30px, -30px) scale(1.05);
        }
        50% {
            transform: translate(-20px, 20px) scale(0.95);
        }
        75% {
            transform: translate(-30px, -10px) scale(1.02);
        }
    }

    /* Main container */
    .login-container {
        position: relative;
        z-index: 10;
        min-height: 100vh;
        min-height: 100dvh;
        display: grid;
        grid-template-columns: 1fr;
    }

    @media (min-width: 1024px) {
        .login-container {
            grid-template-columns: 1.2fr 1fr;
        }
    }

    /* Branding section */
    .login-branding {
        display: none;
        padding: 3rem;
        align-items: center;
        justify-content: center;
    }

    @media (min-width: 1024px) {
        .login-branding {
            display: flex;
        }
    }

    .branding-content {
        max-width: 500px;
    }

    .logo-container {
        position: relative;
        width: 120px;
        height: 120px;
        margin-bottom: 2rem;
    }

    .company-logo {
        width: 100%;
        height: 100%;
        object-fit: contain;
        position: relative;
        z-index: 2;
        filter: drop-shadow(0 0 20px rgba(0, 174, 255, 0.5));
    }

    .logo-glow {
        position: absolute;
        inset: -20px;
        background: radial-gradient(
            circle,
            rgba(0, 174, 255, 0.3) 0%,
            transparent 70%
        );
        z-index: 1;
        animation: pulse 3s ease-in-out infinite;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 0.5;
            transform: scale(1);
        }
        50% {
            opacity: 1;
            transform: scale(1.1);
        }
    }

    .brand-title {
        font-size: 2.5rem;
        font-weight: 700;
        color: white;
        margin-bottom: 0.5rem;
        background: linear-gradient(135deg, #ffffff 0%, #00aeff 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .brand-subtitle {
        font-size: 1.125rem;
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 3rem;
    }

    /* Features */
    .features-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .feature-item {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
    }

    .feature-item:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(0, 174, 255, 0.3);
        transform: translateX(5px);
    }

    .feature-icon {
        font-size: 1.5rem;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 174, 255, 0.2);
        border-radius: 10px;
        flex-shrink: 0;
    }

    .feature-text h3 {
        font-size: 1rem;
        font-weight: 600;
        color: white;
        margin-bottom: 0.25rem;
    }

    .feature-text p {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.6);
        margin: 0;
    }

    /* Login form section */
    .login-form-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        min-height: 100vh;
        min-height: 100dvh;
    }

    @media (min-width: 1024px) {
        .login-form-section {
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(20px);
            border-left: 1px solid rgba(255, 255, 255, 0.1);
        }
    }

    .login-card {
        width: 100%;
        max-width: 400px;
        padding: 2.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .card-header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .mobile-logo {
        display: flex;
        justify-content: center;
        margin-bottom: 1.5rem;
    }

    .mobile-logo img {
        width: 80px;
        height: 80px;
        object-fit: contain;
        filter: drop-shadow(0 0 15px rgba(0, 174, 255, 0.5));
    }

    @media (min-width: 1024px) {
        .mobile-logo {
            display: none;
        }
    }

    .card-header h2 {
        font-size: 1.75rem;
        font-weight: 700;
        color: white;
        margin-bottom: 0.5rem;
    }

    .card-header p {
        font-size: 0.9375rem;
        color: rgba(255, 255, 255, 0.6);
    }

    /* Error box */
    .error-box {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        margin-bottom: 1.5rem;
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 12px;
        color: #fca5a5;
        font-size: 0.875rem;
    }

    .error-box svg {
        flex-shrink: 0;
    }

    /* Google login button */
    .google-login-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        background: white;
        border: none;
        border-radius: 14px;
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .google-login-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .google-login-btn:active:not(:disabled) {
        transform: translateY(0);
    }

    .google-login-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .google-icon {
        width: 22px;
        height: 22px;
    }

    /* Spinner */
    .spinner {
        width: 24px;
        height: 24px;
        animation: spin 1s linear infinite;
    }

    .spinner-track {
        opacity: 0.25;
    }

    .spinner-head {
        opacity: 0.75;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    /* Card footer */
    .card-footer {
        margin-top: 2rem;
        text-align: center;
    }

    .card-footer p {
        font-size: 0.8125rem;
        color: rgba(255, 255, 255, 0.5);
        line-height: 1.5;
    }

    /* Copyright */
    .copyright {
        margin-top: 2rem;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.4);
    }

    /* PWA safe areas */
    @supports (padding: max(0px)) {
        .login-form-section {
            padding-top: max(2rem, env(safe-area-inset-top));
            padding-bottom: max(2rem, env(safe-area-inset-bottom));
        }
    }
</style>
