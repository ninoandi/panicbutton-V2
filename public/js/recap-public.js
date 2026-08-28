/* =========================================================
   RECAP DATA PUBLIC - JAVASCRIPT CONTROLLER
   Firebase Realtime Database (Config 2) Integration
========================================================= */

import { db2 } from "./firebase-config.js";
import {
    ref,
    onValue,
    update
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

/* =========================================================
   DOM ELEMENTS
========================================================= */

const tableBody = document.getElementById("recapTableBody");
const mobileCardsContainer = document.getElementById("mobileCardsContainer");

const totalCountEl = document.getElementById("totalCount");
const activeCountEl = document.getElementById("activeCount");
const completedCountEl = document.getElementById("completedCount");
const todayCountEl = document.getElementById("todayCount");
const syncStatusEl = document.getElementById("syncStatus");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const sortOrder = document.getElementById("sortOrder");
const resetFilterBtn = document.getElementById("resetFilterBtn");

const paginationInfo = document.getElementById("paginationInfo");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

// Modal Peta Lokasi
const locationModal = document.getElementById("locationModal");
const closeLocationModal = document.getElementById("closeLocationModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalLocationTitle = document.getElementById("modalLocationTitle");
const modalAddress = document.getElementById("modalAddress");
const modalCoords = document.getElementById("modalCoords");
const modalDevice = document.getElementById("modalDevice");
const modalZone = document.getElementById("modalZone");
const modalTime = document.getElementById("modalTime");
const gmapsLinkBtn = document.getElementById("gmapsLinkBtn");

// Modal Detail Laporan
const detailModal = document.getElementById("detailModal");
const closeDetailModal = document.getElementById("closeDetailModal");
const closeDetailBtn = document.getElementById("closeDetailBtn");
const detailModalTitle = document.getElementById("detailModalTitle");
const detailUserType = document.getElementById("detailUserType");
const detailContact = document.getElementById("detailContact");
const detailTime = document.getElementById("detailTime");
const detailStatus = document.getElementById("detailStatus");
const detailAddress = document.getElementById("detailAddress");
const detailCoords = document.getElementById("detailCoords");
const detailDevice = document.getElementById("detailDevice");
const detailZone = document.getElementById("detailZone");
const detailDistance = document.getElementById("detailDistance");
const detailToggleStatusBtn = document.getElementById("detailToggleStatusBtn");

/* =========================================================
   STATE MANAGEMENT
========================================================= */

let rawPanics = {};
let allData = [];
let currentPage = 1;
const itemsPerPage = 10;
let leafletMap = null;
let mapMarker = null;
let currentDetailReport = null;

/* =========================================================
   HELPER UTILITIES
========================================================= */

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

function formatDate(timestamp) {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatTime(timestamp) {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "-";
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

function formatFullDateTime(timestamp) {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleString("id-ID", {
        dateStyle: "full",
        timeStyle: "medium"
    });
}

function isStatusActive(status) {
    if (typeof status === "string") {
        const s = status.toLowerCase().trim();
        return s === "active" || s === "aktif" || s === "proses";
    }
    return Boolean(status);
}

function truncateLocation(text, maxLength = 100) {
    if (!text) return "-";
    const str = String(text).trim();
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength).trim() + "...";
}

/* =========================================================
   PARSE & PROCESS DATA
========================================================= */

function processData() {
    allData = Object.entries(rawPanics).map(([id, item]) => {
        const active = isStatusActive(item.status);
        const createdAt = item.created_at || (item.timestamp ? Number(item.timestamp) : 0);
        return {
            id,
            ...item,
            created_at: createdAt,
            isActive: active,
            displayStatus: active ? "Aktif" : "Selesai",
            latitude: Number(item.latitude) || 0,
            longitude: Number(item.longitude) || 0,
            address: item.address || item.lokasi || (item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : "-"),
            assigned_device: item.assigned_device || item.device || "-",
            assigned_zone: item.assigned_zone || item.zona || "-",
            assigned_location: item.assigned_location || "-",
            device_distance: item.device_distance !== undefined ? Number(item.device_distance) : null
        };
    });

    updateSummaryMetrics();
    applyFilters();
}

/* =========================================================
   UPDATE SUMMARY METRICS (4 CARDS)
========================================================= */

function updateSummaryMetrics() {
    const total = allData.length;
    let active = 0;
    let completed = 0;
    let today = 0;

    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    allData.forEach((item) => {
        if (item.isActive) {
            active++;
        } else {
            completed++;
        }

        if (item.created_at >= twentyFourHoursAgo) {
            today++;
        }
    });

    if (totalCountEl) totalCountEl.textContent = total.toLocaleString("id-ID");
    if (activeCountEl) activeCountEl.textContent = active.toLocaleString("id-ID");
    if (completedCountEl) completedCountEl.textContent = completed.toLocaleString("id-ID");
    if (todayCountEl) todayCountEl.textContent = today.toLocaleString("id-ID");
}

/* =========================================================
   FILTER & SORT
========================================================= */

function applyFilters() {
    const query = (searchInput ? searchInput.value : "").toLowerCase().trim();
    const selectedStatus = statusFilter ? statusFilter.value : "";
    const selectedSort = sortOrder ? sortOrder.value : "desc";

    let filtered = allData.filter((item) => {
        // 1. Search filter
        const matchSearch =
            !query ||
            item.address.toLowerCase().includes(query) ||
            item.assigned_device.toLowerCase().includes(query) ||
            item.assigned_zone.toLowerCase().includes(query) ||
            item.assigned_location.toLowerCase().includes(query) ||
            (item.name || "").toLowerCase().includes(query) ||
            (item.phone || "").toLowerCase().includes(query) ||
            item.id.toLowerCase().includes(query) ||
            `${item.latitude}, ${item.longitude}`.includes(query);

        // 2. Status filter
        let matchStatus = true;
        if (selectedStatus === "active") {
            matchStatus = item.isActive;
        } else if (selectedStatus === "completed") {
            matchStatus = !item.isActive;
        }

        return matchSearch && matchStatus;
    });

    // Sort order
    filtered.sort((a, b) => {
        if (selectedSort === "asc") {
            return (a.created_at || 0) - (b.created_at || 0);
        } else {
            return (b.created_at || 0) - (a.created_at || 0);
        }
    });

    renderTable(filtered);
}

/* =========================================================
   RENDER TABLE & MOBILE CARDS
========================================================= */

function renderTable(filteredData) {
    if (!tableBody) return;

    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }

    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, totalItems);
    const pageItems = filteredData.slice(startIdx, endIdx);

    // Empty state
    if (totalItems === 0) {
        tableBody.innerHTML = `
            <tr class="loading-row">
                <td colspan="7">
                    <i class="fa-solid fa-bell-slash" style="font-size:36px; display:block; margin-bottom:10px; opacity:0.5; color:var(--dash-text-muted);"></i>
                    <strong style="font-size:15px; display:block; margin-bottom:4px; color:var(--dash-text-main);">Tidak ada data laporan Panic Publik.</strong>
                    <span style="font-size:13px;">Laporan darurat yang masuk dari splash screen / landing page akan muncul di sini.</span>
                </td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = pageItems
            .map((item, index) => {
                const no = startIdx + index + 1;
                const dateStr = formatDate(item.created_at);
                const timeStr = formatTime(item.created_at);
                const isAct = item.isActive;

                const statusBadge = isAct
                    ? `<span class="status-badge status-badge-active">
                         <span class="status-dot-active"></span> Aktif
                       </span>`
                    : `<span class="status-badge status-badge-completed">
                         <span class="status-dot-completed"></span> Selesai
                       </span>`;

                const fullAddress = item.address || "-";
                const locationDisplay = escapeHtml(truncateLocation(fullAddress, 100));
                const subLocation = item.assigned_device !== "-"
                    ? `Perangkat: ${escapeHtml(item.assigned_device)} (${escapeHtml(item.assigned_zone)})`
                    : `Koordinat: ${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}`;

                return `
                    <tr>
                        <td style="font-weight: 600; color: var(--dash-text-muted); text-align: center; width: 60px;">
                            ${no}
                        </td>
                        <td style="text-align: center; white-space: nowrap;">
                            ${dateStr}
                        </td>
                        <td style="text-align: center; white-space: nowrap; font-weight: 600;">
                            ${timeStr}
                        </td>
                        <td>
                            <div class="location-cell" title="${escapeAttribute(fullAddress)}">
                                <div class="location-main">
                                    <span>${locationDisplay}</span>
                                </div>
                                <div class="location-sub">${subLocation}</div>
                            </div>
                        </td>
                        <td style="text-align: center;">
                            <button
                                type="button"
                                class="btn-view-location"
                                onclick="window.openLocationModal('${escapeAttribute(item.id)}')"
                                title="Buka Peta Interaktif"
                            >
                                <i class="fa-solid fa-map-location-dot"></i>
                                <span>Lihat Lokasi</span>
                            </button>
                        </td>
                        <td style="text-align: center;">
                            ${statusBadge}
                        </td>
                        <td style="text-align: center;">
                            <button
                                type="button"
                                class="btn-detail-recap"
                                onclick="window.openDetailModal('${escapeAttribute(item.id)}')"
                                title="Lihat Detail Recap"
                            >
                                <span>Detail Recap</span>
                            </button>
                        </td>
                    </tr>
                `;
            })
            .join("");
    }

    // Pagination info & controls
    if (paginationInfo) {
        if (totalItems === 0) {
            paginationInfo.textContent = "Menampilkan 0 - 0 dari 0 data";
        } else {
            paginationInfo.textContent = `Menampilkan ${startIdx + 1} - ${endIdx} dari ${totalItems} data`;
        }
    }

    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages || totalItems === 0;

    renderMobileCards(pageItems, totalItems);
}

/* =========================================================
   RENDER MOBILE CARDS (RESPONSIVE VIEW)
========================================================= */

function renderMobileCards(items, totalItems) {
    if (!mobileCardsContainer) return;

    if (totalItems === 0) {
        mobileCardsContainer.innerHTML = `
            <div class="public-panic-card" style="text-align:center; padding:30px 16px;">
                <i class="fa-solid fa-bell-slash" style="font-size:28px; opacity:0.5; margin-bottom:8px; display:block; color:var(--dash-text-muted);"></i>
                <strong style="color:var(--dash-text-main);">Tidak ada data laporan Panic Publik</strong>
            </div>
        `;
        return;
    }

    mobileCardsContainer.innerHTML = items
        .map((item) => {
            const dateStr = formatDate(item.created_at);
            const timeStr = formatTime(item.created_at);
            const isAct = item.isActive;
            const cardClass = isAct ? "card-active" : "card-completed";

            const statusBadge = isAct
                ? `<span class="status-badge status-badge-active">
                     <span class="status-dot-active"></span> Aktif
                   </span>`
                : `<span class="status-badge status-badge-completed">
                     <span class="status-dot-completed"></span> Selesai
                   </span>`;

            return `
                <div class="public-panic-card ${cardClass}">
                    <div class="card-top">
                        <div class="card-date-time">
                            <span>${dateStr}</span>
                            <span>•</span>
                            <span>${timeStr}</span>
                        </div>
                        ${statusBadge}
                    </div>

                    <div class="card-location-info">
                        <div class="card-location-text">
                            <span>${escapeHtml(item.address)}</span>
                        </div>
                        <div class="card-subtext">
                            Perangkat: ${escapeHtml(item.assigned_device)} (${escapeHtml(item.assigned_zone)})
                        </div>
                    </div>

                    <div class="card-action-bar">
                        <button
                            type="button"
                            class="btn-view-location"
                            onclick="window.openLocationModal('${escapeAttribute(item.id)}')"
                        >
                            <i class="fa-solid fa-map-location-dot"></i>
                            <span>Lihat Lokasi</span>
                        </button>

                        <button
                            type="button"
                            class="btn-detail-recap"
                            onclick="window.openDetailModal('${escapeAttribute(item.id)}')"
                        >
                            <i class="fa-solid fa-file-waveform"></i>
                            <span>Detail Recap</span>
                        </button>
                    </div>
                </div>
            `;
        })
        .join("");
}

/* =========================================================
   MODAL PETA LOKASI (LEAFLET INTERAKTIF)
========================================================= */

function initLeafletMap(lat, lon, title) {
    const mapBox = document.getElementById("mapElement");
    if (!mapBox) return;

    if (!leafletMap) {
        leafletMap = L.map("mapElement", {
            center: [lat, lon],
            zoom: 16,
            zoomControl: true
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(leafletMap);
    } else {
        leafletMap.setView([lat, lon], 16);
    }

    if (mapMarker) {
        leafletMap.removeLayer(mapMarker);
    }

    // Custom pulse icon marker
    const redIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
            <div style="
                width: 28px;
                height: 28px;
                background: #dc2626;
                color: #ffffff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 0 6px rgba(220, 38, 38, 0.25);
                font-size: 14px;
            ">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });

    mapMarker = L.marker([lat, lon], { icon: redIcon }).addTo(leafletMap);
    mapMarker.bindPopup(`<strong>Titik Panic Button</strong><br>${escapeHtml(title)}`).openPopup();

    setTimeout(() => {
        if (leafletMap) {
            leafletMap.invalidateSize();
        }
    }, 250);
}

window.openLocationModal = function (reportId) {
    const report = allData.find((r) => r.id === reportId);
    if (!report) return;

    const lat = report.latitude || 0;
    const lon = report.longitude || 0;

    if (modalLocationTitle) {
        modalLocationTitle.textContent = `Titik Kejadian (${report.assigned_device !== "-" ? report.assigned_device : "Publik"})`;
    }
    if (modalAddress) modalAddress.textContent = report.address || "-";
    if (modalCoords) modalCoords.textContent = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    if (modalDevice) modalDevice.textContent = report.assigned_device || "-";
    if (modalZone) modalZone.textContent = report.assigned_zone || "-";
    if (modalTime) modalTime.textContent = formatFullDateTime(report.created_at);

    if (gmapsLinkBtn) {
        const mapsUrl = report.location_url || `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
        gmapsLinkBtn.href = mapsUrl;
    }

    if (locationModal) {
        locationModal.classList.add("active");
    }

    if (typeof L !== "undefined") {
        initLeafletMap(lat, lon, report.address);
    }
};

function closeLocationModalFn() {
    if (locationModal) {
        locationModal.classList.remove("active");
    }
}

if (closeLocationModal) closeLocationModal.addEventListener("click", closeLocationModalFn);
if (closeModalBtn) closeModalBtn.addEventListener("click", closeLocationModalFn);
if (locationModal) {
    locationModal.addEventListener("click", (e) => {
        if (e.target === locationModal) closeLocationModalFn();
    });
}

/* =========================================================
   MODAL DETAIL LAPORAN
========================================================= */

window.openDetailModal = function (reportId) {
    const report = allData.find((r) => r.id === reportId);
    if (!report) return;

    currentDetailReport = report;

    if (detailModalTitle) detailModalTitle.textContent = `Detail Laporan`;
    if (detailUserType) {
        detailUserType.textContent = report.is_guest !== false ? "Publik (Guest / Tanpa Login)" : "Pengguna Terdaftar";
    }
    if (detailContact) {
        const info = [];
        if (report.name) info.push(report.name);
        if (report.phone) info.push(report.phone);
        if (report.email) info.push(report.email);
        detailContact.textContent = info.length > 0 ? info.join(" • ") : "Anonim (Guest)";
    }
    if (detailTime) detailTime.textContent = formatFullDateTime(report.created_at);
    if (detailStatus) {
        detailStatus.innerHTML = report.isActive
            ? `<span class="status-badge status-badge-active"><span class="status-dot-active"></span> Aktif</span>`
            : `<span class="status-badge status-badge-completed"><span class="status-dot-completed"></span> Selesai</span>`;
    }
    if (detailAddress) detailAddress.textContent = report.address || "-";
    if (detailCoords) detailCoords.textContent = `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`;
    if (detailDevice) detailDevice.textContent = report.assigned_device || "-";
    if (detailZone) detailZone.textContent = report.assigned_zone || "-";
    if (detailDistance) {
        detailDistance.textContent = report.device_distance !== null ? `${report.device_distance} meter` : "-";
    }

    if (detailToggleStatusBtn) {
        if (report.isActive) {
            detailToggleStatusBtn.className = "btn-modal btn-mark-done";
            detailToggleStatusBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Tandai Selesai</span>`;
        } else {
            detailToggleStatusBtn.className = "btn-modal btn-mark-active";
            detailToggleStatusBtn.innerHTML = `<span>Aktifkan Kembali</span>`;
        }
    }

    if (detailModal) {
        detailModal.classList.add("active");
    }
};

function closeDetailModalFn() {
    if (detailModal) {
        detailModal.classList.remove("active");
    }
    currentDetailReport = null;
}

if (closeDetailModal) closeDetailModal.addEventListener("click", closeDetailModalFn);
if (closeDetailBtn) closeDetailBtn.addEventListener("click", closeDetailModalFn);
if (detailModal) {
    detailModal.addEventListener("click", (e) => {
        if (e.target === detailModal) closeDetailModalFn();
    });
}

if (detailToggleStatusBtn) {
    detailToggleStatusBtn.addEventListener("click", () => {
        if (currentDetailReport) {
            const nextStatus = currentDetailReport.isActive ? "completed" : "active";
            window.updateReportStatus(currentDetailReport.id, nextStatus);
            closeDetailModalFn();
        }
    });
}

/* =========================================================
   UPDATE STATUS KE FIREBASE CONFIG 2
========================================================= */

window.updateReportStatus = async function (reportId, targetStatus) {
    const isTargetDone = targetStatus === "completed" || targetStatus === "selesai";
    const statusText = isTargetDone ? "Selesai" : "Aktif";
    const confirmColor = isTargetDone ? "#10b981" : "#dc2626";

    const result = await Swal.fire({
        title: `Ubah Status Menjadi "${statusText}"?`,
        text: isTargetDone
            ? "Laporan ini akan ditandai telah selesai ditangani."
            : "Laporan ini akan diaktifkan kembali dalam daftar siaga darurat.",
        icon: isTargetDone ? "question" : "warning",
        showCancelButton: true,
        confirmButtonText: `Ya, Jadikan ${statusText}`,
        cancelButtonText: "Batal",
        confirmButtonColor: confirmColor,
        cancelButtonColor: "#64748b",
        reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
        const reportRef = ref(db2, `public_panics/${reportId}`);
        await update(reportRef, {
            status: targetStatus,
            updated_at: Date.now()
        });

        Swal.fire({
            icon: "success",
            title: "Status Diperbarui",
            text: `Status laporan berhasil diubah menjadi ${statusText}.`,
            timer: 1800,
            showConfirmButton: false
        });
    } catch (error) {
        console.error("Gagal memperbarui status:", error);
        Swal.fire({
            icon: "error",
            title: "Gagal Mengubah Status",
            text: error.message || "Terjadi kesalahan saat menghubungi Firebase.",
            confirmButtonColor: "#173f70"
        });
    }
};

/* =========================================================
   EVENT LISTENERS: SEARCH, FILTER, PAGINATION
========================================================= */

if (searchInput) {
    searchInput.addEventListener("input", () => {
        currentPage = 1;
        applyFilters();
    });
}

if (statusFilter) {
    statusFilter.addEventListener("change", () => {
        currentPage = 1;
        applyFilters();
    });
}

if (sortOrder) {
    sortOrder.addEventListener("change", () => {
        currentPage = 1;
        applyFilters();
    });
}

if (resetFilterBtn) {
    resetFilterBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (statusFilter) statusFilter.value = "";
        if (sortOrder) sortOrder.value = "desc";
        currentPage = 1;
        applyFilters();
    });
}

if (prevBtn) {
    prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            applyFilters();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });
}

if (nextBtn) {
    nextBtn.addEventListener("click", () => {
        currentPage++;
        applyFilters();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

/* =========================================================
   FIREBASE REALTIME LISTENER (CONFIG 2)
========================================================= */

const panicsRef = ref(db2, "public_panics");

onValue(
    panicsRef,
    (snapshot) => {
        rawPanics = snapshot.val() || {};
        if (syncStatusEl) {
            syncStatusEl.textContent = "Realtime Terhubung";
        }
        processData();
    },
    (error) => {
        console.error("Gagal membaca Firebase Config 2 (public_panics):", error);
        if (syncStatusEl) {
            syncStatusEl.textContent = "Koneksi Terputus";
        }
        if (tableBody) {
            tableBody.innerHTML = `
                <tr class="loading-row">
                    <td colspan="7">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size:32px; color:var(--dash-emergency); display:block; margin-bottom:8px;"></i>
                        <strong style="color:var(--dash-emergency); display:block;">Gagal terhubung ke Firebase Config 2.</strong>
                        <span style="font-size:13px; color:var(--dash-text-muted);">${escapeHtml(error.message)}</span>
                    </td>
                </tr>
            `;
        }
    }
);

console.log("Recap Data Public (Firebase Config 2) Controller Initialized.");
