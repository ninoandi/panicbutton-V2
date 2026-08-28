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
    console.log("HISTORY USER - DIMULAI");
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
    | STATE
    |--------------------------------------------------------------------------
    */

    let reportsMap = {};
    let renderTimeout = null;


    /*
    |--------------------------------------------------------------------------
    | LOAD HISTORY - LISTENER PUBLIC_PANICS SAJA
    |--------------------------------------------------------------------------
    */

    loadHistory();


    function loadHistory() {

        const publicPanicsRef =
            ref(db2, "public_panics");


        console.log(
            "📡 Mendengarkan: public_panics"
        );


        onValue(

            publicPanicsRef,

            (snapshot) => {

                const data =
                    snapshot.val() || {};


                console.log(
                    "📊 Data public_panics:",
                    Object.keys(data).length,
                    "laporan"
                );


                processPublicPanicsData(data);
                scheduleRender();

            },

            (error) => {

                console.error(
                    "❌ Error public_panics:",
                    error
                );

            }

        );

    }


    /*
    |--------------------------------------------------------------------------
    | GET USER ID DARI REPORT
    |--------------------------------------------------------------------------
    */

    function getReportUserId(report) {
        
        if (report.user_id != null && report.user_id !== "") {
            return String(report.user_id);
        }
        
        if (report.userId != null && report.userId !== "") {
            return String(report.userId);
        }
        
        if (report.uid != null && report.uid !== "") {
            return String(report.uid);
        }
        
        if (report.user && report.user.id != null) {
            return String(report.user.id);
        }
        
        if (report.user && report.user.user_id != null) {
            return String(report.user.user_id);
        }
        
        if (report.sender && report.sender.id != null) {
            return String(report.sender.id);
        }
        
        if (report.pelapor && report.pelapor.id != null) {
            return String(report.pelapor.id);
        }
        
        return null;
    }


    /*
    |--------------------------------------------------------------------------
    | CEK APAKAH LAPORAN MILIK USER
    |--------------------------------------------------------------------------
    */

    function isUserReport(report) {
        
        const userIdStr = String(userId);
        const reportUserId = getReportUserId(report);
        
        if (!reportUserId) {
            return false;
        }
        
        return reportUserId === userIdStr;
    }


    /*
    |--------------------------------------------------------------------------
    | PROCESS PUBLIC_PANICS DATA
    |--------------------------------------------------------------------------
    */

    function processPublicPanicsData(data) {

        const userIdStr = String(userId);
        let processedCount = 0;

        Object.entries(data).forEach(
            ([id, report]) => {

                const reportUserId = getReportUserId(report);

                console.log(
                    `🔍 Cek public_panics: ${id}`,
                    `| User ID di Firebase: "${reportUserId}"`,
                    `| User ID Login: "${userIdStr}"`
                );

                // 🔥 HANYA tampilkan laporan milik user ini
                if (!isUserReport(report)) {
                    console.log(`⏭️ Laporan ${id} BUKAN milik user ini`);
                    return;
                }

                const key = `public_panics_${id}`;

                // 🔥 TAMPILKAN STATUS APA ADANYA DARI FIREBASE
                const reportData = {
                    id: id,
                    _source: "public_panics",
                    _id: id,
                    user_id: reportUserId,
                    user_name: report.name || 
                              report.senderName || 
                              report.user_name || 
                              currentUser.name || 
                              "Pengguna",
                    // 🔥 STATUS LANGSUNG DARI FIREBASE
                    status: report.status || "menunggu",
                    address: report.address || 
                            report.location || 
                            report.lokasi || 
                            "Lokasi tidak tersedia",
                    latitude: report.latitude || null,
                    longitude: report.longitude || null,
                    location_url: report.location_url || 
                                 report.locationUrl || 
                                 null,
                    note: report.note || 
                         report.description || 
                         report.keterangan || 
                         "",
                    device: report.device || 
                           report.assigned_device || 
                           "IoT Device",
                    phone: report.phone || 
                          report.telepon || 
                          report.user_phone || 
                          "-",
                    created_at: report.created_at || 
                               report.timestamp || 
                               report.time || 
                               Date.now(),
                    updated_at: report.updated_at || Date.now()
                };

                // 🔥 LANGSUNG SIMPAN DENGAN STATUS TERBARU
                reportsMap[key] = reportData;
                processedCount++;
                console.log(`✅ ${id} status: ${reportData.status}`);

            }
        );

        console.log(`📋 Total laporan: ${processedCount} untuk user ini`);

    }


    /*
    |--------------------------------------------------------------------------
    | SCHEDULE RENDER
    |--------------------------------------------------------------------------
    */

    function scheduleRender() {

        if (renderTimeout) {
            clearTimeout(renderTimeout);
        }

        renderTimeout = setTimeout(
            () => {
                renderAllReports();
                renderTimeout = null;
            },
            200
        );

    }


    /*
    |--------------------------------------------------------------------------
    | RENDER ALL REPORTS
    |--------------------------------------------------------------------------
    */

    function renderAllReports() {

        const reports = Object.values(reportsMap);
        
        const filteredReports = reports.filter(report => {
            const reportUserId = report.user_id != null ? String(report.user_id) : null;
            return reportUserId === String(userId);
        });

        filteredReports.sort(
            (a, b) =>
                (b.created_at || 0) -
                (a.created_at || 0)
        );

        console.log(
            "🔄 Total laporan:",
            filteredReports.length,
            "dengan status:",
            filteredReports.map(r => `${r.id}: ${r.status}`).join(", ")
        );

        if (filteredReports.length === 0) {

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


        historyContainer.innerHTML =

            filteredReports
                .map(

                    report => `

                        <div class="history-item">

                            <div class="history-main">

                                <strong>
                                    🚨 Panic Button
                                </strong>


                                <div class="history-details">

                                    <span>

                                        ${formatDate(
                                            report.created_at
                                        )}

                                    </span>


                                    <div class="location-info">

                                        <span class="location-text">
                                            📍
                                            ${escapeHtml(
                                                report.address || "Lokasi tidak tersedia"
                                            )}
                                        </span>

                                        ${report.location_url || (report.latitude && report.longitude)
                                            ? `
                                                <a
                                                    href="${report.location_url || `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`}"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    class="location-link"
                                                >
                                                    Lihat lokasi
                                                </a>
                                            `
                                            : ""
                                        }

                                    </div>

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

        const normalizedStatus =
            String(status || "")
                .toLowerCase()
                .trim();

        const statusMap = {

            'active': 'Panic Aktif',
            'menunggu': 'Menunggu',
            'waiting': 'Menunggu',
            'diproses': 'Sedang Diproses',
            'processing': 'Sedang Diproses',
            'process': 'Sedang Diproses',
            'completed': 'Selesai',
            'done': 'Selesai',
            'selesai': 'Selesai',
            'finish': 'Selesai'

        };

        return statusMap[normalizedStatus] || 'Menunggu';

    }


    /*
    |--------------------------------------------------------------------------
    | STATUS CLASS
    |--------------------------------------------------------------------------
    */

    function getStatusClass(status) {

        const normalizedStatus =
            String(status || "")
                .toLowerCase()
                .trim();

        const classMap = {

            'active': 'status-active',
            'menunggu': 'status-waiting',
            'waiting': 'status-waiting',
            'diproses': 'status-processing',
            'processing': 'status-processing',
            'process': 'status-processing',
            'completed': 'status-completed',
            'done': 'status-completed',
            'selesai': 'status-completed',
            'finish': 'status-completed'

        };

        return classMap[normalizedStatus] || 'status-waiting';

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