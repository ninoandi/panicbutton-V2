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
    remove
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

const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
const paginationInfo = document.getElementById("paginationInfo");


// ======================================================
// DATA & PAGINATION
// ======================================================

let allUsers = [];
let filteredUsers = [];
let perumahanNames = [];

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
// AMBIL DATA USER DARI FIREBASE (OPTIMASI)
// ======================================================

let loadTimeout = null;
let isFirstLoad = true;

function loadUsers() {
    // Gunakan once() untuk data besar, bukan onValue() agar tidak terus-menerus
    // Tapi kita tetap pakai onValue untuk realtime, dengan throttling
    onValue(perumahanRef, (snapshot) => {
        // Throttle: hindari proses berulang terlalu cepat
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
    
    // Reset data
    allUsers = [];
    const perumahanNamesSet = new Set();
    const userMap = new Map(); // Gunakan Map untuk akses lebih cepat

    if (data) {
        // Loop perumahan
        Object.entries(data).forEach(([perumahanKey, perumahanData]) => {
            const users = perumahanData.users || {};
            const perumahanName = perumahanData.info?.nama || perumahanKey;

            // Loop users
            Object.entries(users).forEach(([userId, userInfo]) => {
                // Gunakan Map untuk menghindari duplikasi jika ada
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
        
        // Konversi Map ke Array
        allUsers = Array.from(userMap.values());
        perumahanNames = Array.from(perumahanNamesSet);
    }

    // Update UI
    updateSummaryMetrics();
    populatePerumahanOptions(perumahanNames);
    applyFilters();
    
    isDataLoaded = true;
    isFirstLoad = false;
    
    const endTime = performance.now();
    console.log(`Data user loaded in ${(endTime - startTime).toFixed(2)}ms, total: ${allUsers.length} users`);
}


// ======================================================
// UPDATE SUMMARY METRICS
// ======================================================

function updateSummaryMetrics() {
    const total = allUsers.length;
    let adminCount = 0;
    
    // Gunakan loop biasa untuk performa lebih baik
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
// RENDER USER CARD GRID (OPTIMASI)
// ======================================================

function renderCards(users) {
    if (!cardContainer) return;

    // Jika tidak ada data
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

    // Build HTML menggunakan array join untuk performa lebih baik
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

                    <div class="user-detail-row">
                        <i class="fa-solid fa-key"></i>
                        <div class="user-detail-text">
                            <span class="user-detail-label">Password Akun</span>
                            <strong class="user-detail-value">
                                <span class="password-pill">${escapeHtml(user.password || "-")}</span>
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
            </div>
        `);
    });

    cardContainer.innerHTML = cardHtml.join("");
}


// ======================================================
// FILTER DATA (OPTIMASI)
// ======================================================

let filterTimeout = null;

function applyFilters() {
    const role = (roleFilter?.value || "").trim().toLowerCase();
    const perumahan = (perumahanFilter?.value || "").trim().toLowerCase();
    const keyword = (searchInput?.value || "").trim().toLowerCase();

    // Jika keyword kosong dan filter default, tampilkan semua dengan cepat
    if (!keyword && !role && !perumahan) {
        filteredUsers = allUsers.slice(); // Copy cepat
    } else {
        // Filter dengan loop biasa untuk performa
        filteredUsers = [];
        const keywordLower = keyword;
        
        for (let i = 0; i < allUsers.length; i++) {
            const user = allUsers[i];
            
            // Role filter
            if (role && (user.role || "").toLowerCase() !== role) {
                continue;
            }
            
            // Perumahan filter
            if (perumahan && (user.perumahanName || "").toLowerCase() !== perumahan) {
                continue;
            }
            
            // Keyword search
            if (keywordLower) {
                const userName = (user.name || "").toLowerCase();
                const userHouse = (user.houseNumber || "").toString().toLowerCase();
                const userPhone = (user.phoneNumber || "").toString().toLowerCase();
                
                if (!userName.includes(keywordLower) && 
                    !userHouse.includes(keywordLower) && 
                    !userPhone.includes(keywordLower)) {
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
// MODAL - BUKA & TUTUP
// ======================================================

if (openAddUserModal && addUserModal) {
    openAddUserModal.addEventListener("click", () => {
        addUserModal.style.display = "flex";
    });
}

if (addUserModal) {
    [closeModal, cancelBtn].forEach((btn) => {
        if (btn) {
            btn.addEventListener("click", () => {
                addUserModal.style.display = "none";
                resetForm();
            });
        }
    });

    window.addEventListener("click", (event) => {
        if (event.target === addUserModal) {
            addUserModal.style.display = "none";
            resetForm();
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
// RESET FORM
// ======================================================

function resetForm() {
    if (perumahanSelect) perumahanSelect.value = "";
    if (userNameInput) userNameInput.value = "";
    if (houseNumberInput) houseNumberInput.value = "";
    if (passwordInput) passwordInput.value = "";
    if (roleSelect) roleSelect.value = "user";
    if (customRoleInput) {
        customRoleInput.value = "";
        customRoleInput.style.display = "none";
    }
}


// ======================================================
// SIMPAN USER KE FIREBASE
// ======================================================

if (saveUserBtn) {
    saveUserBtn.addEventListener("click", async () => {
        const perumahanKey = perumahanSelect?.value;
        const name = userNameInput?.value.trim();
        const houseNumber = houseNumberInput?.value.trim();
        const password = passwordInput?.value.trim();
        const roleOption = roleSelect?.value;
        const customRole = customRoleInput?.value.trim();

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
            const newUserRef = push(ref(db1, `perumahan/${perumahanKey}/users`));

            await set(newUserRef, {
                coverImage: "",
                houseNumber: houseNumber,
                name: name,
                note: "",
                password: password,
                phoneNumber: "",
                profileImage: "",
                role: role.toLowerCase()
            });

            if (addUserModal) addUserModal.style.display = "none";
            resetForm();

            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "success",
                    title: "Berhasil",
                    text: "Pengguna baru berhasil ditambahkan!",
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                alert("User berhasil ditambahkan!");
            }
        } catch (error) {
            console.error("Error adding user:", error);
            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "error",
                    title: "Gagal",
                    text: `Gagal menambahkan pengguna: ${error.message}`,
                    confirmButtonColor: "#173f70"
                });
            } else {
                alert("Gagal menambahkan user.");
            }
        }
    });
}


// ======================================================
// EVENT FILTER & PAGINATION LISTENERS
// ======================================================

// Filter dengan debounce untuk search
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

console.log("Manajemen Pengguna initialized smoothly.");