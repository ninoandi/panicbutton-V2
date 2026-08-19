import { db2 } from "../firebase-config.js";

import {
    ref,
    onValue
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

                <div class="empty-icon">
                    🚨
                </div>

                <h3>
                    Tidak ada laporan aktif
                </h3>

                <p>
                    Belum ada laporan Panic Button
                    yang sedang diproses.
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

                    <div class="report-id">

                        ID Laporan:
                        ${escapeHtml(report.id)}

                    </div>

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