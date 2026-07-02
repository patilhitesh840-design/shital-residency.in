// Resident Portal Page Module
import { dbService, authService } from '../firebase.js';
import { Router } from '../router.js';
import { renderHeader, setupLayoutInteractions, showToast } from '../app.js';
import { generateReceiptPDF } from '../utils/pdf.js';

let currentTab = 'bills';

export async function renderResident(container) {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'resident') {
        Router.navigate('#/login');
        return;
    }

    // Render page shell
    container.innerHTML = `
        ${renderHeader()}
        
        <div class="flex-grow flex flex-col md:flex-row min-h-[calc(100vh-73px)] relative z-10">
            <!-- Left Sidebar Navigation -->
            <aside class="w-full md:w-64 glass-panel border-r border-glass-border-light dark:border-glass-border-dark p-4 flex flex-col gap-2 justify-between">
                <nav class="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                    <button data-tab="bills" class="sidebar-tab flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-indigo-500/10 hover:text-indigo-400 w-full text-left">
                        <i data-lucide="receipt" class="w-4 h-4"></i>
                        <span>My Bills & Receipts</span>
                    </button>
                    <button data-tab="complaints" class="sidebar-tab flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-indigo-500/10 hover:text-indigo-400 w-full text-left">
                        <i data-lucide="message-square" class="w-4 h-4"></i>
                        <span>Raise Complaint</span>
                    </button>
                    <button data-tab="profile" class="sidebar-tab flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-indigo-500/10 hover:text-indigo-400 w-full text-left">
                        <i data-lucide="user-cog" class="w-4 h-4"></i>
                        <span>Update Profile</span>
                    </button>
                </nav>
                
                <!-- Helpful info banner for resident -->
                <div class="hidden md:block p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-slate-400">
                    <h5 class="font-bold text-slate-300 flex items-center gap-1">
                        <i data-lucide="phone-call" class="w-3.5 h-3.5 text-indigo-400"></i> Society Helpdesk
                    </h5>
                    <p class="mt-2 text-[10px] leading-relaxed">For emergency water/electricity complaints, contact the clubhouse manager at +91 99009 90099.</p>
                </div>
            </aside>

            <!-- Main Content Pane -->
            <section id="resident-content" class="flex-grow p-6 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full">
                <!-- Inner view will be injected here -->
            </section>
        </div>
    `;

    // Setup header dropdowns & logouts
    setupLayoutInteractions();

    // Bind tab switching
    const tabButtons = container.querySelectorAll('.sidebar-tab');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedTab = btn.getAttribute('data-tab');
            switchTab(selectedTab);
        });
    });

    // Load initial tab
    switchTab(currentTab);
}

// Switch between resident tabs
async function switchTab(tabId) {
    currentTab = tabId;
    
    // Highlight sidebar buttons
    document.querySelectorAll('.sidebar-tab').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('bg-indigo-500/15', 'text-indigo-400', 'shadow-sm', 'border-l-4', 'border-indigo-500');
        } else {
            btn.classList.remove('bg-indigo-500/15', 'text-indigo-400', 'shadow-sm', 'border-l-4', 'border-indigo-500');
        }
    });

    // Render corresponding view
    const viewContainer = document.getElementById('resident-content');
    if (!viewContainer) return;

    // Show inline spinner
    viewContainer.innerHTML = `
        <div class="flex items-center justify-center min-h-[40vh]">
            <div class="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
    `;

    const user = authService.getCurrentUser();

    try {
        if (tabId === 'bills') {
            await renderBillsTab(viewContainer, user);
        } else if (tabId === 'complaints') {
            await renderComplaintsTab(viewContainer, user);
        } else if (tabId === 'profile') {
            await renderProfileTab(viewContainer, user);
        }
        
        // Reinitialize icons in new loaded content
        if (window.lucide) {
            window.lucide.createIcons();
        }
    } catch (err) {
        showToast('Error loading page: ' + err.message, 'error');
    }
}

// ==========================================
// 1. BILLS AND RECEIPTS TAB RENDERER
// ==========================================
async function renderBillsTab(container, user) {
    const bills = await dbService.getBills(user.flatNo);

    // Calculate billing aggregates
    const pendingBills = bills.filter(b => b.status === 'Pending');
    const totalDues = pendingBills.reduce((sum, b) => sum + b.total, 0);
    const latestBill = bills[0] || null;

    container.innerHTML = `
        <div class="space-y-8 animate-fade-in">
            <div>
                <h2 class="text-3xl font-display font-bold tracking-tight">My Billing Hub</h2>
                <p class="text-sm text-slate-400">View electricity readings, monthly maintenance invoices, and generate receipts.</p>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <!-- Card 1 -->
                <div class="glass-panel border border-glass-border-light dark:border-glass-border-dark p-5 rounded-2xl premium-card flex items-center justify-between">
                    <div>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Dues</span>
                        <h3 class="text-2xl font-display font-extrabold mt-1 ${totalDues > 0 ? 'text-rose-400' : 'text-green-400'}">₹${totalDues}</h3>
                        <p class="text-[9px] text-slate-400 mt-1">${pendingBills.length} Unpaid Bill(s)</p>
                    </div>
                    <div class="w-10 h-10 rounded-xl ${totalDues > 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-green-500/10 text-green-400 border border-green-500/30'} flex items-center justify-center">
                        <i data-lucide="credit-card" class="w-5 h-5"></i>
                    </div>
                </div>

                <!-- Card 2 -->
                <div class="glass-panel border border-glass-border-light dark:border-glass-border-dark p-5 rounded-2xl premium-card flex items-center justify-between col-span-1 sm:col-span-2">
                    <div>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Latest Billing Cycle</span>
                        ${latestBill ? `
                            <h3 class="text-lg font-display font-bold mt-1 text-slate-100 flex items-center gap-2">
                                <span>${latestBill.month}</span>
                                <span class="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                    latestBill.status === 'Paid' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                                }">${latestBill.status}</span>
                            </h3>
                            <p class="text-[9px] text-slate-400 mt-1">Electricity: ₹${latestBill.electricity} | Maint: ₹${latestBill.maintenance} | Total: ₹${latestBill.total}</p>
                        ` : `
                            <h3 class="text-md font-display font-bold mt-1 text-slate-400">No invoices logged</h3>
                        `}
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <i data-lucide="calendar" class="w-5 h-5"></i>
                    </div>
                </div>
            </div>

            <!-- Bills Log Table -->
            <div class="space-y-4">
                <h3 class="text-md font-bold flex items-center gap-2">
                    <i data-lucide="history" class="w-5 h-5 text-indigo-400"></i> Account Invoices
                </h3>
                
                <div class="glass-panel border border-glass-border-light dark:border-glass-border-dark rounded-2xl overflow-hidden shadow-xl">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr class="bg-indigo-500/5 border-b border-glass-border-light dark:border-glass-border-dark text-slate-400 font-bold uppercase tracking-wider">
                                    <th class="px-6 py-4">Billing Month</th>
                                    <th class="px-6 py-4">Charges Details</th>
                                    <th class="px-6 py-4">Total Amount</th>
                                    <th class="px-6 py-4">Due Date / Status</th>
                                    <th class="px-6 py-4 text-right">Receipt & Pay</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-glass-border-light dark:divide-glass-border-dark">
                                ${bills.length === 0 ? `
                                    <tr>
                                        <td colspan="5" class="px-6 py-12 text-center text-slate-400 italic">No bill details logged for your flat yet.</td>
                                    </tr>
                                ` : bills.map(b => `
                                    <tr class="hover:bg-indigo-500/5 transition-colors">
                                        <td class="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">${b.month}</td>
                                        <td class="px-6 py-4">
                                            <div class="text-[10px] text-slate-400 space-x-2">
                                                <span>Elec: ₹${b.electricity}</span> • 
                                                <span>Garb: ₹${b.garbage}</span> • 
                                                <span>Maint: ₹${b.maintenance}</span>
                                                ${b.lateFee > 0 ? ` • <span class="text-amber-500 font-bold">Late Penalty: ₹${b.lateFee}</span>` : ''}
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 font-bold">₹${b.total}</td>
                                        <td class="px-6 py-4">
                                            <div class="flex flex-col">
                                                <span class="w-16 text-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${
                                                    b.status === 'Paid' 
                                                    ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                                                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                                                }">${b.status}</span>
                                                <span class="text-[9px] text-slate-500 mt-0.5">
                                                    ${b.status === 'Paid' ? `Paid via ${b.paymentMethod}` : `Due by ${b.dueDate}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 text-right space-x-2">
                                            ${b.status === 'Paid' 
                                                ? `<button data-pdf-id="${b.id}" class="pdf-receipt-btn px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all font-semibold flex items-center gap-1.5 ml-auto text-[10px]">
                                                    <i data-lucide="file-text" class="w-3.5 h-3.5"></i> Receipt PDF
                                                   </button>`
                                                : `<button data-pay-now-id="${b.id}" class="pay-now-btn px-3 py-1.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold flex items-center gap-1.5 ml-auto text-[10px] shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all glow-btn">
                                                    <i data-lucide="wallet" class="w-3.5 h-3.5"></i> Pay Now (UPI)
                                                   </button>`
                                            }
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Bind Receipt Download
    container.querySelectorAll('.pdf-receipt-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-pdf-id');
            const bill = bills.find(item => item.id === id);
            try {
                await generateReceiptPDF(bill, user);
                showToast('Receipt PDF generated!', 'success');
            } catch (e) {
                showToast('PDF generation failed: ' + e.message, 'error');
            }
        });
    });

    // Bind UPI Mock Payment
    container.querySelectorAll('.pay-now-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-pay-now-id');
            const bill = bills.find(item => item.id === id);
            
            const pin = prompt(`💳 UPI Sandbox Gateway\nPay: ₹${bill.total} to GRANDDOME SOCIETY INC.\nEnter your UPI PIN to confirm payment:`, '••••');
            if (pin !== null && pin !== '') {
                // Perform local updates
                await dbService.updateBill(bill.id, {
                    status: 'Paid',
                    paymentDate: new Date().toISOString().split('T')[0],
                    paymentMethod: 'UPI (Online)'
                });
                showToast('UPI Payment successful! Receipt logged.', 'success');
                switchTab('bills');
            }
        });
    });
}

// ==========================================
// 2. RAISE COMPLAINTS TAB RENDERER
// ==========================================
async function renderComplaintsTab(container, user) {
    const complaints = await dbService.getComplaints(user.flatNo);

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <!-- Left Side: Log new Ticket -->
            <div class="glass-panel border border-glass-border-light dark:border-glass-border-dark p-6 rounded-2xl h-fit">
                <h3 class="text-lg font-display font-bold mb-1 flex items-center gap-1.5 text-indigo-400">
                    <i data-lucide="info" class="w-5 h-5"></i> Raise Complaint
                </h3>
                <p class="text-xs text-slate-400 mb-4">Submit maintenance work orders or issues to administrative staff.</p>
                
                <form id="raise-complaint-form" class="space-y-4">
                    <div class="space-y-1">
                        <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Category</label>
                        <select id="comp-category" required class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                            <option value="Plumbing">Plumbing (Water leakage/taps)</option>
                            <option value="Electricity">Electricity (Corridors/power)</option>
                            <option value="Garbage">Garbage / Waste disposal</option>
                            <option value="Security">Security & Parking</option>
                            <option value="Other">Other Miscellaneous</option>
                        </select>
                    </div>

                    <div class="space-y-1">
                        <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Brief Title</label>
                        <input type="text" id="comp-title" placeholder="e.g. Broken corridor light bulb" required
                            class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                    </div>

                    <div class="space-y-1">
                        <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Detailed Description</label>
                        <textarea id="comp-desc" rows="4" required placeholder="Describe the issue with specific locations..."
                            class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100 resize-none"></textarea>
                    </div>

                    <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1 glow-btn">
                        <i data-lucide="plus-circle" class="w-4 h-4"></i> Submit Work Ticket
                    </button>
                </form>
            </div>

            <!-- Right Side: Existing Tickets Log -->
            <div class="lg:col-span-2 space-y-4">
                <h3 class="text-md font-bold flex items-center gap-2">
                    <i data-lucide="message-square" class="w-5 h-5 text-indigo-400"></i> My Filed Tickets
                </h3>
                
                <div class="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    ${complaints.length === 0 ? `
                        <div class="glass-panel border border-glass-border-light dark:border-glass-border-dark p-8 rounded-2xl text-center text-slate-400 italic text-xs">
                            No tickets raised. Your records are clean!
                        </div>
                    ` : complaints.map(c => `
                        <div class="glass-panel border border-glass-border-light dark:border-glass-border-dark p-5 rounded-2xl space-y-3 relative overflow-hidden">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-slate-500/10 border border-slate-500/20 text-slate-400">${c.category}</span>
                                    <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100">${c.title}</h4>
                                </div>
                                <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                    c.status === 'Resolved' 
                                    ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                                    : c.status === 'In Progress' 
                                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                                }">${c.status}</span>
                            </div>
                            
                            <p class="text-xs text-slate-400 leading-normal">${c.description}</p>
                            
                            <div class="flex justify-between items-center text-[10px] text-slate-500 border-t border-glass-border-light dark:border-glass-border-dark pt-3">
                                <span>Reported: ${c.date}</span>
                                ${c.reply ? `<span class="text-indigo-400 bg-indigo-500/5 px-2 py-1 rounded max-w-[70%] text-right font-medium"><span class="font-bold">Admin response:</span> ${c.reply}</span>` : '<span class="italic text-slate-500">Awaiting admin review...</span>'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    // Handle submit new complaint
    const form = container.querySelector('#raise-complaint-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            flatNo: user.flatNo,
            category: document.getElementById('comp-category').value,
            title: document.getElementById('comp-title').value.trim(),
            description: document.getElementById('comp-desc').value.trim()
        };

        try {
            await dbService.addComplaint(data);
            showToast('Work order ticket logged successfully!', 'success');
            switchTab('complaints');
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

// ==========================================
// 3. UPDATE PROFILE TAB RENDERER
// ==========================================
async function renderProfileTab(container, user) {
    container.innerHTML = `
        <div class="max-w-xl mx-auto glass-panel border border-glass-border-light dark:border-glass-border-dark p-8 rounded-2xl shadow-xl animate-scale-up">
            <div class="flex flex-col items-center gap-3 mb-6 pb-6 border-b border-glass-border-light dark:border-glass-border-dark">
                <div class="w-16 h-16 rounded-full bg-indigo-500/10 border-2 border-indigo-500/30 flex items-center justify-center font-bold text-2xl text-indigo-400">
                    ${user.name.charAt(0)}
                </div>
                <div class="text-center">
                    <h3 class="text-xl font-display font-bold">${user.name}</h3>
                    <p class="text-xs text-slate-400">Resident of ${user.building ? `Building ${user.building}, Flat` : 'Plot'} ${user.flatNo}</p>
                </div>
            </div>
            
            <form id="profile-settings-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Wing / Building</label>
                        <input type="text" disabled value="${user.building ? `Wing ${user.building}` : 'N/A'}" class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-500 bg-slate-900/10 cursor-not-allowed">
                    </div>
                    <div class="space-y-1">
                        <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Plot / Flat Number</label>
                        <input type="text" disabled value="${user.building ? `Flat ${user.flatNo}` : `Plot ${user.flatNo}`}" class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-500 bg-slate-900/10 cursor-not-allowed">
                    </div>
                </div>

                <div class="space-y-1">
                    <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Registered Name</label>
                    <input type="text" disabled value="${user.name}" class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-500 bg-slate-900/10 cursor-not-allowed">
                </div>

                <div class="space-y-1">
                    <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Primary Email Address</label>
                    <input type="email" id="profile-email" required value="${user.email}"
                        class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Mobile Phone</label>
                        <input type="tel" id="profile-phone" required value="${user.phone || '9876543210'}"
                            class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                    </div>
                    <div class="space-y-1">
                        <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Family Members Size</label>
                        <input type="number" id="profile-count" min="1" max="15" required value="${user.membersCount || 3}"
                            class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                    </div>
                </div>

                <button type="submit" class="w-full py-2.5 mt-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1 glow-btn">
                    <i data-lucide="save" class="w-4 h-4"></i> Save Account Updates
                </button>
            </form>
        </div>
    `;

    // Handle submit updates
    const form = container.querySelector('#profile-settings-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedFields = {
            email: document.getElementById('profile-email').value.trim(),
            phone: document.getElementById('profile-phone').value.trim(),
            membersCount: parseInt(document.getElementById('profile-count').value, 10)
        };

        try {
            await dbService.updateMember(user.id, updatedFields);
            
            // Sync with current auth session details
            const currentSession = JSON.parse(localStorage.getItem('granddome_session'));
            const mergedSession = { ...currentSession, ...updatedFields };
            localStorage.setItem('granddome_session', JSON.stringify(mergedSession));
            
            showToast('Account credentials updated!', 'success');
            switchTab('profile');
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}
