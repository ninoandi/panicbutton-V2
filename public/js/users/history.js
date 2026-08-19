import { db2 } from "../firebase-config.js";

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


document.addEventListener("DOMContentLoaded", () => {

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
    console.log("HISTORY USER");
    console.log("Current User:", currentUser);
    console.log("User ID:", userId);
    console.log("=================================");


    /*
    |--------------------------------------------------------------------------
    | ELEMENT
    |--------------------------------------------------------------------------
    */

    const historyContainer =
        document.getElementById("historyContainer");


    if (!historyContainer) {

        console.error(
            "Element #historyContainer tidak ditemukan."
        );

        return;

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


        historyContainer.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>
                    User tidak ditemukan
                </h3>

                <p>
                    Silakan login kembali.
                </p>

            </div>

        `;

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | LOAD HISTORY
    |--------------------------------------------------------------------------
    */

    loadHistory();


    function loadHistory() {

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
                | OBJECT → ARRAY
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
                | FILTER USER
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
                | RENDER
                |--------------------------------------------------------------------------
                */

                renderHistory(
                    userReports
                );

            },


            (error) => {

                console.error(
                    "Firebase error:",
                    error
                );


                historyContainer.innerHTML = `

                    <div class="empty-state">

                        <div class="empty-icon">
                            ⚠️
                        </div>

                        <h3>
                            Gagal mengambil data
                        </h3>

                        <p>
                            Terjadi kesalahan saat membaca
                            riwayat laporan.
                        </p>

                    </div>

                `;

            }

        );

    }


    /*
    |--------------------------------------------------------------------------
    | RENDER HISTORY
    |--------------------------------------------------------------------------
    */

    function renderHistory(reports) {

        /*
        |--------------------------------------------------------------------------
        | TIDAK ADA DATA
        |--------------------------------------------------------------------------
        */

        if (reports.length === 0) {

            historyContainer.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        📋
                    </div>

                    <h3>
                        Belum ada riwayat laporan
                    </h3>

                    <p>
                        Laporan Panic Button Anda
                        akan muncul di sini.
                    </p>

                </div>

            `;

            return;

        }


        /*
        |--------------------------------------------------------------------------
        | TAMPILKAN DATA
        |--------------------------------------------------------------------------
        */

        historyContainer.innerHTML =

            reports
                .map(

                    report => `

                        <div class="history-item">

                            <div class="history-main">

                                <strong>
                                    🚨 Panic Button
                                </strong>


                                <div class="history-details">

                                    <span>

                                        ID:
                                        ${escapeHtml(
                                            report.id
                                        )}

                                    </span>


                                    <span>

                                        ${formatDate(
                                            report.created_at
                                        )}

                                    </span>


                                    <span>

                                        ${escapeHtml(
                                            report.address || "-"
                                        )}

                                    </span>

                                </div>

                            </div>


                            <span
                                class="status-badge ${getStatusClass(report.status)}"
                            >

                                ${formatStatus(
                                    report.status
                                )}

                            </span>

                        </div>

                    `

                )
                .join("");

    }


    /*
    |--------------------------------------------------------------------------
    | FORMAT STATUS
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


    /*
    |--------------------------------------------------------------------------
    | STATUS CLASS
    |--------------------------------------------------------------------------
    */

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

});