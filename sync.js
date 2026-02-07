// sync.js - File sinkronisasi data real-time
(function() {
    const SYNC_INTERVAL = 3000; // 3 detik
    const DATABASE_KEY = 'spmbDatabase';
    
    function syncData() {
        try {
            // Ambil data dari semua sumber
            const sources = [
                localStorage.getItem(DATABASE_KEY),
                sessionStorage.getItem('spmbDatabase'),
                sessionStorage.getItem('newRegistration')
            ];
            
            let mainData = null;
            
            // Cari sumber data yang valid
            for (let source of sources) {
                if (source) {
                    try {
                        const parsed = JSON.parse(source);
                        if (parsed.pendaftar || parsed.infoSekolah) {
                            mainData = parsed;
                            break;
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
            
            if (!mainData) {
                mainData = { pendaftar: [] };
            }
            
            // Pastikan struktur lengkap
            if (!mainData.pendaftar) mainData.pendaftar = [];
            if (!mainData.infoSekolah) mainData.infoSekolah = {};
            if (!mainData.jadwal) mainData.jadwal = [];
            if (!mainData.kontak) mainData.kontak = {};
            if (!mainData.jurusan) mainData.jurusan = [];
            if (!mainData.statistics) {
                mainData.statistics = {
                    totalRegistrations: mainData.pendaftar.length,
                    registrationsToday: 0,
                    lastUpdated: new Date().toISOString()
                };
            }
            
            // Update statistics
            const today = new Date().toDateString();
            const todayRegistrations = mainData.pendaftar.filter(p => {
                const regDate = new Date(p.tanggalDaftar).toDateString();
                return regDate === today;
            }).length;
            
            mainData.statistics.registrationsToday = todayRegistrations;
            mainData.statistics.totalRegistrations = mainData.pendaftar.length;
            mainData.statistics.lastUpdated = new Date().toISOString();
            
            // Simpan ke localStorage utama
            localStorage.setItem(DATABASE_KEY, JSON.stringify(mainData));
            
            // Juga simpan ke window.database untuk konsistensi
            if (window.database) {
                window.database = mainData;
            }
            
            // Jika di admin panel, trigger update
            if (window.adminDataUpdate) {
                window.adminDataUpdate();
            }
            
        } catch (error) {
            console.error('Sync error:', error);
        }
    }
    
    // Mulai sinkronisasi
    setInterval(syncData, SYNC_INTERVAL);
    
    // Sync saat halaman load
    document.addEventListener('DOMContentLoaded', syncData);
    
    // Sync saat visibility change
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            syncData();
        }
    });
    
    // Export fungsi
    window.syncDatabase = syncData;
})();