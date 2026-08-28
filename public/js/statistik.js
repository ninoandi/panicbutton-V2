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
   REFERENCE
========================================= */

const daftarRef = ref(db1, "daftar_perumahan");
const perumahanRef = ref(db1, "perumahan");


/* =========================================
   DOM
========================================= */

const tableBody = document.getElementById("perumahanTableBody");
const searchInput = document.getElementById("searchInput");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const paginationInfo = document.getElementById("paginationInfo");
const cardContainer = document.getElementById("cardContainer");


/* =========================================
   STATE
========================================= */

let allData = [];
let currentPage = 1;
const itemsPerPage = 8;

let daftarPerumahan = {};
let detailPerumahan = {};


/* =========================================
   HELPER
========================================= */

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
   MERGE DATA
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

    // Sort alphabetically by name
    allData.sort((a, b) => a.nama.localeCompare(b.nama));

    currentPage = 1;
    renderTable(filterData(searchInput ? searchInput.value : ""));
}


/* =========================================
   FILTER
========================================= */

function filterData(query) {
    const q = (query || "").toLowerCase().trim();

    return allData.filter(({ nama, info }) => {
        return (
            nama.toLowerCase().includes(q) ||
            (info.kontak || "").toLowerCase().includes(q) ||
            (info.lokasi || "").toLowerCase().includes(q) ||
            (info.nama || "").toLowerCase().includes(q)
        );
    });
}


/* =========================================
   RENDER TABLE
========================================= */

function renderTable(filteredData) {
    if (!tableBody) return;

    const totalItems = filteredData.length;
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
                <td colspan="5" class="loading">
                    <i class="fa-solid fa-chart-pie" style="font-size:32px; display:block; margin-bottom:8px; opacity:0.6;"></i>
                    <strong style="font-size:15px; display:block; margin-bottom:4px; color:var(--dash-text-main);">Tidak ada data statistik ditemukan.</strong>
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
                        ${escapeHtml(info.kontak || "-")}
                    </span>
                </td>

                <td>
                    <span style="display:inline-flex; align-items:center; gap:6px; color:var(--dash-text-muted);">
                        ${escapeHtml(info.lokasi || "-")}
                    </span>
                </td>

                <td style="text-align: center;">
                    <a
                        href="/detail-grafik?perumahan=${encodeURIComponent(key)}"
                        class="btn-action-grafik"
                        title="Lihat Grafik Analitik"
                    >
                        <span>Lihat Grafik</span>
                    </a>
                </td>
            `;

            tableBody.appendChild(row);
        });
    }

    if (paginationInfo) {
        if (totalItems === 0) {
            paginationInfo.textContent = "Menampilkan 0 - 0 dari 0 data";
        } else {
            paginationInfo.textContent = `Menampilkan ${startIdx + 1} - ${endIdx} dari ${totalItems} data kawasan`;
        }
    }

    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = totalPages === 0 || currentPage >= totalPages;

    renderCards(filteredData);
}


/* =========================================
   MOBILE CARD
========================================= */

function renderCards(data) {
    if (!cardContainer) return;

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages === 0) {
        cardContainer.innerHTML = `
            <div class="statistik-card" style="text-align:center; padding:30px 16px;">
                <i class="fa-solid fa-chart-pie" style="font-size:28px; opacity:0.6; margin-bottom:8px; display:block;"></i>
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
        card.className = "statistik-card";

        card.innerHTML = `
            <div class="card-title">
                <i class="fa-solid fa-city" style="color:var(--dash-history); font-size:16px;"></i>
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
                <a
                    href="/detail-grafik?perumahan=${encodeURIComponent(key)}"
                    class="btn-action-grafik"
                >
                    <i class="fa-solid fa-chart-line"></i>
                    <span>Lihat Grafik</span>
                </a>
            </div>
        `;

        cardContainer.appendChild(card);
    });
}


/* =========================================
   EVENT LISTENERS
========================================= */

if (searchInput) {
    searchInput.addEventListener("input", () => {
        currentPage = 1;
        renderTable(filterData(searchInput.value));
    });
}

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
   FIREBASE LISTENERS
========================================= */

onValue(daftarRef, (snapshot) => {
    daftarPerumahan = snapshot.val() || {};
    mergeData();
});

onValue(perumahanRef, (snapshot) => {
    detailPerumahan = snapshot.val() || {};
    mergeData();
});

console.log("Statistik Perumahan initialized smoothly.");