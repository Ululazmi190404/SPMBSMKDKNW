// script.js - Enhanced version dengan sinkronisasi data real-time
document.addEventListener('DOMContentLoaded', function() {
    // Initialize database
    initializeDatabase();
    
    // Set up event listeners
    setupEventListeners();
    
    // Calculate total nilai automatically
    setupNilaiCalculation();
    
    // Load information from database
    loadInformations();
    
    // Set default dates
    setDefaultDates();
    
    // Check if there's saved form data
    loadSavedFormData();
    
    // Add mobile menu toggle if needed
    setupMobileMenu();
    
    // ===== PERBAIKAN: Sinkronisasi Database =====
    syncDatabase();
    setInterval(syncDatabase, 3000); // Sync setiap 3 detik
});

function initializeDatabase() {
    // Initialize melalui database.js jika tersedia
    if (window.spmbDB) {
        window.database = window.spmbDB.getAll() || {};
    } else {
        // Fallback initialization
        window.database = {
            pendaftar: [],
            infoSekolah: {
                nama: "SMK DARUL KAMAL NW KEMBANG KERANG",
                alamat: "Jalan Pendidikan No. 1, Kembang Kerang, Lombok Timur, NTB",
                akreditasi: "TERAKREDITASI B",
                visi: "Mencetak lulusan yang berkompeten, berakhlak mulia, dan siap kerja",
                misi: `1. Menyelenggarakan pendidikan berkualitas<br>
                       2. Mengembangkan karakter peserta didik<br>
                       3. Membekali keterampilan kerja<br>
                       4. Menjalin kerjasama dengan dunia usaha dan industri`
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
            ]
        };
    }
    
    // Load dari localStorage jika tersedia
    loadFromLocalStorage();
}

// ===== PERBAIKAN: Fungsi Sinkronisasi Database =====
function syncDatabase() {
    try {
        // Jika ada data baru di sessionStorage, tambahkan ke database utama
        const newReg = sessionStorage.getItem('newRegistration');
        if (newReg) {
            const data = JSON.parse(newReg);
            
            // Simpan ke database utama
            const db = JSON.parse(localStorage.getItem('spmbDatabase')) || { pendaftar: [] };
            if (!db.pendaftar) db.pendaftar = [];
            
            // Cek apakah data sudah ada
            const exists = db.pendaftar.some(p => p.nomorPendaftaran === data.nomorPendaftaran);
            if (!exists) {
                db.pendaftar.push(data);
                
                // Update statistics
                const today = new Date().toDateString();
                const todayCount = db.pendaftar.filter(p => {
                    const itemDate = new Date(p.tanggalDaftar).toDateString();
                    return itemDate === today;
                }).length;
                
                db.statistics = {
                    totalRegistrations: db.pendaftar.length,
                    registrationsToday: todayCount,
                    lastUpdated: new Date().toISOString()
                };
                
                localStorage.setItem('spmbDatabase', JSON.stringify(db));
            }
            
            // Hapus dari sessionStorage
            sessionStorage.removeItem('newRegistration');
        }
        
        // Update window.database
        window.database = JSON.parse(localStorage.getItem('spmbDatabase')) || { pendaftar: [] };
    } catch (error) {
        console.error('Error syncing database:', error);
    }
}

// ===== PERBAIKAN: Fungsi Save To Database yang Diperbarui =====
async function saveToDatabase(data) {
    return new Promise((resolve, reject) => {
        try {
            // Get existing database or create new
            const database = JSON.parse(localStorage.getItem('spmbDatabase')) || {
                pendaftar: [],
                infoSekolah: {},
                jadwal: [],
                kontak: {},
                jurusan: [],
                settings: {},
                statistics: { totalRegistrations: 0, registrationsToday: 0, lastUpdated: new Date().toISOString() }
            };
            
            if (!database.pendaftar) {
                database.pendaftar = [];
            }
            
            // Add new registration
            database.pendaftar.push(data);
            
            // Update statistics
            const today = new Date().toDateString();
            const todayRegistrations = database.pendaftar.filter(p => {
                if (!p.tanggalDaftar) return false;
                const regDate = new Date(p.tanggalDaftar).toDateString();
                return regDate === today;
            }).length;
            
            database.statistics = {
                totalRegistrations: database.pendaftar.length,
                registrationsToday: todayRegistrations,
                lastUpdated: new Date().toISOString()
            };
            
            // Save to localStorage
            localStorage.setItem('spmbDatabase', JSON.stringify(database));
            
            // Also save to session storage for immediate access
            sessionStorage.setItem('lastRegistration', JSON.stringify(data));
            
            // Simpan ke sessionStorage sebagai sinyal untuk admin
            sessionStorage.setItem('newRegistration', JSON.stringify(data));
            
            console.log('Data saved successfully:', data); // Debug log
            console.log('Total registrations now:', database.pendaftar.length); // Debug log
            
            resolve();
        } catch (error) {
            console.error('Error saving data:', error);
            reject(error);
        }
    });
}

function setupMobileMenu() {
    if (window.innerWidth < 768) {
        const header = document.querySelector('header');
        if (header && !document.getElementById('mobileMenuBtn')) {
            const menuBtn = document.createElement('button');
            menuBtn.id = 'mobileMenuBtn';
            menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            menuBtn.style.cssText = `
                position: absolute;
                top: 15px;
                right: 15px;
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 100;
            `;
            
            menuBtn.addEventListener('click', function() {
                const nav = document.querySelector('.nav-links');
                if (nav) {
                    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
                }
            });
            
            header.style.position = 'relative';
            header.appendChild(menuBtn);
            
            const nav = document.querySelector('.nav-links');
            if (nav) {
                nav.style.display = 'none';
                nav.style.cssText += `
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: #1a237e;
                    padding: 15px;
                    flex-direction: column;
                    gap: 10px;
                    z-index: 99;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                `;
            }
        }
    }
}

function setupEventListeners() {
    const form = document.getElementById('ppdbForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    const fotoInput = document.getElementById('foto');
    if (fotoInput) {
        fotoInput.addEventListener('change', function(e) {
            previewFile(e.target, 'fotoPreview', 'fotoData');
        });
    }
    
    const ijazahInput = document.getElementById('ijazah');
    if (ijazahInput) {
        ijazahInput.addEventListener('change', function(e) {
            previewFile(e.target, 'ijazahPreview', 'ijazahData');
        });
    }
    
    const kkInput = document.getElementById('kk');
    if (kkInput) {
        kkInput.addEventListener('change', function(e) {
            previewFile(e.target, 'kkPreview', 'kkData');
        });
    }
    
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', printFormulir);
    }
    
    const printAllBtn = document.getElementById('printAllBtn');
    if (printAllBtn) {
        printAllBtn.addEventListener('click', printAllDocuments);
    }
    
    const editBtn = document.getElementById('editBtn');
    if (editBtn) {
        editBtn.addEventListener('click', editFormData);
    }
    
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadBuktiPendaftaran);
    }
    
    const tanggalLahirInput = document.getElementById('tanggalLahir');
    if (tanggalLahirInput) {
        tanggalLahirInput.addEventListener('change', calculateUsia);
    }
    
    const tanggalLahirOrtuInput = document.getElementById('tanggalLahirOrtu');
    if (tanggalLahirOrtuInput) {
        tanggalLahirOrtuInput.addEventListener('change', calculateUsiaOrtu);
    }
}

function setupNilaiCalculation() {
    const nilaiInputs = ['nilaiBindo', 'nilaiBing', 'nilaiMatematika', 'nilaiIPA'];
    const totalInput = document.getElementById('totalNilai');
    
    if (!totalInput) return;
    
    function calculateTotal() {
        let total = 0;
        let allFilled = true;
        
        nilaiInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                const value = parseFloat(input.value) || 0;
                total += value;
                
                if (input.value === '') {
                    allFilled = false;
                }
            }
        });
        
        totalInput.value = total.toFixed(2);
        
        const warningElement = document.getElementById('nilaiWarning');
        if (!warningElement) {
            const warning = document.createElement('div');
            warning.id = 'nilaiWarning';
            warning.style.cssText = 'color: #f57c00; font-size: 0.9rem; margin-top: 5px; display: none;';
            totalInput.parentElement.appendChild(warning);
        }
        
        if (total < 200 && allFilled) {
            warningElement.textContent = '⚠ Total nilai kurang dari 200. Pastikan nilai sudah benar.';
            warningElement.style.display = 'block';
        } else {
            warningElement.style.display = 'none';
        }
    }
    
    nilaiInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                const value = parseFloat(this.value);
                if (value < 0) this.value = 0;
                if (value > 100) this.value = 100;
                
                calculateTotal();
            });
        }
    });
}

function setDefaultDates() {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
    const minDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
    
    const tanggalLahirInput = document.getElementById('tanggalLahir');
    if (tanggalLahirInput) {
        tanggalLahirInput.max = maxDate.toISOString().split('T')[0];
        tanggalLahirInput.min = minDate.toISOString().split('T')[0];
    }
    
    const tanggalLahirOrtuInput = document.getElementById('tanggalLahirOrtu');
    if (tanggalLahirOrtuInput) {
        const maxDateOrtu = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
        tanggalLahirOrtuInput.max = maxDateOrtu.toISOString().split('T')[0];
        tanggalLahirOrtuInput.min = new Date(1900, 0, 1).toISOString().split('T')[0];
        
        const defaultOrtuDate = new Date(today.getFullYear() - 40, today.getMonth(), today.getDate());
        tanggalLahirOrtuInput.value = defaultOrtuDate.toISOString().split('T')[0];
    }
}

function calculateUsia() {
    const tanggalLahir = document.getElementById('tanggalLahir');
    const usiaInput = document.getElementById('usia');
    
    if (!tanggalLahir || !usiaInput) return;
    
    const tanggalLahirValue = new Date(tanggalLahir.value);
    if (!isNaN(tanggalLahirValue.getTime())) {
        const today = new Date();
        let usia = today.getFullYear() - tanggalLahirValue.getFullYear();
        const monthDiff = today.getMonth() - tanggalLahirValue.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < tanggalLahirValue.getDate())) {
            usia--;
        }
        
        usiaInput.value = usia;
    }
}

function calculateUsiaOrtu() {
    const tanggalLahirOrtu = document.getElementById('tanggalLahirOrtu');
    if (!tanggalLahirOrtu) return;
    
    const tanggalLahirOrtuValue = new Date(tanggalLahirOrtu.value);
    if (!isNaN(tanggalLahirOrtuValue.getTime())) {
        const today = new Date();
        let usia = today.getFullYear() - tanggalLahirOrtuValue.getFullYear();
        const monthDiff = today.getMonth() - tanggalLahirOrtuValue.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < tanggalLahirOrtuValue.getDate())) {
            usia--;
        }
        
        const warningElement = document.getElementById('usiaOrtuWarning');
        if (!warningElement) {
            const warning = document.createElement('div');
            warning.id = 'usiaOrtuWarning';
            warning.style.cssText = 'color: #f44336; font-size: 0.9rem; margin-top: 5px; display: none;';
            tanggalLahirOrtu.parentElement.appendChild(warning);
        }
        
        if (usia < 25) {
            warningElement.textContent = '⚠ Usia orang tua di bawah 25 tahun. Pastikan data sudah benar.';
            warningElement.style.display = 'block';
        } else {
            warningElement.style.display = 'none';
        }
    }
}

function loadInformations() {
    const infoSekolahDiv = document.getElementById('infoSekolah');
    if (infoSekolahDiv && window.database.infoSekolah) {
        const info = window.database.infoSekolah;
        infoSekolahDiv.innerHTML = `
            <p><strong><i class="fas fa-map-marker-alt"></i> Alamat:</strong> ${info.alamat}</p>
            <p><strong><i class="fas fa-certificate"></i> Akreditasi:</strong> ${info.akreditasi}</p>
            <p><strong><i class="fas fa-eye"></i> Visi:</strong> ${info.visi}</p>
            <p><strong><i class="fas fa-bullseye"></i> Misi:</strong> ${info.misi}</p>
        `;
    }
    
    const jadwalList = document.getElementById('jadwalList');
    if (jadwalList && window.database.jadwal) {
        jadwalList.innerHTML = window.database.jadwal
            .map(item => `<li><i class="fas fa-calendar-check"></i> ${item}</li>`)
            .join('');
    }
    
    const kontakInfo = document.getElementById('kontakInfo');
    if (kontakInfo && window.database.kontak) {
        const kontak = window.database.kontak;
        kontakInfo.innerHTML = `
            <p><strong><i class="fas fa-phone"></i> Telepon:</strong> ${kontak.telepon}</p>
            <p><strong><i class="fab fa-whatsapp"></i> WhatsApp:</strong> ${kontak.whatsapp}</p>
            <p><strong><i class="fas fa-envelope"></i> Email:</strong> ${kontak.email}</p>
            <p><strong><i class="fas fa-globe"></i> Website:</strong> ${kontak.website}</p>
            <p><strong><i class="fas fa-map-marked-alt"></i> Alamat Panitia:</strong> ${kontak.alamat}</p>
        `;
    }
    
    const footerContact = document.getElementById('footerContact');
    if (footerContact && window.database.kontak) {
        footerContact.innerHTML = `
            Hubungi kami: ${window.database.kontak.email} | 
            Telepon: ${window.database.kontak.telepon} | 
            WhatsApp: ${window.database.kontak.whatsapp}
        `;
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('spmbDatabase');
        if (saved) {
            const savedData = JSON.parse(saved);
            if (savedData.pendaftar) {
                window.database.pendaftar = savedData.pendaftar;
            }
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

function loadSavedFormData() {
    try {
        const savedForm = localStorage.getItem('spmbFormDraft');
        if (savedForm) {
            const formData = JSON.parse(savedForm);
            
            Object.keys(formData).forEach(key => {
                const element = document.getElementById(key);
                if (element && formData[key]) {
                    element.value = formData[key];
                }
            });
            
            showNotification('Ada data yang belum tersimpan. Silakan lanjutkan pengisian.', 'info');
        }
        
        setInterval(saveFormDraft, 30000);
    } catch (error) {
        console.error('Error loading saved form data:', error);
    }
}

function saveFormDraft() {
    try {
        const form = document.getElementById('ppdbForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        if (Object.values(data).filter(v => v).length > 3) {
            localStorage.setItem('spmbFormDraft', JSON.stringify(data));
        }
    } catch (error) {
        console.error('Error saving form draft:', error);
    }
}

function clearFormDraft() {
    localStorage.removeItem('spmbFormDraft');
}

function previewFile(input, previewId, dataFieldId) {
    const file = input.files[0];
    if (!file) return;
    
    const maxSize = input.id === 'foto' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
        alert(`Ukuran file terlalu besar! Maksimal ${maxSize / 1024 / 1024}MB.`);
        input.value = '';
        return;
    }
    
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const validDocTypes = ['application/pdf', ...validImageTypes];
    
    let isValidType = false;
    if (input.id === 'foto') {
        isValidType = validImageTypes.includes(file.type);
    } else {
        isValidType = validDocTypes.includes(file.type);
    }
    
    if (!isValidType) {
        alert('Format file tidak didukung! Gunakan JPG, PNG, atau PDF.');
        input.value = '';
        return;
    }
    
    const reader = new FileReader();
    const previewDiv = document.getElementById(previewId);
    
    reader.onload = function(e) {
        if (dataFieldId) {
            let hiddenInput = document.getElementById(dataFieldId);
            if (!hiddenInput) {
                hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.id = dataFieldId;
                input.parentElement.appendChild(hiddenInput);
            }
            hiddenInput.value = e.target.result;
        }
        
        if (file.type.startsWith('image/')) {
            previewDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px; background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6;">
                    <img src="${e.target.result}" 
                         style="width: 100px; height: 100px; object-fit: cover; border-radius: 5px; border: 1px solid #ddd;">
                    <div>
                        <p style="margin: 0 0 5px 0; font-weight: 500;">${file.name}</p>
                        <p style="margin: 0; color: #666; font-size: 0.9rem;">
                            ${(file.size / 1024 / 1024).toFixed(2)} MB • ${file.type}
                        </p>
                        <button type="button" onclick="removeFile('${input.id}', '${previewId}', '${dataFieldId}')" 
                                style="margin-top: 8px; background: #ffebee; color: #c62828; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                            <i class="fas fa-times"></i> Hapus
                        </button>
                    </div>
                </div>
            `;
        } else {
            previewDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px; background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6;">
                    <div style="text-align: center; color: #e53935;">
                        <i class="fas fa-file-pdf" style="font-size: 3rem;"></i>
                    </div>
                    <div>
                        <p style="margin: 0 0 5px 0; font-weight: 500;">${file.name}</p>
                        <p style="margin: 0; color: #666; font-size: 0.9rem;">
                            ${(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document
                        </p>
                        <button type="button" onclick="removeFile('${input.id}', '${previewId}', '${dataFieldId}')" 
                                style="margin-top: 8px; background: #ffebee; color: #c62828; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                            <i class="fas fa-times"></i> Hapus
                        </button>
                    </div>
                </div>
            `;
        }
    };
    
    reader.readAsDataURL(file);
}

function removeFile(inputId, previewId, dataFieldId) {
    const input = document.getElementById(inputId);
    const previewDiv = document.getElementById(previewId);
    
    if (input) input.value = '';
    if (previewDiv) previewDiv.innerHTML = '';
    
    if (dataFieldId) {
        const hiddenInput = document.getElementById(dataFieldId);
        if (hiddenInput) {
            hiddenInput.remove();
        }
    }
}

function validateForm() {
    let isValid = true;
    let errorMessage = '';
    
    const nisnInput = document.getElementById('nisn');
    if (nisnInput) {
        const nisn = nisnInput.value;
        if (nisn.length !== 10 || isNaN(nisn)) {
            isValid = false;
            errorMessage += '• NISN harus 10 digit angka\n';
        }
    }
    
    const nilaiInputs = ['nilaiBindo', 'nilaiBing', 'nilaiMatematika', 'nilaiIPA'];
    nilaiInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            const nilai = parseFloat(input.value);
            if (nilai < 0 || nilai > 100) {
                isValid = false;
                const subject = id.replace('nilai', '').replace('Bindo', 'Bahasa Indonesia').replace('Bing', 'Bahasa Inggris');
                errorMessage += `• Nilai ${subject} harus antara 0-100\n`;
            }
        }
    });
    
    const totalNilaiInput = document.getElementById('totalNilai');
    if (totalNilaiInput) {
        const totalNilai = parseFloat(totalNilaiInput.value);
        if (totalNilai < 0 || totalNilai > 400) {
            isValid = false;
            errorMessage += '• Total nilai harus antara 0-400\n';
        }
    }
    
    const usiaInput = document.getElementById('usia');
    if (usiaInput) {
        const usia = parseInt(usiaInput.value);
        if (usia < 13 || usia > 25) {
            isValid = false;
            errorMessage += '• Usia harus antara 13-25 tahun\n';
        }
    }
    
    const teleponInput = document.getElementById('telepon');
    if (teleponInput) {
        const telepon = teleponInput.value;
        if (telepon.length < 10 || telepon.length > 15) {
            isValid = false;
            errorMessage += '• Nomor telepon harus 10-15 digit\n';
        }
    }
    
    if (!isValid) {
        alert('Silakan perbaiki kesalahan berikut:\n\n' + errorMessage);
    }
    
    return isValid;
}

function generateNomorPendaftaran() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    
    return `SPMB-${year}${month}${day}-${random}`;
}

// ===== PERBAIKAN: Fungsi Handle Form Submit yang Diperbarui (VERSI TERBARU) =====
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
    submitBtn.disabled = true;
    
    try {
        // Generate nomor pendaftaran
        const nomorPendaftaran = generateNomorPendaftaran();
        
        // Collect form data
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Add additional data
        data.nomorPendaftaran = nomorPendaftaran;
        data.tanggalDaftar = new Date().toISOString(); // Use ISO string for consistent date format
        
        // Format date for display
        data.tanggalDaftarDisplay = new Date().toLocaleString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        data.status = "Diterima";
        
        // Convert nilai to numbers
        data.nilaiBindo = parseFloat(data.nilaiBindo) || 0;
        data.nilaiBing = parseFloat(data.nilaiBing) || 0;
        data.nilaiMatematika = parseFloat(data.nilaiMatematika) || 0;
        data.nilaiIPA = parseFloat(data.nilaiIPA) || 0;
        data.totalNilai = (data.nilaiBindo + data.nilaiBing + data.nilaiMatematika + data.nilaiIPA).toFixed(2);
        
        // Get file data if available
        const fotoData = document.getElementById('fotoData');
        const ijazahData = document.getElementById('ijazahData');
        const kkData = document.getElementById('kkData');
        
        if (fotoData) data.foto = fotoData.value;
        if (ijazahData) data.ijazah = ijazahData.value;
        if (kkData) data.kk = kkData.value;
        
        // Save to database
        await saveToDatabase(data);
        
        // Clear form draft
        clearFormDraft();
        
        // Reset form
        e.target.reset();
        const totalNilaiInput = document.getElementById('totalNilai');
        if (totalNilaiInput) totalNilaiInput.value = '';
        
        // Clear file previews
        ['fotoPreview', 'ijazahPreview', 'kkPreview'].forEach(id => {
            const previewDiv = document.getElementById(id);
            if (previewDiv) previewDiv.innerHTML = '';
        });
        
        // Clear file data
        ['fotoData', 'ijazahData', 'kkData'].forEach(id => {
            const hiddenInput = document.getElementById(id);
            if (hiddenInput) hiddenInput.remove();
        });
        
        // Show result
        showResult(data);
        
        // Scroll to result
        const resultContainer = document.getElementById('resultContainer');
        if (resultContainer) {
            resultContainer.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
        
        // Show success notification
        showNotification('Pendaftaran berhasil! Data telah tersimpan.', 'success');
        
    } catch (error) {
        console.error('Error submitting form:', error);
        showNotification('Terjadi kesalahan. Silakan coba lagi.', 'error');
    } finally {
        // Restore button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function showResult(data) {
    const resultContainer = document.getElementById('resultContainer');
    const instructionPanel = document.getElementById('instructionPanel');
    
    if (resultContainer) resultContainer.style.display = 'block';
    if (instructionPanel) instructionPanel.style.display = 'none';
    
    const nomorPendaftaranSpan = document.getElementById('nomorPendaftaran');
    if (nomorPendaftaranSpan) {
        nomorPendaftaranSpan.textContent = data.nomorPendaftaran;
    }
    
    const formatTanggal = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };
    
    const resultDiv = document.getElementById('resultData');
    if (resultDiv) {
        // Gunakan tanggalDaftarDisplay jika ada, jika tidak gunakan formatTanggal pada tanggalDaftar
        const tanggalDaftarDisplay = data.tanggalDaftarDisplay || formatTanggal(data.tanggalDaftar);
        
        resultDiv.innerHTML = `
            <div class="result-grid">
                <div class="result-item">
                    <h4><i class="fas fa-user-graduate"></i> Identitas Siswa</h4>
                    <p><strong>No. Pendaftaran:</strong> ${data.nomorPendaftaran}</p>
                    <p><strong>Nama Lengkap:</strong> ${data.nama}</p>
                    <p><strong>NISN:</strong> ${data.nisn}</p>
                    <p><strong>Tempat, Tgl Lahir:</strong> ${data.tempatLahir}, ${formatTanggal(data.tanggalLahir)}</p>
                    <p><strong>Jenis Kelamin:</strong> ${data.jenisKelamin}</p>
                    <p><strong>Usia:</strong> ${data.usia} tahun</p>
                    <p><strong>Anak Ke:</strong> ${data.anakKe}</p>
                    <p><strong>Alamat:</strong> ${data.alamat}</p>
                    <p><strong>Telepon:</strong> ${data.telepon}</p>
                </div>
                
                <div class="result-item">
                    <h4><i class="fas fa-school"></i> Sekolah Asal & Nilai</h4>
                    <p><strong>Sekolah Asal:</strong> ${data.asalSekolah}</p>
                    <p><strong>Alamat Sekolah:</strong> ${data.alamatSekolahAsal}</p>
                    <p><strong>No. Peserta UN:</strong> ${data.noPesertaUN}</p>
                    <p><strong>No. Seri Ijazah:</strong> ${data.noSeriIjazah}</p>
                    <hr style="margin: 10px 0; border-color: #eee;">
                    <p><strong>Nilai SKHUN:</strong></p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                        <div>Bahasa Indonesia:</div>
                        <div style="text-align: right; font-weight: bold;">${data.nilaiBindo}</div>
                        <div>Bahasa Inggris:</div>
                        <div style="text-align: right; font-weight: bold;">${data.nilaiBing}</div>
                        <div>Matematika:</div>
                        <div style="text-align: right; font-weight: bold;">${data.nilaiMatematika}</div>
                        <div>IPA:</div>
                        <div style="text-align: right; font-weight: bold;">${data.nilaiIPA}</div>
                    </div>
                    <hr style="margin: 10px 0; border-color: #eee;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold;">
                        <div>Total Nilai:</div>
                        <div style="color: #1a73e8;">${data.totalNilai}</div>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <div>Rata-rata:</div>
                        <div style="color: #4caf50; font-weight: bold;">${(parseFloat(data.totalNilai) / 4).toFixed(2)}</div>
                    </div>
                </div>
                
                <div class="result-item">
                    <h4><i class="fas fa-users"></i> Data Orang Tua/Wali</h4>
                    <p><strong>Ayah/Wali:</strong> ${data.namaOrtuWali}</p>
                    <p><strong>Tempat, Tgl Lahir:</strong> ${data.tempatLahirOrtu}, ${formatTanggal(data.tanggalLahirOrtu)}</p>
                    <p><strong>Ibu Kandung:</strong> ${data.namaGadisIbu}</p>
                    <p><strong>Alamat Orang Tua:</strong> ${data.alamatOrtu}</p>
                    <p><strong>Pekerjaan Ayah:</strong> ${data.pekerjaanOrtu}</p>
                    <p><strong>Pendidikan Ayah:</strong> ${data.pendidikanOrtu}</p>
                    <p><strong>Telepon Orang Tua:</strong> ${data.teleponOrtu}</p>
                </div>
                
                <div class="result-item">
                    <h4><i class="fas fa-graduation-cap"></i> Program Keahlian</h4>
                    <p><strong>Jurusan Pilihan:</strong> ${data.pilihanJurusan}</p>
                    <p><strong>Tanggal Daftar:</strong> ${tanggalDaftarDisplay}</p>
                    <p><strong>Status:</strong> <span style="color: #4caf50; font-weight: bold;">${data.status}</span></p>
                    <hr style="margin: 15px 0;">
                    <div style="margin-top: 20px;">
                        <p style="color: #666; font-size: 0.9rem;">
                            <i class="fas fa-info-circle"></i> Simpan nomor pendaftaran ini untuk keperluan verifikasi dan tes seleksi.
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="alert alert-success" style="margin-top: 20px;">
                <i class="fas fa-check-circle"></i>
                <div>
                    <strong>Pendaftaran berhasil!</strong><br>
                    Silakan datang ke sekolah pada tanggal tes seleksi dengan membawa:
                    1. Bukti pendaftaran ini (dicetak), 2. Fotokopi ijazah, 3. Fotokopi KK, 4. Pas foto 3x4.
                </div>
            </div>
        `;
    }
    
    sessionStorage.setItem('currentRegistration', JSON.stringify(data));
}

function printFormulir() {
    const savedData = sessionStorage.getItem('currentRegistration');
    if (!savedData) {
        alert('Tidak ada data pendaftaran untuk dicetak!');
        return;
    }
    
    try {
        const data = JSON.parse(savedData);
        const printWindow = window.open('', '_blank');
        
        // Gunakan tanggalDaftarDisplay jika ada, jika tidak gunakan format tanggal biasa
        const tanggalDaftarDisplay = data.tanggalDaftarDisplay || new Date(data.tanggalDaftar).toLocaleString('id-ID');
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Bukti Pendaftaran SPMB - ${data.nomorPendaftaran}</title>
                    <style>
                        body { 
                            font-family: 'Arial', sans-serif; 
                            line-height: 1.6; 
                            color: #333;
                            padding: 20px;
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        .header { 
                            text-align: center; 
                            border-bottom: 3px solid #1a237e;
                            padding-bottom: 20px;
                            margin-bottom: 30px;
                        }
                        .header h1 { 
                            color: #1a237e; 
                            margin-bottom: 10px;
                        }
                        .header h2 { 
                            color: #0d47a1; 
                            margin-bottom: 5px;
                        }
                        .content { 
                            margin: 20px 0; 
                        }
                        .section { 
                            margin-bottom: 25px; 
                            padding-bottom: 15px;
                            border-bottom: 1px solid #eee;
                        }
                        .section h3 { 
                            color: #1a237e; 
                            background: #f5f9ff;
                            padding: 10px;
                            border-left: 4px solid #1a73e8;
                            margin-bottom: 15px;
                        }
                        .info-grid { 
                            display: grid; 
                            grid-template-columns: repeat(2, 1fr); 
                            gap: 10px;
                        }
                        .info-item { margin-bottom: 8px; }
                        .info-label { 
                            font-weight: bold; 
                            color: #555;
                            display: inline-block;
                            width: 150px;
                        }
                        .footer { 
                            text-align: center; 
                            margin-top: 40px;
                            padding-top: 20px;
                            border-top: 2px solid #eee;
                            color: #666;
                            font-size: 0.9rem;
                        }
                        @media print {
                            body { padding: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>BUKTI PENDAFTARAN SPMB</h1>
                        <h2>SMK DARUL KAMAL NW KEMBANG KERANG</h2>
                        <p>Terakreditasi B • Tahun Ajaran 2026/2027</p>
                        <div style="background: #1a73e8; color: white; padding: 10px 20px; display: inline-block; border-radius: 5px; margin-top: 10px;">
                            <strong>NO. PENDAFTARAN: ${data.nomorPendaftaran}</strong>
                        </div>
                    </div>
                    
                    <div class="content">
                        <div class="section">
                            <h3>IDENTITAS PENDAFTAR</h3>
                            <div class="info-grid">
                                <div class="info-item"><span class="info-label">Nama Lengkap:</span> ${data.nama}</div>
                                <div class="info-item"><span class="info-label">NISN:</span> ${data.nisn}</div>
                                <div class="info-item"><span class="info-label">Tempat, Tgl Lahir:</span> ${data.tempatLahir}, ${new Date(data.tanggalLahir).toLocaleDateString('id-ID')}</div>
                                <div class="info-item"><span class="info-label">Jenis Kelamin:</span> ${data.jenisKelamin}</div>
                                <div class="info-item"><span class="info-label">Alamat:</span> ${data.alamat}</div>
                                <div class="info-item"><span class="info-label">Telepon:</span> ${data.telepon}</div>
                            </div>
                        </div>
                        
                        <div class="section">
                            <h3>SEKOLAH ASAL & NILAI</h3>
                            <div class="info-grid">
                                <div class="info-item"><span class="info-label">Sekolah Asal:</span> ${data.asalSekolah}</div>
                                <div class="info-item"><span class="info-label">No. Peserta UN:</span> ${data.noPesertaUN}</div>
                                <div class="info-item"><span class="info-label">No. Seri Ijazah:</span> ${data.noSeriIjazah}</div>
                                <div class="info-item"><span class="info-label">Total Nilai SKHUN:</span> ${data.totalNilai}</div>
                            </div>
                        </div>
                        
                        <div class="section">
                            <h3>PROGRAM KEAHLIAN</h3>
                            <div class="info-grid">
                                <div class="info-item"><span class="info-label">Jurusan Pilihan:</span> ${data.pilihanJurusan}</div>
                                <div class="info-item"><span class="info-label">Tanggal Daftar:</span> ${tanggalDaftarDisplay}</div>
                                <div class="info-item"><span class="info-label">Status:</span> ${data.status}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Dokumen ini sah sebagai bukti pendaftaran SPMB SMK Darul Kamal NW Kembang Kerang</p>
                        <p>Harap hadir pada tanggal tes seleksi dengan membawa dokumen asli untuk verifikasi</p>
                        <p style="margin-top: 20px;"><strong>TTD Panitia SPMB</strong></p>
                        <div style="height: 50px; margin-top: 10px;"></div>
                        <p>(__________________________)</p>
                    </div>
                    
                    <div class="no-print" style="text-align: center; margin-top: 30px;">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #1a73e8; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Cetak Dokumen
                        </button>
                        <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                            Tutup
                        </button>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    } catch (error) {
        console.error('Error printing formulir:', error);
        alert('Terjadi kesalahan saat mencetak formulir.');
    }
}

function printAllDocuments() {
    alert('Fitur ini akan mencetak semua dokumen pendaftaran termasuk formulir dan dokumen pendukung.');
    printFormulir();
}

function editFormData() {
    const resultContainer = document.getElementById('resultContainer');
    const instructionPanel = document.getElementById('instructionPanel');
    
    if (resultContainer) resultContainer.style.display = 'none';
    if (instructionPanel) instructionPanel.style.display = 'block';
    
    const savedData = sessionStorage.getItem('currentRegistration');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            
            Object.keys(data).forEach(key => {
                const element = document.getElementById(key);
                if (element && data[key] && !['foto', 'ijazah', 'kk', 'tanggalDaftar', 'tanggalDaftarDisplay'].includes(key)) {
                    element.value = data[key];
                }
            });
            
            const nilaiInputs = ['nilaiBindo', 'nilaiBing', 'nilaiMatematika', 'nilaiIPA'];
            nilaiInputs.forEach(id => {
                const input = document.getElementById(id);
                if (input && input.value) {
                    input.dispatchEvent(new Event('input'));
                }
            });
        } catch (error) {
            console.error('Error loading saved data for edit:', error);
        }
    }
    
    const form = document.getElementById('ppdbForm');
    if (form) {
        form.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
    
    showNotification('Silakan edit data Anda. Setelah selesai, klik Kirim Pendaftaran kembali.', 'info');
}

function downloadBuktiPendaftaran() {
    const savedData = sessionStorage.getItem('currentRegistration');
    if (!savedData) {
        alert('Tidak ada data pendaftaran untuk diunduh!');
        return;
    }
    
    try {
        const data = JSON.parse(savedData);
        
        // Gunakan tanggalDaftarDisplay jika ada
        const tanggalDaftarDisplay = data.tanggalDaftarDisplay || 
            new Date(data.tanggalDaftar).toLocaleString('id-ID');
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Bukti Pendaftaran SPMB - ${data.nomorPendaftaran}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; }
                    .header { text-align: center; border-bottom: 3px solid #1a237e; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { color: #1a237e; }
                    .section { margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #eee; }
                    .section h3 { color: #1a237e; background: #f5f9ff; padding: 10px; border-left: 4px solid #1a73e8; }
                    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
                    .info-item { margin-bottom: 8px; }
                    .info-label { font-weight: bold; color: #555; display: inline-block; width: 150px; }
                    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>BUKTI PENDAFTARAN SPMB</h1>
                    <h2>SMK DARUL KAMAL NW KEMBANG KERANG</h2>
                    <p>Terakreditasi B • Tahun Ajaran 2026/2027</p>
                    <p><strong>NO. PENDAFTARAN: ${data.nomorPendaftaran}</strong></p>
                </div>
                
                <div class="section">
                    <h3>IDENTITAS PENDAFTAR</h3>
                    <div class="info-grid">
                        <div class="info-item"><span class="info-label">Nama Lengkap:</span> ${data.nama}</div>
                        <div class="info-item"><span class="info-label">NISN:</span> ${data.nisn}</div>
                        <div class="info-item"><span class="info-label">Tempat, Tgl Lahir:</span> ${data.tempatLahir}, ${new Date(data.tanggalLahir).toLocaleDateString('id-ID')}</div>
                        <div class="info-item"><span class="info-label">Jenis Kelamin:</span> ${data.jenisKelamin}</div>
                        <div class="info-item"><span class="info-label">Alamat:</span> ${data.alamat}</div>
                        <div class="info-item"><span class="info-label">Telepon:</span> ${data.telepon}</div>
                    </div>
                </div>
                
                <div class="section">
                    <h3>SEKOLAH ASAL & NILAI</h3>
                    <div class="info-grid">
                        <div class="info-item"><span class="info-label">Sekolah Asal:</span> ${data.asalSekolah}</div>
                        <div class="info-item"><span class="info-label">No. Peserta UN:</span> ${data.noPesertaUN}</div>
                        <div class="info-item"><span class="info-label">No. Seri Ijazah:</span> ${data.noSeriIjazah}</div>
                        <div class="info-item"><span class="info-label">Total Nilai SKHUN:</span> ${data.totalNilai}</div>
                    </div>
                </div>
                
                <div class="section">
                    <h3>PROGRAM KEAHLIAN</h3>
                    <div class="info-grid">
                        <div class="info-item"><span class="info-label">Jurusan Pilihan:</span> ${data.pilihanJurusan}</div>
                        <div class="info-item"><span class="info-label">Tanggal Daftar:</span> ${tanggalDaftarDisplay}</div>
                        <div class="info-item"><span class="info-label">Status:</span> ${data.status}</div>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Dokumen ini sah sebagai bukti pendaftaran SPMB SMK Darul Kamal NW Kembang Kerang</p>
                    <p>Harap hadir pada tanggal tes seleksi dengan membawa dokumen asli untuk verifikasi</p>
                    <p><strong>TTD Panitia SPMB</strong></p>
                    <p>(__________________________)</p>
                </div>
            </body>
            </html>
        `;
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Bukti_Pendaftaran_${data.nomorPendaftaran}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Bukti pendaftaran berhasil diunduh!', 'success');
    } catch (error) {
        console.error('Error downloading bukti pendaftaran:', error);
        showNotification('Gagal mengunduh bukti pendaftaran!', 'error');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <div>${message}</div>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; margin-left: 10px;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

window.addEventListener('resize', function() {
    if (window.innerWidth >= 768) {
        const menuBtn = document.getElementById('mobileMenuBtn');
        if (menuBtn) {
            menuBtn.remove();
        }
        
        const nav = document.querySelector('.nav-links');
        if (nav) {
            nav.style.display = 'flex';
            nav.style.cssText = '';
        }
    } else {
        setupMobileMenu();
    }
});

document.addEventListener('click', function(event) {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const nav = document.querySelector('.nav-links');
    
    if (window.innerWidth < 768 && menuBtn && nav && nav.style.display === 'flex') {
        if (!nav.contains(event.target) && !menuBtn.contains(event.target)) {
            nav.style.display = 'none';
        }
    }
});

window.removeFile = removeFile;
window.previewFile = previewFile;