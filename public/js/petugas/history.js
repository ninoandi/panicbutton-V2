import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";
import { db1, db2 } from "../firebase-config.js";

import {
    ref,
    onValue,
    update,
    query,
    limitToLast,
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
    const searchReportsInput = document.getElementById("searchReportsInput");
    const categoryFilter = document.getElementById("categoryFilter");
    const btnRefreshHistory = document.getElementById("btnRefreshHistory");

    // Modal Detail & Status Update
    const detailReportModal = document.getElementById("detailReportModal");
    const btnCloseDetailModal = document.getElementById("btnCloseDetailModal");
    const btnCancelDetailModal = document.getElementById("btnCancelDetailModal");
    const btnSaveStatusChange = document.getElementById("btnSaveStatusChange");
    const modalReportId = document.getElementById("modalReportId");
    const modalReportSource = document.getElementById("modalReportSource");
    const modalReportPerumahanKey = document.getElementById("modalReportPerumahanKey");
    const modalReportDbTable = document.getElementById("modalReportDbTable");
    const modalDetailContent = document.getElementById("modalDetailContent");
    const officerResponseNote = document.getElementById("officerResponseNote");
    const radioStatusCards = document.querySelectorAll(".status-radio-card");


    /* =========================================================
       2. STATUS CONFIG
    ========================================================= */

    const STATUS = {
        MENUNGGU: "menunggu",
        DIPROSES: "diproses",
        SELESAI: "completed"
    };


    // 🔥 HANYA 1 FUNGSI normalizeStatus
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
        btnCloseDetailModal.addEventListener("click", closeModal);
    }

    if (btnCancelDetailModal) {
        btnCancelDetailModal.addEventListener("click", closeModal);
    }

    if (detailReportModal) {
        detailReportModal.addEventListener("click", (e) => {
            if (e.target === detailReportModal) {
                closeModal();
            }
        });
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
            const radio = card.querySelector("input[type='radio']");
            if (radio) {
                radio.checked = true;
            }
            radioStatusCards.forEach(c => {
                c.classList.remove("active-selected");
            });
            card.classList.add("active-selected");
        });
    });


    function setModalStatusRadio(statusVal) {
        const normalized = normalizeStatus(statusVal);
        radioStatusCards.forEach(card => {
            const cardValue = card.getAttribute("data-val");
            const normalizedCardValue = normalizeStatus(cardValue);
            const radio = card.querySelector("input[type='radio']");

            if (normalizedCardValue === normalized) {
                if (radio) {
                    radio.checked = true;
                }
                card.classList.add("active-selected");
            } else {
                if (radio) {
                    radio.checked = false;
                }
                card.classList.remove("active-selected");
            }
        });
    }


    function getSelectedRadioStatus() {
        const checked = document.querySelector("input[name='radioStatus']:checked");
        if (!checked) {
            return STATUS.MENUNGGU;
        }
        return normalizeStatus(checked.value);
    }


    // URL Parameters handling (e.g. from Dashboard click)
    const urlParams = new URLSearchParams(window.location.search);
    const targetReportIdParam = urlParams.get("reportId");
    let initialReportModalOpened = false;

    if (categoryFilter) {
        categoryFilter.value = "all";
    }

    // High Performance In-Memory Data Store
    let daftarPerumahanDict = {};
    const housingReportsMap = new Map(); // clusterKey -> array of reports
    let rawPublicReports = [];
    let rawPublicPanics = [];
    let allReports = [];
    let activeClusterListeners = new Set();
    let batchFilterTimer = null;

    function parseTimestamp(rawTime, item = {}) {
        if (item.timestamp && typeof item.timestamp === "number" && item.timestamp > 0) {
            return item.timestamp < 10000000000 ? item.timestamp * 1000 : item.timestamp;
        }
        if (item.created_at && typeof item.created_at === "number" && item.created_at > 0) {
            return item.created_at < 10000000000 ? item.created_at * 1000 : item.created_at;
        }

        if (!rawTime || rawTime === "-") return Date.now();

        if (typeof rawTime === "number" && rawTime > 0) {
            return rawTime < 10000000000 ? rawTime * 1000 : rawTime;
        }

        const str = String(rawTime).trim();
        if (/^\d+$/.test(str)) {
            const num = parseInt(str, 10);
            return num < 10000000000 ? num * 1000 : num;
        }

        const matchWaktu = str.match(/^(\d{4}-\d{2}-\d{2})\s+waktu\s+(\d{2}:\d{2}(?::\d{2})?)$/i);
        if (matchWaktu) {
            const d = new Date(`${matchWaktu[1]}T${matchWaktu[2]}`);
            if (!isNaN(d.getTime())) return d.getTime();
        }

        const matchIso = str.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}(?::\d{2})?)$/);
        if (matchIso) {
            const d = new Date(`${matchIso[1]}T${matchIso[2]}`);
            if (!isNaN(d.getTime())) return d.getTime();
        }

        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) {
            return parsed.getTime();
        }

        return Date.now();
    }


    function scheduleBatchFilter() {
        if (batchFilterTimer) clearTimeout(batchFilterTimer);
        batchFilterTimer = setTimeout(() => {
            mergeAndRenderReports();
        }, 50);
    }


    /* =========================================================
       5. GET USER ID DARI REPORT
    ========================================================= */

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
       7. OPTIMIZED REALTIME FIREBASE LISTENERS (DB1 & DB2)
    ========================================================= */

    // DB1: Daftar Perumahan
    const daftarRef = ref(db1, "daftar_perumahan");
    onValue(daftarRef, (snapshot) => {
        daftarPerumahanDict = snapshot.val() || {};
        const clusterKeys = Object.keys(daftarPerumahanDict);

        clusterKeys.forEach(pKey => {
            if (activeClusterListeners.has(pKey)) return;
            activeClusterListeners.add(pKey);

            const pName = daftarPerumahanDict[pKey] || pKey;

            // Targeted query: Hanya ambil sub-node monitor berbatas (limitToLast 60)
            const monitorQuery = query(ref(db1, `perumahan/${pKey}/monitor`), limitToLast(60));
            onValue(monitorQuery, (mSnap) => {
                const monitorData = mSnap.val() || {};
                const clusterReports = [];

                Object.entries(monitorData).forEach(([mId, mVal]) => {
                    if (!mVal || typeof mVal !== "object") return;
                    const rawTime = mVal.time || mVal.waktu || mVal.timestamp || mVal.created_at || "-";
                    const ts = parseTimestamp(rawTime, mVal);

                    clusterReports.push({
                        id: mId,
                        source: "perumahan",
                        dbTable: "monitor",
                        perumahanKey: pKey,
                        perumahanName: pName,
                        userName: mVal.name || mVal.nama || mVal.username || mVal.userName || "Warga Perumahan",
                        userPhone: mVal.phone || mVal.phoneNumber || mVal.telepon || mVal.no_hp || "-",
                        location: mVal.houseNumber ? `Rumah No. ${mVal.houseNumber} (${pName})` : pName,
                        houseNumber: mVal.houseNumber || mVal.no_rumah || mVal.house_number || "-",
                        time: ts,
                        status: normalizeStatus(mVal.status),
                        note: mVal.message || mVal.pesan || mVal.description || mVal.keterangan || mVal.note || "-",
                        officerNote: mVal.officer_note || mVal.response_note || "",
                        device: mVal.device || mVal.buzzer_name || "Sensor Panic Perumahan",
                        latitude: mVal.latitude || mVal.lat || null,
                        longitude: mVal.longitude || mVal.lng || null
                    });
                });

                housingReportsMap.set(pKey, clusterReports);
                scheduleBatchFilter();
            }, (err) => {
                console.warn(`DB1 cluster monitor ${pKey} error:`, err);
            });
        });

        scheduleBatchFilter();
    }, (err) => {
        console.error("DB1 daftar_perumahan error:", err);
    });

    // DB2: Public Panics (Targeted limitToLast 80)
    const publicPanicsQuery = query(ref(db2, "public_panics"), limitToLast(80));
    onValue(publicPanicsQuery, (snapshot) => {
        const data = snapshot.val() || {};
        rawPublicPanics = Object.entries(data).map(([rId, rVal]) => {
            const rawTime = rVal.created_at || rVal.timestamp || Date.now();
            const ts = parseTimestamp(rawTime, rVal);

            const reportUserId = getReportUserId(rVal);
            const hasUserId = reportUserId !== null;

            return {
                id: rId,
                source: "public",
                dbTable: "public_panics",
                perumahanKey: "",
                perumahanName: "Area Publik",
                userName: hasUserId 
                    ? (rVal.senderName || rVal.name || rVal.user_name || "Warga Publik")
                    : "🟡 Tanpa Login (Publik)",
                userPhone: rVal.phone || rVal.telepon || "-",
                location: rVal.address || rVal.lokasi || (rVal.latitude && rVal.longitude ? `${rVal.latitude}, ${rVal.longitude}` : "Area Publik"),
                houseNumber: "-",
                time: ts,
                status: normalizeStatus(rVal.status),
                note: rVal.description || rVal.note || rVal.keterangan || "-",
                officerNote: rVal.officer_note || rVal.response_note || "",
                device: rVal.assigned_device || rVal.device || "IoT Panic Device",
                latitude: rVal.latitude || null,
                longitude: rVal.longitude || null,
                locationUrl: rVal.locationUrl || null,
                hasUserId: hasUserId
            };
        });

        scheduleBatchFilter();
    }, (err) => {
        console.error("DB2 load public_panics error:", err);
    });

    // DB2: Public Reports (Targeted limitToLast 80)
    const publicReportsQuery = query(ref(db2, "reports"), limitToLast(80));
    onValue(publicReportsQuery, (snapshot) => {
        const data = snapshot.val() || {};
        rawPublicReports = Object.entries(data).map(([rId, rVal]) => {
            const rawTime = rVal.timestamp || rVal.created_at || Date.now();
            const ts = parseTimestamp(rawTime, rVal);

            const reportUserId = getReportUserId(rVal);
            const hasUserId = reportUserId !== null;

            return {
                id: rId,
                source: "public",
                dbTable: "reports",
                perumahanKey: "",
                perumahanName: "Area Publik",
                userName: hasUserId
                    ? (rVal.user_name || rVal.name || "Pengguna Publik")
                    : "🟡 Tanpa Login (Publik)",
                userPhone: rVal.phone || rVal.telepon || "-",
                location: rVal.location || rVal.address || "Area Publik",
                houseNumber: "-",
                time: ts,
                status: normalizeStatus(rVal.status),
                note: rVal.description || rVal.note || rVal.keterangan || "-",
                officerNote: rVal.officer_note || rVal.response_note || "",
                device: rVal.device || "Aplikasi Publik",
                latitude: rVal.latitude || null,
                longitude: rVal.longitude || null,
                locationUrl: rVal.locationUrl || null,
                hasUserId: hasUserId
            };
        });

        scheduleBatchFilter();
    }, (err) => {
        console.error("DB2 load reports error:", err);
    });


    /* =========================================================
       8. MERGE & RENDER
    ========================================================= */

    function mergeAndRenderReports() {
        const flattenedHousing = [];
        housingReportsMap.forEach(reports => flattenedHousing.push(...reports));

        allReports = [...flattenedHousing, ...rawPublicPanics, ...rawPublicReports];

        // Sort desc berdasarkan waktu (terbaru di atas)
        allReports.sort((a, b) => b.time - a.time);

        filterAndRenderBoard();
    }


    /* =========================================================
       9. FILTER & KANBAN BOARD
    ========================================================= */

    function filterAndRenderBoard() {
        const keyword = (searchReportsInput ? searchReportsInput.value : "").trim().toLowerCase();
        const category = categoryFilter ? categoryFilter.value : "all";

        const waitingList = [];
        const processList = [];
        const doneList = [];

        allReports.forEach(report => {
            if (category !== "all" && report.source !== category) {
                return;
            }

            if (keyword) {
                const matchUser = (report.userName || "").toLowerCase().includes(keyword);
                const matchLoc = (report.location || "").toLowerCase().includes(keyword);
                const matchNote = (report.note || "").toLowerCase().includes(keyword);
                const matchPName = (report.perumahanName || "").toLowerCase().includes(keyword);

                if (!matchUser && !matchLoc && !matchNote && !matchPName) {
                    return;
                }
            }

            if (report.status === STATUS.MENUNGGU) {
                waitingList.push(report);
            } else if (report.status === STATUS.DIPROSES) {
                processList.push(report);
            } else if (report.status === STATUS.SELESAI) {
                doneList.push(report);
            }
        });

        if (countWaiting) countWaiting.textContent = waitingList.length;
        if (countProcess) countProcess.textContent = processList.length;
        if (countDone) countDone.textContent = doneList.length;

        renderColumn(waitingCardsContainer, waitingList, STATUS.MENUNGGU);
        renderColumn(processCardsContainer, processList, STATUS.DIPROSES);
        renderColumn(doneCardsContainer, doneList, STATUS.SELESAI);

        // Auto-open modal if targeted from URL (e.g. from Dashboard)
        if (!initialReportModalOpened && targetReportIdParam && allReports.length > 0) {
            const target = allReports.find(r => r.id === targetReportIdParam);
            if (target) {
                initialReportModalOpened = true;
                setTimeout(() => {
                    window.openDetailReportModal(targetReportIdParam);
                    const el = document.getElementById("report_card_" + targetReportIdParam);
                    if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                        el.style.boxShadow = "0 0 0 3px #2563eb";
                        setTimeout(() => { el.style.boxShadow = ""; }, 3000);
                    }
                }, 200);
            }
        }
    }


    /* =========================================================
       10. RENDER CARD
    ========================================================= */

    function renderColumn(container, items, columnStatus) {
        if (!container) return;

        const statusLabel = getStatusLabel(columnStatus);

        if (items.length === 0) {
            let emptyMsg = "Tidak ada laporan dalam status ini.";
            let iconClass = "fa-clipboard-check";

            if (columnStatus === STATUS.MENUNGGU) {
                emptyMsg = "Tidak ada laporan yang menunggu respon.";
                iconClass = "fa-hourglass";
            } else if (columnStatus === STATUS.DIPROSES) {
                emptyMsg = "Tidak ada laporan yang sedang diproses.";
                iconClass = "fa-person-circle-check";
            } else if (columnStatus === STATUS.SELESAI) {
                emptyMsg = "Belum ada riwayat laporan selesai.";
                iconClass = "fa-box-archive";
            }

            container.innerHTML = `
                <div class="board-empty-state">
                    <i class="fa-solid ${iconClass}"></i>
                    <p>${emptyMsg}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(report => {
            const formattedTime = formatReportTime(report.time);
            const isUrgent = columnStatus === STATUS.MENUNGGU;

            let advanceButtonHtml = "";

            if (columnStatus === STATUS.MENUNGGU) {
                advanceButtonHtml = `
                    <button type="button" class="btn-card-advance btn-advance-process" onclick="
                        window.quickChangeStatus(
                            '${escapeHtml(report.id)}',
                            '${escapeHtml(report.source)}',
                            '${escapeHtml(report.perumahanKey || "")}',
                            'diproses',
                            '${escapeHtml(report.dbTable || "")}'
                        )
                    ">
                        <i class="fa-solid fa-person-running"></i>
                        <span>Proses Sekarang</span>
                    </button>
                `;
            } else if (columnStatus === STATUS.DIPROSES) {
                advanceButtonHtml = `
                    <button type="button" class="btn-card-advance btn-advance-done" onclick="
                        window.quickChangeStatus(
                            '${escapeHtml(report.id)}',
                            '${escapeHtml(report.source)}',
                            '${escapeHtml(report.perumahanKey || "")}',
                            'completed',
                            '${escapeHtml(report.dbTable || "")}'
                        )
                    ">
                        <i class="fa-solid fa-check-double"></i>
                        <span>Selesaikan</span>
                    </button>
                `;
            }

            return `
                <div class="report-card-item ${isUrgent ? "is-urgent" : ""}" id="report_card_${escapeHtml(report.id)}">
                    <div class="report-card-header">
                        <span class="category-tag ${report.source === "perumahan" ? "perumahan" : "public"}">
                            <i class="${report.source === "perumahan" ? "fa-solid fa-building-shield" : "fa-solid fa-tower-cell"}"></i>
                            ${report.source === "perumahan" ? "Perumahan" : "Public"}
                        </span>
                        <span class="report-card-time">
                            <i class="fa-regular fa-clock"></i>
                            ${formattedTime}
                        </span>
                    </div>
                    <div class="report-card-body">
                        <strong class="report-user-name">
                            <i class="fa-regular fa-user"></i>
                            ${escapeHtml(report.userName)}
                        </strong>
                        <span class="report-location-info">
                            <i class="fa-solid fa-location-dot"></i>
                            ${escapeHtml(report.location)}
                        </span>
                        ${report.note && report.note !== "-" ? `
                            <div class="report-note-box">
                                <i class="fa-regular fa-comment-dots"></i>
                                ${escapeHtml(report.note)}
                            </div>
                        ` : ""}
                    </div>
                    <div class="report-card-actions">
                        <button type="button" class="btn-card-detail" onclick="window.openDetailReportModal('${escapeHtml(report.id)}')">
                            <i class="fa-solid fa-circle-info"></i>
                            <span>Detail</span>
                        </button>
                        ${advanceButtonHtml}
                    </div>
                </div>
            `;
        }).join("");
    }


    /* =========================================================
       11. FORMAT WAKTU
    ========================================================= */

    function formatReportTime(time) {
        if (!time) return "-";

        const numeric = Number(time);
        const date = Number.isFinite(numeric) ? new Date(numeric) : new Date(time);

        if (isNaN(date.getTime())) {
            return String(time);
        }

        return date.toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    }


    /* =========================================================
       12. DETAIL LAPORAN
    ========================================================= */

    window.openDetailReportModal = function (reportId) {
        const report = allReports.find(r => r.id === reportId);

        if (!report || !detailReportModal || !modalDetailContent) {
            return;
        }

        if (modalReportId) modalReportId.value = report.id;
        if (modalReportSource) modalReportSource.value = report.source;
        if (modalReportPerumahanKey) modalReportPerumahanKey.value = report.perumahanKey || "";
        if (modalReportDbTable) modalReportDbTable.value = report.dbTable || "monitor";
        if (officerResponseNote) officerResponseNote.value = report.officerNote || "";

        setModalStatusRadio(report.status);

        // Google Maps Link
        let mapLinkHtml = "-";
        if (report.locationUrl) {
            mapLinkHtml = `<a href="${report.locationUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb; text-decoration:underline; font-weight:600;"><i class="fa-solid fa-map-location-dot"></i> Buka Google Maps</a>`;
        } else if (report.latitude && report.longitude && report.latitude != 0 && report.longitude != 0) {
            mapLinkHtml = `<a href="https://www.google.com/maps?q=${report.latitude},${report.longitude}" target="_blank" rel="noopener noreferrer" style="color:#2563eb; text-decoration:underline; font-weight:600;"><i class="fa-solid fa-map-location-dot"></i> Buka Google Maps (${report.latitude}, ${report.longitude})</a>`;
        }

        modalDetailContent.innerHTML = `
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-tag"></i> Kategori Laporan</span>
                <span class="detail-row-value">
                    <span class="category-tag ${report.source === 'perumahan' ? 'perumahan' : 'public'}">
                        <i class="${report.source === 'perumahan' ? 'fa-solid fa-building-shield' : 'fa-solid fa-tower-cell'}"></i>
                        ${report.source === 'perumahan' ? 'Perumahan' : 'Public'}
                    </span>
                </span>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-circle-info"></i> Status Laporan</span>
                <strong class="detail-row-value">${getStatusLabel(report.status)}</strong>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-user"></i> Nama Pelapor</span>
                <strong class="detail-row-value">${escapeHtml(report.userName)}</strong>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-phone"></i> Kontak / WhatsApp</span>
                <span class="detail-row-value">${escapeHtml(report.userPhone)}</span>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-location-dot"></i> Lokasi / Alamat</span>
                <span class="detail-row-value">${escapeHtml(report.location)}</span>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-map-pin"></i> Peta Lokasi</span>
                <span class="detail-row-value">${mapLinkHtml}</span>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-solid fa-microchip"></i> Posko / Perangkat</span>
                <span class="detail-row-value">${escapeHtml(report.device)}</span>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-regular fa-clock"></i> Waktu Kejadian</span>
                <span class="detail-row-value">${formatReportTime(report.time)}</span>
            </div>
            <div class="detail-row-item">
                <span class="detail-row-label"><i class="fa-regular fa-message"></i> Keterangan Insiden</span>
                <span class="detail-row-value" style="text-align:right; font-style:italic;">${escapeHtml(report.note)}</span>
            </div>
        `;

        detailReportModal.style.display = "flex";
    };


    /* =========================================================
       13. UPDATE STATUS KE PUBLIC_PANICS
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
                officer_processed: true,
                device_auto_off: false
            };

            if (typeof note === "string" && note.trim() !== "") {
                const cleanNote = note.trim();
                updatePayload.officer_note = cleanNote;
                updatePayload.response_note = cleanNote;
            }

            console.log(`🔄 Mengupdate status laporan ${reportId} ke "${statusLabel}"`);
            console.log("📦 Update payload:", updatePayload);

            // UPDATE DI PUBLIC_PANICS
            const publicPanicsRef = ref(db2, `public_panics/${reportId}`);
            const publicSnapshot = await get(publicPanicsRef);

            if (publicSnapshot.exists()) {
                const currentData = publicSnapshot.val();
                const currentStatus = currentData.status || "menunggu";

                console.log(`📊 Status saat ini: ${currentStatus}`);

                if (currentStatus === normalizedStatus) {
                    console.log(`ℹ️ Status sudah "${statusLabel}", tidak perlu diupdate`);
                    return true;
                }

                await update(publicPanicsRef, updatePayload);
                console.log(`✅ Updated in public_panics: ${currentStatus} → ${normalizedStatus}`);

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

            // UPDATE DI PERUMAHAN (jika ada)
            if (source === "perumahan" && perumahanKey) {
                try {
                    const perumahanRef = ref(db1, `perumahan/${perumahanKey}/reports/${reportId}`);
                    await update(perumahanRef, updatePayload);
                    console.log("✅ Updated in perumahan");
                } catch (perumahanError) {
                    console.warn("⚠️ Perumahan update failed:", perumahanError);
                }
            }

            // UPDATE STATE LOKAL
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

            // RENDER ULANG
            filterAndRenderBoard();

            console.log(`✅ Status updated to "${statusLabel}"`);

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
       14. SIMPAN PERUBAHAN STATUS DARI MODAL
    ========================================================= */

    if (btnSaveStatusChange) {
        btnSaveStatusChange.addEventListener("click", async () => {
            const reportId = modalReportId.value;
            const source = modalReportSource.value;
            const perumahanKey = modalReportPerumahanKey.value;
            const newStatus = getSelectedRadioStatus();
            const noteText = (officerResponseNote ? officerResponseNote.value : "").trim();
            const dbTable = modalReportDbTable ? modalReportDbTable.value : "public_panics";

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

            const statusLabel = getStatusLabel(newStatus);
            const isCompleted = newStatus === STATUS.SELESAI;

            const confirmResult = await Swal.fire({
                title: `Ubah Status ke "${statusLabel}"?`,
                text: isCompleted ? "Laporan akan ditandai selesai." : "Laporan akan diproses oleh petugas.",
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

            const originalText = btnSaveStatusChange.innerHTML;
            btnSaveStatusChange.disabled = true;
            btnSaveStatusChange.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Menyimpan...
            `;

            try {
                const success = await updateStatusAllTables({
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
        });
    }


    /* =========================================================
       15. QUICK CHANGE STATUS
    ========================================================= */

    window.quickChangeStatus = async function (
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

        const normalizedStatus = normalizeStatus(targetStatus);
        const statusLabel = getStatusLabel(normalizedStatus);
        const isCompleted = normalizedStatus === STATUS.SELESAI;

        const result = await Swal.fire({
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
       16. FILTER EVENT
    ========================================================= */

    if (searchReportsInput) {
        searchReportsInput.addEventListener("input", () => {
            filterAndRenderBoard();
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener("change", () => {
            filterAndRenderBoard();
        });
    }

    if (btnRefreshHistory) {
        btnRefreshHistory.addEventListener("click", () => {
            const icon = btnRefreshHistory.querySelector("i");
            if (icon) {
                icon.classList.add("fa-spin");
            }
            setTimeout(() => {
                if (icon) {
                    icon.classList.remove("fa-spin");
                }
                filterAndRenderBoard();
            }, 600);
        });
    }


    /* =========================================================
       17. ESCAPE HTML
    ========================================================= */

    function escapeHtml(text) {
        if (text === null || text === undefined) {
            return "";
        }
        return String(text)
            .replace(/[&<>"']/g, (m) => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            })[m]);
    }

});