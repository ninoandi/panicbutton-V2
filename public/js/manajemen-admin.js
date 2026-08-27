/* =========================================================
   MANAJEMEN ADMIN - CONTROLLER JAVASCRIPT
   Firebase Realtime Database Integration (DB2)
========================================================= */

import { db2 } from "./firebase-config.js";
import {
    ref,
    onValue,
    push,
    set,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
    console.log("Manajemen Admin JS Initialized");

    // Elements
    const searchInput = document.getElementById("searchInput");
    const adminTableBody = document.getElementById("adminTableBody");
    const mobileCardsContainer = document.getElementById("mobileCardsContainer");
    const syncStatus = document.getElementById("syncStatus");

    // Pagination Elements
    const paginationInfo = document.getElementById("paginationInfo");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    // Modal Elements - Form
    const openAddAdminBtn = document.getElementById("openAddAdminModal");
    const adminFormModal = document.getElementById("adminFormModal");
    const closeFormModalBtn = document.getElementById("closeFormModal");
    const cancelFormBtn = document.getElementById("cancelFormBtn");
    const saveAdminBtn = document.getElementById("saveAdminBtn");
    const formModalTitle = document.getElementById("formModalTitle");

    // Form Inputs
    const adminIdInput = document.getElementById("adminId");
    const adminNameInput = document.getElementById("adminName");
    const adminEmailInput = document.getElementById("adminEmail");
    const adminPhoneInput = document.getElementById("adminPhone");
    const adminPasswordInput = document.getElementById("adminPassword");
    const adminPasswordConfirmInput = document.getElementById("adminPasswordConfirm");
    const toggleAdminPasswordBtn = document.getElementById("toggleAdminPassword");
    const toggleAdminPasswordConfirmBtn = document.getElementById("toggleAdminPasswordConfirm");
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

    setupPasswordToggle(toggleAdminPasswordBtn, adminPasswordInput);
    setupPasswordToggle(toggleAdminPasswordConfirmBtn, adminPasswordConfirmInput);

    // Modal Elements - Detail
    const adminDetailModal = document.getElementById("adminDetailModal");
    const closeDetailModalBtn = document.getElementById("closeDetailModal");
    const closeDetailBtn = document.getElementById("closeDetailBtn");
    const detailName = document.getElementById("detailName");
    const detailEmail = document.getElementById("detailEmail");
    const detailPhone = document.getElementById("detailPhone");
    const detailRole = document.getElementById("detailRole");
    const detailRegistered = document.getElementById("detailRegistered");
    const detailFullAddress = document.getElementById("detailFullAddress");

    // State Variables
    let allAdmins = [];
    let filteredAdmins = [];
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
       1. FIREBASE REALTIME LISTENER
    ========================================================= */

    const usersRef = ref(db2, "users");

    onValue(
        usersRef,
        (snapshot) => {
            if (syncStatus) syncStatus.textContent = "Realtime Terhubung";

            const data = snapshot.val();
            allAdmins = [];

            if (data && typeof data === "object") {
                Object.entries(data).forEach(([key, user]) => {
                    if (user && typeof user === "object") {
                        const role = (user.role || "").toLowerCase().trim();
                        if (role === "admin" || role === "administrator") {
                            allAdmins.push({
                                id: key,
                                name: user.name || "Administrator",
                                email: user.email || "-",
                                phone: user.phone || user.no_telepon || user.telepon || "-",
                                role: user.role || "admin",
                                created_at: user.created_at || user.timestamp || 0,
                                full_address: user.full_address || user.address || "-",
                                birth_date: user.birth_date || "-",
                                gender: user.gender || "-"
                            });
                        }
                    }
                });
            }

            // Sort by creation date descending
            allAdmins.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

            applyFilters();
        },
        (error) => {
            console.error("Firebase load error:", error);
            if (syncStatus) syncStatus.textContent = "Koneksi Terputus";
            if (adminTableBody) {
                adminTableBody.innerHTML = `
                    <tr class="loading-row">
                        <td colspan="5" style="color: var(--dash-emergency);">
                            <i class="fa-solid fa-triangle-exclamation" style="font-size:24px; margin-bottom:8px; display:block;"></i>
                            <span>Gagal memuat data administrator dari Firebase. Silakan periksa koneksi internet Anda.</span>
                        </td>
                    </tr>
                `;
            }
        }
    );

    /* =========================================================
       2. FILTER & SEARCH
    ========================================================= */

    function applyFilters() {
        const query = (searchInput ? searchInput.value : "").toLowerCase().trim();

        filteredAdmins = allAdmins.filter((admin) => {
            if (!query) return true;
            return (
                admin.name.toLowerCase().includes(query) ||
                admin.phone.toLowerCase().includes(query) ||
                admin.email.toLowerCase().includes(query) ||
                admin.role.toLowerCase().includes(query)
            );
        });

        currentPage = 1;
        renderTable();
    }

    if (searchInput) {
        searchInput.addEventListener("input", applyFilters);
    }

    /* =========================================================
       3. RENDER TABLE & MOBILE CARDS
    ========================================================= */

    function renderTable() {
        if (!adminTableBody) return;

        const totalItems = filteredAdmins.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const startIdx = (currentPage - 1) * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, totalItems);
        const pageItems = filteredAdmins.slice(startIdx, endIdx);

        // Empty state
        if (totalItems === 0) {
            adminTableBody.innerHTML = `
                <tr class="loading-row">
                    <td colspan="5">
                        <i class="fa-solid fa-user-slash" style="font-size:36px; display:block; margin-bottom:10px; opacity:0.5; color:var(--dash-text-muted);"></i>
                        <strong style="font-size:15px; display:block; margin-bottom:4px; color:var(--dash-text-main);">Tidak ada data administrator.</strong>
                        <span style="font-size:13px;">Klik tombol "Tambah Admin" di atas untuk menambahkan akun pengelola baru.</span>
                    </td>
                </tr>
            `;

            if (mobileCardsContainer) {
                mobileCardsContainer.innerHTML = `
                    <div style="text-align: center; color: var(--dash-text-muted); padding: 30px 16px;">
                        <p style="margin: 0; font-weight: 600;">Tidak ada data administrator.</p>
                    </div>
                `;
            }
        } else {
            // Render Table Rows (No icons/emotes in plain text columns)
            adminTableBody.innerHTML = pageItems
                .map((admin, index) => {
                    const no = startIdx + index + 1;
                    const safeName = escapeHtml(admin.name);
                    const safePhone = escapeHtml(admin.phone);
                    const safeEmail = escapeHtml(admin.email || "-");

                    return `
                        <tr>
                            <td style="font-weight: 600; color: var(--dash-text-muted); text-align: center; width: 60px;">
                                ${no}
                            </td>
                            <td style="font-weight: 600; color: var(--dash-text-main);">
                                ${safeName}
                            </td>
                            <td style="text-align: center; font-family: monospace; font-size: 13px;">
                                ${safePhone}
                            </td>
                            <td style="font-size: 13px;">
                                ${safeEmail}
                            </td>
                            <td style="text-align: center; width: 220px;">
                                <div class="action-buttons-group">
                                    <button
                                        type="button"
                                        class="btn-action-edit"
                                        onclick="window.openEditAdminModal('${escapeAttribute(admin.id)}')"
                                        title="Edit Administrator"
                                    >
                                        <i class="fa-solid fa-pen-to-square"></i>
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        type="button"
                                        class="btn-action-delete"
                                        onclick="window.confirmDeleteAdmin('${escapeAttribute(admin.id)}', '${escapeAttribute(admin.name)}')"
                                        title="Hapus Administrator"
                                    >
                                        <i class="fa-solid fa-trash-can"></i>
                                        <span>Hapus</span>
                                    </button>
                                    <button
                                        type="button"
                                        class="btn-action-detail-admin"
                                        onclick="window.openDetailAdminModal('${escapeAttribute(admin.id)}')"
                                        title="Detail Administrator"
                                    >
                                        <i class="fa-solid fa-circle-info"></i>
                                        <span>Detail</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                })
                .join("");

            // Render Mobile Cards
            if (mobileCardsContainer) {
                mobileCardsContainer.innerHTML = pageItems
                    .map((admin, index) => {
                        const no = startIdx + index + 1;
                        return `
                            <div class="admin-card-item">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <strong class="admin-card-name">${escapeHtml(admin.name)}</strong>
                                    <span style="font-size: 12px; font-weight: 700; color: var(--dash-text-muted);">#${no}</span>
                                </div>
                                <div class="admin-card-phone">
                                    Telepon: ${escapeHtml(admin.phone)}
                                </div>
                                <div class="admin-card-phone">
                                    Email: ${escapeHtml(admin.email || "-")}
                                </div>
                                <div class="admin-card-actions">
                                    <button
                                        type="button"
                                        class="btn-action-edit"
                                        onclick="window.openEditAdminModal('${escapeAttribute(admin.id)}')"
                                    >
                                        <i class="fa-solid fa-pen-to-square"></i>
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        type="button"
                                        class="btn-action-delete"
                                        onclick="window.confirmDeleteAdmin('${escapeAttribute(admin.id)}', '${escapeAttribute(admin.name)}')"
                                    >
                                        <i class="fa-solid fa-trash-can"></i>
                                        <span>Hapus</span>
                                    </button>
                                    <button
                                        type="button"
                                        class="btn-action-detail-admin"
                                        onclick="window.openDetailAdminModal('${escapeAttribute(admin.id)}')"
                                    >
                                        <i class="fa-solid fa-circle-info"></i>
                                        <span>Detail</span>
                                    </button>
                                </div>
                            </div>
                        `;
                    })
                    .join("");
            }
        }

        // Update Pagination Info & Buttons
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
            const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage) || 1;
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });
    }

    /* =========================================================
       4. MODAL TAMBAH & EDIT ADMIN
    ========================================================= */

    function openAddModal() {
        isEditing = false;
        if (formModalTitle) formModalTitle.textContent = "Tambah Administrator Baru";
        if (adminIdInput) adminIdInput.value = "";
        if (adminNameInput) adminNameInput.value = "";
        if (adminEmailInput) adminEmailInput.value = "";
        if (adminPhoneInput) adminPhoneInput.value = "";
        if (adminPasswordInput) {
            adminPasswordInput.value = "";
            adminPasswordInput.type = "password";
            adminPasswordInput.required = true;
        }
        if (adminPasswordConfirmInput) {
            adminPasswordConfirmInput.value = "";
            adminPasswordConfirmInput.type = "password";
            adminPasswordConfirmInput.required = true;
        }
        if (toggleAdminPasswordBtn) toggleAdminPasswordBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
        if (toggleAdminPasswordConfirmBtn) toggleAdminPasswordConfirmBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
        if (passwordHelp) passwordHelp.style.display = "none";

        if (adminFormModal) adminFormModal.classList.add("active");
    }

    window.openEditAdminModal = function (adminId) {
        const admin = allAdmins.find((a) => a.id === adminId);
        if (!admin) return;

        isEditing = true;
        if (formModalTitle) formModalTitle.textContent = "Edit Data Administrator";
        if (adminIdInput) adminIdInput.value = admin.id;
        if (adminNameInput) adminNameInput.value = admin.name !== "-" ? admin.name : "";
        if (adminEmailInput) adminEmailInput.value = admin.email !== "-" ? admin.email : "";
        if (adminPhoneInput) adminPhoneInput.value = admin.phone !== "-" ? admin.phone : "";
        if (adminPasswordInput) {
            adminPasswordInput.value = "";
            adminPasswordInput.type = "password";
            adminPasswordInput.required = false;
        }
        if (adminPasswordConfirmInput) {
            adminPasswordConfirmInput.value = "";
            adminPasswordConfirmInput.type = "password";
            adminPasswordConfirmInput.required = false;
        }
        if (toggleAdminPasswordBtn) toggleAdminPasswordBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
        if (toggleAdminPasswordConfirmBtn) toggleAdminPasswordConfirmBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
        if (passwordHelp) passwordHelp.style.display = "block";

        if (adminFormModal) adminFormModal.classList.add("active");
    };

    function closeFormModal() {
        if (adminFormModal) adminFormModal.classList.remove("active");
    }

    if (openAddAdminBtn) openAddAdminBtn.addEventListener("click", openAddModal);
    if (closeFormModalBtn) closeFormModalBtn.addEventListener("click", closeFormModal);
    if (cancelFormBtn) cancelFormBtn.addEventListener("click", closeFormModal);

    // Save Admin (Add / Edit)
    if (saveAdminBtn) {
        saveAdminBtn.addEventListener("click", async () => {
            const name = (adminNameInput ? adminNameInput.value : "").trim();
            const email = (adminEmailInput ? adminEmailInput.value : "").trim().toLowerCase();
            const phone = (adminPhoneInput ? adminPhoneInput.value : "").trim();
            const password = (adminPasswordInput ? adminPasswordInput.value : "").trim();
            const passwordConfirm = (adminPasswordConfirmInput ? adminPasswordConfirmInput.value : "").trim();
            const adminId = adminIdInput ? adminIdInput.value : "";

            if (!name) {
                Swal.fire({
                    icon: "warning",
                    title: "Nama Wajib Diisi",
                    text: "Silakan masukkan nama lengkap administrator."
                });
                return;
            }

            if (!phone) {
                Swal.fire({
                    icon: "warning",
                    title: "Nomor Telepon Wajib Diisi",
                    text: "Silakan masukkan nomor telepon administrator."
                });
                return;
            }

            if (!email) {
                Swal.fire({
                    icon: "warning",
                    title: "Email Wajib Diisi",
                    text: "Silakan masukkan alamat email administrator untuk keperluan login sistem."
                });
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                Swal.fire({
                    icon: "warning",
                    title: "Format Email Tidak Valid",
                    text: "Silakan masukkan alamat email yang benar (contoh: nama@domain.com)."
                });
                return;
            }

            if (!isEditing && !password) {
                Swal.fire({
                    icon: "warning",
                    title: "Password Wajib Diisi",
                    text: "Silakan buat kata sandi untuk akun administrator baru (min. 6 karakter)."
                });
                return;
            }

            if (password && password.length < 6) {
                Swal.fire({
                    icon: "warning",
                    title: "Password Terlalu Pendek",
                    text: "Kata sandi minimal terdiri dari 6 karakter."
                });
                return;
            }

            if (password && password !== passwordConfirm) {
                Swal.fire({
                    icon: "warning",
                    title: "Konfirmasi Password Tidak Cocok",
                    text: "Pastikan kolom kata sandi dan konfirmasi kata sandi sama persis."
                });
                return;
            }

            saveAdminBtn.disabled = true;
            saveAdminBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Menyimpan...</span>`;

            try {
                let hashedPassword = null;
                if (password) {
                    hashedPassword = typeof window.hashPassword === "function" 
                        ? await window.hashPassword(password) 
                        : password;
                }

                if (isEditing && adminId) {
                    // Update existing
                    const updatePayload = {
                        name,
                        phone,
                        email: email || "-",
                        updated_at: Date.now()
                    };

                    if (hashedPassword) {
                        updatePayload.password = hashedPassword;
                    }

                    await update(ref(db2, `users/${adminId}`), updatePayload);

                    closeFormModal();
                    Swal.fire({
                        icon: "success",
                        title: "Berhasil Diperbarui",
                        text: "Data administrator berhasil diperbarui.",
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else {
                    // Add new admin
                    const newAdminRef = push(ref(db2, "users"));
                    const newPayload = {
                        name,
                        email: email || "-",
                        phone,
                        password: hashedPassword || password,
                        role: "admin",
                        created_at: Date.now(),
                        updated_at: Date.now()
                    };

                    await set(newAdminRef, newPayload);

                    closeFormModal();
                    Swal.fire({
                        icon: "success",
                        title: "Berhasil Ditambahkan",
                        text: "Akun administrator baru berhasil dibuat.",
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            } catch (err) {
                console.error("Gagal menyimpan admin:", err);
                Swal.fire({
                    icon: "error",
                    title: "Gagal Menyimpan",
                    text: "Terjadi kesalahan saat menyimpan data ke Firebase: " + err.message
                });
            } finally {
                saveAdminBtn.disabled = false;
                saveAdminBtn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Simpan</span>`;
            }
        });
    }

    /* =========================================================
       5. HAPUS ADMIN (CONFIRMATION SWEETALERT2)
    ========================================================= */

    window.confirmDeleteAdmin = function (adminId, adminName) {
        Swal.fire({
            title: "Hapus Administrator?",
            html: `Apakah Anda yakin ingin menghapus akun <strong>${escapeHtml(adminName)}</strong>?<br><span style="font-size:13px; color:#ef4444;">Tindakan ini tidak dapat dibatalkan.</span>`,
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
                    await remove(ref(db2, `users/${adminId}`));
                    Swal.fire({
                        icon: "success",
                        title: "Terhapus",
                        text: "Akun administrator telah berhasil dihapus.",
                        timer: 2000,
                        showConfirmButton: false
                    });
                } catch (err) {
                    console.error("Gagal menghapus admin:", err);
                    Swal.fire({
                        icon: "error",
                        title: "Gagal Menghapus",
                        text: "Terjadi kesalahan saat menghapus data: " + err.message
                    });
                }
            }
        });
    };

    /* =========================================================
       6. DETAIL ADMIN MODAL
    ========================================================= */

    window.openDetailAdminModal = function (adminId) {
        const admin = allAdmins.find((a) => a.id === adminId);
        if (!admin) return;

        if (detailName) detailName.textContent = admin.name || "-";
        if (detailEmail) detailEmail.textContent = admin.email || "-";
        if (detailPhone) detailPhone.textContent = admin.phone || "-";
        if (detailRole) detailRole.textContent = "Administrator Sistem";
        if (detailRegistered) {
            if (admin.created_at) {
                const date = new Date(admin.created_at);
                detailRegistered.textContent = !isNaN(date.getTime())
                    ? date.toLocaleDateString("id-ID", { dateStyle: "long" })
                    : "-";
            } else {
                detailRegistered.textContent = "-";
            }
        }
        if (detailFullAddress) detailFullAddress.textContent = admin.full_address || "-";

        if (adminDetailModal) adminDetailModal.classList.add("active");
    };

    function closeDetailModal() {
        if (adminDetailModal) adminDetailModal.classList.remove("active");
    }

    if (closeDetailModalBtn) closeDetailModalBtn.addEventListener("click", closeDetailModal);
    if (closeDetailBtn) closeDetailBtn.addEventListener("click", closeDetailModal);

    // Close modals when clicking backdrop
    [adminFormModal, adminDetailModal].forEach((modal) => {
        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) {
                    modal.classList.remove("active");
                }
            });
        }
    });
});
