import {
    db1,
    db2
} from "./firebase-config.js";

import {
    ref,
    onValue,
    get
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


/*
|--------------------------------------------------------------------------
| DOM ELEMENTS
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
| FIREBASE REFERENCES
|--------------------------------------------------------------------------
*/

const perumahanRef =
    ref(
        db1,
        "perumahan"
    );


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
| STATE
|--------------------------------------------------------------------------
*/

let db1Version = 0;

let latestPerumahanData = {};

let latestPublicPanicsData = {};

const monitorCache =
    new Map();


/*
|--------------------------------------------------------------------------
| USER LOGIN
|--------------------------------------------------------------------------
*/

const currentUser =
    window.currentUser || {};

const currentUserId =
    currentUser.userId ||
    currentUser.id ||
    null;

const currentPerumahanId =
    currentUser.perumahanId ||
    null;


console.log(
    "===================================="
);

console.log(
    "USER LOGIN DASHBOARD"
);

console.log(
    "User ID:",
    currentUserId
);

console.log(
    "Perumahan ID:",
    currentPerumahanId
);

console.log(
    "Perumahan:",
    currentUser.perumahan
);

console.log(
    "===================================="
);


/*
|--------------------------------------------------------------------------
| PERFORMANCE
|--------------------------------------------------------------------------
*/

function logPerformance(
    label,
    startTime
) {

    const duration =
        performance.now() -
        startTime;


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




        if (statusCard) {
            statusCard.classList.remove("darurat", "penting", "biasa");
            statusCard.classList.add("standby");
            statusCard.style.borderColor = "";
        }


function escapeHtml(
    str = ""
) {

    return String(str)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/*
|--------------------------------------------------------------------------
| FORMAT PUBLIC PANIC TIME
|--------------------------------------------------------------------------
*/

function formatPublicPanicTime(
    timestamp
) {

    if (
        timestamp === null ||
        timestamp === undefined ||
        timestamp === ""
    ) {

        return "-";

    }


    const numericTimestamp =
        Number(timestamp);


    if (
        Number.isFinite(
            numericTimestamp
        )
    ) {

        const date =
            new Date(
                numericTimestamp
            );


        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            return date.toLocaleString(
                "id-ID",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );

        }

    }


    return String(timestamp);
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


    /*
    |--------------------------------------------------------------------------
    | PRIORITAS 3
    | FORMAT DATABASE
    |
    | 2025-10-17 waktu 10:35
    |--------------------------------------------------------------------------
    */

    if (
        typeof monitor.time === "string"
    ) {

        const match =
            monitor.time.match(
                /^(\d{4}-\d{2}-\d{2}) waktu (\d{2}:\d{2}(?::\d{2})?)$/
            );


        if (
            match
        ) {

            const date =
                new Date(
                    `${match[1]}T${match[2]}`
                );


            if (
                !Number.isNaN(
                    date.getTime()
                )
            ) {

                return date.getTime();

            }

        }

    }


    /*
    |--------------------------------------------------------------------------
    | FALLBACK
    |--------------------------------------------------------------------------
    */

    return 0;
}


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

function formatMonitorTime(
    time
) {

    if (
        time === null ||
        time === undefined ||
        time === ""
    ) {

        return "-";

    }


    /*
    |--------------------------------------------------------------------------
    | TIMESTAMP ANGKA
    |--------------------------------------------------------------------------
    */

    const numericTime =
        Number(time);


    if (
        Number.isFinite(
            numericTime
        )
    ) {

        const date =
            new Date(
                numericTime
            );


        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            return date.toLocaleString(
                "id-ID",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );


    if (publicPanicCountBadge) {
        if (activePanics.length === 0) {
            publicPanicCountBadge.className = "status-badge status-none";
            publicPanicCountBadge.textContent = "0 Perangkat";
        } else {
            publicPanicCountBadge.className = "status-badge status-darurat";
            publicPanicCountBadge.textContent = `${activePanics.length} Sinyal Aktif`;

        }

    }


    /*
    |--------------------------------------------------------------------------
    | FORMAT:
    |
    | 2025-10-17 waktu 10:35
    |--------------------------------------------------------------------------
    */

    if (
        typeof time === "string"
    ) {

        const match =
            time.match(
                /^(\d{4})-(\d{2})-(\d{2}) waktu (.+)$/
            );


        if (
            match
        ) {

            const year =
                match[1];

            const month =
                match[2];

            const day =
                match[3];

            const clock =
                match[4];


            return `${day}-${month}-${year} pukul ${clock}`;

        }

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
| HITUNG TOTAL USER UNIK DB1 + DB2
|--------------------------------------------------------------------------
*/

function getTotalUniqueUsers(
    perumahanData,
    publicPanicData
) {

    const uniqueUsers =
        new Set();


    /*
    |--------------------------------------------------------------------------
    | DB1 USERS
    |--------------------------------------------------------------------------
    */

    Object.entries(
        perumahanData || {}
    ).forEach(
        ([
            perumahanId,
            perumahan
        ]) => {

            if (
                !perumahan ||
                typeof perumahan !== "object"
            ) {

                return;

            }


            const users =
                perumahan.users || {};


            Object.entries(
                users
            ).forEach(
                ([
                    userKey,
                    userData
                ]) => {

                    if (
                        !userData ||
                        typeof userData !== "object"
                    ) {

                        return;

                    }


                    /*
                    |--------------------------------------------------------------------------
                    | PRIORITAS IDENTITAS USER
                    |--------------------------------------------------------------------------
                    */

                    const userId =
                        userData.user_id ||
                        userData.id ||
                        userKey;


                    if (
                        !userId
                    ) {

                        return;

                    }


                    uniqueUsers.add(
                        String(
                            userId
                        )
                            .trim()
                            .toLowerCase()
                    );

                }
            );

        }
    );


    /*
    |--------------------------------------------------------------------------
    | DB2 PUBLIC PANICS
    |--------------------------------------------------------------------------
    */

    Object.entries(
        publicPanicData || {}
    ).forEach(
        ([
            panicKey,
            panic
        ]) => {

            if (
                !panic ||
                typeof panic !== "object"
            ) {

                return;

            }


            /*
            |--------------------------------------------------------------------------
            | JANGAN PAKAI panicKey SEBAGAI USER
            | KECUALI MEMANG TIDAK ADA IDENTITAS LAIN
            |--------------------------------------------------------------------------
            */

            const userId =
                panic.user_id ||
                panic.userId ||
                panic.username ||
                panic.email;


            if (
                !userId
            ) {

                return;

            }


            uniqueUsers.add(
                String(
                    userId
                )
                    .trim()
                    .toLowerCase()
            );

        }
    );


    return uniqueUsers.size;
}


/*
|--------------------------------------------------------------------------
| UPDATE TOTAL USERS
|--------------------------------------------------------------------------
*/

function updateTotalUsers() {

    const total =
        getTotalUniqueUsers(
            latestPerumahanData,
            latestPublicPanicsData
        );


    if (
        totalUsers
    ) {

        totalUsers.textContent =
            total.toLocaleString(
                "id-ID"
            );

    }


    console.log(
        "TOTAL USER UNIK DB1 + DB2:",
        total
    );
}


/*
|--------------------------------------------------------------------------
| GET LATEST MONITOR
|--------------------------------------------------------------------------
|
| Mengambil monitor paling baru dari:
|
| perumahan/{perumahanId}/monitor
|
|--------------------------------------------------------------------------
*/

async function getLatestMonitor(
    perumahanId,
    perumahan
) {

    try {

        const monitorRef =
            ref(
                db1,
                `perumahan/${perumahanId}/monitor`
            );


        const snapshot =
            await get(
                monitorRef
            );


        /*
        |--------------------------------------------------------------------------
        | MONITOR TIDAK ADA
        |--------------------------------------------------------------------------
        */

        if (
            !snapshot.exists()
        ) {

            console.warn(
                `Monitor tidak ditemukan: ${perumahanId}`
            );

            return null;

        }


        const monitorData =
            snapshot.val() || {};


        const entries =
            Object.entries(
                monitorData
            );


        if (
            entries.length === 0
        ) {

            return null;

        }


        /*
        |--------------------------------------------------------------------------
        | CARI MONITOR TERBARU
        |--------------------------------------------------------------------------
        */

        let latest =
            null;


        for (
            const [
                monitorKey,
                monitor
            ]
            of entries
        ) {

            if (
                !monitor ||
                typeof monitor !== "object"
            ) {

                continue;

            }


            const timestamp =
                getMonitorTimestamp(
                    monitor
                );


            /*
            |--------------------------------------------------------------------------
            | MONITOR PERTAMA
            |--------------------------------------------------------------------------
            */

            if (
                !latest
            ) {

                latest = {

                    perumahanId,

                    monitorKey,

                    monitor,

                    perumahan,

                    timestamp

                };

                continue;

            }


            /*
            |--------------------------------------------------------------------------
            | TIMESTAMP LEBIH BARU
            |--------------------------------------------------------------------------
            */

            if (
                timestamp >
                latest.timestamp
            ) {

                latest = {

                    perumahanId,

                    monitorKey,

                    monitor,

                    perumahan,

                    timestamp

                };

                continue;

            }


            /*
            |--------------------------------------------------------------------------
            | JIKA TIMESTAMP SAMA
            | GUNAKAN KEY FIREBASE
            |--------------------------------------------------------------------------
            */

            if (
                timestamp ===
                latest.timestamp &&
                monitorKey >
                latest.monitorKey
            ) {

                latest = {

                    perumahanId,

                    monitorKey,

                    monitor,

                    perumahan,

                    timestamp

                };

            }

        }


        /*
        |--------------------------------------------------------------------------
        | CACHE
        |--------------------------------------------------------------------------
        */

        if (
            latest
        ) {

            monitorCache.set(
                perumahanId,
                latest
            );

        }


        console.log(
            "LATEST MONITOR:",
            latest
        );


        return latest;

    }

    catch (
        error
    ) {

        console.error(
            `Gagal mengambil monitor ${perumahanId}:`,
            error
        );

        return null;

    }

}


/*
|--------------------------------------------------------------------------
| RENDER LIVE ALERT PERUMAHAN
|--------------------------------------------------------------------------
*/

function renderLiveAlert(
    latestMonitor,
    latestPerumahan,
    mainState,
    priority
) {

    if (
        !liveAlertBox
    ) {

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | NORMALISASI
    |--------------------------------------------------------------------------
    */

    mainState =
        String(
            mainState || "off"
        )
            .toLowerCase()
            .trim();


    priority =
        String(
            priority || "biasa"
        )
            .toLowerCase()
            .trim();


    /*
    |--------------------------------------------------------------------------
    | TIDAK ADA BUZZER AKTIF
    |--------------------------------------------------------------------------
    */

    if (
        mainState !== "on"
    ) {

        liveAlertBox.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">

                    <i class="fa-solid fa-shield-heart"></i>

                </div>

                <h3>
                    Tidak Ada Peringatan Darurat
                </h3>

                <p>
                    Seluruh area perumahan
                    dalam kondisi aman dan siaga.
                </p>

            </div>

        `;

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | BUZZER ON TAPI MONITOR TIDAK ADA
    |--------------------------------------------------------------------------
    */

    if (
        !latestMonitor
    ) {

        liveAlertBox.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                </div>

                <h3>
                    Buzzer Aktif
                </h3>

                <p>
                    Buzzer perumahan sedang ON,
                    tetapi data laporan panic
                    belum ditemukan.
                </p>

            </div>

        `;

        console.warn(
            "BUZZER ON tetapi monitor tidak ditemukan."
        );

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | DATA MONITOR
    |--------------------------------------------------------------------------
    */

    const monitor =
        latestMonitor.monitor ||
        latestMonitor;


    const latitude =
        monitor.latitude ??
        monitor.lat ??
        null;


    const longitude =
        monitor.longitude ??
        monitor.lng ??
        monitor.lon ??
        null;


    const message =
        monitor.message ||
        monitor.pesan ||
        monitor.description ||
        "-";


    const houseNumber =
        monitor.houseNumber ||
        monitor.house_number ||
        monitor.no_rumah ||
        monitor.rumah ||
        "Tidak Diketahui";


    const time =
        monitor.time ||
        monitor.waktu ||
        monitor.created_at ||
        monitor.timestamp ||
        "-";


    const name =
        monitor.name ||
        monitor.nama ||
        monitor.username ||
        "Tidak Diketahui";


    /*
    |--------------------------------------------------------------------------
    | DATA PERUMAHAN
    |--------------------------------------------------------------------------
    */

    const info =
        latestPerumahan?.info ||
        {};


    const perumahanNama =
        info.nama ||
        info.name ||
        latestPerumahan?.nama ||
        "Tidak Diketahui";


    const perumahanLokasi =
        info.lokasi ||
        info.location ||
        latestPerumahan?.lokasi ||
        "Tidak Diketahui";


    /*
    |--------------------------------------------------------------------------
    | KOORDINAT
    |--------------------------------------------------------------------------
    */

    const lat =
        parseFloat(
            latitude
        );

    const lon =
        parseFloat(
            longitude
        );


    /*
    |--------------------------------------------------------------------------
    | GOOGLE MAPS
    |--------------------------------------------------------------------------
    */

    let mapsLink = `

        <span
            style="
                color:
                var(--dash-text-muted);
            "
        >
            Lokasi tidak tersedia
        </span>

    `;


    if (
        Number.isFinite(lat) &&
        Number.isFinite(lon) &&
        !(
            lat === 0 &&
            lon === 0
        )
    ) {

        mapsLink = `

            <a
                href="https://www.google.com/maps?q=${lat},${lon}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-location-map"
            >

                <i
                    class="
                        fa-solid
                        fa-map-location-dot
                    "
                ></i>

                <span>
                    Buka Google Maps
                </span>

            </a>

        `;

    }


    /*
    |--------------------------------------------------------------------------
    | PRIORITY
    |--------------------------------------------------------------------------
    */

    let priorityClass =
        "priority-biasa";

    let priorityLabel =
        "Biasa";


    if (
        priority === "darurat"
    ) {

        priorityClass =
            "priority-darurat";

        priorityLabel =
            "Darurat";

    }

    else if (
        priority === "penting"
    ) {

        priorityClass =
            "priority-penting";

        priorityLabel =
            "Penting";

    }


    /*
    |--------------------------------------------------------------------------
    | FORMAT WAKTU
    |--------------------------------------------------------------------------
    */

    const formattedTime =
        formatMonitorTime(
            time
        );


    /*
    |--------------------------------------------------------------------------
    | INITIAL USER
    |--------------------------------------------------------------------------
    */

    const initial =
        name &&
        String(
            name
        ).trim().length > 0

            ? String(
                name
            )
                .trim()
                .charAt(0)
                .toUpperCase()

            : "W";


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    liveAlertBox.innerHTML = `

        <div
            class="
                active-alert-wrapper
                ${priorityClass}
            "
        >

            <div
                class="
                    active-alert-header
                "
            >

                <div
                    class="
                        alert-user-badge
                    "
                >

                    <div
                        class="
                            alert-user-avatar
                        "
                    >
                        ${escapeHtml(initial)}
                    </div>


                    <div
                        class="
                            alert-user-info
                        "
                    >

                        <strong>
                            ${escapeHtml(name)}
                        </strong>


                        <span>

                            Rumah:

                            <strong>
                                ${escapeHtml(
                                    houseNumber
                                )}
                            </strong>

                        </span>

                    </div>

                </div>


                <span
                    class="
                        status-badge
                        status-${priorityClass.replace(
                            "priority-",
                            ""
                        )}
                    "
                >

                    Prioritas:
                    ${priorityLabel}

                </span>

            </div>


            <div
                class="
                    alert-info-grid
                "
            >

                <div
                    class="
                        alert-info-cell
                    "
                >

                    <span
                        class="
                            alert-info-label
                        "
                    >
                        Perumahan
                    </span>


                    <span
                        class="
                            alert-info-value
                        "
                    >
                        ${escapeHtml(
                            perumahanNama
                        )}
                    </span>

                </div>


                <div
                    class="
                        alert-info-cell
                    "
                >

                    <span
                        class="
                            alert-info-label
                        "
                    >
                        Lokasi Cluster
                    </span>


                    <span
                        class="
                            alert-info-value
                        "
                    >
                        ${escapeHtml(
                            perumahanLokasi
                        )}
                    </span>

                </div>


                <div
                    class="
                        alert-info-cell
                    "
                >

                    <span
                        class="
                            alert-info-label
                        "
                    >
                        Waktu Kejadian
                    </span>


                    <span
                        class="
                            alert-info-value
                        "
                    >
                        ${escapeHtml(
                            formattedTime
                        )}
                    </span>

                </div>


                <div
                    class="
                        alert-info-cell
                    "
                >

                    <span
                        class="
                            alert-info-label
                        "
                    >
                        Status Sinyal
                    </span>


                    <span
                        class="
                            alert-info-value
                        "
                        style="
                            color:
                            var(--dash-emergency);
                        "
                    >
                        SIAGA AKTIF
                    </span>

                </div>

            </div>


            <div
                class="
                    alert-message-box
                "
            >

                <strong>
                    Pesan Darurat:
                </strong>


                <p>
                    ${escapeHtml(message)}
                </p>

            </div>


            <div
                class="
                    alert-actions-bar
                "
            >

                ${mapsLink}

            </div>

        </div>

    `;

}


/*
|--------------------------------------------------------------------------
| UPDATE STATUS BUZZER
|--------------------------------------------------------------------------
*/

function updateStatusBuzzer(
    mainState,
    priority
) {

    if (
        !statusText
    ) {

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | NORMALISASI
    |--------------------------------------------------------------------------
    */

    mainState =
        String(
            mainState || "off"
        )
            .toLowerCase()
            .trim();


    priority =
        String(
            priority || "off"
        )
            .toLowerCase()
            .trim();


    /*
    |--------------------------------------------------------------------------
    | BUZZER ON
    |--------------------------------------------------------------------------
    */

    if (
        mainState === "on"
    ) {

        statusText.textContent =
            "ON";


        if (
            statusCard
        ) {

            statusCard.style.borderColor =
                "var(--dash-emergency)";

        }


        /*
        |--------------------------------------------------------------------------
        | DARURAT
        |--------------------------------------------------------------------------
        */

        if (
            priority === "darurat"
        ) {

            if (
                statusBadge
            ) {

                statusBadge.className =
                    "stat-badge-buzzer darurat";

            }


            if (
                statusBadgeText
            ) {

                statusBadgeText.textContent =
                    "Darurat";

            }


            if (
                statusSubText
            ) {

                statusSubText.textContent =
                    "Sirine darurat sedang aktif!";

            }


            if (
                statusPulseDot
            ) {

                statusPulseDot.className =
                    "status-pulse-dot darurat";

            }


            if (
                activeStatusBadge
            ) {

                activeStatusBadge.className =
                    "status-badge status-darurat";

                activeStatusBadge.textContent =
                    "Darurat";

            }

        }


        /*
        |--------------------------------------------------------------------------
        | PENTING
        |--------------------------------------------------------------------------
        */

        else if (
            priority === "penting"
        ) {

            if (
                statusBadge
            ) {

                statusBadge.className =
                    "stat-badge-buzzer penting";

            }


            if (
                statusBadgeText
            ) {

                statusBadgeText.textContent =
                    "Penting";

            }


            if (
                statusSubText
            ) {

                statusSubText.textContent =
                    "Peringatan prioritas tinggi";

            }


            if (
                statusPulseDot
            ) {

                statusPulseDot.className =
                    "status-pulse-dot penting";

            }


            if (
                activeStatusBadge
            ) {

                activeStatusBadge.className =
                    "status-badge status-penting";

                activeStatusBadge.textContent =
                    "Penting";

            }

        }


        /*
        |--------------------------------------------------------------------------
        | BIASA
        |--------------------------------------------------------------------------
        */

        else {

            if (
                statusBadge
            ) {

                statusBadge.className =
                    "stat-badge-buzzer biasa";

            }


            if (
                statusBadgeText
            ) {

                statusBadgeText.textContent =
                    "Biasa";

            }


            if (
                statusSubText
            ) {

                statusSubText.textContent =
                    "Peringatan prioritas normal";

            }


            if (
                statusPulseDot
            ) {

                statusPulseDot.className =
                    "status-pulse-dot biasa";

            }


            if (
                activeStatusBadge
            ) {

                activeStatusBadge.className =
                    "status-badge status-biasa";

                activeStatusBadge.textContent =
                    "Biasa";

            }

        }


        return;

    }


    /*
    |--------------------------------------------------------------------------
    | BUZZER OFF
    |--------------------------------------------------------------------------
    */

    statusText.textContent =
        "OFF";


    if (
        statusCard
    ) {

        statusCard.style.borderColor =
            "";

    }


    if (
        statusBadge
    ) {

        statusBadge.className =
            "stat-badge-buzzer";

    }


    if (
        statusBadgeText
    ) {

        statusBadgeText.textContent =
            "Standby";

    }


    if (
        statusSubText
    ) {

        statusSubText.textContent =
            "Sistem sirine dalam mode normal";

    }


    if (
        statusPulseDot
    ) {

        statusPulseDot.className =
            "status-pulse-dot";

    }


    if (
        activeStatusBadge
    ) {

        activeStatusBadge.className =
            "status-badge status-none";

        activeStatusBadge.textContent =
            "Tidak Ada";

    }

}


/*
|--------------------------------------------------------------------------
| GET ACTIVE PUBLIC PANICS
|--------------------------------------------------------------------------
*/

function getActivePublicPanics(
    panicData
) {

    const activePanics =
        [];


    for (
        const [
            zoneName,
            zoneData
        ]
        of Object.entries(
            panicData || {}
        )
    ) {

        if (
            !zoneData ||
            typeof zoneData !== "object"
        ) {

            continue;

        }


        for (
            const [
                deviceKey,
                deviceData
            ]
            of Object.entries(
                zoneData
            )
        ) {

            if (
                !deviceData ||
                typeof deviceData !== "object"
            ) {

                continue;

            }


            /*
            |--------------------------------------------------------------------------
            | HANYA ACTIVE TRUE
            |--------------------------------------------------------------------------
            */

            if (
                deviceData.active === true
            ) {

                activePanics.push({

                    device:
                        deviceData.device ||
                        deviceKey,

                    zona:
                        deviceData.zona ||
                        zoneName,

                    lokasi:
                        deviceData.lokasi ||
                        "-",

                    active:
                        true,

                    last_update:
                        deviceData.last_update ||
                        null

                });

            }

        }

    }


    /*
    |--------------------------------------------------------------------------
    | SORT TERBARU
    |--------------------------------------------------------------------------
    */

    activePanics.sort(
        (
            a,
            b
        ) => {

            return (
                Number(
                    b.last_update || 0
                ) -
                Number(
                    a.last_update || 0
                )
            );

        }
    );


    return activePanics;
}


/*
|--------------------------------------------------------------------------
| RENDER PUBLIC PANIC
|--------------------------------------------------------------------------
*/

function renderPublicPanic(
    activePanics
) {

    if (
        !publicPanicAlert
    ) {

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | BADGE
    |--------------------------------------------------------------------------
    */

    if (
        publicPanicCountBadge
    ) {

        if (
            activePanics.length === 0
        ) {

            publicPanicCountBadge.className =
                "status-badge status-none";

            publicPanicCountBadge.textContent =
                "0 Perangkat";

        }

        else {

            publicPanicCountBadge.className =
                "status-badge status-darurat";

            publicPanicCountBadge.textContent =
                `${activePanics.length} Perangkat Aktif`;

        }

    }


    /*
    |--------------------------------------------------------------------------
    | TIDAK ADA PUBLIC PANIC
    |--------------------------------------------------------------------------
    */

    if (
        activePanics.length === 0
    ) {

        publicPanicAlert.innerHTML = `

            <div
                class="empty-state"
            >

                <div
                    class="
                        empty-state-icon
                        public-idle
                    "
                >

                    <i
                        class="
                            fa-solid
                            fa-satellite-dish
                        "
                    ></i>

                </div>


                <h3>
                    Tidak Ada Alarm Publik Aktif
                </h3>


                <p>
                    Perangkat IoT panic publik berada
                    dalam kondisi standby dan terpantau aktif.
                </p>

            </div>

        `;

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | DEVICE AKTIF
    |--------------------------------------------------------------------------
    */

    publicPanicAlert.innerHTML = `

        <div
            class="public-panic-grid"
        >

            ${activePanics
                .map(
                    (
                        panic
                    ) => `

                    <div
                        class="
                            public-panic-card
                        "
                    >

                        <div
                            class="
                                public-panic-card-header
                            "
                        >

                            <span
                                class="
                                    public-panic-device
                                "
                            >

                                <span
                                    class="
                                        pulse-dot-red
                                    "
                                ></span>


                                ${escapeHtml(
                                    panic.device
                                )}

                            </span>


                            <span
                                class="
                                    status-badge
                                    status-darurat
                                "
                                style="
                                    font-size:10px;
                                    padding:3px 8px;
                                "
                            >
                                AKTIF
                            </span>

                        </div>


                        <div
                            class="
                                public-panic-details
                            "
                        >

                            <div>

                                <strong>
                                    Zona:
                                </strong>

                                ${escapeHtml(
                                    panic.zona
                                )}

                            </div>


                            <div>

                                <strong>
                                    Lokasi:
                                </strong>

                                ${escapeHtml(
                                    panic.lokasi
                                )}

                            </div>


                            <div>

                                <strong>
                                    Waktu:
                                </strong>

                                ${formatPublicPanicTime(
                                    panic.last_update
                                )}

                            </div>

                        </div>

                    </div>

                `
                )
                .join("")}

        </div>

    `;

}


/*
|--------------------------------------------------------------------------
| DB1 - LISTENER PERUMAHAN
|--------------------------------------------------------------------------
*/

onValue(

    perumahanRef,

    async (
        snapshot
    ) => {

        const startTime =
            performance.now();


        /*
        |--------------------------------------------------------------------------
        | VERSI REQUEST
        |--------------------------------------------------------------------------
        */

        const currentVersion =
            ++db1Version;


        try {

            /*
            |--------------------------------------------------------------------------
            | DATA DB1
            |--------------------------------------------------------------------------
            */

            const perumahanData =
                snapshot.val() || {};


            /*
            |--------------------------------------------------------------------------
            | SIMPAN CACHE
            |--------------------------------------------------------------------------
            */

            latestPerumahanData =
                perumahanData;


            /*
            |--------------------------------------------------------------------------
            | UPDATE TOTAL USER
            |--------------------------------------------------------------------------
            */

            updateTotalUsers();


            /*
            |--------------------------------------------------------------------------
            | TENTUKAN PERUMAHAN USER
            |--------------------------------------------------------------------------
            |
            | User hanya memproses perumahan miliknya.
            |
            |--------------------------------------------------------------------------
            */

           const perumahanIds = Object.entries(perumahanData)
    .filter(([key, value]) => {

        return (
            key !== "buzzers" &&
            value &&
            typeof value === "object"
        );

    })
    .map(([key]) => key);


            /*
            |--------------------------------------------------------------------------
            | TOTAL PERUMAHAN
            |--------------------------------------------------------------------------
            */

            if (
                totalPerumahan
            ) {

                totalPerumahan.textContent =
                    perumahanIds.length
                        .toLocaleString(
                            "id-ID"
                        );

            }


            /*
            |--------------------------------------------------------------------------
            | DEBUG
            |--------------------------------------------------------------------------
            */

            console.log(
                "===================================="
            );

            console.log(
                "DB1 PERUMAHAN UPDATE"
            );

            console.log(
                "Current Perumahan ID:",
                currentPerumahanId
            );

            console.log(
                "Jumlah perumahan:",
                perumahanIds.length
            );

            console.log(
                "Perumahan yang diproses:",
                perumahanIds
            );

            console.log(
                "Data perumahan:",
                perumahanData
            );

            console.log(
                "===================================="
            );


            /*
            |--------------------------------------------------------------------------
            | TIDAK ADA PERUMAHAN
            |--------------------------------------------------------------------------
            */

            if (
                perumahanIds.length === 0
            ) {

                updateStatusBuzzer(
                    "off",
                    "off"
                );


                renderLiveAlert(
                    null,
                    null,
                    "off",
                    "off"
                );


                logPerformance(
                    "DB1 dashboard",
                    startTime
                );


                return;

            }


            /*
            |--------------------------------------------------------------------------
            | AMBIL MONITOR
            |--------------------------------------------------------------------------
            */

            const monitorPromises =
                perumahanIds.map(
                    async (
                        perumahanId
                    ) => {

                        const perumahan =
                            perumahanData[
                                perumahanId
                            ] || {};


                        console.log(
                            "Memeriksa perumahan:",
                            perumahanId
                        );


                        return await getLatestMonitor(
                            perumahanId,
                            perumahan
                        );

                    }
                );


            const monitorResults =
                await Promise.all(
                    monitorPromises
                );


            /*
            |--------------------------------------------------------------------------
            | ABAIKAN DATA LAMA
            |--------------------------------------------------------------------------
            */

            if (
                currentVersion !==
                db1Version
            ) {

                console.log(
                    "Hasil DB1 lama diabaikan."
                );

                return;

            }


            /*
            |--------------------------------------------------------------------------
            | CARI BUZZER YANG ON
            |--------------------------------------------------------------------------
            */

            let activeBuzzerResult =
                null;


            for (
                const result
                of monitorResults
            ) {

                if (
                    !result
                ) {

                    continue;

                }


                const perumahan =
                    result.perumahan ||
                    {};


                const state =
                    String(
                        perumahan
                            ?.buzzers
                            ?.main
                            ?.state ||
                        "off"
                    )
                        .toLowerCase()
                        .trim();


                console.log(
                    "===================================="
                );

                console.log(
                    "PERUMAHAN:",
                    result.perumahanId
                );

                console.log(
                    "BUZZER STATE:",
                    state
                );

                console.log(
                    "MONITOR:",
                    result.monitor
                );

                console.log(
                    "===================================="
                );


                /*
                |--------------------------------------------------------------------------
                | HANYA BUZZER ON
                |--------------------------------------------------------------------------
                */

                if (
                    state === "on"
                ) {

                    /*
                    |--------------------------------------------------------------------------
                    | Jika ada lebih dari satu,
                    | pilih monitor dengan timestamp terbaru.
                    |--------------------------------------------------------------------------
                    */

                    if (
                        !activeBuzzerResult
                    ) {

                        activeBuzzerResult =
                            result;

                    }

                    else if (
                        result.timestamp >
                        activeBuzzerResult.timestamp
                    ) {

                        activeBuzzerResult =
                            result;

                    }

                    else if (
                        result.timestamp ===
                        activeBuzzerResult.timestamp &&
                        result.monitorKey >
                        activeBuzzerResult.monitorKey
                    ) {

                        activeBuzzerResult =
                            result;

                    }

                }

            }


            /*
            |--------------------------------------------------------------------------
            | TIDAK ADA BUZZER AKTIF
            |--------------------------------------------------------------------------
            */

            if (
                !activeBuzzerResult
            ) {

                console.log(
                    "Tidak ada buzzer ON."
                );


                updateStatusBuzzer(
                    "off",
                    "off"
                );


                renderLiveAlert(
                    null,
                    null,
                    "off",
                    "off"
                );


                logPerformance(
                    "DB1 dashboard",
                    startTime
                );


                console.log(
                    `DB1 Perumahan: ${perumahanIds.length}`
                );


                console.log(
                    `DB1 Monitor diperiksa: ${
                        monitorResults.filter(
                            Boolean
                        ).length
                    }`
                );


                return;

            }


            /*
            |--------------------------------------------------------------------------
            | DATA AKTIF
            |--------------------------------------------------------------------------
            */

            const latestMonitor =
                activeBuzzerResult;


            const latestPerumahan =
                activeBuzzerResult.perumahan;


            const mainState =
                String(
                    latestPerumahan
                        ?.buzzers
                        ?.main
                        ?.state ||
                    "off"
                )
                    .toLowerCase()
                    .trim();


            const priority =
                String(
                    latestMonitor
                        ?.monitor
                        ?.priority ||
                    latestPerumahan
                        ?.buzzers
                        ?.main
                        ?.priority ||
                    "biasa"
                )
                    .toLowerCase()
                    .trim();


            /*
            |--------------------------------------------------------------------------
            | DEBUG STATUS
            |--------------------------------------------------------------------------
            */

            console.log(
                "===================================="
            );

            console.log(
                "PERUMAHAN AKTIF"
            );

            console.log(
                "ID:",
                latestMonitor.perumahanId
            );

            console.log(
                "BUZZER:",
                mainState
            );

            console.log(
                "PRIORITY:",
                priority
            );

            console.log(
                "MONITOR:",
                latestMonitor.monitor
            );

            console.log(
                "===================================="
            );


            /*
            |--------------------------------------------------------------------------
            | UPDATE STATUS
            |--------------------------------------------------------------------------
            */

            updateStatusBuzzer(
                mainState,
                priority
            );


            /*
            |--------------------------------------------------------------------------
            | RENDER LIVE ALERT
            |--------------------------------------------------------------------------
            */

            renderLiveAlert(
                latestMonitor,
                latestPerumahan,
                mainState,
                priority
            );


            /*
            |--------------------------------------------------------------------------
            | PERFORMANCE
            |--------------------------------------------------------------------------
            */

            logPerformance(
                "DB1 dashboard",
                startTime
            );


            console.log(
                `DB1 Perumahan: ${perumahanIds.length}`
            );


            console.log(
                `DB1 Monitor diperiksa: ${
                    monitorResults.filter(
                        Boolean
                    ).length
                }`
            );

        }

        catch (
            error
        ) {

            console.error(
                "Error memproses DB1:",
                error
            );

        }

    },

    (
        error
    ) => {

        console.error(
            "Firebase DB1 listener error:",
            error
        );

    }

);


/*
|--------------------------------------------------------------------------
| DB2 - PANIC CHANNELS
|--------------------------------------------------------------------------
*/

onValue(

    panicPublicRef,

    (
        snapshot
    ) => {

        const startTime =
            performance.now();


        try {

            const panicData =
                snapshot.val() || {};


            const activePanics =
                getActivePublicPanics(
                    panicData
                );


            renderPublicPanic(
                activePanics
            );


            console.log(
                `DB2 Panic aktif: ${activePanics.length}`
            );


            logPerformance(
                "DB2 panicChannels",
                startTime
            );

        }

        catch (
            error
        ) {

            console.error(
                "Error membaca panicChannels:",
                error
            );

        }

    },

    (
        error
    ) => {

        console.error(
            "Firebase panicChannels listener error:",
            error
        );

    }

);


/*
|--------------------------------------------------------------------------
| DB2 - PUBLIC PANICS
|--------------------------------------------------------------------------
*/

onValue(

    publicPanicsRef,

    (
        snapshot
    ) => {

        const startTime =
            performance.now();


        try {

            const publicPanicData =
                snapshot.val() || {};


            latestPublicPanicsData =
                publicPanicData;


            /*
            |--------------------------------------------------------------------------
            | UPDATE TOTAL USER
            |--------------------------------------------------------------------------
            */

            updateTotalUsers();


            console.log(
                "DB2 public_panics:",
                Object.keys(
                    publicPanicData
                ).length
            );


            console.log(
                "Total user unik:",
                getTotalUniqueUsers(
                    latestPerumahanData,
                    latestPublicPanicsData
                )
            );


            logPerformance(
                "DB2 public_panics",
                startTime
            );

        }

        catch (
            error
        ) {

            console.error(
                "Error membaca public_panics:",
                error
            );

        }

    },

    (
        error
    ) => {

        console.error(
            "Firebase public_panics listener error:",
            error
        );

    }

);