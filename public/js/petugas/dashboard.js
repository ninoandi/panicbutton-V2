/* =========================================================
   DASHBOARD PETUGAS - HIGH PERFORMANCE REALTIME STREAM
   Firebase Realtime Database (Targeted Queries + Shallow Cumulative Counts)
========================================================= */

import { db1, db2 } from "../firebase-config.js";
import {
    ref,
    onValue,
    update,
    query,
    limitToLast,
    get
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
    // Stat Elements
    const activeReportsCountEl = document.getElementById("activeReportsCount");
    const totalReportsCountEl = document.getElementById("totalReportsCount");
    const completedReportsCountEl = document.getElementById("completedReportsCount");

    // Grid Containers
    const housingReportsGrid = document.getElementById("housingReportsGrid");
    const publicReportsGrid = document.getElementById("publicReportsGrid");

    // Header Badges
    const housingAlertBadge = document.getElementById("housingAlertBadge");
    const housingAlertBadgeText = document.getElementById("housingAlertBadgeText");
    const housingAlertDot = document.getElementById("housingAlertDot");
    const publicAlertBadge = document.getElementById("publicAlertBadge");
    const publicAlertBadgeText = document.getElementById("publicAlertBadgeText");
    const publicAlertDot = document.getElementById("publicAlertDot");

    // Modal Elements
    const petugasActionModal = document.getElementById("petugasActionModal");
    const modalPetugasBody = document.getElementById("modalPetugasBody");
    const btnClosePetugasModal = document.getElementById("btnClosePetugasModal");
    const btnCancelPetugasModal = document.getElementById("btnCancelPetugasModal");
    const btnSaveDashboardStatusChange = document.getElementById("btnSaveDashboardStatusChange");
    const btnGoToFullHistory = document.getElementById("btnGoToFullHistory");

    // Modal Hidden Fields
    const dashModalReportId = document.getElementById("dashModalReportId");
    const dashModalReportSource = document.getElementById("dashModalReportSource");
    const dashModalPerumahanKey = document.getElementById("dashModalPerumahanKey");
    const dashModalDbTable = document.getElementById("dashModalDbTable");
    const dashOfficerNote = document.getElementById("dashOfficerNote");
    const radioStatusCards = document.querySelectorAll(".status-radio-card");

    // Close Modal Events
    if (btnClosePetugasModal) {
        btnClosePetugasModal.addEventListener("click", closeActionModal);
    }
    if (btnCancelPetugasModal) {
        btnCancelPetugasModal.addEventListener("click", closeActionModal);
    }
    if (petugasActionModal) {
        petugasActionModal.addEventListener("click", (e) => {
            if (e.target === petugasActionModal) closeActionModal();
        });
    }

    function closeActionModal() {
        if (petugasActionModal) petugasActionModal.style.display = "none";
    }

    // Radio Status Selection Logic
    radioStatusCards.forEach(card => {
        card.addEventListener("click", () => {
            const radio = card.querySelector("input[type='radio']");
            if (radio) radio.checked = true;
            radioStatusCards.forEach(c => c.classList.remove("active-selected"));
            card.classList.add("active-selected");
        });
    });

    function setModalRadioStatus(statusVal) {
        const normalized = normalizeStatus(statusVal);
        radioStatusCards.forEach(card => {
            const val = card.getAttribute("data-val");
            const radio = card.querySelector("input[type='radio']");
            if (val === normalized) {
                if (radio) radio.checked = true;
                card.classList.add("active-selected");
            } else {
                if (radio) radio.checked = false;
                card.classList.remove("active-selected");
            }
        });
    }

    function getSelectedRadioStatus() {
        const checked = document.querySelector("input[name='dashRadioStatus']:checked");
        return checked ? checked.value : "Menunggu";
    }

    // High Performance In-Memory Store
    let daftarPerumahanDict = {};
    const housingReportsMap = new Map(); // clusterKey -> array of reports
    const shallowCountMap = new Map();
    let publicPanicsReports = [];
    let publicGeneralReports = [];
    let allMergedReports = [];
    let activeClusterListeners = new Set();
    let totalCumulativeReports = 0;
    let renderBatchTimer = null;
    let countRefreshTimer = null;

    /* =========================================================
       HELPER: TIMESTAMP & STATUS PARSER
    ========================================================= */
    function parseTimestamp(rawTime, item = {}) {
        if (item.timestamp && typeof item.timestamp === "number" && item.timestamp > 0) {
            return item.timestamp < 10000000000 ? item.timestamp * 1000 : item.timestamp;
        }
        if (item.created_at && typeof item.created_at === "number" && item.created_at > 0) {
            return item.created_at < 10000000000 ? item.created_at * 1000 : item.created_at;
        }

        if (!rawTime || rawTime === "-") return Date.now();

        if (typeof rawTime === "number" && rawTime > 0) {
            return rawTime < 10000000000 ? rawTime * 1000 : rawTime;
        }

        const str = String(rawTime).trim();
        if (/^\d+$/.test(str)) {
            const num = parseInt(str, 10);
            return num < 10000000000 ? num * 1000 : num;
        }

        const matchWaktu = str.match(/^(\d{4}-\d{2}-\d{2})\s+waktu\s+(\d{2}:\d{2}(?::\d{2})?)$/i);
        if (matchWaktu) {
            const d = new Date(`${matchWaktu[1]}T${matchWaktu[2]}`);
            if (!isNaN(d.getTime())) return d.getTime();
        }

        const matchIso = str.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}(?::\d{2})?)$/);
        if (matchIso) {
            const d = new Date(`${matchIso[1]}T${matchIso[2]}`);
            if (!isNaN(d.getTime())) return d.getTime();
        }

        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) {
            return parsed.getTime();
        }

        return Date.now();
    }

    function normalizeStatus(status) {
        if (!status) return "Menunggu";
        const s = String(status).toLowerCase().trim();
        if (s === "selesai" || s === "completed" || s === "done" || s === "tuntas") return "Selesai";
        if (s === "diproses" || s === "proses" || s === "process" || s === "handling") return "Diproses";
        return "Menunggu";
    }

    function scheduleBatchRender() {
        if (renderBatchTimer) clearTimeout(renderBatchTimer);
        renderBatchTimer = setTimeout(() => {
            renderHousingReportsStream();
            renderPublicReportsStream();
            updateStats();
        }, 50);
    }

    /* =========================================================
       REALTIME ACCURATE CUMULATIVE COUNTS (SHALLOW QUERIES)
    ========================================================= */
    async function refreshCumulativeCounts() {
        try {
            const keys = Object.keys(daftarPerumahanDict);
            if (keys.length === 0) return;

            // 1. Fetch DB1 shallow keys in parallel (~100ms)
            const pPromises = keys.map(async (key) => {
                try {
                    const res = await fetch(`https://panicbuttonrtdb-eccd1-default-rtdb.firebaseio.com/perumahan/${key}/monitor.json?shallow=true`);
                    if (res.ok) {
                        const data = await res.json();
                        const count = data && typeof data === "object" ? Object.keys(data).length : 0;
                        shallowCountMap.set(key, count);
                        return count;
                    }
                } catch (e) { }
                return shallowCountMap.get(key) || 0;
            });

            const pCounts = await Promise.all(pPromises);
            const db1Sum = pCounts.reduce((a, b) => a + b, 0);

            // 2. Fetch DB2 shallow keys
            let db2Sum = 0;
            try {
                const res2 = await fetch(`https://panicbttn2-default-rtdb.asia-southeast1.firebasedatabase.app/public_panics.json?shallow=true`);
                if (res2.ok) {
                    const data2 = await res2.json();
                    db2Sum += data2 && typeof data2 === "object" ? Object.keys(data2).length : 0;
                }
            } catch (e) { }

            try {
                const res3 = await fetch(`https://panicbttn2-default-rtdb.asia-southeast1.firebasedatabase.app/reports.json?shallow=true`);
                if (res3.ok) {
                    const data3 = await res3.json();
                    db2Sum += data3 && typeof data3 === "object" ? Object.keys(data3).length : 0;
                }
            } catch (e) { }

            totalCumulativeReports = db1Sum + db2Sum;
            updateStats();
        } catch (err) {
            console.warn("Cumulative count error:", err);
        }
    }

    function scheduleCountRefresh() {
        if (countRefreshTimer) clearTimeout(countRefreshTimer);
        countRefreshTimer = setTimeout(() => {
            refreshCumulativeCounts();
        }, 300);
    }

    function updateStats() {
        const flattenedHousing = [];
        housingReportsMap.forEach(reports => flattenedHousing.push(...reports));
        allMergedReports = [...flattenedHousing, ...publicPanicsReports, ...publicGeneralReports];

        let activeCount = 0;
        allMergedReports.forEach(r => {
            if (r.status === "Menunggu" || r.status === "Diproses") {
                activeCount++;
            }
        });

        const displayTotal = Math.max(totalCumulativeReports, allMergedReports.length);
        const displayCompleted = Math.max(0, displayTotal - activeCount);

        if (activeReportsCountEl) activeReportsCountEl.textContent = activeCount.toLocaleString("id-ID");
        if (totalReportsCountEl) totalReportsCountEl.textContent = displayTotal.toLocaleString("id-ID");
        if (completedReportsCountEl) completedReportsCountEl.textContent = displayCompleted.toLocaleString("id-ID");
    }

    /* =========================================================
       1. OPTIMIZED REALTIME DB1 (TARGETED CLUSTER QUERIES)
    ========================================================= */
    const daftarRef = ref(db1, "daftar_perumahan");
    onValue(daftarRef, (snapshot) => {
        daftarPerumahanDict = snapshot.val() || {};
        const clusterKeys = Object.keys(daftarPerumahanDict);

        clusterKeys.forEach(pKey => {
            if (activeClusterListeners.has(pKey)) return;
            activeClusterListeners.add(pKey);

            const pName = daftarPerumahanDict[pKey] || pKey;

            // Targeted Query: Hanya baca sub-node monitor berbatas (limitToLast 40)
            const monitorQuery = query(ref(db1, `perumahan/${pKey}/monitor`), limitToLast(40));
            onValue(monitorQuery, (mSnap) => {
                const monitorData = mSnap.val() || {};
                const clusterReports = [];

                Object.entries(monitorData).forEach(([mId, mVal]) => {
                    if (!mVal || typeof mVal !== "object") return;
                    const rawTime = mVal.time || mVal.waktu || mVal.timestamp || mVal.created_at || "-";
                    const ts = parseTimestamp(rawTime, mVal);

                    clusterReports.push({
                        id: mId,
                        source: "perumahan",
                        dbTable: "monitor",
                        perumahanKey: pKey,
                        perumahanName: pName,
                        userName: mVal.name || mVal.nama || mVal.username || mVal.userName || "Warga Perumahan",
                        userPhone: mVal.phone || mVal.phoneNumber || mVal.telepon || mVal.no_hp || "-",
                        location: mVal.houseNumber ? `Rumah No. ${mVal.houseNumber} (${pName})` : pName,
                        houseNumber: mVal.houseNumber || mVal.no_rumah || mVal.house_number || "-",
                        time: ts,
                        status: normalizeStatus(mVal.status),
                        note: mVal.message || mVal.pesan || mVal.description || mVal.keterangan || mVal.note || "-",
                        officerNote: mVal.officer_note || mVal.response_note || "",
                        device: mVal.device || mVal.buzzer_name || "Sensor Panic Perumahan",
                        latitude: mVal.latitude || mVal.lat || null,
                        longitude: mVal.longitude || mVal.lng || null
                    });
                });

                housingReportsMap.set(pKey, clusterReports);
                scheduleBatchRender();
                scheduleCountRefresh();
            }, (err) => {
                console.warn(`DB1 cluster monitor ${pKey} error:`, err);
            });
        });

        scheduleBatchRender();
        scheduleCountRefresh();
    }, (err) => {
        console.error("DB1 daftar_perumahan error:", err);
    });

    /* =========================================================
       2. OPTIMIZED REALTIME DB2 (TARGETED QUERIES)
    ========================================================= */
    const publicPanicsQuery = query(ref(db2, "public_panics"), limitToLast(50));
    onValue(publicPanicsQuery, (snapshot) => {
        const data = snapshot.val() || {};
        publicPanicsReports = Object.entries(data).map(([rId, rVal]) => {
            const rawTime = rVal.created_at || rVal.timestamp || Date.now();
            const ts = parseTimestamp(rawTime, rVal);

            return {
                id: rId,
                source: "public",
                dbTable: "public_panics",
                perumahanKey: "",
                perumahanName: "Area Publik",
                userName: rVal.senderName || rVal.name || rVal.user_name || "Warga Publik",
                userPhone: rVal.phone || rVal.telepon || "-",
                location: rVal.address || rVal.lokasi || (rVal.latitude && rVal.longitude ? `${rVal.latitude}, ${rVal.longitude}` : "Area Publik"),
                houseNumber: "-",
                time: ts,
                status: normalizeStatus(rVal.status),
                note: rVal.description || rVal.note || rVal.keterangan || "-",
                officerNote: rVal.officer_note || rVal.response_note || "",
                device: rVal.assigned_device || rVal.device || "IoT Panic Device",
                latitude: rVal.latitude || null,
                longitude: rVal.longitude || null,
                locationUrl: rVal.locationUrl || null
            };
        });

        scheduleBatchRender();
        scheduleCountRefresh();
    }, (err) => {
        console.error("DB2 public_panics error:", err);
    });

    const publicReportsQuery = query(ref(db2, "reports"), limitToLast(50));
    onValue(publicReportsQuery, (snapshot) => {
        const data = snapshot.val() || {};
        publicGeneralReports = Object.entries(data).map(([rId, rVal]) => {
            const rawTime = rVal.timestamp || rVal.created_at || Date.now();
            const ts = parseTimestamp(rawTime, rVal);

            return {
                id: rId,
                source: "public",
                dbTable: "reports",
                perumahanKey: "",
                perumahanName: "Area Publik",
                userName: rVal.user_name || rVal.name || "Pengguna Publik",
                userPhone: rVal.phone || rVal.telepon || "-",
                location: rVal.location || rVal.address || "Area Publik",
                houseNumber: "-",
                time: ts,
                status: normalizeStatus(rVal.status),
                note: rVal.description || rVal.note || rVal.keterangan || "-",
                officerNote: rVal.officer_note || rVal.response_note || "",
                device: rVal.device || "Aplikasi Publik",
                latitude: rVal.latitude || null,
                longitude: rVal.longitude || null,
                locationUrl: rVal.locationUrl || null
            };
        });

        scheduleBatchRender();
        scheduleCountRefresh();
    }, (err) => {
        console.error("DB2 reports error:", err);
    });

    /* =========================================================
       3. RENDER STREAMS (PERUMAHAN & PUBLIC)
    ========================================================= */
    function renderHousingReportsStream() {
        if (!housingReportsGrid) return;

        const allHousing = [];
        housingReportsMap.forEach(reports => allHousing.push(...reports));
        allHousing.sort((a, b) => b.time - a.time);

        const waitingCount = allHousing.filter(r => r.status === "Menunggu").length;
        const processCount = allHousing.filter(r => r.status === "Diproses").length;

        if (housingAlertBadge && housingAlertBadgeText) {
            if (waitingCount > 0) {
                housingAlertBadge.className = "card-header-badge active-alarm";
                if (housingAlertDot) housingAlertDot.className = "badge-dot-indicator dot-red";
                housingAlertBadgeText.textContent = `${waitingCount} Laporan Menunggu`;
            } else if (processCount > 0) {
                housingAlertBadge.className = "card-header-badge in-progress-badge";
                if (housingAlertDot) housingAlertDot.className = "badge-dot-indicator dot-amber";
                housingAlertBadgeText.textContent = `${processCount} Sedang Diproses`;
            } else {
                housingAlertBadge.className = "card-header-badge";
                if (housingAlertDot) housingAlertDot.className = "badge-dot-indicator dot-green";
                housingAlertBadgeText.textContent = "Seluruh Laporan Tuntas";
            }
        }

        // Filter HANYA laporan aktif: Menunggu & Diproses
        const activeHousingReports = allHousing.filter(r => r.status === "Menunggu" || r.status === "Diproses");

        if (activeHousingReports.length === 0) {
            housingReportsGrid.innerHTML = `
                <div class="panic-empty-state">
                    <div class="empty-state-icon-circle">
                        <i class="fa-solid fa-shield-heart"></i>
                    </div>
                    <h3>Tidak Ada Laporan Perumahan Aktif</h3>
                    <p>Seluruh laporan darurat perumahan telah selesai ditangani.</p>
                </div>
            `;
            return;
        }

        // Tampilkan hingga 6 laporan aktif terbaru
        const displayItems = activeHousingReports.slice(0, 6);
        housingReportsGrid.innerHTML = displayItems.map(report => renderReportCardHtml(report)).join("");
    }

    function renderPublicReportsStream() {
        if (!publicReportsGrid) return;

        const combinedPublic = [...publicPanicsReports, ...publicGeneralReports];
        combinedPublic.sort((a, b) => b.time - a.time);

        const waitingCount = combinedPublic.filter(r => r.status === "Menunggu").length;
        const processCount = combinedPublic.filter(r => r.status === "Diproses").length;

        if (publicAlertBadge && publicAlertBadgeText) {
            if (waitingCount > 0) {
                publicAlertBadge.className = "card-header-badge active-alarm";
                if (publicAlertDot) publicAlertDot.className = "badge-dot-indicator dot-red";
                publicAlertBadgeText.textContent = `${waitingCount} Laporan Menunggu`;
            } else if (processCount > 0) {
                publicAlertBadge.className = "card-header-badge in-progress-badge";
                if (publicAlertDot) publicAlertDot.className = "badge-dot-indicator dot-amber";
                publicAlertBadgeText.textContent = `${processCount} Sedang Diproses`;
            } else {
                publicAlertBadge.className = "card-header-badge";
                if (publicAlertDot) publicAlertDot.className = "badge-dot-indicator dot-green";
                publicAlertBadgeText.textContent = "Seluruh Laporan Tuntas";
            }
        }

        // Filter HANYA laporan aktif: Menunggu & Diproses
        const activePublicReports = combinedPublic.filter(r => r.status === "Menunggu" || r.status === "Diproses");

        if (activePublicReports.length === 0) {
            publicReportsGrid.innerHTML = `
                <div class="panic-empty-state">
                    <div class="empty-state-icon-circle public-idle">
                        <i class="fa-solid fa-satellite-dish"></i>
                    </div>
                    <h3>Tidak Ada Laporan Publik Aktif</h3>
                    <p>Seluruh laporan publik telah tuntas ditangani dan sistem dalam status siaga.</p>
                </div>
            `;
            return;
        }

        // Tampilkan hingga 6 laporan aktif terbaru
        const displayItems = activePublicReports.slice(0, 6);
        publicReportsGrid.innerHTML = displayItems.map(report => renderReportCardHtml(report)).join("");
    }

    function renderReportCardHtml(report) {
        const isWaiting = report.status === "Menunggu";
        const isProcess = report.status === "Diproses";
        const formattedTime = formatReportTime(report.time);

        // Status Badge Html
        let statusBadgeHtml = "";
        if (isWaiting) {
            statusBadgeHtml = `<span class="report-status-pill badge-waiting"><span class="badge-dot-indicator dot-red" style="width:6px; height:6px;"></span> MENUNGGU</span>`;
        } else if (isProcess) {
            statusBadgeHtml = `<span class="report-status-pill badge-process"> DIPROSES</span>`;
        } else {
            statusBadgeHtml = `<span class="report-status-pill badge-done"><i class="fa-solid fa-check"></i> SELESAI</span>`;
        }

        // Quick Advance Action Button
        let quickActionHtml = "";
        if (isWaiting) {
            quickActionHtml = `
                <button type="button" class="btn-card-quick-action btn-quick-process" onclick="window.quickUpdateReportStatus('${escapeHtml(report.id)}', 'Diproses')" title="Tandai Sedang Diproses">
                    <i class="fa-solid fa-person-running"></i>
                    <span>Proses</span>
                </button>
            `;
        } else if (isProcess) {
            quickActionHtml = `
                <button type="button" class="btn-card-quick-action btn-quick-done" onclick="window.quickUpdateReportStatus('${escapeHtml(report.id)}', 'Selesai')" title="Tandai Insiden Selesai">
                    <span>Selesaikan</span>
                </button>
            `;
        }

        // Location text
        let locationDisplay = report.location;
        if (report.source === "perumahan" && report.houseNumber && report.houseNumber !== "-") {
            locationDisplay = `Rumah No. ${escapeHtml(report.houseNumber)} &bull; ${escapeHtml(report.perumahanName)}`;
        }

        return `
            <div class="report-stream-card ${isWaiting ? 'is-waiting-alarm' : (isProcess ? 'is-in-progress' : '')}" id="dash_card_${escapeHtml(report.id)}">
                <div class="report-card-top-row">
                    <div class="report-user-block">
                        <div class="report-user-avatar ${report.source === 'perumahan' ? 'avatar-perumahan' : 'avatar-public'}">
                            <i class="${report.source === 'perumahan' ? 'fa-solid fa-house-chimney-user' : 'fa-solid fa-user-shield'}"></i>
                        </div>
                        <div class="report-user-info">
                            <strong class="report-user-title">${escapeHtml(report.userName)}</strong>
                            <span class="report-user-subtitle">${escapeHtml(report.perumahanName || (report.source === 'perumahan' ? 'Klaster Perumahan' : 'Area Publik'))}</span>
                        </div>
                    </div>
                    ${statusBadgeHtml}
                </div>

                <div class="report-card-meta-list">
                    <div class="report-meta-row">
                        <i class="fa-solid fa-location-dot meta-icon-loc"></i>
                        <span class="meta-text">${escapeHtml(locationDisplay)}</span>
                    </div>
                    <div class="report-meta-row">
                        <i class="fa-regular fa-clock meta-icon-time"></i>
                        <span class="meta-text">${formattedTime}</span>
                    </div>
                    ${report.note && report.note !== '-' ? `
                        <div class="report-meta-note">
                            <i class="fa-regular fa-comment-dots"></i>
                            <span>${escapeHtml(report.note)}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="report-card-footer-actions">
                    <button type="button" class="btn-card-manage" onclick="window.openDashboardActionModal('${escapeHtml(report.id)}')">
                        <span>Detail & Ubah Status</span>
                    </button>
                    ${quickActionHtml}
                    <a href="/petugas/riwayat-laporan?reportId=${encodeURIComponent(report.id)}" class="btn-card-goto-history" title="Buka Detail Laporan di Halaman Riwayat">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </div>
            </div>
        `;
    }

    function formatReportTime(time) {
        if (!time) return "-";
        const numeric = Number(time);
        const date = Number.isFinite(numeric) ? new Date(numeric) : new Date(time);
        if (isNaN(date.getTime())) return String(time);

        return date.toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    /* =========================================================
       4. MODAL DETAIL & STATUS UPDATE
    ========================================================= */
    window.openDashboardActionModal = function (reportId) {
        const report = allMergedReports.find(r => r.id === reportId);
        if (!report || !petugasActionModal || !modalPetugasBody) return;

        if (dashModalReportId) dashModalReportId.value = report.id;
        if (dashModalReportSource) dashModalReportSource.value = report.source;
        if (dashModalPerumahanKey) dashModalPerumahanKey.value = report.perumahanKey || "";
        if (dashModalDbTable) dashModalDbTable.value = report.dbTable || "monitor";
        if (dashOfficerNote) dashOfficerNote.value = report.officerNote || "";

        if (btnGoToFullHistory) {
            btnGoToFullHistory.href = `/petugas/riwayat-laporan?reportId=${encodeURIComponent(report.id)}`;
        }

        setModalRadioStatus(report.status);

        // Google Maps Link
        let mapLinkHtml = "-";
        if (report.locationUrl) {
            mapLinkHtml = `<a href="${report.locationUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb; text-decoration:underline; font-weight:600;"><i class="fa-solid fa-map-location-dot"></i> Buka Google Maps</a>`;
        } else if (report.latitude && report.longitude && report.latitude != 0 && report.longitude != 0) {
            mapLinkHtml = `<a href="https://www.google.com/maps?q=${report.latitude},${report.longitude}" target="_blank" rel="noopener noreferrer" style="color:#2563eb; text-decoration:underline; font-weight:600;"><i class="fa-solid fa-map-location-dot"></i> Buka Google Maps (${report.latitude}, ${report.longitude})</a>`;
        }

        modalPetugasBody.innerHTML = `
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-tag"></i> Kategori Laporan</span>
                <span class="detail-row-value">
                    <span class="category-tag ${report.source === 'perumahan' ? 'perumahan' : 'public'}">
                        <i class="${report.source === 'perumahan' ? 'fa-solid fa-building-shield' : 'fa-solid fa-tower-cell'}"></i>
                        ${report.source === 'perumahan' ? 'Perumahan' : 'Public'}
                    </span>
                </span>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-user"></i> Nama Pelapor</span>
                <strong class="detail-row-value">${escapeHtml(report.userName)}</strong>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-phone"></i> Kontak / Telepon</span>
                <span class="detail-row-value">${escapeHtml(report.userPhone)}</span>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-location-dot"></i> Lokasi Kejadian</span>
                <span class="detail-row-value">${escapeHtml(report.location)}</span>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-map-pin"></i> Koordinat Peta</span>
                <span class="detail-row-value">${mapLinkHtml}</span>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-microchip"></i> Perangkat Terkait</span>
                <span class="detail-row-value">${escapeHtml(report.device)}</span>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-regular fa-clock"></i> Waktu Laporan</span>
                <span class="detail-row-value">${formatReportTime(report.time)}</span>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-regular fa-message"></i> Keterangan Insiden</span>
                <span class="detail-row-value" style="text-align:right; font-style:italic;">${escapeHtml(report.note)}</span>
            </div>
        `;

        petugasActionModal.style.display = "flex";
    };

    // Save Button in Modal
    if (btnSaveDashboardStatusChange) {
        btnSaveDashboardStatusChange.addEventListener("click", async () => {
            const reportId = dashModalReportId.value;
            const source = dashModalReportSource.value;
            const perumahanKey = dashModalPerumahanKey.value;
            const dbTable = dashModalDbTable.value;
            const newStatus = getSelectedRadioStatus();
            const noteText = (dashOfficerNote ? dashOfficerNote.value : "").trim();

            await executeReportStatusUpdate(reportId, source, perumahanKey, dbTable, newStatus, noteText);
            closeActionModal();
        });
    }

    // Quick Update Directly from Card
    window.quickUpdateReportStatus = async function (reportId, targetStatus) {
        const report = allMergedReports.find(r => r.id === reportId);
        if (!report) return;

        const confirmColor = targetStatus === "Selesai" ? "#10b981" : "#f59e0b";
        const result = await Swal.fire({
            title: `Ubah Status ke "${targetStatus}"?`,
            text: targetStatus === "Selesai"
                ? "Laporan ini akan ditandai telah selesai ditangani."
                : "Laporan ini akan dialihkan ke status sedang ditangani petugas.",
            icon: targetStatus === "Selesai" ? "success" : "info",
            showCancelButton: true,
            confirmButtonColor: confirmColor,
            cancelButtonColor: "#64748b",
            confirmButtonText: `Ya, Tandai ${targetStatus}`,
            cancelButtonText: "Batal",
            reverseButtons: true
        });

        if (result.isConfirmed) {
            await executeReportStatusUpdate(
                report.id,
                report.source,
                report.perumahanKey,
                report.dbTable,
                targetStatus,
                report.officerNote || ""
            );
        }
    };

    async function executeReportStatusUpdate(reportId, source, perumahanKey, dbTable, newStatus, noteText = "") {
    try {
        const statusMap = {
            "Selesai": "selesai",
            "Diproses": "diproses",
            "Menunggu": "menunggu"
        };

        // =============================================
        // 🔥 RESET IoT JIKA STATUS DIUBAH
        // =============================================
        if (newStatus === "Diproses" || newStatus === "Selesai") {
            try {
                // Ambil data laporan dari Firebase
                const reportRef = ref(db2, `public_panics/${reportId}`);
                const reportSnap = await get(reportRef);
                const reportData = reportSnap.val();

                if (reportData && reportData.assigned_zone && reportData.assigned_device) {
                    // 🔥 RESET IoT (matikan buzzer)
                    const deviceRef = ref(db2, `panicChannels/${reportData.assigned_zone}/${reportData.assigned_device}`);
                    await update(deviceRef, {
                        active: false,
                        assigned_panic_id: "",
                        panic_latitude: null,
                        panic_longitude: null,
                        last_update: Date.now()
                    });
                    console.log("✅ IoT di-reset oleh petugas:", reportData.assigned_device);
                }
            } catch (iotError) {
                console.warn("Gagal reset IoT:", iotError);
            }
        }

        const payload = {
            status: statusMap[newStatus] || "menunggu",
            updated_at: Date.now()
        };

        if (noteText) {
            payload.officer_note = noteText;
            payload.response_note = noteText;
        }

        if (source === "perumahan") {
            if (!perumahanKey) throw new Error("Perumahan key tidak ditemukan.");
            const subNode = dbTable || "monitor";
            await update(ref(db1, `perumahan/${perumahanKey}/${subNode}/${reportId}`), payload);
        } else {
            const targetTable = dbTable || "public_panics";
            await update(ref(db2, `${targetTable}/${reportId}`), payload);
        }

        // Update local memory
        const found = allMergedReports.find(r => r.id === reportId);
        if (found) {
            found.status = newStatus;
            if (noteText) found.officerNote = noteText;
        }

        scheduleBatchRender();

        Swal.fire({
            icon: "success",
            title: "Status Berhasil Diperbarui",
            text: `Laporan berhasil diubah menjadi status "${newStatus}".`,
            timer: 1800,
            showConfirmButton: false
        });

    } catch (err) {
        console.error("Gagal memperbarui status:", err);
        Swal.fire({
            icon: "error",
            title: "Gagal Menyimpan",
            text: "Terjadi kesalahan: " + err.message,
            confirmButtonColor: "#dc2626"
        });
    }
}

    function escapeHtml(text) {
        if (!text) return "";
        return String(text).replace(/[&<>"']/g, (m) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[m]);
    }
});
