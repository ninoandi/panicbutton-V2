import {
    db1,
    db2
} from "./firebase-config.js";

import {
    ref,
    onValue,
    get,
    push,
    set,
    remove,
    update
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


// ======================================================
// ELEMENT DOM
// ======================================================

const cardContainer = document.getElementById("cardContainer");

const perumahanFilter = document.getElementById("perumahanFilter");
const roleFilter = document.getElementById("roleFilter");
const searchInput = document.getElementById("searchInput");

const totalUserCount = document.getElementById("totalUserCount");
const totalWargaCount = document.getElementById("totalWargaCount");
const totalAdminCount = document.getElementById("totalAdminCount");

const addUserModal = document.getElementById("addUserModal");
const openAddUserModal = document.getElementById("openAddUserModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const saveUserBtn = document.getElementById("saveUserBtn");

const perumahanSelect = document.getElementById("perumahanSelect");
const userNameInput = document.getElementById("userName");
const houseNumberInput = document.getElementById("houseNumber");
const passwordInput = document.getElementById("password");
const roleSelect = document.getElementById("roleSelect");
const customRoleInput = document.getElementById("customRoleInput");

// ======================================================
// ELEMENT DOM UNTUK PERANGKAT IOT
// ======================================================

const deviceSelect = document.getElementById("userDeviceSelect");
const zonaInput = document.getElementById("userZonaInput");
const phoneNumberInput = document.getElementById("userPhoneNumber");

const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
const paginationInfo = document.getElementById("paginationInfo");

// ======================================================
// ELEMENT DOM UNTUK MODAL EDIT (BARU)
// ======================================================

const modalTitle = document.getElementById("modalTitle");
const saveBtnText = document.getElementById("saveBtnText");


// ======================================================
// DATA & PAGINATION
// ======================================================

let allUsers = [];
let filteredUsers = [];
let perumahanNames = [];
let devicesList = [];
let editingUserId = null;
let editingPerumahanKey = null;

let currentPage = 1;
const usersPerPage = 9;

// Cache untuk data perumahan
let perumahanCache = null;
let isDataLoaded = false;


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
// FIREBASE REFERENCE
// ======================================================

const daftarPerumahanRef = ref(db1, "daftar_perumahan");
const perumahanRef = ref(db1, "perumahan");
const devicesRef = ref(db2, "panicChannels");


// ======================================================
// AMBIL DAFTAR PERUMAHAN UNTUK MODAL
// ======================================================

function loadPerumahanList() {
    if (perumahanCache) {
        populatePerumahanSelect(perumahanCache);
        return;
    }

    onValue(daftarPerumahanRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            perumahanCache = data;
            populatePerumahanSelect(data);
        }
    });
}

function populatePerumahanSelect(data) {
    if (!perumahanSelect) return;
    
    perumahanSelect.innerHTML = '<option value="">Pilih Perumahan</option>';

    Object.entries(data).forEach(([key, name]) => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = name;
        perumahanSelect.appendChild(option);
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
        option.dataset.zone = device.zone || '';
        deviceSelect.appendChild(option);
    });
    
    if (currentValue) {
        deviceSelect.value = currentValue;
        setTimeout(autoFillZona, 100);
    }
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
// AMBIL DATA USER DARI FIREBASE
// ======================================================

let loadTimeout = null;

function loadUsers() {
    onValue(perumahanRef, (snapshot) => {
        if (loadTimeout) {
            clearTimeout(loadTimeout);
        }
        
        loadTimeout = setTimeout(() => {
            processUserData(snapshot);
            loadTimeout = null;
        }, 300);
    });
}

function processUserData(snapshot) {
    const startTime = performance.now();
    const data = snapshot.val();
    
    allUsers = [];
    const perumahanNamesSet = new Set();
    const userMap = new Map();

    if (data) {
        Object.entries(data).forEach(([perumahanKey, perumahanData]) => {
            const users = perumahanData.users || {};
            const perumahanName = perumahanData.info?.nama || perumahanKey;

            Object.entries(users).forEach(([userId, userInfo]) => {
                const userKey = `${perumahanKey}_${userId}`;
                if (!userMap.has(userKey)) {
                    userMap.set(userKey, {
                        id: userId,
                        ...userInfo,
                        perumahanKey,
                        perumahanName
                    });
                    perumahanNamesSet.add(perumahanName);
                }
            });
        });
        
        allUsers = Array.from(userMap.values());
        perumahanNames = Array.from(perumahanNamesSet);
    }

    updateSummaryMetrics();
    populatePerumahanOptions(perumahanNames);
    applyFilters();
    
    isDataLoaded = true;
    
    const endTime = performance.now();
    console.log(`Data user loaded in ${(endTime - startTime).toFixed(2)}ms, total: ${allUsers.length} users`);
}


// ======================================================
// UPDATE SUMMARY METRICS
// ======================================================

function updateSummaryMetrics() {
    const total = allUsers.length;
    let adminCount = 0;
    
    for (let i = 0; i < allUsers.length; i++) {
        if ((allUsers[i].role || "").toLowerCase() === "admin") {
            adminCount++;
        }
    }
    
    const wargaCount = total - adminCount;

    if (totalUserCount) totalUserCount.textContent = total.toLocaleString("id-ID");
    if (totalWargaCount) totalWargaCount.textContent = wargaCount.toLocaleString("id-ID");
    if (totalAdminCount) totalAdminCount.textContent = adminCount.toLocaleString("id-ID");
}


// ======================================================
// DROPDOWN FILTER PERUMAHAN
// ======================================================

function populatePerumahanOptions(names) {
    if (!perumahanFilter) return;

    const currentSelection = perumahanFilter.value;
    perumahanFilter.innerHTML = '<option value="">Semua Perumahan</option>';

    names.sort().forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        perumahanFilter.appendChild(option);
    });

    if (names.includes(currentSelection)) {
        perumahanFilter.value = currentSelection;
    }
}


// ======================================================
// RENDER USER CARD GRID (DENGAN PASSWORD HIDDEN)
// ======================================================

function renderCards(users) {
    if (!cardContainer) return;

    if (users.length === 0) {
        cardContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--dash-text-muted); padding: 50px 20px;">
                <i class="fa-solid fa-user-slash" style="font-size: 40px; margin-bottom: 12px; opacity: 0.6; display: block;"></i>
                <p style="font-size: 15px; font-weight: 700; margin: 0 0 4px; color: var(--dash-text-main);">Tidak ada data pengguna ditemukan.</p>
                <span style="font-size: 13px;">Coba sesuaikan kata kunci pencarian atau filter yang dipilih.</span>
            </div>
        `;
        return;
    }

    const cardHtml = [];
    const startIndex = (currentPage - 1) * usersPerPage;
    
    users.forEach((user, index) => {
        const role = (user.role || "").toLowerCase();
        const isAdmin = role === "admin";
        const isUser = role === "user" || role === "";

        let roleLabel = "WARGA";
        let roleBadgeClass = "user";
        if (isAdmin) {
            roleLabel = "ADMIN / SATPAM";
            roleBadgeClass = "admin";
        } else if (!isUser) {
            roleLabel = role.toUpperCase();
            roleBadgeClass = "unknown";
        }

        const initial = (user.name && user.name.trim().length > 0)
            ? user.name.trim().charAt(0).toUpperCase()
            : "U";

        const globalIndex = startIndex + index + 1;

        const deviceDisplay = user.assigned_device && user.assigned_device !== '-' 
            ? `<span style="color: var(--dash-primary); font-weight: 600;">${escapeHtml(user.assigned_device)}</span>`
            : '<span style="color: var(--dash-text-muted); font-style: italic;">Belum terdaftar</span>';
        
        const zoneDisplay = user.assigned_zone && user.assigned_zone !== '-' 
            ? escapeHtml(user.assigned_zone)
            : '-';

        // ================================================
        // BAGIAN PASSWORD - TERSEMBUNYI DENGAN TOGGLE
        // ================================================
        const passwordId = `pass_${user.perumahanKey}_${user.id}`;
        const hasPassword = user.password && user.password !== '-';

        cardHtml.push(`
            <div class="user-card ${isAdmin ? "admin-card" : "user-card-role"}">
                <div class="user-card-header">
                    <div class="user-profile-meta">
                        <div class="user-avatar">
                            ${escapeHtml(initial)}
                        </div>
                        <div class="user-title-group">
                            <h3 class="user-name-title" title="${escapeHtml(user.name || "-")}">
                                ${escapeHtml(user.name || "-")}
                            </h3>
                            <span class="user-index-tag">Pengguna #${globalIndex}</span>
                        </div>
                    </div>
                    <span class="role-badge ${roleBadgeClass}">
                        ${roleLabel}
                    </span>
                </div>

                <div class="user-card-body">
                    <div class="user-detail-row">
                        <i class="fa-solid fa-house-chimney"></i>
                        <div class="user-detail-text">
                            <span class="user-detail-label">Nomor Rumah</span>
                            <strong class="user-detail-value">${escapeHtml(user.houseNumber || "-")}</strong>
                        </div>
                    </div>

                    <div class="user-detail-row">
                        <i class="fa-solid fa-phone"></i>
                        <div class="user-detail-text">
                            <span class="user-detail-label">Nomor HP / WhatsApp</span>
                            <strong class="user-detail-value">${escapeHtml(user.phoneNumber || "-")}</strong>
                        </div>
                    </div>

                    <!-- ========================================== -->
                    <!-- PASSWORD - TERSEMBUNYI (HIDDEN) -->
                    <!-- ========================================== -->
                    <div class="user-detail-row">
                        <i class="fa-solid fa-key"></i>
                        <div class="user-detail-text">
                            <span class="user-detail-label">Password Akun</span>
                            <strong class="user-detail-value user-password-wrapper">
                                <span class="password-hidden" id="${passwordId}">
                                    ${hasPassword ? '••••••••' : '-'}
                                </span>
                                ${hasPassword ? `
                                    <button class="password-toggle-btn" 
                                            onclick="window.togglePassword('${passwordId}', '${escapeHtml(user.password)}')" 
                                            title="Klik untuk melihat password">
                                        <i class="fa-solid fa-eye"></i>
                                    </button>
                                ` : ''}
                            </strong>
                        </div>
                    </div>

                    <div class="user-detail-row">
                        <i class="fa-solid fa-microchip" style="color: var(--dash-primary);"></i>
                        <div class="user-detail-text">
                            <span class="user-detail-label">Perangkat IoT</span>
                            <strong class="user-detail-value" style="color: var(--dash-primary);">
                                ${deviceDisplay}
                            </strong>
                        </div>
                    </div>

                    <div class="user-detail-row">
                        <i class="fa-solid fa-location-dot" style="color: var(--dash-primary);"></i>
                        <div class="user-detail-text">
                            <span class="user-detail-label">Zona</span>
                            <strong class="user-detail-value" style="color: var(--dash-primary);">
                                ${zoneDisplay}
                            </strong>
                        </div>
                    </div>

                    <div class="user-detail-row">
                        <i class="fa-solid fa-building-shield"></i>
                        <div class="user-detail-text">
                            <span class="user-detail-label">Area Perumahan</span>
                            <strong class="user-detail-value">${escapeHtml(user.perumahanName || "-")}</strong>
                        </div>
                    </div>
                </div>

                <div class="user-card-footer">
                    <button class="btn-card-action btn-card-edit" onclick="window.editUser('${user.perumahanKey}', '${user.id}')">
                        <i class="fa-solid fa-pen"></i> Edit
                    </button>
                    <button class="btn-card-action btn-card-delete" onclick="window.deleteUser('${user.perumahanKey}', '${user.id}')">
                        <i class="fa-solid fa-trash"></i> Hapus
                    </button>
                </div>
            </div>
        `);
    });

    cardContainer.innerHTML = cardHtml.join("");
}

// ======================================================
// TOGGLE PASSWORD SHOW/HIDE - GLOBAL FUNCTION
// ======================================================

window.togglePassword = function(elementId, passwordValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const isHidden = element.classList.contains('password-hidden');
    const wrapper = element.closest('.user-password-wrapper');
    const button = wrapper ? wrapper.querySelector('.password-toggle-btn') : null;
    
    if (isHidden) {
        // Tampilkan password
        element.textContent = passwordValue;
        element.classList.remove('password-hidden');
        element.classList.add('password-visible');
        if (button) {
            button.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
            button.title = 'Klik untuk menyembunyikan password';
        }
    } else {
        // Sembunyikan password
        element.textContent = '••••••••';
        element.classList.remove('password-visible');
        element.classList.add('password-hidden');
        if (button) {
            button.innerHTML = '<i class="fa-solid fa-eye"></i>';
            button.title = 'Klik untuk melihat password';
        }
    }
};


// ======================================================
// FILTER DATA
// ======================================================

function applyFilters() {
    const role = (roleFilter?.value || "").trim().toLowerCase();
    const perumahan = (perumahanFilter?.value || "").trim().toLowerCase();
    const keyword = (searchInput?.value || "").trim().toLowerCase();

    if (!keyword && !role && !perumahan) {
        filteredUsers = allUsers.slice();
    } else {
        filteredUsers = [];
        const keywordLower = keyword;
        
        for (let i = 0; i < allUsers.length; i++) {
            const user = allUsers[i];
            
            if (role && (user.role || "").toLowerCase() !== role) {
                continue;
            }
            
            if (perumahan && (user.perumahanName || "").toLowerCase() !== perumahan) {
                continue;
            }
            
            if (keywordLower) {
                const userName = (user.name || "").toLowerCase();
                const userHouse = (user.houseNumber || "").toString().toLowerCase();
                const userPhone = (user.phoneNumber || "").toString().toLowerCase();
                const userDevice = (user.assigned_device || "").toLowerCase();
                const userZone = (user.assigned_zone || "").toLowerCase();
                
                if (!userName.includes(keywordLower) && 
                    !userHouse.includes(keywordLower) && 
                    !userPhone.includes(keywordLower) &&
                    !userDevice.includes(keywordLower) &&
                    !userZone.includes(keywordLower)) {
                    continue;
                }
            }
            
            filteredUsers.push(user);
        }
    }

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
        paginationInfo.textContent = `Menampilkan ${totalItems === 0 ? 0 : startIndex + 1} - ${endIndex} dari ${totalItems} data pengguna`;
    }

    if (prevPage) prevPage.disabled = currentPage === 1;
    if (nextPage) nextPage.disabled = endIndex >= totalItems;
}


// ======================================================
// EDIT USER - GLOBAL FUNCTION (BARU)
// ======================================================

window.editUser = function(perumahanKey, userId) {
    console.log('🟡 editUser() dipanggil untuk userId:', userId, 'perumahanKey:', perumahanKey);
    
    const user = allUsers.find(u => u.id === userId && u.perumahanKey === perumahanKey);
    if (!user) {
        console.log('❌ User tidak ditemukan');
        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: 'error',
                title: 'User Tidak Ditemukan',
                text: 'Data user tidak ditemukan di database.'
            });
        }
        return;
    }
    
    if ((user.role || "").toLowerCase() === "admin") {
        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: 'error',
                title: 'Tidak Dapat Mengedit',
                text: 'Tidak dapat mengedit akun admin!'
            });
        }
        return;
    }
    
    console.log('✅ User ditemukan:', user);
    
    editingUserId = userId;
    editingPerumahanKey = perumahanKey;
    
    // Update modal title
    if (modalTitle) modalTitle.textContent = 'Edit Pengguna';
    if (saveBtnText) saveBtnText.textContent = 'Update Pengguna';
    if (saveUserBtn) saveUserBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Pengguna';
    
    // Isi form dengan data user
    if (perumahanSelect) perumahanSelect.value = perumahanKey;
    if (userNameInput) userNameInput.value = user.name || '';
    if (houseNumberInput) houseNumberInput.value = user.houseNumber || '';
    if (passwordInput) passwordInput.value = user.password || '';
    if (phoneNumberInput) phoneNumberInput.value = user.phoneNumber || '';
    
    // Set role
    const userRole = (user.role || "").toLowerCase();
    if (roleSelect) {
        if (userRole === "admin" || userRole === "user") {
            roleSelect.value = userRole;
        } else {
            roleSelect.value = "custom";
            if (customRoleInput) {
                customRoleInput.style.display = "block";
                customRoleInput.value = userRole;
            }
        }
    }
    
    // Set device dan zona
    if (deviceSelect) {
        deviceSelect.value = user.assigned_device || '';
        // Load devices jika belum ada
        if (devicesList.length === 0) {
            loadDevices();
        }
        setTimeout(() => {
            if (deviceSelect) deviceSelect.value = user.assigned_device || '';
            if (zonaInput) zonaInput.value = user.assigned_zone || '';
        }, 300);
    }
    
    // Buka modal
    if (addUserModal) {
        addUserModal.style.display = "flex";
        console.log('✅ Modal edit dibuka');
        
        // Auto-fill zona setelah modal terbuka
        setTimeout(autoFillZona, 150);
    }
};

// ======================================================
// DELETE USER - GLOBAL FUNCTION (BARU)
// ======================================================

window.deleteUser = async function(perumahanKey, userId) {
    console.log('🔴 deleteUser() dipanggil untuk userId:', userId, 'perumahanKey:', perumahanKey);
    
    const user = allUsers.find(u => u.id === userId && u.perumahanKey === perumahanKey);
    if (!user) return;
    
    if ((user.role || "").toLowerCase() === "admin") {
        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: 'error',
                title: 'Tidak Dapat Menghapus',
                text: 'Tidak dapat menghapus akun admin!'
            });
        }
        return;
    }
    
    if (typeof Swal !== "undefined") {
        const result = await Swal.fire({
            title: 'Hapus Pengguna?',
            text: `Anda yakin ingin menghapus pengguna "${user.name || 'ini'}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        });
        
        if (result.isConfirmed) {
            try {
                // Hapus dari database utama (db1)
                await remove(ref(db1, `perumahan/${perumahanKey}/users/${userId}`));
                
                // Hapus juga dari db2 jika ada sinkronisasi
                try {
                    await remove(ref(db2, `users/${userId}`));
                    console.log('✅ User juga dihapus dari DB2');
                } catch (syncError) {
                    console.warn('⚠️ Gagal menghapus dari DB2:', syncError);
                }
                
                if (typeof Swal !== "undefined") {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil!',
                        text: 'Pengguna berhasil dihapus',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                if (typeof Swal !== "undefined") {
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal',
                        text: 'Gagal menghapus pengguna: ' + error.message
                    });
                }
            }
        }
    } else {
        // Fallback jika SweetAlert tidak tersedia
        if (confirm(`Hapus pengguna "${user.name || 'ini'}"?`)) {
            try {
                await remove(ref(db1, `perumahan/${perumahanKey}/users/${userId}`));
                alert('Pengguna berhasil dihapus!');
            } catch (error) {
                alert('Gagal menghapus pengguna: ' + error.message);
            }
        }
    }
};


// ======================================================
// MODAL - BUKA & TUTUP
// ======================================================

if (openAddUserModal && addUserModal) {
    openAddUserModal.addEventListener("click", () => {
        // Reset edit state
        editingUserId = null;
        editingPerumahanKey = null;
        
        // Reset modal title
        if (modalTitle) modalTitle.textContent = 'Tambah Pengguna Baru';
        if (saveBtnText) saveBtnText.textContent = 'Simpan Pengguna';
        if (saveUserBtn) saveUserBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Pengguna';
        
        // Reset form
        resetForm();
        
        addUserModal.style.display = "flex";
        loadDevices();
        setTimeout(autoFillZona, 150);
    });
}

if (addUserModal) {
    [closeModal, cancelBtn].forEach((btn) => {
        if (btn) {
            btn.addEventListener("click", () => {
                addUserModal.style.display = "none";
                resetForm();
                editingUserId = null;
                editingPerumahanKey = null;
            });
        }
    });

    window.addEventListener("click", (event) => {
        if (event.target === addUserModal) {
            addUserModal.style.display = "none";
            resetForm();
            editingUserId = null;
            editingPerumahanKey = null;
        }
    });
}


// ======================================================
// ROLE SELECT (CUSTOM ROLE TOGGLE)
// ======================================================

if (roleSelect && customRoleInput) {
    roleSelect.addEventListener("change", () => {
        if (roleSelect.value === "custom") {
            customRoleInput.style.display = "block";
            customRoleInput.focus();
        } else {
            customRoleInput.style.display = "none";
            customRoleInput.value = "";
        }
    });
}


// ======================================================
// AUTO-FILL ZONA SAAT PERANGKAT DIPILIH
// ======================================================

if (deviceSelect) {
    deviceSelect.addEventListener('change', function() {
        const selectedDeviceName = this.value;
        console.log('🔄 Perangkat dipilih:', selectedDeviceName);
        
        if (!selectedDeviceName) {
            if (zonaInput) zonaInput.value = '';
            return;
        }
        
        const selectedDevice = devicesList.find(device => device.name === selectedDeviceName);
        
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
        }
    });
}


// ======================================================
// RESET FORM
// ======================================================

function resetForm() {
    if (perumahanSelect) perumahanSelect.value = "";
    if (userNameInput) userNameInput.value = "";
    if (houseNumberInput) houseNumberInput.value = "";
    if (passwordInput) passwordInput.value = "";
    if (phoneNumberInput) phoneNumberInput.value = "";
    if (roleSelect) roleSelect.value = "user";
    if (customRoleInput) {
        customRoleInput.value = "";
        customRoleInput.style.display = "none";
    }
    if (deviceSelect) deviceSelect.value = "";
    if (zonaInput) zonaInput.value = "";
}


// ======================================================
// SIMPAN / UPDATE USER KE FIREBASE (DENGAN EDIT)
// ======================================================

if (saveUserBtn) {
    saveUserBtn.addEventListener("click", async () => {
        const perumahanKey = perumahanSelect?.value;
        const name = userNameInput?.value.trim();
        const houseNumber = houseNumberInput?.value.trim();
        const password = passwordInput?.value.trim();
        const phoneNumber = phoneNumberInput?.value.trim();
        const roleOption = roleSelect?.value;
        const customRole = customRoleInput?.value.trim();
        const assignedDevice = deviceSelect?.value || "";
        const assignedZone = zonaInput?.value.trim() || "";

        if (!perumahanKey || !name || !houseNumber || !password) {
            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "warning",
                    title: "Data Belum Lengkap",
                    text: "Semua kolom wajib diisi!",
                    confirmButtonColor: "#173f70"
                });
            } else {
                alert("Semua field wajib diisi!");
            }
            return;
        }

        const role = roleOption === "custom"
            ? (customRole || "custom")
            : roleOption;

        try {
            const userData = {
                coverImage: "",
                houseNumber: houseNumber,
                name: name,
                note: "",
                password: password,
                phoneNumber: phoneNumber || "",
                profileImage: "",
                role: role.toLowerCase(),
                assigned_device: assignedDevice,
                assigned_zone: assignedZone,
                updated_at: Date.now()
            };

            if (editingUserId && editingPerumahanKey) {
                // UPDATE MODE
                await update(ref(db1, `perumahan/${editingPerumahanKey}/users/${editingUserId}`), userData);
                
                // Update juga di db2 jika ada
                if (assignedDevice) {
                    try {
                        await update(ref(db2, `users/${editingUserId}`), {
                            name: name,
                            phone: phoneNumber || "",
                            assigned_device: assignedDevice,
                            assigned_zone: assignedZone,
                            role: role.toLowerCase(),
                            updated_at: Date.now()
                        });
                        console.log('✅ User juga diupdate di DB2');
                    } catch (syncError) {
                        console.warn('⚠️ Gagal update di DB2:', syncError);
                    }
                }
                
                if (typeof Swal !== "undefined") {
                    Swal.fire({
                        icon: "success",
                        title: "Berhasil",
                        text: "Pengguna berhasil diperbarui!",
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            } else {
                // CREATE MODE
                const newUserRef = push(ref(db1, `perumahan/${perumahanKey}/users`));
                await set(newUserRef, userData);

                if (assignedDevice) {
                    try {
                        await set(ref(db2, `users/${newUserRef.key}`), {
                            name: name,
                            phone: phoneNumber || "",
                            assigned_device: assignedDevice,
                            assigned_zone: assignedZone,
                            role: role.toLowerCase(),
                            status: 'active',
                            created_at: Date.now(),
                            updated_at: Date.now()
                        });
                        console.log('✅ User juga disinkronkan ke DB2');
                    } catch (syncError) {
                        console.warn('⚠️ Gagal sinkron ke DB2:', syncError);
                    }
                }
                
                if (typeof Swal !== "undefined") {
                    Swal.fire({
                        icon: "success",
                        title: "Berhasil",
                        text: "Pengguna baru berhasil ditambahkan!",
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            }

            if (addUserModal) addUserModal.style.display = "none";
            resetForm();
            editingUserId = null;
            editingPerumahanKey = null;
            
            // Reset button text
            if (saveBtnText) saveBtnText.textContent = 'Simpan Pengguna';
            if (saveUserBtn) saveUserBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Pengguna';

        } catch (error) {
            console.error("Error saving user:", error);
            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "error",
                    title: "Gagal",
                    text: `Gagal menyimpan pengguna: ${error.message}`,
                    confirmButtonColor: "#173f70"
                });
            } else {
                alert("Gagal menyimpan user.");
            }
        }
    });
}


// ======================================================
// EVENT FILTER & PAGINATION LISTENERS
// ======================================================

if (searchInput) {
    let searchDebounce = null;
    searchInput.addEventListener("input", () => {
        if (searchDebounce) {
            clearTimeout(searchDebounce);
        }
        searchDebounce = setTimeout(() => {
            applyFilters();
            searchDebounce = null;
        }, 300);
    });
}

if (roleFilter) roleFilter.addEventListener("change", applyFilters);
if (perumahanFilter) perumahanFilter.addEventListener("change", applyFilters);

if (prevPage) {
    prevPage.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });
}

if (nextPage) {
    nextPage.addEventListener("click", () => {
        if (currentPage * usersPerPage < filteredUsers.length) {
            currentPage++;
            updatePagination();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });
}


// ======================================================
// INIT
// ======================================================

loadPerumahanList();
loadUsers();
loadDevices();

console.log("Manajemen Pengguna dengan Perangkat IoT dan Edit/Hapus initialized.");