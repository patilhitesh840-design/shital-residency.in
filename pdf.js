// PDF Receipt Generation Utility using jsPDF
// Accessing jsPDF in browser environments (UMD loading)
const getjsPDF = () => {
    if (!window.jspdf) {
        throw new Error('PDF Generation library not loaded. Please check your network connection.');
    }
    const { jsPDF } = window.jspdf;
    return jsPDF;
};

/**
 * Generates an executive receipt PDF for a paid bill and starts browser download
 * @param {Object} bill 
 * @param {Object} resident 
 */
export async function generateReceiptPDF(bill, resident) {
    const jsPDF = getjsPDF();
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5' // A5 size is compact, modern, and excellent for receipt prints
    });

    const primaryColor = [99, 102, 241]; // Indigo
    const accentColor = [168, 85, 247]; // Purple
    const darkText = [30, 41, 59]; // Slate 800
    const lightText = [148, 163, 184]; // Slate 400
    const greenColor = [34, 197, 94]; // Emerald Green

    // 1. BRAND LETTERHEAD BACKGROUND BAND
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 148, 25, 'F'); // Width of A5 is 148mm

    // 2. BRAND TITLE
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('GRANDDOME SOCIETY', 10, 11);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(224, 231, 255);
    doc.text('REGISTRATION NO: GDS/2026/MUM-IV | EXECUTIVE PORTAL RECEIPT', 10, 16);
    doc.text('TELEPHONE: +91 99009 90099 | EMAIL: CLUBHOUSE@GRANDDOME.COM', 10, 20);

    // 3. TITLE OF DOCUMENT
    doc.setTextColor(...darkText);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('INVOICE PAYMENT RECEIPT', 10, 36);

    // DRAW THIN HORIZONTAL LINE
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(10, 39, 138, 39);

    // 4. METADATA GRID (Two-column layout)
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);

    // Column 1
    doc.setTextColor(...lightText);
    doc.text('RECEIPT ID:', 10, 45);
    doc.setTextColor(...darkText);
    doc.setFont('Helvetica', 'bold');
    doc.text(`GD-${bill.id.toUpperCase()}`, 35, 45);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(...lightText);
    doc.text('RESIDENT NAME:', 10, 50);
    doc.setTextColor(...darkText);
    doc.text(resident.name, 35, 50);

    doc.setTextColor(...lightText);
    doc.text(resident.building ? 'FLAT & BLOCK:' : 'PLOT NO:', 10, 55);
    doc.setTextColor(...darkText);
    doc.text(resident.building ? `Wing ${resident.building}, Flat ${resident.flatNo}` : `Plot ${resident.flatNo}`, 35, 55);

    // Column 2
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(...lightText);
    doc.text('DATE GENERATED:', 80, 45);
    doc.setTextColor(...darkText);
    doc.text(new Date().toLocaleDateString(), 110, 45);

    doc.setTextColor(...lightText);
    doc.text('PAID DATE:', 80, 50);
    doc.setTextColor(...darkText);
    doc.text(bill.paymentDate || bill.dueDate, 110, 50);

    doc.setTextColor(...lightText);
    doc.text('PAYMENT ROUTE:', 80, 55);
    doc.setTextColor(...darkText);
    doc.text(bill.paymentMethod || 'Online (UPI)', 110, 55);

    // DRAW ANOTHER HORIZONTAL LINE
    doc.line(10, 60, 138, 60);

    // 5. CHARGES TABLE HEADINGS
    doc.setFillColor(248, 250, 252);
    doc.rect(10, 65, 128, 6, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('PARTICULARS & LEVIES', 12, 69);
    doc.text('AMOUNT (INR)', 115, 69);

    // 6. TABLE ROWS
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(...darkText);
    
    let y = 77;
    const items = [
        { label: 'Electricity Consumption Charges (Utility)', amount: bill.electricity },
        { label: 'Garbage Collection & Disposal Levy', amount: bill.garbage },
        { label: 'Monthly Maintenance & Clubhouse Charges', amount: bill.maintenance }
    ];

    if (bill.lateFee > 0) {
        items.push({ label: 'Late Payment Penalty / Admin Fine', amount: bill.lateFee });
    }

    items.forEach(item => {
        doc.text(item.label, 12, y);
        doc.setFont('Helvetica', 'bold');
        doc.text(`Rs. ${item.amount.toFixed(2)}`, 115, y);
        doc.setFont('Helvetica', 'normal');
        
        // Row separator line
        doc.setDrawColor(241, 245, 249);
        doc.line(10, y+2, 138, y+2);
        y += 7;
    });

    // 7. TOTAL BILLING ROW
    y += 2;
    doc.setFillColor(240, 24df, 255); // very light blue
    doc.rect(10, y-4, 128, 7, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.text('NET TRANSACTION TOTAL:', 12, y);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Rs. ${bill.total.toFixed(2)}`, 112, y);

    // 8. PAID STAMP (A beautiful box seal)
    const stampY = y + 10;
    doc.setDrawColor(...greenColor);
    doc.setLineWidth(0.6);
    doc.rect(85, stampY, 45, 14);
    
    // Stamp fill
    doc.setFillColor(240, 253, 244);
    doc.rect(85.5, stampY+0.5, 44, 13, 'F');

    doc.setTextColor(...greenColor);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PAID', 99, stampY + 7);
    
    doc.setFontSize(6);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Txn Date: ${bill.paymentDate || 'Completed'}`, 91, stampY + 11);

    // 9. FOOTER DISCLAIMER
    doc.setFontSize(6);
    doc.setTextColor(...lightText);
    doc.setFont('Helvetica', 'oblique');
    doc.text('Disclaimer: This document is a digitally compiled transaction receipt for dues paid to GrandDome Management.', 10, stampY + 28);
    doc.text('In case of discrepancies, contact security/clubhouse services immediately.', 10, stampY + 31);
    
    // Save/Download PDF
    const filename = `granddome_receipt_flat_${resident.flatNo}_${bill.month.replace(' ', '_')}.pdf`;
    doc.save(filename);
}
