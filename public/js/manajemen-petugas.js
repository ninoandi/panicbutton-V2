/* =========================================================
   MANAJEMEN PETUGAS - DUAL DATABASE CONTROLLER JAVASCRIPT
   Firebase Realtime Database (DB1 Perumahan & DB2 Public)
========================================================= */

import { db1, db2 } from "./firebase-config.js";
import {
    ref,
    onValue,
    push,
    set,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
    console.log("Manajemen Petugas (Dual Database) Initialized");

    // Elements
    const searchInput = document.getElementById("searchInput");
    const petugasTableBody = document.getElementById("petugasTableBody");
    const mobileCardsContainer = document.getElementById("mobileCardsContainer");
    const syncStatus = document.getElementById("syncStatus");

    // Pagination Elements
    const paginationInfo = document.getElementById("paginationInfo");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    // Modal Form Elements
    const openAddPetugasBtn = document.getElementById("openAddPetugasModal");
    const petugasFormModal = document.getElementById("petugasFormModal");
    const closeFormModalBtn = document.getElementById("closeFormModal");
    const cancelFormBtn = document.getElementById("cancelFormBtn");
    const savePetugasBtn = document.getElementById("savePetugasBtn");
    const formModalTitle = document.getElementById("formModalTitle");

    // Dynamic Form Elements
    const petugasIdInput = document.getElementById("petugasId");
    const petugasSourceInput = document.getElementById("petugasSource");
    const petugasPerumahanKeyInput = document.getElementById("petugasPerumahanKey");
    const petugasTypeSelect = document.getElementById("petugasTypeSelect");
    const dynamicFieldsContainer = document.getElementById("dynamicFieldsContainer");
    const perumahanSelectGroup = document.getElementById("perumahanSelectGroup");
    const petugasPerumahanSelect = document.getElementById("petugasPerumahanSelect");
    const poskoNumberGroup = document.getElementById("poskoNumberGroup");
    const petugasPoskoNumber = document.getElementById("petugasPoskoNumber");

    const petugasNameInput = document.getElementById("petugasName");
    const petugasPhoneInput = document.getElementById("petugasPhone");
    const petugasEmailInput = document.getElementById("petugasEmail");
    const petugasPasswordInput = document.getElementById("petugasPassword");
    const petugasPasswordConfirmInput = document.getElementById("petugasPasswordConfirm");
    const togglePetugasPasswordBtn = document.getElementById("togglePetugasPassword");
    const togglePetugasPasswordConfirmBtn = document.getElementById("togglePetugasPasswordConfirm");
    const passwordHelp = document.getElementById("passwordHelp");

    // Toggle Password Visibility Helper
    function setupPasswordToggle(btn, input) {
        if (!btn || !input) return;
        btn.addEventListener("click", () => {
            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";
            btn.innerHTML = isPassword ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
        });
    }

    setupPasswordToggle(togglePetugasPasswordBtn, petugasPasswordInput);
    setupPasswordToggle(togglePetugasPasswordConfirmBtn, petugasPasswordConfirmInput);

    // Modal Detail Elements
    const petugasDetailModal = document.getElementById("petugasDetailModal");
    const closeDetailModalBtn = document.getElementById("closeDetailModal");
    const closeDetailBtn = document.getElementById("closeDetailBtn");
    const detailName = document.getElementById("detailName");
    const detailPhone = document.getElementById("detailPhone");
    const detailStatus = document.getElementById("detailStatus");
    const detailPerumahanWrapper = document.getElementById("detailPerumahanWrapper");
    const detailPerumahan = document.getElementById("detailPerumahan");
    const detailEmail = document.getElementById("detailEmail");
    const detailRole = document.getElementById("detailRole");
    const detailRegistered = document.getElementById("detailRegistered");
    const detailFullAddress = document.getElementById("detailFullAddress");

    // State Variables
    let publicPetugasList = [];
    let perumahanPetugasList = [];
    let allPetugas = [];
    let filteredPetugas = [];
    let daftarPerumahanCache = {};

    let currentPage = 1;
    const itemsPerPage = 10;
    let isEditing = false;

    // Helper: Escape HTML
    function escapeHtml(str) {
        if (!str && str !== 0) return "-";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeAttribute(str) {
        if (!str && str !== 0) return "";
        return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    /* =========================================================
       1. AMBIL DAFTAR PERUMAHAN UNTUK DROPDOWN
    ========================================================= */

    const daftarPerumahanRef = ref(db1, "daftar_perumahan");
    onValue(daftarPerumahanRef, (snapshot) => {
        const data = snapshot.val() || {};
        daftarPerumahanCache = data;
        populatePerumahanDropdown(data);
    });

    function populatePerumahanDropdown(data) {
        if (!petugasPerumahanSelect) return;
        const currentVal = petugasPerumahanSelect.value;
        petugasPerumahanSelect.innerHTML = '<option value="">-- Pilih Kawasan Perumahan --</option>';

        Object.entries(data).forEach(([key, name]) => {
            const opt = document.createElement("option");
            opt.value = key;
            opt.textContent = name;
            petugasPerumahanSelect.appendChild(opt);
        });

        if (currentVal && data[currentVal]) {
            petugasPerumahanSelect.value = currentVal;
        }
    }

    /* =========================================================
       2. REALTIME LISTENER DB2 (PETUGAS PUBLIC)
    ========================================================= */

    const usersDb2Ref = ref(db2, "users");
    onValue(usersDb2Ref, (snapshot) => {
        const data = snapshot.val() || {};
        publicPetugasList = [];

        Object.entries(data).forEach(([key, user]) => {
            if (user && typeof user === "object") {
                const role = (user.role || "").toLowerCase().trim();
                if (role === "petugas" || role === "petugas lapangan" || role === "security") {
                    publicPetugasList.push({
                        id: key,
                        source: "public",
                        statusLabel: "Public",
                        name: user.name || user.nama || user.fullName || "-",
                        phone: user.phone || user.phoneNumber || user.no_hp || "-",
                        email: user.email || "-",
                        houseNumber: "-",
                        perumahanKey: "",
                        perumahanName: "-",
                        role: "Petugas Lapangan",
                        created_at: user.created_at || user.createdAt || null,
                        full_address: user.full_address || user.alamat || "-"
                    });
                }
            }
        });

        combineAndRenderPetugas();
    });

    /* =========================================================
       3. REALTIME LISTENER DB1 (PETUGAS PERUMAHAN)
    ========================================================= */

    const perumahanDb1Ref = ref(db1, "perumahan");
    onValue(perumahanDb1Ref, (snapshot) => {
        const data = snapshot.val() || {};
        perumahanPetugasList = [];

        Object.entries(data).forEach(([pKey, pData]) => {
            if (pKey === "buzzers" || !pData || typeof pData !== "object") return;

            const users = pData.users || {};
            const housingName = pData.info?.nama || daftarPerumahanCache[pKey] || pKey;

            Object.entries(users).forEach(([userId, uInfo]) => {
                if (!uInfo || typeof uInfo !== "object") return;

                const role = (uInfo.role || "").toLowerCase().trim();
                // Deteksi role admin / satpam / petugas pada perumahan
                if (role === "admin" || role === "satpam" || role === "petugas" || role === "security") {
                    perumahanPetugasList.push({
                        id: userId,
                        source: "perumahan",
                        statusLabel: "Perumahan",
                        name: uInfo.name || uInfo.nama || "-",
                        phone: uInfo.phoneNumber || uInfo.phone || uInfo.no_hp || "-",
                        email: uInfo.email || "-",
                        houseNumber: uInfo.houseNumber || "Posko Keamanan",
                        perumahanKey: pKey,
                        perumahanName: housingName,
                        role: "Petugas Posko / Satpam",
                        created_at: uInfo.created_at || uInfo.updated_at || null,
                        full_address: `Perumahan ${housingName}`
                    });
                }
            });
        });

        combineAndRenderPetugas();
    });

    /* =========================================================
       4. GABUNGKAN DATA & TERAPKAN FILTER
    ========================================================= */

    function combineAndRenderPetugas() {
        if (syncStatus) syncStatus.textContent = "Realtime Terhubung";

        allPetugas = [...publicPetugasList, ...perumahanPetugasList];

        // Sort alfabetis berdasarkan nama
        allPetugas.sort((a, b) => a.name.localeCompare(b.name));

        applyFilters();
    }

    function applyFilters() {
        const query = (searchInput ? searchInput.value : "").trim().toLowerCase();

        if (!query) {
            filteredPetugas = [...allPetugas];
        } else {
            filteredPetugas = allPetugas.filter((petugas) => {
                const nameMatch = (petugas.name || "").toLowerCase().includes(query);
                const phoneMatch = (petugas.phone || "").toLowerCase().includes(query);
                const emailMatch = (petugas.email || "").toLowerCase().includes(query);
                const statusMatch = (petugas.statusLabel || "").toLowerCase().includes(query);
                const perumahanMatch = (petugas.perumahanName || "").toLowerCase().includes(query);
                return nameMatch || phoneMatch || emailMatch || statusMatch || perumahanMatch;
            });
        }

        currentPage = 1;
        renderTable();
    }

    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener("input", () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(applyFilters, 250);
        });
    }

    /* =========================================================
       5. RENDER TABEL & MOBILE CARDS
    ========================================================= */

    function renderTable() {
        if (!petugasTableBody) return;

        const totalItems = filteredPetugas.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const startIdx = (currentPage - 1) * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, totalItems);
        const pageData = filteredPetugas.slice(startIdx, endIdx);

        // Render Table Body
        if (pageData.length === 0) {
            petugasTableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6">
                        Tidak ada data petugas yang ditemukan.
                    </td>
                </tr>
            `;
            if (mobileCardsContainer) {
                mobileCardsContainer.innerHTML = `
                    <div style="text-align: center; padding: 30px; color: var(--dash-text-muted);">
                        Tidak ada data petugas ditemukan.
                    </div>
                `;
            }
        } else {
            petugasTableBody.innerHTML = pageData
                .map((petugas, index) => {
                    const rowNumber = startIdx + index + 1;
                    return `
                    <tr>
                        <td style="text-align: center; font-weight: 700; color: var(--dash-text-muted);">
                            ${rowNumber}
                        </td>
                        <td style="font-weight: 600;">
                            ${escapeHtml(petugas.name)}
                        </td>
                        <td style="text-align: center; font-family: monospace; font-size: 13px;">
                            ${escapeHtml(petugas.phone)}
                        </td>
                        <td style="font-size: 13px;">
                            ${escapeHtml(petugas.email || "-")}
                        </td>
                        <td style="text-align: center; font-weight: 600;">
                            ${escapeHtml(petugas.statusLabel)}
                        </td>
                        <td style="text-align: center;">
                            <div class="table-action-btns">
                                <button
                                    type="button"
                                    class="btn-table-action btn-action-edit"
                                    onclick="window.openEditPetugasModal('${escapeAttribute(petugas.id)}', '${escapeAttribute(petugas.source)}', '${escapeAttribute(petugas.perumahanKey)}')"
                                    title="Edit Data Petugas"
                                >
                                    <span>Edit</span>
                                </button>
                                <button
                                    type="button"
                                    class="btn-table-action btn-action-detail"
                                    onclick="window.openDetailPetugasModal('${escapeAttribute(petugas.id)}', '${escapeAttribute(petugas.source)}', '${escapeAttribute(petugas.perumahanKey)}')"
                                    title="Lihat Detail Petugas"
                                >
                                    <span>Detail</span>
                                </button>
                                <button
                                    type="button"
                                    class="btn-table-action btn-action-delete"
                                    onclick="window.confirmDeletePetugas('${escapeAttribute(petugas.id)}', '${escapeAttribute(petugas.source)}', '${escapeAttribute(petugas.perumahanKey)}', '${escapeAttribute(petugas.name)}')"
                                    title="Hapus Akun Petugas"
                                >
                                    <span>Hapus</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
                })
                .join("");

            // Render Mobile Cards
            if (mobileCardsContainer) {
                mobileCardsContainer.innerHTML = pageData
                    .map((petugas, index) => {
                        const rowNumber = startIdx + index + 1;
                        return `
                        <div class="petugas-mobile-card">
                            <div class="petugas-mobile-header">
                                <span class="petugas-mobile-index">Petugas #${rowNumber}</span>
                                <span style="font-weight: 700; font-size: 12px; color: var(--dash-primary);">${escapeHtml(petugas.statusLabel)}</span>
                            </div>
                            <h3 class="petugas-mobile-title">${escapeHtml(petugas.name)}</h3>
                            <div class="petugas-mobile-meta">
                                <div>Nomor Telepon: <strong>${escapeHtml(petugas.phone)}</strong></div>
                                ${petugas.source === "perumahan" ? `<div>Perumahan: <strong>${escapeHtml(petugas.perumahanName)}</strong></div>` : ""}
                                <div>Email: <strong>${escapeHtml(petugas.email)}</strong></div>
                            </div>
                            <div class="petugas-mobile-actions">
                                <button
                                    type="button"
                                    class="btn-table-action btn-action-edit"
                                    onclick="window.openEditPetugasModal('${escapeAttribute(petugas.id)}', '${escapeAttribute(petugas.source)}', '${escapeAttribute(petugas.perumahanKey)}')"
                                >
                                    <i class="fa-solid fa-pen"></i> Edit
                                </button>
                                <button
                                    type="button"
                                    class="btn-table-action btn-action-detail"
                                    onclick="window.openDetailPetugasModal('${escapeAttribute(petugas.id)}', '${escapeAttribute(petugas.source)}', '${escapeAttribute(petugas.perumahanKey)}')"
                                >
                                    <i class="fa-solid fa-eye"></i> Detail
                                </button>
                                <button
                                    type="button"
                                    class="btn-table-action btn-action-delete"
                                    onclick="window.confirmDeletePetugas('${escapeAttribute(petugas.id)}', '${escapeAttribute(petugas.source)}', '${escapeAttribute(petugas.perumahanKey)}', '${escapeAttribute(petugas.name)}')"
                                >
                                    <i class="fa-solid fa-trash"></i> Hapus
                                </button>
                            </div>
                        </div>
                    `;
                    })
                    .join("");
            }
        }

        // Update Pagination Info
        if (paginationInfo) {
            if (totalItems === 0) {
                paginationInfo.textContent = "Menampilkan 0 - 0 dari 0 data";
            } else {
                paginationInfo.textContent = `Menampilkan ${startIdx + 1} - ${endIdx} dari ${totalItems} data (Halaman ${currentPage} dari ${totalPages})`;
            }
        }

        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            const totalPages = Math.ceil(filteredPetugas.length / itemsPerPage) || 1;
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });
    }

    /* =========================================================
       6. MODAL TAMBAH & EDIT (DYNAMIC CATEGORY HANDLER)
    ========================================================= */

    function resetFormFields() {
        if (petugasIdInput) petugasIdInput.value = "";
        if (petugasSourceInput) petugasSourceInput.value = "public";
        if (petugasPerumahanKeyInput) petugasPerumahanKeyInput.value = "";
        if (petugasTypeSelect) {
            petugasTypeSelect.value = "";
            petugasTypeSelect.disabled = false;
        }
        if (petugasPerumahanSelect) petugasPerumahanSelect.value = "";
        if (petugasPoskoNumber) petugasPoskoNumber.value = "";
        if (petugasNameInput) petugasNameInput.value = "";
        if (petugasPhoneInput) petugasPhoneInput.value = "";
        if (petugasEmailInput) petugasEmailInput.value = "";
        if (petugasPasswordInput) {
            petugasPasswordInput.value = "";
            petugasPasswordInput.type = "password";
        }
        if (petugasPasswordConfirmInput) {
            petugasPasswordConfirmInput.value = "";
            petugasPasswordConfirmInput.type = "password";
        }
        if (togglePetugasPasswordBtn) togglePetugasPasswordBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
        if (togglePetugasPasswordConfirmBtn) togglePetugasPasswordConfirmBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
        if (passwordHelp) passwordHelp.style.display = "none";
        if (dynamicFieldsContainer) dynamicFieldsContainer.style.display = "none";
        if (perumahanSelectGroup) perumahanSelectGroup.style.display = "none";
        if (poskoNumberGroup) poskoNumberGroup.style.display = "none";
    }

    function handleTypeSelection(type) {
        if (!type) {
            if (dynamicFieldsContainer) dynamicFieldsContainer.style.display = "none";
            return;
        }

        if (dynamicFieldsContainer) dynamicFieldsContainer.style.display = "flex";

        if (type === "perumahan") {
            if (perumahanSelectGroup) perumahanSelectGroup.style.display = "flex";
            if (poskoNumberGroup) poskoNumberGroup.style.display = "flex";
        } else {
            if (perumahanSelectGroup) perumahanSelectGroup.style.display = "none";
            if (poskoNumberGroup) poskoNumberGroup.style.display = "none";
        }
    }

    if (petugasTypeSelect) {
        petugasTypeSelect.addEventListener("change", (e) => {
            handleTypeSelection(e.target.value);
        });
    }

    function openAddModal() {
        isEditing = false;
        resetFormFields();

        if (formModalTitle) formModalTitle.textContent = "Tambah Petugas Baru";
        if (petugasPasswordInput) petugasPasswordInput.required = true;
        if (petugasPasswordConfirmInput) petugasPasswordConfirmInput.required = true;
        if (petugasFormModal) petugasFormModal.style.display = "flex";
    }

    window.openEditPetugasModal = function (petugasId, source, perumahanKey) {
        const petugas = allPetugas.find(
            (p) => p.id === petugasId && p.source === source && (source !== "perumahan" || p.perumahanKey === perumahanKey)
        );
        if (!petugas) return;

        isEditing = true;
        resetFormFields();

        if (formModalTitle) formModalTitle.textContent = "Edit Data Petugas";
        if (petugasIdInput) petugasIdInput.value = petugas.id;
        if (petugasSourceInput) petugasSourceInput.value = petugas.source;
        if (petugasPerumahanKeyInput) petugasPerumahanKeyInput.value = petugas.perumahanKey || "";

        if (petugasTypeSelect) {
            petugasTypeSelect.value = petugas.source;
            petugasTypeSelect.disabled = true; // Kunci kategori saat edit
        }

        handleTypeSelection(petugas.source);

        if (petugas.source === "perumahan" && petugasPerumahanSelect) {
            petugasPerumahanSelect.value = petugas.perumahanKey || "";
            if (petugasPoskoNumber) petugasPoskoNumber.value = petugas.houseNumber !== "-" ? petugas.houseNumber : "";
        }

        if (petugasNameInput) petugasNameInput.value = petugas.name !== "-" ? petugas.name : "";
        if (petugasPhoneInput) petugasPhoneInput.value = petugas.phone !== "-" ? petugas.phone : "";
        if (petugasEmailInput) petugasEmailInput.value = petugas.email !== "-" ? petugas.email : "";

        if (petugasPasswordInput) {
            petugasPasswordInput.value = "";
            petugasPasswordInput.type = "password";
            petugasPasswordInput.required = false;
        }
        if (petugasPasswordConfirmInput) {
            petugasPasswordConfirmInput.value = "";
            petugasPasswordConfirmInput.type = "password";
            petugasPasswordConfirmInput.required = false;
        }
        if (passwordHelp) passwordHelp.style.display = "block";

        if (petugasFormModal) petugasFormModal.style.display = "flex";
    };

    function closeFormModal() {
        if (petugasFormModal) petugasFormModal.style.display = "none";
        resetFormFields();
    }

    if (openAddPetugasBtn) openAddPetugasBtn.addEventListener("click", openAddModal);
    if (closeFormModalBtn) closeFormModalBtn.addEventListener("click", closeFormModal);
    if (cancelFormBtn) cancelFormBtn.addEventListener("click", closeFormModal);

    /* =========================================================
       7. SIMPAN PETUGAS (CREATE & UPDATE DUAL DB)
    ========================================================= */

    if (savePetugasBtn) {
        savePetugasBtn.addEventListener("click", async () => {
            const category = petugasTypeSelect ? petugasTypeSelect.value : "";
            const name = (petugasNameInput ? petugasNameInput.value : "").trim();
            const phone = (petugasPhoneInput ? petugasPhoneInput.value : "").trim();
            const email = (petugasEmailInput ? petugasEmailInput.value : "").trim().toLowerCase();
            const password = (petugasPasswordInput ? petugasPasswordInput.value : "").trim();
            const passwordConfirm = (petugasPasswordConfirmInput ? petugasPasswordConfirmInput.value : "").trim();
            const perumahanKey = petugasPerumahanSelect ? petugasPerumahanSelect.value : "";
            const poskoNumber = (petugasPoskoNumber ? petugasPoskoNumber.value : "").trim() || "Posko Keamanan";

            const petugasId = petugasIdInput ? petugasIdInput.value : "";
            const source = isEditing ? (petugasSourceInput ? petugasSourceInput.value : "public") : category;

            if (!category) {
                Swal.fire({
                    icon: "warning",
                    title: "Kategori Wajib Dipilih",
                    text: "Silakan pilih apakah Petugas Public atau Petugas Perumahan.",
                    confirmButtonColor: "#173f70"
                });
                return;
            }

            if (category === "perumahan" && !perumahanKey && !isEditing) {
                Swal.fire({
                    icon: "warning",
                    title: "Perumahan Wajib Dipilih",
                    text: "Silakan pilih kawasan perumahan untuk petugas ini.",
                    confirmButtonColor: "#173f70"
                });
                return;
            }

            if (!name) {
                Swal.fire({
                    icon: "warning",
                    title: "Nama Wajib Diisi",
                    text: "Silakan masukkan nama lengkap petugas.",
                    confirmButtonColor: "#173f70"
                });
                return;
            }

            if (!phone) {
                Swal.fire({
                    icon: "warning",
                    title: "Nomor Telepon Wajib Diisi",
                    text: "Silakan masukkan nomor telepon / WhatsApp petugas.",
                    confirmButtonColor: "#173f70"
                });
                return;
            }

            if (!email) {
                Swal.fire({
                    icon: "warning",
                    title: "Email Wajib Diisi",
                    text: "Silakan masukkan alamat email petugas untuk keperluan login sistem.",
                    confirmButtonColor: "#173f70"
                });
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                Swal.fire({
                    icon: "warning",
                    title: "Format Email Tidak Valid",
                    text: "Silakan masukkan alamat email yang benar (contoh: nama@domain.com).",
                    confirmButtonColor: "#173f70"
                });
                return;
            }

            if (!isEditing && !password) {
                Swal.fire({
                    icon: "warning",
                    title: "Password Wajib Diisi",
                    text: "Silakan buat kata sandi untuk akun petugas baru (min. 6 karakter).",
                    confirmButtonColor: "#173f70"
                });
                return;
            }

            if (password && password.length < 6) {
                Swal.fire({
                    icon: "warning",
                    title: "Password Terlalu Pendek",
                    text: "Kata sandi minimal terdiri dari 6 karakter.",
                    confirmButtonColor: "#173f70"
                });
                return;
            }

            if (password && password !== passwordConfirm) {
                Swal.fire({
                    icon: "warning",
                    title: "Konfirmasi Password Tidak Cocok",
                    text: "Pastikan kolom kata sandi dan konfirmasi kata sandi sama persis.",
                    confirmButtonColor: "#173f70"
                });
                return;
            }

            savePetugasBtn.disabled = true;
            savePetugasBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Menyimpan...</span>`;

            try {
                let hashedPassword = null;
                if (password) {
                    hashedPassword = typeof window.hashPassword === "function"
                        ? await window.hashPassword(password)
                        : password;
                }

                if (source === "perumahan") {
                    // ==========================================
                    // SIMPAN KE DB1 (PERUMAHAN)
                    // ==========================================
                    const targetPerumahanKey = isEditing ? (petugasPerumahanKeyInput.value || perumahanKey) : perumahanKey;

                    if (isEditing && petugasId) {
                        const updateData = {
                            name,
                            phoneNumber: phone,
                            houseNumber: poskoNumber,
                            email: email || "-",
                            updated_at: Date.now()
                        };
                        if (hashedPassword) updateData.password = hashedPassword;

                        await update(ref(db1, `perumahan/${targetPerumahanKey}/users/${petugasId}`), updateData);
                    } else {
                        const newRef = push(ref(db1, `perumahan/${targetPerumahanKey}/users`));
                        await set(newRef, {
                            name,
                            phoneNumber: phone,
                            houseNumber: poskoNumber,
                            email: email || "-",
                            password: hashedPassword || password,
                            role: "admin", // Di DB1 role satpam/petugas diakses sebagai role pengelola perumahan
                            assigned_device: "-",
                            assigned_zone: "-",
                            created_at: Date.now(),
                            updated_at: Date.now()
                        });
                    }
                } else {
                    // ==========================================
                    // SIMPAN KE DB2 (PUBLIC)
                    // ==========================================
                    if (isEditing && petugasId) {
                        const updateData = {
                            name,
                            phone,
                            email: email || "-",
                            updated_at: Date.now()
                        };
                        if (hashedPassword) updateData.password = hashedPassword;

                        await update(ref(db2, `users/${petugasId}`), updateData);
                    } else {
                        const newRef = push(ref(db2, "users"));
                        await set(newRef, {
                            name,
                            phone,
                            email: email || "-",
                            password: hashedPassword || password,
                            role: "petugas",
                            status: "active",
                            assigned_device: "-",
                            assigned_zone: "-",
                            created_at: Date.now(),
                            updated_at: Date.now()
                        });
                    }
                }

                closeFormModal();
                Swal.fire({
                    icon: "success",
                    title: isEditing ? "Berhasil Diperbarui" : "Berhasil Ditambahkan",
                    text: `Data petugas (${source === "perumahan" ? "Perumahan" : "Public"}) berhasil disimpan.`,
                    timer: 2000,
                    showConfirmButton: false
                });

            } catch (err) {
                console.error("Gagal menyimpan petugas:", err);
                Swal.fire({
                    icon: "error",
                    title: "Gagal Menyimpan",
                    text: "Terjadi kesalahan saat menyimpan data: " + err.message,
                    confirmButtonColor: "#173f70"
                });
            } finally {
                savePetugasBtn.disabled = false;
                savePetugasBtn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Simpan</span>`;
            }
        });
    }

    /* =========================================================
       8. HAPUS PETUGAS (DUAL DB SUPPORT)
    ========================================================= */

    window.confirmDeletePetugas = function (petugasId, source, perumahanKey, petugasName) {
        Swal.fire({
            title: "Hapus Petugas?",
            html: `Apakah Anda yakin ingin menghapus akun petugas <strong>${escapeHtml(petugasName)}</strong> (${source === "perumahan" ? "Perumahan" : "Public"})?<br><span style="font-size:13px; color:#ef4444;">Tindakan ini tidak dapat dibatalkan.</span>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Ya, Hapus",
            cancelButtonText: "Batal",
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    if (source === "perumahan") {
                        await remove(ref(db1, `perumahan/${perumahanKey}/users/${petugasId}`));
                    } else {
                        await remove(ref(db2, `users/${petugasId}`));
                    }

                    Swal.fire({
                        icon: "success",
                        title: "Terhapus",
                        text: "Akun petugas berhasil dihapus dari sistem.",
                        timer: 2000,
                        showConfirmButton: false
                    });
                } catch (err) {
                    console.error("Gagal menghapus petugas:", err);
                    Swal.fire({
                        icon: "error",
                        title: "Gagal Menghapus",
                        text: "Terjadi kesalahan saat menghapus data: " + err.message,
                        confirmButtonColor: "#173f70"
                    });
                }
            }
        });
    };

    /* =========================================================
       9. DETAIL PETUGAS MODAL
    ========================================================= */

    window.openDetailPetugasModal = function (petugasId, source, perumahanKey) {
        const petugas = allPetugas.find(
            (p) => p.id === petugasId && p.source === source && (source !== "perumahan" || p.perumahanKey === perumahanKey)
        );
        if (!petugas) return;

        if (detailName) detailName.textContent = petugas.name || "-";
        if (detailPhone) detailPhone.textContent = petugas.phone || "-";
        if (detailStatus) detailStatus.textContent = petugas.statusLabel || "-";
        if (detailEmail) detailEmail.textContent = petugas.email || "-";
        if (detailRole) detailRole.textContent = petugas.role || "Petugas Lapangan";

        if (petugas.source === "perumahan") {
            if (detailPerumahanWrapper) detailPerumahanWrapper.style.display = "flex";
            if (detailPerumahan) detailPerumahan.textContent = `${petugas.perumahanName} (${petugas.houseNumber || "Posko"})`;
        } else {
            if (detailPerumahanWrapper) detailPerumahanWrapper.style.display = "none";
        }

        if (detailRegistered) {
            if (petugas.created_at) {
                const date = new Date(petugas.created_at);
                detailRegistered.textContent = !isNaN(date.getTime())
                    ? date.toLocaleDateString("id-ID", { dateStyle: "long" })
                    : "-";
            } else {
                detailRegistered.textContent = "-";
            }
        }
        if (detailFullAddress) detailFullAddress.textContent = petugas.full_address || "-";

        if (petugasDetailModal) petugasDetailModal.style.display = "flex";
    };

    function closeDetailModal() {
        if (petugasDetailModal) petugasDetailModal.style.display = "none";
    }

    if (closeDetailModalBtn) closeDetailModalBtn.addEventListener("click", closeDetailModal);
    if (closeDetailBtn) closeDetailBtn.addEventListener("click", closeDetailModal);

    // Close modals when clicking backdrop
    [petugasFormModal, petugasDetailModal].forEach((modal) => {
        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) {
                    modal.style.display = "none";
                    resetFormFields();
                }
            });
        }
    });
});
