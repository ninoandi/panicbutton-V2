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
   DOM ELEMENTS
========================================= */

const titleElement = document.getElementById("title");
const tableBody = document.getElementById("monitorTableBody");
const clearAllBtn = document.getElementById("clearAllBtn");
const btnExportExcel = document.getElementById("btnExportExcel");

const searchInput = document.getElementById("search");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");
const periodFilter = document.getElementById("periodFilter");
const sortOrder = document.getElementById("sortOrder");
const pagination = document.getElementById("pagination");


/* =========================================
   STATE
========================================= */

let allData = [];
let currentHousingName = "";
let currentPage = 1;
const itemsPerPage = 10;


/* =========================================
   HELPER: ACCURATE TIMESTAMP PARSER
========================================= */

function parseTimestamp(rawTime, item = {}) {
    // 1. Cek explicit timestamp atau created_at dalam item
    if (item.timestamp) {
        const num = Number(item.timestamp);
        if (Number.isFinite(num) && num > 0) {
            return num < 10000000000 ? num * 1000 : num;
        }
    }
    if (item.created_at) {
        const num = Number(item.created_at);
        if (Number.isFinite(num) && num > 0) {
            return num < 10000000000 ? num * 1000 : num;
        }
    }

    if (!rawTime || rawTime === "-") return 0;

    // 2. Direct Number
    if (typeof rawTime === "number") {
        return rawTime < 10000000000 ? rawTime * 1000 : rawTime;
    }

    const str = String(rawTime).trim();

    // 3. String angka timestamp (10 atau 13 digit)
    if (/^\d{10,13}$/.test(str)) {
        const num = parseInt(str, 10);
        return num < 10000000000 ? num * 1000 : num;
    }

    // 4. "YYYY-MM-DD waktu HH:mm:ss" atau "YYYY-MM-DD waktu HH:mm"
    const matchWaktu = str.match(/^(\d{4}-\d{2}-\d{2})\s+waktu\s+(\d{2}:\d{2}(?::\d{2})?)$/i);
    if (matchWaktu) {
        const d = new Date(`${matchWaktu[1]}T${matchWaktu[2]}`);
        if (!isNaN(d.getTime())) return d.getTime();
    }

    // 5. "YYYY-MM-DD HH:mm:ss" atau "YYYY-MM-DD HH:mm"
    const matchIso = str.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}(?::\d{2})?)$/);
    if (matchIso) {
        const d = new Date(`${matchIso[1]}T${matchIso[2]}`);
        if (!isNaN(d.getTime())) return d.getTime();
    }

    // 6. "DD-MM-YYYY HH:mm:ss" atau "DD/MM/YYYY HH:mm:ss"
    const matchIndo = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})(?:\s+(?:waktu|pukul)?\s*(\d{2}:\d{2}(?::\d{2})?))?$/i);
    if (matchIndo) {
        const timePart = matchIndo[4] || "00:00:00";
        const d = new Date(`${matchIndo[3]}-${matchIndo[2]}-${matchIndo[1]}T${timePart}`);
        if (!isNaN(d.getTime())) return d.getTime();
    }

    // 7. General new Date parser
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
        return parsed.getTime();
    }

    return 0;
}

function formatIncidentTime(rawTime, item = {}) {
    const ts = parseTimestamp(rawTime, item);
    if (ts > 0) {
        const date = new Date(ts);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} | ${hours}:${minutes}:${seconds}`;
    }

    if (typeof rawTime === "string" && rawTime.trim() !== "") {
        return rawTime.trim();
    }

    return "-";
}

function getItemMonth(item) {
    if (item.timestamp > 0) {
        const d = new Date(item.timestamp);
        return d.getMonth() + 1; // 1 = Januari, ..., 12 = Desember
    }
    return null;
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
   PRIORITY & STATUS BADGE RENDERERS
======================================== */

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
            currentHousingName = snapshot.val();
        } else {
            const perumahanInfoRef = ref(db1, `perumahan/${key}/info/nama`);
            const infoSnap = await get(perumahanInfoRef);
            currentHousingName = infoSnap.exists() ? infoSnap.val() : key;
        }
        if (titleElement) {
            titleElement.textContent = `Detail Perumahan: ${currentHousingName}`;
        }
    } catch (error) {
        console.error("Gagal mengambil nama perumahan:", error);
        currentHousingName = key;
        if (titleElement) {
            titleElement.textContent = `Detail Perumahan: ${key}`;
        }
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

            const rawVal = snapshot.val() || {};
            allData = Object.entries(rawVal).map(([mKey, item]) => {
                if (!item || typeof item !== "object") {
                    return {
                        id: mKey,
                        name: "-",
                        houseNumber: "-",
                        message: "-",
                        priority: "Biasa",
                        status: "Proses",
                        time: "-",
                        formattedTime: "-",
                        timestamp: 0,
                        latitude: 0,
                        longitude: 0
                    };
                }

                const rawTime = item.time || item.waktu || item.timestamp || item.created_at || "-";
                const ts = parseTimestamp(rawTime, item);

                return {
                    id: mKey,
                    name: item.name || item.nama || item.username || "-",
                    houseNumber: item.houseNumber || item.house_number || item.no_rumah || item.rumah || "-",
                    message: item.message || item.pesan || item.description || "-",
                    priority: item.priority || item.prioritas || "Biasa",
                    status: item.status || "Proses",
                    time: rawTime,
                    formattedTime: formatIncidentTime(rawTime, item),
                    timestamp: ts,
                    latitude: item.latitude ?? item.lat ?? 0,
                    longitude: item.longitude ?? item.lng ?? item.lon ?? 0
                };
            });

            // Urutkan default: Terbaru (descending)
            allData.sort((a, b) => b.timestamp - a.timestamp);

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
   FILTER + SEARCH + PERIODE + SORT
========================================= */

function getFilteredData() {
    let filtered = [...allData];

    // 1. Search Keyword
    const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : "";
    if (searchValue) {
        filtered = filtered.filter(item => {
            return (
                item.name.toLowerCase().includes(searchValue) ||
                String(item.houseNumber).toLowerCase().includes(searchValue) ||
                item.message.toLowerCase().includes(searchValue) ||
                item.priority.toLowerCase().includes(searchValue) ||
                item.status.toLowerCase().includes(searchValue) ||
                item.formattedTime.toLowerCase().includes(searchValue)
            );
        });
    }

    // 2. Status Filter
    if (statusFilter && statusFilter.value) {
        filtered = filtered.filter(item => item.status.toLowerCase() === statusFilter.value.toLowerCase());
    }

    // 3. Priority Filter
    if (priorityFilter && priorityFilter.value) {
        filtered = filtered.filter(item => item.priority.toLowerCase() === priorityFilter.value.toLowerCase());
    }

    // 4. Periode Filter (Bulanan 1 - 12)
    if (periodFilter && periodFilter.value) {
        const targetMonth = parseInt(periodFilter.value, 10);
        filtered = filtered.filter(item => getItemMonth(item) === targetMonth);
    }

    // 5. Urutan Waktu (Sort Order)
    const currentSort = sortOrder ? sortOrder.value : "desc";
    filtered.sort((a, b) => {
        const diff = a.timestamp - b.timestamp;
        if (diff !== 0) {
            return currentSort === "asc" ? diff : -diff;
        }
        // Fallback jika timestamp sama: urutkan berdasarkan ID
        return currentSort === "asc"
            ? String(a.id || "").localeCompare(String(b.id || ""))
            : String(b.id || "").localeCompare(String(a.id || ""));
    });

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
                const locationHtml = (item.latitude && item.longitude && !(item.latitude === 0 && item.longitude === 0))
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

[searchInput, statusFilter, priorityFilter, periodFilter, sortOrder].forEach(el => {
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
   FITUR IMPORT / EXPORT RECAP EXCEL PERUMAHAN
========================================= */

function exportRecapToExcel() {
    if (typeof XLSX === "undefined") {
        Swal.fire({
            icon: "error",
            title: "Library Excel Belum Siap",
            text: "Mohon tunggu sebentar atau muat ulang halaman untuk memproses Excel.",
            confirmButtonColor: "#173f70"
        });
        return;
    }

    const dataToExport = getFilteredData();

    if (!dataToExport || dataToExport.length === 0) {
        Swal.fire({
            icon: "info",
            title: "Tidak Ada Data",
            text: "Tidak ada data log aktivitas untuk diunduh pada filter saat ini.",
            confirmButtonColor: "#173f70"
        });
        return;
    }

    const housingTitle = currentHousingName || key || "Perumahan";

    // 1. Buat Baris Header & Subheader sesuai spesifikasi
    const worksheetData = [
        [`Recap Data Perumahan ${housingTitle}`],
        [`Daftar aktivitas darurat perumahan ${housingTitle} yang terekam di sistem`],
        [], // Baris kosong pemisah
        ["No", "Nama Pengguna", "No Rumah", "Pesan Darurat", "Prioritas", "Status", "Waktu Kejadian", "Titik Lokasi"]
    ];

    // 2. Isi data tabel log insiden
    dataToExport.forEach((item, idx) => {
        let locationVal = "-";
        if (item.latitude && item.longitude && !(item.latitude === 0 && item.longitude === 0)) {
            locationVal = `https://www.google.com/maps?q=${item.latitude},${item.longitude}`;
        }

        worksheetData.push([
            idx + 1,
            item.name || "-",
            item.houseNumber || "-",
            item.message || "-",
            item.priority || "-",
            item.status || "-",
            item.formattedTime || "-",
            locationVal
        ]);
    });

    // 3. Konversi array ke Worksheet SheetJS
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // 4. Merge Header Row 1 & Row 2
    ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Merge Header A1:H1
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }  // Merge Subheader A2:H2
    ];

    // 5. Atur lebar kolom yang lapang dan proporsional (Nama Pengguna hingga Waktu tidak terpotong)
    ws["!cols"] = [
        { wch: 6 },  // No
        { wch: 28 }, // Nama Pengguna (lebar agar tidak terpotong)
        { wch: 14 }, // No Rumah
        { wch: 42 }, // Pesan Darurat (lebar & nyaman dibaca)
        { wch: 16 }, // Prioritas
        { wch: 16 }, // Status
        { wch: 26 }, // Waktu Kejadian (format tanggal & jam lengkap tidak terpotong)
        { wch: 18 }  // Titik Lokasi (pas dengan judul Titik Lokasi)
    ];

    // 6. Hyperlink Google Maps jika ada koordinat
    const startRow = 4; // Row 5 di excel (0-indexed = 4)
    dataToExport.forEach((item, idx) => {
        if (item.latitude && item.longitude && !(item.latitude === 0 && item.longitude === 0)) {
            const cellRef = XLSX.utils.encode_cell({ r: startRow + idx, c: 7 });
            const mapUrl = `https://www.google.com/maps?q=${item.latitude},${item.longitude}`;
            ws[cellRef] = {
                t: "s",
                v: mapUrl,
                l: { Target: mapUrl, Tooltip: "Buka Google Maps" }
            };
        }
    });

    // 7. Buat Workbook & Tulis File
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Recap Perumahan");

    const safeName = String(housingTitle).replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Recap_Data_Perumahan_${safeName}_${Date.now()}.xlsx`;

    XLSX.writeFile(wb, filename);

    Swal.fire({
        icon: "success",
        title: "File Excel Berhasil Diunduh!",
        text: `File recap untuk perumahan ${housingTitle} berhasil dibuat.`,
        timer: 2300,
        showConfirmButton: false
    });
}

btnExportExcel?.addEventListener("click", exportRecapToExcel);


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