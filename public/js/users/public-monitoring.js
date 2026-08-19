import { db2 } from "../firebase-config.js";

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


const panicAlert =
    document.getElementById("publicPanicAlert");

const panicCount =
    document.getElementById("publicPanicCount");

const now = Date.now();
const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);


if (!panicAlert) {

    console.error(
        "publicPanicAlert tidak ditemukan."
    );

} else {

    const panicRef =
        ref(db2, "public_panics");


    onValue(
        panicRef,

        snapshot => {

            const data =
                snapshot.val() || {};


            const reports =
                Object.entries(data)
                    .map(([id, report]) => ({
                        id,
                        ...report
                    }));


            const activeReports = reports
                .filter(
                    report =>{
                        const isActive = report.status === "active";
        
                        const isRecent = report.created_at >= twentyFourHoursAgo;
                        
                        return isActive && isRecent; 
                    }
                       

                )
                .sort((a, b) => {
                    // 3. Urutkan data berdasarkan created_at dari yang terbesar (terbaru) ke terkecil (terlama)
                    return b.created_at - a.created_at;
                });


            // ==========================================
            // JUMLAH PANIC
            // ==========================================

            if (panicCount) {

                panicCount.textContent =
                    `${activeReports.length} Kejadian`;

            }


            // ==========================================
            // TIDAK ADA PANIC
            // ==========================================

            if (activeReports.length === 0) {

                panicAlert.innerHTML = `

                    <div class="live-empty">

                        <div class="empty-icon">
                            🚨
                        </div>

                        <strong>
                            Tidak ada panic publik aktif
                        </strong>

                        <span>
                            Sistem sedang memantau kondisi secara realtime.
                        </span>

                    </div>

                `;

                return;
            }


            // ==========================================
            // TAMPILKAN PANIC
            // ==========================================

            panicAlert.innerHTML =
                activeReports
                    .map(report => `

                        <div class="public-panic-item">

                            <div class="panic-item-icon">
                                🚨
                            </div>

                            <div class="panic-item-content">

                                <strong>
                                    Panic Button Aktif
                                </strong>

                                <span>
                                    Lokasi:
                                    ${escapeHtml(
                                        report.address || "-"
                                    )}
                                </span>

                                <small>
                                    ${formatDate(
                                        report.created_at
                                    )}
                                </small>

                            </div>

                        </div>

                    `)
                    .join("");

        },

        error => {

            console.error(
                "Gagal membaca Firebase:",
                error
            );

            panicAlert.innerHTML = `

                <div class="live-empty">

                    <strong>
                        Gagal mengambil data kejadian.
                    </strong>

                </div>

            `;

        }
    );

}


function formatDate(timestamp) {

    if (!timestamp) {
        return "-";
    }

    return new Date(timestamp)
        .toLocaleString(
            "id-ID",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );
}


function escapeHtml(value = "") {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}