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
    document.getElementById("publicPanicAlert");


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

const panicPublicRef =
    ref(
        db2,
        "panicChannels"
    );

const publicPanicsRef =
    ref(
        db2,
        "public_panics"
    );


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

    console.log(
        `${label}: ${duration.toFixed(0)} ms`
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
| GET MONITOR TIMESTAMP
|--------------------------------------------------------------------------
|
| Urutan prioritas:
|
| 1. timestamp
| 2. created_at
| 3. time dengan format:
|    2025-10-17 waktu 10:35
|
|--------------------------------------------------------------------------
*/

function getMonitorTimestamp(
    monitor
) {

    if (
        !monitor ||
        typeof monitor !== "object"
    ) {

        return 0;

    }


    /*
    |--------------------------------------------------------------------------
    | PRIORITAS 1
    | timestamp
    |--------------------------------------------------------------------------
    */

    if (
        monitor.timestamp !== undefined &&
        monitor.timestamp !== null
    ) {

        const value =
            Number(
                monitor.timestamp
            );


        if (
            Number.isFinite(
                value
            )
        ) {

            return value;

        }

    }


    /*
    |--------------------------------------------------------------------------
    | PRIORITAS 2
    | created_at
    |--------------------------------------------------------------------------
    */

    if (
        monitor.created_at
    ) {

        const value =
            new Date(
                monitor.created_at
            ).getTime();


        if (
            Number.isFinite(
                value
            )
        ) {

            return value;

        }

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
| FORMAT MONITOR TIME
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


    return String(time);
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