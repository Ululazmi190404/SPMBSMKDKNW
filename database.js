// database.js - Enhanced database operations dengan kredensial baru
(function() {
    const DB_NAME = 'spmbDatabase';
    
    // Updated admin credentials
    const ADMIN_CONFIG = {
        username: "ADMIN SPMB",
        password: "ADMINSPMBSMKDKNW",
        sessionTimeout: 2 * 60 * 60 * 1000 // 2 hours
    };
    
    // Database operations
    const database = {
        // Get all data
        getAll: function() {
            try {
                const data = localStorage.getItem(DB_NAME);
                return data ? JSON.parse(data) : null;
            } catch (error) {
                console.error('Error reading database:', error);
                return null;
            }
        },
        
        // Save all data
        save: function(data) {
            try {
                localStorage.setItem(DB_NAME, JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('Error saving database:', error);
                return false;
            }
        },
        
        // Get admin configuration
        getAdminConfig: function() {
            return ADMIN_CONFIG;
        },
        
        // Verify admin credentials
        verifyAdmin: function(username, password) {
            return username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password;
        },
        
        // Check admin session
        checkSession: function() {
            const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
            const loginTime = localStorage.getItem('adminLoginTime');
            
            if (!isLoggedIn || !loginTime) return false;
            
            const currentTime = new Date().getTime();
            return currentTime - loginTime < ADMIN_CONFIG.sessionTimeout;
        },
        
        // Create session
        createSession: function() {
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminLoginTime', new Date().getTime());
            return true;
        },
        
        // Destroy session
        destroySession: function() {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminLoginTime');
            return true;
        },
        
        // Add new pendaftar
        addPendaftar: function(pendaftarData) {
            const db = this.getAll();
            if (!db) return false;
            
            if (!db.pendaftar) {
                db.pendaftar = [];
            }
            
            db.pendaftar.push(pendaftarData);
            
            // Update statistics
            if (!db.statistics) {
                db.statistics = {
                    totalRegistrations: 0,
                    registrationsToday: 0,
                    lastUpdated: new Date().toISOString()
                };
            }
            
            db.statistics.totalRegistrations = db.pendaftar.length;
            
            const today = new Date().toDateString();
            const todayRegistrations = db.pendaftar.filter(p => {
                const regDate = new Date(p.tanggalDaftar).toDateString();
                return regDate === today;
            }).length;
            db.statistics.registrationsToday = todayRegistrations;
            db.statistics.lastUpdated = new Date().toISOString();
            
            return this.save(db);
        },
        
        // Get pendaftar by ID
        getPendaftar: function(nomorPendaftaran) {
            const db = this.getAll();
            if (!db || !db.pendaftar) return null;
            
            return db.pendaftar.find(p => p.nomorPendaftaran === nomorPendaftaran);
        },
        
        // Update pendaftar
        updatePendaftar: function(nomorPendaftaran, updatedData) {
            const db = this.getAll();
            if (!db || !db.pendaftar) return false;
            
            const index = db.pendaftar.findIndex(p => p.nomorPendaftaran === nomorPendaftaran);
            if (index === -1) return false;
            
            db.pendaftar[index] = { ...db.pendaftar[index], ...updatedData };
            return this.save(db);
        },
        
        // Delete pendaftar
        deletePendaftar: function(nomorPendaftaran) {
            const db = this.getAll();
            if (!db || !db.pendaftar) return false;
            
            db.pendaftar = db.pendaftar.filter(p => p.nomorPendaftaran !== nomorPendaftaran);
            
            // Update statistics
            if (db.statistics) {
                db.statistics.totalRegistrations = db.pendaftar.length;
                db.statistics.lastUpdated = new Date().toISOString();
            }
            
            return this.save(db);
        },
        
        // Search pendaftar
        searchPendaftar: function(keyword) {
            const db = this.getAll();
            if (!db || !db.pendaftar) return [];
            
            const searchTerm = keyword.toLowerCase();
            return db.pendaftar.filter(p => 
                (p.nama && p.nama.toLowerCase().includes(searchTerm)) ||
                (p.nomorPendaftaran && p.nomorPendaftaran.toLowerCase().includes(searchTerm)) ||
                (p.nisn && p.nisn.includes(searchTerm)) ||
                (p.asalSekolah && p.asalSekolah.toLowerCase().includes(searchTerm))
            );
        },
        
        // Get statistics
        getStatistics: function() {
            const db = this.getAll();
            if (!db) return null;
            
            const statistics = {
                total: db.pendaftar ? db.pendaftar.length : 0,
                byJurusan: {},
                byDate: {},
                today: 0
            };
            
            if (db.pendaftar) {
                // Count by jurusan
                db.pendaftar.forEach(p => {
                    const jurusan = p.pilihanJurusan || 'Unknown';
                    statistics.byJurusan[jurusan] = (statistics.byJurusan[jurusan] || 0) + 1;
                });
                
                // Count by date
                const today = new Date().toDateString();
                db.pendaftar.forEach(p => {
                    const date = new Date(p.tanggalDaftar).toDateString();
                    statistics.byDate[date] = (statistics.byDate[date] || 0) + 1;
                    
                    if (date === today) {
                        statistics.today++;
                    }
                });
            }
            
            return statistics;
        },
        
        // Update SPMB information
        updateSchoolInfo: function(info) {
            const db = this.getAll();
            if (!db) return false;
            
            db.infoSekolah = info;
            return this.save(db);
        },
        
        // Update SPMB schedules
        updateSchedules: function(schedules) {
            const db = this.getAll();
            if (!db) return false;
            
            db.jadwal = schedules;
            return this.save(db);
        },
        
        // Update contact information
        updateContactInfo: function(contact) {
            const db = this.getAll();
            if (!db) return false;
            
            db.kontak = contact;
            return this.save(db);
        },
        
        // Update majors/programs
        updateMajors: function(majors) {
            const db = this.getAll();
            if (!db) return false;
            
            db.jurusan = majors;
            return this.save(db);
        },
        
        // Export data
        exportData: function(format = 'json') {
            const db = this.getAll();
            if (!db) return null;
            
            if (format === 'json') {
                return JSON.stringify(db.pendaftar || [], null, 2);
            } else if (format === 'csv') {
                // Convert to CSV
                const pendaftar = db.pendaftar || [];
                if (pendaftar.length === 0) return '';
                
                const headers = ['No', 'Nomor Pendaftaran', 'Nama', 'NISN', 'Sekolah Asal', 'Jurusan', 'Total Nilai', 'Tanggal Daftar'];
                const rows = pendaftar.map((p, i) => [
                    i + 1,
                    p.nomorPendaftaran,
                    p.nama,
                    p.nisn,
                    p.asalSekolah,
                    p.pilihanJurusan,
                    p.totalNilai,
                    p.tanggalDaftar
                ]);
                
                const csvContent = [
                    headers.join(','),
                    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
                ].join('\n');
                
                return csvContent;
            }
            
            return null;
        },
        
        // Import data
        importData: function(data, format = 'json') {
            try {
                let importedData;
                
                if (format === 'json') {
                    importedData = JSON.parse(data);
                } else if (format === 'csv') {
                    // Parse CSV (simplified)
                    const lines = data.split('\n');
                    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
                    importedData = lines.slice(1).map(line => {
                        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
                        const obj = {};
                        headers.forEach((header, index) => {
                            obj[header] = values[index];
                        });
                        return obj;
                    });
                }
                
                if (Array.isArray(importedData)) {
                    const db = this.getAll();
                    if (!db) return false;
                    
                    db.pendaftar = importedData;
                    return this.save(db);
                }
                
                return false;
            } catch (error) {
                console.error('Error importing data:', error);
                return false;
            }
        },
        
        // Backup database
        backup: function() {
            const db = this.getAll();
            if (!db) return null;
            
            const backupData = {
                data: db,
                timestamp: new Date().toISOString(),
                version: '2.0',
                adminConfig: ADMIN_CONFIG
            };
            
            return JSON.stringify(backupData, null, 2);
        },
        
        // Restore from backup
        restore: function(backupData) {
            try {
                const backup = JSON.parse(backupData);
                if (backup.data && backup.timestamp) {
                    localStorage.setItem(DB_NAME, JSON.stringify(backup.data));
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Error restoring backup:', error);
                return false;
            }
        },
        
        // Clear all data
        clearAll: function() {
            try {
                const db = this.getAll();
                if (db) {
                    db.pendaftar = [];
                    db.statistics = {
                        totalRegistrations: 0,
                        registrationsToday: 0,
                        lastUpdated: new Date().toISOString()
                    };
                    this.save(db);
                }
                return true;
            } catch (error) {
                console.error('Error clearing database:', error);
                return false;
            }
        }
    };
    
    // Make database available globally
    window.spmbDB = database;
    
    // Auto-initialize if database doesn't exist
    if (!localStorage.getItem(DB_NAME)) {
        const initialData = {
            pendaftar: [],
            infoSekolah: {
                nama: "SMK DARUL KAMAL NW KEMBANG KERANG",
                alamat: "Jalan Pendidikan No. 1, Kembang Kerang, Lombok Timur, NTB",
                akreditasi: "TERAKREDITASI B",
                visi: "Mencetak lulusan yang berkompeten, berakhlak mulia, dan siap kerja",
                misi: "1. Menyelenggarakan pendidikan berkualitas<br>2. Mengembangkan karakter peserta didik<br>3. Membekali keterampilan kerja"
            },
            jadwal: [
                "Pendaftaran Online: 1 Januari - 30 Juni 2026",
                "Tes Seleksi: 10 Juli 2026",
                "Pengumuman: 15 Juli 2026",
                "Daftar Ulang: 16-20 Juli 2026",
                "Masa Pengenalan Lingkungan Sekolah: 22-24 Juli 2026"
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
                adminUsername: ADMIN_CONFIG.username,
                adminPassword: ADMIN_CONFIG.password,
                maxFileSize: 5 * 1024 * 1024,
                registrationYear: "2026/2027",
                version: "2.0"
            },
            statistics: {
                totalRegistrations: 0,
                registrationsToday: 0,
                lastUpdated: new Date().toISOString()
            }
        };
        
        localStorage.setItem(DB_NAME, JSON.stringify(initialData));
    }
})();