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
    update,
    remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


/* =========================================
   FIREBASE REFERENCE
========================================= */

const daftarRef = ref(db1, "daftar_perumahan");
const perumahanRef = ref(db1, "perumahan");


/* =========================================
   DOM ELEMENTS
========================================= */

const tableBody = document.getElementById("perumahanTableBody");
const totalCount = document.getElementById("totalCount");
const searchInput = document.getElementById("searchInput");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const paginationInfo = document.getElementById("paginationInfo");
const cardContainer = document.getElementById("cardContainer");
const openAddModal = document.getElementById("openAddModal");


/* =========================================
   STATE
========================================= */

let allData = [];
let currentPage = 1;
const itemsPerPage = 8;

let daftarPerumahan = {};
let detailPerumahan = {};


/* =========================================
   HELPER FUNCTIONS
========================================= */

function toSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_");
}

function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");
}


/* =========================================
   MERGE DATA FIREBASE
========================================= */

function mergeData() {
    allData = [];

    for (const key in daftarPerumahan) {
        allData.push({
            key: key,
            nama: daftarPerumahan[key],
            info: detailPerumahan[key]?.info || {}
        });
    }

    // Sort alphabetically by nama
    allData.sort((a, b) => a.nama.localeCompare(b.nama));

    currentPage = 1;
    renderTable(filterData(searchInput ? searchInput.value : ""));
}


/* =========================================
   FILTER DATA
========================================= */

function filterData(query) {
    const q = (query || "").toLowerCase().trim();

    return allData.filter(({ nama, info }) => {
        return (
            nama.toLowerCase().includes(q) ||
            (info.kontak || "").toLowerCase().includes(q) ||
            (info.lokasi || "").toLowerCase().includes(q)
        );
    });
}


/* =========================================
   RENDER TABLE
========================================= */

function renderTable(filteredData) {
    if (!tableBody) return;

    const totalItems = filteredData.length;

    if (totalCount) {
        totalCount.textContent = totalItems.toLocaleString("id-ID");
    }

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages === 0) {
        currentPage = 1;
    } else {
        currentPage = Math.max(1, Math.min(currentPage, totalPages));
    }

    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, totalItems);
    const paginatedData = filteredData.slice(startIdx, endIdx);

    tableBody.innerHTML = "";

    if (totalItems === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading">
                    <i class="fa-solid fa-building-circle-xmark" style="font-size:32px; display:block; margin-bottom:8px; opacity:0.6;"></i>
                    <strong style="font-size:15px; display:block; margin-bottom:4px; color:var(--dash-text-main);">Tidak ada data perumahan ditemukan.</strong>
                    <span style="font-size:13px;">Coba sesuaikan kata kunci pencarian Anda.</span>
                </td>
            </tr>
        `;
    } else {
        paginatedData.forEach(({ key, nama, info }, index) => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td style="font-weight: 600; color: var(--dash-text-muted);">
                    ${startIdx + index + 1}
                </td>

                <td>
                    <div class="perumahan-cell">
                        <div class="perumahan-icon-badge">
                            <i class="fa-solid fa-city"></i>
                        </div>
                        <span class="perumahan-title-text">${escapeHtml(nama)}</span>
                    </div>
                </td>

                <td>
                    <span style="display:inline-flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-phone" style="font-size:12px; color:var(--dash-primary);"></i>
                        ${escapeHtml(info.kontak || "-")}
                    </span>
                </td>

                <td>
                    <span style="display:inline-flex; align-items:center; gap:6px; color:var(--dash-text-muted);">
                        <i class="fa-solid fa-location-dot" style="font-size:12px; color:var(--dash-emergency);"></i>
                        ${escapeHtml(info.lokasi || "-")}
                    </span>
                </td>

                <td style="text-align: center;">
                    <div class="action-buttons-group">
                        <button
                            type="button"
                            class="btn-edit"
                            onclick="openEditModal(
                                '${escapeAttribute(key)}',
                                '${escapeAttribute(nama)}',
                                '${escapeAttribute(info.kontak || "")}',
                                '${escapeAttribute(info.lokasi || "")}'
                            )"
                            title="Edit Perumahan"
                        >
                            <i class="fa-solid fa-pen-to-square"></i>
                            <span>Edit</span>
                        </button>

                        <button
                            type="button"
                            class="btn-delete"
                            onclick="confirmDelete(
                                '${escapeAttribute(key)}',
                                '${escapeAttribute(nama)}'
                            )"
                            title="Hapus Perumahan"
                        >
                            <i class="fa-solid fa-trash-can"></i>
                            <span>Hapus</span>
                        </button>

                        <a
                            href="/detail-perumahan?key=${encodeURIComponent(key)}"
                            class="btn-detail"
                            title="Lihat Detail Monitor"
                        >
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                            <span>Detail</span>
                        </a>
                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        });
    }

    if (paginationInfo) {
        if (totalItems === 0) {
            paginationInfo.textContent = "Menampilkan 0 - 0 dari 0 data perumahan";
        } else {
            paginationInfo.textContent = `Menampilkan ${startIdx + 1} - ${endIdx} dari ${totalItems} data perumahan`;
        }
    }

    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = totalPages === 0 || currentPage >= totalPages;

    renderCards(filteredData);
}


/* =========================================
   RENDER MOBILE CARD
========================================= */

function renderCards(data) {
    if (!cardContainer) return;

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages === 0) {
        cardContainer.innerHTML = `
            <div class="perumahan-card" style="text-align:center; padding:30px 16px;">
                <i class="fa-solid fa-building-circle-xmark" style="font-size:28px; opacity:0.6; margin-bottom:8px; display:block;"></i>
                <div class="card-title" style="justify-content:center;">Tidak ada data perumahan</div>
            </div>
        `;
        return;
    }

    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, totalItems);
    const paginatedData = data.slice(startIdx, endIdx);

    cardContainer.innerHTML = "";

    paginatedData.forEach(({ key, nama, info }) => {
        const card = document.createElement("div");
        card.className = "perumahan-card";

        card.innerHTML = `
            <div class="card-title">
                <i class="fa-solid fa-city" style="color:var(--dash-success); font-size:16px;"></i>
                <span>${escapeHtml(nama)}</span>
            </div>

            <div class="card-info">
                <i class="fa-solid fa-phone" style="width:18px; color:var(--dash-primary);"></i>
                <strong>Kontak:</strong>
                <span>${escapeHtml(info.kontak || "-")}</span>
            </div>

            <div class="card-info">
                <i class="fa-solid fa-location-dot" style="width:18px; color:var(--dash-emergency);"></i>
                <strong>Lokasi:</strong>
                <span>${escapeHtml(info.lokasi || "-")}</span>
            </div>

            <div class="card-actions">
                <button
                    type="button"
                    class="btn-edit"
                    onclick="openEditModal(
                        '${escapeAttribute(key)}',
                        '${escapeAttribute(nama)}',
                        '${escapeAttribute(info.kontak || "")}',
                        '${escapeAttribute(info.lokasi || "")}'
                    )"
                >
                    <i class="fa-solid fa-pen-to-square"></i>
                    <span>Edit</span>
                </button>

                <button
                    type="button"
                    class="btn-delete"
                    onclick="confirmDelete(
                        '${escapeAttribute(key)}',
                        '${escapeAttribute(nama)}'
                    )"
                >
                    <i class="fa-solid fa-trash-can"></i>
                    <span>Hapus</span>
                </button>

                <a
                    href="/detail-perumahan?key=${encodeURIComponent(key)}"
                    class="btn-detail"
                >
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    <span>Detail</span>
                </a>
            </div>
        `;

        cardContainer.appendChild(card);
    });
}


/* =========================================
   SEARCH
========================================= */

if (searchInput) {
    searchInput.addEventListener("input", () => {
        currentPage = 1;
        renderTable(filterData(searchInput.value));
    });
}


/* =========================================
   PAGINATION
========================================= */

if (prevBtn) {
    prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable(filterData(searchInput ? searchInput.value : ""));
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });
}

if (nextBtn) {
    nextBtn.addEventListener("click", () => {
        const data = filterData(searchInput ? searchInput.value : "");
        const totalPages = Math.ceil(data.length / itemsPerPage);

        if (currentPage < totalPages) {
            currentPage++;
            renderTable(data);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });
}


/* =========================================
   FIREBASE - LISTENERS
========================================= */

onValue(daftarRef, (snapshot) => {
    daftarPerumahan = snapshot.val() || {};
    mergeData();
});

onValue(perumahanRef, (snapshot) => {
    detailPerumahan = snapshot.val() || {};
    mergeData();
});


/* =========================================
   TAMBAH PERUMAHAN
========================================= */

if (openAddModal) {
    openAddModal.addEventListener("click", () => {
        Swal.fire({
            title: "Tambah Kawasan Perumahan",
            html: `
                <div class="swal-form">
                    <label for="swalNama">Nama Perumahan</label>
                    <input
                        id="swalNama"
                        class="swal2-input"
                        placeholder="Contoh: Griya Asri Pratama"
                    >

                    <label for="swalKontak">Nomor Kontak Posko / Satpam</label>
                    <input
                        id="swalKontak"
                        class="swal2-input"
                        placeholder="Contoh: 081234567890"
                    >

                    <label for="swalLokasi">Titik Lokasi Wilayah</label>
                    <input
                        id="swalLokasi"
                        class="swal2-input"
                        placeholder="Contoh: Blok A - G, Kec. Sukamaju"
                    >
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: "Simpan Data",
            cancelButtonText: "Batal",
            confirmButtonColor: "#173f70",
            cancelButtonColor: "#64748b",
            focusConfirm: false,
            preConfirm: () => {
                const nama = document.getElementById("swalNama").value.trim();
                const kontak = document.getElementById("swalKontak").value.trim();
                const lokasi = document.getElementById("swalLokasi").value.trim();

                if (!nama || !kontak || !lokasi) {
                    Swal.showValidationMessage("Semua field wajib diisi!");
                    return false;
                }

                return { nama, kontak, lokasi };
            }
        }).then(async (result) => {
            if (!result.isConfirmed) return;

            const { nama, kontak, lokasi } = result.value;
            const key = toSlug(nama);

            const updates = {};
            updates[`daftar_perumahan/${key}`] = nama;
            updates[`perumahan/${key}/info`] = {
                kontak,
                lokasi,
                nama
            };
            updates[`perumahan/${key}/buzzers`] = {
                main: { priority: "off", state: "off" },
                buzzer_utama: { priority: "off", state: "off" }
            };
            updates[`perumahan/${key}/monitor`] = {};
            updates[`perumahan/${key}/users`] = {};

            try {
                await update(ref(db1), updates);
                Swal.fire({
                    icon: "success",
                    title: "Berhasil Ditambahkan",
                    text: `Kawasan ${nama} berhasil didaftarkan.`,
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error(error);
                Swal.fire({
                    icon: "error",
                    title: "Gagal Menambahkan",
                    text: error.message,
                    confirmButtonColor: "#173f70"
                });
            }
        });
    });
}


/* =========================================
   EDIT PERUMAHAN
========================================= */

window.openEditModal = function (key, nama, kontak, lokasi) {
    Swal.fire({
        title: "Edit Data Perumahan",
        html: `
            <div class="swal-form">
                <label for="swalNama">Nama Perumahan</label>
                <input
                    id="swalNama"
                    class="swal2-input"
                    value="${escapeHtml(nama)}"
                >

                <label for="swalKontak">Nomor Kontak Posko / Satpam</label>
                <input
                    id="swalKontak"
                    class="swal2-input"
                    value="${escapeHtml(kontak)}"
                >

                <label for="swalLokasi">Titik Lokasi Wilayah</label>
                <input
                    id="swalLokasi"
                    class="swal2-input"
                    value="${escapeHtml(lokasi)}"
                >
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Simpan Perubahan",
        cancelButtonText: "Batal",
        confirmButtonColor: "#173f70",
        cancelButtonColor: "#64748b",
        focusConfirm: false,
        preConfirm: () => {
            const namaBaru = document.getElementById("swalNama").value.trim();
            const kontakBaru = document.getElementById("swalKontak").value.trim();
            const lokasiBaru = document.getElementById("swalLokasi").value.trim();

            if (!namaBaru || !kontakBaru || !lokasiBaru) {
                Swal.showValidationMessage("Semua field wajib diisi!");
                return false;
            }

            return { namaBaru, kontakBaru, lokasiBaru };
        }
    }).then(async (result) => {
        if (!result.isConfirmed) return;

        const { namaBaru, kontakBaru, lokasiBaru } = result.value;

        const updates = {};
        updates[`daftar_perumahan/${key}`] = namaBaru;
        updates[`perumahan/${key}/info`] = {
            kontak: kontakBaru,
            lokasi: lokasiBaru,
            nama: namaBaru
        };

        try {
            await update(ref(db1), updates);
            Swal.fire({
                icon: "success",
                title: "Berhasil Diperbarui",
                text: "Data perumahan berhasil disimpan.",
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: "error",
                title: "Gagal Mengubah",
                text: error.message,
                confirmButtonColor: "#173f70"
            });
        }
    });
};


/* =========================================
   HAPUS PERUMAHAN
========================================= */

window.confirmDelete = function (key, nama) {
    Swal.fire({
        title: `Hapus ${nama}?`,
        text: "Kawasan perumahan dan seluruh data monitor serta pengguna terkait akan dihapus secara permanen.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, Hapus",
        cancelButtonText: "Batal",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#64748b"
    }).then(async (result) => {
        if (!result.isConfirmed) return;

        const updates = {};
        updates[`daftar_perumahan/${key}`] = null;
        updates[`perumahan/${key}`] = null;

        try {
            await update(ref(db1), updates);
            Swal.fire({
                icon: "success",
                title: "Terhapus",
                text: `Kawasan ${nama} berhasil dihapus.`,
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: "error",
                title: "Gagal Menghapus",
                text: error.message,
                confirmButtonColor: "#173f70"
            });
        }
    });
};

console.log("Rekap Data Perumahan initialized smoothly.");