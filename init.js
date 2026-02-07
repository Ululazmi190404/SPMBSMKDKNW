// init.js - Database initialization dengan kredensial baru dan sinkronisasi
(function() {
    // Debug function
    function debugDatabase() {
        const db = JSON.parse(localStorage.getItem('spmbDatabase'));
        console.log('=== DATABASE DEBUG ===');
        console.log('Database exists:', !!db);
        if (db) {
            console.log('Total pendaftar:', db.pendaftar ? db.pendaftar.length : 0);
            console.log('Pendaftar data:', db.pendaftar);
            console.log('Statistics:', db.statistics);
        }
        console.log('====================');
    }
    
    // Initialize database structure
    function initializeDatabase() {
        if (!localStorage.getItem('spmbDatabase')) {
            console.log('Creating new database...'); // Debug log
            
            const initialDatabase = {
                pendaftar: [],
                infoSekolah: {
                    nama: "SMK DARUL KAMAL NW KEMBANG KERANG",
                    alamat: "Jalan Pendidikan No. 1, Kembang Kerang, Lombok Timur, NTB",
                    akreditasi: "TERAKREDITASI B",
                    visi: "Mencetak lulusan yang berkompeten, berakhlak mulia, dan siap kerja",
                    misi: "1. Menyelenggarakan pendidikan berkualitas<br>2. Mengembangkan karakter peserta didik<br>3. Membekali keterampilan kerja<br>4. Menjalin kerjasama dengan dunia usaha dan industri"
                },
                jadwal: [
                    "Pendaftaran Online: 1 Januari - 30 Juni 2026",
                    "Tes Seleksi: 10 Juli 2026",
                    "Pengumuman: 15 Juli 2026",
                    "Daftar Ulang: 16-20 Juli 2026",
                    "Masa Pengenalan Lingkungan Sekolah: 22-24 Juli 2026",
                    "Mulai Pembelajaran: 25 Juli 2026"
                ],
                kontak: {
                    telepon: "(0376) 123-456",
                    whatsapp: "0812-3456-7890",
                    email: "info@smkdarulkamal.sch.id",
                    website: "www.smkdarulkamal.sch.id",
                    alamat: "Panitia SPMB, SMK Darul Kamal NW Kembang Kerang, Lombok Timur, NTB"
                },
                jurusan: [
                    {
                        kode: "MP",
                        nama: "Manajemen Perkantoran",
                        deskripsi: "Mencetak tenaga administrasi perkantoran yang profesional dan terampil dalam pengelolaan administrasi kantor.",
                        fasilitas: "Lab. Komputer, Lab. Administrasi, Program Magang"
                    },
                    {
                        kode: "AK",
                        nama: "Akutansi dan Keuangan",
                        deskripsi: "Mengelola keuangan dan pembukuan perusahaan dengan sistem akuntansi yang terkomputerisasi.",
                        fasilitas: "Lab. Akuntansi, Software Akuntansi, Program Sertifikasi"
                    },
                    {
                        kode: "BPF",
                        nama: "Broadcasting & Perfilman",
                        deskripsi: "Produksi konten media, perfilman, dan broadcasting dengan peralatan modern.",
                        fasilitas: "Studio Broadcasting, Lab. Editing, Kamera Profesional"
                    }
                ],
                settings: {
                    adminUsername: "ADMIN SPMB",
                    adminPassword: "ADMINSPMBSMKDKNW",
                    maxFileSize: 5 * 1024 * 1024, // 5MB
                    registrationYear: "2026/2027",
                    testDate: "10 Juli 2026",
                    version: "2.0"
                },
                statistics: {
                    totalRegistrations: 0,
                    registrationsToday: 0,
                    lastUpdated: new Date().toISOString()
                }
            };
            
            localStorage.setItem('spmbDatabase', JSON.stringify(initialDatabase));
            console.log('New database created successfully'); // Debug log
        } else {
            console.log('Database already exists'); // Debug log
        }
        
        debugDatabase(); // Show debug info
    }
    
    // ===== PERBAIKAN: Migrasi data lama dari berbagai sumber =====
    function migrateOldData() {
        const sources = [
            { key: 'pendaftarData', type: 'array' },
            { key: 'spmbPendaftar', type: 'array' },
            { key: 'pendaftaranData', type: 'array' },
            { key: 'spmbData', type: 'object' }
        ];
        
        sources.forEach(source => {
            const oldData = localStorage.getItem(source.key);
            if (oldData) {
                try {
                    const parsedData = JSON.parse(oldData);
                    const database = JSON.parse(localStorage.getItem('spmbDatabase')) || { pendaftar: [] };
                    
                    if (Array.isArray(parsedData)) {
                        // Gabungkan data lama
                        if (!database.pendaftar) database.pendaftar = [];
                        
                        parsedData.forEach(item => {
                            const exists = database.pendaftar.some(p => 
                                p.nomorPendaftaran === item.nomorPendaftaran || 
                                p.nisn === item.nisn
                            );
                            if (!exists) {
                                database.pendaftar.push(item);
                            }
                        });
                        
                        localStorage.setItem('spmbDatabase', JSON.stringify(database));
                    } else if (parsedData.pendaftar && Array.isArray(parsedData.pendaftar)) {
                        // Jika formatnya object dengan property pendaftar
                        if (!database.pendaftar) database.pendaftar = [];
                        
                        parsedData.pendaftar.forEach(item => {
                            const exists = database.pendaftar.some(p => 
                                p.nomorPendaftaran === item.nomorPendaftaran || 
                                p.nisn === item.nisn
                            );
                            if (!exists) {
                                database.pendaftar.push(item);
                            }
                        });
                        
                        localStorage.setItem('spmbDatabase', JSON.stringify(database));
                    }
                    
                    // Hapus data lama
                    localStorage.removeItem(source.key);
                    console.log(`Migrated data from ${source.key}`);
                } catch (error) {
                    console.error(`Error migrating data from ${source.key}:`, error);
                }
            }
        });
    }
    
    // Update statistics
    function updateStatistics() {
        const database = JSON.parse(localStorage.getItem('spmbDatabase'));
        if (!database) return;
        
        const today = new Date().toDateString();
        const todayRegistrations = database.pendaftar.filter(p => {
            const regDate = new Date(p.tanggalDaftar).toDateString();
            return regDate === today;
        }).length;
        
        database.statistics = {
            totalRegistrations: database.pendaftar.length,
            registrationsToday: todayRegistrations,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('spmbDatabase', JSON.stringify(database));
    }
    
    // Check admin session
    function checkAdminSession() {
        const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        const loginTime = localStorage.getItem('adminLoginTime');
        
        if (!isLoggedIn || !loginTime) return false;
        
        const currentTime = new Date().getTime();
        const twoHours = 2 * 60 * 60 * 1000;
        
        if (currentTime - loginTime > twoHours) {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminLoginTime');
            return false;
        }
        
        return true;
    }
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        initializeDatabase();
        migrateOldData();
        updateStatistics();
        
        // Add watermark to body
        if (!document.querySelector('.watermark')) {
            const watermark = document.createElement('div');
            watermark.className = 'watermark';
            watermark.textContent = 'SMK DARUL KAMAL NW KEMBANG KERANG';
            document.body.appendChild(watermark);
        }
        
        // Add print styles
        if (!document.querySelector('#print-styles')) {
            const printStyles = document.createElement('style');
            printStyles.id = 'print-styles';
            printStyles.textContent = `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-area, .print-area * {
                        visibility: visible;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                        padding: 20px;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .btn {
                        display: none !important;
                    }
                    .watermark {
                        display: block !important;
                        opacity: 0.1 !important;
                    }
                    @page {
                        margin: 20mm;
                    }
                }
            `;
            document.head.appendChild(printStyles);
        }
    });
    
    // Make functions available globally
    window.spmbDatabase = {
        initialize: initializeDatabase,
        migrate: migrateOldData,
        updateStats: updateStatistics,
        checkSession: checkAdminSession,
        getStats: function() {
            const db = JSON.parse(localStorage.getItem('spmbDatabase'));
            return db ? db.statistics : null;
        },
        getSettings: function() {
            const db = JSON.parse(localStorage.getItem('spmbDatabase'));
            return db ? db.settings : null;
        },
        // ===== PERBAIKAN: Tambahkan fungsi untuk sinkronisasi =====
        syncNow: function() {
            updateStatistics();
            return true;
        },
        debug: debugDatabase // Add debug function
    };
})();