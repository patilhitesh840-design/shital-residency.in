// Login View Module with 3D Glassmorphism Cards
import { authService } from '../firebase.js';
import { Router } from '../router.js';
import { showToast } from '../app.js';

export function renderLogin(container) {
    container.innerHTML = `
        <div class="flex-grow flex flex-col items-center justify-center min-h-[90vh] px-4 py-12 relative">
            <!-- Floating Theme Switcher on Login Page -->
            <button id="login-theme-btn" class="absolute top-6 right-6 w-10 h-10 rounded-xl glass-panel hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center justify-center border border-glass-border-light dark:border-glass-border-dark z-20">
                <i data-lucide="sun" class="w-5 h-5 text-amber-400 dark:hidden"></i>
                <i data-lucide="moon" class="w-5 h-5 text-indigo-400 dark:block hidden"></i>
            </button>

            <!-- Brand Logo -->
            <div class="flex flex-col items-center gap-2 mb-8 relative z-10 animate-fade-in">
                <div class="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md overflow-hidden p-1 border border-slate-200 dark:border-slate-800">
                    <img src="logo.png" alt="GrandDome Logo" class="w-full h-full object-contain">
                </div>
                <h1 class="text-3xl font-display font-extrabold text-gradient tracking-tight">GrandDome</h1>
                <p class="text-xs uppercase tracking-widest text-slate-400 font-semibold -mt-1">Society Management Portal</p>
            </div>

            <!-- 3D Card Container -->
            <div class="w-full max-w-md perspective-1000 h-[560px] relative z-10">
                <div id="flip-card" class="relative w-full h-full duration-700 preserve-3d">
                    
                    <!-- ADMIN LOGIN FACE (FRONT) -->
                    <div class="absolute inset-0 w-full h-full backface-hidden glass-panel border border-glass-border-light dark:border-glass-border-dark rounded-3xl p-8 flex flex-col justify-between shadow-2xl">
                        <div>
                            <div class="flex items-center justify-between mb-6">
                                <h2 class="text-2xl font-display font-bold">Admin Portal</h2>
                                <span class="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 uppercase tracking-wider">
                                    Secure Staff
                                </span>
                            </div>
                            
                            <form id="admin-form" class="space-y-4">
                                <div class="space-y-1">
                                    <label class="text-xs font-semibold text-slate-400">Security Email</label>
                                    <div class="relative">
                                        <i data-lucide="mail" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                        <input type="email" id="admin-email" placeholder="admin@society.com" required 
                                            class="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-500">
                                    </div>
                                </div>

                                <div class="space-y-1">
                                    <label class="text-xs font-semibold text-slate-400">Access Key / Password</label>
                                    <div class="relative">
                                        <i data-lucide="lock" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                        <input type="password" id="admin-password" placeholder="••••••••" required 
                                            class="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-500">
                                    </div>
                                </div>

                                <div class="text-right -mt-1 mb-2">
                                    <button type="button" id="admin-forgot-btn" class="text-[11px] text-indigo-400 hover:underline focus:outline-none">Forgot Password?</button>
                                </div>

                                <button type="submit" id="admin-submit-btn" class="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 glow-btn">
                                    <span class="submit-text">Authorize Access</span>
                                    <i data-lucide="arrow-right" class="w-4 h-4"></i>
                                </button>
                            </form>
                        </div>

                        <div class="text-center mt-2">
                            <span class="text-xs text-slate-400">New staff?</span>
                            <button type="button" id="admin-signup-btn" class="text-xs text-indigo-400 font-bold hover:underline focus:outline-none ml-1">Create Staff Account</button>
                        </div>

                        <!-- Card Flip Link -->
                        <div class="text-center pt-4 border-t border-glass-border-light dark:border-glass-border-dark">
                            <p class="text-xs text-slate-400">
                                Are you a resident? 
                                <button id="to-resident-btn" class="text-indigo-400 font-bold hover:underline focus:outline-none ml-1">
                                    Resident Login <i data-lucide="chevron-right" class="inline w-3 h-3"></i>
                                </button>
                            </p>
                        </div>
                    </div>

                    <!-- RESIDENT LOGIN FACE (BACK) -->
                    <div class="absolute inset-0 w-full h-full backface-hidden rotate-y-180 glass-panel border border-glass-border-light dark:border-glass-border-dark rounded-3xl p-8 flex flex-col justify-between shadow-2xl">
                        <div>
                            <div class="flex items-center justify-between mb-6">
                                <h2 class="text-2xl font-display font-bold">Resident Portal</h2>
                                <span class="px-2.5 py-1 rounded-md text-[10px] font-bold bg-purple-500/10 border border-purple-500/30 text-purple-400 uppercase tracking-wider">
                                    Homeowner
                                </span>
                            </div>
                            
                            <form id="resident-form" class="space-y-4">
                                <div class="space-y-1">
                                    <label class="text-xs font-semibold text-slate-400">Flat No. or Email</label>
                                    <div class="relative">
                                        <i data-lucide="home" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                        <input type="text" id="resident-username" placeholder="201 or resident@society.com" required 
                                            class="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-500">
                                    </div>
                                </div>

                                <div class="space-y-1">
                                    <label class="text-xs font-semibold text-slate-400">Resident Password</label>
                                    <div class="relative">
                                        <i data-lucide="lock" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                        <input type="password" id="resident-password" placeholder="••••••••" required 
                                            class="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-500">
                                    </div>
                                </div>

                                <div class="text-right -mt-1 mb-2">
                                    <button type="button" id="resident-forgot-btn" class="text-[11px] text-purple-400 hover:underline focus:outline-none">Forgot Password?</button>
                                </div>

                                <button type="submit" id="resident-submit-btn" class="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold text-sm shadow-lg hover:shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 glow-btn">
                                    <span class="submit-text">Verify Identity</span>
                                    <i data-lucide="arrow-right" class="w-4 h-4"></i>
                                </button>
                            </form>
                        </div>

                        <div class="text-center mt-2">
                            <span class="text-xs text-slate-400">New Resident?</span>
                            <button type="button" id="resident-signup-btn" class="text-xs text-pink-400 font-bold hover:underline focus:outline-none ml-1">Create Account</button>
                        </div>

                        <!-- Card Flip Link -->
                        <div class="text-center pt-4 border-t border-glass-border-light dark:border-glass-border-dark">
                            <p class="text-xs text-slate-400">
                                Administration staff? 
                                <button id="to-admin-btn" class="text-purple-400 font-bold hover:underline focus:outline-none ml-1">
                                    <i data-lucide="chevron-left" class="inline w-3 h-3"></i> Admin Login
                                </button>
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `;

    // Render Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Bind event handlers
    const card = container.querySelector('#flip-card');
    const toResidentBtn = container.querySelector('#to-resident-btn');
    const toAdminBtn = container.querySelector('#to-admin-btn');
    const loginThemeBtn = container.querySelector('#login-theme-btn');

    // 3D Card Flips
    toResidentBtn.addEventListener('click', () => {
        card.classList.add('rotate-y-180');
    });

    toAdminBtn.addEventListener('click', () => {
        card.classList.remove('rotate-y-180');
    });

    // Registrations Modals triggers
    const residentSignupBtn = container.querySelector('#resident-signup-btn');
    const adminSignupBtn = container.querySelector('#admin-signup-btn');

    if (residentSignupBtn) {
        residentSignupBtn.addEventListener('click', () => {
            openSignupModal();
        });
    }

    if (adminSignupBtn) {
        adminSignupBtn.addEventListener('click', () => {
            openAdminSignupModal();
        });
    }

    const residentForgotBtn = container.querySelector('#resident-forgot-btn');
    const adminForgotBtn = container.querySelector('#admin-forgot-btn');

    if (residentForgotBtn) {
        residentForgotBtn.addEventListener('click', () => {
            openForgotPasswordModal('resident');
        });
    }

    if (adminForgotBtn) {
        adminForgotBtn.addEventListener('click', () => {
            openForgotPasswordModal('admin');
        });
    }

    // Theme toggle inside login
    loginThemeBtn.addEventListener('click', () => {
        window.toggleTheme();
        // Update login page theme icon dynamically
        const isDark = document.documentElement.classList.contains('dark');
        const darkIcon = loginThemeBtn.querySelector('.dark\\:block');
        const lightIcon = loginThemeBtn.querySelector('.dark\\:hidden');
        if (isDark) {
            darkIcon.style.display = 'block';
            lightIcon.style.display = 'none';
        } else {
            darkIcon.style.display = 'none';
            lightIcon.style.display = 'block';
        }
    });

    // Handle Admin login form submit
    const adminForm = container.querySelector('#admin-form');
    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = container.querySelector('#admin-email').value;
        const password = container.querySelector('#admin-password').value;
        const submitBtn = container.querySelector('#admin-submit-btn');
        const submitText = submitBtn.querySelector('.submit-text');

        setButtonLoading(submitBtn, submitText, true, 'Authorizing...');

        try {
            await authService.login(email, password);
            showToast('Authorization successful! Welcome Admin.', 'success');
            Router.navigate('#/admin');
        } catch (error) {
            showToast(error.message, 'error');
            setButtonLoading(submitBtn, submitText, false, 'Authorize Access');
        }
    });

    // Handle Resident login form submit
    const residentForm = container.querySelector('#resident-form');
    residentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = container.querySelector('#resident-username').value;
        const password = container.querySelector('#resident-password').value;
        const submitBtn = container.querySelector('#resident-submit-btn');
        const submitText = submitBtn.querySelector('.submit-text');

        setButtonLoading(submitBtn, submitText, true, 'Verifying...');

        try {
            await authService.login(username, password);
            showToast('Identity verified! Welcome Resident.', 'success');
            Router.navigate('#/resident');
        } catch (error) {
            showToast(error.message, 'error');
            setButtonLoading(submitBtn, submitText, false, 'Verify Identity');
        }
    });
}

// Button loading state helper
function setButtonLoading(button, textSpan, isLoading, loadingText = 'Processing...') {
    if (isLoading) {
        button.disabled = true;
        button.classList.add('opacity-80', 'cursor-not-allowed');
        textSpan.textContent = loadingText;
        const icon = button.querySelector('[data-lucide]');
        if (icon) icon.classList.add('animate-spin');
    } else {
        button.disabled = false;
        button.classList.remove('opacity-80', 'cursor-not-allowed');
        textSpan.textContent = loadingText;
        const icon = button.querySelector('[data-lucide]');
        if (icon) icon.classList.remove('animate-spin');
    }
}

function openSignupModal() {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div class="w-full max-w-md glass-panel rounded-2xl shadow-2xl p-6 relative z-50">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-md font-bold font-display text-gradient">Resident Registration</h3>
                    <button id="close-signup-btn" class="text-slate-400 hover:text-slate-200"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                
                <form id="signup-form" class="space-y-4 text-xs">
                    <div>
                        <label class="text-[10px] text-slate-400 font-bold uppercase">Plot No</label>
                        <input type="text" id="s-flat" required placeholder="e.g. 104" class="w-full px-3 py-2 rounded-xl glass-input mt-1 bg-transparent text-slate-800 dark:text-slate-100">
                    </div>
                    <div>
                        <label class="text-[10px] text-slate-400 font-bold uppercase">Resident Full Name</label>
                        <input type="text" id="s-name" required placeholder="e.g. Rahul Verma" class="w-full px-3 py-2 rounded-xl glass-input mt-1 bg-transparent text-slate-800 dark:text-slate-100">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[10px] text-slate-400 font-bold uppercase">Phone No</label>
                            <input type="text" id="s-phone" required placeholder="e.g. 9876543210" class="w-full px-3 py-2 rounded-xl glass-input mt-1 bg-transparent text-slate-800 dark:text-slate-100">
                        </div>
                        <div>
                            <label class="text-[10px] text-slate-400 font-bold uppercase">Email ID</label>
                            <input type="email" id="s-email" required placeholder="e.g. rahul@gmail.com" class="w-full px-3 py-2 rounded-xl glass-input mt-1 bg-transparent text-slate-800 dark:text-slate-100">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[10px] text-slate-400 font-bold uppercase">Occupancy Status</label>
                            <select id="s-status" class="w-full px-3 py-2 rounded-xl glass-input mt-1">
                                <option value="Owner">Owner</option>
                                <option value="Tenant">Tenant</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] text-slate-400 font-bold uppercase">Family Size</label>
                            <input type="number" id="s-count" min="1" value="3" class="w-full px-3 py-2 rounded-xl glass-input mt-1 bg-transparent text-slate-800 dark:text-slate-100">
                        </div>
                    </div>
                    <div>
                        <label class="text-[10px] text-slate-400 font-bold uppercase">Set Password</label>
                        <input type="password" id="s-password" required placeholder="••••••••" class="w-full px-3 py-2 rounded-xl glass-input mt-1 bg-transparent text-slate-800 dark:text-slate-100">
                    </div>
                    <button type="submit" id="signup-submit-btn" class="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold text-sm shadow-lg hover:shadow-purple-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 glow-btn">
                        <span class="submit-text">Register & Sign In</span>
                        <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                </form>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    modalContainer.querySelector('#close-signup-btn').addEventListener('click', () => {
        modalContainer.innerHTML = '';
    });

    const signupForm = modalContainer.querySelector('#signup-form');
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const flat = modalContainer.querySelector('#s-flat').value.trim();
        const name = modalContainer.querySelector('#s-name').value.trim();
        const phone = modalContainer.querySelector('#s-phone').value.trim();
        const email = modalContainer.querySelector('#s-email').value.trim();
        const status = modalContainer.querySelector('#s-status').value;
        const count = parseInt(modalContainer.querySelector('#s-count').value, 10);
        const password = modalContainer.querySelector('#s-password').value;

        const submitBtn = modalContainer.querySelector('#signup-submit-btn');
        const submitText = submitBtn.querySelector('.submit-text');

        setButtonLoading(submitBtn, submitText, true, 'Registering...');

        try {
            await authService.registerResident({
                building: "",
                flatNo: flat,
                name: name,
                phone: phone,
                email: email,
                status: status,
                membersCount: count,
                password: password
            });
            showToast('Registration successful! Welcome Resident.', 'success');
            modalContainer.innerHTML = '';
            Router.navigate('#/resident');
        } catch (error) {
            showToast(error.message, 'error');
            setButtonLoading(submitBtn, submitText, false, 'Register & Sign In');
        }
    });
}

function openAdminSignupModal() {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div class="w-full max-w-md glass-panel rounded-2xl shadow-2xl p-6 relative z-50">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-md font-bold font-display text-gradient">Staff Registration</h3>
                    <button id="close-admin-signup-btn" class="text-slate-400 hover:text-slate-200"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                
                <form id="admin-signup-form" class="space-y-4 text-xs">
                    <div>
                        <label class="text-[10px] text-slate-400 font-bold uppercase">Staff Full Name</label>
                        <input type="text" id="sa-name" required placeholder="e.g. Rajesh Kumar" class="w-full px-3 py-2 rounded-xl glass-input mt-1 bg-transparent text-slate-800 dark:text-slate-100">
                    </div>
                    <div>
                        <label class="text-[10px] text-slate-400 font-bold uppercase">Email Address</label>
                        <input type="email" id="sa-email" required placeholder="e.g. staff@society.com" class="w-full px-3 py-2 rounded-xl glass-input mt-1 bg-transparent text-slate-800 dark:text-slate-100">
                    </div>
                    <div>
                        <label class="text-[10px] text-slate-400 font-bold uppercase">Set Password</label>
                        <input type="password" id="sa-password" required placeholder="••••••••" class="w-full px-3 py-2 rounded-xl glass-input mt-1 bg-transparent text-slate-800 dark:text-slate-100">
                    </div>
                    <div>
                        <label class="text-[10px] text-slate-400 font-bold uppercase">Staff Security Code</label>
                        <input type="text" id="sa-code" required placeholder="Enter verification code" class="w-full px-3 py-2 rounded-xl glass-input mt-1 bg-transparent text-slate-800 dark:text-slate-100">
                        <p class="text-[9px] text-amber-500 mt-1">Hint: Use security code <code class="bg-amber-500/10 px-1 rounded font-bold">SOCIETY2026</code></p>
                    </div>
                    <button type="submit" id="admin-signup-submit-btn" class="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 glow-btn">
                        <span class="submit-text">Authorize Staff & Sign In</span>
                        <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                </form>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    modalContainer.querySelector('#close-admin-signup-btn').addEventListener('click', () => {
        modalContainer.innerHTML = '';
    });

    const adminSignupForm = modalContainer.querySelector('#admin-signup-form');
    adminSignupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = modalContainer.querySelector('#sa-code').value.trim();
        if (code !== 'SOCIETY2026') {
            showToast('Invalid Staff Security Code!', 'error');
            return;
        }

        const name = modalContainer.querySelector('#sa-name').value.trim();
        const email = modalContainer.querySelector('#sa-email').value.trim();
        const password = modalContainer.querySelector('#sa-password').value;

        const submitBtn = modalContainer.querySelector('#admin-signup-submit-btn');
        const submitText = submitBtn.querySelector('.submit-text');

        setButtonLoading(submitBtn, submitText, true, 'Authorizing...');

        try {
            await authService.registerAdmin({
                name,
                email,
                password
            });
            showToast('Staff profile registered successfully!', 'success');
            modalContainer.innerHTML = '';
            Router.navigate('#/admin');
        } catch (error) {
            showToast(error.message, 'error');
            setButtonLoading(submitBtn, submitText, false, 'Authorize Staff & Sign In');
        }
    });
}

function openForgotPasswordModal(role) {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div class="w-full max-w-md glass-panel rounded-2xl shadow-2xl p-6 relative z-50">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-md font-bold font-display text-gradient">Reset Password</h3>
                    <button id="close-fp-btn" class="text-slate-400 hover:text-slate-200"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                
                <div id="fp-email-step" class="space-y-4">
                    <p class="text-xs text-slate-400 leading-relaxed">Enter your registered email address to verify your identity and configure a new security password.</p>
                    <form id="fp-verify-form" class="space-y-4 text-xs">
                        <div>
                            <label class="text-[10px] text-slate-400 font-bold uppercase">Registered Email</label>
                            <input type="email" id="fp-email" required placeholder="e.g. resident@society.com" class="w-full px-3 py-2 rounded-xl glass-input mt-1 bg-transparent text-slate-800 dark:text-slate-100">
                        </div>
                        <button type="submit" class="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-${role === 'admin' ? 'indigo-500 to-purple-600' : 'purple-500 to-pink-600'} text-white font-bold text-sm shadow-lg hover:scale-[1.02] transition-all">
                            Verify Email
                        </button>
                    </form>
                </div>

                <div id="fp-reset-step" class="hidden space-y-4">
                    <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 text-[11px] leading-relaxed">
                        <strong class="font-bold">Sandbox Mode:</strong> Email verification verified. Please configure your new access password below.
                    </div>
                    <form id="fp-reset-form" class="space-y-4 text-xs">
                        <input type="hidden" id="fp-verified-email">
                        <div>
                            <label class="text-[10px] text-slate-400 font-bold uppercase">New Password</label>
                            <input type="password" id="fp-new-password" required placeholder="••••••••" class="w-full px-3 py-2 rounded-xl glass-input mt-1 bg-transparent text-slate-800 dark:text-slate-100">
                        </div>
                        <button type="submit" class="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-${role === 'admin' ? 'indigo-500 to-purple-600' : 'purple-500 to-pink-600'} text-white font-bold text-sm shadow-lg hover:scale-[1.02] transition-all">
                            Reset Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    modalContainer.querySelector('#close-fp-btn').addEventListener('click', () => {
        modalContainer.innerHTML = '';
    });

    const verifyForm = modalContainer.querySelector('#fp-verify-form');
    verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = modalContainer.querySelector('#fp-email').value.trim().toLowerCase();

        try {
            const storageKey = role === 'admin' ? 'granddome_admins' : 'granddome_members';
            const accounts = JSON.parse(localStorage.getItem(storageKey)) || [];
            const exists = accounts.some(a => a.email.toLowerCase() === email);

            if (!exists) {
                showToast('Email address not found in registers!', 'error');
                return;
            }

            modalContainer.querySelector('#fp-email-step').classList.add('hidden');
            modalContainer.querySelector('#fp-reset-step').classList.remove('hidden');
            modalContainer.querySelector('#fp-verified-email').value = email;
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    const resetForm = modalContainer.querySelector('#fp-reset-form');
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = modalContainer.querySelector('#fp-verified-email').value;
        const newPassword = modalContainer.querySelector('#fp-new-password').value;

        try {
            await authService.resetPassword(email, newPassword, role);
            showToast('Password updated successfully! Please log in.', 'success');
            modalContainer.innerHTML = '';
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}
