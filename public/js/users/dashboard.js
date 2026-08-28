import { db2 } from "../firebase-config.js";

import {
    ref,
    onValue,
    get,
    update
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


/*
|--------------------------------------------------------------------------
| USER LOGIN
|--------------------------------------------------------------------------
*/

const currentUser = window.currentUser || {};

const userId = currentUser.id
    ? String(currentUser.id)
    : null;


console.log("=================================");
console.log("DASHBOARD USER");
console.log("Current User:", currentUser);
console.log("User ID:", userId);
console.log("=================================");


/*
|--------------------------------------------------------------------------
| ELEMENT
|--------------------------------------------------------------------------
*/

const activeReportContainer =
    document.getElementById("activeReportContainer");
const activeStatusBadge =
    document.getElementById("activeStatusBadge");
const activeReportCount =
    document.getElementById("activeReportCount");
const totalReportCount =
    document.getElementById("totalReportCount");
const completedReportCount =
    document.getElementById("completedReportCount");


/*
|--------------------------------------------------------------------------
| VALIDASI ELEMENT
|--------------------------------------------------------------------------
*/

if (!activeReportContainer) {
    console.error(
        "Element #activeReportContainer tidak ditemukan."
    );
}

if (!activeStatusBadge) {
    console.error(
        "Element #activeStatusBadge tidak ditemukan."
    );
}
if (!activeReportCount)
    console.error("Element #activeReportCount tidak ditemukan.");
if (!totalReportCount)
    console.error("Element #totalReportCount tidak ditemukan.");
if (!completedReportCount)
    console.error("Element #completedReportCount tidak ditemukan.");


/*
|--------------------------------------------------------------------------
| VALIDASI USER
|--------------------------------------------------------------------------
*/

if (!userId) {

    console.error(
        "ID user tidak ditemukan dari session."
    );

} else {

    loadUserReports();

}


/*
|--------------------------------------------------------------------------
| LOAD SEMUA LAPORAN
|--------------------------------------------------------------------------
*/

function loadUserReports() {

    const reportsRef =
        ref(db2, "public_panics");


    console.log(
        "Membaca Firebase:",
        "public_panics"
    );


    onValue(

        reportsRef,

        (snapshot) => {

            console.log(
                "Firebase snapshot:",
                snapshot.exists()
            );


            const data =
                snapshot.val() || {};


            console.log(
                "Semua data public_panics:",
                data
            );


            /*
            |--------------------------------------------------------------------------
            | UBAH OBJECT MENJADI ARRAY
            |--------------------------------------------------------------------------
            */

            const reports =
                Object.entries(data)
                    .map(
                        ([id, report]) => ({

                            id,

                            ...report

                        })
                    );


            console.log(
                "Total semua laporan:",
                reports.length
            );


            /*
            |--------------------------------------------------------------------------
            | FILTER BERDASARKAN USER LOGIN
            |--------------------------------------------------------------------------
            */

            const userReports =
                reports.filter(

                    report => {

                        const reportUserId =
                            report.user_id != null
                                ? String(report.user_id)
                                : "";

                        console.log(
                            "Periksa laporan:",
                            report.id,
                            "Firebase user_id:",
                            reportUserId,
                            "Login user_id:",
                            userId,
                            "MATCH:",
                            reportUserId === userId
                        );

                        return reportUserId === userId;

                    }

                );


            /*
            | -----------------------------------------------*---------------------------
            | HITUNG & RENDER STATISTIK (TOTAL, AKTIF, SELESAI)
            |--------------------------------------------------------------------------
            */
            const totalReports = userReports.length;

            const completedReports = userReports.filter(
                report => report.status === "completed"
            ).length;

            const activeReports = totalReports - completedReports;

            // Render angka ke HTML jika element tersedia
            if (totalReportCount) {
                totalReportCount.textContent = totalReports;
            }
            if (completedReportCount) {
                completedReportCount.textContent = completedReports;
            }
            if (activeReportCount) {
                activeReportCount.textContent = activeReports;
            }

            console.log(
                "Laporan milik user:",
                userReports
            );


            /*
            |--------------------------------------------------------------------------
            | URUTKAN TERBARU
            |--------------------------------------------------------------------------
            */

            userReports.sort(

                (a, b) =>
                    (b.created_at || 0)
                    -
                    (a.created_at || 0)

            );


            /*
            |--------------------------------------------------------------------------
            | CARI LAPORAN AKTIF
            |--------------------------------------------------------------------------
            */

            const activeReport =
                userReports.find(
                    report =>
                        report.status !== "completed"
                );

            console.log(
                "Laporan aktif:",
                activeReport
            );

            // Cek apakah sudah lewat 30 detik
            if (activeReport) {
                checkAutoOff(activeReport);
            }


            console.log(
                "Laporan aktif:",
                activeReport
            );


            /*
            |--------------------------------------------------------------------------
            | RENDER
            |--------------------------------------------------------------------------
            */

            renderActiveReport(
                activeReport
            );

        },


        (error) => {

            console.error(
                "Firebase error:",
                error
            );


        }

    );

}

/* 
|--------------------------------------------------------------------------
| AUTO OFF PANIC 30 DETIK
|--------------------------------------------------------------------------
*/

const PANIC_DURATION = 30 * 1000;

async function checkAutoOff(report) {

    // Hanya cek laporan yang masih aktif
    if (!report || report.status === "completed") {
        return;
    }

    // Kalau belum ada waktu dibuat, jangan lakukan apa-apa
    if (!report.created_at) {
        return;
    }

    const elapsed = Date.now() - Number(report.created_at);

    console.log(
        "Cek umur Panic:",
        Math.round(elapsed / 1000),
        "detik"
    );

    // Belum 30 detik
    if (elapsed < PANIC_DURATION) {
        return;
    }

    console.log(
        "Panic sudah lebih dari 30 detik."
    );

    /*
    |--------------------------------------------------------------------------
    | MATIKAN IOT
    |--------------------------------------------------------------------------
    */

    if (
        report.assigned_zone &&
        report.assigned_device
    ) {

        // Karena assigned_device berisi nama device,
        // kita perlu mencari deviceKey di panicChannels.
        const channelsRef = ref(
            db2,
            `panicChannels/${report.assigned_zone}`
        );

        try {

            const snapshot =
                await get(channelsRef);

            if (snapshot.exists()) {

                const devices =
                    snapshot.val();

                for (
                    const [deviceKey, deviceData]
                    of Object.entries(devices)
                ) {

                    if (!deviceData) {
                        continue;
                    }

                    const deviceName =
                        deviceData.device || deviceKey;

                    if (
                        deviceName === report.assigned_device
                    ) {

                        console.log(
                            "Device ditemukan:",
                            deviceKey
                        );

                        /*
                        |--------------------------------------------------------------------------
                        | Pastikan device memang milik panic ini
                        |--------------------------------------------------------------------------
                        */

                        if (
                            deviceData.assigned_panic_id &&
                            deviceData.assigned_panic_id !== report.id
                        ) {

                            console.warn(
                                "Device sedang digunakan panic lain."
                            );

                            break;
                        }

                        /*
                        |--------------------------------------------------------------------------
                        | MATIKAN DEVICE
                        |--------------------------------------------------------------------------
                        */

                        const deviceRef = ref(
                            db2,
                            `panicChannels/${report.assigned_zone}/${deviceKey}`
                        );

                        await update(
                            deviceRef,
                            {
                                active: false,
                                assigned_panic_id: "",
                                panic_latitude: null,
                                panic_longitude: null,
                                last_update: Date.now()
                            }
                        );

                        console.log(
                            "IoT berhasil dimatikan otomatis:",
                            deviceKey
                        );

                        break;
                    }
                }
            }

        } catch (error) {

            console.error(
                "Gagal mematikan IoT:",
                error
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE STATUS LAPORAN
    |--------------------------------------------------------------------------
    */

    try {

        const panicRef =
            ref(
                db2,
                `public_panics/${report.id}`
            );

        await update(
            panicRef,
            {
                status: "completed",
                device_auto_off: true,
                updated_at: Date.now()
            }
        );

        console.log(
            "Status panic diubah menjadi completed."
        );

    } catch (error) {

        console.error(
            "Gagal update status panic:",
            error
        );
    }
}

/*
|--------------------------------------------------------------------------
| RENDER LAPORAN AKTIF
|--------------------------------------------------------------------------
*/

function renderActiveReport(report) {

    if (!activeReportContainer ||
        !activeStatusBadge) {

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | TIDAK ADA LAPORAN AKTIF
    |--------------------------------------------------------------------------
    */

    if (!report) {

        activeStatusBadge.textContent =
            "Tidak Ada";


        activeStatusBadge.className =
            "status-badge status-none";


        activeReportContainer.innerHTML = `

            <div class="empty-state">

                <h3>
                    Tidak Ada Laporan Aktif
                </h3>

                <p>
                    Saat ini lingkungan Anda dalam kondisi aman. Tekan tombol Panic jika sewaktu-waktu membutuhkan pertolongan.
                </p>


            </div>

        `;

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    updateStatusBadge(
        report.status
    );


    /*
    |--------------------------------------------------------------------------
    | TAMPILKAN LAPORAN
    |--------------------------------------------------------------------------
    */

    activeReportContainer.innerHTML = `

        <div class="active-report">

            <div class="active-report-top">

                <div>

                    <h3 class="report-title">
                        🚨 Panic Button
                    </h3>

                    

                </div>


                <span
                    class="status-badge ${getStatusClass(report.status)}"
                >

                    ${formatStatus(report.status)}

                </span>

            </div>


            <div class="report-grid">

                <div class="report-info">

                    <span class="report-info-label">
                        Waktu Laporan
                    </span>

                    <span class="report-info-value">

                        ${formatDate(
        report.created_at
    )}

                    </span>

                </div>


                <div class="report-info">

                    <span class="report-info-label">
                        Update Terakhir
                    </span>

                    <span class="report-info-value">

                        ${formatDate(
        report.updated_at
    )}

                    </span>

                </div>


                <div class="report-info">

                    <span class="report-info-label">
                        Status
                    </span>

                    <span class="report-info-value">

                        ${formatStatus(
        report.status
    )}

                    </span>

                </div>

            </div>


            <div class="report-location">

                <span class="report-location-label">
                    Lokasi
                </span>

                <span class="report-location-value">

                    ${escapeHtml(
        report.address || "-"
    )}

                </span>

            </div>

        </div>

    `;

}


/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

function updateStatusBadge(status) {

    if (!activeStatusBadge) {
        return;
    }


    activeStatusBadge.textContent =
        formatStatus(status);


    activeStatusBadge.className =
        `status-badge ${getStatusClass(status)}`;

}

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

function formatStatus(status) {

    const statusMap = {

        active:
            "Panic Aktif",

        received:
            "Laporan Diterima",

        handling:
            "Sedang Ditangani",

        dispatched:
            "Petugas Menuju Lokasi",

        completed:
            "Selesai"

    };


    return statusMap[status]
        || "Tidak Diketahui";

}


function getStatusClass(status) {

    const classMap = {

        active:
            "status-active",

        received:
            "status-received",

        handling:
            "status-handling",

        dispatched:
            "status-handling",

        completed:
            "status-completed"

    };


    return classMap[status]
        || "status-none";

}


/*
|--------------------------------------------------------------------------
| FORMAT TANGGAL
|--------------------------------------------------------------------------
*/

function formatDate(timestamp) {

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
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


/*
|--------------------------------------------------------------------------
| ESCAPE HTML
|--------------------------------------------------------------------------
*/

function escapeHtml(value = "") {

    return String(value)

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