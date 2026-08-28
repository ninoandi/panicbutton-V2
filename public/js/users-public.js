import { db2 } from './firebase-config.js';
import { ref, onValue, push, set, update, remove, get } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


// ======================================================
// ELEMENT DOM
// ======================================================

const tableBody = document.getElementById("userPublicTableBody");
const searchInput = document.getElementById("searchInputPublic");
const btnExportExcel = document.getElementById("btnExportUserPublicExcel");

// Pagination Elements
const prevPage = document.getElementById("prevPagePublic");
const nextPage = document.getElementById("nextPagePublic");
const paginationInfo = document.getElementById("paginationInfoPublic");

// Modal Add/Edit Elements
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
const genderInput = document.getElementById("userPublicGender");
const deviceSelect = document.getElementById("userPublicDevice");
const zonaInput = document.getElementById("userPublicZona");
const statusSelect = document.getElementById("userPublicStatus");

const passwordInput = document.getElementById("userPublicPassword");
const passwordConfirmInput = document.getElementById("userPublicPasswordConfirm");
const togglePasswordBtn = document.getElementById("toggleUserPublicPassword");
const togglePasswordConfirmBtn = document.getElementById("toggleUserPublicPasswordConfirm");
const passwordHelp = document.getElementById("userPublicPasswordHelp");

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
const detailModal = document.getElementById("detailUserPublicModal");
const detailModalBody = document.getElementById("detailUserPublicModalBody");
const closeDetailModalBtn = document.getElementById("closeDetailPublicModal");
const closeDetailBtn = document.getElementById("closeDetailPublicBtn");


// ======================================================
// DATA & STATE
// ======================================================

let allUsers = [];
let filteredUsers = [];
let devicesList = [];
let editingUserId = null;

let currentPage = 1;
const usersPerPage = 10;


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
// AMBIL DATA USER PUBLIC DARI DB2
// ======================================================

function loadUsers() {
    onValue(usersRef, (snapshot) => {
        const data = snapshot.val() || {};

        allUsers = Object.entries(data)
            .filter(([id, user]) => {
                if (!user || typeof user !== "object") return false;
                const role = (user.role || "").toLowerCase().trim();
                // Hanya ambil user publik biasa (bukan admin dan bukan petugas)
                return role !== "admin" && role !== "administrator" && role !== "petugas" && role !== "petugas lapangan" && role !== "security";
            })
            .map(([id, user]) => {
                if (!user || typeof user !== "object") {
                    return {
                        id: id,
                        name: "Tidak Diketahui",
                        username: "-",
                        email: "-",
                        phone: "-",
                        gender: "-",
                        role: "user",
                        assigned_device: "-",
                        assigned_zone: "-",
                        status: "active"
                    };
                }

                return {
                    id: id,
                    ...user,
                    name: user.name || user.nama || user.fullName || "Tidak Diketahui",
                    username: user.username || "-",
                    email: user.email || "-",
                    phone: user.phone || user.phoneNumber || user.no_hp || "-",
                    gender: user.gender || user.jenis_kelamin || "-",
                    birth_date: user.birth_date || user.tanggal_lahir || "-",
                    full_address: user.full_address || user.alamat || "-",
                    province: user.province || "-",
                    city: user.city || "-",
                    district: user.district || "-",
                    subdistrict: user.subdistrict || "-",
                    postal_code: user.postal_code || "-",
                    blood_type: user.blood_type || user.golongan_darah || "-",
                    allergies: user.allergies || user.alergi || "-",
                    medical_notes: user.medical_notes || user.kondisi_medis || user.catatan_kesehatan || "-",
                    emergency_name_1: user.emergency_name_1 || "-",
                    emergency_relation_1: user.emergency_relation_1 || "-",
                    emergency_phone_1: user.emergency_phone_1 || "-",
                    emergency_name_2: user.emergency_name_2 || "-",
                    emergency_relation_2: user.emergency_relation_2 || "-",
                    emergency_phone_2: user.emergency_phone_2 || "-",
                    role: user.role || "user",
                    assigned_device: user.assigned_device || user.device_id || "-",
                    assigned_zone: user.assigned_zone || "-",
                    status: user.status || "active",
                    created_at: user.created_at || user.createdAt || Date.now()
                };
            });

        applyFilters();
    }, (error) => {
        console.error("Error loading users from DB2:", error);
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fa-solid fa-circle-exclamation" style="font-size: 36px; color: var(--dash-emergency); margin-bottom: 8px; display: block;"></i>
                        <strong style="display:block; font-size:14.5px; margin-bottom:4px; color:var(--dash-text-main);">Gagal Memuat Data</strong>
                        <span style="font-size:12.5px; color:var(--dash-text-muted);">${escapeHtml(error.message)}</span>
                    </td>
                </tr>
            `;
        }
    });
}


// ======================================================
// AMBIL DATA PERANGKAT IOT DARI DB2
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


// ======================================================
// FILTER DATA
// ======================================================

function applyFilters() {
    const keyword = (searchInput?.value || "").trim().toLowerCase();

    if (!keyword) {
        filteredUsers = allUsers.slice();
    } else {
        filteredUsers = allUsers.filter(user => {
            const name = (user.name || "").toLowerCase();
            const username = (user.username || "").toLowerCase();
            const email = (user.email || "").toLowerCase();
            const phone = (user.phone || "").toLowerCase();
            const device = (user.assigned_device || "").toLowerCase();
            const zone = (user.assigned_zone || "").toLowerCase();
            const blood = (user.blood_type || "").toLowerCase();

            return (
                name.includes(keyword) ||
                username.includes(keyword) ||
                email.includes(keyword) ||
                phone.includes(keyword) ||
                device.includes(keyword) ||
                zone.includes(keyword) ||
                blood.includes(keyword)
            );
        });
    }

    currentPage = 1;
    updatePagination();
}


// ======================================================
// RENDER TABEL USER PUBLIC
// ======================================================

function renderTable(users) {
    if (!tableBody) return;

    if (users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fa-solid fa-users-slash" style="font-size: 36px; margin-bottom: 8px; display: block; opacity: 0.6;"></i>
                    <strong style="display:block; font-size:14.5px; margin-bottom:4px; color:var(--dash-text-main);">Tidak ada data user public ditemukan.</strong>
                    <span style="font-size:12.5px; color:var(--dash-text-muted);">Coba sesuaikan kata kunci pencarian Anda.</span>
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

        const phoneDisplay = user.phone && user.phone !== '-'
            ? `<span>${escapeHtml(user.phone)}</span>`
            : `<span style="color:var(--dash-text-muted); font-size:12.5px;">-</span>`;

        const emailDisplay = user.email && user.email !== '-'
            ? `<span>${escapeHtml(user.email)}</span>`
            : `<span style="color:var(--dash-text-muted); font-size:12.5px;">-</span>`;

        let genderDisplay = `<span style="color:var(--dash-text-muted); font-size:12.5px;">-</span>`;
        const g = (user.gender || "").toLowerCase();
        if (g.includes("laki") || g === "pria" || g === "male") {
            genderDisplay = `<span>Laki-laki</span>`;
        } else if (g.includes("perempuan") || g === "wanita" || g === "female") {
            genderDisplay = `<span>Perempuan</span>`;
        } else if (user.gender && user.gender !== "-") {
            genderDisplay = `<span>${escapeHtml(user.gender)}</span>`;
        }

        return `
            <tr>
                <td style="text-align: center; font-weight: 700; color: var(--dash-text-muted);">
                    ${globalIndex}
                </td>

                <td style="font-weight: 600;">
                    ${escapeHtml(user.name || "-")}
                </td>

                <td>
                    ${phoneDisplay}
                </td>

                <td>
                    ${emailDisplay}
                </td>

                <td>
                    ${genderDisplay}
                </td>

                <td style="text-align: center;">
                    <div class="table-action-btns">
                        <button type="button" class="btn-table-action btn-action-edit" onclick="window.editUserPublic('${escapeHtml(user.id)}')" title="Edit Data User Public">
                            <span>Edit</span>
                        </button>
                        <button type="button" class="btn-table-action btn-action-detail" onclick="window.detailUserPublic('${escapeHtml(user.id)}')" title="Lihat Profil Lengkap & Medis">
                            <span>Detail</span>
                        </button>
                        <button type="button" class="btn-table-action btn-action-delete" onclick="window.deleteUserPublic('${escapeHtml(user.id)}')" title="Hapus User Public">
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
        paginationInfo.textContent = `Menampilkan ${totalItems === 0 ? 0 : startIndex + 1} - ${endIndex} dari ${totalItems} data user public`;
    }

    if (prevPage) prevPage.disabled = currentPage === 1;
    if (nextPage) nextPage.disabled = endIndex >= totalItems || totalItems === 0;
}


// ======================================================
// DETAIL USER PUBLIC - LENGKAP DENGAN DATA MEDIS & KONTAK
// ======================================================

window.detailUserPublic = function (userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        Swal.fire({
            icon: 'error',
            title: 'User Tidak Ditemukan',
            text: 'Data user public tidak ditemukan.',
            confirmButtonColor: '#173f70'
        });
        return;
    }

    if (detailModalBody) {
        // Gabungkan alamat lengkap
        const addressParts = [
            user.full_address !== "-" ? user.full_address : null,
            user.subdistrict !== "-" ? `Kel. ${user.subdistrict}` : null,
            user.district !== "-" ? `Kec. ${user.district}` : null,
            user.city !== "-" ? user.city : null,
            user.province !== "-" ? user.province : null,
            user.postal_code !== "-" ? `Kode Pos: ${user.postal_code}` : null
        ].filter(Boolean).join(", ") || "-";

        detailModalBody.innerHTML = `
            <div class="user-detail-profile-header">
                <div class="user-detail-avatar-large">
                    ${escapeHtml((user.name || "U").charAt(0).toUpperCase())}
                </div>
                <div class="user-detail-title-block">
                    <h3>${escapeHtml(user.name || "-")}</h3>
                    <span class="user-role-badge-large">@${escapeHtml(user.username || "user")} • ${(user.role || "user").toUpperCase()}</span>
                </div>
            </div>

            <div class="detail-section-title">
                <i class="fa-solid fa-user"></i>
                <span>Informasi Pribadi</span>
            </div>
            <div class="user-detail-grid">
                <div class="detail-item">
                    <span class="detail-label"><i class="fa-solid fa-phone"></i> Nomor HP / WhatsApp</span>
                    <strong class="detail-value">${escapeHtml(user.phone || "-")}</strong>
                </div>

                <div class="detail-item">
                    <span class="detail-label"><i class="fa-solid fa-envelope"></i> Email</span>
                    <strong class="detail-value">${escapeHtml(user.email || "-")}</strong>
                </div>

                <div class="detail-item">
                    <span class="detail-label"><i class="fa-solid fa-venus-mars"></i> Jenis Kelamin</span>
                    <strong class="detail-value">${escapeHtml(user.gender || "-")}</strong>
                </div>

                <div class="detail-item">
                    <span class="detail-label"><i class="fa-solid fa-cake-candles"></i> Tanggal Lahir</span>
                    <strong class="detail-value">${escapeHtml(user.birth_date || "-")}</strong>
                </div>

                <div class="detail-item full-width">
                    <span class="detail-label"><i class="fa-solid fa-map-location-dot"></i> Alamat Lengkap</span>
                    <strong class="detail-value">${escapeHtml(addressParts)}</strong>
                </div>
            </div>

            <div class="detail-section-title" style="margin-top: 18px;">
                <i class="fa-solid fa-heart-pulse"></i>
                <span>Informasi Medis & Kesehatan</span>
            </div>
            <div class="user-detail-grid">
                <div class="detail-item">
                    <span class="detail-label"><i class="fa-solid fa-droplet"></i> Golongan Darah</span>
                    <strong class="detail-value" style="color:var(--dash-emergency);">${escapeHtml(user.blood_type || "-")}</strong>
                </div>

                <div class="detail-item">
                    <span class="detail-label"><i class="fa-solid fa-hand-dots"></i> Alergi</span>
                    <strong class="detail-value">${escapeHtml(user.allergies || "-")}</strong>
                </div>

                <div class="detail-item full-width">
                    <span class="detail-label"><i class="fa-solid fa-notes-medical"></i> Kondisi / Catatan Medis</span>
                    <strong class="detail-value">${escapeHtml(user.medical_notes || "-")}</strong>
                </div>
            </div>

            <div class="detail-section-title" style="margin-top: 18px;">
                <i class="fa-solid fa-truck-medical"></i>
                <span>Kontak Darurat</span>
            </div>
            <div class="user-detail-grid">
                <div class="detail-item">
                    <span class="detail-label"><i class="fa-solid fa-user-shield"></i> Kontak Darurat 1</span>
                    <strong class="detail-value">
                        ${escapeHtml(user.emergency_name_1 !== "-" ? `${user.emergency_name_1} (${user.emergency_relation_1 || "-"})` : "-")}<br>
                        <small style="font-family:monospace; color:var(--dash-text-muted);">${escapeHtml(user.emergency_phone_1 || "")}</small>
                    </strong>
                </div>

                <div class="detail-item">
                    <span class="detail-label"><i class="fa-solid fa-user-shield"></i> Kontak Darurat 2</span>
                    <strong class="detail-value">
                        ${escapeHtml(user.emergency_name_2 !== "-" ? `${user.emergency_name_2} (${user.emergency_relation_2 || "-"})` : "-")}<br>
                        <small style="font-family:monospace; color:var(--dash-text-muted);">${escapeHtml(user.emergency_phone_2 || "")}</small>
                    </strong>
                </div>
            </div>

            <div class="detail-section-title" style="margin-top: 18px;">
                <i class="fa-solid fa-microchip"></i>
                <span>Perangkat IoT & Status Akun</span>
            </div>
            <div class="user-detail-grid">
                <div class="detail-item">
                    <span class="detail-label"><i class="fa-solid fa-microchip"></i> Perangkat IoT</span>
                    <strong class="detail-value" style="color:var(--dash-primary);">${escapeHtml(user.assigned_device || "-")}</strong>
                </div>

                <div class="detail-item">
                    <span class="detail-label"><i class="fa-solid fa-location-dot"></i> Zona Perangkat</span>
                    <strong class="detail-value" style="color:var(--dash-primary);">${escapeHtml(user.assigned_zone || "-")}</strong>
                </div>
            </div>
        `;
    }

    if (detailModal) {
        detailModal.style.display = "flex";
    }
};

if (closeDetailModalBtn) {
    closeDetailModalBtn.addEventListener("click", () => {
        if (detailModal) detailModal.style.display = "none";
    });
}

if (closeDetailBtn) {
    closeDetailBtn.addEventListener("click", () => {
        if (detailModal) detailModal.style.display = "none";
    });
}


// ======================================================
// EDIT USER PUBLIC
// ======================================================

window.editUserPublic = function (userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        Swal.fire({
            icon: 'error',
            title: 'User Tidak Ditemukan',
            text: 'Data user public tidak ditemukan.',
            confirmButtonColor: '#173f70'
        });
        return;
    }

    editingUserId = userId;

    if (modalTitle) modalTitle.textContent = "Edit User Public";
    if (saveBtnText) saveBtnText.textContent = "Update User Public";

    if (nameInput) nameInput.value = user.name || "";
    if (usernameInput) usernameInput.value = user.username && user.username !== "-" ? user.username : "";
    if (emailInput) emailInput.value = user.email && user.email !== "-" ? user.email : "";
    if (phoneInput) phoneInput.value = user.phone && user.phone !== "-" ? user.phone : "";
    if (genderInput) genderInput.value = user.gender || "";
    if (statusSelect) statusSelect.value = user.role || "user";

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
    if (passwordHelp) passwordHelp.style.display = "block";

    if (deviceSelect) {
        deviceSelect.value = user.assigned_device || "";
        if (devicesList.length === 0) loadDevices();
        setTimeout(() => {
            if (deviceSelect) deviceSelect.value = user.assigned_device || "";
            if (zonaInput) zonaInput.value = user.assigned_zone || "";
        }, 300);
    }

    if (modal) {
        modal.style.display = "flex";
        setTimeout(autoFillZona, 150);
    }
};


// ======================================================
// DELETE USER PUBLIC
// ======================================================

window.deleteUserPublic = async function (userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const result = await Swal.fire({
        title: 'Hapus User Public?',
        text: `Anda yakin ingin menghapus user public "${user.name || 'ini'}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
        try {
            await remove(ref(db2, `users/${userId}`));

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'User public berhasil dihapus dari sistem.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: 'Gagal menghapus user: ' + error.message,
                confirmButtonColor: '#173f70'
            });
        }
    }
};


// ======================================================
// MODAL ADD - OPEN & CLOSE
// ======================================================

if (openModalBtn && modal) {
    openModalBtn.addEventListener("click", () => {
        editingUserId = null;
        if (modalTitle) modalTitle.textContent = "Tambah User Public";
        if (saveBtnText) saveBtnText.textContent = "Simpan User Public";
        resetForm();
        modal.style.display = "flex";
        loadDevices();
        setTimeout(autoFillZona, 150);
    });
}

if (modal) {
    [closeModalBtn, cancelBtn].forEach((btn) => {
        if (btn) {
            btn.addEventListener("click", () => {
                modal.style.display = "none";
                resetForm();
                editingUserId = null;
            });
        }
    });

    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
            resetForm();
            editingUserId = null;
        }
        if (event.target === detailModal) {
            detailModal.style.display = "none";
        }
    });
}

function resetForm() {
    if (nameInput) nameInput.value = "";
    if (usernameInput) usernameInput.value = "";
    if (emailInput) emailInput.value = "";
    if (phoneInput) phoneInput.value = "";
    if (genderInput) genderInput.value = "";
    if (deviceSelect) deviceSelect.value = "";
    if (zonaInput) zonaInput.value = "";
    if (statusSelect) statusSelect.value = "user";
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
}


// ======================================================
// SIMPAN / UPDATE USER PUBLIC
// ======================================================

if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
        const name = nameInput?.value.trim();
        const username = usernameInput?.value.trim();
        const email = emailInput?.value.trim().toLowerCase();
        const phone = phoneInput?.value.trim();
        const gender = genderInput?.value || "";
        const assignedDevice = deviceSelect?.value || "";
        const assignedZone = zonaInput?.value.trim() || "";
        const role = statusSelect?.value || "user";
        const password = passwordInput?.value.trim();
        const passwordConfirm = passwordConfirmInput?.value.trim();

        if (!name) {
            Swal.fire({
                icon: "warning",
                title: "Data Belum Lengkap",
                text: "Nama lengkap user public wajib diisi!",
                confirmButtonColor: "#173f70"
            });
            return;
        }

        if (!editingUserId && !password) {
            Swal.fire({
                icon: "warning",
                title: "Password Wajib Diisi",
                text: "Password akun user public baru wajib diisi (min. 6 karakter).",
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

        try {
            let hashedPassword = null;
            if (password) {
                hashedPassword = typeof window.hashPassword === "function"
                    ? await window.hashPassword(password)
                    : password;
            }

            const userData = {
                name: name,
                username: username || "-",
                email: email || "-",
                phone: phone || "-",
                gender: gender || "-",
                role: role,
                assigned_device: assignedDevice,
                assigned_zone: assignedZone,
                updated_at: Date.now()
            };

            if (hashedPassword) {
                userData.password = hashedPassword;
            }

            if (editingUserId) {
                // UPDATE MODE
                await update(ref(db2, `users/${editingUserId}`), userData);

                Swal.fire({
                    icon: "success",
                    title: "Berhasil",
                    text: "Data user public berhasil diperbarui!",
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                // CREATE MODE
                const newUserRef = push(ref(db2, "users"));
                userData.created_at = Date.now();
                userData.status = "active";
                await set(newUserRef, userData);

                Swal.fire({
                    icon: "success",
                    title: "Berhasil",
                    text: "User public baru berhasil ditambahkan!",
                    timer: 2000,
                    showConfirmButton: false
                });
            }

            if (modal) modal.style.display = "none";
            resetForm();
            editingUserId = null;

        } catch (error) {
            console.error("Error saving public user:", error);
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: `Gagal menyimpan data: ${error.message}`,
                confirmButtonColor: "#173f70"
            });
        }
    });
}


// ======================================================
// IMPORT / EXPORT EXCEL DATA USER PUBLIC (LENGKAP)
// ======================================================

function exportUserPublicToExcel() {
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
            text: "Tidak ada data user public untuk diekspor pada filter saat ini.",
            confirmButtonColor: "#173f70"
        });
        return;
    }

    // 1. Header & Subheader Excel
    const worksheetData = [
        ["Daftar Pengguna Public"],
        ["Data lengkap profil, informasi kontak, dan data kesehatan/medis pengguna publik Panic Button"],
        [], // Baris kosong pemisah
        [
            "No",
            "Nama Lengkap",
            "Username",
            "No Handphone",
            "Email",
            "Jenis Kelamin",
            "Tanggal Lahir",
            "Alamat Lengkap",
            "Golongan Darah",
            "Alergi",
            "Catatan Medis",
            "Kontak Darurat 1",
            "Kontak Darurat 2",
            "Perangkat IoT",
            "Zona"
        ]
    ];

    // 2. Data baris tabel
    dataToExport.forEach((user, idx) => {
        const address = user.full_address !== "-" ? user.full_address : [
            user.subdistrict !== "-" ? `Kel. ${user.subdistrict}` : null,
            user.district !== "-" ? `Kec. ${user.district}` : null,
            user.city !== "-" ? user.city : null,
            user.province !== "-" ? user.province : null
        ].filter(Boolean).join(", ") || "-";

        const emergency1 = user.emergency_name_1 && user.emergency_name_1 !== "-"
            ? `${user.emergency_name_1} (${user.emergency_relation_1 || '-'} - ${user.emergency_phone_1 || '-'})`
            : "-";

        const emergency2 = user.emergency_name_2 && user.emergency_name_2 !== "-"
            ? `${user.emergency_name_2} (${user.emergency_relation_2 || '-'} - ${user.emergency_phone_2 || '-'})`
            : "-";

        worksheetData.push([
            idx + 1,
            user.name || "-",
            user.username || "-",
            user.phone || "-",
            user.email || "-",
            user.gender || "-",
            user.birth_date || "-",
            address,
            user.blood_type || "-",
            user.allergies || "-",
            user.medical_notes || "-",
            emergency1,
            emergency2,
            user.assigned_device || "-",
            user.assigned_zone || "-"
        ]);
    });

    // 3. Konversi array ke Worksheet
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // 4. Merge Header A1:O1 dan A2:O2
    ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } }
    ];

    // 5. Atur lebar kolom agar fungsional & tidak terpotong
    ws["!cols"] = [
        { wch: 6 },  // No
        { wch: 28 }, // Nama Lengkap
        { wch: 18 }, // Username
        { wch: 18 }, // No Handphone
        { wch: 26 }, // Email
        { wch: 16 }, // Jenis Kelamin
        { wch: 16 }, // Tanggal Lahir
        { wch: 38 }, // Alamat Lengkap
        { wch: 16 }, // Golongan Darah
        { wch: 22 }, // Alergi
        { wch: 32 }, // Catatan Medis
        { wch: 32 }, // Kontak Darurat 1
        { wch: 32 }, // Kontak Darurat 2
        { wch: 20 }, // Perangkat IoT
        { wch: 16 }  // Zona
    ];

    // 6. Buat Workbook & Tulis File
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "User Public");

    const filename = `Daftar_Pengguna_Public_${Date.now()}.xlsx`;
    XLSX.writeFile(wb, filename);

    Swal.fire({
        icon: "success",
        title: "File Excel Berhasil Diunduh!",
        text: "Data profil lengkap pengguna publik berhasil diekspor ke Excel.",
        timer: 2000,
        showConfirmButton: false
    });
}

if (btnExportExcel) {
    btnExportExcel.addEventListener("click", exportUserPublicToExcel);
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

loadUsers();
loadDevices();

console.log("User Public Management Table & Export initialized smoothly.");