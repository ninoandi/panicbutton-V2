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


/* =========================================
   DATA KEY DARI LARAVEL
========================================= */

const key = window.monitorKey;


/* =========================================
   DOM
========================================= */

const titleElement = document.getElementById("title");
const tableBody = document.getElementById("monitorTableBody");
const clearAllBtn = document.getElementById("clearAllBtn");
const searchInput = document.getElementById("search");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");
const sortOrder = document.getElementById("sortOrder");
const pagination = document.getElementById("pagination");


/* =========================================
   STATE
========================================= */

let allData = [];
let currentPage = 1;
const itemsPerPage = 10;


/* =========================================
   HELPER: FORMAT INCIDENT TIME (YYYY-MM-DD | HH:MM)
========================================= */

function formatIncidentTime(rawTime) {
    if (!rawTime || rawTime === "-") return "-";

    let date = null;

    if (typeof rawTime === "number") {
        date = new Date(rawTime);
    } else if (typeof rawTime === "string") {
        const trimmed = rawTime.trim();
        if (/^\d{10,13}$/.test(trimmed)) {
            date = new Date(parseInt(trimmed, 10));
        } else {
            const parsed = new Date(trimmed);
            if (!isNaN(parsed.getTime())) {
                date = parsed;
            }
        }
    }

    if (date && !isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day} | ${hours}:${minutes}`;
    }

    return String(rawTime);
}

function parseTimestamp(rawTime) {
    if (!rawTime || rawTime === "-") return 0;
    if (typeof rawTime === "number") return rawTime;
    if (/^\d{10,13}$/.test(String(rawTime).trim())) {
        return parseInt(String(rawTime).trim(), 10);
    }
    const d = new Date(rawTime);
    return isNaN(d.getTime()) ? 0 : d.getTime();
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


/* =========================================
   PRIORITY & STATUS BADGE RENDERERS (SOFT ROUNDED)
========================================= */

function renderPriorityBadge(priority) {
    const p = (priority || "").toLowerCase().trim();
    if (p.includes("darurat")) {
        return `<span class="badge-pill badge-pill-darurat"><span class="pulse-dot-red"></span> Darurat</span>`;
    } else if (p.includes("penting")) {
        return `<span class="badge-pill badge-pill-penting"><span class="pulse-dot-yellow"></span> Penting</span>`;
    } else if (p.includes("biasa")) {
        return `<span class="badge-pill badge-pill-biasa"><span class="pulse-dot-green"></span> Biasa</span>`;
    }
    return `<span class="badge-pill badge-pill-default">${escapeHtml(priority || "-")}</span>`;
}

function renderStatusBadge(status) {
    const s = (status || "").toLowerCase().trim();
    if (s.includes("selesai")) {
        return `<span class="badge-pill badge-pill-selesai"><i class="fa-solid fa-circle-check"></i> Selesai</span>`;
    } else if (s.includes("proses")) {
        return `<span class="badge-pill badge-pill-proses"><i class="fa-solid fa-clock-rotate-left"></i> Proses</span>`;
    }
    return `<span class="badge-pill badge-pill-default">${escapeHtml(status || "-")}</span>`;
}


/* =========================================
   INIT CHECK
========================================= */

if (!key) {
    console.error("Key perumahan tidak ditemukan.");
    if (titleElement) {
        titleElement.textContent = "Detail Perumahan";
    }
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:28px; margin-bottom:8px; display:block; opacity:0.6;"></i>
                    Key perumahan tidak ditemukan.
                </td>
            </tr>
        `;
    }
} else {
    loadHousingName();
    loadMonitorData();
}


/* =========================================
   AMBIL NAMA PERUMAHAN
========================================= */

async function loadHousingName() {
    try {
        const namaPerumahanRef = ref(db1, `daftar_perumahan/${key}`);
        const snapshot = await get(namaPerumahanRef);

        if (snapshot.exists()) {
            titleElement.textContent = `Detail Perumahan: ${snapshot.val()}`;
        } else {
            titleElement.textContent = `Detail Perumahan: ${key}`;
        }
    } catch (error) {
        console.error("Gagal mengambil nama perumahan:", error);
    }
}


/* =========================================
   AMBIL DATA MONITOR FIREBASE
========================================= */

async function loadMonitorData() {
    try {
        const monitorRef = ref(db1, `perumahan/${key}/monitor`);

        onValue(monitorRef, (snapshot) => {
            if (!snapshot.exists()) {
                allData = [];
                renderTable();
                return;
            }

            allData = Object.values(snapshot.val()).map(item => ({
                name: item.name || "-",
                houseNumber: item.houseNumber || "-",
                message: item.message || "-",
                priority: item.priority || "-",
                status: item.status || "-",
                time: item.time || "-",
                formattedTime: formatIncidentTime(item.time),
                timestamp: parseTimestamp(item.time || item.timestamp || 0),
                latitude: item.latitude || 0,
                longitude: item.longitude || 0
            }));

            renderTable();
        });
    } catch (error) {
        console.error("Gagal mengambil data monitor:", error);
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fa-solid fa-circle-xmark" style="font-size:28px; margin-bottom:8px; display:block; opacity:0.6; color:var(--dash-emergency);"></i>
                        Gagal memuat data monitor: ${escapeHtml(error.message)}
                    </td>
                </tr>
            `;
        }
        if (pagination) pagination.innerHTML = "";
    }
}


/* =========================================
   FILTER + SEARCH + SORT
========================================= */

function getFilteredData() {
    let filtered = [...allData];

    const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : "";

    if (searchValue) {
        filtered = filtered.filter(item => {
            return (
                item.name.toLowerCase().includes(searchValue) ||
                String(item.houseNumber).toLowerCase().includes(searchValue) ||
                item.message.toLowerCase().includes(searchValue) ||
                item.priority.toLowerCase().includes(searchValue) ||
                item.status.toLowerCase().includes(searchValue)
            );
        });
    }

    if (statusFilter && statusFilter.value) {
        filtered = filtered.filter(item => item.status === statusFilter.value);
    }

    if (priorityFilter && priorityFilter.value) {
        filtered = filtered.filter(item => item.priority === priorityFilter.value);
    }

    if (sortOrder) {
        filtered.sort((a, b) => {
            if (sortOrder.value === "asc") {
                return a.timestamp - b.timestamp;
            }
            return b.timestamp - a.timestamp;
        });
    }

    return filtered;
}


/* =========================================
   RENDER TABLE
========================================= */

function renderTable() {
    if (!tableBody) return;

    const filtered = getFilteredData();
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages === 0) {
        currentPage = 1;
    } else {
        currentPage = Math.max(1, Math.min(currentPage, totalPages));
    }

    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, totalItems);
    const paginatedData = filtered.slice(startIdx, endIdx);

    if (paginatedData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fa-solid fa-list-check" style="font-size:32px; margin-bottom:8px; display:block; opacity:0.6;"></i>
                    <strong style="display:block; font-size:14px; margin-bottom:4px; color:var(--dash-text-main);">Tidak ada data monitor ditemukan.</strong>
                    <span style="font-size:12.5px;">Coba sesuaikan filter atau pencarian Anda.</span>
                </td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = paginatedData
            .map(item => {
                const locationHtml = item.latitude && item.longitude
                    ? `<a
                            href="https://www.google.com/maps?q=${encodeURIComponent(item.latitude)},${encodeURIComponent(item.longitude)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="location-link"
                            title="Buka titik koordinat di Google Maps"
                        >
                            <i class="fa-solid fa-map-location-dot"></i>
                            <span>Lihat Lokasi</span>
                        </a>`
                    : `<span style="color:var(--dash-text-muted); font-size:12px;">-</span>`;

                return `
                    <tr>
                        <td data-label="Nama" style="font-weight:600;">
                            ${escapeHtml(item.name)}
                        </td>

                        <td data-label="No Rumah">
                            <span style="font-weight:600; color:var(--dash-text-muted);">
                                ${escapeHtml(item.houseNumber)}
                            </span>
                        </td>

                        <td data-label="Pesan">
                            ${escapeHtml(item.message)}
                        </td>

                        <td data-label="Prioritas">
                            ${renderPriorityBadge(item.priority)}
                        </td>

                        <td data-label="Status">
                            ${renderStatusBadge(item.status)}
                        </td>

                        <td data-label="Waktu" style="font-family:monospace; font-size:12.5px; white-space:nowrap; color:var(--dash-text-muted);">
                            ${escapeHtml(item.formattedTime)}
                        </td>

                        <td data-label="Lokasi">
                            ${locationHtml}
                        </td>
                    </tr>
                `;
            })
            .join("");
    }

    renderPagination(totalItems, totalPages, startIdx, endIdx);
}


/* =========================================
   PAGINATION
========================================= */

function renderPagination(totalItems, totalPages, startIdx, endIdx) {
    if (!pagination) return;

    if (totalItems === 0) {
        pagination.innerHTML = "";
        return;
    }

    pagination.innerHTML = `
        <div class="pagination-info">
            Menampilkan ${startIdx + 1} - ${endIdx} dari ${totalItems} data log
        </div>

        <div class="pagination-controls">
            <button id="prevBtn" class="btn-pagination" ${currentPage === 1 ? "disabled" : ""}>
                <i class="fa-solid fa-chevron-left"></i>
                <span>Sebelumnya</span>
            </button>

            <button id="nextBtn" class="btn-pagination" ${currentPage >= totalPages ? "disabled" : ""}>
                <span>Berikutnya</span>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    `;

    document.getElementById("prevBtn")?.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });

    document.getElementById("nextBtn")?.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });
}


/* =========================================
   FILTER EVENT LISTENERS
========================================= */

[searchInput, statusFilter, priorityFilter, sortOrder].forEach(el => {
    el?.addEventListener("input", () => {
        currentPage = 1;
        renderTable();
    });
    el?.addEventListener("change", () => {
        currentPage = 1;
        renderTable();
    });
});


/* =========================================
   HAPUS SEMUA MONITOR
========================================= */

clearAllBtn?.addEventListener("click", async () => {
    const result = await Swal.fire({
        title: "Hapus Semua Monitor?",
        text: "Seluruh data log monitor perumahan ini akan dihapus secara permanen!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Ya, Hapus Semua",
        cancelButtonText: "Batal"
    });

    if (!result.isConfirmed) return;

    try {
        const monitorRef = ref(db1, `perumahan/${key}/monitor`);
        await remove(monitorRef);

        allData = [];
        currentPage = 1;
        renderTable();

        Swal.fire({
            title: "Terhapus!",
            text: "Semua data monitor perumahan berhasil dibersihkan.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false
        });
    } catch (error) {
        console.error(error);
        Swal.fire({
            title: "Gagal",
            text: "Terjadi kesalahan: " + error.message,
            icon: "error",
            confirmButtonColor: "#173f70"
        });
    }
});

console.log("Detail Perumahan Monitor initialized smoothly.");