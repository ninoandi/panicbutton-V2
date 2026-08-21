import { db2 } from './firebase-config.js';
import { ref, onValue, push, set, update, remove, get } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


// ======================================================
// ELEMENT DOM
// ======================================================

const cardContainer = document.getElementById("cardContainerPublic");
const searchInput = document.getElementById("searchInputPublic");
const statusFilter = document.getElementById("statusFilter"); // Role filter

const totalUserCount = document.getElementById("totalPublicUserCount");
const totalActiveUserCount = document.getElementById("totalActiveUserCount");
const totalAdminUserCount = document.getElementById("totalAdminUserCount");

const prevPage = document.getElementById("prevPagePublic");
const nextPage = document.getElementById("nextPagePublic");
const paginationInfo = document.getElementById("paginationInfoPublic");

// Modal Elements
const modal = document.getElementById("addUserPublicModal");
const openModalBtn = document.getElementById("openAddUserPublicModal");
const closeModalBtn = document.getElementById("closePublicModal");
const cancelBtn = document.getElementById("cancelPublicBtn");
const saveBtn = document.getElementById("saveUserPublicBtn");
const modalTitle = document.getElementById("modalTitle");
const saveBtnText = document.getElementById("saveBtnText");

// Form Elements
const nameInput = document.getElementById("userPublicName");
const usernameInput = document.getElementById("userPublicUsername");
const emailInput = document.getElementById("userPublicEmail");
const phoneInput = document.getElementById("userPublicPhone");
const deviceSelect = document.getElementById("userPublicDevice");
const zonaInput = document.getElementById("userPublicZona");
const statusSelect = document.getElementById("userPublicStatus");


// ======================================================
// DATA & PAGINATION
// ======================================================

let allUsers = [];
let filteredUsers = [];
let devicesList = [];
let currentUserRole = null;
let editingUserId = null;

let currentPage = 1;
const usersPerPage = 9;


// ======================================================
// AMBIL ROLE USER YANG LOGIN
// ======================================================

function getCurrentUserRole() {
    console.log('🔍 getCurrentUserRole() dipanggil');
    
    if (window.currentUser && window.currentUser.role) {
        currentUserRole = window.currentUser.role.toLowerCase();
        console.log('✅ Role dari window.currentUser:', currentUserRole);
    } else {
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                currentUserRole = parsed.role ? parsed.role.toLowerCase() : 'user';
                console.log('✅ Role dari localStorage:', currentUserRole);
            } catch (e) {
                currentUserRole = 'user';
                console.log('⚠️ Gagal parse localStorage, default user');
            }
        } else {
            currentUserRole = 'user';
            console.log('⚠️ Tidak ada data user, default user');
        }
    }
    console.log('✅ Final currentUserRole:', currentUserRole);
    return currentUserRole;
}


// ======================================================
// HELPER: ESCAPE HTML
// ======================================================

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ======================================================
// FIREBASE REFERENCES (DB2)
// ======================================================

const usersRef = ref(db2, "users");
const devicesRef = ref(db2, "panicChannels");


// ======================================================
// CEK APAKAH USER ADALAH ADMIN
// ======================================================

function isAdmin() {
    return currentUserRole === 'admin';
}


// ======================================================
// AMBIL DATA USER DARI DB2
// ======================================================

function loadUsers() {
    onValue(usersRef, (snapshot) => {
        const data = snapshot.val() || {};
        
        allUsers = Object.entries(data).map(([id, user]) => ({
            id: id,
            ...user,
            name: user.name || user.nama || 'Tidak Diketahui',
            username: user.username || '-',
            email: user.email || '-',
            phone: user.phone || user.phoneNumber || '-',
            gender: user.gender || user.jenis_kelamin || '-',
            role: user.role || 'user',
            assigned_device: user.assigned_device || user.device_id || '-',
            assigned_zone: user.assigned_zone || '-',
            status: user.status || 'active',
            created_at: user.created_at || user.createdAt || Date.now()
        }));
        
        updateSummaryMetrics();
        applyFilters();
        
        console.log(`Total user publik dari DB2: ${allUsers.length}`);
        
    }, (error) => {
        console.error('Error loading users from DB2:', error);
        if (cardContainer) {
            cardContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; color: var(--dash-text-muted); padding: 50px 20px;">
                    <i class="fa-solid fa-circle-exclamation" style="font-size: 40px; color: #d93025; margin-bottom: 12px; display: block;"></i>
                    <p style="font-size: 15px; font-weight: 700; margin: 0 0 4px; color: var(--dash-text-main);">Gagal Memuat Data</p>
                    <span style="font-size: 13px;">${error.message}</span>
                </div>
            `;
        }
    });
}


// ======================================================
// AMBIL DATA PERANGKAT DARI DB2 UNTUK DROPDOWN
// ======================================================

function loadDevices() {
    onValue(devicesRef, (snapshot) => {
        const data = snapshot.val() || {};
        devicesList = [];
        const deviceOptions = new Set();
        
        Object.entries(data).forEach(([zoneName, zoneData]) => {
            if (zoneData && typeof zoneData === 'object') {
                Object.entries(zoneData).forEach(([deviceKey, deviceData]) => {
                    if (deviceData && typeof deviceData === 'object') {
                        const deviceName = deviceData.device || deviceKey;
                        if (!deviceOptions.has(deviceName)) {
                            deviceOptions.add(deviceName);
                            devicesList.push({
                                key: deviceKey,
                                name: deviceName,
                                zone: zoneName,
                                lokasi: deviceData.lokasi || '-',
                                online: deviceData.online !== false,
                                active: deviceData.active === true,
                                ...deviceData
                            });
                        }
                    }
                });
            }
        });
        
        populateDeviceSelect();
        
        console.log(`Total perangkat IoT: ${devicesList.length}`);
    }, (error) => {
        console.error('Error loading devices:', error);
    });
}


// ======================================================
// POPULATE DEVICE SELECT
// ======================================================

function populateDeviceSelect() {
    if (!deviceSelect) return;
    
    const currentValue = deviceSelect.value;
    deviceSelect.innerHTML = '<option value="">-- Pilih Perangkat --</option>';
    
    devicesList.sort((a, b) => a.name.localeCompare(b.name));
    
    devicesList.forEach(device => {
        const option = document.createElement('option');
        option.value = device.name;
        const statusText = device.online !== false ? '🟢 Online' : '🔴 Offline';
        const activeText = device.active === true ? ' ⚠️ ACTIVE' : '';
        option.textContent = `${device.name} (${device.zone} - ${device.lokasi}) ${statusText}${activeText}`;
        // Simpan data zone di option
        option.dataset.zone = device.zone || '';
        deviceSelect.appendChild(option);
    });
    
    if (currentValue) {
        deviceSelect.value = currentValue;
        // Auto-fill zona jika ada nilai default
        setTimeout(autoFillZona, 100);
    }
}


// ======================================================
// UPDATE SUMMARY METRICS
// ======================================================

function updateSummaryMetrics() {
    const total = allUsers.length;
    const admin = allUsers.filter(u => u.role === 'admin').length;
    const user = allUsers.filter(u => u.role === 'user').length;
    
    if (totalUserCount) totalUserCount.textContent = total.toLocaleString("id-ID");
    if (totalActiveUserCount) totalActiveUserCount.textContent = user.toLocaleString("id-ID");
    if (totalAdminUserCount) totalAdminUserCount.textContent = admin.toLocaleString("id-ID");
}


// ======================================================
// RENDER USER CARD GRID
// ======================================================

function renderCards(users) {
    if (!cardContainer) return;
    
    cardContainer.innerHTML = "";
    
    if (users.length === 0) {
        cardContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--dash-text-muted); padding: 50px 20px;">
                <i class="fa-solid fa-user-slash" style="font-size: 40px; margin-bottom: 12px; opacity: 0.6; display: block;"></i>
                <p style="font-size: 15px; font-weight: 700; margin: 0 0 4px; color: var(--dash-text-main);">Tidak ada data user publik ditemukan.</p>
                <span style="font-size: 13px;">Coba sesuaikan kata kunci pencarian atau filter yang dipilih.</span>
            </div>
        `;
        return;
    }
    
    users.forEach((user, index) => {
        const card = document.createElement("div");
        card.className = "user-card";
        
        const isAdminUser = user.role === 'admin';
        
        let roleLabel = "USER";
        let roleBadgeClass = "user";
        if (isAdminUser) {
            roleLabel = "ADMIN";
            roleBadgeClass = "admin";
        }
        
        const initial = (user.name && user.name.trim().length > 0)
            ? user.name.trim().charAt(0).toUpperCase()
            : "U";
        
        const globalIndex = (currentPage - 1) * usersPerPage + index + 1;
        
        const deviceDisplay = user.assigned_device && user.assigned_device !== '-' 
            ? `<span style="color: var(--dash-primary); font-weight: 600;">${escapeHtml(user.assigned_device)}</span>`
            : '<span style="color: var(--dash-text-muted); font-style: italic;">Belum terdaftar</span>';
        
        const zoneDisplay = user.assigned_zone && user.assigned_zone !== '-' 
            ? escapeHtml(user.assigned_zone)
            : '-';
        
        card.innerHTML = `
            <div class="user-card-header">
                <div class="user-profile-meta">
                    <div class="user-avatar">
                        ${escapeHtml(initial)}
                    </div>
                    <div class="user-title-group">
                        <h3 class="user-name-title" title="${escapeHtml(user.name || "-")}">
                            ${escapeHtml(user.name || "-")}
                        </h3>
                        <span class="user-index-tag">User Publik #${globalIndex}</span>
                    </div>
                </div>
                <span class="role-badge ${roleBadgeClass}">
                    ${roleLabel}
                </span>
            </div>
            
            <div class="user-card-body">
                <div class="user-detail-row">
                    <i class="fa-solid fa-envelope"></i>
                    <div class="user-detail-text">
                        <span class="user-detail-label">Email</span>
                        <strong class="user-detail-value">${escapeHtml(user.email || "-")}</strong>
                    </div>
                </div>
                
                <div class="user-detail-row">
                    <i class="fa-solid fa-phone"></i>
                    <div class="user-detail-text">
                        <span class="user-detail-label">Nomor Telepon</span>
                        <strong class="user-detail-value">${escapeHtml(user.phone || "-")}</strong>
                    </div>
                </div>
                
                <div class="user-detail-row">
                    <i class="fa-solid fa-venus-mars"></i>
                    <div class="user-detail-text">
                        <span class="user-detail-label">Gender</span>
                        <strong class="user-detail-value">${escapeHtml(user.gender || "-")}</strong>
                    </div>
                </div>
                
                <div class="user-detail-row" style="background: var(--dash-primary-bg); border-left: 3px solid var(--dash-primary);">
                    <i class="fa-solid fa-microchip" style="color: var(--dash-primary);"></i>
                    <div class="user-detail-text">
                        <span class="user-detail-label">Perangkat IoT</span>
                        <strong class="user-detail-value" style="color: var(--dash-primary);">
                            ${deviceDisplay}
                        </strong>
                    </div>
                </div>
                
                <div class="user-detail-row" style="background: var(--dash-primary-bg); border-left: 3px solid var(--dash-primary);">
                    <i class="fa-solid fa-location-dot" style="color: var(--dash-primary);"></i>
                    <div class="user-detail-text">
                        <span class="user-detail-label">Zona</span>
                        <strong class="user-detail-value" style="color: var(--dash-primary);">
                            ${zoneDisplay}
                        </strong>
                    </div>
                </div>
            </div>
            
            <div class="user-card-footer">
                <button class="btn-card-action btn-card-edit" onclick="window.editUser('${user.id}')">
                    <i class="fa-solid fa-pen"></i> Edit
                </button>
                <button class="btn-card-action btn-card-delete" onclick="window.deleteUser('${user.id}')">
                    <i class="fa-solid fa-trash"></i> Hapus
                </button>
            </div>
        `;
        
        cardContainer.appendChild(card);
    });
}


// ======================================================
// FILTER DATA
// ======================================================

function applyFilters() {
    const role = (statusFilter?.value || "").trim().toLowerCase();
    const keyword = (searchInput?.value || "").trim().toLowerCase();
    
    filteredUsers = allUsers.filter((user) => {
        const userRole = (user.role || "user").toLowerCase();
        const userName = (user.name || "").toLowerCase();
        const userEmail = (user.email || "").toLowerCase();
        const userPhone = (user.phone || "").toString().toLowerCase();
        const userUsername = (user.username || "").toLowerCase();
        const userGender = (user.gender || "").toLowerCase();
        const userDevice = (user.assigned_device || "").toLowerCase();
        const userZone = (user.assigned_zone || "").toLowerCase();
        
        let matchesRole = true;
        if (role === 'user') {
            matchesRole = userRole === 'user';
        } else if (role === 'admin') {
            matchesRole = userRole === 'admin';
        }
        
        const matchesSearch = 
            keyword === "" ||
            userName.includes(keyword) ||
            userEmail.includes(keyword) ||
            userPhone.includes(keyword) ||
            userUsername.includes(keyword) ||
            userGender.includes(keyword) ||
            userDevice.includes(keyword) ||
            userZone.includes(keyword);
        
        return matchesRole && matchesSearch;
    });
    
    currentPage = 1;
    updatePagination();
}


// ======================================================
// PAGINATION
// ======================================================

function updatePagination() {
    const totalItems = filteredUsers.length;
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = Math.min(startIndex + usersPerPage, totalItems);
    
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    renderCards(paginatedUsers);
    
    if (paginationInfo) {
        paginationInfo.textContent = `Menampilkan ${totalItems === 0 ? 0 : startIndex + 1} - ${endIndex} dari ${totalItems} data user publik`;
    }
    
    if (prevPage) prevPage.disabled = currentPage === 1;
    if (nextPage) nextPage.disabled = endIndex >= totalItems;
}


// ======================================================
// AUTO-FILL ZONA
// ======================================================

function autoFillZona() {
    if (deviceSelect && deviceSelect.value && zonaInput) {
        const selectedDevice = devicesList.find(device => device.name === deviceSelect.value);
        if (selectedDevice && selectedDevice.zone) {
            zonaInput.value = selectedDevice.zone;
            console.log(`✅ Zona otomatis terisi: ${selectedDevice.zone}`);
            
            // Efek visual
            zonaInput.style.borderColor = 'var(--dash-success)';
            zonaInput.style.backgroundColor = 'var(--dash-success-bg)';
            setTimeout(() => {
                zonaInput.style.borderColor = '';
                zonaInput.style.backgroundColor = '';
            }, 1500);
        }
    }
}


// ======================================================
// MODAL FUNCTIONS
// ======================================================

function openModal() {
    console.log('🔵🔵🔵 openModal() DIPANGGIL! 🔵🔵🔵');
    
    if (!isAdmin()) {
        console.log('❌ Bukan admin');
        Swal.fire({
            icon: 'error',
            title: 'Akses Ditolak',
            text: 'Hanya admin yang dapat menambah user!'
        });
        return;
    }
    
    console.log('✅ Admin, membuka modal...');
    
    editingUserId = null;
    if (modalTitle) modalTitle.textContent = 'Tambah User Publik';
    if (saveBtnText) saveBtnText.textContent = 'Simpan User Publik';
    resetForm();
    
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        console.log('✅ Modal dibuka');
        
        // Auto-fill zona setelah modal terbuka
        setTimeout(autoFillZona, 100);
    } else {
        console.error('❌ Modal TIDAK ditemukan!');
        const fallbackModal = document.querySelector('.modal');
        if (fallbackModal) {
            fallbackModal.style.display = 'flex';
            fallbackModal.classList.add('show');
            console.log('✅ Modal ditemukan dengan fallback');
            setTimeout(autoFillZona, 100);
        }
    }
}

function closeModal() {
    console.log('🔴🔴🔴 closeModal() DIPANGGIL! 🔴🔴🔴');
    
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        console.log('✅ Modal ditutup');
    }
    
    resetForm();
    editingUserId = null;
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan User Publik';
        saveBtn.onclick = saveUser;
    }
}

function resetForm() {
    if (nameInput) nameInput.value = '';
    if (usernameInput) usernameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (deviceSelect) deviceSelect.value = '';
    if (zonaInput) zonaInput.value = '';
    if (statusSelect) statusSelect.value = 'user';
}


// ======================================================
// EDIT USER - GLOBAL FUNCTION
// ======================================================

window.editUser = function(userId) {
    console.log('🟡 editUser() dipanggil untuk userId:', userId);
    
    if (!isAdmin()) {
        console.log('❌ Bukan admin');
        Swal.fire({
            icon: 'error',
            title: 'Akses Ditolak',
            text: 'Hanya admin yang dapat mengedit user!'
        });
        return;
    }
    
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        console.log('❌ User tidak ditemukan:', userId);
        Swal.fire({
            icon: 'error',
            title: 'User Tidak Ditemukan',
            text: 'Data user tidak ditemukan di database.'
        });
        return;
    }
    
    if (user.role === 'admin') {
        Swal.fire({
            icon: 'error',
            title: 'Tidak Dapat Mengedit',
            text: 'Tidak dapat mengedit akun admin!'
        });
        return;
    }
    
    console.log('✅ User ditemukan:', user);
    
    editingUserId = userId;
    if (modalTitle) modalTitle.textContent = 'Edit User Publik';
    if (saveBtnText) saveBtnText.textContent = 'Update User';
    
    if (nameInput) nameInput.value = user.name || '';
    if (usernameInput) usernameInput.value = user.username || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (deviceSelect) deviceSelect.value = user.assigned_device || '';
    if (zonaInput) zonaInput.value = user.assigned_zone || '';
    if (statusSelect) statusSelect.value = user.role || 'user';
    
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        console.log('✅ Modal edit dibuka');
        
        // Auto-fill zona setelah modal terbuka
        setTimeout(autoFillZona, 150);
    }
};


// ======================================================
// DELETE USER - GLOBAL FUNCTION
// ======================================================

window.deleteUser = async function(userId) {
    console.log('🔴 deleteUser() dipanggil untuk userId:', userId);
    
    if (!isAdmin()) {
        Swal.fire('Error', 'Hanya admin yang dapat menghapus user!', 'error');
        return;
    }
    
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    if (user.role === 'admin') {
        Swal.fire('Error', 'Tidak dapat menghapus akun admin!', 'error');
        return;
    }
    
    const result = await Swal.fire({
        title: 'Hapus User?',
        text: `Anda yakin ingin menghapus user "${user.name || 'ini'}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
    });
    
    if (result.isConfirmed) {
        try {
            await remove(ref(db2, `users/${userId}`));
            Swal.fire('Berhasil!', 'User publik berhasil dihapus', 'success');
        } catch (error) {
            console.error('Error deleting user:', error);
            Swal.fire('Error', 'Gagal menghapus user: ' + error.message, 'error');
        }
    }
};


// ======================================================
// SAVE USER (TAMBAH / UPDATE)
// ======================================================

async function saveUser() {
    if (!isAdmin()) {
        Swal.fire('Error', 'Hanya admin yang dapat menambahkan user!', 'error');
        return;
    }
    
    const name = nameInput ? nameInput.value.trim() : '';
    const username = usernameInput ? usernameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const device = deviceSelect ? deviceSelect.value : '';
    const zona = zonaInput ? zonaInput.value.trim() : '';
    const status = statusSelect ? statusSelect.value : 'user';
    
    if (!name) {
        Swal.fire('Error', 'Nama lengkap wajib diisi!', 'error');
        return;
    }
    
    try {
        if (editingUserId) {
            const updatedData = {
                name: name,
                username: username || 'user_' + Date.now(),
                email: email || '',
                phone: phone || '',
                assigned_device: device || '',
                assigned_zone: zona || '',
                role: status,
                updated_at: Date.now()
            };
            
            await update(ref(db2, `users/${editingUserId}`), updatedData);
            Swal.fire('Berhasil!', 'User publik berhasil diupdate', 'success');
            
        } else {
            const newUser = {
                name: name,
                username: username || 'user_' + Date.now(),
                email: email || '',
                phone: phone || '',
                gender: '',
                assigned_device: device || '',
                assigned_zone: zona || '',
                role: status,
                status: 'active',
                created_at: Date.now(),
                updated_at: Date.now()
            };
            
            const newRef = push(usersRef);
            await set(newRef, newUser);
            Swal.fire('Berhasil!', 'User publik berhasil ditambahkan', 'success');
        }
        
        closeModal();
        resetForm();
        
    } catch (error) {
        console.error('Error saving user:', error);
        Swal.fire('Error', 'Gagal menyimpan user: ' + error.message, 'error');
    }
}


// ======================================================
// EVENT LISTENERS
// ======================================================

console.log('🔍 Memeriksa element DOM...');

const modalElement = document.getElementById('addUserPublicModal');
const openBtnElement = document.getElementById('openAddUserPublicModal');
const closeBtnElement = document.getElementById('closePublicModal');
const cancelBtnElement = document.getElementById('cancelPublicBtn');
const saveBtnElement = document.getElementById('saveUserPublicBtn');

console.log('modal:', modalElement);
console.log('openModalBtn:', openBtnElement);

// ✅ Tombol Buka Modal
if (openBtnElement) {
    console.log('✅ openModalBtn ditemukan');
    openBtnElement.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🟢🟢🟢 TOMBOL DIKLIK! 🟢🟢🟢');
        openModal();
    });
} else {
    console.error('❌ openModalBtn TIDAK ditemukan!');
}

// ✅ Close button
if (closeBtnElement) {
    closeBtnElement.addEventListener('click', function(e) {
        e.preventDefault();
        closeModal();
    });
}

// ✅ Cancel button
if (cancelBtnElement) {
    cancelBtnElement.addEventListener('click', function(e) {
        e.preventDefault();
        closeModal();
    });
}

// ✅ Modal overlay
if (modalElement) {
    modalElement.addEventListener('click', (e) => {
        if (e.target === modalElement) {
            closeModal();
        }
    });
}

// ✅ Save button
if (saveBtnElement) {
    saveBtnElement.addEventListener('click', function(e) {
        e.preventDefault();
        saveUser();
    });
}

// ======================================================
// ✅ AUTO-FILL ZONA SAAT PERANGKAT DIPILIH
// ======================================================

if (deviceSelect) {
    console.log('✅ Menambahkan event listener untuk auto-fill zona');
    deviceSelect.addEventListener('change', function() {
        const selectedDeviceName = this.value;
        console.log('🔄 Perangkat dipilih:', selectedDeviceName);
        
        if (!selectedDeviceName) {
            if (zonaInput) zonaInput.value = '';
            console.log('ℹ️ Perangkat dihapus, zona dikosongkan');
            return;
        }
        
        const selectedDevice = devicesList.find(device => device.name === selectedDeviceName);
        console.log('📦 Data perangkat ditemukan:', selectedDevice);
        
        if (selectedDevice && selectedDevice.zone) {
            if (zonaInput) {
                zonaInput.value = selectedDevice.zone;
                console.log(`✅ Zona otomatis terisi: ${selectedDevice.zone}`);
                
                zonaInput.style.borderColor = 'var(--dash-success)';
                zonaInput.style.backgroundColor = 'var(--dash-success-bg)';
                setTimeout(() => {
                    zonaInput.style.borderColor = '';
                    zonaInput.style.backgroundColor = '';
                }, 1500);
            }
        } else {
            if (zonaInput) zonaInput.value = '';
            console.warn('⚠️ Zona tidak ditemukan untuk perangkat:', selectedDeviceName);
        }
    });
}

// ✅ Filters
if (searchInput) {
    searchInput.addEventListener('input', () => {
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(applyFilters, 300);
    });
}

if (statusFilter) {
    statusFilter.addEventListener('change', applyFilters);
}

// ✅ Pagination
if (prevPage) {
    prevPage.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

if (nextPage) {
    nextPage.addEventListener('click', () => {
        if (currentPage * usersPerPage < filteredUsers.length) {
            currentPage++;
            updatePagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}


// ======================================================
// INIT
// ======================================================

getCurrentUserRole();
loadUsers();
loadDevices();

console.log("Manajemen User Publik (DB2) initialized.");