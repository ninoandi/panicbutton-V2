import {
    db1,
    db2
} from "./firebase-config.js";

import {
    ref,
    onValue,
    query,
    orderByKey,
    limitToLast,
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
    document.getElementById("publicPanicAlert");


/*
|--------------------------------------------------------------------------
| FIREBASE REFERENCES
|--------------------------------------------------------------------------
*/

const perumahanRef =
    ref(db1, "perumahan");

const panicPublicRef =
    ref(db2, "panicChannels");


/*
|--------------------------------------------------------------------------
| LOAD VERSION
|
| Digunakan untuk mencegah hasil request lama menimpa
| hasil request Firebase yang lebih baru.
|--------------------------------------------------------------------------
*/

let dashboardLoadVersion = 0;


/*
|--------------------------------------------------------------------------
| FIREBASE LISTENER
| PERUMAHAN
|--------------------------------------------------------------------------
|
| Tugas:
| 1. Hitung total perumahan
| 2. Hitung total user
| 3. Ambil monitor TERBARU setiap perumahan
| 4. Tentukan panic terbaru
| 5. Update status buzzer
|
|--------------------------------------------------------------------------
*/

onValue(
    perumahanRef,

    async (snapshot) => {

        const currentLoadVersion =
            ++dashboardLoadVersion;

        const startTime = performance.now();

        try {

            const perumahanData =
                snapshot.val() || {};


            /*
            |--------------------------------------------------------------------------
            | DATA DASAR
            |--------------------------------------------------------------------------
            */

            const perumahanIds =
                Object.keys(perumahanData);


            /*
            |--------------------------------------------------------------------------
            | TOTAL PERUMAHAN
            |--------------------------------------------------------------------------
            */

            if (totalPerumahan) {

                totalPerumahan.textContent =
                    perumahanIds.length
                        .toLocaleString("id-ID");

            }


            /*
            |--------------------------------------------------------------------------
            | TOTAL USER
            |--------------------------------------------------------------------------
            |
            | Karena struktur Firebase tidak boleh diubah,
            | total user tetap dihitung dari data yang sudah
            | diterima pada snapshot perumahan.
            |
            |--------------------------------------------------------------------------
            */

            let totalUserCount = 0;

            for (const id of perumahanIds) {

                const p =
                    perumahanData[id] || {};

                const users =
                    p.users || {};

                totalUserCount +=
                    Object.keys(users).length;
            }


            if (totalUsers) {

                totalUsers.textContent =
                    totalUserCount
                        .toLocaleString("id-ID");

            }


            /*
            |--------------------------------------------------------------------------
            | JIKA TIDAK ADA PERUMAHAN
            |--------------------------------------------------------------------------
            */

            if (perumahanIds.length === 0) {

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

                return;
            }


            /*
            |--------------------------------------------------------------------------
            | AMBIL MONITOR TERBARU SECARA PARALEL
            |--------------------------------------------------------------------------
            |
            | Sebelumnya:
            |
            | for setiap perumahan
            |     loop semua monitor
            |
            | Sekarang:
            |
            | perumahan A -> limitToLast(1)
            | perumahan B -> limitToLast(1)
            | perumahan C -> limitToLast(1)
            |
            | Semua request berjalan secara paralel menggunakan Promise.all().
            |--------------------------------------------------------------------------
            */

            const monitorPromises =
                perumahanIds.map(
                    async (perumahanId) => {

                        try {

                            const monitorQuery =
                                query(
                                    ref(
                                        db1,
                                        `perumahan/${perumahanId}/monitor`
                                    ),
                                    orderByKey(),
                                    limitToLast(1)
                                );


                            const monitorSnapshot =
                                await get(monitorQuery);


                            if (!monitorSnapshot.exists()) {

                                return null;
                            }


                            const monitorData =
                                monitorSnapshot.val();


                            const entries =
                                Object.entries(monitorData);


                            if (entries.length === 0) {

                                return null;
                            }


                            const [
                                monitorKey,
                                monitor
                            ] = entries[0];


                            return {
                                perumahanId,
                                monitorKey,
                                monitor,
                                perumahan:
                                    perumahanData[perumahanId] || {}
                            };


                        } catch (error) {

                            console.error(
                                `Gagal membaca monitor perumahan ${perumahanId}:`,
                                error
                            );

                            return null;
                        }

                    }
                );


            /*
            |--------------------------------------------------------------------------
            | TUNGGU SEMUA QUERY SELESAI
            |--------------------------------------------------------------------------
            */

            const monitorResults =
                await Promise.all(
                    monitorPromises
                );


            /*
            |--------------------------------------------------------------------------
            | CEK APAKAH HASIL INI MASIH YANG TERBARU
            |--------------------------------------------------------------------------
            |
            | Misalnya Firebase mengirim update kedua
            | sebelum request pertama selesai.
            |
            | Hasil request pertama tidak boleh menimpa
            | data terbaru.
            |--------------------------------------------------------------------------
            */

            if (
                currentLoadVersion !==
                dashboardLoadVersion
            ) {

                console.log(
                    "Dashboard: hasil request lama diabaikan."
                );

                return;
            }


            /*
            |--------------------------------------------------------------------------
            | CARI MONITOR PALING TERBARU
            |--------------------------------------------------------------------------
            */

            let latestMonitor = null;
            let latestPerumahan = null;
            let latestKey = "";


            for (
                const result
                of monitorResults
            ) {

                if (!result) {
                    continue;
                }


                if (
                    result.monitorKey >
                    latestKey
                ) {

                    latestKey =
                        result.monitorKey;

                    latestMonitor =
                        result.monitor;

                    latestPerumahan =
                        result.perumahan;
                }

            }


            /*
            |--------------------------------------------------------------------------
            | STATUS BUZZER
            |--------------------------------------------------------------------------
            */

            const mainState = (
                latestPerumahan
                    ?.buzzers
                    ?.main
                    ?.state || "off"
            ).toLowerCase();


            const priority = (
                latestMonitor
                    ?.priority || "off"
            ).toLowerCase();


            /*
            |--------------------------------------------------------------------------
            | UPDATE STATUS BUZZER
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
            | PERFORMANCE LOG
            |--------------------------------------------------------------------------
            */

            const endTime =
                performance.now();

            console.log(
                `Dashboard Firebase selesai dalam ${(endTime - startTime).toFixed(0)} ms`
            );

            console.log(
                `Perumahan: ${perumahanIds.length}`
            );

            console.log(
                `Total User: ${totalUserCount}`
            );

            console.log(
                `Monitor berhasil diperiksa: ${
                    monitorResults.filter(Boolean).length
                }`
            );


        } catch (error) {

            console.error(
                "Error memproses data Firebase Perumahan:",
                error
            );

        }

    },

    (error) => {

        console.error(
            "Firebase Perumahan listener error:",
            error
        );

    }
);


/*
|--------------------------------------------------------------------------
| UPDATE STATUS BUZZER UI
|--------------------------------------------------------------------------
*/

function updateStatusBuzzer(
    mainState,
    priority
) {

    if (!statusText) {
        return;
    }


    /*
    |--------------------------------------------------------------------------
    | BUZZER ON
    |--------------------------------------------------------------------------
    */

    if (mainState === "on") {

        statusText.textContent =
            "ON";


        if (statusCard) {

            statusCard.style.borderColor =
                "var(--dash-emergency)";
        }


        /*
        |--------------------------------------------------------------------------
        | PRIORITAS DARURAT
        |--------------------------------------------------------------------------
        */

        if (priority === "darurat") {

            if (statusBadge) {

                statusBadge.className =
                    "stat-badge-buzzer darurat";
            }


            if (statusBadgeText) {

                statusBadgeText.textContent =
                    "Darurat";
            }


            if (statusSubText) {

                statusSubText.textContent =
                    "Sirine darurat sedang aktif!";
            }


            if (statusPulseDot) {

                statusPulseDot.className =
                    "status-pulse-dot darurat";
            }


            if (activeStatusBadge) {

                activeStatusBadge.className =
                    "status-badge status-darurat";

                activeStatusBadge.textContent =
                    "Darurat";
            }

        }


        /*
        |--------------------------------------------------------------------------
        | PRIORITAS PENTING
        |--------------------------------------------------------------------------
        */

        else if (priority === "penting") {

            if (statusBadge) {

                statusBadge.className =
                    "stat-badge-buzzer penting";
            }


            if (statusBadgeText) {

                statusBadgeText.textContent =
                    "Penting";
            }


            if (statusSubText) {

                statusSubText.textContent =
                    "Peringatan prioritas tinggi";
            }


            if (statusPulseDot) {

                statusPulseDot.className =
                    "status-pulse-dot penting";
            }


            if (activeStatusBadge) {

                activeStatusBadge.className =
                    "status-badge status-penting";

                activeStatusBadge.textContent =
                    "Penting";
            }

        }


        /*
        |--------------------------------------------------------------------------
        | PRIORITAS BIASA
        |--------------------------------------------------------------------------
        */

        else {

            if (statusBadge) {

                statusBadge.className =
                    "stat-badge-buzzer biasa";
            }


            if (statusBadgeText) {

                statusBadgeText.textContent =
                    "Biasa";
            }


            if (statusSubText) {

                statusSubText.textContent =
                    "Peringatan prioritas normal";
            }


            if (statusPulseDot) {

                statusPulseDot.className =
                    "status-pulse-dot biasa";
            }


            if (activeStatusBadge) {

                activeStatusBadge.className =
                    "status-badge status-biasa";

                activeStatusBadge.textContent =
                    "Biasa";
            }

        }

    }


    /*
    |--------------------------------------------------------------------------
    | BUZZER OFF
    |--------------------------------------------------------------------------
    */

    else {

        statusText.textContent =
            "OFF";


        if (statusCard) {

            statusCard.style.borderColor =
                "";
        }


        if (statusBadge) {

            statusBadge.className =
                "stat-badge-buzzer";
        }


        if (statusBadgeText) {

            statusBadgeText.textContent =
                "Standby";
        }


        if (statusSubText) {

            statusSubText.textContent =
                "Sistem sirine dalam mode normal";
        }


        if (statusPulseDot) {

            statusPulseDot.className =
                "status-pulse-dot";
        }


        if (activeStatusBadge) {

            activeStatusBadge.className =
                "status-badge status-none";

            activeStatusBadge.textContent =
                "Tidak Ada";
        }

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

    if (!liveAlertBox) {
        return;
    }


    /*
    |--------------------------------------------------------------------------
    | ADA PANIC AKTIF
    |--------------------------------------------------------------------------
    */

    if (
        latestMonitor &&
        latestPerumahan &&
        mainState === "on"
    ) {

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
                nama:
                    perumahanNama =
                        "Tidak Diketahui",

                lokasi:
                    perumahanLokasi =
                        "Tidak Diketahui"
            } = {}
        } = latestPerumahan;


        /*
        |--------------------------------------------------------------------------
        | KOORDINAT
        |--------------------------------------------------------------------------
        */

        const lat =
            parseFloat(latitude);

        const lon =
            parseFloat(longitude);


        /*
        |--------------------------------------------------------------------------
        | GOOGLE MAPS
        |--------------------------------------------------------------------------
        */

        let mapsLink =
            '<span style="color:var(--dash-text-muted);">Tidak tersedia</span>';


        if (
            !Number.isNaN(lat) &&
            !Number.isNaN(lon)
        ) {

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


        /*
        |--------------------------------------------------------------------------
        | PRIORITY
        |--------------------------------------------------------------------------
        */

        let priorityClass =
            "priority-biasa";

        let priorityLabel =
            "Biasa";


        if (priority === "darurat") {

            priorityClass =
                "priority-darurat";

            priorityLabel =
                "Darurat";

        }

        else if (priority === "penting") {

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

        let formattedTime =
            time;


        if (
            typeof time === "string"
        ) {

            const timeParts =
                time.split(" waktu ");


            if (timeParts.length === 2) {

                const [
                    dateStr,
                    timeStr
                ] = timeParts;


                const [
                    year,
                    month,
                    day
                ] =
                    dateStr.split("-");


                if (
                    year &&
                    month &&
                    day
                ) {

                    formattedTime =
                        `${day}-${month}-${year} pukul ${timeStr}`;

                }

            }

        }


        /*
        |--------------------------------------------------------------------------
        | AVATAR INITIAL
        |--------------------------------------------------------------------------
        */

        const initial =
            (
                name &&
                String(name).length > 0
            )
                ? String(name)
                    .charAt(0)
                    .toUpperCase()
                : "W";


        /*
        |--------------------------------------------------------------------------
        | RENDER
        |--------------------------------------------------------------------------
        */

        liveAlertBox.innerHTML = `

            <div class="active-alert-wrapper ${priorityClass}">

                <div class="active-alert-header">

                    <div class="alert-user-badge">

                        <div class="alert-user-avatar">
                            ${escapeHtml(initial)}
                        </div>

                        <div class="alert-user-info">

                            <strong>
                                ${escapeHtml(name)}
                            </strong>

                            <span>
                                Rumah:
                                <strong>
                                    ${escapeHtml(houseNumber)}
                                </strong>
                            </span>

                        </div>

                    </div>


                    <span
                        class="status-badge status-${priorityClass.replace("priority-", "")}"
                    >
                        Prioritas: ${priorityLabel}
                    </span>

                </div>


                <div class="alert-info-grid">

                    <div class="alert-info-cell">

                        <span class="alert-info-label">
                            Perumahan
                        </span>

                        <span class="alert-info-value">
                            ${escapeHtml(perumahanNama)}
                        </span>

                    </div>


                    <div class="alert-info-cell">

                        <span class="alert-info-label">
                            Lokasi Cluster
                        </span>

                        <span class="alert-info-value">
                            ${escapeHtml(perumahanLokasi)}
                        </span>

                    </div>


                    <div class="alert-info-cell">

                        <span class="alert-info-label">
                            Waktu Kejadian
                        </span>

                        <span class="alert-info-value">
                            ${escapeHtml(formattedTime)}
                        </span>

                    </div>


                    <div class="alert-info-cell">

                        <span class="alert-info-label">
                            Status Sinyal
                        </span>

                        <span
                            class="alert-info-value"
                            style="color:var(--dash-emergency);"
                        >
                            SIAGA AKTIF
                        </span>

                    </div>

                </div>


                <div class="alert-message-box">

                    <strong>
                        Pesan Darurat:
                    </strong>

                    <p>
                        ${escapeHtml(message)}
                    </p>

                </div>


                <div class="alert-actions-bar">

                    ${mapsLink}

                </div>

            </div>
        `;

    }


    /*
    |--------------------------------------------------------------------------
    | TIDAK ADA PANIC
    |--------------------------------------------------------------------------
    */

    else {

        liveAlertBox.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">

                    <i class="fa-solid fa-shield-heart"></i>

                </div>

                <h3>
                    Tidak Ada Peringatan Darurat
                </h3>

                <p>
                    Seluruh area perumahan dalam kondisi aman dan siaga.
                </p>

            </div>

        `;

    }

}


/*
|--------------------------------------------------------------------------
| FIREBASE LISTENER
| PANIC PUBLIK / IoT
|--------------------------------------------------------------------------
*/

onValue(
    panicPublicRef,

    (snapshot) => {

        try {

            const panicData =
                snapshot.val() || {};


            const activePanics = [];


            /*
            |--------------------------------------------------------------------------
            | LOOP ZONA
            |--------------------------------------------------------------------------
            */

            Object.entries(
                panicData
            ).forEach(
                ([zoneName, zoneData]) => {

                    if (
                        !zoneData ||
                        typeof zoneData !== "object"
                    ) {

                        return;
                    }


                    /*
                    |--------------------------------------------------------------------------
                    | LOOP DEVICE
                    |--------------------------------------------------------------------------
                    */

                    Object.entries(
                        zoneData
                    ).forEach(
                        ([deviceKey, deviceData]) => {

                            if (
                                !deviceData ||
                                typeof deviceData !== "object"
                            ) {

                                return;
                            }


                            /*
                            |--------------------------------------------------------------------------
                            | HANYA DEVICE ACTIVE
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
                    );

                }
            );


            /*
            |--------------------------------------------------------------------------
            | URUTKAN TERBARU
            |--------------------------------------------------------------------------
            */

            activePanics.sort(
                (a, b) =>
                    (b.last_update || 0) -
                    (a.last_update || 0)
            );


            /*
            |--------------------------------------------------------------------------
            | RENDER
            |--------------------------------------------------------------------------
            */

            renderPublicPanic(
                activePanics
            );


        } catch (error) {

            console.error(
                "Error membaca panic publik:",
                error
            );

        }

    },

    (error) => {

        console.error(
            "Firebase Panic Publik Error:",
            error
        );

    }
);


/*
|--------------------------------------------------------------------------
| RENDER PANIC PUBLIK
|--------------------------------------------------------------------------
*/

function renderPublicPanic(
    activePanics
) {

    if (!publicPanicAlert) {
        return;
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE BADGE
    |--------------------------------------------------------------------------
    */

    if (publicPanicCountBadge) {

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
    | TIDAK ADA DEVICE AKTIF
    |--------------------------------------------------------------------------
    */

    if (
        activePanics.length === 0
    ) {

        publicPanicAlert.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon public-idle">

                    <i class="fa-solid fa-satellite-dish"></i>

                </div>

                <h3>
                    Tidak Ada Alarm Publik Aktif
                </h3>

                <p>
                    Perangkat IoT panic publik berada dalam kondisi standby dan terpantau aktif.
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

        <div class="public-panic-grid">

            ${activePanics.map(
                (panic) => `

                <div class="public-panic-card">

                    <div class="public-panic-card-header">

                        <span class="public-panic-device">

                            <span class="pulse-dot-red"></span>

                            ${escapeHtml(
                                panic.device
                            )}

                        </span>


                        <span
                            class="status-badge status-darurat"
                            style="font-size:10px; padding:3px 8px;"
                        >
                            AKTIF
                        </span>

                    </div>


                    <div class="public-panic-details">

                        <div>
                            <strong>Zona:</strong>
                            ${escapeHtml(
                                panic.zona
                            )}
                        </div>


                        <div>
                            <strong>Lokasi:</strong>
                            ${escapeHtml(
                                panic.lokasi
                            )}
                        </div>


                        <div>
                            <strong>Waktu:</strong>
                            ${formatPublicPanicTime(
                                panic.last_update
                            )}
                        </div>

                    </div>

                </div>

            `
            ).join("")}

        </div>

    `;

}


/*
|--------------------------------------------------------------------------
| FORMAT WAKTU PANIC PUBLIK
|--------------------------------------------------------------------------
*/

function formatPublicPanicTime(
    timestamp
) {

    if (!timestamp) {
        return "-";
    }


    const date =
        new Date(timestamp);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";
    }


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


/*
|--------------------------------------------------------------------------
| ESCAPE HTML
|--------------------------------------------------------------------------
*/

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
| INITIALIZED
|--------------------------------------------------------------------------
*/

console.log(
    "Dashboard Admin initialized smoothly."
);