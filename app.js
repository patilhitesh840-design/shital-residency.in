// Main Application Bootstrapper and Global Utilities
import { Router } from './router.js';
import { authService, isDemoMode } from './firebase.js';
import { renderLogin } from './pages/login.js';
import { renderAdmin } from './pages/admin.js';
import { renderResident } from './pages/resident.js';

// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================
export function showToast(message, type = 'success', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 p-4 rounded-xl glass-panel shadow-lg border text-sm transition-all duration-500 translate-x-12 opacity-0 select-none pointer-events-auto`;
    
    // Icon and colors based on notification type
    let iconClass = 'text-green-500';
    let iconName = 'check-circle';
    let borderColor = 'border-green-500/30';
    let shadowGlow = 'shadow-green-500/10';

    if (type === 'error') {
        iconClass = 'text-red-500';
        iconName = 'alert-triangle';
        borderColor = 'border-red-500/30';
        shadowGlow = 'shadow-red-500/10';
    } else if (type === 'warning') {
        iconClass = 'text-yellow-500';
        iconName = 'alert-circle';
        borderColor = 'border-yellow-500/30';
        shadowGlow = 'shadow-yellow-500/10';
    } else if (type === 'info') {
        iconClass = 'text-indigo-500';
        iconName = 'info';
        borderColor = 'border-indigo-500/30';
        shadowGlow = 'shadow-indigo-500/10';
    }

    toast.classList.add(borderColor, shadowGlow);
    toast.innerHTML = `
        <i data-lucide="${iconName}" class="${iconClass} w-5 h-5 flex-shrink-0 animate-bounce"></i>
        <div class="flex-grow font-medium dark:text-slate-100 text-slate-800">${message}</div>
        <button class="text-slate-400 hover:text-slate-200 focus:outline-none ml-2">
            <i data-lucide="x" class="w-4 h-4"></i>
        </button>
    `;

    container.appendChild(toast);
    
    // Run Lucide render for icons inside toast
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Trigger slide-in
    setTimeout(() => {
        toast.classList.remove('translate-x-12', 'opacity-0');
    }, 10);

    const dismissToast = () => {
        toast.classList.add('translate-x-12', 'opacity-0');
        setTimeout(() => {
            toast.remove();
        }, 500);
    };

    // Click close handler
    toast.querySelector('button').addEventListener('click', dismissToast);

    // Auto close timer
    const autoCloseTimer = setTimeout(dismissToast, duration);
    toast.addEventListener('mouseenter', () => clearTimeout(autoCloseTimer));
}

// Attach globally for inline script usage if necessary
window.showToast = showToast;

// ==========================================
// THEME MANAGER
// ==========================================
export function initTheme() {
    const html = document.documentElement;
    const storedTheme = localStorage.getItem('granddome_theme');
    
    // Default to dark mode if not set
    if (storedTheme === 'light') {
        html.classList.remove('dark');
        html.classList.add('light');
    } else {
        html.classList.remove('light');
        html.classList.add('dark');
        localStorage.setItem('granddome_theme', 'dark');
    }
}

export function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        html.classList.add('light');
        localStorage.setItem('granddome_theme', 'light');
        showToast('Switched to Light Theme', 'info');
    } else {
        html.classList.remove('light');
        html.classList.add('dark');
        localStorage.setItem('granddome_theme', 'dark');
        showToast('Switched to Dark Theme', 'info');
    }
}

window.toggleTheme = toggleTheme;

// ==========================================
// GLOBAL LAYOUT SHELL
// ==========================================
export function renderHeader() {
    const user = authService.getCurrentUser();
    if (!user) return '';

    return `
        <header class="w-full glass-panel sticky top-0 z-40 border-b border-glass-border-light dark:border-glass-border-dark px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
                    <img src="logo.png" alt="GrandDome Logo" class="w-full h-full object-contain">
                </div>
                <div>
                    <h1 class="text-xl font-display font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">GrandDome</h1>
                    <p class="text-[10px] uppercase tracking-widest font-semibold text-indigo-400/80 -mt-1">Society Management</p>
                </div>
                ${isDemoMode ? `
                    <span class="ml-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-500 uppercase tracking-wider animate-pulse flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Demo Mode
                    </span>
                ` : ''}
            </div>
            
            <div class="flex items-center gap-4">
                <!-- Theme Switcher -->
                <button onclick="toggleTheme()" class="w-10 h-10 rounded-xl glass-panel hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center justify-center border border-glass-border-light dark:border-glass-border-dark" title="Toggle Theme">
                    <i data-lucide="sun" class="w-5 h-5 text-amber-400 dark:hidden"></i>
                    <i data-lucide="moon" class="w-5 h-5 text-indigo-400 dark:block hidden"></i>
                </button>
                
                <!-- User Profile Summary -->
                <div class="flex items-center gap-3 pl-4 border-l border-glass-border-light dark:border-glass-border-dark">
                    <div class="hidden sm:block text-right">
                        <h4 class="text-sm font-semibold">${user.name}</h4>
                        <p class="text-[11px] text-slate-400">${user.role === 'admin' ? 'Administrator' : `Flat ${user.building}-${user.flatNo}`}</p>
                    </div>
                    <div class="relative group">
                        <button id="profile-btn" class="w-10 h-10 rounded-full bg-indigo-500/10 border-2 border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 focus:outline-none">
                            ${user.name.charAt(0)}
                        </button>
                        
                        <!-- Dropdown Menu -->
                        <div id="profile-dropdown" class="hidden absolute right-0 mt-2 w-48 rounded-xl glass-panel border border-glass-border-light dark:border-glass-border-dark p-2 shadow-xl animate-fade-in z-50">
                            <button id="logout-btn" class="w-full text-left flex items-center gap-2 p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
                                <i data-lucide="log-out" class="w-4 h-4"></i>
                                <span class="text-xs font-semibold">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    `;
}

// Bind dropdown toggles
export function setupLayoutInteractions() {
    const profileBtn = document.getElementById('profile-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', () => {
            profileDropdown.classList.add('hidden');
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await authService.logout();
            showToast('Logged out successfully', 'success');
            Router.navigate('#/login');
        });
    }
}

// ==========================================
// INITIALIZE ROUTER & BOOTSTRAP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    
    // Register routing actions
    Router.init({
        '#/login': renderLogin,
        '#/admin': renderAdmin,
        '#/resident': renderResident
    });
});
