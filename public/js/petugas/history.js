/* =========================================================
   RIWAYAT LAPORAN PETUGAS - HIGH PERFORMANCE 3-AREA KANBAN
   Firebase Realtime Database (Targeted Queries & Limit Optimization)
========================================================= */

import { db1, db2 } from "../firebase-config.js";
import {
    ref,
    onValue,
    update,
    query,
    limitToLast
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
    // Containers
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

    // Close Modal Handlers
    if (btnCloseDetailModal) {
        btnCloseDetailModal.addEventListener("click", closeModal);
    }
    if (btnCancelDetailModal) {
        btnCancelDetailModal.addEventListener("click", closeModal);
    }
    if (detailReportModal) {
        detailReportModal.addEventListener("click", (e) => {
            if (e.target === detailReportModal) closeModal();
        });
    }

    function closeModal() {
        if (detailReportModal) detailReportModal.style.display = "none";
    }

    // Radio Status Card Selection
    radioStatusCards.forEach(card => {
        card.addEventListener("click", () => {
            const radio = card.querySelector("input[type='radio']");
            if (radio) radio.checked = true;
            radioStatusCards.forEach(c => c.classList.remove("active-selected"));
            card.classList.add("active-selected");
        });
    });

    function setModalStatusRadio(statusVal) {
        const normalized = normalizeStatus(statusVal);
        radioStatusCards.forEach(card => {
            const val = card.getAttribute("data-val");
            const radio = card.querySelector("input[type='radio']");
            if (val === normalized) {
                if (radio) radio.checked = true;
                card.classList.add("active-selected");
            } else {
                if (radio) radio.checked = false;
                card.classList.remove("active-selected");
            }
        });
    }

    function getSelectedRadioStatus() {
        const checked = document.querySelector("input[name='radioStatus']:checked");
        return checked ? checked.value : "Menunggu";
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

    /* =========================================================
       HELPER: TIMESTAMP & STATUS PARSER
    ========================================================= */
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

    function normalizeStatus(status) {
        if (!status) return "Menunggu";
        const s = String(status).toLowerCase().trim();
        if (s === "selesai" || s === "completed" || s === "done" || s === "tuntas") return "Selesai";
        if (s === "diproses" || s === "proses" || s === "process" || s === "handling") return "Diproses";
        return "Menunggu";
    }

    function scheduleBatchFilter() {
        if (batchFilterTimer) clearTimeout(batchFilterTimer);
        batchFilterTimer = setTimeout(() => {
            mergeAndRenderReports();
        }, 50);
    }

    /* =========================================================
       1. OPTIMIZED REALTIME FIREBASE LISTENERS (DB1 & DB2)
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

            return {
                id: rId,
                source: "public",
                dbTable: "public_panics",
                perumahanKey: "",
                perumahanName: "Area Publik",
                userName: rVal.senderName || rVal.name || rVal.user_name || "Warga Publik",
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
                locationUrl: rVal.locationUrl || null
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

            return {
                id: rId,
                source: "public",
                dbTable: "reports",
                perumahanKey: "",
                perumahanName: "Area Publik",
                userName: rVal.user_name || rVal.name || "Pengguna Publik",
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
                locationUrl: rVal.locationUrl || null
            };
        });

        scheduleBatchFilter();
    }, (err) => {
        console.error("DB2 load reports error:", err);
    });

    /* =========================================================
       2. GABUNGKAN DATA & FILTER KANBAN BOARD
    ========================================================= */

    function mergeAndRenderReports() {
        const flattenedHousing = [];
        housingReportsMap.forEach(reports => flattenedHousing.push(...reports));

        allReports = [...flattenedHousing, ...rawPublicPanics, ...rawPublicReports];

        // Sort desc berdasarkan waktu (terbaru di atas)
        allReports.sort((a, b) => b.time - a.time);

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
                if (!matchUser && !matchLoc && !matchNote && !matchPName) {
                    return;
                }
            }

            // Pisahkan ke 3 area
            if (report.status === "Menunggu") {
                waitingList.push(report);
            } else if (report.status === "Diproses") {
                processList.push(report);
            } else if (report.status === "Selesai") {
                doneList.push(report);
            }
        });

        // Update Counter Badges
        if (countWaiting) countWaiting.textContent = waitingList.length;
        if (countProcess) countProcess.textContent = processList.length;
        if (countDone) countDone.textContent = doneList.length;

        // Render Area 1: Menunggu
        renderColumn(waitingCardsContainer, waitingList, "Menunggu");

        // Render Area 2: Diproses
        renderColumn(processCardsContainer, processList, "Diproses");

        // Render Area 3: Selesai
        renderColumn(doneCardsContainer, doneList, "Selesai");

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
            if (columnStatus === "Menunggu") {
                emptyMsg = "Tidak ada laporan yang menunggu respon.";
                iconClass = "fa-hourglass";
            } else if (columnStatus === "Diproses") {
                emptyMsg = "Tidak ada laporan yang sedang diproses.";
                iconClass = "fa-person-circle-check";
            } else if (columnStatus === "Selesai") {
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
            const isUrgent = columnStatus === "Menunggu";

            // Tombol Aksi Cepat
            let advanceButtonHtml = "";
            if (columnStatus === "Menunggu") {
                advanceButtonHtml = `
                    <button type="button" class="btn-card-advance btn-advance-process" onclick="window.quickChangeStatus('${escapeHtml(report.id)}', '${escapeHtml(report.source)}', '${escapeHtml(report.perumahanKey || '')}', 'Diproses', '${escapeHtml(report.dbTable || '')}')">
                        <i class="fa-solid fa-person-running"></i>
                        <span>Proses Sekarang</span>
                    </button>
                `;
            } else if (columnStatus === "Diproses") {
                advanceButtonHtml = `
                    <button type="button" class="btn-card-advance btn-advance-done" onclick="window.quickChangeStatus('${escapeHtml(report.id)}', '${escapeHtml(report.source)}', '${escapeHtml(report.perumahanKey || '')}', 'Selesai', '${escapeHtml(report.dbTable || '')}')">
                        <i class="fa-solid fa-check-double"></i>
                        <span>Selesaikan</span>
                    </button>
                `;
            }

            return `
                <div class="report-card-item ${isUrgent ? 'is-urgent' : ''}" id="report_card_${escapeHtml(report.id)}">
                    <div class="report-card-header">
                        <span class="category-tag ${report.source === 'perumahan' ? 'perumahan' : 'public'}">
                            <i class="${report.source === 'perumahan' ? 'fa-solid fa-building-shield' : 'fa-solid fa-tower-cell'}"></i>
                            ${report.source === 'perumahan' ? 'Perumahan' : 'Public'}
                        </span>
                        <span class="report-card-time">
                            <i class="fa-regular fa-clock"></i> ${formattedTime}
                        </span>
                    </div>

                    <div class="report-card-body">
                        <strong class="report-user-name">
                            <i class="fa-regular fa-user"></i> ${escapeHtml(report.userName)}
                        </strong>
                        <span class="report-location-info">
                            <i class="fa-solid fa-location-dot"></i> ${escapeHtml(report.location)}
                        </span>
                        ${report.note && report.note !== '-' ? `
                            <div class="report-note-box">
                                <i class="fa-regular fa-comment-dots"></i> ${escapeHtml(report.note)}
                            </div>
                        ` : ''}
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

    function formatReportTime(time) {
        if (!time) return "-";
        const numeric = Number(time);
        const date = Number.isFinite(numeric) ? new Date(numeric) : new Date(time);
        if (isNaN(date.getTime())) return String(time);

        return date.toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    /* =========================================================
       3. DETAIL MODAL & UBAH STATUS
    ========================================================= */

    window.openDetailReportModal = function (reportId) {
        const report = allReports.find(r => r.id === reportId);
        if (!report || !detailReportModal || !modalDetailContent) return;

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

    // Simpan Perubahan Status dari Modal
    if (btnSaveStatusChange) {
        btnSaveStatusChange.addEventListener("click", async () => {
            const reportId = modalReportId.value;
            const source = modalReportSource.value;
            const perumahanKey = modalReportPerumahanKey.value;
            const dbTable = modalReportDbTable ? modalReportDbTable.value : "monitor";
            const newStatus = getSelectedRadioStatus();
            const noteText = (officerResponseNote ? officerResponseNote.value : "").trim();

            await executeStatusUpdate(reportId, source, perumahanKey, newStatus, dbTable, noteText);
            closeModal();
        });
    }

    // Quick Action Langsung dari Kartu
    window.quickChangeStatus = async function (reportId, source, perumahanKey, targetStatus, dbTable) {
        const confirmColor = targetStatus === "Selesai" ? "#10b981" : "#f59e0b";
        const result = await Swal.fire({
            title: `Ubah Status ke "${targetStatus}"?`,
            text: targetStatus === "Selesai" 
                ? "Laporan ini akan ditandai telah tuntas ditangani oleh petugas." 
                : "Laporan ini akan dialihkan ke status sedang ditangani petugas.",
            icon: targetStatus === "Selesai" ? "success" : "info",
            showCancelButton: true,
            confirmButtonColor: confirmColor,
            cancelButtonColor: "#64748b",
            confirmButtonText: `Ya, Jadikan ${targetStatus}`,
            cancelButtonText: "Batal",
            reverseButtons: true
        });

        if (result.isConfirmed) {
            await executeStatusUpdate(reportId, source, perumahanKey, targetStatus, dbTable);
        }
    };

    // Eksekusi Update ke Firebase DB1 / DB2
    async function executeStatusUpdate(reportId, source, perumahanKey, newStatus, dbTable = "monitor", note = "") {
        try {
            const updatePayload = {
                status: newStatus,
                updated_at: Date.now()
            };
            if (note) {
                updatePayload.officer_note = note;
                updatePayload.response_note = note;
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

            // Update state lokal untuk transisi mulus
            const foundReport = allReports.find(r => r.id === reportId);
            if (foundReport) {
                foundReport.status = newStatus;
                if (note) foundReport.officerNote = note;
            }

            scheduleBatchFilter();

            Swal.fire({
                icon: "success",
                title: "Status Berhasil Diperbarui",
                text: `Laporan berhasil dipindahkan ke area "${newStatus}".`,
                timer: 1800,
                showConfirmButton: false
            });

        } catch (err) {
            console.error("Gagal update status laporan:", err);
            Swal.fire({
                icon: "error",
                title: "Gagal Memperbarui",
                text: "Terjadi kesalahan: " + err.message,
                confirmButtonColor: "#dc2626"
            });
        }
    }

    /* =========================================================
       4. EVENT LISTENERS FILTER
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
            btnRefreshHistory.querySelector("i").classList.add("fa-spin");
            setTimeout(() => {
                btnRefreshHistory.querySelector("i").classList.remove("fa-spin");
                scheduleBatchFilter();
            }, 500);
        });
    }

    function escapeHtml(text) {
        if (!text) return "";
        return String(text).replace(/[&<>"']/g, (m) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[m]);
    }
});
