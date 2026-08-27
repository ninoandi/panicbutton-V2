import { db1, db2 } from "../firebase-config.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
    // Stat Elements
    const activeReportsCountEl = document.getElementById("activeReportsCount");
    const totalReportsCountEl = document.getElementById("totalReportsCount");
    const completedReportsCountEl = document.getElementById("completedReportsCount");

    // Grid Elements
    const housingPanicGrid = document.getElementById("housingPanicGrid");
    const publicPanicGrid = document.getElementById("publicPanicGrid");
    const housingAlertBadge = document.getElementById("housingAlertBadge");
    const housingAlertBadgeText = document.getElementById("housingAlertBadgeText");
    const publicAlertBadge = document.getElementById("publicAlertBadge");
    const publicAlertBadgeText = document.getElementById("publicAlertBadgeText");

    // Modal Elements
    const petugasActionModal = document.getElementById("petugasActionModal");
    const modalPetugasBody = document.getElementById("modalPetugasBody");
    const btnClosePetugasModal = document.getElementById("btnClosePetugasModal");

    if (btnClosePetugasModal) {
        btnClosePetugasModal.addEventListener("click", () => {
            if (petugasActionModal) petugasActionModal.style.display = "none";
        });
    }

    if (petugasActionModal) {
        petugasActionModal.addEventListener("click", (e) => {
            if (e.target === petugasActionModal) {
                petugasActionModal.style.display = "none";
            }
        });
    }

    // State Variables
    let housingReports = [];
    let publicReports = [];
    let publicPanicsReports = [];

    function updateStats() {
        const allReports = [...housingReports, ...publicReports, ...publicPanicsReports];

        let activeCount = 0;
        let completedCount = 0;

        allReports.forEach(r => {
            const s = (r.status || "").toLowerCase();
            if (s === "selesai" || s === "completed" || s === "done") {
                completedCount++;
            } else {
                activeCount++;
            }
        });

        if (activeReportsCountEl) activeReportsCountEl.textContent = activeCount;
        if (totalReportsCountEl) totalReportsCountEl.textContent = allReports.length;
        if (completedReportsCountEl) completedReportsCountEl.textContent = completedCount;
    }

    /* =========================================================
       1. REALTIME DB1 (PERUMAHAN)
    ========================================================= */
    const perumahanRef = ref(db1, "perumahan");
    onValue(perumahanRef, (snapshot) => {
        const data = snapshot.val() || {};
        housingReports = [];
        const housingAlarms = [];

        Object.entries(data).forEach(([pKey, pVal]) => {
            if (!pVal || typeof pVal !== "object" || pKey === "buzzers") return;
            const pName = pVal.info?.nama || pVal.nama || pKey;

            // 1. Check reports
            if (pVal.reports) {
                Object.entries(pVal.reports).forEach(([rId, rVal]) => {
                    if (!rVal) return;
                    housingReports.push({
                        id: rId,
                        source: "perumahan",
                        perumahanKey: pKey,
                        perumahanName: pName,
                        userName: rVal.userName || rVal.nama_warga || rVal.nama || "Warga Perumahan",
                        houseNumber: rVal.houseNumber || rVal.no_rumah || "-",
                        time: rVal.timestamp || rVal.time || rVal.created_at || Date.now(),
                        status: rVal.status || "Menunggu",
                        note: rVal.note || rVal.keterangan || "-"
                    });
                });
            }

            // 2. Check active buzzers / panic alarms
            let hasActiveAlarm = false;
            let buzzerName = "Buzzer Posko";

            if (pVal.buzzers) {
                Object.entries(pVal.buzzers).forEach(([bKey, bVal]) => {
                    if (!bVal || typeof bVal !== "object") return;
                    const isAlarm = bVal.status === "ON" || bVal.state === true || bVal.alarm === true || bVal.status === true;
                    if (isAlarm) {
                        hasActiveAlarm = true;
                        buzzerName = bVal.nama || bVal.name || bKey;
                    }
                });
            }

            if (pVal.status_panic === true || pVal.alarm === true) {
                hasActiveAlarm = true;
            }

            if (pVal.monitor) {
                Object.entries(pVal.monitor).forEach(([mKey, mVal]) => {
                    if (mVal && (mVal.status === "active" || mVal.is_active === true || mVal.status === "ON")) {
                        hasActiveAlarm = true;
                    }
                });
            }

            housingAlarms.push({
                key: pKey,
                perumahanKey: pKey,
                perumahanName: pName,
                buzzerName: buzzerName,
                isEmergency: hasActiveAlarm,
                updatedAt: pVal.updated_at || Date.now()
            });
        });

        renderHousingGrid(housingAlarms);
        updateStats();
    }, (err) => {
        console.error("DB1 perumahan error:", err);
    });

    function renderHousingGrid(alarms) {
        if (!housingPanicGrid) return;
        const activeAlarms = alarms.filter(a => a.isEmergency);

        if (housingAlertBadge && housingAlertBadgeText) {
            if (activeAlarms.length > 0) {
                housingAlertBadge.className = "card-header-badge active-alarm";
                housingAlertBadgeText.innerHTML = `<span class="pulse-dot-red"></span> ${activeAlarms.length} Alarm Aktif!`;
            } else {
                housingAlertBadge.className = "card-header-badge";
                housingAlertBadgeText.innerHTML = `<span class="pulse-dot"></span> Semua Normal`;
            }
        }

        if (alarms.length === 0) {
            housingPanicGrid.innerHTML = `
                <div class="panic-empty-state">
                    <div class="empty-state-icon-circle">
                        <i class="fa-solid fa-shield-heart"></i>
                    </div>
                    <h3>Tidak Ada Peringatan Darurat</h3>
                    <p>Seluruh area perumahan dalam kondisi aman dan siaga.</p>
                </div>
            `;
            return;
        }

        alarms.sort((a, b) => (b.isEmergency ? 1 : 0) - (a.isEmergency ? 1 : 0));

        housingPanicGrid.innerHTML = alarms.map(alarm => `
            <div class="panic-item-card ${alarm.isEmergency ? 'is-emergency' : ''}">
                <div class="panic-item-header">
                    <span class="panic-item-name"><i class="fa-solid fa-building-shield" style="color: #2563eb;"></i> ${escapeHtml(alarm.perumahanName)}</span>
                    <span class="panic-status-tag ${alarm.isEmergency ? 'alarm' : 'standby'}">
                        ${alarm.isEmergency ? '<span class="pulse-dot-red"></span> SIAGA AKTIF' : '<span class="pulse-dot"></span> STANDBY'}
                    </span>
                </div>
                <div class="panic-item-details">
                    <div class="panic-detail-row">
                        <i class="fa-solid fa-bell" style="color: ${alarm.isEmergency ? '#dc2626' : 'var(--dash-text-muted)'};"></i>
                        <span>Posko / Perangkat: <strong>${escapeHtml(alarm.buzzerName)}</strong></span>
                    </div>
                </div>
                <div class="panic-item-actions">
                    <button type="button" class="btn-respond-alarm" onclick="handlePetugasResponse('perumahan', '${alarm.perumahanKey}', '${escapeHtml(alarm.perumahanName)}')">
                        <i class="fa-solid fa-shield-halved"></i>
                        <span>Tanggapi Sekarang</span>
                    </button>
                </div>
            </div>
        `).join("");
    }

    /* =========================================================
       2. REALTIME DB2 (PUBLIC)
    ========================================================= */
    const publicPanicRef = ref(db2, "panicChannels");
    const publicReportsRef = ref(db2, "reports");
    const publicPanicsRef = ref(db2, "public_panics");

    onValue(publicPanicsRef, (snapshot) => {
        const data = snapshot.val() || {};
        publicPanicsReports = Object.entries(data).map(([rId, rVal]) => ({
            id: rId,
            source: "public",
            userName: rVal.senderName || rVal.name || rVal.user_name || "Warga Publik",
            location: rVal.address || rVal.lokasi || (rVal.latitude && rVal.longitude ? `${rVal.latitude}, ${rVal.longitude}` : "Area Publik"),
            time: rVal.created_at || rVal.timestamp || Date.now(),
            status: rVal.status === "active" ? "Menunggu" : (rVal.status || "Menunggu"),
            note: rVal.description || rVal.note || "-"
        }));
        updateStats();
    }, (err) => {
        console.error("DB2 public_panics error:", err);
    });

    onValue(publicReportsRef, (snapshot) => {
        const data = snapshot.val() || {};
        publicReports = Object.entries(data).map(([rId, rVal]) => ({
            id: rId,
            source: "public",
            userName: rVal.user_name || rVal.name || "Pengguna Publik",
            location: rVal.location || rVal.address || "Area Publik",
            time: rVal.timestamp || rVal.created_at || Date.now(),
            status: rVal.status || "Menunggu",
            note: rVal.description || rVal.note || "-"
        }));
        updateStats();
    }, (err) => {
        console.error("DB2 reports error:", err);
    });

    onValue(publicPanicRef, (snapshot) => {
        const data = snapshot.val() || {};
        const publicAlarms = [];

        Object.entries(data).forEach(([zoneKey, zoneVal]) => {
            if (!zoneVal || typeof zoneVal !== "object") return;

            if (zoneVal.name || zoneVal.channel_name || zoneVal.device_name) {
                const isEmergency = zoneVal.active === true || zoneVal.status === "ACTIVE" || zoneVal.alarm === true;
                publicAlarms.push({
                    key: zoneKey,
                    deviceName: zoneVal.name || zoneVal.channel_name || zoneKey,
                    zone: zoneVal.zone || zoneVal.location || zoneKey,
                    isEmergency: isEmergency
                });
            } else {
                Object.entries(zoneVal).forEach(([dKey, dVal]) => {
                    if (!dVal || typeof dVal !== "object") return;
                    const isEmergency = dVal.active === true || dVal.status === "ACTIVE" || dVal.alarm === true;
                    publicAlarms.push({
                        key: `${zoneKey}_${dKey}`,
                        deviceName: dVal.name || dVal.device_name || dKey,
                        zone: dVal.zone || zoneKey,
                        isEmergency: isEmergency
                    });
                });
            }
        });

        renderPublicGrid(publicAlarms);
    }, (err) => {
        console.error("DB2 panicChannels error:", err);
    });

    function renderPublicGrid(alarms) {
        if (!publicPanicGrid) return;
        const activeAlarms = alarms.filter(a => a.isEmergency);

        if (publicAlertBadge && publicAlertBadgeText) {
            if (activeAlarms.length > 0) {
                publicAlertBadge.className = "card-header-badge active-alarm";
                publicAlertBadgeText.innerHTML = `<span class="pulse-dot-red"></span> ${activeAlarms.length} Alarm Aktif!`;
            } else {
                publicAlertBadge.className = "card-header-badge";
                publicAlertBadgeText.innerHTML = `<span class="pulse-dot"></span> Semua Normal`;
            }
        }

        if (alarms.length === 0) {
            publicPanicGrid.innerHTML = `
                <div class="panic-empty-state">
                    <div class="empty-state-icon-circle public-idle">
                        <i class="fa-solid fa-satellite-dish"></i>
                    </div>
                    <h3>Tidak Ada Alarm Publik Aktif</h3>
                    <p>Perangkat IoT panic publik berada dalam kondisi standby dan terpantau aktif.</p>
                </div>
            `;
            return;
        }

        alarms.sort((a, b) => (b.isEmergency ? 1 : 0) - (a.isEmergency ? 1 : 0));

        publicPanicGrid.innerHTML = alarms.map(alarm => `
            <div class="panic-item-card ${alarm.isEmergency ? 'is-emergency' : ''}">
                <div class="panic-item-header">
                    <span class="panic-item-name"><i class="fa-solid fa-microchip" style="color: #0284c7;"></i> ${escapeHtml(alarm.deviceName)}</span>
                    <span class="panic-status-tag ${alarm.isEmergency ? 'alarm' : 'standby'}">
                        ${alarm.isEmergency ? '<span class="pulse-dot-red"></span> SIAGA AKTIF' : '<span class="pulse-dot"></span> STANDBY'}
                    </span>
                </div>
                <div class="panic-item-details">
                    <div class="panic-detail-row">
                        <i class="fa-solid fa-location-dot" style="color: var(--dash-profile);"></i>
                        <span>Zona Wilayah: <strong>${escapeHtml(alarm.zone)}</strong></span>
                    </div>
                </div>
                <div class="panic-item-actions">
                    <button type="button" class="btn-respond-alarm" onclick="handlePetugasResponse('public', '${alarm.key}', '${escapeHtml(alarm.deviceName)}')">
                        <i class="fa-solid fa-shield-halved"></i>
                        <span>Tanggapi Sekarang</span>
                    </button>
                </div>
            </div>
        `).join("");
    }

    // Global Handler Response Modal
    window.handlePetugasResponse = function (source, key, name) {
        if (!petugasActionModal || !modalPetugasBody) return;
        modalPetugasBody.innerHTML = `
            <div class="modal-info-box">
                <div class="modal-info-row">
                    <span class="modal-info-label"><i class="fa-solid fa-tag"></i> Sumber Laporan</span>
                    <span class="modal-info-value">
                        <span class="stat-badge ${source === 'perumahan' ? 'stat-badge-total' : 'stat-badge-active'}">
                            ${source === 'perumahan' ? 'Klaster Perumahan' : 'Area Publik'}
                        </span>
                    </span>
                </div>
                <div class="modal-info-row">
                    <span class="modal-info-label"><i class="fa-solid fa-location-dot"></i> Lokasi / Perangkat</span>
                    <span class="modal-info-value">${escapeHtml(name)}</span>
                </div>
                <div class="modal-info-row">
                    <span class="modal-info-label"><i class="fa-solid fa-shield-halved"></i> Status Siaga</span>
                    <span class="modal-info-value" style="color: var(--dash-emergency);">Siaga Tanggap Darurat</span>
                </div>
            </div>

            <p style="margin: 4px 0 0; font-size: 13.5px; color: var(--dash-text-muted); line-height: 1.5;">
                Petugas diimbau untuk segera menuju ke titik lokasi insiden dan mengoordinasikan penanganan melalui menu <strong>Riwayat Laporan</strong>.
            </p>

            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <a href="/petugas/riwayat-laporan" class="btn-hero-emergency" style="text-decoration: none; width: 100%; justify-content: center;">
                    <i class="fa-solid fa-clipboard-list"></i>
                    <span>Buka Riwayat Laporan</span>
                </a>
            </div>
        `;
        petugasActionModal.style.display = "flex";
    };

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
