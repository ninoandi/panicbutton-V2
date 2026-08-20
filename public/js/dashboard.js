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
    document.getElementById("adminPublicPanicAlert");


/*
|--------------------------------------------------------------------------
| Firebase References
|--------------------------------------------------------------------------
*/

const perumahanRef =
    ref(db1, "perumahan");

const panicChannelsRef =
    ref(db2, "panicChannels");

const publicPanicsRef =
    ref(db2, "public_panics");


/*
|--------------------------------------------------------------------------
| In-Memory State for Public Panics & Notifications
|--------------------------------------------------------------------------
*/

let currentChannelsData = {};
let currentPublicPanicsData = {};
const notifiedPanicIds = new Set();


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
            statusCard.classList.remove("darurat", "penting", "biasa", "standby");
            if (priority === "darurat") {
                statusCard.classList.add("darurat");
            } else if (priority === "penting") {
                statusCard.classList.add("penting");
            } else {
                statusCard.classList.add("biasa");
            }
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
            statusCard.classList.remove("darurat", "penting", "biasa");
            statusCard.classList.add("standby");
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
| FIREBASE LISTENERS - PANIC PUBLIK (IoT ZONA & PUBLIC PANICS)
|--------------------------------------------------------------------------
*/

// 1. Listener Channel Perangkat IoT
onValue(
    panicChannelsRef,
    (snapshot) => {
        try {
            currentChannelsData = snapshot.val() || {};
            processPublicPanicData();
        } catch (error) {
            console.error("Error membaca panicChannels:", error);
        }
    },
    (error) => {
        console.error("Firebase panicChannels error:", error);
    }
);

// 2. Listener Detail Laporan Akun Pengirim Panic Publik
onValue(
    publicPanicsRef,
    (snapshot) => {
        try {
            currentPublicPanicsData = snapshot.val() || {};
            processPublicPanicData();
        } catch (error) {
            console.error("Error membaca public_panics:", error);
        }
    },
    (error) => {
        console.error("Firebase public_panics error:", error);
    }
);


/*
|--------------------------------------------------------------------------
| PROSES & GABUNGKAN DATA PANIC PUBLIK DENGAN AKUN PENGIRIM
|--------------------------------------------------------------------------
*/

function processPublicPanicData() {
    const activePanics = [];
    const pairedReportIds = new Set();
    const now = Date.now();
    const maxActiveAge = 24 * 60 * 60 * 1000; // 24 jam terakhir

    // A. Periksa perangkat yang aktif di panicChannels
    Object.entries(currentChannelsData).forEach(([zoneName, zoneData]) => {
        if (!zoneData || typeof zoneData !== "object") return;

        Object.entries(zoneData).forEach(([deviceKey, deviceData]) => {
            if (!deviceData || typeof deviceData !== "object") return;

            if (deviceData.active === true) {
                const assignedPanicId = deviceData.assigned_panic_id || "";
                let report = null;

                if (assignedPanicId && currentPublicPanicsData[assignedPanicId]) {
                    report = currentPublicPanicsData[assignedPanicId];
                    pairedReportIds.add(assignedPanicId);
                } else {
                    // Coba cari laporan publik aktif yang cocok dengan perangkat/zona
                    const matchingEntry = Object.entries(currentPublicPanicsData).find(([repId, repData]) => {
                        if (!repData || repData.status !== "active") return false;
                        if (pairedReportIds.has(repId)) return false;
                        return (repData.assigned_device === deviceData.device || repData.assigned_zone === zoneName);
                    });

                    if (matchingEntry) {
                        report = matchingEntry[1];
                        pairedReportIds.add(matchingEntry[0]);
                    }
                }

                // Tentukan nama pengirim & info akun
                let senderName = "Pengguna Publik";
                let username = "-";
                let phone = "-";
                let email = "-";
                let isGuest = false;
                let isHardware = false;

                if (report) {
                    senderName = report.name || report.username || "Pengguna Publik";
                    username = report.username ? `@${report.username.replace('@', '')}` : "-";
                    phone = report.phone || "-";
                    email = report.email || "-";
                    isGuest = Boolean(report.is_guest || (!report.user_id || report.user_id === "guest"));
                } else if (!assignedPanicId) {
                    senderName = "Tombol Fisik IoT / Hardware";
                    isHardware = true;
                }

                const latitude = report?.latitude || deviceData.panic_latitude || null;
                const longitude = report?.longitude || deviceData.panic_longitude || null;
                const address = report?.address || deviceData.lokasi || "-";
                const locationUrl = report?.location_url || (latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : null);
                const createdAt = report?.created_at || deviceData.last_update || now;

                activePanics.push({
                    id: assignedPanicId || `${zoneName}_${deviceKey}`,
                    device: deviceData.device || deviceKey,
                    zona: deviceData.zona || zoneName,
                    lokasi: deviceData.lokasi || "-",
                    active: true,
                    last_update: deviceData.last_update || createdAt,
                    createdAt: createdAt,
                    senderName: senderName,
                    username: username,
                    phone: phone,
                    email: email,
                    isGuest: isGuest,
                    isHardware: isHardware,
                    address: address,
                    latitude: latitude,
                    longitude: longitude,
                    locationUrl: locationUrl
                });
            }
        });
    });

    // B. Periksa jika ada laporan public_panics dengan status 'active' yang belum terdaftar di atas
    Object.entries(currentPublicPanicsData).forEach(([repId, report]) => {
        if (!report || typeof report !== "object") return;
        if (report.status === "active" && !pairedReportIds.has(repId)) {
            const isRecent = !report.created_at || (report.created_at >= (now - maxActiveAge));
            if (isRecent) {
                const senderName = report.name || report.username || "Pengguna Publik";
                const username = report.username ? `@${report.username.replace('@', '')}` : "-";
                const isGuest = Boolean(report.is_guest || (!report.user_id || report.user_id === "guest"));
                const locationUrl = report.location_url || (report.latitude && report.longitude ? `https://www.google.com/maps?q=${report.latitude},${report.longitude}` : null);

                activePanics.push({
                    id: repId,
                    device: report.assigned_device || "Device Publik",
                    zona: report.assigned_zone || "Zona Umum",
                    lokasi: report.assigned_location || report.address || "-",
                    active: true,
                    last_update: report.created_at || now,
                    createdAt: report.created_at || now,
                    senderName: senderName,
                    username: username,
                    phone: report.phone || "-",
                    email: report.email || "-",
                    isGuest: isGuest,
                    isHardware: false,
                    address: report.address || "-",
                    latitude: report.latitude || null,
                    longitude: report.longitude || null,
                    locationUrl: locationUrl
                });
            }
        }
    });

    // Urutkan dari update / waktu kejadian terbaru
    activePanics.sort((a, b) => (b.createdAt || b.last_update || 0) - (a.createdAt || a.last_update || 0));

    // Render ke tampilan dashboard
    renderPublicPanic(activePanics);

    // C. Pemicu Notifikasi Mengambang di Pojok Kanan Atas (2-3 detik)
    handlePanicNotificationAlert(activePanics);
}


/*
|--------------------------------------------------------------------------
| RENDER PANIC PUBLIK DENGAN INFORMASI AKUN PENGIRIM
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
            publicPanicCountBadge.textContent = `${activePanics.length} Sinyal Aktif`;
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
            ${activePanics.map(panic => {
        const initial = (panic.senderName && panic.senderName.length > 0)
            ? panic.senderName.charAt(0).toUpperCase()
            : "P";

        let accountBadgeHtml = "";
        if (panic.isHardware) {
            accountBadgeHtml = `<span class="public-panic-account-pill hardware"><i class="fa-solid fa-microchip"></i> Hardware IoT</span>`;
        } else if (panic.isGuest) {
            accountBadgeHtml = `<span class="public-panic-account-pill guest"><i class="fa-solid fa-user-clock"></i> Tamu (Guest)</span>`;
        } else {
            accountBadgeHtml = `<span class="public-panic-account-pill"><i class="fa-solid fa-circle-check"></i> Warga Terdaftar</span>`;
        }

        let mapsButtonHtml = "";
        if (panic.locationUrl) {
            mapsButtonHtml = `
                        <a
                            href="${panic.locationUrl}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="btn-location-map"
                        >
                            <i class="fa-solid fa-map-location-dot"></i>
                            <span>Buka Google Maps</span>
                        </a>
                    `;
        } else if (panic.latitude && panic.longitude) {
            mapsButtonHtml = `
                        <a
                            href="https://www.google.com/maps?q=${panic.latitude},${panic.longitude}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="btn-location-map"
                        >
                            <i class="fa-solid fa-map-location-dot"></i>
                            <span>Buka Google Maps</span>
                        </a>
                    `;
        } else {
            mapsButtonHtml = `<span style="font-size:12.5px; color:var(--dash-text-muted);"><i class="fa-solid fa-location-crosshairs"></i> Koordinat tidak tersedia</span>`;
        }

        const formattedTime = formatPublicPanicTime(panic.createdAt || panic.last_update);

        return `
                    <div class="public-panic-card">
                        <div class="public-panic-card-header">
                            <div class="public-panic-user-badge">
                                <div class="public-panic-user-avatar">
                                    ${escapeHtml(initial)}
                                </div>
                                <div class="public-panic-user-info">
                                    <div class="public-panic-user-name">
                                        <span>${escapeHtml(panic.senderName)}</span>
                                        ${accountBadgeHtml}
                                    </div>
                                    <div class="public-panic-user-sub">
                                        <span><i class="fa-regular fa-user"></i> ${escapeHtml(panic.username)}</span>
                                        <span>•</span>
                                        <span><i class="fa-solid fa-phone"></i> ${escapeHtml(panic.phone)}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="public-panic-badges">
                                <span class="public-panic-device">
                                    <span class="pulse-dot-red"></span>
                                    ${escapeHtml(panic.device)}
                                </span>
                                <span class="status-badge status-darurat" style="font-size:11px; padding:4px 10px;">
                                    SIAGA AKTIF
                                </span>
                            </div>
                        </div>

                        <div class="public-panic-info-grid">
                            <div class="public-panic-info-cell">
                                <span class="public-panic-info-label">Nama Pengirim</span>
                                <strong class="public-panic-info-value" style="color:var(--dash-emergency);">
                                    ${escapeHtml(panic.senderName)}
                                </strong>
                            </div>
                            <div class="public-panic-info-cell">
                                <span class="public-panic-info-label">Kontak / Email</span>
                                <span class="public-panic-info-value">
                                    ${escapeHtml(panic.email !== "-" ? panic.email : panic.phone)}
                                </span>
                            </div>
                            <div class="public-panic-info-cell">
                                <span class="public-panic-info-label">Perangkat & Zona</span>
                                <span class="public-panic-info-value">
                                    ${escapeHtml(panic.device)} (${escapeHtml(panic.zona)})
                                </span>
                            </div>
                            <div class="public-panic-info-cell">
                                <span class="public-panic-info-label">Waktu Pengaktifan</span>
                                <span class="public-panic-info-value">
                                    ${escapeHtml(formattedTime)}
                                </span>
                            </div>
                        </div>

                        <div class="public-panic-address-box">
                            <strong>Lokasi / Titik Kejadian:</strong>
                            <p>
                                <i class="fa-solid fa-location-dot" style="color:var(--dash-emergency); margin-right:4px;"></i>
                                ${escapeHtml(panic.address && panic.address !== "-" ? panic.address : panic.lokasi)}
                            </p>
                        </div>

                        <div class="public-panic-actions-bar">
                            ${mapsButtonHtml}
                        </div>
                    </div>
                `;
    }).join("")}
        </div>
    `;
}


/*
|--------------------------------------------------------------------------
| NOTIFIKASI MENGAMBANG DI POJOK KANAN ATAS (TOAST 10 DETIK)
|--------------------------------------------------------------------------
*/

function handlePanicNotificationAlert(activePanics) {
    if (!activePanics || activePanics.length === 0) {
        // Bersihkan cache saat tidak ada panic aktif
        notifiedPanicIds.clear();
        return;
    }

    // Urutkan dari terlama ke terbaru agar saat di-prepend, panic terbaru berada paling atas
    const unnotifiedPanics = [];
    activePanics.forEach((panic) => {
        const uniqueKey = `${panic.id}_${panic.createdAt || panic.last_update}`;
        if (!notifiedPanicIds.has(uniqueKey)) {
            notifiedPanicIds.add(uniqueKey);
            unnotifiedPanics.push(panic);
        }
    });

    // Balik urutan sebelum prepend agar panic terbaru berakhir di paling atas
    unnotifiedPanics.reverse().forEach((panic) => {
        showTopPanicToast(panic);
    });
}

function showTopPanicToast(panic) {
    const container = document.getElementById("topToastContainer") || createToastContainer();

    const toast = document.createElement("div");
    toast.className = "emergency-toast";
    toast.setAttribute("role", "alert");

    const formattedTime = formatPublicPanicTime(panic.createdAt || panic.last_update);
    const locationText = panic.address && panic.address !== "-" ? panic.address : panic.lokasi;

    toast.innerHTML = `
        <div class="emergency-toast-header">
            <div class="emergency-toast-title">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>Sinyal Panic Button Aktif!</span>
            </div>
            <button type="button" class="emergency-toast-close" title="Tutup Notifikasi" aria-label="Close">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div class="emergency-toast-body">
            Panic button diaktifkan oleh <strong>${escapeHtml(panic.senderName)}</strong> pada <strong>${escapeHtml(panic.device)}</strong> (${escapeHtml(panic.zona)}).
        </div>
        <div class="emergency-toast-meta">
            <span><i class="fa-solid fa-location-dot" style="color:var(--dash-emergency);"></i> ${escapeHtml(locationText || "Zona Siaga")}</span>
            <span><i class="fa-regular fa-clock"></i> ${formattedTime}</span>
        </div>
        <div class="emergency-toast-progress"></div>
    `;

    // Sisipkan di posisi paling atas sehingga notifikasi lama bergeser ke bawah
    container.prepend(toast);

    // Mainkan nada audio alert lembut
    playEmergencyBeep();

    // Auto dismiss dalam durasi 10 detik
    const dismissTimer = setTimeout(() => {
        dismissToast(toast);
    }, 10000);

    const closeBtn = toast.querySelector(".emergency-toast-close");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            clearTimeout(dismissTimer);
            dismissToast(toast);
        });
    }
}

function dismissToast(toast) {
    if (!toast || toast.classList.contains("hide")) return;
    toast.classList.add("hide");
    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 320);
}

function createToastContainer() {
    let container = document.getElementById("topToastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "topToastContainer";
        container.className = "top-toast-container";
        document.body.appendChild(container);
    }
    return container;
}

function playEmergencyBeep() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === "suspended") {
            ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
    } catch (e) {
        // Abaikan jika browser memblokir audio sebelum interaksi
    }
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