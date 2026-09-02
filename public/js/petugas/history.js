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
       1. DOM ELEMENTS
    ========================================================= */
    // Kanban Containers
    const waitingCardsContainer = document.getElementById("waitingCardsContainer");
    const processCardsContainer = document.getElementById("processCardsContainer");
    const doneCardsContainer = document.getElementById("doneCardsContainer");

    // Counters
    const countWaiting = document.getElementById("countWaiting");
    const countProcess = document.getElementById("countProcess");
    const countDone = document.getElementById("countDone");

    // Search & Filter
    const searchReportsInput = document.getElementById("searchReportsInput");
    const categoryFilter = document.getElementById("categoryFilter");

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

    // URL parameter check (for auto-opening report from dashboard)
    const urlParams = new URLSearchParams(window.location.search);
    const targetReportIdParam = urlParams.get("reportId");
    let initialReportModalOpened = false;

    if (categoryFilter) {
        categoryFilter.value = "all";
    }

    /* =========================================================
       2. STATUS CONFIGURATION & STATE
    ========================================================= */
    const STATUS = {
        MENUNGGU: "Menunggu",
        DIPROSES: "Diproses",
        SELESAI: "Selesai"
    };

    let daftarPerumahanDict = {};
    const housingReportsMap = new Map();
    const activeClusterListeners = new Set();
    let rawPublicPanics = [];
    let rawPublicReports = [];
    let allReports = [];
    let batchFilterTimer = null;

    /* =========================================================
       3. HELPER UTILITIES & NORMALIZATION
    ========================================================= */
    function escapeHtml(text) {
        if (text === null || text === undefined) return "";
        return String(text).replace(/[&<>"']/g, (m) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[m]);
    }

    function normalizeStatus(status) {
        const s = String(status || "").toLowerCase().trim();

        if (s === "completed" || s === "selesai" || s === "done" || s === "tuntas") {
            return STATUS.SELESAI;
        }

        if (s === "diproses" || s === "proses" || s === "process" || s === "processing" || s === "handling") {
            return STATUS.DIPROSES;
        }

        if (s === "active" || s === "aktif" || s === "menunggu" || s === "waiting" || s === "") {
            return STATUS.MENUNGGU;
        }

        return STATUS.MENUNGGU;
    }

    function getStatusLabel(status) {
        const normalized = normalizeStatus(status);
        if (normalized === STATUS.DIPROSES) return "Diproses";
        if (normalized === STATUS.SELESAI) return "Selesai";
        return "Menunggu";
    }

    function getReportUserId(report) {
        if (!report) return null;
        if (report.user_id != null && report.user_id !== "") return String(report.user_id);
        if (report.userId != null && report.userId !== "") return String(report.userId);
        if (report.uid != null && report.uid !== "") return String(report.uid);
        if (report.user && report.user.id != null) return String(report.user.id);
        if (report.user && report.user.user_id != null) return String(report.user.user_id);
        if (report.sender && report.sender.id != null) return String(report.sender.id);
        if (report.pelapor && report.pelapor.id != null) return String(report.pelapor.id);
        return null;
    }

    function getTimestampFromFirebaseId(id) {
        if (typeof id !== "string" || !id.startsWith("-") || id.length < 8) return 0;
        const PUSH_CHARS = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
        let timestamp = 0;
        for (let i = 1; i < 9; i++) {
            const c = id.charAt(i);
            const val = PUSH_CHARS.indexOf(c);
            if (val === -1) return 0;
            timestamp = timestamp * 64 + val;
        }
        return timestamp > 1577836800000 && timestamp < 2524608000000 ? timestamp : 0;
    }

    function parseTimestamp(rawTime, item = {}, reportId = "") {
        if (!rawTime && rawTime !== 0) {
            const fromId = getTimestampFromFirebaseId(reportId || item.id);
            return fromId > 0 ? fromId : Date.now();
        }

        if (typeof rawTime === "number") {
            if (rawTime > 0 && rawTime < 10000000000) return rawTime * 1000;
            if (rawTime >= 10000000000) return rawTime;
        }

        const candidateStr = String(rawTime).trim();
        const asNum = Number(candidateStr);
        if (!isNaN(asNum) && asNum > 0) {
            if (asNum < 10000000000) return asNum * 1000;
            return asNum;
        }

        const parsedDate = new Date(candidateStr);
        if (!isNaN(parsedDate.getTime())) return parsedDate.getTime();

        const matchIndo = candidateStr.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})(?:\s+(?:waktu|pukul)?\s*(\d{2}:\d{2}(?::\d{2})?))?$/i);
        if (matchIndo) {
            const timePart = matchIndo[4] || "00:00:00";
            const d = new Date(`${matchIndo[3]}-${matchIndo[2]}-${matchIndo[1]}T${timePart}`);
            if (!isNaN(d.getTime())) return d.getTime();
        }

        const idToTest = reportId || item.id || (typeof rawTime === "string" ? rawTime : "");
        const idTs = getTimestampFromFirebaseId(idToTest);
        if (idTs > 0) return idTs;

        return Date.now();
    }

    function formatReportTime(time) {
        if (!time) return "-";
        const numeric = Number(time);
        const date = Number.isFinite(numeric) ? new Date(numeric) : new Date(time);
        if (isNaN(date.getTime())) return String(time);

        return date.toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

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
                }
            } else {
                reportMap.set(key, report);
            }
        });
        return Array.from(reportMap.values());
    }

    function scheduleBatchFilter() {
        if (batchFilterTimer) clearTimeout(batchFilterTimer);
        batchFilterTimer = setTimeout(() => {
            mergeAndRenderReports();
        }, 50);
    }

    /* =========================================================
       4. REALTIME FIREBASE LISTENERS (DB1 & DB2)
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
            const monitorQuery = query(ref(db1, `perumahan/${pKey}/monitor`), limitToLast(80));

            onValue(monitorQuery, (mSnap) => {
                const monitorData = mSnap.val() || {};
                const clusterReports = [];

                Object.entries(monitorData).forEach(([mId, mVal]) => {
                    if (!mVal || typeof mVal !== "object") return;
                    const rawTime = mVal.time || mVal.waktu || mVal.timestamp || mVal.created_at || "-";
                    const ts = parseTimestamp(rawTime, mVal, mId);

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
            const ts = parseTimestamp(rawTime, rVal, rId);
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
            const ts = parseTimestamp(rawTime, rVal, rId);
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
       5. DATA AGGREGATION & RENDERING
    ========================================================= */
    function mergeAndRenderReports() {
        const flattenedHousing = [];
        housingReportsMap.forEach(reports => flattenedHousing.push(...reports));

        allReports = deduplicateReports([...flattenedHousing, ...rawPublicPanics, ...rawPublicReports]);

        // Sort desc berdasarkan waktu (terbaru di atas)
        allReports.sort((a, b) => (b.time || 0) - (a.time || 0));

        filterAndRenderBoard();
    }

    function filterAndRenderBoard() {
        const keyword = (searchReportsInput ? searchReportsInput.value : "").trim().toLowerCase();
        const category = categoryFilter ? categoryFilter.value : "all";

        const waitingList = [];
        const processList = [];
        const doneList = [];

        allReports.forEach(report => {
            // Filter Kategori
            if (category !== "all" && report.source !== category) {
                return;
            }

            // Filter Kata Kunci
            if (keyword) {
                const matchUser = (report.userName || "").toLowerCase().includes(keyword);
                const matchLoc = (report.location || "").toLowerCase().includes(keyword);
                const matchNote = (report.note || "").toLowerCase().includes(keyword);
                const matchPName = (report.perumahanName || "").toLowerCase().includes(keyword);
                const matchDevice = (report.device || "").toLowerCase().includes(keyword);
                if (!matchUser && !matchLoc && !matchNote && !matchPName && !matchDevice) {
                    return;
                }
            }

            // Pisahkan ke 3 area
            if (report.status === STATUS.MENUNGGU) {
                waitingList.push(report);
            } else if (report.status === STATUS.DIPROSES) {
                processList.push(report);
            } else if (report.status === STATUS.SELESAI) {
                doneList.push(report);
            }
        });

        // Update Counter Badges
        if (countWaiting) countWaiting.textContent = waitingList.length;
        if (countProcess) countProcess.textContent = processList.length;
        if (countDone) countDone.textContent = doneList.length;

        // Render Area 1: Menunggu
        renderColumn(waitingCardsContainer, waitingList, STATUS.MENUNGGU);

        // Render Area 2: Diproses
        renderColumn(processCardsContainer, processList, STATUS.DIPROSES);

        // Render Area 3: Selesai
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

    function renderColumn(container, items, columnStatus) {
        if (!container) return;

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
            let advanceButtonHtml = "";

            if (columnStatus === STATUS.MENUNGGU) {
                advanceButtonHtml = `
                    <button
                        type="button"
                        class="btn-card-advance btn-advance-process"
                        onclick="window.quickChangeStatus('${escapeHtml(report.id)}', '${escapeHtml(report.source)}', '${escapeHtml(report.perumahanKey || "")}', 'Diproses', '${escapeHtml(report.dbTable || "")}')"
                    >
                        <i class="fa-solid fa-person-running"></i>
                        <span>Proses Sekarang</span>
                    </button>
                `;
            } else if (columnStatus === STATUS.DIPROSES) {
                advanceButtonHtml = `
                    <button
                        type="button"
                        class="btn-card-advance btn-advance-done"
                        onclick="window.quickChangeStatus('${escapeHtml(report.id)}', '${escapeHtml(report.source)}', '${escapeHtml(report.perumahanKey || "")}', 'Selesai', '${escapeHtml(report.dbTable || "")}')"
                    >
                        <i class="fa-solid fa-circle-check"></i>
                        <span>Tandai Selesai</span>
                    </button>
                `;
            }

            return `
                <div class="report-card ${columnStatus === STATUS.MENUNGGU ? 'is-urgent' : ''}" id="report_card_${escapeHtml(report.id)}">
                    <div class="report-card-header">
                        <span class="category-tag ${report.source === 'perumahan' ? 'perumahan' : 'public'}">
                            <i class="${report.source === 'perumahan' ? 'fa-solid fa-building-shield' : 'fa-solid fa-tower-cell'}"></i>
                            ${report.source === 'perumahan' ? 'Perumahan' : 'Public'}
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
                        <button
                            type="button"
                            class="btn-card-detail"
                            onclick="window.openDetailReportModal('${escapeHtml(report.id)}')"
                        >
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
       6. MODAL DETAIL & STATUS MANAGEMENT
    ========================================================= */
    function closeModal() {
        if (detailReportModal) {
            detailReportModal.style.display = "none";
        }
    }

    function getSelectedRadioStatus() {
        const checked = document.querySelector('input[name="radioStatus"]:checked');
        if (!checked) return STATUS.MENUNGGU;
        return normalizeStatus(checked.value);
    }

    function setModalStatusRadio(statusVal) {
        const normalized = normalizeStatus(statusVal);
        radioStatusCards.forEach(card => {
            const cardValue = card.getAttribute("data-val");
            const normalizedCardValue = normalizeStatus(cardValue);
            const radio = card.querySelector("input[type='radio']");

            if (normalizedCardValue === normalized) {
                if (radio) radio.checked = true;
                card.classList.add("active-selected");
                card.classList.add("active");
            } else {
                if (radio) radio.checked = false;
                card.classList.remove("active-selected");
                card.classList.remove("active");
            }
        });
    }

    // Modal close listeners
    if (btnCloseDetailModal) btnCloseDetailModal.addEventListener("click", closeModal);
    if (btnCancelDetailModal) btnCancelDetailModal.addEventListener("click", closeModal);
    if (detailReportModal) {
        detailReportModal.addEventListener("click", (e) => {
            if (e.target === detailReportModal) closeModal();
        });
    }

    // Radio button click styling
    radioStatusCards.forEach(card => {
        card.addEventListener("click", () => {
            radioStatusCards.forEach(c => {
                c.classList.remove("active-selected");
                c.classList.remove("active");
            });
            card.classList.add("active-selected");
            card.classList.add("active");
            const input = card.querySelector('input[name="radioStatus"]');
            if (input) input.checked = true;
        });
    });

    window.openDetailReportModal = function (reportId) {
        const report = allReports.find(r => r.id === reportId);
        if (!report || !detailReportModal || !modalDetailContent) return;

        if (modalReportId) modalReportId.value = report.id;
        if (modalReportSource) modalReportSource.value = report.source;
        if (modalReportPerumahanKey) modalReportPerumahanKey.value = report.perumahanKey || "";
        if (modalReportDbTable) modalReportDbTable.value = report.dbTable || "public_panics";
        if (officerResponseNote) officerResponseNote.value = report.officerNote || "";

        setModalStatusRadio(report.status);

        let mapLinkHtml = "-";
        if (report.locationUrl) {
            mapLinkHtml = `
                <a href="${escapeHtml(report.locationUrl)}" target="_blank" rel="noopener noreferrer" style="color:#2563eb; text-decoration:underline; font-weight:600;">
                    <i class="fa-solid fa-map-location-dot"></i> Buka Google Maps
                </a>
            `;
        } else if (report.latitude && report.longitude && Number(report.latitude) !== 0 && Number(report.longitude) !== 0) {
            mapLinkHtml = `
                <a href="https://www.google.com/maps?q=${report.latitude},${report.longitude}" target="_blank" rel="noopener noreferrer" style="color:#2563eb; text-decoration:underline; font-weight:600;">
                    <i class="fa-solid fa-map-location-dot"></i> Buka Google Maps (${report.latitude}, ${report.longitude})
                </a>
            `;
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
                <span class="detail-row-label"><i class="fa-solid fa-circle-info"></i> Status Saat Ini</span>
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
       7. FIREBASE STATUS UPDATE EXECUTION
    ========================================================= */
    async function executeStatusUpdate(reportId, source, perumahanKey, newStatus, dbTable = "monitor", note = "") {
        try {
            const normalizedStatus = normalizeStatus(newStatus);
            const statusLabel = getStatusLabel(normalizedStatus);

            const updatePayload = {
                status: normalizedStatus.toLowerCase(),
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

            if (source === "perumahan") {
                if (!perumahanKey) throw new Error("Perumahan Key tidak ditemukan.");
                const subNode = dbTable || "monitor";
                await update(ref(db1, `perumahan/${perumahanKey}/${subNode}/${reportId}`), updatePayload);
            } else {
                // Public DB2
                const tableTarget = dbTable || "public_panics";
                await update(ref(db2, `${tableTarget}/${reportId}`), updatePayload);
            }

            // Update local state
            const foundReport = allReports.find(r => r.id === reportId);
            if (foundReport) {
                foundReport.status = normalizedStatus;
                if (note) foundReport.officerNote = note;
            }

            scheduleBatchFilter();

            await Swal.fire({
                icon: "success",
                title: "Status Berhasil Diperbarui",
                text: `Laporan dipindahkan ke "${statusLabel}".`,
                timer: 1500,
                showConfirmButton: false
            });

            return true;
        } catch (error) {
            console.error("Error updating status:", error);
            await Swal.fire({
                icon: "error",
                title: "Gagal Memperbarui",
                text: "Terjadi kesalahan: " + error.message,
                confirmButtonColor: "#dc2626"
            });
            return false;
        }
    }

    // Save status change from modal
    if (btnSaveStatusChange) {
        btnSaveStatusChange.addEventListener("click", async () => {
            const reportId = modalReportId.value;
            const source = modalReportSource.value;
            const perumahanKey = modalReportPerumahanKey.value;
            const dbTable = modalReportDbTable ? modalReportDbTable.value : "public_panics";
            const newStatus = getSelectedRadioStatus();
            const noteText = (officerResponseNote ? officerResponseNote.value : "").trim();

            if (!reportId || !newStatus) {
                Swal.fire({
                    icon: "warning",
                    title: "Perhatian",
                    text: "Silakan pilih status terlebih dahulu."
                });
                return;
            }

            const originalText = btnSaveStatusChange.innerHTML;
            btnSaveStatusChange.disabled = true;
            btnSaveStatusChange.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;

            try {
                const success = await executeStatusUpdate(reportId, source, perumahanKey, newStatus, dbTable, noteText);
                if (success) {
                    closeModal();
                }
            } finally {
                btnSaveStatusChange.disabled = false;
                btnSaveStatusChange.innerHTML = originalText;
            }
        });
    }

    // Quick Action from Kanban card
    window.quickChangeStatus = async function (reportId, source, perumahanKey, targetStatus, dbTable) {
        const normalized = normalizeStatus(targetStatus);
        const confirmColor = normalized === STATUS.SELESAI ? "#10b981" : "#f59e0b";
        const result = await Swal.fire({
            title: `Ubah Status ke "${normalized}"?`,
            text: normalized === STATUS.SELESAI
                ? "Laporan ini akan ditandai telah tuntas ditangani oleh petugas."
                : "Laporan ini akan dialihkan ke status sedang ditangani petugas.",
            icon: normalized === STATUS.SELESAI ? "success" : "info",
            showCancelButton: true,
            confirmButtonColor: confirmColor,
            cancelButtonColor: "#64748b",
            confirmButtonText: `Ya, Jadikan ${normalized}`,
            cancelButtonText: "Batal",
            reverseButtons: true
        });

        if (result.isConfirmed) {
            await executeStatusUpdate(reportId, source, perumahanKey, normalized, dbTable);
        }
    };

    /* =========================================================
       8. FILTER EVENT LISTENERS
    ========================================================= */
    if (searchReportsInput) {
        searchReportsInput.addEventListener("input", filterAndRenderBoard);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener("change", filterAndRenderBoard);
    }
});