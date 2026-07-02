// AI Feature Simulation and Assistant Utilities
import { isDemoMode } from '../firebase.js';

/**
 * Simulates generating an AI executive report summary of society statistics
 * @param {Object} stats Dashboard statistics
 * @returns {Promise<string>} HTML formatted report
 */
export async function generateAISummary(stats) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const occupiedRatio = stats.totalMembers / stats.totalFlats;
            const collectionRatio = stats.totalIncome / (stats.totalIncome + stats.totalOutstanding || 1);
            const collectionPercent = Math.round(collectionRatio * 100);
            
            // Dynamic insight generation based on data
            let assessment = '';
            let recommendations = '';
            let severityColor = 'text-green-400';
            
            if (collectionPercent >= 80) {
                assessment = 'Excellent collection status. Society liquidity is strong with minimal default risk.';
                recommendations = '<li>Maintain existing payment windows and continue automated UPI payment collections.</li>';
            } else if (collectionPercent >= 50) {
                assessment = 'Moderate collection rate. Outstanding dues are starting to pile up, impacting cash flow.';
                recommendations = '<li>Initiate the smart reminders dispatch protocol for pending flats.</li><li>Offer credit cards/installment channels if needed.</li>';
                severityColor = 'text-amber-400';
            } else {
                assessment = 'Critical treasury collection rate. Cash flow issues may arise for standard maintenance tasks.';
                recommendations = '<li>Mandatory penalty collection for bills overdue by 15+ days.</li><li>Schedule emergency community feedback meeting.</li>';
                severityColor = 'text-rose-400';
            }

            // Detect spikes in electricity
            const hasSpike = stats.totalPenalties > 0;
            const spikeNote = hasSpike 
                ? `<li><strong>Late Penalty Alert</strong>: An amount of ₹${stats.totalPenalties} in fines has accumulated. Wing B has the highest concentration of late fee occurrences.</li>`
                : '<li><strong>Utility Stability</strong>: Utility dues are running average, no seasonal electricity spikes detected.</li>';

            const html = `
                <div class="space-y-4 text-xs">
                    <!-- Overall Health Meter -->
                    <div class="p-3 bg-slate-950/20 border border-glass-border-light dark:border-glass-border-dark rounded-xl">
                        <div class="flex items-center justify-between mb-1">
                            <span class="font-bold text-slate-300">Dues Collection Health</span>
                            <span class="font-extrabold ${severityColor}">${collectionPercent}% Collected</span>
                        </div>
                        <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" style="width: ${collectionPercent}%"></div>
                        </div>
                    </div>
                    
                    <!-- AI Narrative -->
                    <div class="space-y-2">
                        <h5 class="font-bold text-indigo-400 flex items-center gap-1">
                            <i data-lucide="brain" class="w-3.5 h-3.5"></i> Executive Summary
                        </h5>
                        <p class="text-slate-300 leading-relaxed font-medium">
                            "${assessment} Flat occupancy is at ${Math.round(occupiedRatio * 100)}% capacity. June cycle billing generated ₹${stats.totalOutstanding + stats.totalIncome} total projected dues."
                        </p>
                    </div>

                    <!-- Bullet Recommendations -->
                    <div class="space-y-2 border-t border-glass-border-light dark:border-glass-border-dark pt-3">
                        <h5 class="font-bold text-indigo-400">Action Recommendations:</h5>
                        <ul class="list-disc pl-4 space-y-1.5 text-slate-400">
                            ${recommendations}
                            ${spikeNote}
                            <li><strong>AI Reminders</strong>: Recommend sending WhatsApp notices to Wing C residents to expedite balance collection.</li>
                        </ul>
                    </div>
                </div>
            `;
            resolve(html);
        }, 1200); // 1.2s realistic AI thinking delay
    });
}

/**
 * Simulates formulation of smart notifications/reminders for whatsapp/sms
 * @param {Object} bill 
 * @param {Object} resident 
 * @returns {Promise<string>} Polite text reminder string
 */
export async function generateSmartReminder(bill, resident) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const reminder = `✉️ GRANDDOME NOTICE:
Dear ${resident.name},
This is a friendly reminder that your billing dues for ${bill.month} are outstanding for ${resident.building ? `Wing ${resident.building}, Flat` : 'Plot'} ${bill.flatNo}.

Details:
• Utility & Maintenance Total: ₹${bill.total}
• Payment Deadline: ${bill.dueDate}
${bill.lateFee > 0 ? `• Accumulated Late Fee: ₹${bill.lateFee}\n` : ''}
Please log in to the GrandDome Resident Portal to settle your balance using UPI. If you have already paid, please ignore this note.

Thank you!
- Clubhouse Operations Desk`;
            resolve(reminder);
        }, 400);
    });
}
