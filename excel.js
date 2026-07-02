// Excel Import / Export Utility Module using SheetJS (XLSX)
import { dbService } from '../firebase.js';

// Helper to verify SheetJS availability
const getXLSX = () => {
    if (!window.XLSX) {
        throw new Error('SheetJS library not loaded. Please check your internet connection.');
    }
    return window.XLSX;
};

/**
 * Reads an Excel file and imports the members into database
 * @param {File} file 
 * @returns {Promise<number>} Number of successfully imported members
 */
export async function importMembersFromExcel(file) {
    const XLSX = getXLSX();
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Get first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Parse rows to JSON objects
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                if (!jsonData || jsonData.length === 0) {
                    reject(new Error('The uploaded Excel sheet appears to be empty!'));
                    return;
                }

                // Import via service layer
                const importedCount = await dbService.importMembers(jsonData);
                resolve(importedCount);
            } catch (err) {
                reject(new Error('Failed to parse Excel file: ' + err.message));
            }
        };

        reader.onerror = () => reject(new Error('FileReader error occurred.'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Exports all bill logs to Excel sheet
 */
export async function exportBillsToExcel() {
    const XLSX = getXLSX();
    const bills = await dbService.getBills();
    
    // Map raw data to professional column naming
    const formattedData = bills.map(b => ({
        'Flat No.': b.flatNo,
        'Billing Period': b.month,
        'Electricity Dues (INR)': b.electricity,
        'Garbage Dues (INR)': b.garbage,
        'Maintenance Dues (INR)': b.maintenance,
        'Late Penalties (INR)': b.lateFee,
        'Total Amount (INR)': b.total,
        'Payment Status': b.status,
        'Due Date': b.dueDate,
        'Payment Date': b.paymentDate || 'N/A',
        'Payment Method': b.paymentMethod || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Society Billing Logs');
    
    // Auto-fit column widths
    const maxCols = Object.keys(formattedData[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
    worksheet['!cols'] = maxCols;

    XLSX.writeFile(workbook, `granddome_billing_report_${Date.now()}.xlsx`);
}

/**
 * Exports monthly dashboard summary and aggregates to Excel sheet
 */
export async function exportMonthlyReportToExcel() {
    const XLSX = getXLSX();
    const stats = await dbService.getDashboardStats();
    
    // Formulate a structured, tabular summary sheet
    const summaryData = [
        { 'Metric Summary': 'GrandDome Society Analytics', 'Value': '' },
        { 'Metric Summary': 'Report Generated At', 'Value': new Date().toLocaleString() },
        { 'Metric Summary': 'Total Registered Residents', 'Value': stats.totalMembers },
        { 'Metric Summary': 'Total Flats Capacity', 'Value': stats.totalFlats },
        { 'Metric Summary': 'Occupied Ratio', 'Value': `${Math.round((stats.occupiedFlats / stats.totalFlats) * 100)}%` },
        { 'Metric Summary': 'Total Revenue Collected (INR)', 'Value': `INR ${stats.totalIncome}` },
        { 'Metric Summary': 'Outstanding Unpaid Invoices', 'Value': `INR ${stats.totalOutstanding}` },
        { 'Metric Summary': 'Unpaid Dues Count', 'Value': `${stats.pendingBillsCount} Pending Bills` },
        { 'Metric Summary': 'Collected Bills Count', 'Value': `${stats.paidBillsCount} Paid Bills` },
        { 'Metric Summary': 'Late Penalties Accrued', 'Value': `INR ${stats.totalPenalties}` }
    ];

    // Historical monthly stats
    const historyData = Object.keys(stats.monthlyHistory).map(month => ({
        'Billing Month': month,
        'Collected Revenue (INR)': stats.monthlyHistory[month].revenue,
        'Outstanding Dues (INR)': stats.monthlyHistory[month].pending,
        'Total Projected Dues (INR)': stats.monthlyHistory[month].revenue + stats.monthlyHistory[month].pending
    }));

    const workbook = XLSX.utils.book_new();
    
    // Sheet 1: General Metrics
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Executive Summary');
    
    // Sheet 2: Monthly Trends
    const wsHistory = XLSX.utils.json_to_sheet(historyData);
    XLSX.utils.book_append_sheet(workbook, wsHistory, 'Monthly Financial Trends');
    
    XLSX.writeFile(workbook, `granddome_executive_report_${Date.now()}.xlsx`);
}
