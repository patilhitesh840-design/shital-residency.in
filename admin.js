// Admin Dashboard Page Module
import { dbService, authService } from '../firebase.js';
import { Router } from '../router.js';
import { renderHeader, setupLayoutInteractions, showToast } from '../app.js';
import { importMembersFromExcel, exportBillsToExcel, exportMonthlyReportToExcel } from '../utils/excel.js';
import { generateAISummary, generateSmartReminder } from '../utils/ai.js';

let currentTab = 'dashboard';
let chartsInitialized = false;
let revenueChartInstance = null;

export async function renderAdmin(container) {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
        Router.navigate('#/login');
        return;
    }

    // Render full page shell
    container.innerHTML = `
        ${renderHeader()}
        
        <div class="flex-grow flex flex-col md:flex-row min-h-[calc(100vh-73px)] relative z-10">
            <!-- Left Sidebar Navigation -->
            <aside class="w-full md:w-64 glass-panel border-r border-glass-border-light dark:border-glass-border-dark p-4 flex flex-col gap-2 justify-between">
                <nav class="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                    <button data-tab="dashboard" class="sidebar-tab flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-indigo-500/10 hover:text-indigo-400 w-full text-left">
                        <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
                        <span>Dashboard</span>
                    </button>
                    <button data-tab="members" class="sidebar-tab flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-indigo-500/10 hover:text-indigo-400 w-full text-left">
                        <i data-lucide="users" class="w-4 h-4"></i>
                        <span>Manage Members</span>
                    </button>
                    <button data-tab="billing" class="sidebar-tab flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-indigo-500/10 hover:text-indigo-400 w-full text-left">
                        <i data-lucide="receipt" class="w-4 h-4"></i>
                        <span>Electricity & Dues</span>
                    </button>
                    <button data-tab="complaints" class="sidebar-tab flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-indigo-500/10 hover:text-indigo-400 w-full text-left">
                        <i data-lucide="message-square" class="w-4 h-4"></i>
                        <span>Complaints Desk</span>
                    </button>
                </nav>
                
                <div class="hidden md:block p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-slate-400 text-center">
                    <p class="font-bold text-slate-300">GrandDome Admin v1.0</p>
                    <p class="mt-1">Keep credentials secure.</p>
                </div>
            </aside>

            <!-- Main Content Pane -->
            <section id="admin-content" class="flex-grow p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
                <!-- Inner view will be injected here -->
            </section>
        </div>

        <!-- MODALS STORAGE CONTAINER -->
        <div id="modal-container"></div>
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

// Switch between dashboard tabs
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
    const viewContainer = document.getElementById('admin-content');
    if (!viewContainer) return;

    // Show inline spinner while fetching data
    viewContainer.innerHTML = `
        <div class="flex items-center justify-center min-h-[50vh]">
            <div class="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
    `;

    try {
        if (tabId === 'dashboard') {
            await renderDashboard(viewContainer);
        } else if (tabId === 'members') {
            await renderMembers(viewContainer);
        } else if (tabId === 'billing') {
            await renderBilling(viewContainer);
        } else if (tabId === 'complaints') {
            await renderComplaints(viewContainer);
        }
        
        // Reinitialize icons in new loaded content
        if (window.lucide) {
            window.lucide.createIcons();
        }
    } catch (err) {
        showToast('Error loading tab content: ' + err.message, 'error');
    }
}

// ==========================================
// 1. DASHBOARD VIEW RENDERER
// ==========================================
async function renderDashboard(container) {
    const stats = await dbService.getDashboardStats();
    
    container.innerHTML = `
        <div class="space-y-8 animate-fade-in">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 class="text-3xl font-display font-bold tracking-tight">System Dashboard</h2>
                    <p class="text-sm text-slate-400">Real-time statistics and society financial analytics.</p>
                </div>
                <!-- Excel Export of Monthly Reports -->
                <button id="export-report-btn" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-xs shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 glow-btn">
                    <i data-lucide="download" class="w-4 h-4"></i> Export Monthly Report
                </button>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Card 1 -->
                <div class="glass-panel border border-glass-border-light dark:border-glass-border-dark p-6 rounded-2xl premium-card flex items-center justify-between">
                    <div>
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Members</span>
                        <h3 class="text-3xl font-display font-extrabold mt-1 text-indigo-400">${stats.totalMembers}</h3>
                        <p class="text-[10px] text-slate-400 mt-2">${stats.occupiedFlats} Flats Occupied</p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <i data-lucide="users" class="w-6 h-6"></i>
                    </div>
                </div>

                <!-- Card 2 -->
                <div class="glass-panel border border-glass-border-light dark:border-glass-border-dark p-6 rounded-2xl premium-card flex items-center justify-between">
                    <div>
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Income</span>
                        <h3 class="text-3xl font-display font-extrabold mt-1 text-green-400">₹${stats.totalIncome}</h3>
                        <p class="text-[10px] text-slate-400 mt-2">Collected from Paid Bills</p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
                        <i data-lucide="trending-up" class="w-6 h-6"></i>
                    </div>
                </div>

                <!-- Card 3 -->
                <div class="glass-panel border border-glass-border-light dark:border-glass-border-dark p-6 rounded-2xl premium-card flex items-center justify-between">
                    <div>
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Unpaid Dues</span>
                        <h3 class="text-3xl font-display font-extrabold mt-1 text-rose-400">₹${stats.totalOutstanding}</h3>
                        <p class="text-[10px] text-slate-400 mt-2">${stats.pendingBillsCount} Pending Bills</p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                        <i data-lucide="credit-card" class="w-6 h-6"></i>
                    </div>
                </div>

                <!-- Card 4 -->
                <div class="glass-panel border border-glass-border-light dark:border-glass-border-dark p-6 rounded-2xl premium-card flex items-center justify-between">
                    <div>
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Late Penalties</span>
                        <h3 class="text-3xl font-display font-extrabold mt-1 text-amber-400">₹${stats.totalPenalties}</h3>
                        <p class="text-[10px] text-slate-400 mt-2">Total Fine Levied</p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <i data-lucide="alert-triangle" class="w-6 h-6"></i>
                    </div>
                </div>
            </div>

            <!-- Dashboard Visuals -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Chart (2 Columns Wide) -->
                <div class="glass-panel border border-glass-border-light dark:border-glass-border-dark p-6 rounded-2xl lg:col-span-2">
                    <h4 class="text-md font-bold mb-4 flex items-center gap-2">
                        <i data-lucide="bar-chart-3" class="w-5 h-5 text-indigo-400"></i> Revenue Analytics (Recent Months)
                    </h4>
                    <div class="relative h-[250px] w-full flex items-center justify-center">
                        <canvas id="revenue-chart"></canvas>
                    </div>
                </div>

                <!-- AI Monthly Summary Card (1 Column Wide) -->
                <div class="glass-panel border border-glass-border-light dark:border-glass-border-dark p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
                    <div class="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:scale-150 transition-all duration-500"></div>
                    
                    <div>
                        <h4 class="text-md font-bold mb-3 flex items-center gap-2 text-purple-400">
                            <i data-lucide="sparkles" class="w-5 h-5 animate-pulse"></i> AI Society Assistant
                        </h4>
                        <div id="ai-summary-box" class="space-y-3 text-xs text-slate-400 max-h-[180px] overflow-y-auto pr-1">
                            <p class="italic text-slate-500">No report generated yet. Click the button below to generate an AI review of the society's finances, electricity consumption patterns, and reminder recommendations.</p>
                        </div>
                    </div>
                    
                    <button id="ai-generate-btn" class="w-full py-2.5 mt-4 rounded-xl bg-purple-600/10 border border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2">
                        <i data-lucide="play" class="w-3.5 h-3.5"></i> Generate AI Audit
                    </button>
                </div>
            </div>
        </div>
    `;

    // Export report event
    container.querySelector('#export-report-btn').addEventListener('click', async () => {
        try {
            await exportMonthlyReportToExcel();
            showToast('Monthly analytics report downloaded!', 'success');
        } catch (e) {
            showToast('Export failed: ' + e.message, 'error');
        }
    });

    // AI Generate summary event
    const aiSummaryBox = container.querySelector('#ai-summary-box');
    const aiGenBtn = container.querySelector('#ai-generate-btn');
    aiGenBtn.addEventListener('click', async () => {
        aiSummaryBox.innerHTML = `
            <div class="flex flex-col items-center justify-center py-6 gap-2">
                <div class="w-6 h-6 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                <span class="text-[10px] text-purple-400">AI is analyzing society database...</span>
            </div>
        `;
        aiGenBtn.disabled = true;
        try {
            const summaryHtml = await generateAISummary(stats);
            aiSummaryBox.innerHTML = summaryHtml;
            showToast('AI Audit Report generated!', 'success');
        } catch (e) {
            aiSummaryBox.innerHTML = `<p class="text-rose-500">Failed to analyze: ${e.message}</p>`;
        } finally {
            aiGenBtn.disabled = false;
            // Re-render sub-icons if any
            if (window.lucide) window.lucide.createIcons();
        }
    });

    // Initialize Chart.js
    setTimeout(() => {
        const ctx = document.getElementById('revenue-chart');
        if (!ctx) return;

        const months = Object.keys(stats.monthlyHistory);
        const collectedData = months.map(m => stats.monthlyHistory[m].revenue);
        const outstandingData = months.map(m => stats.monthlyHistory[m].pending);

        if (revenueChartInstance) revenueChartInstance.destroy();

        revenueChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months.length ? months : ['No Data'],
                datasets: [
                    {
                        label: 'Collected Income (₹)',
                        data: collectedData.length ? collectedData : [0],
                        backgroundColor: 'rgba(74, 222, 128, 0.4)',
                        borderColor: 'rgba(74, 222, 128, 0.8)',
                        borderWidth: 1.5,
                        borderRadius: 6
                    },
                    {
                        label: 'Outstanding Dues (₹)',
                        data: outstandingData.length ? outstandingData : [0],
                        backgroundColor: 'rgba(251, 113, 133, 0.4)',
                        borderColor: 'rgba(251, 113, 133, 0.8)',
                        borderWidth: 1.5,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#475569',
                            font: { family: 'Plus Jakarta Sans', size: 11 }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#475569',
                            font: { family: 'Plus Jakarta Sans' }
                        }
                    },
                    y: {
                        grid: {
                            color: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
                        },
                        ticks: {
                            color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#475569',
                            font: { family: 'Plus Jakarta Sans' }
                        }
                    }
                }
            }
        });
    }, 100);
}

// ==========================================
// 2. MEMBERS DIRECTORY VIEW RENDERER
// ==========================================
async function renderMembers(container) {
    const members = await dbService.getMembers();
    
    container.innerHTML = `
        <div class="space-y-6 animate-fade-in">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 class="text-3xl font-display font-bold tracking-tight">Society Members</h2>
                    <p class="text-sm text-slate-400">Manage homeowners, tenants, and occupied flat registration details.</p>
                </div>
                <div class="flex items-center gap-3">
                    <!-- Excel Import Button -->
                    <label class="px-4 py-2.5 rounded-xl border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 font-semibold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer">
                        <i data-lucide="upload" class="w-4 h-4"></i> Import Excel
                        <input type="file" id="excel-file-input" accept=".xlsx, .xls" class="hidden">
                    </label>

                    <button id="add-member-btn" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-xs shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 glow-btn">
                        <i data-lucide="plus" class="w-4 h-4"></i> Add New Resident
                    </button>
                </div>
            </div>

            <!-- Filter and Search Bar -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="relative">
                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                    <input type="text" id="member-search" placeholder="Search by name, flat or phone..." 
                        class="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                </div>
                
                <div>
                    <select id="member-filter-status" class="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100 appearance-none bg-no-repeat bg-[right_12px_center]">
                        <option value="">All Occupancy Roles</option>
                        <option value="Owner">Owners</option>
                        <option value="Tenant">Tenants</option>
                    </select>
                </div>

            </div>

            <!-- Table Card -->
            <div class="glass-panel border border-glass-border-light dark:border-glass-border-dark rounded-2xl overflow-hidden shadow-xl">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="bg-indigo-500/5 border-b border-glass-border-light dark:border-glass-border-dark text-slate-400 font-bold uppercase tracking-wider">
                                <th class="px-6 py-4">Plot No</th>
                                <th class="px-6 py-4">Resident</th>
                                <th class="px-6 py-4">Contact Info</th>
                                <th class="px-6 py-4">Role</th>
                                <th class="px-6 py-4">Family Count</th>
                                <th class="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="members-table-body" class="divide-y divide-glass-border-light dark:divide-glass-border-dark">
                            <!-- Table Rows dynamically generated -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Populate rows
    const tableBody = container.querySelector('#members-table-body');
    const updateTable = () => {
        const query = container.querySelector('#member-search').value.toLowerCase();
        const filterStatus = container.querySelector('#member-filter-status').value;
        const filterBld = "";

        const filtered = members.filter(m => {
            const matchesQuery = m.name.toLowerCase().includes(query) || 
                                 m.flatNo.includes(query) || 
                                 m.phone.includes(query) ||
                                 m.email.toLowerCase().includes(query);
            const matchesStatus = !filterStatus || m.status === filterStatus;
            const matchesBld = !filterBld || m.building === filterBld;

            return matchesQuery && matchesStatus && matchesBld;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-slate-400 italic">No registered members match criteria.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = filtered.map(m => `
            <tr class="hover:bg-indigo-500/5 transition-colors">
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold">
                        ${m.building ? m.building + '-' : 'Plot '}${m.flatNo}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="font-bold text-slate-800 dark:text-slate-100">${m.name}</div>
                    <div class="text-[10px] text-slate-400">Joined: ${m.joinDate}</div>
                </td>
                <td class="px-6 py-4">
                    <div><i data-lucide="phone" class="inline w-3 h-3 text-slate-500 mr-1"></i> ${m.phone}</div>
                    <div class="text-slate-400"><i data-lucide="mail" class="inline w-3 h-3 text-slate-500 mr-1"></i> ${m.email}</div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${
                        m.status === 'Owner' 
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                        : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                    }">${m.status}</span>
                </td>
                <td class="px-6 py-4 font-semibold text-slate-300">${m.membersCount} Persons</td>
                <td class="px-6 py-4 text-right space-x-2">
                    <button data-edit-id="${m.id}" class="edit-member-btn text-indigo-400 hover:text-indigo-300 font-semibold focus:outline-none">
                        Edit
                    </button>
                    <button data-delete-id="${m.id}" class="delete-member-btn text-rose-400 hover:text-rose-300 font-semibold focus:outline-none">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');

        // Bind Row actions
        container.querySelectorAll('.edit-member-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-edit-id');
                const m = members.find(item => item.id === id);
                showMemberModal(m);
            });
        });

        container.querySelectorAll('.delete-member-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-delete-id');
                if (confirm('Are you sure you want to delete this resident? All local history for this slot will be closed.')) {
                    await dbService.deleteMember(id);
                    showToast('Resident deleted', 'info');
                    switchTab('members');
                }
            });
        });

        if (window.lucide) window.lucide.createIcons();
    };

    updateTable();

    // Bind searches
    container.querySelector('#member-search').addEventListener('input', updateTable);
    container.querySelector('#member-filter-status').addEventListener('change', updateTable);


    // Bind Modal triggers
    container.querySelector('#add-member-btn').addEventListener('click', () => showMemberModal(null));

    // Handle excel import input
    const fileInput = container.querySelector('#excel-file-input');
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const count = await importMembersFromExcel(file);
            showToast(`Imported ${count} members from Excel sheet!`, 'success');
            switchTab('members');
        } catch (err) {
            showToast('Excel Import failed: ' + err.message, 'error');
        }
    });
}

// Add/Edit Member Modal view
function showMemberModal(member = null) {
    const modalContainer = document.getElementById('modal-container');
    const isEdit = !!member;

    modalContainer.innerHTML = `
        <div id="member-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div class="w-full max-w-md glass-panel border border-glass-border-light dark:border-glass-border-dark rounded-2xl shadow-2xl p-6 animate-scale-up">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-display font-bold">${isEdit ? 'Edit Resident Profile' : 'Add New Resident'}</h3>
                    <button id="close-modal-btn" class="text-slate-400 hover:text-slate-200">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <form id="member-modal-form" class="space-y-4">
                    <div class="space-y-1">
                        <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Plot Number</label>
                        <input type="text" id="modal-flat" placeholder="e.g. 101" required value="${isEdit ? member.flatNo : ''}"
                            class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                    </div>

                    <div class="space-y-1">
                        <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Full Name</label>
                        <input type="text" id="modal-name" placeholder="John Doe" required value="${isEdit ? member.name : ''}"
                            class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Phone</label>
                            <input type="tel" id="modal-phone" placeholder="9876543210" required value="${isEdit ? member.phone : ''}"
                                class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Email Address</label>
                            <input type="email" id="modal-email" placeholder="john@gmail.com" required value="${isEdit ? member.email : ''}"
                                class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Status</label>
                            <select id="modal-status" required class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                                <option value="Owner" ${isEdit && member.status === 'Owner' ? 'selected' : ''}>Owner</option>
                                <option value="Tenant" ${isEdit && member.status === 'Tenant' ? 'selected' : ''}>Tenant</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Family Members</label>
                            <input type="number" id="modal-count" min="1" max="15" required value="${isEdit ? member.membersCount : 3}"
                                class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                        </div>
                    </div>

                    <button type="submit" class="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1 glow-btn">
                        <i data-lucide="check-circle" class="w-4 h-4"></i> ${isEdit ? 'Save Changes' : 'Register Member'}
                    </button>
                </form>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Bind close
    const closeModal = () => modalContainer.innerHTML = '';
    modalContainer.querySelector('#close-modal-btn').addEventListener('click', closeModal);
    modalContainer.querySelector('#member-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    // Form submit
    modalContainer.querySelector('#member-modal-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            building: "",
            flatNo: document.getElementById('modal-flat').value.trim(),
            name: document.getElementById('modal-name').value.trim(),
            phone: document.getElementById('modal-phone').value.trim(),
            email: document.getElementById('modal-email').value.trim(),
            status: document.getElementById('modal-status').value,
            membersCount: parseInt(document.getElementById('modal-count').value, 10)
        };

        try {
            if (isEdit) {
                await dbService.updateMember(member.id, data);
                showToast('Resident profile updated!', 'success');
            } else {
                await dbService.addMember(data);
                showToast('Resident registered successfully!', 'success');
            }
            closeModal();
            switchTab('members');
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

// ==========================================
// 3. BILLING & PAYMENTS VIEW RENDERER
// ==========================================
async function renderBilling(container) {
    const bills = await dbService.getBills();
    const members = await dbService.getMembers();

    container.innerHTML = `
        <div class="space-y-6 animate-fade-in">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 class="text-3xl font-display font-bold tracking-tight">Electricity & Maintenance Dues</h2>
                    <p class="text-sm text-slate-400">Post utility charges, garbage levies, monthly maintenance, penalties, and toggle payment stamps.</p>
                </div>
                <div class="flex items-center gap-3">
                    <button id="export-bills-btn" class="px-4 py-2.5 rounded-xl border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 font-semibold text-xs shadow-md transition-all flex items-center gap-2">
                        <i data-lucide="download" class="w-4 h-4"></i> Export Bills
                    </button>
                    <button id="add-bill-btn" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-xs shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 glow-btn">
                        <i data-lucide="file-plus" class="w-4 h-4"></i> Post Monthly Dues
                    </button>
                </div>
            </div>

            <!-- Billing filters -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="relative">
                    <i data-lucide="hash" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                    <input type="text" id="bill-search-flat" placeholder="Filter by Flat Number..." 
                        class="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                </div>
                
                <div>
                    <select id="bill-filter-status" class="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                        <option value="">All Payment Statuses</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                    </select>
                </div>

                <div>
                    <select id="bill-filter-month" class="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                        <option value="">All Billing Periods</option>
                        <option value="June 2026">June 2026</option>
                        <option value="May 2026">May 2026</option>
                    </select>
                </div>
            </div>

            <!-- Bills Log Table -->
            <div class="glass-panel border border-glass-border-light dark:border-glass-border-dark rounded-2xl overflow-hidden shadow-xl">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="bg-indigo-500/5 border-b border-glass-border-light dark:border-glass-border-dark text-slate-400 font-bold uppercase tracking-wider">
                                <th class="px-6 py-4">Flat</th>
                                <th class="px-6 py-4">Billing Month</th>
                                <th class="px-6 py-4">Charges Breakdown</th>
                                <th class="px-6 py-4">Total Bill</th>
                                <th class="px-6 py-4">Status & Dues</th>
                                <th class="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="bills-table-body" class="divide-y divide-glass-border-light dark:divide-glass-border-dark">
                            <!-- Table Rows -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Populate rows
    const tableBody = container.querySelector('#bills-table-body');
    const updateTable = () => {
        const flatQuery = container.querySelector('#bill-search-flat').value.trim().toLowerCase();
        const statusFilter = container.querySelector('#bill-filter-status').value;
        const monthFilter = container.querySelector('#bill-filter-month').value;

        const filtered = bills.filter(b => {
            const matchesFlat = !flatQuery || b.flatNo.toLowerCase().includes(flatQuery);
            const matchesStatus = !statusFilter || b.status === statusFilter;
            const matchesMonth = !monthFilter || b.month === monthFilter;

            return matchesFlat && matchesStatus && matchesMonth;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-slate-400 italic">No bills logged for this criteria.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = filtered.map(b => `
            <tr class="hover:bg-indigo-500/5 transition-colors">
                <td class="px-6 py-4 font-bold text-indigo-400">Flat ${b.flatNo}</td>
                <td class="px-6 py-4 font-medium">${b.month}</td>
                <td class="px-6 py-4 space-y-1">
                    <div class="grid grid-cols-2 gap-2 text-[10px] w-48 text-slate-400">
                        <span>Electricity:</span> <span class="text-right text-slate-300">₹${b.electricity}</span>
                        <span>Garbage Charge:</span> <span class="text-right text-slate-300">₹${b.garbage}</span>
                        <span>Maintenance:</span> <span class="text-right text-slate-300">₹${b.maintenance}</span>
                        ${b.lateFee > 0 ? `<span class="text-amber-500">Late Penalty:</span> <span class="text-right text-amber-500 font-bold">₹${b.lateFee}</span>` : ''}
                    </div>
                </td>
                <td class="px-6 py-4 font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    ₹${b.total}
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-col gap-1">
                        <span class="w-16 text-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            b.status === 'Paid' 
                            ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                            : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                        }">${b.status}</span>
                        <span class="text-[9px] text-slate-500">
                            ${b.status === 'Paid' 
                                ? `Paid on ${b.paymentDate} (${b.paymentMethod})` 
                                : `Due by ${b.dueDate}`
                            }
                        </span>
                    </div>
                </td>
                <td class="px-6 py-4 text-right space-x-2">
                    ${b.status === 'Pending' 
                        ? `<button data-pay-id="${b.id}" class="pay-bill-btn px-2.5 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-white transition-all font-semibold focus:outline-none">
                            Mark Paid
                           </button>
                           <button data-remind-id="${b.id}" class="remind-bill-btn text-indigo-400 hover:underline text-xs focus:outline-none" title="Generate AI Reminder">
                            <i data-lucide="bell" class="inline w-3.5 h-3.5 mr-0.5"></i> Remind
                           </button>` 
                        : `<button data-pending-id="${b.id}" class="unpay-bill-btn px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition-all font-semibold focus:outline-none">
                            Mark Unpaid
                           </button>`
                    }
                </td>
            </tr>
        `).join('');

        // Bind actions
        container.querySelectorAll('.pay-bill-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-pay-id');
                const paymentMethod = prompt('Enter payment method (UPI / Cash / Card / NetBanking):', 'UPI');
                if (paymentMethod !== null) {
                    await dbService.updateBill(id, {
                        status: 'Paid',
                        paymentDate: new Date().toISOString().split('T')[0],
                        paymentMethod: paymentMethod || 'Cash'
                    });
                    showToast('Bill marked as Paid!', 'success');
                    switchTab('billing');
                }
            });
        });

        container.querySelectorAll('.unpay-bill-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-pending-id');
                if (confirm('Revert payment stamp and mark this bill as Pending?')) {
                    await dbService.updateBill(id, {
                        status: 'Pending',
                        paymentDate: null,
                        paymentMethod: null
                    });
                    showToast('Bill marked as Pending', 'info');
                    switchTab('billing');
                }
            });
        });

        // AI Reminder trigger
        container.querySelectorAll('.remind-bill-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-remind-id');
                const bill = bills.find(item => item.id === id);
                const resident = members.find(item => item.flatNo === bill.flatNo);
                
                try {
                    const reminderMsg = await generateSmartReminder(bill, resident);
                    alert(`💡 AI Recommended Notification Text:\n\n${reminderMsg}`);
                } catch (e) {
                    showToast('AI reminder failed: ' + e.message, 'error');
                }
            });
        });

        if (window.lucide) window.lucide.createIcons();
    };

    updateTable();

    // Bind searches
    container.querySelector('#bill-search-flat').addEventListener('input', updateTable);
    container.querySelector('#bill-filter-status').addEventListener('change', updateTable);
    container.querySelector('#bill-filter-month').addEventListener('change', updateTable);

    // Add bill modal trigger
    container.querySelector('#add-bill-btn').addEventListener('click', () => showAddBillModal(members));

    // Export Bills Excel
    container.querySelector('#export-bills-btn').addEventListener('click', async () => {
        try {
            await exportBillsToExcel();
            showToast('Billing logs exported to Excel!', 'success');
        } catch (e) {
            showToast('Export failed: ' + e.message, 'error');
        }
    });
}

// Generate dues modal
function showAddBillModal(members) {
    const modalContainer = document.getElementById('modal-container');
    
    // Sort members for flat option selector
    const flats = members.map(m => m.flatNo).sort((a,b) => Number(a) - Number(b));

    modalContainer.innerHTML = `
        <div id="bill-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div class="w-full max-w-md glass-panel border border-glass-border-light dark:border-glass-border-dark rounded-2xl shadow-2xl p-6 animate-scale-up">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-display font-bold">Generate Dues Bill</h3>
                    <button id="close-modal-btn" class="text-slate-400 hover:text-slate-200">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <form id="bill-modal-form" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Target Residents</label>
                            <select id="modal-bill-target" required class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                                <option value="ALL">Apply to All Flats</option>
                                ${flats.map(f => `<option value="${f}">Flat ${f}</option>`).join('')}
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Billing Month</label>
                            <input type="text" id="modal-bill-month" value="July 2026" required
                                class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-4">
                        <div class="space-y-1">
                            <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Electricity (₹)</label>
                            <input type="number" id="modal-bill-elec" value="2200" required
                                class="w-full px-2 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Garbage (₹)</label>
                            <input type="number" id="modal-bill-garb" value="150" required
                                class="w-full px-2 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Maint. (₹)</label>
                            <input type="number" id="modal-bill-maint" value="2500" required
                                class="w-full px-2 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Due Date</label>
                            <input type="date" id="modal-bill-due" value="2026-07-15" required
                                class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Late Payment Penalty (₹)</label>
                            <input type="number" id="modal-bill-penalty" value="0" required
                                class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                        </div>
                    </div>

                    <!-- Auto billing AI info helper -->
                    <div class="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl text-[10px] text-slate-400 flex items-start gap-2">
                        <i data-lucide="sparkles" class="w-4 h-4 text-purple-400 flex-shrink-0 animate-pulse mt-0.5"></i>
                        <div>
                            <span class="font-bold text-slate-300">Smart Bill Calculation</span>: Electricity values are preset to society's seasonal average. You can adjust the figures manually prior to submitting.
                        </div>
                    </div>

                    <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1 glow-btn">
                        <i data-lucide="plus-circle" class="w-4 h-4"></i> Generate and Post Bills
                    </button>
                </form>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Bind close
    const closeModal = () => modalContainer.innerHTML = '';
    modalContainer.querySelector('#close-modal-btn').addEventListener('click', closeModal);
    modalContainer.querySelector('#bill-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    // Form submit
    modalContainer.querySelector('#bill-modal-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const target = document.getElementById('modal-bill-target').value;
        const billInfo = {
            month: document.getElementById('modal-bill-month').value.trim(),
            electricity: Number(document.getElementById('modal-bill-elec').value),
            garbage: Number(document.getElementById('modal-bill-garb').value),
            maintenance: Number(document.getElementById('modal-bill-maint').value),
            lateFee: Number(document.getElementById('modal-bill-penalty').value),
            dueDate: document.getElementById('modal-bill-due').value
        };

        try {
            if (target === 'ALL') {
                // Post to all members
                for (const member of members) {
                    await dbService.addBill({
                        flatNo: member.flatNo,
                        ...billInfo
                    });
                }
                showToast(`Monthly dues posted to all ${members.length} registered flats!`, 'success');
            } else {
                // Post to a single flat
                await dbService.addBill({
                    flatNo: target,
                    ...billInfo
                });
                showToast(`Monthly dues posted to Flat ${target}!`, 'success');
            }
            closeModal();
            switchTab('billing');
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

// ==========================================
// 4. COMPLAINTS DESK VIEW RENDERER
// ==========================================
async function renderComplaints(container) {
    const complaints = await dbService.getComplaints();

    container.innerHTML = `
        <div class="space-y-6 animate-fade-in">
            <div>
                <h2 class="text-3xl font-display font-bold tracking-tight">Complaints Resolution Desk</h2>
                <p class="text-sm text-slate-400">View maintenance tickets, log resolutions, and reply to residents.</p>
            </div>

            <!-- Complaints log Table -->
            <div class="glass-panel border border-glass-border-light dark:border-glass-border-dark rounded-2xl overflow-hidden shadow-xl">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="bg-indigo-500/5 border-b border-glass-border-light dark:border-glass-border-dark text-slate-400 font-bold uppercase tracking-wider">
                                <th class="px-6 py-4">Flat No</th>
                                <th class="px-6 py-4">Ticket details</th>
                                <th class="px-6 py-4">Submission Date</th>
                                <th class="px-6 py-4">Status</th>
                                <th class="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="complaints-table-body" class="divide-y divide-glass-border-light dark:divide-glass-border-dark">
                            <!-- Table Rows -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    const tableBody = container.querySelector('#complaints-table-body');
    if (complaints.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-12 text-center text-slate-400 italic">No tickets raised by residents yet.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = complaints.map(c => `
        <tr class="hover:bg-indigo-500/5 transition-colors">
            <td class="px-6 py-4 font-bold text-slate-300">Flat ${c.flatNo}</td>
            <td class="px-6 py-4 max-w-sm">
                <div class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-slate-500/10 border border-slate-500/20 text-slate-400">${c.category}</span>
                    <span>${c.title}</span>
                </div>
                <p class="text-[10px] text-slate-400 mt-1">${c.description}</p>
                ${c.reply ? `<p class="text-[10px] text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 p-1.5 rounded mt-2"><span class="font-bold">Reply:</span> ${c.reply}</p>` : ''}
            </td>
            <td class="px-6 py-4 text-slate-400">${c.date}</td>
            <td class="px-6 py-4">
                <span class="px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    c.status === 'Resolved' 
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                    : c.status === 'In Progress' 
                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                }">${c.status}</span>
            </td>
            <td class="px-6 py-4 text-right">
                <button data-reply-id="${c.id}" class="reply-complaint-btn px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all font-semibold focus:outline-none">
                    ${c.reply ? 'Update Reply' : 'Resolve Ticket'}
                </button>
            </td>
        </tr>
    `).join('');

    // Bind actions
    container.querySelectorAll('.reply-complaint-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-reply-id');
            const c = complaints.find(item => item.id === id);
            showComplaintReplyModal(c);
        });
    });

    if (window.lucide) window.lucide.createIcons();
}

// Complaint Resolution Modal
function showComplaintReplyModal(complaint) {
    const modalContainer = document.getElementById('modal-container');

    modalContainer.innerHTML = `
        <div id="reply-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div class="w-full max-w-md glass-panel border border-glass-border-light dark:border-glass-border-dark rounded-2xl shadow-2xl p-6 animate-scale-up">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-display font-bold">Ticket Resolution</h3>
                    <button id="close-modal-btn" class="text-slate-400 hover:text-slate-200">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <div class="mb-4 bg-slate-950/20 border border-glass-border-light dark:border-glass-border-dark p-3.5 rounded-xl text-[11px] space-y-1">
                    <div class="flex items-center justify-between text-slate-400 font-bold">
                        <span>Flat ${complaint.flatNo} (${complaint.category})</span>
                        <span>Raised: ${complaint.date}</span>
                    </div>
                    <h4 class="font-bold text-slate-300 mt-1">${complaint.title}</h4>
                    <p class="text-slate-400 leading-normal">${complaint.description}</p>
                </div>

                <form id="reply-modal-form" class="space-y-4">
                    <div class="space-y-1">
                        <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Resolution Status</label>
                        <select id="modal-reply-status" required class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100">
                            <option value="Pending" ${complaint.status === 'Pending' ? 'selected' : ''}>Pending Action</option>
                            <option value="In Progress" ${complaint.status === 'In Progress' ? 'selected' : ''}>Work In Progress</option>
                            <option value="Resolved" ${complaint.status === 'Resolved' ? 'selected' : ''}>Resolved / Complete</option>
                        </select>
                    </div>

                    <div class="space-y-1">
                        <label class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Staff Response / Notes</label>
                        <textarea id="modal-reply-text" rows="3" required placeholder="e.g. Electrician scheduled. Bulb replaced..."
                            class="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-100 resize-none">${complaint.reply || ''}</textarea>
                    </div>

                    <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1 glow-btn">
                        <i data-lucide="check" class="w-4 h-4"></i> Submit Resolution
                    </button>
                </form>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Bind close
    const closeModal = () => modalContainer.innerHTML = '';
    modalContainer.querySelector('#close-modal-btn').addEventListener('click', closeModal);
    modalContainer.querySelector('#reply-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    // Form Submit
    modalContainer.querySelector('#reply-modal-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = document.getElementById('modal-reply-status').value;
        const replyText = document.getElementById('modal-reply-text').value.trim();

        try {
            await dbService.updateComplaint(complaint.id, {
                status,
                reply: replyText
            });
            showToast('Ticket resolution updated!', 'success');
            closeModal();
            switchTab('complaints');
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}
