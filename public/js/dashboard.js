import {
    db1,
    db2
} from "./firebase-config.js";

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


/*
|--------------------------------------------------------------------------
| DOM Elements
|--------------------------------------------------------------------------
*/

const totalPerumahan =
    document.getElementById("totalPerumahan");

const totalUsers =
    document.getElementById("totalUsers");

const statusCard =
    document.getElementById("statusCard");

const statusText =
    document.getElementById("statusText");

const statusBadge =
    document.getElementById("statusBadge");

const statusBadgeText =
    document.getElementById("statusBadgeText");

const statusPulseDot =
    document.getElementById("statusPulseDot");

const statusSubText =
    document.getElementById("statusSubText");

const activeStatusBadge =
    document.getElementById("activeStatusBadge");

const liveAlertBox =
    document.getElementById("liveAlert");

const publicPanicCountBadge =
    document.getElementById("publicPanicCountBadge");

const publicPanicAlert =
    document.getElementById("publicPanicAlert");


/*
|--------------------------------------------------------------------------
| Firebase References
|--------------------------------------------------------------------------
*/

const perumahanRef =
    ref(db1, "perumahan");

const panicPublicRef =
    ref(db2, "panicChannels");


/*
|--------------------------------------------------------------------------
| Firebase Listener - Perumahan & Status Buzzer
|--------------------------------------------------------------------------
*/

onValue(
    perumahanRef,
    (snapshot) => {
        try {
            const perumahanData =
                snapshot.val() || {};

            let totalUserCount = 0;
            let latestMonitor = null;
            let latestKey = "";
            let latestPerumahan = null;

            /*
            |--------------------------------------------------------------------------
            | Loop Perumahan & Hitung User
            |--------------------------------------------------------------------------
            */
            for (const id in perumahanData) {
                const p = perumahanData[id] || {};

                // Monitor
                const monitor = p.monitor || {};
                for (const key in monitor) {
                    const entry = monitor[key];
                    if (key > latestKey) {
                        latestKey = key;
                        latestMonitor = entry;
                        latestPerumahan = p;
                    }
                }

                // Users count
                const users = p.users || {};
                totalUserCount += Object.keys(users).length;
            }

            /*
            |--------------------------------------------------------------------------
            | Update Total Counters
            |--------------------------------------------------------------------------
            */
            if (totalPerumahan) {
                totalPerumahan.textContent =
                    Object.keys(perumahanData).length.toLocaleString("id-ID");
            }

            if (totalUsers) {
                totalUsers.textContent =
                    totalUserCount.toLocaleString("id-ID");
            }

            /*
            |--------------------------------------------------------------------------
            | Status Buzzer & Tombol Darurat
            |--------------------------------------------------------------------------
            */
            const mainState = (
                latestPerumahan?.buzzers?.main?.state || "off"
            ).toLowerCase();

            const priority = (
                latestMonitor?.priority || "off"
            ).toLowerCase();

            updateStatusBuzzer(mainState, priority);

            /*
            |--------------------------------------------------------------------------
            | Render Live Alert Perumahan
            |--------------------------------------------------------------------------
            */
            renderLiveAlert(latestMonitor, latestPerumahan, mainState, priority);

        } catch (error) {
            console.error("Error memproses data Firebase Perumahan:", error);
        }
    },
    (error) => {
        console.error("Firebase Perumahan listener error:", error);
    }
);


/*
|--------------------------------------------------------------------------
| UPDATE STATUS BUZZER UI
|--------------------------------------------------------------------------
*/

function updateStatusBuzzer(mainState, priority) {
    if (!statusText) return;

    if (mainState === "on") {
        statusText.textContent = "ON";

        if (statusCard) {
            statusCard.style.borderColor = "var(--dash-emergency)";
        }

        if (priority === "darurat") {
            if (statusBadge) statusBadge.className = "stat-badge-buzzer darurat";
            if (statusBadgeText) statusBadgeText.textContent = "Darurat";
            if (statusSubText) statusSubText.textContent = "Sirine darurat sedang aktif!";
            if (activeStatusBadge) {
                activeStatusBadge.className = "status-badge status-darurat";
                activeStatusBadge.textContent = "Darurat";
            }
        } else if (priority === "penting") {
            if (statusBadge) statusBadge.className = "stat-badge-buzzer penting";
            if (statusBadgeText) statusBadgeText.textContent = "Penting";
            if (statusSubText) statusSubText.textContent = "Peringatan prioritas tinggi";
            if (activeStatusBadge) {
                activeStatusBadge.className = "status-badge status-penting";
                activeStatusBadge.textContent = "Penting";
            }
        } else {
            if (statusBadge) statusBadge.className = "stat-badge-buzzer biasa";
            if (statusBadgeText) statusBadgeText.textContent = "Biasa";
            if (statusSubText) statusSubText.textContent = "Peringatan prioritas normal";
            if (activeStatusBadge) {
                activeStatusBadge.className = "status-badge status-biasa";
                activeStatusBadge.textContent = "Biasa";
            }
        }
    } else {
        statusText.textContent = "OFF";

        if (statusCard) {
            statusCard.style.borderColor = "";
        }

        if (statusBadge) statusBadge.className = "stat-badge-buzzer";
        if (statusBadgeText) statusBadgeText.textContent = "Standby";
        if (statusSubText) statusSubText.textContent = "Sistem sirine dalam mode normal";
        if (activeStatusBadge) {
            activeStatusBadge.className = "status-badge status-none";
            activeStatusBadge.textContent = "Tidak Ada";
        }
    }
}


/*
|--------------------------------------------------------------------------
| RENDER LIVE ALERT PERUMAHAN
|--------------------------------------------------------------------------
*/

function renderLiveAlert(latestMonitor, latestPerumahan, mainState, priority) {
    if (!liveAlertBox) return;

    if (latestMonitor && latestPerumahan && mainState === "on") {
        const {
            latitude,
            longitude,
            message = "-",
            houseNumber = "Tidak Diketahui",
            time = "-",
            name = "Tidak Diketahui"
        } = latestMonitor;

        const {
            info: {
                nama: perumahanNama = "Tidak Diketahui",
                lokasi: perumahanLokasi = "Tidak Diketahui"
            } = {}
        } = latestPerumahan;

        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);

        let mapsLink = '<span style="color:var(--dash-text-muted);">Tidak tersedia</span>';
        if (!isNaN(lat) && !isNaN(lon)) {
            mapsLink = `
                <a
                    href="https://www.google.com/maps?q=${lat},${lon}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-location-map"
                >
                    <i class="fa-solid fa-map-location-dot"></i>
                    <span>Buka Google Maps</span>
                </a>
            `;
        }

        let priorityClass = "priority-biasa";
        let priorityLabel = "Biasa";
        if (priority === "darurat") {
            priorityClass = "priority-darurat";
            priorityLabel = "Darurat";
        } else if (priority === "penting") {
            priorityClass = "priority-penting";
            priorityLabel = "Penting";
        }

        // Format waktu
        let formattedTime = time;
        const timeParts = time.split(" waktu ");
        if (timeParts.length === 2) {
            const [dateStr, timeStr] = timeParts;
            const [year, month, day] = dateStr.split("-");
            formattedTime = `${day}-${month}-${year} pukul ${timeStr}`;
        }

        const initial = (name && name.length > 0) ? name.charAt(0).toUpperCase() : "W";

        liveAlertBox.innerHTML = `
            <div class="active-alert-wrapper ${priorityClass}">
                <div class="active-alert-header">
                    <div class="alert-user-badge">
                        <div class="alert-user-avatar">
                            ${escapeHtml(initial)}
                        </div>
                        <div class="alert-user-info">
                            <strong>${escapeHtml(name)}</strong>
                            <span>Rumah: <strong>${escapeHtml(houseNumber)}</strong></span>
                        </div>
                    </div>
                    <span class="status-badge status-${priorityClass.replace('priority-', '')}">
                        Prioritas: ${priorityLabel}
                    </span>
                </div>

                <div class="alert-info-grid">
                    <div class="alert-info-cell">
                        <span class="alert-info-label">Perumahan</span>
                        <span class="alert-info-value">${escapeHtml(perumahanNama)}</span>
                    </div>
                    <div class="alert-info-cell">
                        <span class="alert-info-label">Lokasi Cluster</span>
                        <span class="alert-info-value">${escapeHtml(perumahanLokasi)}</span>
                    </div>
                    <div class="alert-info-cell">
                        <span class="alert-info-label">Waktu Kejadian</span>
                        <span class="alert-info-value">${escapeHtml(formattedTime)}</span>
                    </div>
                    <div class="alert-info-cell">
                        <span class="alert-info-label">Status Sinyal</span>
                        <span class="alert-info-value" style="color:var(--dash-emergency);">SIAGA AKTIF</span>
                    </div>
                </div>

                <div class="alert-message-box">
                    <strong>Pesan Darurat:</strong>
                    <p>${escapeHtml(message)}</p>
                </div>

                <div class="alert-actions-bar">
                    ${mapsLink}
                </div>
            </div>
        `;
    } else {
        liveAlertBox.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fa-solid fa-shield-heart"></i>
                </div>
                <h3>Tidak Ada Peringatan Darurat</h3>
                <p>Seluruh area perumahan dalam kondisi aman dan siaga.</p>
            </div>
        `;
    }
}


/*
|--------------------------------------------------------------------------
| FIREBASE LISTENER - PANIC PUBLIK (IoT ZONA)
|--------------------------------------------------------------------------
*/

onValue(
    panicPublicRef,
    (snapshot) => {
        try {
            const panicData = snapshot.val() || {};
            const activePanics = [];

            // Loop Zona
            Object.entries(panicData).forEach(([zoneName, zoneData]) => {
                if (!zoneData || typeof zoneData !== "object") return;

                // Loop Device
                Object.entries(zoneData).forEach(([deviceKey, deviceData]) => {
                    if (!deviceData || typeof deviceData !== "object") return;

                    if (deviceData.active === true) {
                        activePanics.push({
                            device: deviceData.device || deviceKey,
                            zona: deviceData.zona || zoneName,
                            lokasi: deviceData.lokasi || "-",
                            active: true,
                            last_update: deviceData.last_update || null
                        });
                    }
                });
            });

            // Urutkan update terbaru
            activePanics.sort(
                (a, b) => (b.last_update || 0) - (a.last_update || 0)
            );

            renderPublicPanic(activePanics);

        } catch (error) {
            console.error("Error membaca panic publik:", error);
        }
    },
    (error) => {
        console.error("Firebase Panic Publik Error:", error);
    }
);


/*
|--------------------------------------------------------------------------
| RENDER PANIC PUBLIK
|--------------------------------------------------------------------------
*/

function renderPublicPanic(activePanics) {
    if (!publicPanicAlert) return;

    if (publicPanicCountBadge) {
        if (activePanics.length === 0) {
            publicPanicCountBadge.className = "status-badge status-none";
            publicPanicCountBadge.textContent = "0 Perangkat";
        } else {
            publicPanicCountBadge.className = "status-badge status-darurat";
            publicPanicCountBadge.textContent = `${activePanics.length} Perangkat Aktif`;
        }
    }

    if (activePanics.length === 0) {
        publicPanicAlert.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon public-idle">
                    <i class="fa-solid fa-satellite-dish"></i>
                </div>
                <h3>Tidak Ada Alarm Publik Aktif</h3>
                <p>Perangkat IoT panic publik berada dalam kondisi standby dan terpantau aktif.</p>
            </div>
        `;
        return;
    }

    publicPanicAlert.innerHTML = `
        <div class="public-panic-grid">
            ${activePanics.map(panic => `
                <div class="public-panic-card">
                    <div class="public-panic-card-header">
                        <span class="public-panic-device">
                            <span class="pulse-dot-red"></span>
                            ${escapeHtml(panic.device)}
                        </span>
                        <span class="status-badge status-darurat" style="font-size:10px; padding:3px 8px;">
                            AKTIF
                        </span>
                    </div>
                    <div class="public-panic-details">
                        <div><strong>Zona:</strong> ${escapeHtml(panic.zona)}</div>
                        <div><strong>Lokasi:</strong> ${escapeHtml(panic.lokasi)}</div>
                        <div><strong>Waktu:</strong> ${formatPublicPanicTime(panic.last_update)}</div>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}


/*
|--------------------------------------------------------------------------
| FORMAT WAKTU PANIC PUBLIK
|--------------------------------------------------------------------------
*/

function formatPublicPanicTime(timestamp) {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}


/*
|--------------------------------------------------------------------------
| Escape HTML
|--------------------------------------------------------------------------
*/

function escapeHtml(str = "") {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

console.log("Dashboard Admin initialized smoothly.");