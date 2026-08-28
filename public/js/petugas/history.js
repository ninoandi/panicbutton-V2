import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";
import { db1, db2 } from "../firebase-config.js";

import {
    ref,
    onValue,
    update,
    get
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       1. ELEMENT
    ========================================================= */

    // Containers
    const waitingCardsContainer =
        document.getElementById("waitingCardsContainer");

    const processCardsContainer =
        document.getElementById("processCardsContainer");

    const doneCardsContainer =
        document.getElementById("doneCardsContainer");


    // Counters
    const countWaiting =
        document.getElementById("countWaiting");

    const countProcess =
        document.getElementById("countProcess");

    const countDone =
        document.getElementById("countDone");


    // Search & Filter
    const searchReportsInput =
        document.getElementById("searchReportsInput");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const btnRefreshHistory =
        document.getElementById("btnRefreshHistory");


    // Modal Detail
    const detailReportModal =
        document.getElementById("detailReportModal");

    const btnCloseDetailModal =
        document.getElementById("btnCloseDetailModal");

    const btnCancelDetailModal =
        document.getElementById("btnCancelDetailModal");

    const btnSaveStatusChange =
        document.getElementById("btnSaveStatusChange");

    const modalReportId =
        document.getElementById("modalReportId");

    const modalReportSource =
        document.getElementById("modalReportSource");

    const modalReportPerumahanKey =
        document.getElementById("modalReportPerumahanKey");

    const modalDetailContent =
        document.getElementById("modalDetailContent");

    const officerResponseNote =
        document.getElementById("officerResponseNote");

    const radioStatusCards =
        document.querySelectorAll(".status-radio-card");


    /* =========================================================
       2. STATUS CONFIG
    ========================================================= */

    const STATUS = {
        MENUNGGU: "menunggu",
        DIPROSES: "diproses",
        SELESAI: "completed"
    };


    function normalizeStatus(status) {

        const s = String(status || "")
            .toLowerCase()
            .trim();

        // Status selesai
        if (
            s === "completed" ||
            s === "selesai" ||
            s === "done"
        ) {
            return STATUS.SELESAI;
        }


        // Status sedang diproses
        if (
            s === "diproses" ||
            s === "proses" ||
            s === "process" ||
            s === "processing" ||
            s === "handling"
        ) {
            return STATUS.DIPROSES;
        }


        // Status active dari panic
        if (
            s === "active" ||
            s === "aktif"
        ) {
            return STATUS.MENUNGGU;
        }


        // Menunggu
        if (
            s === "menunggu" ||
            s === "waiting" ||
            s === ""
        ) {
            return STATUS.MENUNGGU;
        }


        // Default
        return STATUS.MENUNGGU;
    }


    function getStatusLabel(status) {

        const normalized =
            normalizeStatus(status);

        if (normalized === STATUS.DIPROSES) {
            return "Diproses";
        }

        if (normalized === STATUS.SELESAI) {
            return "Selesai";
        }

        return "Menunggu";
    }


    /* =========================================================
       3. CLOSE MODAL
    ========================================================= */

    if (btnCloseDetailModal) {

        btnCloseDetailModal.addEventListener(
            "click",
            closeModal
        );

    }


    if (btnCancelDetailModal) {

        btnCancelDetailModal.addEventListener(
            "click",
            closeModal
        );

    }


    if (detailReportModal) {

        detailReportModal.addEventListener(
            "click",
            (e) => {

                if (e.target === detailReportModal) {
                    closeModal();
                }

            }
        );

    }


    function closeModal() {

        if (detailReportModal) {
            detailReportModal.style.display = "none";
        }

    }


    /* =========================================================
       4. RADIO STATUS SELECTION
    ========================================================= */

    radioStatusCards.forEach(card => {

        card.addEventListener("click", () => {

            const radio =
                card.querySelector(
                    "input[type='radio']"
                );

            if (radio) {
                radio.checked = true;
            }


            radioStatusCards.forEach(c => {
                c.classList.remove("active-selected");
            });


            card.classList.add(
                "active-selected"
            );

        });

    });


    function setModalStatusRadio(statusVal) {

        const normalized =
            normalizeStatus(statusVal);

        radioStatusCards.forEach(card => {

            const cardValue =
                card.getAttribute("data-val");

            const normalizedCardValue =
                normalizeStatus(cardValue);

            const radio =
                card.querySelector(
                    "input[type='radio']"
                );


            if (
                normalizedCardValue === normalized
            ) {

                if (radio) {
                    radio.checked = true;
                }

                card.classList.add(
                    "active-selected"
                );

            } else {

                if (radio) {
                    radio.checked = false;
                }

                card.classList.remove(
                    "active-selected"
                );

            }

        });

    }


    function getSelectedRadioStatus() {

        const checked =
            document.querySelector(
                "input[name='radioStatus']:checked"
            );

        if (!checked) {
            return STATUS.MENUNGGU;
        }


        return normalizeStatus(
            checked.value
        );

    }


    /* =========================================================
       5. STATE VARIABLES
    ========================================================= */

    let allReports = [];

    let rawHousingReports = [];

    let rawPublicReports = [];

    let rawPublicPanics = [];


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


    /* =========================================================
       6. DEDUPLIKASI LAPORAN
    ========================================================= */

    function deduplicateReports(reports) {
        
        const reportMap = new Map();
        
        reports.forEach(report => {
            
            let key = report.id;
            
            if (report.source === "perumahan" && report.perumahanKey) {
                key = `${report.perumahanKey}_${report.id}`;
            }
            
            if (reportMap.has(key)) {
                const existing = reportMap.get(key);
                
                const existingTime = existing.updated_at || existing.time || 0;
                const newTime = report.updated_at || report.time || 0;
                
                if (newTime > existingTime) {
                    reportMap.set(key, report);
                    console.log(`🔄 Update data untuk ${key} dengan status: ${report.status}`);
                }
            } else {
                reportMap.set(key, report);
            }
        });
        
        return Array.from(reportMap.values());
    }


    /* =========================================================
       7. FIREBASE REALTIME LISTENER
       DB1 - LAPORAN PERUMAHAN
    ========================================================= */

    const perumahanRef =
        ref(db1, "perumahan");


    onValue(
        perumahanRef,
        (snapshot) => {

            const data =
                snapshot.val() || {};

            rawHousingReports = [];


            Object.entries(data).forEach(
                ([pKey, pVal]) => {

                    if (
                        !pVal ||
                        typeof pVal !== "object" ||
                        pKey === "buzzers"
                    ) {
                        return;
                    }


                    const pName =
                        pVal.info?.nama ||
                        pVal.nama ||
                        pKey;


                    if (pVal.reports) {

                        Object.entries(
                            pVal.reports
                        ).forEach(
                            ([rId, rVal]) => {

                                if (!rVal) {
                                    return;
                                }


                                rawHousingReports.push({

                                    id: rId,

                                    source:
                                        "perumahan",

                                    perumahanKey:
                                        pKey,

                                    perumahanName:
                                        pName,

                                    userName:
                                        rVal.userName ||
                                        rVal.nama_warga ||
                                        rVal.nama ||
                                        "Warga Perumahan",

                                    userPhone:
                                        rVal.phoneNumber ||
                                        rVal.phone ||
                                        rVal.telepon ||
                                        "-",

                                    location:
                                        rVal.houseNumber
                                            ? `Rumah No. ${rVal.houseNumber} (${pName})`
                                            : pName,

                                    houseNumber:
                                        rVal.houseNumber ||
                                        "-",

                                    time:
                                        rVal.timestamp ||
                                        rVal.time ||
                                        rVal.created_at ||
                                        Date.now(),

                                    updated_at:
                                        rVal.updated_at ||
                                        rVal.timestamp ||
                                        Date.now(),

                                    rawStatus:
                                        String(
                                            rVal.status ||
                                            STATUS.MENUNGGU
                                        )
                                        .toLowerCase()
                                        .trim(),

                                    status:
                                        normalizeStatus(
                                            rVal.status
                                        ),

                                    note:
                                        rVal.note ||
                                        rVal.keterangan ||
                                        rVal.catatan ||
                                        "-",

                                    device:
                                        rVal.device ||
                                        rVal.buzzer_name ||
                                        "Buzzer Perumahan",

                                    latitude:
                                        rVal.latitude ||
                                        null,

                                    longitude:
                                        rVal.longitude ||
                                        null

                                });

                            }
                        );

                    }

                }
            );


            mergeAndRenderReports();

        },

        (err) => {

            console.error(
                "DB1 load reports error:",
                err
            );

        }
    );


    /* =========================================================
       8. FIREBASE REALTIME LISTENER
       DB2 - PUBLIC PANICS
    ========================================================= */

    const publicPanicsRef =
        ref(db2, "public_panics");


    onValue(
        publicPanicsRef,
        (snapshot) => {

            const data =
                snapshot.val() || {};

            rawPublicPanics = [];

            Object.entries(data).forEach(
                ([rId, rVal]) => {

                    const reportUserId = getReportUserId(rVal);
                    const hasUserId = reportUserId !== null;

                    // 🔥 Cek apakah sudah ada di rawPublicReports
                    const existsInReports = rawPublicReports.some(
                        r => r.id === rId
                    );

                    if (existsInReports) {
                        console.log(`⏭️ Laporan ${rId} sudah ada di reports, skip dari public_panics`);
                        return;
                    }

                    rawPublicPanics.push({

                        id: rId,

                        source:
                            "public",

                        dbTable:
                            "public_panics",

                        perumahanKey:
                            "",

                        perumahanName:
                            "Area Publik",

                        userName:
                            hasUserId 
                                ? (rVal.senderName || rVal.name || rVal.user_name || "Warga Publik")
                                : "🟡 Tanpa Login (Publik)",

                        userPhone:
                            rVal.phone ||
                            rVal.telepon ||
                            "-",

                        location:
                            rVal.address ||
                            rVal.lokasi ||
                            (
                                rVal.latitude &&
                                rVal.longitude
                                    ? `${rVal.latitude}, ${rVal.longitude}`
                                    : "Area Publik"
                            ),

                        houseNumber:
                            "-",

                        time:
                            rVal.created_at ||
                            rVal.timestamp ||
                            Date.now(),

                        updated_at:
                            rVal.updated_at ||
                            rVal.created_at ||
                            Date.now(),

                        rawStatus:
                            String(
                                rVal.status ||
                                STATUS.MENUNGGU
                            )
                            .toLowerCase()
                            .trim(),

                        status:
                            normalizeStatus(
                                rVal.status
                            ),

                        note:
                            rVal.description ||
                            rVal.note ||
                            rVal.keterangan ||
                            "-",

                        device:
                            rVal.assigned_device ||
                            rVal.device ||
                            "IoT Panic Device",

                        latitude:
                            rVal.latitude ||
                            null,

                        longitude:
                            rVal.longitude ||
                            null,

                        locationUrl:
                            rVal.locationUrl ||
                            null,

                        hasUserId: hasUserId

                    });

                }
            );


            mergeAndRenderReports();

        },

        (err) => {

            console.error(
                "DB2 load public_panics error:",
                err
            );

        }
    );


    /* =========================================================
       9. FIREBASE REALTIME LISTENER
       DB2 - PUBLIC REPORTS
    ========================================================= */

    const publicReportsRef =
        ref(db2, "reports");


    onValue(
        publicReportsRef,
        (snapshot) => {

            const data =
                snapshot.val() || {};

            rawPublicReports = [];

            Object.entries(data).forEach(
                ([rId, rVal]) => {

                    const reportUserId = getReportUserId(rVal);
                    const hasUserId = reportUserId !== null;

                    // 🔥 Cek apakah sudah ada di rawPublicPanics
                    const existsInPanics = rawPublicPanics.some(
                        r => r.id === rId
                    );

                    if (existsInPanics) {
                        // Update status di rawPublicPanics
                        const index = rawPublicPanics.findIndex(r => r.id === rId);
                        if (index !== -1) {
                            rawPublicPanics[index].status = normalizeStatus(rVal.status);
                            rawPublicPanics[index].rawStatus = String(rVal.status || "").toLowerCase().trim();
                            rawPublicPanics[index].updated_at = rVal.updated_at || Date.now();
                            console.log(`🔄 Update status di public_panics untuk ${rId}: ${rVal.status}`);
                        }
                        return;
                    }

                    rawPublicReports.push({

                        id:
                            rId,

                        source:
                            "public",

                        dbTable:
                            "reports",

                        perumahanKey:
                            "",

                        perumahanName:
                            "Area Publik",

                        userName:
                            hasUserId
                                ? (rVal.user_name || rVal.name || rVal.senderName || "Pengguna Publik")
                                : "🟡 Tanpa Login (Publik)",

                        userPhone:
                            rVal.phone ||
                            rVal.telepon ||
                            "-",

                        location:
                            rVal.location ||
                            rVal.address ||
                            "Area Publik",

                        houseNumber:
                            "-",

                        time:
                            rVal.timestamp ||
                            rVal.created_at ||
                            Date.now(),

                        updated_at:
                            rVal.updated_at ||
                            rVal.created_at ||
                            Date.now(),

                        rawStatus:
                            String(
                                rVal.status ||
                                STATUS.MENUNGGU
                            )
                            .toLowerCase()
                            .trim(),

                        status:
                            normalizeStatus(
                                rVal.status
                            ),

                        note:
                            rVal.description ||
                            rVal.note ||
                            rVal.keterangan ||
                            "-",

                        device:
                            rVal.device ||
                            "Aplikasi Publik",

                        latitude:
                            rVal.latitude ||
                            null,

                        longitude:
                            rVal.longitude ||
                            null,

                        locationUrl:
                            rVal.locationUrl ||
                            null,

                        hasUserId: hasUserId

                    });

                }
            );


            mergeAndRenderReports();

        },

        (err) => {

            console.error(
                "DB2 load reports error:",
                err
            );

        }
    );


    /* =========================================================
       10. MERGE & RENDER DENGAN DEDUPLIKASI
    ========================================================= */

    function mergeAndRenderReports() {

        let mergedReports = [

            ...rawHousingReports,

            ...rawPublicPanics,

            ...rawPublicReports

        ];

        // 🔥 DEDUPLIKASI
        mergedReports = deduplicateReports(mergedReports);

        mergedReports.sort(
            (a, b) => {

                const timeA =
                    typeof a.time === "number"
                        ? a.time
                        : new Date(
                            a.time
                        ).getTime() || 0;


                const timeB =
                    typeof b.time === "number"
                        ? b.time
                        : new Date(
                            b.time
                        ).getTime() || 0;


                return timeB - timeA;

            }
        );

        allReports = mergedReports;

        filterAndRenderBoard();

    }


    /* =========================================================
       11. FILTER & KANBAN BOARD
    ========================================================= */

    function filterAndRenderBoard() {

        const keyword =
            (
                searchReportsInput
                    ? searchReportsInput.value
                    : ""
            )
            .trim()
            .toLowerCase();


        const category =
            categoryFilter
                ? categoryFilter.value
                : "all";


        const waitingList = [];

        const processList = [];

        const doneList = [];


        allReports.forEach(report => {

            if (
                category !== "all" &&
                report.source !== category
            ) {
                return;
            }


            if (keyword) {

                const matchUser =
                    (
                        report.userName ||
                        ""
                    )
                    .toLowerCase()
                    .includes(keyword);


                const matchLoc =
                    (
                        report.location ||
                        ""
                    )
                    .toLowerCase()
                    .includes(keyword);


                const matchNote =
                    (
                        report.note ||
                        ""
                    )
                    .toLowerCase()
                    .includes(keyword);


                const matchPName =
                    (
                        report.perumahanName ||
                        ""
                    )
                    .toLowerCase()
                    .includes(keyword);


                if (
                    !matchUser &&
                    !matchLoc &&
                    !matchNote &&
                    !matchPName
                ) {
                    return;
                }

            }


            if (
                report.status ===
                STATUS.MENUNGGU
            ) {

                waitingList.push(report);

            }

            else if (
                report.status ===
                STATUS.DIPROSES
            ) {

                processList.push(report);

            }

            else if (
                report.status ===
                STATUS.SELESAI
            ) {

                doneList.push(report);

            }

        });


        if (countWaiting) {
            countWaiting.textContent =
                waitingList.length;
        }


        if (countProcess) {
            countProcess.textContent =
                processList.length;
        }


        if (countDone) {
            countDone.textContent =
                doneList.length;
        }


        renderColumn(
            waitingCardsContainer,
            waitingList,
            STATUS.MENUNGGU
        );


        renderColumn(
            processCardsContainer,
            processList,
            STATUS.DIPROSES
        );


        renderColumn(
            doneCardsContainer,
            doneList,
            STATUS.SELESAI
        );

    }


    /* =========================================================
       12. RENDER CARD
    ========================================================= */

    function renderColumn(
        container,
        items,
        columnStatus
    ) {

        if (!container) {
            return;
        }


        const statusLabel =
            getStatusLabel(
                columnStatus
            );


        if (items.length === 0) {

            let emptyMsg =
                "Tidak ada laporan dalam status ini.";

            let iconClass =
                "fa-clipboard-check";


            if (
                columnStatus ===
                STATUS.MENUNGGU
            ) {

                emptyMsg =
                    "Tidak ada laporan yang menunggu respon.";

                iconClass =
                    "fa-hourglass";

            }

            else if (
                columnStatus ===
                STATUS.DIPROSES
            ) {

                emptyMsg =
                    "Tidak ada laporan yang sedang diproses.";

                iconClass =
                    "fa-person-circle-check";

            }

            else if (
                columnStatus ===
                STATUS.SELESAI
            ) {

                emptyMsg =
                    "Belum ada riwayat laporan selesai.";

                iconClass =
                    "fa-box-archive";

            }


            container.innerHTML = `

                <div class="board-empty-state">

                    <i class="fa-solid ${iconClass}"></i>

                    <p>${emptyMsg}</p>

                </div>

            `;

            return;

        }


        container.innerHTML =
            items.map(report => {

                const formattedTime =
                    formatReportTime(
                        report.time
                    );


                const isUrgent =
                    columnStatus ===
                    STATUS.MENUNGGU;


                let advanceButtonHtml =
                    "";


                if (
                    columnStatus ===
                    STATUS.MENUNGGU
                ) {

                    advanceButtonHtml = `

                        <button
                            type="button"
                            class="btn-card-advance btn-advance-process"
                            onclick="
                                window.quickChangeStatus(
                                    '${escapeHtml(report.id)}',
                                    '${escapeHtml(report.source)}',
                                    '${escapeHtml(report.perumahanKey || "")}',
                                    'diproses',
                                    '${escapeHtml(report.dbTable || "")}'
                                )
                            "
                        >

                            <i class="fa-solid fa-person-running"></i>

                            <span>Proses Sekarang</span>

                        </button>

                    `;

                }


                else if (
                    columnStatus ===
                    STATUS.DIPROSES
                ) {

                    advanceButtonHtml = `

                        <button
                            type="button"
                            class="btn-card-advance btn-advance-done"
                            onclick="
                                window.quickChangeStatus(
                                    '${escapeHtml(report.id)}',
                                    '${escapeHtml(report.source)}',
                                    '${escapeHtml(report.perumahanKey || "")}',
                                    'completed',
                                    '${escapeHtml(report.dbTable || "")}'
                                )
                            "
                        >

                            <i class="fa-solid fa-check-double"></i>

                            <span>Selesaikan</span>

                        </button>

                    `;

                }


                return `

                    <div
                        class="
                            report-card-item
                            ${isUrgent ? "is-urgent" : ""}
                        "
                        id="report_card_${escapeHtml(report.id)}"
                    >

                        <div class="report-card-header">

                            <span
                                class="
                                    category-tag
                                    ${
                                        report.source ===
                                        "perumahan"

                                            ? "perumahan"

                                            : "public"
                                    }
                                "
                            >

                                <i
                                    class="
                                        ${
                                            report.source ===
                                            "perumahan"

                                                ? "fa-solid fa-building-shield"

                                                : "fa-solid fa-tower-cell"
                                        }
                                    "
                                ></i>

                                ${
                                    report.source ===
                                    "perumahan"

                                        ? "Perumahan"

                                        : "Public"
                                }

                            </span>


                            <span
                                class="report-card-time"
                            >

                                <i class="fa-regular fa-clock"></i>

                                ${formattedTime}

                            </span>

                        </div>


                        <div class="report-card-body">

                            <strong
                                class="report-user-name"
                            >

                                <i class="fa-regular fa-user"></i>

                                ${escapeHtml(
                                    report.userName
                                )}

                            </strong>


                            <span
                                class="
                                    report-location-info
                                "
                            >

                                <i
                                    class="
                                        fa-solid
                                        fa-location-dot
                                    "
                                ></i>

                                ${escapeHtml(
                                    report.location
                                )}

                            </span>


                            ${
                                report.note &&
                                report.note !== "-"

                                    ? `

                                        <div
                                            class="
                                                report-note-box
                                            "
                                        >

                                            <i
                                                class="
                                                    fa-regular
                                                    fa-comment-dots
                                                "
                                            ></i>

                                            ${escapeHtml(
                                                report.note
                                            )}

                                        </div>

                                    `

                                    : ""
                            }

                        </div>


                        <div
                            class="report-card-actions"
                        >

                            <button
                                type="button"
                                class="btn-card-detail"
                                onclick="
                                    window.openDetailReportModal(
                                        '${escapeHtml(report.id)}'
                                    )
                                "
                            >

                                <i
                                    class="
                                        fa-solid
                                        fa-circle-info
                                    "
                                ></i>

                                <span>Detail</span>

                            </button>


                            ${advanceButtonHtml}

                        </div>

                    </div>

                `;

            }).join("");

    }


    /* =========================================================
       13. FORMAT WAKTU
    ========================================================= */

    function formatReportTime(time) {

        if (!time) {
            return "-";
        }


        const numeric =
            Number(time);


        const date =
            Number.isFinite(numeric)

                ? new Date(numeric)

                : new Date(time);


        if (isNaN(date.getTime())) {
            return String(time);
        }


        return date.toLocaleString(
            "id-ID",
            {

                day:
                    "2-digit",

                month:
                    "short",

                hour:
                    "2-digit",

                minute:
                    "2-digit"

            }
        );

    }


    /* =========================================================
       14. DETAIL LAPORAN
    ========================================================= */

    window.openDetailReportModal =
        function (reportId) {

            const report =
                allReports.find(
                    r => r.id === reportId
                );


            if (
                !report ||
                !detailReportModal ||
                !modalDetailContent
            ) {
                return;
            }


            if (modalReportId) {
                modalReportId.value =
                    report.id;
            }


            if (modalReportSource) {
                modalReportSource.value =
                    report.source;
            }


            if (modalReportPerumahanKey) {
                modalReportPerumahanKey.value =
                    report.perumahanKey || "";
            }


            if (officerResponseNote) {
                officerResponseNote.value = "";
            }


            setModalStatusRadio(
                report.status
            );


            let mapLinkHtml =
                "-";


            if (report.locationUrl) {

                mapLinkHtml = `

                    <a
                        href="${report.locationUrl}"
                        target="_blank"
                        rel="noopener noreferrer"
                        style="
                            color:#2563eb;
                            text-decoration:underline;
                            font-weight:600;
                        "
                    >

                        <i
                            class="
                                fa-solid
                                fa-map-location-dot
                            "
                        ></i>

                        Buka Google Maps

                    </a>

                `;

            }

            else if (
                report.latitude &&
                report.longitude
            ) {

                mapLinkHtml = `

                    <a
                        href="
                            https://www.google.com/maps?q=
                            ${report.latitude},
                            ${report.longitude}
                        "
                        target="_blank"
                        rel="noopener noreferrer"
                        style="
                            color:#2563eb;
                            text-decoration:underline;
                            font-weight:600;
                        "
                    >

                        <i
                            class="
                                fa-solid
                                fa-map-location-dot
                            "
                        ></i>

                        Buka Google Maps
                        (
                            ${report.latitude},
                            ${report.longitude}
                        )

                    </a>

                `;

            }


            modalDetailContent.innerHTML = `

                <div class="detail-row-item">

                    <span class="detail-row-label">

                        <i class="fa-solid fa-tag"></i>

                        Kategori Laporan

                    </span>


                    <span class="detail-row-value">

                        <span
                            class="
                                category-tag
                                ${
                                    report.source ===
                                    "perumahan"

                                        ? "perumahan"

                                        : "public"
                                }
                            "
                        >

                            ${
                                report.source ===
                                "perumahan"

                                    ? "Perumahan"

                                    : "Public"
                            }

                        </span>

                    </span>

                </div>


                <div class="detail-row-item">

                    <span class="detail-row-label">

                        <i
                            class="
                                fa-solid
                                fa-circle-info
                            "
                        ></i>

                        Status Laporan

                    </span>


                    <strong class="detail-row-value">

                        ${getStatusLabel(
                            report.status
                        )}

                    </strong>

                </div>


                <div class="detail-row-item">

                    <span class="detail-row-label">

                        <i class="fa-solid fa-user"></i>

                        Nama Pelapor

                    </span>


                    <strong class="detail-row-value">

                        ${escapeHtml(
                            report.userName
                        )}

                    </strong>

                </div>


                <div class="detail-row-item">

                    <span class="detail-row-label">

                        <i class="fa-solid fa-phone"></i>

                        Kontak / WhatsApp

                    </span>


                    <span class="detail-row-value">

                        ${escapeHtml(
                            report.userPhone
                        )}

                    </span>

                </div>


                <div class="detail-row-item">

                    <span class="detail-row-label">

                        <i
                            class="
                                fa-solid
                                fa-location-dot
                            "
                        ></i>

                        Lokasi / Alamat

                    </span>


                    <span class="detail-row-value">

                        ${escapeHtml(
                            report.location
                        )}

                    </span>

                </div>


                <div class="detail-row-item">

                    <span class="detail-row-label">

                        <i
                            class="
                                fa-solid
                                fa-map-pin
                            "
                        ></i>

                        Peta Lokasi

                    </span>


                    <span class="detail-row-value">

                        ${mapLinkHtml}

                    </span>

                </div>


                <div class="detail-row-item">

                    <span class="detail-row-label">

                        <i
                            class="
                                fa-solid
                                fa-microchip
                            "
                        ></i>

                        Posko / Perangkat

                    </span>


                    <span class="detail-row-value">

                        ${escapeHtml(
                            report.device
                        )}

                    </span>

                </div>


                <div class="detail-row-item">

                    <span class="detail-row-label">

                        <i
                            class="
                                fa-regular
                                fa-clock
                            "
                        ></i>

                        Waktu Kejadian

                    </span>


                    <span class="detail-row-value">

                        ${formatReportTime(
                            report.time
                        )}

                    </span>

                </div>


                <div class="detail-row-item">

                    <span class="detail-row-label">

                        <i
                            class="
                                fa-regular
                                fa-message
                            "
                        ></i>

                        Keterangan Insiden

                    </span>


                    <span
                        class="detail-row-value"
                        style="
                            text-align:right;
                            font-style:italic;
                        "
                    >

                        ${escapeHtml(
                            report.note
                        )}

                    </span>

                </div>

            `;


            detailReportModal.style.display =
                "flex";

        };


    /* =========================================================
       15. UPDATE STATUS KE PUBLIC_PANICS
    ========================================================= */

    async function updateStatusAllTables({
        reportId,
        source,
        perumahanKey = "",
        newStatus,
        dbTable = "public_panics",
        note = ""
    }) {

        try {

            if (!reportId) {
                throw new Error("ID laporan tidak ditemukan.");
            }

            if (!newStatus) {
                throw new Error("Status baru tidak ditemukan.");
            }

            const normalizedStatus = normalizeStatus(newStatus);
            const statusLabel = getStatusLabel(normalizedStatus);

            const updatePayload = {
                status: normalizedStatus,
                updated_at: Date.now(),
                updated_by: "petugas",
                officer_processed: true,    // 🔥 PENTING! TANDAI SUDAH DIPROSES PETUGAS
                device_auto_off: false      // 🔥 PENTING! MATIKAN AUTO-OFF
            };

            if (typeof note === "string" && note.trim() !== "") {
                const cleanNote = note.trim();
                updatePayload.officer_note = cleanNote;
                updatePayload.response_note = cleanNote;
            }

            console.log(`🔄 Mengupdate status laporan ${reportId} ke "${statusLabel}"`);
            console.log("📦 Update payload:", updatePayload);

            // =============================================
            // 🔥 UPDATE DI PUBLIC_PANICS
            // =============================================
            
            const publicPanicsRef = ref(db2, `public_panics/${reportId}`);
            
            // CEK APAKAH DATA ADA
            const publicSnapshot = await get(publicPanicsRef);
            
            if (publicSnapshot.exists()) {
                
                const currentData = publicSnapshot.val();
                const currentStatus = currentData.status || "menunggu";
                
                console.log(`📊 Status saat ini: ${currentStatus}`);
                
                // 🔥 CEK: JIKA STATUS SUDAH SAMA, SKIP
                if (currentStatus === normalizedStatus) {
                    console.log(`ℹ️ Status sudah "${statusLabel}", tidak perlu diupdate`);
                    return true;
                }
                
                // ✅ UPDATE DI PUBLIC_PANICS
                await update(publicPanicsRef, updatePayload);
                console.log(`✅ Updated in public_panics: ${currentStatus} → ${normalizedStatus}`);
                
                // 🔥 VERIFIKASI
                const verifySnap = await get(publicPanicsRef);
                if (verifySnap.exists()) {
                    console.log(`📊 Status sekarang: ${verifySnap.val()?.status}`);
                }
                
            } else {
                console.error(`❌ Laporan ${reportId} TIDAK ADA di public_panics!`);
                
                await Swal.fire({
                    icon: "error",
                    title: "Laporan Tidak Ditemukan",
                    text: `Laporan dengan ID ${reportId} tidak ditemukan di database.`
                });
                
                return false;
            }

            // =============================================
            // 🔥 UPDATE DI PERUMAHAN (jika ada)
            // =============================================
            
            if (source === "perumahan" && perumahanKey) {
                try {
                    const perumahanRef = ref(db1, `perumahan/${perumahanKey}/reports/${reportId}`);
                    await update(perumahanRef, updatePayload);
                    console.log("✅ Updated in perumahan");
                } catch (perumahanError) {
                    console.warn("⚠️ Perumahan update failed:", perumahanError);
                }
            }

            // =============================================
            // 🔥 UPDATE STATE LOKAL
            // =============================================
            
            const foundReport = allReports.find(r => {
                if (r.id !== reportId) return false;
                if (r.source !== source) return false;
                if (source === "perumahan") {
                    return r.perumahanKey === perumahanKey;
                }
                return true;
            });

            if (foundReport) {
                foundReport.status = normalizedStatus;
                foundReport.rawStatus = normalizedStatus;
                foundReport.updated_at = updatePayload.updated_at;
                foundReport.officer_processed = true;
                foundReport.device_auto_off = false;
            }

            // =============================================
            // 🔥 RENDER ULANG
            // =============================================
            
            filterAndRenderBoard();

            console.log(`✅ Status updated to "${statusLabel}"`);

            // =============================================
            // 🔥 SUCCESS MESSAGE
            // =============================================
            
            await Swal.fire({
                icon: "success",
                title: "Status Berhasil Diperbarui",
                text: `Laporan dipindahkan ke "${statusLabel}".`,
                timer: 1500,
                showConfirmButton: false
            });

            return true;

        } catch (error) {

            console.error("❌ Error updating status:", error);
            
            await Swal.fire({
                icon: "error",
                title: "Gagal Memperbarui",
                text: "Terjadi kesalahan: " + error.message,
                confirmButtonColor: "#dc2626"
            });

            return false;
        }

    }


    /* =========================================================
       16. SIMPAN PERUBAHAN STATUS DARI MODAL
    ========================================================= */

    if (btnSaveStatusChange) {

        btnSaveStatusChange.addEventListener(
            "click",
            async () => {

                const reportId =
                    modalReportId.value;

                const source =
                    modalReportSource.value;

                const perumahanKey =
                    modalReportPerumahanKey.value;

                const newStatus =
                    getSelectedRadioStatus();

                const noteText =
                    (
                        officerResponseNote
                            ? officerResponseNote.value
                            : ""
                    )
                    .trim();


                if (!reportId) {
                    Swal.fire({
                        icon: "warning",
                        title: "Laporan Tidak Ditemukan",
                        text: "ID laporan tidak valid."
                    });
                    return;
                }

                if (!newStatus) {
                    Swal.fire({
                        icon: "warning",
                        title: "Status Belum Dipilih",
                        text: "Silakan pilih status terlebih dahulu."
                    });
                    return;
                }


                const report =
                    allReports.find(
                        r =>
                            r.id === reportId &&
                            r.source === source &&
                            (
                                source !== "perumahan" ||
                                r.perumahanKey === perumahanKey
                            )
                    );

                const dbTable =
                    report?.dbTable ||
                    "public_panics";


                const statusLabel =
                    getStatusLabel(newStatus);

                const isCompleted =
                    newStatus === STATUS.SELESAI;

                const confirmResult =
                    await Swal.fire({
                        title: `Ubah Status ke "${statusLabel}"?`,
                        text: isCompleted
                            ? "Laporan akan ditandai selesai."
                            : "Laporan akan diproses oleh petugas.",
                        icon: isCompleted ? "success" : "info",
                        showCancelButton: true,
                        confirmButtonColor: isCompleted ? "#10b981" : "#f59e0b",
                        cancelButtonColor: "#64748b",
                        confirmButtonText: `Ya, Jadikan ${statusLabel}`,
                        cancelButtonText: "Batal",
                        reverseButtons: true
                    });

                if (!confirmResult.isConfirmed) {
                    return;
                }


                const originalText =
                    btnSaveStatusChange.innerHTML;

                btnSaveStatusChange.disabled = true;
                btnSaveStatusChange.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Menyimpan...
                `;

                try {

                    const success =
                        await updateStatusAllTables({
                            reportId: reportId, 
                            source,
                            perumahanKey,
                            newStatus,
                            dbTable,
                            note: noteText
                        });

                    if (success) {
                        closeModal();

                        Swal.fire({
                            icon: "success",
                            title: "Status Berhasil Diperbarui",
                            text: `Laporan dipindahkan ke "${statusLabel}".`,
                            timer: 1500,
                            showConfirmButton: false
                        });
                    }

                } finally {

                    btnSaveStatusChange.disabled = false;
                    btnSaveStatusChange.innerHTML = originalText;

                }

            }
        );

    }


    /* =========================================================
       17. QUICK CHANGE STATUS
    ========================================================= */

    window.quickChangeStatus =
        async function (
            reportId,
            source,
            perumahanKey,
            targetStatus,
            dbTable
        ) {

            if (!reportId) {
                Swal.fire({
                    icon: "warning",
                    title: "Laporan Tidak Ditemukan",
                    text: "ID laporan tidak valid."
                });
                return;
            }

            if (!targetStatus) {
                Swal.fire({
                    icon: "warning",
                    title: "Status Tidak Valid",
                    text: "Status tujuan tidak ditemukan."
                });
                return;
            }


            const normalizedStatus =
                normalizeStatus(targetStatus);

            const statusLabel =
                getStatusLabel(normalizedStatus);

            const isCompleted =
                normalizedStatus === STATUS.SELESAI;


            const result =
                await Swal.fire({
                    title: `Ubah Status ke "${statusLabel}"?`,
                    text: isCompleted
                        ? "Laporan ini akan ditandai telah selesai ditangani oleh petugas."
                        : "Laporan ini akan dialihkan ke status sedang ditangani petugas.",
                    icon: isCompleted ? "success" : "info",
                    showCancelButton: true,
                    confirmButtonColor: isCompleted ? "#10b981" : "#f59e0b",
                    cancelButtonColor: "#64748b",
                    confirmButtonText: `Ya, Jadikan ${statusLabel}`,
                    cancelButtonText: "Batal",
                    reverseButtons: true
                });

            if (!result.isConfirmed) {
                return;
            }


            await updateStatusAllTables({
                reportId: reportId,
                source,
                perumahanKey,
                newStatus: normalizedStatus,
                dbTable: dbTable || "public_panics",
                note: ""
            });

        };


    /* =========================================================
       18. FILTER EVENT
    ========================================================= */

    if (searchReportsInput) {

        searchReportsInput.addEventListener(
            "input",
            () => {
                filterAndRenderBoard();
            }
        );

    }


    if (categoryFilter) {

        categoryFilter.addEventListener(
            "change",
            () => {
                filterAndRenderBoard();
            }
        );

    }


    if (btnRefreshHistory) {

        btnRefreshHistory.addEventListener(
            "click",
            () => {

                const icon =
                    btnRefreshHistory.querySelector(
                        "i"
                    );


                if (icon) {
                    icon.classList.add(
                        "fa-spin"
                    );
                }


                setTimeout(
                    () => {

                        if (icon) {
                            icon.classList.remove(
                                "fa-spin"
                            );
                        }

                        filterAndRenderBoard();

                    },
                    600
                );

            }
        );

    }


    /* =========================================================
       19. ESCAPE HTML
    ========================================================= */

    function escapeHtml(text) {

        if (
            text === null ||
            text === undefined
        ) {
            return "";
        }


        return String(text)
            .replace(
                /[&<>"']/g,
                (m) => ({

                    "&":
                        "&amp;",

                    "<":
                        "&lt;",

                    ">":
                        "&gt;",

                    '"':
                        "&quot;",

                    "'":
                        "&#039;"

                })[m]
            );

    }

});