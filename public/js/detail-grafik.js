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
   PERUMAHAN ID
========================================= */

const perumahanId = window.perumahanId;
const loadingOverlay = document.getElementById('loadingOverlay');
const perumahanTag = document.getElementById('perumahanTag');
const customModal = document.getElementById('customModal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const lihatPerbandinganBtn = document.getElementById('lihatPerbandinganBtn');

if (!perumahanId) {
    if (loadingOverlay) loadingOverlay.style.display = 'none';
    const page = document.querySelector('.detail-grafik-page');
    if (page) {
        page.innerHTML = `
            <div style="text-align:center; padding:60px 20px;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:48px; color:var(--dash-emergency); margin-bottom:16px; display:block;"></i>
                <h1 style="font-size:24px; margin-bottom:8px;">ID Perumahan Tidak Ditemukan</h1>
                <p style="color:var(--dash-text-muted); margin-bottom:20px;">Parameter kawasan perumahan tidak valid atau telah dihapus.</p>
                <a href="/statistik" class="btn-back">
                    <i class="fa-solid fa-arrow-left"></i> Kembali ke Statistik
                </a>
            </div>
        `;
    }
    throw new Error('Perumahan ID tidak ditemukan');
}


/* =========================================
   FIREBASE REFERENCES
========================================= */

const daftarPerumahanRef = ref(db1, `daftar_perumahan/${perumahanId}`);
const monitorRef = ref(db1, `perumahan/${perumahanId}/monitor`);


/* =========================================
   CHART VARIABLES
========================================= */

let barChart = null;
let pieChart = null;
let lineChart = null;
let currentMonitorData = null;


/* =========================================
   THEME HELPER FOR CHART.JS
========================================= */

function isDarkMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ||
           document.body.getAttribute('data-theme') === 'dark';
}

function getChartThemeColors() {
    const dark = isDarkMode();
    return {
        textColor: dark ? '#94a3b8' : '#64748b',
        titleColor: dark ? '#f1f5f9' : '#1e293b',
        gridColor: dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        tooltipBg: dark ? '#1e293b' : '#0f172a',
        tooltipText: '#ffffff'
    };
}


/* =========================================
   DATA PROCESSOR
========================================= */

function processData(monitorVal) {
    const stats = {
        darurat: 0,
        penting: 0,
        biasa: 0,
        statusSelesai: 0,
        statusProses: 0,
        usersData: {}
    };

    if (!monitorVal) return stats;

    Object.values(monitorVal).forEach(item => {
        const priority = (item.priority || "").toLowerCase().trim();
        if (priority.includes("darurat")) {
            stats.darurat++;
        } else if (priority.includes("penting")) {
            stats.penting++;
        } else if (priority.includes("biasa")) {
            stats.biasa++;
        }

        const status = (item.status || "").toLowerCase().trim();
        if (status.includes("selesai")) {
            stats.statusSelesai++;
        } else if (status.includes("proses")) {
            stats.statusProses++;
        }

        const name = item.name || "Anonim";
        if (!stats.usersData[name]) {
            stats.usersData[name] = {
                houseNumber: item.houseNumber || "-",
                timestamps: [],
                priorities: [],
                statuses: []
            };
        }

        stats.usersData[name].timestamps.push(item.time || item.timestamp || "-");
        stats.usersData[name].priorities.push(item.priority || "-");
        stats.usersData[name].statuses.push(item.status || "-");
    });

    return stats;
}


/* =========================================
   FETCH NAMA PERUMAHAN
========================================= */

get(daftarPerumahanRef)
    .then(snapshot => {
        const perumahanName = snapshot.val() || `Kawasan ID: ${perumahanId}`;
        if (perumahanTag) {
            perumahanTag.textContent = perumahanName;
        }
    })
    .catch(error => {
        console.error("Gagal mengambil nama perumahan:", error);
        if (perumahanTag) perumahanTag.textContent = perumahanId;
    });


/* =========================================
   RENDER CHARTS
========================================= */

function updateCharts(data) {
    const theme = getChartThemeColors();

    /* =====================================
       1. BAR CHART (PRIORITAS)
    ===================================== */
    const barCtx = document.getElementById('barChart');
    if (barCtx) {
        if (barChart) barChart.destroy();

        barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Darurat', 'Penting', 'Biasa'],
                datasets: [{
                    label: 'Jumlah Peringatan',
                    data: [data.darurat, data.penting, data.biasa],
                    backgroundColor: [
                        '#dc2626',
                        '#f59e0b',
                        '#0284c7'
                    ],
                    borderRadius: 8,
                    borderSkipped: false,
                    barPercentage: 0.55
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: window.innerWidth < 600 ? 1.2 : 1.8,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: theme.tooltipBg,
                        titleColor: '#ffffff',
                        bodyColor: '#e2e8f0',
                        padding: 10,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: theme.textColor, font: { weight: '600' } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: theme.gridColor },
                        ticks: { color: theme.textColor, precision: 0 }
                    }
                },
                onClick: handlePriorityClick
            }
        });
    }


    /* =====================================
       2. PIE CHART (STATUS)
    ===================================== */
    const pieCtx = document.getElementById('pieChart');
    if (pieCtx) {
        if (pieChart) pieChart.destroy();

        const total = data.statusSelesai + data.statusProses || 1;
        const selesaiPercent = ((data.statusSelesai / total) * 100).toFixed(1);
        const prosesPercent = ((data.statusProses / total) * 100).toFixed(1);

        pieChart = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: [
                    `Dalam Proses (${prosesPercent}%)`,
                    `Selesai (${selesaiPercent}%)`
                ],
                datasets: [{
                    data: [data.statusProses, data.statusSelesai],
                    backgroundColor: [
                        '#6366f1',
                        '#10b981'
                    ],
                    hoverOffset: 12,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: window.innerWidth < 600 ? 1 : 1.5,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: theme.titleColor,
                            font: { weight: '600', size: 12 },
                            padding: 16
                        }
                    },
                    tooltip: {
                        backgroundColor: theme.tooltipBg,
                        titleColor: '#ffffff',
                        bodyColor: '#e2e8f0',
                        padding: 10,
                        cornerRadius: 8
                    }
                },
                onClick: handleStatusClick
            }
        });
    }


    /* =====================================
       3. RANKING CHART (PER PENGGUNA)
    ===================================== */
    const rankingCtx = document.getElementById('rankingChart');
    if (rankingCtx) {
        if (lineChart) lineChart.destroy();

        const ranking = Object.entries(data.usersData)
            .map(([name, uData]) => ({
                name,
                total: uData.timestamps.length,
                houseNumber: uData.houseNumber
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10); // Top 10

        const labels = ranking.map(item => `${item.name} (${item.houseNumber})`);
        const totals = ranking.map(item => item.total);

        lineChart = new Chart(rankingCtx, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['Belum ada data'],
                datasets: [{
                    label: 'Jumlah Alarm Dipicu',
                    data: totals.length ? totals : [0],
                    backgroundColor: '#4f46e5',
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: window.innerWidth < 600 ? 1.4 : 2.4,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: theme.tooltipBg,
                        titleColor: '#ffffff',
                        bodyColor: '#e2e8f0',
                        padding: 10,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: theme.gridColor },
                        ticks: { color: theme.textColor, precision: 0 }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: theme.titleColor, font: { weight: '600' } }
                    }
                },
                onClick: handleRankingClick
            }
        });
    }
}


/* =========================================
   CLICK HANDLERS (MODAL)
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

function openModal(title, html) {
    if (modalTitle) modalTitle.innerHTML = `<i class="fa-solid fa-circle-info" style="color:var(--dash-primary);"></i> <span>${escapeHtml(title)}</span>`;
    if (modalContent) modalContent.innerHTML = html;
    if (customModal) customModal.classList.add('active');
}

function closeModal() {
    if (customModal) customModal.classList.remove('active');
}

if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
}

if (customModal) {
    customModal.addEventListener('click', (e) => {
        if (e.target === customModal) closeModal();
    });
}


/* =========================================
   PRIORITY CLICK HANDLER
========================================= */

async function handlePriorityClick(evt, elements) {
    if (!elements.length || !currentMonitorData) return;

    const index = elements[0].index;
    const priorityLabels = ['darurat', 'penting', 'biasa'];
    const selectedPriority = priorityLabels[index];

    const filtered = {};

    Object.values(currentMonitorData).forEach(item => {
        const p = (item.priority || "").toLowerCase().trim();
        const name = item.name || "Anonim";
        const house = item.houseNumber || "-";

        if (p.includes(selectedPriority)) {
            const key = `${name} | No. ${house}`;
            filtered[key] = (filtered[key] || 0) + 1;
        }
    });

    const sorted = Object.entries(filtered).sort((a, b) => b[1] - a[1]);

    let html = `
        <p style="margin-top:0; margin-bottom:12px; color:var(--dash-text-muted);">
            Daftar warga yang memicu panic button dengan prioritas 
            <strong style="color:var(--dash-text-main); text-transform:capitalize;">${selectedPriority}</strong>:
        </p>
        <table class="modal-table">
            <thead>
                <tr>
                    <th>Warga & No Rumah</th>
                    <th style="width: 100px; text-align:center;">Jumlah</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (sorted.length === 0) {
        html += `<tr><td colspan="2" style="text-align:center; color:var(--dash-text-muted);">Tidak ada data</td></tr>`;
    } else {
        sorted.forEach(([user, count]) => {
            html += `
                <tr>
                    <td style="font-weight:600;">${escapeHtml(user)}</td>
                    <td style="text-align:center;">
                        <span style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:50%; background:var(--dash-primary-bg); color:var(--dash-primary); font-weight:700;">
                            ${count}
                        </span>
                    </td>
                </tr>
            `;
        });
    }

    html += `</tbody></table>`;
    openModal(`Prioritas: ${selectedPriority.toUpperCase()}`, html);
}


/* =========================================
   STATUS CLICK HANDLER
========================================= */

async function handleStatusClick(evt, elements) {
    if (!elements.length || !currentMonitorData) return;

    const index = elements[0].index;
    const selectedStatus = index === 1 ? 'selesai' : 'proses';

    const filtered = {};

    Object.values(currentMonitorData).forEach(item => {
        const s = (item.status || "").toLowerCase().trim();
        const name = item.name || "Anonim";
        const house = item.houseNumber || "-";

        if (s.includes(selectedStatus)) {
            const key = `${name} | No. ${house}`;
            filtered[key] = (filtered[key] || 0) + 1;
        }
    });

    const sorted = Object.entries(filtered).sort((a, b) => b[1] - a[1]);

    let html = `
        <p style="margin-top:0; margin-bottom:12px; color:var(--dash-text-muted);">
            Daftar laporan alarm dengan status 
            <strong style="color:var(--dash-text-main); text-transform:capitalize;">${selectedStatus}</strong>:
        </p>
        <table class="modal-table">
            <thead>
                <tr>
                    <th>Warga & No Rumah</th>
                    <th style="width: 100px; text-align:center;">Jumlah</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (sorted.length === 0) {
        html += `<tr><td colspan="2" style="text-align:center; color:var(--dash-text-muted);">Tidak ada data</td></tr>`;
    } else {
        sorted.forEach(([user, count]) => {
            html += `
                <tr>
                    <td style="font-weight:600;">${escapeHtml(user)}</td>
                    <td style="text-align:center;">
                        <span style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:50%; background:var(--dash-primary-bg); color:var(--dash-primary); font-weight:700;">
                            ${count}
                        </span>
                    </td>
                </tr>
            `;
        });
    }

    html += `</tbody></table>`;
    openModal(`Status: ${selectedStatus.toUpperCase()}`, html);
}


/* =========================================
   RANKING CLICK HANDLER
========================================= */

async function handleRankingClick(evt, elements) {
    if (!elements.length || !currentMonitorData) return;

    const index = elements[0].index;
    const stats = processData(currentMonitorData);
    const ranking = Object.entries(stats.usersData)
        .map(([name, uData]) => ({ name, ...uData }))
        .sort((a, b) => b.timestamps.length - a.timestamps.length);

    const user = ranking[index];
    if (!user) return;

    let html = `
        <div style="margin-bottom:14px; padding:12px 14px; background:var(--dash-bg); border-radius:10px;">
            <div style="font-weight:700; font-size:15px; color:var(--dash-text-main);">${escapeHtml(user.name)}</div>
            <div style="font-size:13px; color:var(--dash-text-muted);">Nomor Rumah: <strong>${escapeHtml(user.houseNumber)}</strong> | Total Alarm: <strong>${user.timestamps.length} kali</strong></div>
        </div>
        <table class="modal-table">
            <thead>
                <tr>
                    <th style="width: 40px;">No</th>
                    <th>Prioritas</th>
                    <th>Status</th>
                    <th>Waktu Kejadian</th>
                </tr>
            </thead>
            <tbody>
    `;

    user.timestamps.forEach((time, i) => {
        html += `
            <tr>
                <td>${i + 1}</td>
                <td><strong style="color:var(--dash-primary);">${escapeHtml(user.priorities[i] || "-")}</strong></td>
                <td>${escapeHtml(user.statuses[i] || "-")}</td>
                <td style="font-family:monospace; font-size:12px;">${escapeHtml(time)}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    openModal(`Riwayat Alarm: ${user.name}`, html);
}


/* =========================================
   LIHAT PERBANDINGAN BUTTON
========================================= */

if (lihatPerbandinganBtn) {
    lihatPerbandinganBtn.addEventListener('click', () => {
        if (!currentMonitorData) return;

        const stats = processData(currentMonitorData);
        const total = stats.statusSelesai + stats.statusProses;
        const selesaiPercent = total ? ((stats.statusSelesai / total) * 100).toFixed(1) : 0;
        const prosesPercent = total ? ((stats.statusProses / total) * 100).toFixed(1) : 0;

        let html = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:16px;">
                <div style="padding:16px; background:var(--dash-success-bg); border:1px solid var(--dash-success-border); border-radius:12px; text-align:center;">
                    <div style="font-size:12px; font-weight:700; color:var(--dash-success); margin-bottom:4px;">SELESAI</div>
                    <div style="font-size:24px; font-weight:800; color:var(--dash-success);">${stats.statusSelesai}</div>
                    <div style="font-size:12px; color:var(--dash-text-muted);">${selesaiPercent}% dari total</div>
                </div>
                <div style="padding:16px; background:var(--dash-history-bg); border:1px solid var(--dash-history-border); border-radius:12px; text-align:center;">
                    <div style="font-size:12px; font-weight:700; color:var(--dash-history); margin-bottom:4px;">DALAM PROSES</div>
                    <div style="font-size:24px; font-weight:800; color:var(--dash-history);">${stats.statusProses}</div>
                    <div style="font-size:12px; color:var(--dash-text-muted);">${prosesPercent}% dari total</div>
                </div>
            </div>
            <p style="font-size:13px; color:var(--dash-text-muted); margin-bottom:0; text-align:center;">
                Total keseluruhan insiden darurat yang tercatat di kawasan ini: <strong>${total} panggilan</strong>.
            </p>
        `;

        openModal("Perbandingan Status Penanganan", html);
    });
}


/* =========================================
   REALTIME FIREBASE LISTENER
========================================= */

onValue(monitorRef, (snapshot) => {
    currentMonitorData = snapshot.val() || {};
    const stats = processData(currentMonitorData);

    updateCharts(stats);

    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 300);
    }
});

// Re-render chart on theme changes (if user toggles Dark mode)
const observer = new MutationObserver(() => {
    if (currentMonitorData) {
        const stats = processData(currentMonitorData);
        updateCharts(stats);
    }
});

observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

console.log("Detail Grafik Statistik initialized smoothly.");