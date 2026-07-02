// Firebase and Mock Database Service Layer for GrandDome Society Management System

/// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAeGSRjG3N15LDSHVNzJTiZsfwp3AycRng",
  authDomain: "shital-residency.firebaseapp.com",
  projectId: "shital-residency",
  storageBucket: "shital-residency.firebasestorage.app",
  messagingSenderId: "1003744246810",
  appId: "1:1003744246810:web:788d30995ff8c3ec4f25a3",
  measurementId: "G-6TPGFMJWYX"
};

// Check if credentials are real or placeholder
const isFirebaseConfigured = () => {
    return firebaseConfig.apiKey && 
           !firebaseConfig.apiKey.startsWith("PLACEHOLDER") && 
           firebaseConfig.apiKey !== "";
};

// ==========================================
// MOCK DATABASE & AUTHENTICATION (LocalStorage fallback)
// ==========================================

const MOCK_STORAGE_KEY_MEMBERS = 'granddome_members';
const MOCK_STORAGE_KEY_BILLS = 'granddome_bills';
const MOCK_STORAGE_KEY_COMPLAINTS = 'granddome_complaints';
const MOCK_STORAGE_KEY_SESSION = 'granddome_session';
const MOCK_STORAGE_KEY_ADMINS = 'granddome_admins';

const INITIAL_ADMINS = [
    { id: 'a1', name: 'Society Admin', email: 'admin@society.com', password: 'admin123', role: 'admin' }
];

const INITIAL_MEMBERS = [];

const INITIAL_BILLS = [];

const INITIAL_COMPLAINTS = [];

// Helper to seed data if not present
const seedMockDatabase = () => {
    if (localStorage.getItem('granddome_data_ver_2026') !== 'cleared') {
        localStorage.removeItem(MOCK_STORAGE_KEY_MEMBERS);
        localStorage.removeItem(MOCK_STORAGE_KEY_BILLS);
        localStorage.removeItem(MOCK_STORAGE_KEY_COMPLAINTS);
        localStorage.setItem('granddome_data_ver_2026', 'cleared');
    }
    if (!localStorage.getItem(MOCK_STORAGE_KEY_MEMBERS)) {
        localStorage.setItem(MOCK_STORAGE_KEY_MEMBERS, JSON.stringify(INITIAL_MEMBERS));
    }
    if (!localStorage.getItem(MOCK_STORAGE_KEY_BILLS)) {
        localStorage.setItem(MOCK_STORAGE_KEY_BILLS, JSON.stringify(INITIAL_BILLS));
    }
    if (!localStorage.getItem(MOCK_STORAGE_KEY_COMPLAINTS)) {
        localStorage.setItem(MOCK_STORAGE_KEY_COMPLAINTS, JSON.stringify(INITIAL_COMPLAINTS));
    }
    if (!localStorage.getItem(MOCK_STORAGE_KEY_ADMINS)) {
        localStorage.setItem(MOCK_STORAGE_KEY_ADMINS, JSON.stringify(INITIAL_ADMINS));
    }
};
seedMockDatabase();

// Load Mock helper functions
const getStoredItems = (key) => JSON.parse(localStorage.getItem(key)) || [];
const setStoredItems = (key, items) => localStorage.setItem(key, JSON.stringify(items));

// ==========================================
// EXPORTED INTEGRATED API SERVICES
// ==========================================

export const isDemoMode = !isFirebaseConfigured();

export const authService = {
    login: async (email, password) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const cleanedEmail = email.toLowerCase().trim();
                
                // Admin Login
                const admins = getStoredItems(MOCK_STORAGE_KEY_ADMINS);
                const admin = admins.find(a => a.email.toLowerCase() === cleanedEmail);
                if (admin && password === admin.password) {
                    const session = { email: cleanedEmail, role: 'admin', name: admin.name };
                    localStorage.setItem(MOCK_STORAGE_KEY_SESSION, JSON.stringify(session));
                    resolve(session);
                    return;
                }

                // Resident Login (either via email or flat number)
                const members = getStoredItems(MOCK_STORAGE_KEY_MEMBERS);
                const resident = members.find(m => 
                    m.email.toLowerCase() === cleanedEmail || 
                    m.flatNo === email.trim()
                );

                if (resident && password === (resident.password || 'resident123')) {
                    const session = { 
                        email: resident.email, 
                        role: 'resident', 
                        name: resident.name,
                        flatNo: resident.flatNo,
                        building: resident.building,
                        phone: resident.phone,
                        id: resident.id
                    };
                    localStorage.setItem(MOCK_STORAGE_KEY_SESSION, JSON.stringify(session));
                    resolve(session);
                } else {
                    reject(new Error("Invalid credentials! Hint: Use admin@society.com / admin123 or resident@society.com / resident123"));
                }
            }, 600);
        });
    },

    logout: async () => {
        return new Promise((resolve) => {
            localStorage.removeItem(MOCK_STORAGE_KEY_SESSION);
            resolve(true);
        });
    },

    getCurrentUser: () => {
        const session = localStorage.getItem(MOCK_STORAGE_KEY_SESSION);
        return session ? JSON.parse(session) : null;
    },

    registerResident: async (residentData) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const members = getStoredItems(MOCK_STORAGE_KEY_MEMBERS);
                const flat = residentData.flatNo.trim();
                const email = residentData.email.toLowerCase().trim();

                if (members.some(m => m.flatNo === flat)) {
                    reject(new Error(`Plot ${flat} is already registered!`));
                    return;
                }
                if (members.some(m => m.email.toLowerCase() === email)) {
                    reject(new Error(`Email ${email} is already in use!`));
                    return;
                }

                const newResident = {
                    id: 'm_' + Date.now(),
                    joinDate: new Date().toISOString().split('T')[0],
                    ...residentData
                };

                members.push(newResident);
                setStoredItems(MOCK_STORAGE_KEY_MEMBERS, members);

                const session = {
                    email: newResident.email,
                    role: 'resident',
                    name: newResident.name,
                    flatNo: newResident.flatNo,
                    building: newResident.building,
                    phone: newResident.phone,
                    id: newResident.id
                };
                localStorage.setItem(MOCK_STORAGE_KEY_SESSION, JSON.stringify(session));
                resolve(session);
            }, 600);
        });
    },

    registerAdmin: async (adminData) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const admins = getStoredItems(MOCK_STORAGE_KEY_ADMINS);
                const email = adminData.email.toLowerCase().trim();

                if (admins.some(a => a.email.toLowerCase() === email)) {
                    reject(new Error(`Admin email ${email} is already registered!`));
                    return;
                }

                const newAdmin = {
                    id: 'a_' + Date.now(),
                    name: adminData.name,
                    email: email,
                    password: adminData.password,
                    role: 'admin'
                };

                admins.push(newAdmin);
                setStoredItems(MOCK_STORAGE_KEY_ADMINS, admins);

                const session = {
                    email: newAdmin.email,
                    role: 'admin',
                    name: newAdmin.name
                };
                localStorage.setItem(MOCK_STORAGE_KEY_SESSION, JSON.stringify(session));
                resolve(session);
            }, 600);
        });
    },

    resetPassword: async (email, newPassword, role) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const cleanedEmail = email.toLowerCase().trim();
                if (role === 'admin') {
                    const admins = getStoredItems(MOCK_STORAGE_KEY_ADMINS);
                    const idx = admins.findIndex(a => a.email.toLowerCase() === cleanedEmail);
                    if (idx === -1) {
                        reject(new Error("Admin email address not found!"));
                        return;
                    }
                    admins[idx].password = newPassword;
                    setStoredItems(MOCK_STORAGE_KEY_ADMINS, admins);
                    resolve(true);
                } else {
                    const members = getStoredItems(MOCK_STORAGE_KEY_MEMBERS);
                    const idx = members.findIndex(m => m.email.toLowerCase() === cleanedEmail);
                    if (idx === -1) {
                        reject(new Error("Resident email address not found!"));
                        return;
                    }
                    members[idx].password = newPassword;
                    setStoredItems(MOCK_STORAGE_KEY_MEMBERS, members);
                    resolve(true);
                }
            }, 600);
        });
    }
};

export const dbService = {
    // -----------------
    // MEMBERS SERVICE
    // -----------------
    getMembers: async () => {
        return new Promise((resolve) => {
            setTimeout(() => resolve(getStoredItems(MOCK_STORAGE_KEY_MEMBERS)), 300);
        });
    },
    
    addMember: async (memberData) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const members = getStoredItems(MOCK_STORAGE_KEY_MEMBERS);
                // Validation for unique flatNo
                if (members.some(m => m.flatNo === memberData.flatNo)) {
                    reject(new Error(`Plot ${memberData.flatNo} is already occupied!`));
                    return;
                }
                const newMember = {
                    id: 'm_' + Date.now(),
                    joinDate: new Date().toISOString().split('T')[0],
                    ...memberData
                };
                members.push(newMember);
                setStoredItems(MOCK_STORAGE_KEY_MEMBERS, members);
                resolve(newMember);
            }, 400);
        });
    },

    updateMember: async (id, updatedData) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                let members = getStoredItems(MOCK_STORAGE_KEY_MEMBERS);
                members = members.map(m => m.id === id ? { ...m, ...updatedData } : m);
                setStoredItems(MOCK_STORAGE_KEY_MEMBERS, members);
                resolve(true);
            }, 400);
        });
    },

    deleteMember: async (id) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                let members = getStoredItems(MOCK_STORAGE_KEY_MEMBERS);
                members = members.filter(m => m.id !== id);
                setStoredItems(MOCK_STORAGE_KEY_MEMBERS, members);
                resolve(true);
            }, 400);
        });
    },

    importMembers: async (membersList) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const currentMembers = getStoredItems(MOCK_STORAGE_KEY_MEMBERS);
                const imported = [];
                
                membersList.forEach((m, index) => {
                    const flat = String(m.flatNo || m.Flat || '').trim();
                    const bld = String(m.building || m.Building || 'A').trim();
                    const name = String(m.name || m.Name || '').trim();
                    const email = String(m.email || m.Email || '').trim() || `resident_${flat}@society.com`;
                    const phone = String(m.phone || m.Phone || '').trim() || '9876543210';
                    const status = String(m.status || m.Status || 'Owner').trim();
                    const count = parseInt(m.membersCount || m.Members || '3', 10);
                    
                    if (name && flat) {
                        const exists = currentMembers.some(cm => cm.flatNo === flat);
                        if (!exists) {
                            const newM = {
                                id: 'm_import_' + Date.now() + '_' + index,
                                name,
                                flatNo: flat,
                                building: "",
                                email,
                                phone,
                                status,
                                membersCount: count,
                                joinDate: new Date().toISOString().split('T')[0]
                            };
                            currentMembers.push(newM);
                            imported.push(newM);
                        }
                    }
                });

                setStoredItems(MOCK_STORAGE_KEY_MEMBERS, currentMembers);
                resolve(imported.length);
            }, 500);
        });
    },

    // -----------------
    // BILLS SERVICE
    // -----------------
    getBills: async (flatNo = null) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const bills = getStoredItems(MOCK_STORAGE_KEY_BILLS);
                if (flatNo) {
                    resolve(bills.filter(b => b.flatNo === flatNo));
                } else {
                    resolve(bills);
                }
            }, 300);
        });
    },

    addBill: async (billData) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const bills = getStoredItems(MOCK_STORAGE_KEY_BILLS);
                const newBill = {
                    id: 'b_' + Date.now(),
                    lateFee: 0,
                    status: 'Pending',
                    paymentDate: null,
                    paymentMethod: null,
                    ...billData
                };
                newBill.total = Number(newBill.electricity || 0) + 
                                 Number(newBill.garbage || 0) + 
                                 Number(newBill.maintenance || 0) + 
                                 Number(newBill.lateFee || 0);
                bills.unshift(newBill);
                setStoredItems(MOCK_STORAGE_KEY_BILLS, bills);
                resolve(newBill);
            }, 400);
        });
    },

    updateBill: async (id, updatedFields) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                let bills = getStoredItems(MOCK_STORAGE_KEY_BILLS);
                bills = bills.map(b => {
                    if (b.id === id) {
                        const merged = { ...b, ...updatedFields };
                        merged.total = Number(merged.electricity || 0) + 
                                       Number(merged.garbage || 0) + 
                                       Number(merged.maintenance || 0) + 
                                       Number(merged.lateFee || 0);
                        return merged;
                    }
                    return b;
                });
                setStoredItems(MOCK_STORAGE_KEY_BILLS, bills);
                resolve(true);
            }, 400);
        });
    },

    // -----------------
    // COMPLAINTS SERVICE
    // -----------------
    getComplaints: async (flatNo = null) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const complaints = getStoredItems(MOCK_STORAGE_KEY_COMPLAINTS);
                if (flatNo) {
                    resolve(complaints.filter(c => c.flatNo === flatNo));
                } else {
                    resolve(complaints);
                }
            }, 300);
        });
    },

    addComplaint: async (complaintData) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const complaints = getStoredItems(MOCK_STORAGE_KEY_COMPLAINTS);
                const newComplaint = {
                    id: 'c_' + Date.now(),
                    date: new Date().toISOString().split('T')[0],
                    status: 'Pending',
                    reply: '',
                    ...complaintData
                };
                complaints.unshift(newComplaint);
                setStoredItems(MOCK_STORAGE_KEY_COMPLAINTS, complaints);
                resolve(newComplaint);
            }, 400);
        });
    },

    updateComplaint: async (id, updatedFields) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                let complaints = getStoredItems(MOCK_STORAGE_KEY_COMPLAINTS);
                complaints = complaints.map(c => c.id === id ? { ...c, ...updatedFields } : c);
                setStoredItems(MOCK_STORAGE_KEY_COMPLAINTS, complaints);
                resolve(true);
            }, 300);
        });
    },

    // -----------------
    // STATS / ANALYTICS
    // -----------------
    getDashboardStats: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const members = getStoredItems(MOCK_STORAGE_KEY_MEMBERS);
                const bills = getStoredItems(MOCK_STORAGE_KEY_BILLS);
                
                const totalMembers = members.length;
                const totalFlats = 50; // Total flats capacity
                const occupiedFlats = new Set(members.map(m => `${m.building}-${m.flatNo}`)).size;
                
                const pendingBillsList = bills.filter(b => b.status === 'Pending');
                const paidBillsList = bills.filter(b => b.status === 'Paid');
                
                const pendingBillsCount = pendingBillsList.length;
                const paidBillsCount = paidBillsList.length;
                
                // Calculate monthly income for current/recent billing cycles
                const totalPenalties = bills.reduce((sum, b) => sum + (b.lateFee || 0), 0);
                const totalIncome = paidBillsList.reduce((sum, b) => sum + (b.total || 0), 0);
                const totalOutstanding = pendingBillsList.reduce((sum, b) => sum + (b.total || 0), 0);

                // Group bills by month for charts (last 6 months)
                const monthlyHistory = {};
                bills.forEach(b => {
                    if (!monthlyHistory[b.month]) {
                        monthlyHistory[b.month] = { revenue: 0, pending: 0 };
                    }
                    if (b.status === 'Paid') {
                        monthlyHistory[b.month].revenue += b.total;
                    } else {
                        monthlyHistory[b.month].pending += b.total;
                    }
                });

                resolve({
                    totalMembers,
                    totalFlats,
                    occupiedFlats,
                    pendingBillsCount,
                    paidBillsCount,
                    totalIncome,
                    totalOutstanding,
                    totalPenalties,
                    monthlyHistory
                });
            }, 500);
        });
    }
};
