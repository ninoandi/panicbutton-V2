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

const publicPanicsRef =
    ref(db2, "public_panics");


/*
|--------------------------------------------------------------------------
| STATE
|--------------------------------------------------------------------------
*/

let db1Version = 0;
let monitorLoadVersion = 0;


/*
|--------------------------------------------------------------------------
| CACHE DATA
|--------------------------------------------------------------------------
|
| Menyimpan data terbaru dari Firebase.
|
|--------------------------------------------------------------------------
*/

let latestPerumahanData = {};
let latestPublicPanicsData = {};


/*
|--------------------------------------------------------------------------
| CACHE MONITOR
|--------------------------------------------------------------------------
*/

const monitorCache = new Map();


/*
|--------------------------------------------------------------------------
| PERFORMANCE HELPER
|--------------------------------------------------------------------------
*/

function logPerformance(label, startTime) {

    const duration =
        performance.now() - startTime;

    console.log(
        `${label}: ${duration.toFixed(0)} ms`
    );
}


/*
|--------------------------------------------------------------------------
| HITUNG TOTAL USER UNIK DB1 + DB2
|--------------------------------------------------------------------------
|
| DB1:
| /perumahan/{perumahanId}/users
|
| DB2:
| /public_panics/{panicId}
|
| Prioritas identitas:
|
| 1. user_id
| 2. id
| 3. username
| 4. email
|
| Jika user melakukan panic berkali-kali,
| tetap dihitung 1 user.
|
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
    | USER DB1
    |--------------------------------------------------------------------------
    */

    Object.entries(
        perumahanData || {}
    ).forEach(
        ([perumahanId, perumahan]) => {

            if (
                !perumahan ||
                typeof perumahan !== "object"
            ) {
                return;
            }


            const users =
                perumahan.users || {};


            Object.entries(users).forEach(
                ([userKey, userData]) => {

                    if (
                        !userData ||
                        typeof userData !== "object"
                    ) {
                        return;
                    }


                    const userId =
                        userData.user_id ||
                        userData.id ||
                        userKey;


                    if (userId) {

                        /*
                        |----------------------------------------------------------
                        | Jangan gunakan prefix db1_ / db2_
                        | supaya user yang sama tidak dihitung 2x.
                        |----------------------------------------------------------
                        */

                        uniqueUsers.add(
                            String(userId)
                                .trim()
                                .toLowerCase()
                        );

                    }

                }
            );

        }
    );


    /*
    |--------------------------------------------------------------------------
    | USER DB2
    |--------------------------------------------------------------------------
    */

    Object.entries(
        publicPanicData || {}
    ).forEach(
        ([panicKey, panic]) => {

            if (
                !panic ||
                typeof panic !== "object"
            ) {
                return;
            }


            const userId =
                panic.user_id ||
                panic.id ||
                panic.username ||
                panic.email;


            if (!userId) {
                return;
            }


            uniqueUsers.add(
                String(userId)
                    .trim()
                    .toLowerCase()
            );

        }
    );


    return uniqueUsers.size;
}


/*
|--------------------------------------------------------------------------
| UPDATE TOTAL USER
|--------------------------------------------------------------------------
*/

function updateTotalUsers() {

    const total =
        getTotalUniqueUsers(
            latestPerumahanData,
            latestPublicPanicsData
        );


    if (totalUsers) {

        totalUsers.textContent =
            total.toLocaleString("id-ID");

    }


    console.log(
        "================================="
    );

    console.log(
        "TOTAL USER UNIK DB1 + DB2:",
        total
    );

    console.log(
        "================================="
    );

}


/*
|--------------------------------------------------------------------------
| DB1 - LISTENER PERUMAHAN
|--------------------------------------------------------------------------
|
| DB1 menangani:
|
| 1. Total perumahan
| 2. User DB1
| 3. Monitor terbaru
| 4. Status buzzer
| 5. Live alert
|
|--------------------------------------------------------------------------
*/

onValue(
    perumahanRef,

    async (snapshot) => {

        const startTime =
            performance.now();

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
            | DAFTAR PERUMAHAN
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


                console.log(
                    "DB1 tidak memiliki data perumahan."
                );


                return;

            }


            /*
            |--------------------------------------------------------------------------
            | VERSI MONITOR
            |--------------------------------------------------------------------------
            */

            const currentMonitorVersion =
                ++monitorLoadVersion;


            /*
            |--------------------------------------------------------------------------
            | AMBIL MONITOR TERBARU SETIAP PERUMAHAN
            |--------------------------------------------------------------------------
            */

            const monitorPromises =
                perumahanIds.map(
                    async (perumahanId) => {

                        try {

                            const monitorRef =
                                ref(
                                    db1,
                                    `perumahan/${perumahanId}/monitor`
                                );


                            const monitorQuery =
                                query(
                                    monitorRef,
                                    orderByKey(),
                                    limitToLast(1)
                                );


                            const monitorSnapshot =
                                await get(
                                    monitorQuery
                                );


                            /*
                            |--------------------------------------------------------------------------
                            | REQUEST LAMA
                            |--------------------------------------------------------------------------
                            */

                            if (
                                currentMonitorVersion !==
                                monitorLoadVersion
                            ) {

                                return null;

                            }


                            /*
                            |--------------------------------------------------------------------------
                            | TIDAK ADA MONITOR
                            |--------------------------------------------------------------------------
                            */

                            if (
                                !monitorSnapshot.exists()
                            ) {

                                return null;

                            }


                            const monitorData =
                                monitorSnapshot.val() || {};


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
                            | MONITOR TERAKHIR
                            |--------------------------------------------------------------------------
                            */

                            const [
                                monitorKey,
                                monitor
                            ] = entries[0];


                            const result = {

                                perumahanId,

                                monitorKey,

                                monitor,

                                perumahan:
                                    perumahanData[
                                        perumahanId
                                    ] || {}

                            };


                            /*
                            |--------------------------------------------------------------------------
                            | CACHE
                            |--------------------------------------------------------------------------
                            */

                            monitorCache.set(
                                perumahanId,
                                result
                            );


                            return result;

                        }

                        catch (error) {

                            console.error(
                                `Gagal mengambil monitor ${perumahanId}:`,
                                error
                            );


                            return null;

                        }

                    }
                );


            /*
            |--------------------------------------------------------------------------
            | TUNGGU SEMUA MONITOR
            |--------------------------------------------------------------------------
            */

            const monitorResults =
                await Promise.all(
                    monitorPromises
                );


            /*
            |--------------------------------------------------------------------------
            | JIKA DB1 UPDATE LAGI
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
            | CARI MONITOR TERBARU
            |--------------------------------------------------------------------------
            */

            let latestMonitor =
                null;

            let latestPerumahan =
                null;

            let latestKey =
                "";


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
            | UPDATE STATUS
            |--------------------------------------------------------------------------
            */

            updateStatusBuzzer(
                mainState,
                priority
            );

            /*
|--------------------------------------------------------------------------
| RENDER LIVE ALERT DB1
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
    | TIDAK ADA PANIC AKTIF
    |--------------------------------------------------------------------------
    */

    if (
        !latestMonitor ||
        !latestPerumahan ||
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
                    Seluruh area perumahan dalam kondisi aman dan siaga.
                </p>

            </div>

        `;

        return;
    }


    /*
    |--------------------------------------------------------------------------
    | DATA MONITOR
    |--------------------------------------------------------------------------
    */

    const {

        latitude = null,

        longitude = null,

        message = "-",

        houseNumber = "Tidak Diketahui",

        time = "-",

        name = "Tidak Diketahui"

    } = latestMonitor;


    /*
    |--------------------------------------------------------------------------
    | DATA PERUMAHAN
    |--------------------------------------------------------------------------
    */

    const info =
        latestPerumahan.info || {};


    const perumahanNama =
        info.nama ||
        "Tidak Diketahui";


    const perumahanLokasi =
        info.lokasi ||
        "Tidak Diketahui";


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

    let mapsLink = `

        <span style="color:var(--dash-text-muted);">
            Tidak tersedia
        </span>

    `;


    if (
        Number.isFinite(lat) &&
        Number.isFinite(lon)
    ) {

        mapsLink = `

            <a
                href="https://www.google.com/maps?q=${lat},${lon}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-location-map"
            >

                <i class="fa-solid fa-map-location-dot"></i>

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

    let formattedTime =
        time;


    if (
        typeof time === "string"
    ) {

        const timeParts =
            time.split(" waktu ");


        if (
            timeParts.length === 2
        ) {

            const [
                dateStr,
                timeStr
            ] = timeParts;


            const [
                year,
                month,
                day
            ] = dateStr.split("-");


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
    | INITIAL USER
    |--------------------------------------------------------------------------
    */

    const initial =
        name &&
        String(name).length > 0

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
                    class="status-badge status-${priorityClass.replace(
                        "priority-",
                        ""
                    )}"
                >

                    Prioritas:
                    ${priorityLabel}

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
            | LIVE ALERT
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
                    monitorResults.filter(Boolean).length
                }`
            );

        }

        catch (error) {

            console.error(
                "Error memproses DB1:",
                error
            );

        }

    },

    (error) => {

        console.error(
            "Firebase DB1 listener error:",
            error
        );

    }
);


/*
|--------------------------------------------------------------------------
| DB2 - LISTENER PANIC CHANNELS
|--------------------------------------------------------------------------
|
| Menangani panic publik yang sedang aktif.
|
|--------------------------------------------------------------------------
*/

onValue(
    panicPublicRef,

    (snapshot) => {

        const startTime =
            performance.now();


        try {

            const panicData =
                snapshot.val() || {};


            /*
            |--------------------------------------------------------------------------
            | CARI PANIC AKTIF
            |--------------------------------------------------------------------------
            */

            const activePanics =
                getActivePublicPanics(
                    panicData
                );


            /*
            |--------------------------------------------------------------------------
            | RENDER
            |--------------------------------------------------------------------------
            */

            renderPublicPanic(
                activePanics
            );

            /*
|--------------------------------------------------------------------------
| FORMAT WAKTU PUBLIC PANIC
|--------------------------------------------------------------------------
*/

function formatPublicPanicTime(timestamp) {

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

function escapeHtml(str = "") {

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
            | PERFORMANCE
            |--------------------------------------------------------------------------
            */

            logPerformance(
                "DB2 panicChannels",
                startTime
            );


            console.log(
                `DB2 Panic aktif: ${activePanics.length}`
            );

        }

        catch (error) {

            console.error(
                "Error membaca panicChannels:",
                error
            );

        }

    },

    (error) => {

        console.error(
            "Firebase panicChannels listener error:",
            error
        );

    }
);


/*
|--------------------------------------------------------------------------
| DB2 - LISTENER PUBLIC PANICS
|--------------------------------------------------------------------------
|
| Digunakan untuk menghitung user unik yang pernah panic.
|
|--------------------------------------------------------------------------
*/

onValue(
    publicPanicsRef,

    (snapshot) => {

        const startTime =
            performance.now();


        try {

            const publicPanicData =
                snapshot.val() || {};


            /*
            |--------------------------------------------------------------------------
            | SIMPAN CACHE
            |--------------------------------------------------------------------------
            */

            latestPublicPanicsData =
                publicPanicData;


            /*
            |--------------------------------------------------------------------------
            | UPDATE TOTAL USER
            |--------------------------------------------------------------------------
            */

            updateTotalUsers();


            /*
            |--------------------------------------------------------------------------
            | PERFORMANCE
            |--------------------------------------------------------------------------
            */

            logPerformance(
                "DB2 public_panics",
                startTime
            );


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

        }

        catch (error) {

            console.error(
                "Error membaca public_panics:",
                error
            );

        }

    },

    (error) => {

        console.error(
            "Firebase public_panics listener error:",
            error
        );

    }
);


/*
|--------------------------------------------------------------------------
| GET ACTIVE PUBLIC PANICS
|--------------------------------------------------------------------------
|
| Data:
|
| /panicChannels
|   /zona
|      /device
|
|--------------------------------------------------------------------------
*/

function getActivePublicPanics(
    panicData
) {

    const activePanics = [];


    /*
    |--------------------------------------------------------------------------
    | LOOP ZONA
    |--------------------------------------------------------------------------
    */

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


        /*
        |--------------------------------------------------------------------------
        | LOOP DEVICE
        |--------------------------------------------------------------------------
        */

        for (
            const [
                deviceKey,
                deviceData
            ]
            of Object.entries(zoneData)
        ) {

            if (
                !deviceData ||
                typeof deviceData !== "object"
            ) {

                continue;

            }


            /*
            |--------------------------------------------------------------------------
            | HANYA ACTIVE
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

                    active: true,

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
        (a, b) =>
            Number(
                b.last_update || 0
            ) -
            Number(
                a.last_update || 0
            )
    );


    return activePanics;

}

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

        statusText.textContent = "ON";


        if (statusCard) {

            statusCard.style.borderColor =
                "var(--dash-emergency)";

        }


        /*
        |--------------------------------------------------------------------------
        | DARURAT
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
        | PENTING
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
        | BIASA
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

        if (activePanics.length === 0) {

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
    | TIDAK ADA PANIC
    |--------------------------------------------------------------------------
    */

    if (activePanics.length === 0) {

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

            ${activePanics
                .map(
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