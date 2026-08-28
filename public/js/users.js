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

const tableBody = document.getElementById("userPerumahanTableBody");
const perumahanFilter = document.getElementById("perumahanFilter");
const searchInput = document.getElementById("searchInput");
const btnExportExcel = document.getElementById("btnExportUserPerumahanExcel");

// Modal Tambah/Edit Elements
const addUserModal = document.getElementById("addUserModal");
const openAddUserModal = document.getElementById("openAddUserModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const saveUserBtn = document.getElementById("saveUserBtn");
const modalTitle = document.getElementById("modalTitle");
const saveBtnText = document.getElementById("saveBtnText");

// Form Elements
const perumahanSelect = document.getElementById("perumahanSelect");
const userNameInput = document.getElementById("userName");
const houseNumberInput = document.getElementById("houseNumber");
const emailInput = document.getElementById("userEmail");
const passwordInput = document.getElementById("password");
const passwordConfirmInput = document.getElementById("passwordConfirm");
const togglePasswordBtn = document.getElementById("togglePerumahanPassword");
const togglePasswordConfirmBtn = document.getElementById("togglePerumahanPasswordConfirm");
const passwordHelp = document.getElementById("userPasswordHelp");
const roleSelect = document.getElementById("roleSelect");
const customRoleInput = document.getElementById("customRoleInput");
const deviceSelect = document.getElementById("userDeviceSelect");
const zonaInput = document.getElementById("userZonaInput");
const phoneNumberInput = document.getElementById("userPhoneNumber");

// Toggle Password Visibility Helper
function setupPasswordToggle(btn, input) {
    if (!btn || !input) return;
    btn.addEventListener("click", () => {
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        btn.innerHTML = isPassword ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });
}

setupPasswordToggle(togglePasswordBtn, passwordInput);
setupPasswordToggle(togglePasswordConfirmBtn, passwordConfirmInput);

// Detail Modal Elements
const detailUserModal = document.getElementById("detailUserModal");
const detailUserModalBody = document.getElementById("detailUserModalBody");
const closeDetailModal = document.getElementById("closeDetailModal");
const closeDetailBtn = document.getElementById("closeDetailBtn");

// Pagination Elements
const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
const paginationInfo = document.getElementById("paginationInfo");


// ======================================================
// DATA & PAGINATION STATE
// ======================================================

let allUsers = [];
let filteredUsers = [];
let perumahanNames = [];
let devicesList = [];
let editingUserId = null;
let editingPerumahanKey = null;

let currentPage = 1;
const usersPerPage = 10;
let perumahanCache = null;


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
// FIREBASE REFERENCES
// ======================================================

const daftarPerumahanRef = ref(db1, "daftar_perumahan");
const perumahanRef = ref(db1, "perumahan");
const devicesRef = ref(db2, "panicChannels");


// ======================================================
// AMBIL DAFTAR PERUMAHAN UNTUK MODAL & FILTER
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
    }, (error) => {
        console.error('Error loading devices:', error);
    });
}

function populateDeviceSelect() {
    if (!deviceSelect) return;

    const currentValue = deviceSelect.value;
    deviceSelect.innerHTML = '<option value="">-- Pilih Perangkat --</option>';

    devicesList.sort((a, b) => a.name.localeCompare(b.name));

    devicesList.forEach(device => {
        const option = document.createElement('option');
        option.value = device.name;
        const statusText = device.online !== false ? 'Online' : 'Offline';
        const activeText = device.active === true ? ' [ACTIVE]' : '';
        option.textContent = `${device.name} (${device.zone} - ${device.lokasi}) [${statusText}]${activeText}`;
        option.dataset.zone = device.zone || '';
        deviceSelect.appendChild(option);
    });

    if (currentValue) {
        deviceSelect.value = currentValue;
        setTimeout(autoFillZona, 100);
    }
}

function autoFillZona() {
    if (deviceSelect && deviceSelect.value && zonaInput) {
        const selectedDevice = devicesList.find(device => device.name === deviceSelect.value);
        if (selectedDevice && selectedDevice.zone) {
            zonaInput.value = selectedDevice.zone;
        }
    }
}


// ======================================================
// AMBIL DATA USER PERUMAHAN DARI DB1
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
        }, 200);
    });
}

function processUserData(snapshot) {
    const data = snapshot.val();
    allUsers = [];
    const perumahanNamesSet = new Set();
    const userMap = new Map();

    if (data) {
        Object.entries(data).forEach(([perumahanKey, perumahanData]) => {
            if (perumahanKey === "buzzers" || !perumahanData || typeof perumahanData !== "object") return;

            const users = perumahanData.users || {};
            const perumahanName = perumahanData.info?.nama || perumahanKey;

            Object.entries(users).forEach(([userId, userInfo]) => {
                if (!userInfo || typeof userInfo !== "object") return;

                const role = (userInfo.role || "").toLowerCase().trim();
                // Filter out posko/satpam/admin/petugas dari daftar user warga biasa
                if (role === "admin" || role === "satpam" || role === "petugas" || role === "security") {
                    return;
                }

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

    populatePerumahanOptions(perumahanNames);
    applyFilters();
}


// ======================================================
// FILTER DATA
// ======================================================

function applyFilters() {
    const perumahan = (perumahanFilter?.value || "").trim().toLowerCase();
    const keyword = (searchInput?.value || "").trim().toLowerCase();

    if (!keyword && !perumahan) {
        filteredUsers = allUsers.slice();
    } else {
        filteredUsers = [];

        for (let i = 0; i < allUsers.length; i++) {
            const user = allUsers[i];

            if (perumahan && (user.perumahanName || "").toLowerCase() !== perumahan) {
                continue;
            }

            if (keyword) {
                const userName = (user.name || "").toLowerCase();
                const userHouse = (user.houseNumber || "").toString().toLowerCase();
                const userPhone = (user.phoneNumber || "").toString().toLowerCase();
                const userDevice = (user.assigned_device || "").toLowerCase();
                const userZone = (user.assigned_zone || "").toLowerCase();
                const userPerum = (user.perumahanName || "").toLowerCase();

                if (!userName.includes(keyword) &&
                    !userHouse.includes(keyword) &&
                    !userPhone.includes(keyword) &&
                    !userDevice.includes(keyword) &&
                    !userZone.includes(keyword) &&
                    !userPerum.includes(keyword)) {
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
// RENDER TABEL USER PERUMAHAN
// ======================================================

function renderTable(users) {
    if (!tableBody) return;

    if (users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fa-solid fa-users-slash" style="font-size: 36px; margin-bottom: 8px; display: block; opacity: 0.6;"></i>
                    <strong style="display:block; font-size:14.5px; margin-bottom:4px; color:var(--dash-text-main);">Tidak ada data pengguna perumahan ditemukan.</strong>
                    <span style="font-size:12.5px; color:var(--dash-text-muted);">Coba sesuaikan kata kunci pencarian atau filter perumahan.</span>
                </td>
            </tr>
        `;
        return;
    }

    const startIndex = (currentPage - 1) * usersPerPage;

    tableBody.innerHTML = users.map((user, index) => {
        const globalIndex = startIndex + index + 1;
        const initial = (user.name && user.name.trim().length > 0)
            ? user.name.trim().charAt(0).toUpperCase()
            : "U";

        const phoneDisplay = user.phoneNumber && user.phoneNumber !== '-'
            ? `<span>${escapeHtml(user.phoneNumber)}</span>`
            : `<span style="color:var(--dash-text-muted); font-size:12.5px;">-</span>`;

        const deviceDisplay = user.assigned_device && user.assigned_device !== '-'
            ? `<span>${escapeHtml(user.assigned_device)}</span>`
            : '<span style="color: var(--dash-text-muted); font-size: 12.5px; font-style: italic;">Belum terdaftar</span>';

        const zoneDisplay = user.assigned_zone && user.assigned_zone !== '-'
            ? `<span>${escapeHtml(user.assigned_zone)}</span>`
            : '<span style="color:var(--dash-text-muted); font-size:12.5px;">-</span>';

        return `
            <tr>
                <td style="text-align: center; font-weight: 700; color: var(--dash-text-muted);">
                    ${globalIndex}
                </td>

                <td style="font-weight: 600;">
                    ${escapeHtml(user.name || "-")}
                </td>

                <td>
                    ${escapeHtml(user.houseNumber || "-")}
                </td>

                <td>
                    ${escapeHtml(user.perumahanName || "-")}
                </td>

                <td>
                    ${phoneDisplay}
                </td>

                <td>
                    ${deviceDisplay}
                </td>

                <td>
                    ${zoneDisplay}
                </td>

                <td style="text-align: center;">
                    <div class="table-action-btns">
                        <button type="button" class="btn-table-action btn-action-edit" onclick="window.editUser('${escapeHtml(user.perumahanKey)}', '${escapeHtml(user.id)}')" title="Edit Data Pengguna">
                            <span>Edit</span>
                        </button>
                        <button type="button" class="btn-table-action btn-action-detail" onclick="window.detailUser('${escapeHtml(user.perumahanKey)}', '${escapeHtml(user.id)}')" title="Lihat Detail Lengkap">
                            <span>Detail</span>
                        </button>
                        <button type="button" class="btn-table-action btn-action-delete" onclick="window.deleteUser('${escapeHtml(user.perumahanKey)}', '${escapeHtml(user.id)}')" title="Hapus Pengguna">
                            <span>Hapus</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}


// ======================================================
// PAGINATION
// ======================================================

function updatePagination() {
    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / usersPerPage) || 1;

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = Math.min(startIndex + usersPerPage, totalItems);

    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    renderTable(paginatedUsers);

    if (paginationInfo) {
        paginationInfo.textContent = `Menampilkan ${totalItems === 0 ? 0 : startIndex + 1} - ${endIndex} dari ${totalItems} data pengguna`;
    }

    if (prevPage) prevPage.disabled = currentPage === 1;
    if (nextPage) nextPage.disabled = endIndex >= totalItems || totalItems === 0;
}


// ======================================================
// DETAIL USER - GLOBAL FUNCTION
// ======================================================

window.detailUser = function (perumahanKey, userId) {
    const user = allUsers.find(u => u.id === userId && u.perumahanKey === perumahanKey);
    if (!user) {
        Swal.fire({
            icon: 'error',
            title: 'User Tidak Ditemukan',
            text: 'Data pengguna tidak ditemukan di database.',
            confirmButtonColor: '#173f70'
        });
        return;
    }

    if (detailUserModalBody) {
        detailUserModalBody.innerHTML = `
            <div class="user-detail-profile-header">
                <div class="user-detail-avatar-large">
                    ${escapeHtml((user.name || "U").charAt(0).toUpperCase())}
                </div>
                <div class="user-detail-title-block">
                    <h3>${escapeHtml(user.name || "-")}</h3>
                    <span class="user-role-badge-large">${escapeHtml((user.role || "warga").toUpperCase())}</span>
                </div>
            </div>

            <div class="user-detail-grid">
                <div class="detail-item">
                    <span class="detail-label"><i class="fa-solid fa-house"></i> Nomor Rumah</span>
                    <strong class="detail-value">${escapeHtml(user.houseNumber || "-")}</strong>
                </div>

                <div class="detail-item">
                    <span class="detail-label"><i class="fa-solid fa-building-shield"></i> Perumahan</span>
                    <strong class="detail-value">${escapeHtml(user.perumahanName || "-")}</strong>
                </div>

                <div class="detail-item">
                    <span class="detail-label"><i class="fa-solid fa-phone"></i> Nomor HP / WhatsApp</span>
                    <strong class="detail-value">${escapeHtml(user.phoneNumber || "-")}</strong>
                </div>

                <div class="detail-item">
                    <span class="detail-label"><i class="fa-solid fa-microchip"></i> Perangkat IoT</span>
                    <strong class="detail-value" style="color:var(--dash-primary);">${escapeHtml(user.assigned_device || "-")}</strong>
                </div>

                <div class="detail-item">
                    <span class="detail-label"><i class="fa-solid fa-location-dot"></i> Zona Perangkat</span>
                    <strong class="detail-value" style="color:var(--dash-primary);">${escapeHtml(user.assigned_zone || "-")}</strong>
                </div>

                <div class="detail-item">
                    <span class="detail-label"><i class="fa-solid fa-user-tag"></i> Hak Akses</span>
                    <strong class="detail-value">${escapeHtml(user.role || "User")}</strong>
                </div>
            </div>
        `;
    }

    if (detailUserModal) {
        detailUserModal.style.display = "flex";
    }
};

if (closeDetailModal) {
    closeDetailModal.addEventListener("click", () => {
        if (detailUserModal) detailUserModal.style.display = "none";
    });
}

if (closeDetailBtn) {
    closeDetailBtn.addEventListener("click", () => {
        if (detailUserModal) detailUserModal.style.display = "none";
    });
}


// ======================================================
// EDIT USER - GLOBAL FUNCTION
// ======================================================

window.editUser = function (perumahanKey, userId) {
    const user = allUsers.find(u => u.id === userId && u.perumahanKey === perumahanKey);
    if (!user) {
        Swal.fire({
            icon: 'error',
            title: 'User Tidak Ditemukan',
            text: 'Data user tidak ditemukan di database.',
            confirmButtonColor: '#173f70'
        });
        return;
    }

    if ((user.role || "").toLowerCase() === "admin") {
        Swal.fire({
            icon: 'error',
            title: 'Tidak Dapat Mengedit',
            text: 'Tidak dapat mengedit akun admin perumahan!',
            confirmButtonColor: '#173f70'
        });
        return;
    }

    editingUserId = userId;
    editingPerumahanKey = perumahanKey;

    if (modalTitle) modalTitle.textContent = 'Edit Pengguna Perumahan';
    if (saveBtnText) saveBtnText.textContent = 'Update Pengguna';
    if (saveUserBtn) saveUserBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Pengguna';

    if (perumahanSelect) perumahanSelect.value = perumahanKey;
    if (userNameInput) userNameInput.value = user.name || '';
    if (houseNumberInput) houseNumberInput.value = user.houseNumber || '';
    if (emailInput) emailInput.value = user.email && user.email !== "-" ? user.email : '';
    if (passwordInput) {
        passwordInput.value = '';
        passwordInput.type = 'password';
    }
    if (passwordConfirmInput) {
        passwordConfirmInput.value = '';
        passwordConfirmInput.type = 'password';
    }
    if (togglePasswordBtn) togglePasswordBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    if (togglePasswordConfirmBtn) togglePasswordConfirmBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    if (passwordHelp) passwordHelp.style.display = 'block';
    if (phoneNumberInput) phoneNumberInput.value = user.phoneNumber || '';

    const userRole = (user.role || "").toLowerCase();
    if (roleSelect) {
        if (userRole === "admin" || userRole === "user") {
            roleSelect.value = userRole;
            if (customRoleInput) customRoleInput.style.display = "none";
        } else {
            roleSelect.value = "custom";
            if (customRoleInput) {
                customRoleInput.style.display = "block";
                customRoleInput.value = userRole;
            }
        }
    }

    if (deviceSelect) {
        deviceSelect.value = user.assigned_device || '';
        if (devicesList.length === 0) loadDevices();
        setTimeout(() => {
            if (deviceSelect) deviceSelect.value = user.assigned_device || '';
            if (zonaInput) zonaInput.value = user.assigned_zone || '';
        }, 300);
    }

    if (addUserModal) {
        addUserModal.style.display = "flex";
        setTimeout(autoFillZona, 150);
    }
};


// ======================================================
// DELETE USER - GLOBAL FUNCTION
// ======================================================

window.deleteUser = async function (perumahanKey, userId) {
    const user = allUsers.find(u => u.id === userId && u.perumahanKey === perumahanKey);
    if (!user) return;

    if ((user.role || "").toLowerCase() === "admin") {
        Swal.fire({
            icon: 'error',
            title: 'Tidak Dapat Menghapus',
            text: 'Tidak dapat menghapus akun admin perumahan!',
            confirmButtonColor: '#173f70'
        });
        return;
    }

    const result = await Swal.fire({
        title: 'Hapus Pengguna?',
        text: `Anda yakin ingin menghapus pengguna "${user.name || 'ini'}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
        try {
            await remove(ref(db1, `perumahan/${perumahanKey}/users/${userId}`));

            try {
                await remove(ref(db2, `users/${userId}`));
            } catch (syncError) {
                console.warn('DB2 sync delete note:', syncError);
            }

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Pengguna berhasil dihapus dari sistem.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: 'Gagal menghapus pengguna: ' + error.message,
                confirmButtonColor: '#173f70'
            });
        }
    }
};


// ======================================================
// MODAL ADD - OPEN & CLOSE
// ======================================================

if (openAddUserModal && addUserModal) {
    openAddUserModal.addEventListener("click", () => {
        editingUserId = null;
        editingPerumahanKey = null;

        if (modalTitle) modalTitle.textContent = 'Tambah Pengguna Baru';
        if (saveBtnText) saveBtnText.textContent = 'Simpan Pengguna';
        if (saveUserBtn) saveUserBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Pengguna';

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
        if (event.target === detailUserModal) {
            detailUserModal.style.display = "none";
        }
    });
}


// ======================================================
// ROLE SELECT TOGGLE
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

if (deviceSelect) {
    deviceSelect.addEventListener('change', function () {
        const selectedDeviceName = this.value;
        if (!selectedDeviceName) {
            if (zonaInput) zonaInput.value = '';
            return;
        }

        const selectedDevice = devicesList.find(device => device.name === selectedDeviceName);
        if (selectedDevice && selectedDevice.zone) {
            if (zonaInput) zonaInput.value = selectedDevice.zone;
        } else {
            if (zonaInput) zonaInput.value = '';
        }
    });
}

function resetForm() {
    if (perumahanSelect) perumahanSelect.value = "";
    if (userNameInput) userNameInput.value = "";
    if (houseNumberInput) houseNumberInput.value = "";
    if (emailInput) emailInput.value = "";
    if (passwordInput) {
        passwordInput.value = "";
        passwordInput.type = "password";
    }
    if (passwordConfirmInput) {
        passwordConfirmInput.value = "";
        passwordConfirmInput.type = "password";
    }
    if (togglePasswordBtn) togglePasswordBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    if (togglePasswordConfirmBtn) togglePasswordConfirmBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    if (passwordHelp) passwordHelp.style.display = "none";
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
// SIMPAN / UPDATE USER
// ======================================================

if (saveUserBtn) {
    saveUserBtn.addEventListener("click", async () => {
        const perumahanKey = perumahanSelect?.value;
        const name = userNameInput?.value.trim();
        const houseNumber = houseNumberInput?.value.trim();
        const email = emailInput?.value.trim().toLowerCase() || "";
        const password = passwordInput?.value.trim();
        const passwordConfirm = passwordConfirmInput?.value.trim();
        const phoneNumber = phoneNumberInput?.value.trim();
        const roleOption = roleSelect?.value;
        const customRole = customRoleInput?.value.trim();
        const assignedDevice = deviceSelect?.value || "";
        const assignedZone = zonaInput?.value.trim() || "";

        if (!perumahanKey || !name || !houseNumber) {
            Swal.fire({
                icon: "warning",
                title: "Data Belum Lengkap",
                text: "Perumahan, nama lengkap, dan nomor rumah wajib diisi!",
                confirmButtonColor: "#173f70"
            });
            return;
        }

        if (!editingUserId && !password) {
            Swal.fire({
                icon: "warning",
                title: "Password Wajib Diisi",
                text: "Password akun pengguna baru wajib diisi (min. 6 karakter).",
                confirmButtonColor: "#173f70"
            });
            return;
        }

        if (password && password.length < 6) {
            Swal.fire({
                icon: "warning",
                title: "Password Terlalu Pendek",
                text: "Password minimal terdiri dari 6 karakter.",
                confirmButtonColor: "#173f70"
            });
            return;
        }

        if (password && password !== passwordConfirm) {
            Swal.fire({
                icon: "warning",
                title: "Konfirmasi Password Tidak Cocok",
                text: "Pastikan kolom password dan konfirmasi password sama persis.",
                confirmButtonColor: "#173f70"
            });
            return;
        }

        const role = roleOption === "custom" ? (customRole || "custom") : roleOption;

        try {
            let hashedPassword = null;
            if (password) {
                hashedPassword = typeof window.hashPassword === "function"
                    ? await window.hashPassword(password)
                    : password;
            }

            const userData = {
                coverImage: "",
                houseNumber: houseNumber,
                name: name,
                note: "",
                email: email || "-",
                phoneNumber: phoneNumber || "",
                profileImage: "",
                role: role.toLowerCase(),
                assigned_device: assignedDevice,
                assigned_zone: assignedZone,
                updated_at: Date.now()
            };

            if (hashedPassword) {
                userData.password = hashedPassword;
            }

            if (editingUserId && editingPerumahanKey) {
                // UPDATE MODE
                await update(ref(db1, `perumahan/${editingPerumahanKey}/users/${editingUserId}`), userData);

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
                    } catch (e) { }
                }

                Swal.fire({
                    icon: "success",
                    title: "Berhasil",
                    text: "Pengguna perumahan berhasil diperbarui!",
                    timer: 2000,
                    showConfirmButton: false
                });
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
                    } catch (e) { }
                }

                Swal.fire({
                    icon: "success",
                    title: "Berhasil",
                    text: "Pengguna perumahan baru berhasil ditambahkan!",
                    timer: 2000,
                    showConfirmButton: false
                });
            }

            if (addUserModal) addUserModal.style.display = "none";
            resetForm();
            editingUserId = null;
            editingPerumahanKey = null;

        } catch (error) {
            console.error("Error saving user:", error);
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: `Gagal menyimpan pengguna: ${error.message}`,
                confirmButtonColor: "#173f70"
            });
        }
    });
}


// ======================================================
// IMPORT / EXPORT EXCEL DATA USER PERUMAHAN
// ======================================================

function exportUserPerumahanToExcel() {
    if (typeof XLSX === "undefined") {
        Swal.fire({
            icon: "error",
            title: "Library Excel Belum Siap",
            text: "Mohon muat ulang halaman untuk memproses Excel.",
            confirmButtonColor: "#173f70"
        });
        return;
    }

    const dataToExport = filteredUsers;

    if (!dataToExport || dataToExport.length === 0) {
        Swal.fire({
            icon: "info",
            title: "Tidak Ada Data",
            text: "Tidak ada data pengguna perumahan untuk diekspor pada filter saat ini.",
            confirmButtonColor: "#173f70"
        });
        return;
    }

    const filterPerum = perumahanFilter?.value ? ` (${perumahanFilter.value})` : "";

    // 1. Baris Header & Subheader Excel
    const worksheetData = [
        [`Daftar Pengguna Perumahan${filterPerum}`],
        [`Data akun warga perumahan yang terdaftar dalam sistem Panic Button`],
        [], // Baris kosong
        ["No", "Nama Pengguna", "No Rumah", "Perumahan", "No Handphone", "Perangkat IoT", "Zona"]
    ];

    // 2. Data baris tabel
    dataToExport.forEach((user, idx) => {
        worksheetData.push([
            idx + 1,
            user.name || "-",
            user.houseNumber || "-",
            user.perumahanName || "-",
            user.phoneNumber || "-",
            user.assigned_device || "-",
            user.assigned_zone || "-"
        ]);
    });

    // 3. Konversi array ke Worksheet
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // 4. Merge Header A1:G1 dan A2:G2
    ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }
    ];

    // 5. Atur lebar kolom agar fungsional & tidak terpotong
    ws["!cols"] = [
        { wch: 6 },  // No
        { wch: 28 }, // Nama Pengguna
        { wch: 14 }, // No Rumah
        { wch: 28 }, // Perumahan
        { wch: 18 }, // No Handphone
        { wch: 22 }, // Perangkat IoT
        { wch: 16 }  // Zona
    ];

    // 6. Buat Workbook & Tulis File
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "User Perumahan");

    const filename = `Daftar_Pengguna_Perumahan_${Date.now()}.xlsx`;
    XLSX.writeFile(wb, filename);

    Swal.fire({
        icon: "success",
        title: "File Excel Berhasil Diunduh!",
        text: "Data pengguna perumahan berhasil diekspor ke Excel.",
        timer: 2000,
        showConfirmButton: false
    });
}

if (btnExportExcel) {
    btnExportExcel.addEventListener("click", exportUserPerumahanToExcel);
}


// ======================================================
// EVENT FILTER & PAGINATION LISTENERS
// ======================================================

if (searchInput) {
    let searchDebounce = null;
    searchInput.addEventListener("input", () => {
        if (searchDebounce) clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            applyFilters();
            searchDebounce = null;
        }, 250);
    });
}

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

console.log("User Perumahan Table & Export initialized smoothly.");